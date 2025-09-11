import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Database from './config/database';
import { Logger, requestLogger } from './utils/logger';
import { ResponseHelper } from './utils/responseHelper';
import { AppError } from './utils/asyncHandler';
import { 
  APP_CONFIG, 
  HTTP_STATUS, 
  MESSAGES, 
  CORS_CONFIG, 
  SECURITY_HEADERS 
} from './utils/constants';

// Importar rotas
import usuarioRoutes from './routes/usuarioRoutes';
import atividadeRoutes from './routes/atividadeRoutes';
import rankingRoutes from './routes/rankingRoutes';

class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // CORS
    this.express.use(cors({
      origin: APP_CONFIG.NODE_ENV === 'production' 
        ? CORS_CONFIG.production
        : CORS_CONFIG.development,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: APP_CONFIG.RATE_LIMIT_WINDOW_MS,
      max: APP_CONFIG.RATE_LIMIT_MAX_REQUESTS,
      message: {
        sucesso: false,
        mensagem: MESSAGES.RATE_LIMIT
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.express.use('/api/', limiter);

    // Body parsing
    this.express.use(express.json({ limit: APP_CONFIG.MAX_FILE_SIZE }));
    this.express.use(express.urlencoded({ extended: true, limit: APP_CONFIG.MAX_FILE_SIZE }));

    // Request logging
    this.express.use(requestLogger);

    // Security headers
    this.express.use((req, res, next) => {
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.express.get('/api/health', (req, res) => {
      ResponseHelper.success(res, {
        timestamp: new Date().toISOString(),
        ambiente: APP_CONFIG.NODE_ENV,
        database: Database.getConnectionState()
      }, 'API funcionando corretamente');
    });

    // API routes
    this.express.use('/api/usuarios', usuarioRoutes);
    this.express.use('/api/atividades', atividadeRoutes);
    this.express.use('/api/ranking', rankingRoutes);

    // 404 for API endpoints
    this.express.use('/api', (req, res) => {
      ResponseHelper.notFound(res, `Endpoint não encontrado: ${req.originalUrl}`);
    });

    // Root endpoint
    this.express.get('/', (req, res) => {
      ResponseHelper.success(res, {
        nome: 'Plataforma Educativa de Programação',
        versao: '1.0.0',
        descricao: 'API para plataforma de ensino de programação com sistema de ranking',
        documentacao: '/api/docs',
        endpoints: {
          usuarios: '/api/usuarios',
          atividades: '/api/atividades',
          ranking: '/api/ranking',
          health: '/api/health'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    this.express.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      Logger.error('Unhandled error', err);

      // Erro personalizado da aplicação
      if (err instanceof AppError) {
        return ResponseHelper.error(res, err.message, err.statusCode);
      }

      // Erro de validação do Mongoose
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((error: any) => ({
          campo: error.path,
          mensagem: error.message
        }));
        return ResponseHelper.validationError(res, errors);
      }

      // Erro de cast do Mongoose (ID inválido)
      if (err.name === 'CastError') {
        return ResponseHelper.error(res, MESSAGES.INVALID_ID, HTTP_STATUS.BAD_REQUEST);
      }

      // Erro de duplicata (email já existe, etc.)
      if (err.code === 11000) {
        const campo = Object.keys(err.keyValue)[0];
        return ResponseHelper.conflict(res, `${campo} já está em uso`);
      }

      // Erro genérico
      const message = APP_CONFIG.NODE_ENV === 'development' 
        ? err.message 
        : MESSAGES.INTERNAL_ERROR;
        
      return ResponseHelper.error(res, message);
    });
  }

  public async start(): Promise<void> {
    try {
      await Database.connect();
      
      this.express.listen(APP_CONFIG.PORT, () => {
        Logger.info(`🚀 Servidor rodando na porta ${APP_CONFIG.PORT}`);
        Logger.info(`📍 Ambiente: ${APP_CONFIG.NODE_ENV}`);
        Logger.info(`🌐 URL: http://localhost:${APP_CONFIG.PORT}`);
        Logger.info(`💚 Health: http://localhost:${APP_CONFIG.PORT}/api/health`);
        
        if (APP_CONFIG.NODE_ENV === 'development') {
          this.logAvailableEndpoints();
        }
      });
    } catch (error) {
      Logger.error('Erro ao iniciar servidor', error);
      process.exit(1);
    }
  }

  private logAvailableEndpoints(): void {
    Logger.info('\n📡 Endpoints disponíveis:');
    Logger.info('   POST /api/usuarios/registrar - Registrar usuário');
    Logger.info('   POST /api/usuarios/login - Login');
    Logger.info('   GET  /api/usuarios/perfil - Perfil do usuário');
    Logger.info('   GET  /api/atividades - Listar atividades');
    Logger.info('   POST /api/atividades - Criar atividade');
    Logger.info('   GET  /api/ranking - Ranking geral');
  }

  public async stop(): Promise<void> {
    try {
      await Database.disconnect();
      Logger.info('🛑 Servidor parado');
    } catch (error) {
      Logger.error('Erro ao parar servidor', error);
    }
  }
}

// Criar instância da aplicação
const app = new App();

// Tratamento de sinais de sistema
process.on('SIGINT', async () => {
  Logger.info('\n🔄 Recebido SIGINT, parando servidor...');
  await app.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('\n🔄 Recebido SIGTERM, parando servidor...');
  await app.stop();
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception', error);
  process.exit(1);
});

// Iniciar aplicação se executado diretamente
if (require.main === module) {
  app.start();
}

export default app; 