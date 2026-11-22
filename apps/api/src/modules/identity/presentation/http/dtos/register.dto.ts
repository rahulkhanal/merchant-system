import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../../domain/role.enum.js';

export class RegisterDto {
  @ApiProperty({ example: 'sales@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'supersecret123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: Role, example: Role.SALES })
  @IsEnum(Role)
  role!: Role;
}
