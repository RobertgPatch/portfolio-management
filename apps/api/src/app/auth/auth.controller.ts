import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import { DEFAULT_LANGUAGE_CODE } from '@ghostfolio/common/config';

import {
  Controller,
  Get,
  Logger,
  Req,
  Res,
  UseGuards,
  Version,
  VERSION_NEUTRAL
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  public constructor(
    private readonly configurationService: ConfigurationService,
    private readonly jwtService: JwtService
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
  public oidcLoginCallback(@Req() request: Request, @Res() response: Response) {
    const jwt: string = (request.user as any).jwt;
    const idTokenRaw: string | undefined = (request.user as any).idTokenRaw;

    // Store the raw OIDC id_token so the logout endpoint can pass it as
    // id_token_hint — required by Authentik to honour post_logout_redirect_uri
    if (idTokenRaw) {
      response.cookie('id_token_hint', idTokenRaw, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false // dev: plain HTTP; override in production
      });
    }

    if (jwt) {
      // Include locale prefix so Angular's <base href="/en/"> matches the URL.
      // Without the prefix, Angular may fail to bootstrap or route correctly.
      const redirectUrl = `${this.configurationService.get('ROOT_URL')}/${DEFAULT_LANGUAGE_CODE}/auth/${jwt}`;
      Logger.log(
        `OIDC callback: redirecting to ${redirectUrl.substring(0, 80)}... (jwt length=${jwt.length})`,
        'AuthController'
      );
      response.redirect(redirectUrl);
    } else {
      response.redirect(
        `${this.configurationService.get('ROOT_URL')}/${DEFAULT_LANGUAGE_CODE}/auth`
      );
    }
  }

  @Get('jwt-test')
  @Version(VERSION_NEUTRAL)
  public jwtTest() {
    // Diagnostic endpoint: sign a test JWT and verify it to confirm
    // the signing/verification chain works on this deployment.
    try {
      const signSecret = process.env.JWT_SECRET_KEY;
      const verifySecret = this.configurationService.get('JWT_SECRET_KEY');
      const secretsMatch = signSecret === verifySecret;

      const token = this.jwtService.sign({ test: true, ts: Date.now() });
      const decoded = this.jwtService.verify(token);

      return {
        success: true,
        secretsMatch,
        signSecretLength: signSecret?.length ?? 0,
        verifySecretLength: verifySecret?.length ?? 0,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 30),
        decoded: { test: decoded.test, iat: decoded.iat, exp: decoded.exp }
      };
    } catch (error) {
      return {
        success: false,
        error: error?.message || String(error)
      };
    }
  }

  @Get('logout')
  @Version(VERSION_NEUTRAL)
  public async logout(@Res() response: Response) {
    const issuer = this.configurationService.get('OIDC_ISSUER');
    const rootUrl = this.configurationService.get('ROOT_URL');
    const apiToken = this.configurationService.get('AUTHENTIK_API_TOKEN');
    const postLogoutRedirectUri = `${rootUrl}/${DEFAULT_LANGUAGE_CODE}/start`;

    // Clear the id_token cookie
    response.clearCookie('id_token_hint');

    // Destroy all Authentik sessions for every user via the admin API.
    // This is a server-to-server call so the browser never visits an
    // Authentik page, avoiding the "My Applications" library screen.
    if (apiToken) {
      try {
        const authentikBase = new URL(issuer).origin;

        // List active sessions
        const sessionsResp = await fetch(
          `${authentikBase}/api/v3/core/authenticated_sessions/`,
          { headers: { Authorization: `Bearer ${apiToken}` } }
        );

        if (sessionsResp.ok) {
          const sessions = (await sessionsResp.json()) as {
            results: Array<{ uuid: string }>;
          };

          // Delete each session
          await Promise.all(
            sessions.results.map((s) =>
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
        // out of Ghostfolio; they will simply auto-login on the next
        // Sign In click.
      }
    }

    response.redirect(postLogoutRedirectUri);
  }
}
