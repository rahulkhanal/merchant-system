import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordHasher } from './application/ports/password-hasher.port.js';
import { UserRepository } from './application/ports/user.repository.port.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { RefreshUseCase } from './application/use-cases/refresh.use-case.js';
import { RegisterUseCase } from './application/use-cases/register.use-case.js';
import { UserEntity } from './infrastructure/entities/user.entity.js';
import { UserTypeOrmRepository } from './infrastructure/repositories/user.typeorm.repository.js';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher.js';
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { LocalStrategy } from './infrastructure/strategies/local.strategy.js';
import { JwtGuard } from './guards/jwt.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './presentation/http/auth.controller.js';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      secret: process.env['JWT_SECRET'] ?? 'change-me-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshUseCase,
    RegisterUseCase,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtGuard,
    JwtRefreshGuard,
    LocalAuthGuard,
    RolesGuard,
    { provide: UserRepository, useClass: UserTypeOrmRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
  ],
  exports: [JwtGuard, RolesGuard, PassportModule],
})
export class IdentityModule {}
