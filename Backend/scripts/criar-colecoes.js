// Script para criar coleções no MongoDB
// Execute: node scripts/criar-colecoes.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/plataforma_educativa';

async function criarColecoes() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB');
    
    const db = client.db();
    
    // Criar coleção de usuários
    const usuarios = db.collection('usuarios');
    await usuarios.createIndex({ email: 1 }, { unique: true });
    await usuarios.createIndex({ pontos: -1 });
    await usuarios.createIndex({ nivel: -1 });
    await usuarios.createIndex({ rank: 1 });
    console.log('✅ Coleção "usuarios" criada com índices');
    
    // Criar coleção de atividades
    const atividades = db.collection('atividades');
    await atividades.createIndex({ autor: 1 });
    await atividades.createIndex({ categoria: 1 });
    await atividades.createIndex({ linguagem: 1 });
    await atividades.createIndex({ dificuldade: 1 });
    await atividades.createIndex({ tags: 1 });
    await atividades.createIndex({ isPublica: 1, isAprovada: 1 });
    await atividades.createIndex({ pontosTotal: -1 });
    await atividades.createIndex({ visualizacoes: -1 });
    console.log('✅ Coleção "atividades" criada com índices');
    
    // Criar coleção de rankings
    const rankings = db.collection('rankings');
    await rankings.createIndex({ usuario: 1, periodo: 1, categoria: 1 }, { unique: true });
    await rankings.createIndex({ posicao: 1, periodo: 1, categoria: 1 });
    await rankings.createIndex({ pontosTotal: -1, periodo: 1, categoria: 1 });
    await rankings.createIndex({ nivel: -1 });
    await rankings.createIndex({ ultimaAtualizacao: 1 });
    console.log('✅ Coleção "rankings" criada com índices');
    
    console.log('🎉 Todas as coleções foram criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar coleções:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexão fechada');
  }
}

// Executar script
criarColecoes(); 