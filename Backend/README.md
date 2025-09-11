# 🎓 Plataforma Educativa de Programação - Backend

Uma API completa para plataforma de ensino de programação com sistema de ranking e comunidade.

## 📋 Funcionalidades

- ✅ **Sistema de Usuários**: Registro, login, perfis, seguir/deixar de seguir
- ✅ **Atividades/Exercícios**: Criação, listagem, filtros, comentários, curtidas
- ✅ **Sistema de Ranking**: Rankings por período, estatísticas, histórico
- ✅ **Gamificação**: Pontos, níveis, experiência, conquistas
- ✅ **Segurança**: JWT, rate limiting, validação de dados
- ✅ **MongoDB**: Modelos bem estruturados com índices otimizados

## 🚀 Como Começar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto Backend:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# Configurações do MongoDB Atlas (Recomendado)
MONGODB_URI=mongodb+srv://Samuel-Souza:projeto123@cluster0.dx4kdgl.mongodb.net/plataforma_educativa?retryWrites=true&w=majority&appName=Cluster0

# Para MongoDB Local (alternativo):
# MONGODB_URI=mongodb://localhost:27017/plataforma_educativa

# Configurações de Autenticação
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_123456789
JWT_EXPIRES_IN=7d

# Configurações de Segurança
BCRYPT_SALT_ROUNDS=12

# Configurações de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Configuração do Banco de Dados

**✅ MongoDB Atlas (Já Configurado)**
O projeto já está configurado para usar o MongoDB Atlas com as seguintes credenciais:
- **Cluster**: `cluster0.dx4kdgl.mongodb.net`
- **Usuário**: `Samuel-Souza`
- **Database**: `plataforma_educativa`

A string de conexão já está incluída no exemplo do `.env`. Apenas certifique-se de que:
1. ✅ A string `MONGODB_URI` está no seu arquivo `.env`
2. ✅ O cluster Atlas está ativo e acessível
3. ✅ As credenciais estão corretas

**Opção Alternativa: MongoDB Local**
Se preferir usar MongoDB local:
```bash
# Instalar MongoDB Community Edition
# Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/
# macOS: brew install mongodb-community
# Linux: https://docs.mongodb.com/manual/administration/install-on-linux/

# Iniciar MongoDB
mongod

# No .env, altere para:
# MONGODB_URI=mongodb://localhost:27017/plataforma_educativa
```

### 4. Testar Conexão com o Banco

Antes de iniciar o servidor, teste se a conexão com o MongoDB Atlas está funcionando:

```bash
npm run db:test
```

Se a conexão estiver funcionando, você verá:
```
✅ Conexão estabelecida com sucesso!
✅ Ping bem-sucedido!
📚 Coleções encontradas: (ou banco vazio)
🎉 Teste de conexão concluído com sucesso!
```

### 5. Executar o Servidor

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm start
```

**Scripts Úteis:**
```bash
# Testar conexão com o banco
npm run db:test

# Criar coleções iniciais
npm run db:create

# Popular com dados de exemplo
npm run db:seed

# Setup completo do banco (criar + popular)
npm run db:setup

# Verificar tipos TypeScript
npm run lint

# Build limpo
npm run build:clean
```

## 📡 API Endpoints

### 🔐 Usuários

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/usuarios/registrar` | Registrar novo usuário | ❌ |
| POST | `/api/usuarios/login` | Login do usuário | ❌ |
| GET | `/api/usuarios/perfil` | Obter perfil próprio | ✅ |
| PUT | `/api/usuarios/perfil` | Atualizar perfil | ✅ |
| GET | `/api/usuarios/:id/publico` | Perfil público | ❌ |
| POST | `/api/usuarios/:id/seguir` | Seguir usuário | ✅ |
| DELETE | `/api/usuarios/:id/seguir` | Parar de seguir | ✅ |

### 📚 Atividades

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/atividades` | Listar atividades | ❌ |
| GET | `/api/atividades/:id` | Detalhes da atividade | ❌ |
| POST | `/api/atividades` | Criar atividade | ✅ |
| PUT | `/api/atividades/:id` | Atualizar atividade | ✅ |
| DELETE | `/api/atividades/:id` | Deletar atividade | ✅ |
| POST | `/api/atividades/:id/curtir` | Curtir/descurtir | ✅ |
| POST | `/api/atividades/:id/comentarios` | Adicionar comentário | ✅ |
| POST | `/api/atividades/:id/completar` | Marcar como completada | ✅ |

### 🏆 Ranking

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/ranking` | Ranking geral | ❌ |
| GET | `/api/ranking/estatisticas` | Estatísticas gerais | ❌ |
| GET | `/api/ranking/usuario/:id` | Posição do usuário | ❌ |
| GET | `/api/ranking/usuario/:id/historico` | Histórico do usuário | ❌ |
| POST | `/api/ranking/recalcular` | Recalcular rankings | ✅ |

