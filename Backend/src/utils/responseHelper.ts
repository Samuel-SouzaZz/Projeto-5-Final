import { Response } from 'express';
import { HTTP_STATUS, MESSAGES } from './constants';

export interface ApiResponse<T = any> {
  sucesso: boolean;
  mensagem: string;
  dados?: T;
  erros?: Array<{ campo: string; mensagem: string }>;
  paginacao?: {
    paginaAtual: number;
    totalPaginas: number;
    totalItens: number;
    limite: number;
  };
}

export class ResponseHelper {
  /**
   * Resposta de sucesso
   */
  static success<T>(res: Response, data?: T, message: string = MESSAGES.SUCCESS, statusCode: number = HTTP_STATUS.OK) {
    const response: ApiResponse<T> = {
      sucesso: true,
      mensagem: message,
    };

    if (data !== undefined) {
      response.dados = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de sucesso com paginação
   */
  static successWithPagination<T>(
    res: Response,
    data: T,
    pagination: {
      paginaAtual: number;
      totalPaginas: number;
      totalItens: number;
      limite: number;
    },
    message: string = MESSAGES.SUCCESS
  ) {
    const response: ApiResponse<T> = {
      sucesso: true,
      mensagem: message,
      dados: data,
      paginacao: pagination,
    };

    return res.status(HTTP_STATUS.OK).json(response);
  }

  /**
   * Resposta de erro
   */
  static error(
    res: Response,
    message: string = MESSAGES.INTERNAL_ERROR,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors?: Array<{ campo: string; mensagem: string }>
  ) {
    const response: ApiResponse = {
      sucesso: false,
      mensagem: message,
    };

    if (errors && errors.length > 0) {
      response.erros = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de validação (400)
   */
  static validationError(
    res: Response,
    errors: Array<{ campo: string; mensagem: string }>,
    message: string = MESSAGES.INVALID_DATA
  ) {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  /**
   * Resposta de não autorizado (401)
   */
  static unauthorized(res: Response, message: string = MESSAGES.UNAUTHORIZED) {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * Resposta de acesso negado (403)
   */
  static forbidden(res: Response, message: string = MESSAGES.FORBIDDEN) {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * Resposta de não encontrado (404)
   */
  static notFound(res: Response, message: string = MESSAGES.NOT_FOUND) {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * Resposta de conflito (409)
   */
  static conflict(res: Response, message: string) {
    return this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  /**
   * Resposta de criado (201)
   */
  static created<T>(res: Response, data: T, message: string = MESSAGES.CREATED) {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }
}

/**
 * Utilitário para cálculo de paginação
 */
export class PaginationHelper {
  static calculatePagination(
    page: number = 1,
    limit: number = 10,
    total: number
  ) {
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    return {
      paginaAtual: page,
      totalPaginas: totalPages,
      totalItens: total,
      limite: limit,
      skip,
    };
  }

  static validatePaginationParams(page?: string, limit?: string) {
    const pageNum = parseInt(page || '1');
    const limitNum = Math.min(parseInt(limit || '10'), 50); // Máximo 50 itens

    return {
      page: Math.max(pageNum, 1), // Mínimo 1
      limit: Math.max(limitNum, 1), // Mínimo 1
    };
  }
} 