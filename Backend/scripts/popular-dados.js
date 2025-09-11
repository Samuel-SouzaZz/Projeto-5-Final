// Script para popular o banco com dados de exemplo
// Execute: node scripts/popular-dados.js

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/plataforma_educativa';

async function popularDados() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔗 Conectado ao MongoDB');
    
    const db = client.db();
    
    // Limpar dados existentes
    await db.collection('usuarios').deleteMany({});
    await db.collection('atividades').deleteMany({});
    await db.collection('rankings').deleteMany({});
    console.log('🧹 Dados antigos removidos');
    
    // Criar usuários de exemplo
    const senhaHash = await bcrypt.hash('123456', 12);
    
    const usuarios = [
      {
        _id: new ObjectId(),
        nome: 'João Silva',
        email: 'joao@email.com',
        senha: senhaHash,
        biografia: 'Desenvolvedor JavaScript apaixonado por aprender',
        pontos: 150,
        nivel: 2,
        experiencia: 150,
        experienciaProximoNivel: 200,
        rank: 1,
        linguagensFavoritas: ['JavaScript', 'Python'],
        conquistas: ['Primeiro Login', 'Primeira Atividade'],
        atividadesRealizadas: [],
        atividadesPublicadas: [],
        seguidores: [],
        seguindo: [],
        isAtivo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        nome: 'Maria Santos',
        email: 'maria@email.com',
        senha: senhaHash,
        biografia: 'Estudante de Ciência da Computação',
        pontos: 200,
        nivel: 2,
        experiencia: 200,
        experienciaProximoNivel: 300,
        rank: 2,
        linguagensFavoritas: ['Python', 'Java'],
        conquistas: ['Primeira Atividade', 'Mentor'],
        atividadesRealizadas: [],
        atividadesPublicadas: [],
        seguidores: [],
        seguindo: [],
        isAtivo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('usuarios').insertMany(usuarios);
    console.log('✅ Usuários de exemplo criados');
    
    // Criar atividades de exemplo
    const atividades = [
      {
        _id: new ObjectId(),
        titulo: 'Introdução ao JavaScript',
        descricao: 'Aprenda os conceitos básicos do JavaScript',
        categoria: 'Web Development',
        linguagem: 'JavaScript',
        dificuldade: 'facil',
        questoes: [
          {
            titulo: 'Declarar uma variável',
            descricao: 'Declare uma variável chamada nome com o valor "João"',
            dificuldade: 'facil',
            linguagem: 'JavaScript',
            codigoInicial: '// Declare a variável aqui\n',
            solucaoEsperada: 'let nome = "João";',
            testCases: [
              {
                entrada: '',
                saidaEsperada: 'João',
                descricao: 'Deve declarar nome com valor João'
              }
            ],
            dicas: ['Use let ou const', 'Atribua o valor usando ='],
            pontosRecompensa: 10
          }
        ],
        autor: usuarios[0]._id,
        tags: ['javascript', 'iniciante', 'variaveis'],
        pontosTotal: 10,
        tempoEstimado: 15,
        visualizacoes: 0,
        curtidas: [],
        comentarios: [],
        usuariosCompletaram: [],
        isPublica: true,
        isAprovada: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        titulo: 'Funções em Python',
        descricao: 'Aprenda a criar e usar funções em Python',
        categoria: 'Programming Basics',
        linguagem: 'Python',
        dificuldade: 'medio',
        questoes: [
          {
            titulo: 'Criar uma função',
            descricao: 'Crie uma função que soma dois números',
            dificuldade: 'medio',
            linguagem: 'Python',
            codigoInicial: '# Crie a função aqui\ndef somar(a, b):\n    # Seu código\n    pass',
            solucaoEsperada: 'def somar(a, b):\n    return a + b',
            testCases: [
              {
                entrada: 'somar(2, 3)',
                saidaEsperada: '5',
                descricao: 'Deve somar 2 + 3 = 5'
              }
            ],
            dicas: ['Use def para definir função', 'Use return para retornar valor'],
            pontosRecompensa: 20
          }
        ],
        autor: usuarios[1]._id,
        tags: ['python', 'funcoes', 'intermediario'],
        pontosTotal: 20,
        tempoEstimado: 30,
        visualizacoes: 0,
        curtidas: [],
        comentarios: [],
        usuariosCompletaram: [],
        isPublica: true,
        isAprovada: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('atividades').insertMany(atividades);
    console.log('✅ Atividades de exemplo criadas');
    
    // Criar rankings de exemplo
    const rankings = [
      {
        _id: new ObjectId(),
        usuario: usuarios[1]._id,
        posicao: 1,
        pontosTotal: 200,
        nivel: 2,
        periodo: 'geral',
        estatisticas: {
          atividadesCompletadas: 3,
          atividadesPublicadas: 1,
          tempoTotalEstudo: 120,
          sequenciaAtual: 2,
          maiorSequencia: 5,
          linguagensDominadas: ['Python'],
          mediaAvaliacao: 4.5
        },
        conquistas: [],
        atividades: [],
        ultimaAtualizacao: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        usuario: usuarios[0]._id,
        posicao: 2,
        pontosTotal: 150,
        nivel: 2,
        periodo: 'geral',
        estatisticas: {
          atividadesCompletadas: 2,
          atividadesPublicadas: 1,
          tempoTotalEstudo: 90,
          sequenciaAtual: 1,
          maiorSequencia: 3,
          linguagensDominadas: ['JavaScript'],
          mediaAvaliacao: 4.0
        },
        conquistas: [],
        atividades: [],
        ultimaAtualizacao: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await db.collection('rankings').insertMany(rankings);
    console.log('✅ Rankings de exemplo criados');
    
    console.log('\n🎉 Banco de dados populado com sucesso!');
    console.log('\n📊 Dados criados:');
    console.log(`👥 ${usuarios.length} usuários`);
    console.log(`📚 ${atividades.length} atividades`);
    console.log(`🏆 ${rankings.length} rankings`);
    
    console.log('\n🔑 Credenciais de teste:');
    console.log('Email: joao@email.com | Senha: 123456');
    console.log('Email: maria@email.com | Senha: 123456');
    
  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  } finally {
    await client.close();
    console.log('🔌 Conexão fechada');
  }
}

// Executar script
popularDados(); 