import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../domain/role.enum.js';

export interface JwtRefreshPayload {
  sub: string;
  role: Role;
  type: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env['JWT_REFRESH_SECRET'] ?? 'refresh-change-me-in-production',
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtRefreshPayload): JwtRefreshPayload {
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    return payload;
  }
}
