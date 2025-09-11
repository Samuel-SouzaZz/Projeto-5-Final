// Constantes da aplicação
export const APP_CONFIG = {
  // Servidor
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Bcrypt
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Paginação
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  
  // Upload
  MAX_FILE_SIZE: '10mb',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const MESSAGES = {
  // Sucesso
  SUCCESS: 'Operação realizada com sucesso',
  CREATED: 'Recurso criado com sucesso',
  UPDATED: 'Recurso atualizado com sucesso',
  DELETED: 'Recurso deletado com sucesso',
  
  // Erros gerais
  INTERNAL_ERROR: 'Erro interno do servidor',
  INVALID_DATA: 'Dados inválidos',
  NOT_FOUND: 'Recurso não encontrado',
  UNAUTHORIZED: 'Acesso não autorizado',
  FORBIDDEN: 'Acesso negado',
  
  // Rate limiting
  RATE_LIMIT: 'Muitas tentativas. Tente novamente em alguns minutos.',
  
  // Validação
  REQUIRED_FIELD: 'Campo obrigatório',
  INVALID_FORMAT: 'Formato inválido',
  INVALID_ID: 'ID inválido',
  
  // Usuários
  USER_ALREADY_EXISTS: 'Usuário já existe com este email',
  USER_NOT_FOUND: 'Usuário não encontrado',
  INVALID_CREDENTIALS: 'Email ou senha incorretos',
  ACCOUNT_DISABLED: 'Conta de usuário desativada',
  
  // Token
  TOKEN_NOT_PROVIDED: 'Token de acesso não fornecido',
  TOKEN_INVALID: 'Token inválido',
  TOKEN_EXPIRED: 'Token expirado',
  
  // Atividades
  ACTIVITY_NOT_FOUND: 'Atividade não encontrada',
  ACTIVITY_ALREADY_COMPLETED: 'Atividade já foi completada',
  CANNOT_LIKE_OWN_ACTIVITY: 'Não é possível curtir própria atividade',
  
  // Permissões
  ONLY_AUTHOR_CAN_EDIT: 'Apenas o autor pode editar',
  ONLY_AUTHOR_CAN_DELETE: 'Apenas o autor pode deletar',
  MINIMUM_LEVEL_REQUIRED: 'Nível mínimo necessário',
} as const;

export const CORS_CONFIG = {
  development: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  production: ['https://seudominio.com'], // Substitua pelo seu domínio
};

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
} as const;

export const RANKING_PERIODS = ['semanal', 'mensal', 'anual', 'geral'] as const;
export const DIFFICULTY_LEVELS = ['facil', 'medio', 'dificil', 'expert'] as const;
export const SORT_OPTIONS = ['recente', 'antigo', 'populares', 'pontos'] as const; 