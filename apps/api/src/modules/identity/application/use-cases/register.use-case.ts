import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../domain/role.enum.js';
import { PasswordHasher } from '../ports/password-hasher.port.js';
import { UserRepository } from '../ports/user.repository.port.js';
import type { TokenPair } from './login.use-case.js';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async execute(email: string, password: string, role: Role): Promise<TokenPair> {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await this.hasher.hash(password);
    const user = await this.users.create(email, passwordHash, role);

    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwt.sign(
        { ...payload, type: 'refresh' },
        { secret: process.env['JWT_REFRESH_SECRET'] ?? 'refresh-change-me-in-production', expiresIn: '7d' },
      ),
    };
  }
}
