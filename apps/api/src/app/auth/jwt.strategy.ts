import { UserService } from '@ghostfolio/api/app/user/user.service';
import { ConfigurationService } from '@ghostfolio/api/services/configuration/configuration.service';
import { PrismaService } from '@ghostfolio/api/services/prisma/prisma.service';
import {
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE_CODE,
  HEADER_KEY_TIMEZONE
} from '@ghostfolio/common/config';
import { hasRole } from '@ghostfolio/common/permissions';

import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import * as countriesAndTimezones from 'countries-and-timezones';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  public constructor(
    private readonly configurationService: ConfigurationService,
    private readonly prismaService: PrismaService,
    private readonly userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true,
      secretOrKey: configurationService.get('JWT_SECRET_KEY')
    });

    Logger.log(
      `JwtStrategy initialized with secretOrKey length=${String(configurationService.get('JWT_SECRET_KEY') || '').length}`,
      'JwtStrategy'
    );
  }

  public async validate(request: Request, { id }: { id: string }) {
    Logger.log(`validate() called with id=${id}`, 'JwtStrategy');

    if (!id) {
      Logger.error(
        `JWT payload missing 'id' field — token may be malformed`,
        undefined,
        'JwtStrategy'
      );
      throw new HttpException(
        getReasonPhrase(StatusCodes.UNAUTHORIZED),
        StatusCodes.UNAUTHORIZED
      );
    }

    try {
      const timezone = request.headers[HEADER_KEY_TIMEZONE.toLowerCase()];
      const user = await this.userService.user({ id });

      if (user) {
        if (this.configurationService.get('ENABLE_FEATURE_SUBSCRIPTION')) {
          if (hasRole(user, 'INACTIVE')) {
            throw new HttpException(
              getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
              StatusCodes.TOO_MANY_REQUESTS
            );
          }

          const country =
            countriesAndTimezones.getCountryForTimezone(timezone)?.id;

          await this.prismaService.analytics.upsert({
            create: { country, user: { connect: { id: user.id } } },
            update: {
              country,
              activityCount: { increment: 1 },
              lastRequestAt: new Date()
            },
            where: { userId: user.id }
          });
        }

        if (!user.settings.settings.baseCurrency) {
          user.settings.settings.baseCurrency = DEFAULT_CURRENCY;
        }

        if (!user.settings.settings.language) {
          user.settings.settings.language = DEFAULT_LANGUAGE_CODE;
        }

        return user;
      } else {
        Logger.warn(
          `User not found in database for id=${id}`,
          'JwtStrategy'
        );
        throw new HttpException(
          getReasonPhrase(StatusCodes.NOT_FOUND),
          StatusCodes.NOT_FOUND
        );
      }
    } catch (error) {
      Logger.error(
        `validate() error for id=${id}: ${error?.message || error}`,
        error?.stack,
        'JwtStrategy'
      );
      if (error?.getStatus?.() === StatusCodes.TOO_MANY_REQUESTS) {
        throw error;
      } else {
        throw new HttpException(
          getReasonPhrase(StatusCodes.UNAUTHORIZED),
          StatusCodes.UNAUTHORIZED
        );
      }
    }
  }
}
