import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../domain/role.enum.js';
import { User } from '../../domain/user.js';
import { UserRepository } from '../../application/ports/user.repository.port.js';
import { UserEntity } from '../entities/user.entity.js';

@Injectable()
export class UserTypeOrmRepository implements UserRepository {
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  async create(email: string, passwordHash: string, role: Role): Promise<User> {
    const entity = this.repo.create({ email, passwordHash, role });
    return this.repo.save(entity);
  }
}
