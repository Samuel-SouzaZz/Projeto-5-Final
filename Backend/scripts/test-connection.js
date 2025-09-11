const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma_educativa';

console.log('🔍 Testando conexão com MongoDB...');
console.log('📍 URI:', MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@')); // Oculta credenciais

async function testConnection() {
  try {
    console.log('⏳ Conectando...');
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });

    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar ping
    console.log('🏓 Testando ping...');
    await mongoose.connection.db.admin().ping();
    console.log('✅ Ping bem-sucedido!');
    
    // Listar coleções existentes
    console.log('📋 Listando coleções...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length > 0) {
      console.log('📚 Coleções encontradas:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    } else {
      console.log('📝 Nenhuma coleção encontrada (banco vazio - normal para primeira execução)');
    }
    
    // Informações da conexão
    console.log('\n📊 Informações da Conexão:');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
    console.log(`   Host: ${mongoose.connection.host || 'Atlas Cluster'}`);
    console.log(`   Estado: ${['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]}`);
    
    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Verifique suas credenciais de usuário e senha');
    } else if (error.message.includes('network')) {
      console.error('🌐 Verifique sua conexão com a internet');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Timeout na conexão - verifique se o cluster está ativo');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

testConnection(); 