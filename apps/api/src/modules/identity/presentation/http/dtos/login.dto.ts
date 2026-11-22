import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'sales@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'supersecret123' })
  @IsString()
  @MinLength(8)
  password!: string;
}
