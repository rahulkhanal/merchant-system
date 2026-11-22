import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.use-case.js';
import { RefreshUseCase } from '../../application/use-cases/refresh.use-case.js';
import { RegisterUseCase } from '../../application/use-cases/register.use-case.js';
import { JwtGuard } from '../../guards/jwt.guard.js';
import { JwtRefreshGuard } from '../../guards/jwt-refresh.guard.js';
import { LocalAuthGuard } from '../../guards/local-auth.guard.js';
import { Role } from '../../domain/role.enum.js';
import { User } from '../../domain/user.js';
import { LoginDto } from './dtos/login.dto.js';
import { RegisterDto } from './dtos/register.dto.js';
import { AuthTokensResponseDto } from './dtos/responses/auth-tokens.response.dto.js';

@ApiTags('auth')
@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a user account and returns JWT tokens. The role field determines access level: SALES can create/manage own applications, REVIEWER can review and decide on applications, ADMIN has full access including reviewer assignment and audit logs.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: AuthTokensResponseDto, description: 'User registered — tokens returned' })
  @ApiConflictResponse({ description: 'Email already registered' })
  async register(@Body() body: RegisterDto): Promise<AuthTokensResponseDto> {
    return this.registerUseCase.execute(body.email, body.password, body.role);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with email and password', description: 'Returns a short-lived access token (15 min) and a long-lived refresh token (7 days).' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthTokensResponseDto, description: 'Login successful — tokens returned' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  login(@Request() req: ExpressRequest & { user: User }) {
    return this.loginUseCase.execute(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Exchange a refresh token for a new token pair',
    description: 'Pass the refresh token as `Authorization: Bearer <refreshToken>`. Returns a fresh access token and a new refresh token.',
  })
  @ApiOkResponse({ type: AuthTokensResponseDto, description: 'New token pair returned' })
  @ApiUnauthorizedResponse({ description: 'Refresh token missing, invalid, or expired' })
  refresh(@Request() req: ExpressRequest & { user: { sub: string; role: Role } }) {
    return this.refreshUseCase.execute(req.user.sub, req.user.role);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Logout (client-side token discard)',
    description: 'Stateless — no server-side token revocation. Client should discard both access and refresh tokens.',
  })
  @ApiNoContentResponse({ description: 'Logged out' })
  @ApiUnauthorizedResponse({ description: 'Token missing or invalid' })
  logout(): void {}
}
