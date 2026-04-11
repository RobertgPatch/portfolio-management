import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import { DEFAULT_LANGUAGE_CODE } from '@ghostfolio/common/config';
import type { RequestWithUser } from '@ghostfolio/common/types';

import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  Version,
  VERSION_NEUTRAL
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  public constructor(
    private readonly configurationService: ConfigurationService
  ) {}

  @Get('oidc')
  @UseGuards(AuthGuard('oidc'))
  @Version(VERSION_NEUTRAL)
  public oidcLogin() {
    // OIDC is now the primary auth method — no feature flag guard
  }

  @Get('oidc/callback')
  @UseGuards(AuthGuard('oidc'))
  @Version(VERSION_NEUTRAL)
  public oidcLoginCallback(
    @Req() request: Request,
    @Res() response: Response
  ) {
    const jwt: string = (request.user as any).jwt;

    if (jwt) {
      response.redirect(
        `${this.configurationService.get(
          'ROOT_URL'
        )}/${DEFAULT_LANGUAGE_CODE}/auth/${jwt}`
      );
    } else {
      response.redirect(
        `${this.configurationService.get(
          'ROOT_URL'
        )}/${DEFAULT_LANGUAGE_CODE}/auth`
      );
    }
  }

  @Get('logout')
  @UseGuards(AuthGuard('jwt'))
  @Version(VERSION_NEUTRAL)
  public async logout(
    @Req() request: RequestWithUser,
    @Query('language') language: string,
    @Res() response: Response
  ) {
    const issuer = this.configurationService.get('OIDC_ISSUER');
    const rootUrl = this.configurationService.get('ROOT_URL');
    const apiToken = this.configurationService.get('AUTHENTIK_API_TOKEN');
    const languageCode = language || DEFAULT_LANGUAGE_CODE;
    const postLogoutRedirectUri = `${rootUrl}/${languageCode}/start`;

    // Revoke only the current user's Authentik sessions server-to-server,
    // so the browser never visits Authentik and sees "My Applications".
    if (apiToken) {
      const oidcSub = request.user?.thirdPartyId;

      if (oidcSub) {
        try {
          const authentikBase = new URL(issuer).origin;

          // Fetch all sessions and filter to those belonging to this user
          const sessionsResp = await fetch(
            `${authentikBase}/api/v3/core/authenticated_sessions/`,
            { headers: { Authorization: `Bearer ${apiToken}` } }
          );

          if (sessionsResp.ok) {
            const sessions = (await sessionsResp.json()) as {
              results: Array<{ uuid: string; user: { uid: string } }>;
            };

            const userSessions = sessions.results.filter(
              (s) => s.user?.uid === oidcSub
            );

            await Promise.all(
              userSessions.map((s) =>
                fetch(
                  `${authentikBase}/api/v3/core/authenticated_sessions/${s.uuid}/`,
                  {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${apiToken}` }
                  }
                )
              )
            );
          }
        } catch {
          // Best-effort: if the API call fails the user is still logged
          // out of Ghostfolio; they will simply need to re-authenticate on
          // the next Sign In click.
        }
      }
    }

    response.redirect(postLogoutRedirectUri);
  }
}
