import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

const API_KEY = 'mock-api-key';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (req.headers['x-api-key'] !== API_KEY) {
      throw new UnauthorizedException('Invalid or missing x-api-key');
    }
    return true;
  }
}
