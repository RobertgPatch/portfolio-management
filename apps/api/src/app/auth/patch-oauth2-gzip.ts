/**
 * Patches the `oauth` library's OAuth2.prototype._executeRequest to handle
 * gzip/deflate/br compressed HTTP responses.
 *
 * Railway's reverse proxy (and similar edge proxies) may compress responses
 * from upstream OIDC providers even when `Accept-Encoding: identity` is sent.
 * The `oauth` library concatenates response chunks as strings without checking
 * `Content-Encoding`, causing `JSON.parse` to fail on binary compressed data.
 *
 * This patch replaces `_executeRequest` on the prototype so ALL OAuth2
 * instances automatically decompress responses before returning them.
 */
import { OAuth2 } from 'oauth';
import * as zlib from 'zlib';

let patched = false;

export function patchOAuth2GzipHandling(): void {
  if (patched) {
    return;
  }

  patched = true;

  const originalExecuteRequest = (OAuth2.prototype as any)._executeRequest;

  (OAuth2.prototype as any)._executeRequest = function (
    httpLibrary: any,
    options: any,
    postBody: any,
    callback: any
  ) {
    // Wrap the callback to intercept the raw response and decompress if needed
    const self = this;

    // We need to replace _executeRequest entirely because the original
    // concatenates binary chunks as strings, destroying gzip data.
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
      const encoding = (
        response.headers['content-encoding'] || ''
      ).toLowerCase();

      let stream: NodeJS.ReadableStream = response;

      if (encoding === 'gzip' || encoding === 'x-gzip') {
        stream = response.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = response.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = response.pipe(zlib.createBrotliDecompress());
      }

      const chunks: Buffer[] = [];

      stream.on('data', function (chunk: any) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });

      stream.on('end', function () {
        const result = Buffer.concat(chunks).toString('utf8');
        passBackControl(response, result);
      });

      // If the decompression stream or response closes prematurely, still forward
      stream.on('error', function (err: Error) {
        if (!callbackCalled) {
          callbackCalled = true;
          callback(err);
        }
      });

      response.on('close', function () {
        // Handle early close for hosts that don't send content-length
        if (!callbackCalled && stream === response) {
          const result = Buffer.concat(chunks).toString('utf8');
          passBackControl(response, result);
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
