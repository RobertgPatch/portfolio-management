import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UploadK1Dto {
  @IsString()
  entityId: string;

  @IsOptional()
  @IsString()
  partnershipId?: string;

  @IsInt()
  @Min(1900)
  taxYear: number;
}
