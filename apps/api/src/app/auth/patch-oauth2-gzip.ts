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
 * tries gunzip → inflate → brotli decompression sequentially, falling back to
 * raw UTF-8 if none succeed.  This brute-force approach is reliable because:
 *   - Token exchange happens once per login, so ~1ms overhead is negligible
 *   - zlib.gunzip fails fast on non-gzip data (checks magic bytes internally)
 *   - We avoid depending on Content-Encoding headers (Railway strips them)
 *   - We avoid depending on our own magic-byte detection (can be unreliable)
 *
 * Previous versions had a race condition: the `close` event handler fired
 * while async decompression was still pending, sending back raw compressed
 * data.  The `close` handler has been removed entirely (matches the original
 * oauth2.js behaviour).
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

    /**
     * Try gunzip → inflate → brotli → raw.
     * Each decompressor fails fast on wrong format so the total overhead for
     * already-uncompressed data is negligible.
     */
    function decompressAndReturn(response: any, raw: Buffer) {
      // Fast path: if data already looks like JSON, skip decompression
      if (
        raw.length > 0 &&
        (raw[0] === 0x7b || // '{'
          raw[0] === 0x5b || // '['
          raw[0] === 0x22)   // '"'
      ) {
        passBackControl(response, raw.toString('utf8'));
        return;
      }

      zlib.gunzip(raw, function (errGz: Error | null, decoded: Buffer) {
        if (!errGz) {
          passBackControl(response, decoded.toString('utf8'));
          return;
        }
        zlib.inflate(raw, function (errDf: Error | null, decoded2: Buffer) {
          if (!errDf) {
            passBackControl(response, decoded2.toString('utf8'));
            return;
          }
          zlib.brotliDecompress(
            raw,
            function (errBr: Error | null, decoded3: Buffer) {
              if (!errBr) {
                passBackControl(response, decoded3.toString('utf8'));
                return;
              }
              // Nothing worked — return raw bytes as UTF-8
              passBackControl(response, raw.toString('utf8'));
            }
          );
        });
      });
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
        decompressAndReturn(response, Buffer.concat(chunks));
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
