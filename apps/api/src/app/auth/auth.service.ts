import { UserService } from '@ghostfolio/api/app/user/user.service';

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

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
      const [user] = await this.userService.users({
        where: { provider, thirdPartyId }
      });

      if (!user) {
        throw new ForbiddenException('User not provisioned');
      }

      // Update role from groups claim on each login
      if (groups?.length) {
        const role = this.mapGroupsToRole(groups);

        await this.userService.updateUser({
          data: { role },
          where: { id: user.id }
        });
      }

      return this.jwtService.sign({
        id: user.id
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'validateOAuthLogin',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
}
