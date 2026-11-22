import { Role } from '../../domain/role.enum.js';
import { User } from '../../domain/user.js';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract create(email: string, passwordHash: string, role: Role): Promise<User>;
}
