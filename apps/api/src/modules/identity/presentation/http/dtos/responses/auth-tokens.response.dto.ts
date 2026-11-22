import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensResponseDto {
  @ApiProperty({ description: 'Short-lived JWT (15 min)', example: 'eyJ...' })
  accessToken!: string;

  @ApiProperty({ description: 'Long-lived JWT for refresh (7 days)', example: 'eyJ...' })
  refreshToken!: string;
}
