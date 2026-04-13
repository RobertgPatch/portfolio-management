import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Provider } from '@prisma/client';
import { Request } from 'express';
import { Strategy, type StrategyOptions } from 'passport-openidconnect';
import * as zlib from 'zlib';

import { AuthService } from './auth.service';
import {
  OidcContext,
  OidcIdToken,
  OidcParams,
  OidcProfile
} from './interfaces/interfaces';
import { OidcStateStore } from './oidc-state.store';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc') {
  private static readonly stateStore = new OidcStateStore();

  public constructor(
    private readonly authService: AuthService,
    options: StrategyOptions
  ) {
    super({
      ...options,
      passReqToCallback: true,
      store: OidcStrategy.stateStore
    });

    // Monkey-patch the oauth2 client to handle gzip/deflate/br responses.
    // Railway's reverse proxy compresses responses even when Accept-Encoding:
    // identity is sent, and the `oauth` library does not decompress them.
    this.patchOAuth2ExecuteRequest();
  }

  private patchOAuth2ExecuteRequest() {
    const oauth2 = (this as any)._oauth2;

    if (!oauth2) {
      return;
    }

    oauth2._executeRequest = function (
      httpLibrary: any,
      options: any,
      postBody: any,
      callback: any
    ) {
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

      if (oauth2._agent) {
        options.agent = oauth2._agent;
      }

      const request = httpLibrary.request(options);

      request.on('response', function (response: any) {
        const encoding = (
          response.headers['content-encoding'] || ''
        ).toLowerCase();

        let stream: NodeJS.ReadableStream = response;

        if (encoding === 'gzip') {
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

        stream.on('error', function (err: Error) {
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

      if (
        (options.method === 'POST' || options.method === 'PUT') &&
        postBody
      ) {
        request.write(postBody);
      }

      request.end();
    };
  }

  public async validate(
    _request: Request,
    issuer: string,
    profile: OidcProfile,
    context: OidcContext,
    idToken: OidcIdToken,
    _accessToken: string,
    _refreshToken: string,
    params: OidcParams
  ) {
    try {
      const thirdPartyId =
        profile?.id ??
        profile?.sub ??
        idToken?.sub ??
        params?.sub ??
        context?.claims?.sub;

      if (!thirdPartyId) {
        Logger.error(
          `Missing subject identifier in OIDC response from ${issuer}`,
          'OidcStrategy'
        );

        throw new Error('Missing subject identifier in OIDC response');
      }

      // Extract groups from OIDC claims (profile._json, idToken, or userinfo)
      const groups: string[] =
        (profile as any)?._json?.groups ??
        (idToken as any)?.groups ??
        [];

      const jwt = await this.authService.validateOAuthLogin({
        thirdPartyId,
        provider: Provider.OIDC,
        groups
      });

      return { jwt, idTokenRaw: params?.id_token };
    } catch (error) {
      Logger.error(error, 'OidcStrategy');
      throw error;
    }
  }
}
