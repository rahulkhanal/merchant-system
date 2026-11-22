import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { InvalidTransitionError, MissingRequiredFieldsError } from '../modules/merchant-applications/domain/merchant-application.js';

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}

const PG_ERROR_MAP: Record<string, number> = {
  '23505': HttpStatus.CONFLICT,            // unique_violation
  '23503': HttpStatus.UNPROCESSABLE_ENTITY, // foreign_key_violation
  '23502': HttpStatus.BAD_REQUEST,          // not_null_violation
  '23514': HttpStatus.BAD_REQUEST,          // check_violation
  '42P01': HttpStatus.INTERNAL_SERVER_ERROR, // undefined_table
  '42703': HttpStatus.INTERNAL_SERVER_ERROR, // undefined_column
  '08006': HttpStatus.SERVICE_UNAVAILABLE,   // connection_failure
  '08001': HttpStatus.SERVICE_UNAVAILABLE,   // unable_to_connect
  '53300': HttpStatus.SERVICE_UNAVAILABLE,   // too_many_connections
  '40P01': HttpStatus.CONFLICT,              // deadlock_detected
  '22P02': HttpStatus.BAD_REQUEST,           // invalid_text_representation
  '22003': HttpStatus.BAD_REQUEST,           // numeric_value_out_of_range
};

const PG_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Resource already exists',
  '23503': 'Related resource not found',
  '23502': 'Required field is missing',
  '23514': 'Value violates check constraint',
  '42P01': 'Internal server error',
  '42703': 'Internal server error',
  '08006': 'Database connection failed',
  '08001': 'Database connection failed',
  '53300': 'Database connection limit reached',
  '40P01': 'Conflict detected, please retry',
  '22P02': 'Invalid input format',
  '22003': 'Numeric value out of range',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    this.logger.error(
      `${request.method} ${request.url} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): { status: number; message: string } {
    if (exception instanceof MissingRequiredFieldsError) {
      return { status: HttpStatus.UNPROCESSABLE_ENTITY, message: exception.message };
    }

    if (exception instanceof InvalidTransitionError) {
      return { status: HttpStatus.UNPROCESSABLE_ENTITY, message: exception.message };
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : (res as { message?: string | string[] }).message ?? exception.message;
      return {
        status: exception.getStatus(),
        message: Array.isArray(message) ? message.join(', ') : message,
      };
    }

    const dbErr = exception as DatabaseError;
    if (dbErr?.code && dbErr.code in PG_ERROR_MAP) {
      return {
        status: PG_ERROR_MAP[dbErr.code]!,
        message: PG_ERROR_MESSAGES[dbErr.code]!,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
