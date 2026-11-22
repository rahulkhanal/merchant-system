import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class OwnerInfoDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() ssn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taxId?: string;
}

export class UpdateApplicationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() legalBusinessName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() businessType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mcc?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) monthlyVolume?: number;

  @ApiPropertyOptional({ type: OwnerInfoDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OwnerInfoDto)
  ownerInfo?: OwnerInfoDto;

  @ApiPropertyOptional() @IsOptional() @IsString() bankAccountNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() routingNumber?: string;
}
