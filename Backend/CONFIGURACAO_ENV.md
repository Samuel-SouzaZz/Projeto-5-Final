# 📋 Configuração do Arquivo .env

Este arquivo contém as instruções para criar e configurar o arquivo `.env` necessário para executar a aplicação.

## 🔧 Como Criar o Arquivo .env

1. **Crie um arquivo chamado `.env`** na pasta `Backend/` (mesmo nível do `package.json`)

2. **Copie e cole o conteúdo abaixo** no arquivo `.env`:

```env
# 🌍 CONFIGURAÇÕES DO AMBIENTE
NODE_ENV=development
PORT=3000

# 🍃 CONFIGURAÇÕES DO MONGODB ATLAS
MONGODB_URI=mongodb+srv://Samuel-Souza:projeto123@cluster0.dx4kdgl.mongodb.net/plataforma_educativa?retryWrites=true&w=majority&appName=Cluster0

# 🔐 CONFIGURAÇÕES DE AUTENTICAÇÃO JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_plataforma_educativa_2024
JWT_EXPIRES_IN=7d

# 🛡️ CONFIGURAÇÕES DE SEGURANÇA
BCRYPT_SALT_ROUNDS=12

# ⏱️ CONFIGURAÇÕES DE RATE LIMITING
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## ✅ Verificar se está funcionando

Após criar o arquivo `.env`, teste a conexão:

```bash
npm run db:test
```

## 🔒 Importante sobre Segurança

- ⚠️ **NUNCA** faça commit do arquivo `.env` para o repositório
- ✅ O arquivo `.env` já está no `.gitignore`
- 🔐 Em produção, use variáveis de ambiente do servidor/hosting
- 🔑 Altere o `JWT_SECRET` para algo mais seguro em produção

## 🏗️ Estrutura de Pastas

```
Backend/
├── .env                    ← CRIAR ESTE ARQUIVO
├── .env.example           ← Template (se disponível)
├── package.json
├── src/
└── ...
```

## 🆘 Problemas Comuns

### ❌ Erro: "MONGODB_URI is not defined"
- Verifique se o arquivo `.env` está na pasta `Backend/`
- Confirme que não há espaços extras na linha `MONGODB_URI=...`

### ❌ Erro: "Authentication failed"
- As credenciais do MongoDB Atlas estão corretas
- O cluster pode estar pausado (reative no MongoDB Atlas)

### ❌ Erro: "JWT_SECRET is not defined"
- Confirme que a linha `JWT_SECRET=...` está no `.env`
- Não deixe espaços ao redor do `=`

## 🚀 Próximos Passos

1. ✅ Criar o arquivo `.env`
2. ✅ Testar conexão: `npm run db:test`
3. ✅ Instalar dependências: `npm install`
4. ✅ Iniciar servidor: `npm run dev`

---

**💡 Dica**: Mantenha uma cópia de backup das suas configurações em um local seguro! 