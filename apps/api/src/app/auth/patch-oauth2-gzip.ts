/**
 * Patches the `oauth` library's OAuth2.prototype._executeRequest to handle
 * gzip/deflate/br compressed HTTP responses.
 *
 * Railway's reverse proxy compresses responses from upstream OIDC providers
 * even when `Accept-Encoding: identity` is sent, AND strips the
 * Content-Encoding header.  The `oauth` library concatenates response chunks
 * as strings, so compressed binary data causes `JSON.parse` to fail.
 *
 * This patch:
 *   1. Forces `Accept-Encoding: identity` on every outgoing request
 *   2. Collects response data as raw Buffers
 *   3. If the data looks like text (first char is JSON-like), returns as-is
 *   4. Otherwise tries zlib.unzip (auto gzip+zlib) → inflateRaw → brotli
 *   5. Falls back to raw UTF-8 if all decompression fails
 *   6. Logs diagnostics (first 20 hex bytes, Content-Encoding, result)
 *
 * There is NO `close` event handler — previous versions had a race condition
 * where `close` fired while async decompression was still pending.
 */
import { OAuth2 } from 'oauth';
import * as zlib from 'zlib';

let patched = false;

export function patchOAuth2GzipHandling(): void {
  if (patched) {
    return;
  }

  patched = true;

  const TAG = '[oauth2-gzip-patch]';

  (OAuth2.prototype as any)._executeRequest = function (
    httpLibrary: any,
    options: any,
    postBody: any,
    callback: any
  ) {
    const self = this;
    let callbackCalled = false;

    function passBackControl(response: any, result: string) {
      if (callbackCalled) {
        return;
      }
      callbackCalled = true;

      if (
        !(response.statusCode >= 200 && response.statusCode <= 299) &&
        response.statusCode !== 301 &&
        response.statusCode !== 302
      ) {
        callback({ statusCode: response.statusCode, data: result });
      } else {
        callback(null, result, response);
      }
    }

    // Force identity encoding on outgoing request so the upstream OIDC
    // provider does not compress.  Railway's edge proxy may still compress
    // the response on the return path — the decompression below handles that.
    if (!options.headers) {
      options.headers = {};
    }
    options.headers['Accept-Encoding'] = 'identity';

    if (self._agent) {
      options.agent = self._agent;
    }

    const request = httpLibrary.request(options);

    request.on('response', function (response: any) {
      const chunks: Buffer[] = [];

      // Always collect raw binary data — never concatenate as strings
      response.on('data', function (chunk: any) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
          return;
        }

        // Be binary-safe for rare cases where chunk is a string.
        // Using 'utf8' here corrupts compressed payload bytes.
        if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk, 'binary'));
          return;
        }

        chunks.push(Buffer.from(chunk));
      });

      response.on('end', function () {
        const raw = Buffer.concat(chunks);
        const ce = response.headers['content-encoding'] || '(none)';
        const hex = raw.subarray(0, 20).toString('hex');
        console.log(
          `${TAG} ${options.method} ${options.path || options.href || '?'} ` +
            `status=${response.statusCode} bytes=${raw.length} ` +
            `CE=${ce} hex=${hex}`
        );

        // Empty response
        if (raw.length === 0) {
          passBackControl(response, '');
          return;
        }

        // Fast path — if the first byte is a common JSON/text character,
        // the data is NOT compressed.
        const first = raw[0];
        if (
          first === 0x7b || // '{'
          first === 0x5b || // '['
          first === 0x22 || // '"'
          first === 0x3c || // '<'  (HTML error page)
          first === 0x30 || // '0'-'9' digits (rare but possible token responses)
          first === 0x31 ||
          first === 0x32 ||
          first === 0x33 ||
          first === 0x34 ||
          first === 0x35 ||
          first === 0x36 ||
          first === 0x37 ||
          first === 0x38 ||
          first === 0x39 ||
          first === 0x74 || // 't' (true)
          first === 0x66 || // 'f' (false)
          first === 0x6e    // 'n' (null)
        ) {
          console.log(`${TAG} First byte 0x${first.toString(16)} looks like text, skipping decompression`);
          passBackControl(response, raw.toString('utf8'));
          return;
        }

        // The data is likely compressed. Try decompression cascade, then
        // recurse once in case of double compression at edge proxies.
        console.log(`${TAG} First byte 0x${first.toString(16)}, trying decompression cascade...`);

        const tryDecompress = (input: Buffer, depth: number) => {
          zlib.unzip(input, function (err1: Error | null, dec1: Buffer) {
            if (!err1) {
              console.log(`${TAG} zlib.unzip succeeded (${dec1.length} bytes)`);

              const firstOut = dec1.length > 0 ? dec1[0] : 0;
              const isTextOut =
                firstOut === 0x7b ||
                firstOut === 0x5b ||
                firstOut === 0x22 ||
                firstOut === 0x3c ||
                firstOut === 0x30 ||
                firstOut === 0x31 ||
                firstOut === 0x32 ||
                firstOut === 0x33 ||
                firstOut === 0x34 ||
                firstOut === 0x35 ||
                firstOut === 0x36 ||
                firstOut === 0x37 ||
                firstOut === 0x38 ||
                firstOut === 0x39 ||
                firstOut === 0x74 ||
                firstOut === 0x66 ||
                firstOut === 0x6e;

              if (isTextOut || depth >= 1) {
                passBackControl(response, dec1.toString('utf8'));
                return;
              }

              tryDecompress(dec1, depth + 1);
              return;
            }

            console.log(`${TAG} zlib.unzip failed: ${(err1 as any).code || err1.message}`);

            zlib.inflateRaw(input, function (err2: Error | null, dec2: Buffer) {
              if (!err2) {
                console.log(`${TAG} zlib.inflateRaw succeeded (${dec2.length} bytes)`);
                passBackControl(response, dec2.toString('utf8'));
                return;
              }

              console.log(`${TAG} zlib.inflateRaw failed: ${(err2 as any).code || err2.message}`);

              zlib.brotliDecompress(
                input,
                function (err3: Error | null, dec3: Buffer) {
                  if (!err3) {
                    console.log(`${TAG} zlib.brotliDecompress succeeded (${dec3.length} bytes)`);
                    passBackControl(response, dec3.toString('utf8'));
                    return;
                  }

                  console.log(
                    `${TAG} zlib.brotliDecompress failed: ${(err3 as any).code || err3.message}`
                  );
                  console.log(`${TAG} All decompression failed — returning raw UTF-8`);
                  passBackControl(response, input.toString('utf8'));
                }
              );
            });
          });
        };

        tryDecompress(raw, 0);
      });

      // NOTE: no 'close' handler — the previous version had a race condition
      // where `close` fired while async decompression from `end` was still
      // pending, causing it to send back raw compressed data.

      response.on('error', function (err: Error) {
        if (!callbackCalled) {
          callbackCalled = true;
          callback(err);
        }
      });
    });

    request.on('error', function (err: Error) {
      if (!callbackCalled) {
        callbackCalled = true;
        callback(err);
      }
    });

    if ((options.method === 'POST' || options.method === 'PUT') && postBody) {
      request.write(postBody);
    }

    request.end();
  };
}
