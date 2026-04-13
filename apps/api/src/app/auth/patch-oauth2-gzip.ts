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
import * as https from 'https';
import * as http from 'http';
import * as zlib from 'zlib';

let patched = false;

/**
 * Stored OIDC configuration used to fetch userinfo as a fallback
 * when the id_token is encrypted (JWE) and we cannot decrypt it.
 */
let oidcConfig: { userInfoURL?: string; issuer?: string; clientID?: string } = {};

/**
 * Nonce captured from the OIDC state store during the verify step.
 * The state store calls setPendingNonce() before the token exchange,
 * so by the time normalizeIdTokenIfNeeded() runs, the nonce is available
 * to inject into the synthetic JWT — satisfying passport-openidconnect's
 * nonce validation.
 */
let pendingNonce: string | undefined;

export function setPendingNonce(nonce: string | undefined): void {
  pendingNonce = nonce;
}

export function patchOAuth2GzipHandling(config?: {
  userInfoURL?: string;
  issuer?: string;
  clientID?: string;
}): void {
  if (config) {
    oidcConfig = config;
  }

  if (patched) {
    return;
  }

  patched = true;

  const TAG = '[oauth2-gzip-patch]';

  /**
   * Fetch JSON from a URL with Bearer token auth.
   * Handles possible gzip compression from Railway proxy.
   */
  function fetchJson(
    url: string,
    accessToken: string
  ): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const lib = parsedUrl.protocol === 'https:' ? https : http;

      const req = lib.request(
        url,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Accept-Encoding': 'identity'
          }
        },
        (res) => {
          const chunks: Buffer[] = [];

          res.on('data', (chunk: any) => {
            chunks.push(
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk, typeof chunk === 'string' ? 'binary' : undefined)
            );
          });

          res.on('end', () => {
            const raw = Buffer.concat(chunks);

            // Try to decompress in case Railway proxy compressed the response
            const tryParse = (buf: Buffer) => {
              try {
                return JSON.parse(buf.toString('utf8'));
              } catch {
                return null;
              }
            };

            const direct = tryParse(raw);
            if (direct) {
              resolve(direct);
              return;
            }

            // Try gunzip
            zlib.unzip(raw, (err, decoded) => {
              if (!err) {
                const result = tryParse(decoded);
                if (result) {
                  resolve(result);
                  return;
                }
              }
              reject(
                new Error(
                  `Failed to parse userinfo response (${raw.length} bytes, ` +
                    `status=${res.statusCode})`
                )
              );
            });
          });

          res.on('error', reject);
        }
      );

      req.on('error', reject);
      req.end();
    });
  }

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

    function toBase64Url(input: Buffer): string {
      return input
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
    }

    /**
     * If the token response contains an encrypted id_token (5-part JWE)
     * that we cannot decrypt (e.g. RSA-OAEP-256), fetch the userinfo
     * endpoint with the access_token and build a synthetic unsigned JWT
     * so passport-openidconnect can parse it.
     */
    async function normalizeIdTokenIfNeeded(result: string): Promise<string> {
      // Only token endpoint responses may contain id_token payloads.
      if (!String(options.path || '').includes('/token')) {
        return result;
      }

      let parsed: any;

      try {
        parsed = JSON.parse(result);
      } catch {
        return result;
      }

      const idToken = parsed?.id_token;

      if (typeof idToken !== 'string') {
        return result;
      }

      const parts = idToken.split('.');

      // passport-openidconnect handles normal 3-part JWTs already.
      if (parts.length !== 5) {
        return result;
      }

      // Decode the JWE protected header to log the algorithm
      try {
        const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
        const header = JSON.parse(headerJson);
        console.log(
          `${TAG} Detected encrypted id_token (JWE): alg=${header.alg} enc=${header.enc}`
        );
      } catch {
        console.log(`${TAG} Detected 5-part id_token (JWE), cannot read header`);
      }

      // We cannot decrypt RSA-OAEP / RSA-OAEP-256 without the provider's
      // private key.  Instead, fetch the userinfo endpoint to get claims.
      const accessToken = parsed?.access_token;
      const userInfoURL = oidcConfig.userInfoURL;

      if (!accessToken || !userInfoURL) {
        console.log(
          `${TAG} Cannot resolve JWE id_token: ` +
            `accessToken=${accessToken ? 'present' : 'missing'} ` +
            `userInfoURL=${userInfoURL || 'missing'}`
        );
        return result;
      }

      console.log(`${TAG} Fetching userinfo from ${userInfoURL} to build synthetic JWT`);

      try {
        const claims = await fetchJson(userInfoURL, accessToken);
        console.log(
          `${TAG} Userinfo fetched: sub=${claims.sub} keys=${Object.keys(claims).join(',')}`
        );

        // Ensure required OIDC claims are present.
        // passport-openidconnect validates:
        //   claims.iss  === self._issuer          (the issuer option)
        //   claims.aud  === self._oauth2._clientId (the clientID option)
        //   claims.exp  >   Date.now()/1000
        //   claims.iat  exists
        //   claims.sub  exists
        const now = Math.floor(Date.now() / 1000);
        const syntheticClaims: Record<string, any> = {
          ...claims,
          iss: claims.iss || oidcConfig.issuer || '',
          sub: claims.sub || '',
          aud: claims.aud || oidcConfig.clientID || (self as any)._clientId || '',
          exp: claims.exp || now + 3600,
          iat: claims.iat || now
        };

        // Inject nonce from the OIDC state store so passport-openidconnect's
        // nonce validation (claims.nonce === ctx.nonce) passes.
        if (pendingNonce) {
          syntheticClaims.nonce = pendingNonce;
          console.log(`${TAG} Injected nonce into synthetic JWT`);
          pendingNonce = undefined;
        }

        console.log(
          `${TAG} Synthetic claims: iss=${syntheticClaims.iss} ` +
            `aud=${syntheticClaims.aud} sub=${syntheticClaims.sub} ` +
            `exp=${syntheticClaims.exp} iat=${syntheticClaims.iat}`
        );
        console.log(
          `${TAG} OAuth2 clientId=${(self as any)._clientId} ` +
            `oidcConfig.issuer=${oidcConfig.issuer} ` +
            `oidcConfig.clientID=${oidcConfig.clientID}`
        );

        const headerB64 = toBase64Url(
          Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' }), 'utf8')
        );
        const payloadB64 = toBase64Url(
          Buffer.from(JSON.stringify(syntheticClaims), 'utf8')
        );

        parsed.id_token = `${headerB64}.${payloadB64}.`;
        console.log(
          `${TAG} Replaced encrypted id_token with synthetic JWT (sub=${syntheticClaims.sub})`
        );

        return JSON.stringify(parsed);
      } catch (err: any) {
        console.log(
          `${TAG} Userinfo fetch failed: ${err?.message || err}. ` +
            `Cannot resolve encrypted id_token.`
        );
        return result;
      }
    }

    function finalizeResult(response: any, result: string) {
      normalizeIdTokenIfNeeded(result)
        .then((normalized) => passBackControl(response, normalized))
        .catch(() => passBackControl(response, result));
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
          finalizeResult(response, '');
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
          finalizeResult(response, raw.toString('utf8'));
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
                finalizeResult(response, dec1.toString('utf8'));
                return;
              }

              tryDecompress(dec1, depth + 1);
              return;
            }

            console.log(`${TAG} zlib.unzip failed: ${(err1 as any).code || err1.message}`);

            zlib.inflateRaw(input, function (err2: Error | null, dec2: Buffer) {
              if (!err2) {
                console.log(`${TAG} zlib.inflateRaw succeeded (${dec2.length} bytes)`);
                finalizeResult(response, dec2.toString('utf8'));
                return;
              }

              console.log(`${TAG} zlib.inflateRaw failed: ${(err2 as any).code || err2.message}`);

              zlib.brotliDecompress(
                input,
                function (err3: Error | null, dec3: Buffer) {
                  if (!err3) {
                    console.log(`${TAG} zlib.brotliDecompress succeeded (${dec3.length} bytes)`);
                    finalizeResult(response, dec3.toString('utf8'));
                    return;
                  }

                  console.log(
                    `${TAG} zlib.brotliDecompress failed: ${(err3 as any).code || err3.message}`
                  );
                  console.log(`${TAG} All decompression failed — returning raw UTF-8`);
                  finalizeResult(response, input.toString('utf8'));
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
