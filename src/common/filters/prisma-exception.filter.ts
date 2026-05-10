import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception.code === 'P2002') {
      const conflict = new ConflictException('Unique constraint violation');
      const body = conflict.getResponse();
      response.status(conflict.getStatus()).json(body);
      return;
    }

    if (exception.code === 'P2025') {
      const notFound = new NotFoundException('Resource not found');
      const body = notFound.getResponse();
      response.status(notFound.getStatus()).json(body);
      return;
    }

    throw exception;
  }
}
