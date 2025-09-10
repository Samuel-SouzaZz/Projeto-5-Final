import mongoose from 'mongoose';

class Database {
  private mongoUri: string;

  constructor() {
    this.mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma_educativa';
  }

  async connect(): Promise<void> {
    try {
      await mongoose.connect(this.mongoUri);
      console.log(' Conectado ao MongoDB com sucesso!');
    } catch (error) {
      console.error(' Erro ao conectar com MongoDB:', error);
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log(' Desconectado do MongoDB');
    } catch (error) {
      console.error(' Erro ao desconectar do MongoDB:', error);
    }
  }

  getConnectionState(): string {
    const states: string[] = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

export default new Database(); 