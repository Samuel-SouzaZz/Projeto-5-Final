import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import Database from './config/database';

// Importar rotas
import usuarioRoutes from './routes/usuarioRoutes';
import atividadeRoutes from './routes/atividadeRoutes';
import rankingRoutes from './routes/rankingRoutes';

// Configurar variáveis de ambiente
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.configurarMiddlewares();
    this.configurarRotas();
    this.configurarTratamentoErros();
  }

  private configurarMiddlewares(): void {
    // CORS
    this.express.use(cors({
      origin: NODE_ENV === 'production' 
        ? ['https://seudominio.com'] // Substitua pelo seu domínio em produção
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests por janela
      message: {
        sucesso: false,
        mensagem: 'Muitas tentativas. Tente novamente em alguns minutos.'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.express.use('/api/', limiter);

    // Parsing de JSON
    this.express.use(express.json({ limit: '10mb' }));
    this.express.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Middleware de log em desenvolvimento
    if (NODE_ENV === 'development') {
      this.express.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
      });
    }

    // Headers de segurança
    this.express.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  private configurarRotas(): void {
    // Rota de health check
    this.express.get('/api/health', (req, res) => {
      res.json({
        sucesso: true,
        mensagem: 'API funcionando corretamente',
        timestamp: new Date().toISOString(),
        ambiente: NODE_ENV,
        database: Database.getConnectionState()
      });
    });

    // Rotas da API
    this.express.use('/api/usuarios', usuarioRoutes);
    this.express.use('/api/atividades', atividadeRoutes);
    this.express.use('/api/ranking', rankingRoutes);

    // Rota para endpoints não encontrados
    this.express.use('/api/*', (req, res) => {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Endpoint não encontrado',
        endpoint: req.originalUrl
      });
    });

    // Rota raiz
    this.express.get('/', (req, res) => {
      res.json({
        nome: 'Plataforma Educativa de Programação',
        versao: '1.0.0',
        descricao: 'API para plataforma de ensino de programação com sistema de ranking',
        documentacao: '/api/docs', // Pode adicionar Swagger futuramente
        endpoints: {
          usuarios: '/api/usuarios',
          atividades: '/api/atividades',
          ranking: '/api/ranking',
          health: '/api/health'
        }
      });
    });
  }

  private configurarTratamentoErros(): void {
    // Middleware de tratamento de erros
    this.express.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Erro não tratado:', err);

      // Erro de validação do Mongoose
      if (err.name === 'ValidationError') {
        const erros = Object.values(err.errors).map((error: any) => ({
          campo: error.path,
          mensagem: error.message
        }));

        return res.status(400).json({
          sucesso: false,
          mensagem: 'Dados inválidos',
          erros
        });
      }

      // Erro de cast do Mongoose (ID inválido)
      if (err.name === 'CastError') {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'ID inválido',
          campo: err.path
        });
      }

      // Erro de duplicata (email já existe, etc.)
      if (err.code === 11000) {
        const campo = Object.keys(err.keyValue)[0];
        return res.status(409).json({
          sucesso: false,
          mensagem: `${campo} já está em uso`,
          campo
        });
      }

      // Erro genérico
      res.status(500).json({
        sucesso: false,
        mensagem: NODE_ENV === 'development' ? err.message : 'Erro interno do servidor'
      });
    });
  }

  public async iniciar(): Promise<void> {
    try {
      // Conectar ao banco de dados
      await Database.connect();

      // Iniciar servidor
      this.express.listen(PORT, () => {
        console.log(` Servidor rodando na porta ${PORT}`);
        console.log(`Ambiente: ${NODE_ENV}`);
        console.log(`URL: http://localhost:${PORT}`);
        console.log(`API Health: http://localhost:${PORT}/api/health`);
        
        if (NODE_ENV === 'development') {
          console.log('\n Endpoints disponíveis:');
          console.log('   POST /api/usuarios/registrar - Registrar usuário');
          console.log('   POST /api/usuarios/login - Login');
          console.log('   GET  /api/usuarios/perfil - Perfil do usuário');
          console.log('   GET  /api/atividades - Listar atividades');
          console.log('   POST /api/atividades - Criar atividade');
          console.log('   GET  /api/ranking - Ranking geral');
          console.log('');
        }
      });
    } catch (error) {
      console.error(' Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }

  public async parar(): Promise<void> {
    try {
      await Database.disconnect();
      console.log(' Servidor parado');
    } catch (error) {
      console.error(' Erro ao parar servidor:', error);
    }
  }
}

// Criar e iniciar aplicação
const app = new App();

// Tratamento de sinais de sistema
process.on('SIGINT', async () => {
  console.log('\n Recebido SIGINT, parando servidor...');
  await app.parar();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nRecebido SIGTERM, parando servidor...');
  await app.parar();
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar aplicação se este arquivo for executado diretamente
if (require.main === module) {
  app.iniciar();
}

export default app; 