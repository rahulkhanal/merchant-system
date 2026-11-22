import { Injectable } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import { PasswordHasher } from '../../application/ports/password-hasher.port.js';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return hash(plain, SALT_ROUNDS);
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
