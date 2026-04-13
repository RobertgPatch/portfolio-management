import { UserService } from '@ghostfolio/api/app/user/user.service';

import {
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Provider, Role } from '@prisma/client';

import { ValidateOAuthLoginParams } from './interfaces/interfaces';

@Injectable()
export class AuthService {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  public mapGroupsToRole(groups: string[]): Role {
    if (groups?.includes('ghostfolio-admin')) {
      return Role.ADMIN;
    }

    if (groups?.includes('ghostfolio-demo')) {
      return Role.DEMO;
    }

    return Role.USER;
  }

  public async validateOAuthLogin({
    provider,
    thirdPartyId,
    groups
  }: ValidateOAuthLoginParams): Promise<string> {
    try {
      let [user] = await this.userService.users({
        where: { provider, thirdPartyId }
      });

      const role = groups?.length ? this.mapGroupsToRole(groups) : Role.USER;

      if (!user) {
        // JIT provisioning: auto-create user on first OIDC login
        Logger.log(
          `Provisioning new OIDC user (thirdPartyId=${thirdPartyId.substring(0, 8)}…)`,
          'AuthService'
        );

        user = await this.userService.createUser({
          data: {
            provider: Provider.OIDC,
            thirdPartyId,
            role
          }
        });
      } else if (groups?.length) {
        // Update role from groups claim on each login
        await this.userService.updateUser({
          data: { role },
          where: { id: user.id }
        });
      }

      return this.jwtService.sign({
        id: user.id
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'validateOAuthLogin',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
