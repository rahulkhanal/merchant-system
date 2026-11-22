import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../domain/user.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(private readonly jwtService: JwtService) {}

  execute(user: User): TokenPair {
    const payload = { sub: user.id, role: user.role };
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
