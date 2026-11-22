import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../domain/role.enum.js';
import { TokenPair } from './login.use-case.js';

@Injectable()
export class RefreshUseCase {
  constructor(private readonly jwtService: JwtService) {}

  execute(sub: string, role: Role): TokenPair {
    const payload = { sub, role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(
        { ...payload, type: 'refresh' },
        {
          secret: process.env['JWT_REFRESH_SECRET'] ?? 'refresh-change-me-in-production',
          expiresIn: '7d',
        },
      ),
    };
  }
}
