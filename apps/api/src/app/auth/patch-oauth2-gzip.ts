/**
 * Patches the `oauth` library's OAuth2.prototype._executeRequest to handle
 * gzip/deflate/br compressed HTTP responses.
 *
 * Railway's reverse proxy (and similar edge proxies) may compress responses
 * from upstream OIDC providers even when `Accept-Encoding: identity` is sent.
 * The `oauth` library concatenates response chunks as strings without checking
 * `Content-Encoding`, causing `JSON.parse` to fail on binary compressed data.
 *
 * This patch collects response data as raw Buffers instead of strings, then
 * auto-detects compression by checking magic bytes (gzip: 0x1f 0x8b) since
 * some proxies strip the Content-Encoding header while still compressing.
 */
import { OAuth2 } from 'oauth';
import * as zlib from 'zlib';

let patched = false;

export function patchOAuth2GzipHandling(): void {
  if (patched) {
    return;
  }

  patched = true;

  (OAuth2.prototype as any)._executeRequest = function (
    httpLibrary: any,
    options: any,
    postBody: any,
    callback: any
  ) {
    const self = this;
    let callbackCalled = false;

    function passBackControl(response: any, result: string) {
      if (!callbackCalled) {
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
    }

    if (self._agent) {
      options.agent = self._agent;
    }

    const request = httpLibrary.request(options);

    request.on('response', function (response: any) {
      const chunks: Buffer[] = [];

      // Always collect raw binary data — never concatenate as strings
      response.on('data', function (chunk: any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      response.on('end', function () {
        const raw = Buffer.concat(chunks);

        // Auto-detect compression by magic bytes, since proxies may strip
        // the Content-Encoding header while still compressing the body
        const encoding = (
          response.headers['content-encoding'] || ''
        ).toLowerCase();

        const isGzip =
          encoding === 'gzip' ||
          encoding === 'x-gzip' ||
          (raw.length >= 2 && raw[0] === 0x1f && raw[1] === 0x8b);

        const isDeflate =
          encoding === 'deflate' ||
          (raw.length >= 2 &&
            (raw[0] & 0x0f) === 0x08 &&
            !isGzip);

        const isBrotli = encoding === 'br';

        if (isGzip) {
          zlib.gunzip(raw, function (err: Error | null, decoded: Buffer) {
            if (err) {
              // Decompression failed — return raw data as-is
              passBackControl(response, raw.toString('utf8'));
            } else {
              passBackControl(response, decoded.toString('utf8'));
            }
          });
        } else if (isDeflate) {
          zlib.inflate(raw, function (err: Error | null, decoded: Buffer) {
            if (err) {
              passBackControl(response, raw.toString('utf8'));
            } else {
              passBackControl(response, decoded.toString('utf8'));
            }
          });
        } else if (isBrotli) {
          zlib.brotliDecompress(
            raw,
            function (err: Error | null, decoded: Buffer) {
              if (err) {
                passBackControl(response, raw.toString('utf8'));
              } else {
                passBackControl(response, decoded.toString('utf8'));
              }
            }
          );
        } else {
          passBackControl(response, raw.toString('utf8'));
        }
      });

      response.on('close', function () {
        // Handle early close for hosts that don't send content-length
        if (!callbackCalled) {
          const raw = Buffer.concat(chunks);
          passBackControl(response, raw.toString('utf8'));
        }
      });

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
