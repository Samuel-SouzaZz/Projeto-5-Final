import mongoose from 'mongoose';
import { Logger } from '../utils/logger';
import { APP_CONFIG } from '../utils/constants';

class Database {
  private mongoUri: string;

  constructor() {
    this.mongoUri = APP_CONFIG.MONGODB_URI || 'mongodb://localhost:27017/plataforma_educativa';
  }

  async connect(): Promise<void> {
    try {
      // Configurações de conexão otimizadas
      await mongoose.connect(this.mongoUri, {
        maxPoolSize: 10, // Máximo de conexões simultâneas
        serverSelectionTimeoutMS: 5000, // Timeout para seleção do servidor
        socketTimeoutMS: 45000, // Timeout do socket
        retryWrites: true, // Retry automático para writes
      });

      Logger.info(' Conectado ao MongoDB com sucesso!', {
        database: this.getDatabaseName(),
        host: this.getHost(),
        state: this.getConnectionState()
      });

      // Event listeners para monitoramento
      this.setupEventListeners();

    } catch (error) {
      Logger.error(' Erro ao conectar com MongoDB', error);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      Logger.info(' Desconectado do MongoDB');
    } catch (error) {
      Logger.error(' Erro ao desconectar do MongoDB', error);
    }
  }

  getConnectionState(): string {
    const states: string[] = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return states[mongoose.connection.readyState] || 'unknown';
  }

  private getDatabaseName(): string {
    try {
      if (this.mongoUri.includes('mongodb+srv://')) {
        const match = this.mongoUri.match(/\/([^?]+)/);
        return match ? match[1] : 'plataforma_educativa';
      }
      return 'plataforma_educativa';
    } catch {
      return 'local';
    }
  }

  private getHost(): string {
    try {
      if (this.mongoUri.includes('mongodb+srv://')) {
        const match = this.mongoUri.match(/mongodb\+srv:\/\/[^@]+@([^\/\?]+)/);
        return match ? match[1] : 'Atlas Cluster';
      }
      return 'localhost';
    } catch {
      return 'unknown';
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      Logger.info(' Mongoose conectado ao MongoDB');
    });

    mongoose.connection.on('error', (error) => {
      Logger.error(' Erro na conexão do MongoDB', error);
    });

    mongoose.connection.on('disconnected', () => {
      Logger.warn(' Mongoose desconectado do MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      Logger.info(' Mongoose reconectado ao MongoDB');
    });
  }

  // Método para verificar se a conexão está saudável
  async isHealthy(): Promise<boolean> {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export default new Database(); 