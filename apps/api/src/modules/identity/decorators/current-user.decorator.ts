import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { JwtPayload } from '../infrastructure/strategies/jwt.strategy.js';

export const CurrentUser = createParamDecorator(
  (field: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return field ? req.user?.[field] : req.user;
  },
);
