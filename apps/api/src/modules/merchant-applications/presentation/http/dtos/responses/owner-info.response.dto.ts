import { ApiPropertyOptional } from '@nestjs/swagger';

export class OwnerInfoResponseDto {
  @ApiPropertyOptional() firstName?: string;
  @ApiPropertyOptional() lastName?: string;
  @ApiPropertyOptional({ description: 'Masked — last 4 digits only', example: '***-**-1234' }) ssn?: string;
  @ApiPropertyOptional() dateOfBirth?: string;
  @ApiPropertyOptional({ description: 'Masked' }) taxId?: string;
}
