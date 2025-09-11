import { Request, Response, NextFunction } from 'express';
import { Logger } from './logger';

/**
 * Wrapper para handlers assíncronos que automaticamente captura erros
 * e os passa para o middleware de tratamento de erros
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      Logger.error('Async handler error', error);
      next(error);
    });
  };
};

/**
 * Classe de erro personalizada para erros da aplicação
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Utilitário para criar erros específicos
 */
export class ErrorFactory {
  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static unauthorized(message: string): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message: string): AppError {
    return new AppError(message, 403);
  }

  static notFound(message: string): AppError {
    return new AppError(message, 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409);
  }

  static internal(message: string): AppError {
    return new AppError(message, 500);
  }
} 