## 📝 Exemplos de Uso

### Registrar Usuário

```bash
curl -X POST http://localhost:3000/api/usuarios/registrar \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "123456",
    "biografia": "Estudante de programação",
    "linguagensFavoritas": ["JavaScript", "Python"]
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@email.com",
    "senha": "123456"
  }'
```

### Criar Atividade

```bash
curl -X POST http://localhost:3000/api/atividades \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -d '{
    "titulo": "Introdução ao JavaScript",
    "descricao": "Aprenda os conceitos básicos do JavaScript",
    "categoria": "Web Development",
    "linguagem": "JavaScript",
    "dificuldade": "facil",
    "tempoEstimado": 30,
    "tags": ["javascript", "iniciante"],
    "questoes": [{
      "titulo": "Declarar uma variável",
      "descricao": "Declare uma variável chamada nome com o valor João",
      "dificuldade": "facil",
      "linguagem": "JavaScript",
      "codigoInicial": "// Seu código aqui",
      "testCases": [{
        "entrada": "",
        "saidaEsperada": "João",
        "descricao": "Deve retornar João"
      }],
      "dicas": ["Use let ou const", "Atribua o valor usando ="],
      "pontosRecompensa": 10
    }],
    "isPublica": true
  }'
```

### Listar Atividades com Filtros

```bash
curl "http://localhost:3000/api/atividades?categoria=Web%20Development&dificuldade=facil&pagina=1&limite=10"
```

## 🏗️ Estrutura do Projeto

```
Backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuração MongoDB
│   ├── controllers/
│   │   ├── UsuarioController.ts  # Lógica de usuários
│   │   ├── AtividadeController.ts # Lógica de atividades
│   │   └── RankingController.ts  # Lógica de ranking
│   ├── middleware/
│   │   ├── auth.ts              # Autenticação JWT
│   │   └── validacao.ts         # Validação com Joi
│   ├── models/
│   │   ├── Usuario.ts           # Modelo de usuário
│   │   ├── Atividade.ts         # Modelo de atividade
│   │   └── Ranking.ts           # Modelo de ranking
│   ├── routes/
│   │   ├── usuarioRoutes.ts     # Rotas de usuários
│   │   ├── atividadeRoutes.ts   # Rotas de atividades
│   │   └── rankingRoutes.ts     # Rotas de ranking
│   └── app.ts                   # Aplicação principal
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **Bcrypt** - Hash de senhas
- **Joi** - Validação de dados
- **CORS** - Controle de acesso
- **Express Rate Limit** - Rate limiting

## 📊 Modelos de Dados

### Usuário
- Informações pessoais (nome, email, avatar, biografia)
- Sistema de gamificação (pontos, nível, experiência)
- Relacionamentos (seguidores, seguindo)
- Atividades (realizadas, publicadas)

### Atividade
- Metadados (título, descrição, categoria, linguagem, dificuldade)
- Questões com casos de teste
- Interações (curtidas, comentários, visualizações)
- Estatísticas de completação

### Ranking
- Posicionamento por período e categoria
- Estatísticas detalhadas
- Histórico de atividades
- Sistema de conquistas

## 🔒 Segurança

- **Autenticação JWT** com expiração configurável
- **Hash de senhas** com bcrypt e salt rounds altos
- **Rate limiting** para prevenir spam/ataques
- **Validação rigorosa** de todos os inputs
- **Headers de segurança** configurados
- **CORS** configurado adequadamente

## 🚀 Deploy

### Heroku
```bash
# Instalar Heroku CLI
# Criar aplicação
heroku create nome-da-sua-app

# Configurar variáveis de ambiente
heroku config:set MONGODB_URI=sua_uri_mongodb_atlas
heroku config:set JWT_SECRET=sua_chave_secreta
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Railway/Render
1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🆘 Suporte

Se tiver problemas:

1. Verifique se MongoDB está rodando
2. Confirme se as variáveis de ambiente estão configuradas
3. Verifique os logs do servidor
4. Teste os endpoints com ferramentas como Postman/Insomnia

**Health Check:** `GET http://localhost:3000/api/health`

---

Desenvolvido com ❤️ para ensinar programação de forma gamificada! 