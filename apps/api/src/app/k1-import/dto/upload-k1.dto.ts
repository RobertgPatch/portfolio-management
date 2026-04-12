import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UploadK1Dto {
  @IsOptional()
  @IsString()
  partnershipId?: string;

  @IsInt()
  @Min(1900)
  taxYear: number;
}
