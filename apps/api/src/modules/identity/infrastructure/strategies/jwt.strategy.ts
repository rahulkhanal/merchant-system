import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../domain/role.enum.js';

export interface JwtPayload {
  sub: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env['JWT_SECRET'] ?? 'change-me-in-production',
      ignoreExpiration: false,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return { sub: payload.sub, role: payload.role };
  }
}
