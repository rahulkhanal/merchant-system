import {
  Body,
  Controller,
  Get,
  HttpException,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiKeyGuard } from './guard/api-key.guard.js';
import { KybChecksService, SimulatedProviderFailure } from './kyb-checks.service.js';
import { KybCheckResult } from './types.js';

class KybCheckDto {
  @IsString()
  @IsNotEmpty()
  legalBusinessName!: string;
}

@Controller()
export class KybChecksController {
  constructor(private readonly kybChecksService: KybChecksService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('kyb/checks')
  @UseGuards(ApiKeyGuard)
  @Throttle({ default: { limit: 10, ttl: 1000 } })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async check(@Body() body: KybCheckDto): Promise<KybCheckResult> {
    try {
      return await this.kybChecksService.check(body);
    } catch (err) {
      if (err instanceof SimulatedProviderFailure) {
        throw new HttpException(err.message, err.statusCode);
      }
      throw err;
    }
  }
}
