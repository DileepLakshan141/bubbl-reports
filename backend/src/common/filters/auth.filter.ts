import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { ErrorResponseBody } from '../../../types/error.type';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.resolve(exception);

    const body: ErrorResponseBody = {
      success: false,
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${statusCode} (${error})`,
      );
    }

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        return { statusCode: status, error: exception.name, message: res };
      }
      const resObj = res as { message?: string | string[]; error?: string };
      return {
        statusCode: status,
        error: resObj.error ?? exception.name,
        message: resObj.message ?? exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': // unique constraint violation
          return {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: `A record with this ${(exception.meta?.target as string[])?.join(', ') ?? 'value'} already exists`,
          };
        case 'P2025': // record not found (update/delete on missing row)
          return {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            message: 'The requested record was not found',
          };
        case 'P2003': // foreign key constraint failed
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'This action references a record that does not exist',
          };
        default:
          this.logger.error(
            `Unhandled Prisma error code: ${exception.code}`,
            JSON.stringify(exception.meta),
          );
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'A database error occurred processing this request',
          };
      }
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'Invalid data provided',
      };
    }

    // generic case
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Something went wrong. Please try again later.',
    };
  }
}
