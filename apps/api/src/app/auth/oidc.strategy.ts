import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Provider } from '@prisma/client';
import { Request } from 'express';
import { Strategy, type StrategyOptions } from 'passport-openidconnect';

import { AuthService } from './auth.service';
import {
  OidcContext,
  OidcIdToken,
  OidcParams,
  OidcProfile
} from './interfaces/interfaces';
import { OidcStateStore } from './oidc-state.store';

@Injectable()
export class OidcStrategy extends PassportStrategy(Strategy, 'oidc', true) {
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
    Logger.log(
      `validate() called: issuer=${issuer} profile.id=${profile?.id} ` +
        `context=${typeof context} idToken=${typeof idToken === 'string' ? String(idToken).substring(0, 20) + '...' : typeof idToken} ` +
        `params=${typeof params}`,
      'OidcStrategy'
    );
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
