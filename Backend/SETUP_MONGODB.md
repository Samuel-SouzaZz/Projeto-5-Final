# 🗄️ Guia de Configuração do MongoDB

## 🎯 **Opções de MongoDB**

### **Opção 1: MongoDB Atlas (Cloud - Recomendado)**
✅ **Vantagens:** Gratuito, sem instalação, sempre disponível, backups automáticos

#### Passos:
1. **Criar conta:** https://cloud.mongodb.com/
2. **Criar cluster gratuito** (M0 Sandbox)
3. **Configurar usuário e senha**
4. **Obter string de conexão**
5. **Configurar no `.env`**

### **Opção 2: MongoDB Local**
✅ **Vantagens:** Controle total, funciona offline

#### Windows:
```bash
# Baixar e instalar MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Iniciar MongoDB
mongod
```

#### macOS:
```bash
# Instalar via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu):
```bash
# Instalar MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
```

## 🚀 **Configuração Rápida**

### **1. Criar arquivo `.env`**
Na pasta `Backend/`, crie o arquivo `.env`:

```env
# Configurações do Servidor
PORT=3000
NODE_ENV=development

# MongoDB Atlas (substitua pelos seus dados)
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/plataforma_educativa

# OU MongoDB Local
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

### **2. Instalar dependências do MongoDB**
```bash
cd Backend
npm install mongodb
```

### **3. Configurar banco de dados**
```bash
# Opção A: Configuração completa (criar coleções + dados de exemplo)
npm run db:setup

# Opção B: Apenas criar coleções com índices
npm run db:create

# Opção C: Apenas popular com dados de exemplo
npm run db:seed
```

### **4. Iniciar servidor**
```bash
npm run dev
```

## 📊 **Estrutura das Coleções**

### **1. usuarios**
```javascript
{
  _id: ObjectId,
  nome: String,
  email: String (único),
  senha: String (hash),
  pontos: Number,
  nivel: Number,
  experiencia: Number,
  rank: Number,
  linguagensFavoritas: [String],
  conquistas: [String],
  // ... outros campos
}
```

### **2. atividades**
```javascript
{
  _id: ObjectId,
  titulo: String,
  descricao: String,
  categoria: String,
  linguagem: String,
  dificuldade: Enum,
  questoes: [Subdocumento],
  autor: ObjectId (ref: usuarios),
  tags: [String],
  pontosTotal: Number,
  // ... outros campos
}
```

### **3. rankings**
```javascript
{
  _id: ObjectId,
  usuario: ObjectId (ref: usuarios),
  posicao: Number,
  pontosTotal: Number,
  periodo: Enum,
  estatisticas: Subdocumento,
  conquistas: [Subdocumento],
  // ... outros campos
}
```

## 🔍 **Índices Criados**

### **usuarios:**
- `{ email: 1 }` - único
- `{ pontos: -1 }` - ranking por pontos
- `{ nivel: -1 }` - ranking por nível
- `{ rank: 1 }` - posição no ranking

### **atividades:**
- `{ autor: 1 }` - atividades por autor
- `{ categoria: 1 }` - filtro por categoria
- `{ linguagem: 1 }` - filtro por linguagem
- `{ dificuldade: 1 }` - filtro por dificuldade
- `{ tags: 1 }` - busca por tags
- `{ isPublica: 1, isAprovada: 1 }` - atividades públicas
- `{ pontosTotal: -1 }` - ordenação por pontos
- `{ visualizacoes: -1 }` - atividades populares

### **rankings:**
- `{ usuario: 1, periodo: 1, categoria: 1 }` - único por usuário/período
- `{ posicao: 1, periodo: 1, categoria: 1 }` - ordenação ranking
- `{ pontosTotal: -1, periodo: 1, categoria: 1 }` - ranking por pontos
- `{ nivel: -1 }` - ranking por nível

## 🧪 **Dados de Exemplo**

Após executar `npm run db:seed`, você terá:

### **👥 Usuários:**
- **João Silva:** `joao@email.com` / `123456`
- **Maria Santos:** `maria@email.com` / `123456`

### **📚 Atividades:**
- **Introdução ao JavaScript** (Fácil)
- **Funções em Python** (Médio)

### **🏆 Rankings:**
- Maria Santos (1º lugar - 200 pontos)
- João Silva (2º lugar - 150 pontos)

## 🛠️ **Comandos Úteis**

### **MongoDB Shell (se usando local):**
```bash
# Conectar ao banco
mongo mongodb://localhost:27017/plataforma_educativa

# Ver coleções
show collections

# Ver usuários
db.usuarios.find().pretty()

# Ver atividades
db.atividades.find().pretty()

# Ver rankings
db.rankings.find().pretty()

# Contar documentos
db.usuarios.count()
```

### **Scripts do projeto:**
```bash
# Criar apenas as coleções e índices
npm run db:create

# Popular com dados de exemplo
npm run db:seed

# Configuração completa (criar + popular)
npm run db:setup

# Iniciar servidor
npm run dev

# Compilar TypeScript
npm run build
```

## 🔧 **Troubleshooting**

### **Erro: "MongoServerSelectionTimeoutError"**
- ✅ Verificar se MongoDB está rodando
- ✅ Verificar string de conexão no `.env`
- ✅ Verificar firewall/rede

### **Erro: "Authentication failed"**
- ✅ Verificar usuário/senha no MongoDB Atlas
- ✅ Verificar IP na whitelist (Atlas)

### **Erro: "Collection already exists"**
- ✅ Normal, as coleções já existem
- ✅ Use `npm run db:seed` para recriar dados

## 🎉 **Testando a API**

Após configurar o banco:

1. **Health Check:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/usuarios/login \
     -H "Content-Type: application/json" \
     -d '{"email":"joao@email.com","senha":"123456"}'
   ```

3. **Listar atividades:**
   ```bash
   curl http://localhost:3000/api/atividades
   ```

4. **Ver ranking:**
   ```bash
   curl http://localhost:3000/api/ranking
   ```

---

## 📞 **Precisa de Ajuda?**

- 📖 **Documentação MongoDB:** https://docs.mongodb.com/
- 🎥 **Tutorial MongoDB Atlas:** https://www.youtube.com/watch?v=rPqRyYJmx2g
- 💬 **Comunidade MongoDB:** https://community.mongodb.com/

**Seu banco está pronto para uso! 🚀** 