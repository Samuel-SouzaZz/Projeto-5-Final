import { APP_CONFIG } from './constants';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private static formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (meta) {
      return `${baseMessage} ${JSON.stringify(meta, null, 2)}`;
    }
    
    return baseMessage;
  }

  static debug(message: string, meta?: any): void {
    if (APP_CONFIG.NODE_ENV === 'development') {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }

  static info(message: string, meta?: any): void {
    console.log(this.formatMessage(LogLevel.INFO, message, meta));
  }

  static warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  static error(message: string, error?: Error | any): void {
    const errorMeta = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
      
    console.error(this.formatMessage(LogLevel.ERROR, message, errorMeta));
  }

  static request(method: string, path: string, statusCode?: number, duration?: number): void {
    if (APP_CONFIG.NODE_ENV === 'development') {
      const meta = { method, path, statusCode, duration };
      this.debug('HTTP Request', meta);
    }
  }
}

/**
 * Middleware de logging para requests HTTP
 */
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.request(req.method, req.path, res.statusCode, duration);
  });
  
  next();
}; 