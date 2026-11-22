import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { PasswordHasher } from '../../application/ports/password-hasher.port.js';
import { UserRepository } from '../../application/ports/user.repository.port.js';
import { User } from '../../domain/user.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }
}
