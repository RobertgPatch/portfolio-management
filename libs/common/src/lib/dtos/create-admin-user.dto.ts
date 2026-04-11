import { Role } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateAdminUserDto {
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsString()
  thirdPartyId: string;
}
