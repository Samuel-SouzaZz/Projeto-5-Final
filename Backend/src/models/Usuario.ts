import mongoose, { Document, Schema } from 'mongoose';

// Interface para o documento do usuário
export interface IUsuario extends Document {
  nome: string;
  email: string;
  senha: string;
  avatar?: string;
  rank: number;
  pontos: number;
  nivel: number;
  experiencia: number;
  experienciaProximoNivel: number;
  biografia?: string;
  linguagensFavoritas: string[];
  conquistas: string[];
  atividadesRealizadas: mongoose.Types.ObjectId[];
  atividadesPublicadas: mongoose.Types.ObjectId[];
  seguidores: mongoose.Types.ObjectId[];
  seguindo: mongoose.Types.ObjectId[];
  isAtivo: boolean;
  ultimoLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do usuário
const usuarioSchema = new Schema<IUsuario>({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
    maxlength: [50, 'Nome deve ter no máximo 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email deve ter um formato válido']
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  avatar: {
    type: String,
    default: null
  },
  rank: {
    type: Number,
    default: 0,
    min: [0, 'Rank não pode ser negativo']
  },
  pontos: {
    type: Number,
    default: 0,
    min: [0, 'Pontos não podem ser negativos']
  },
  nivel: {
    type: Number,
    default: 1,
    min: [1, 'Nível mínimo é 1']
  },
  experiencia: {
    type: Number,
    default: 0,
    min: [0, 'Experiência não pode ser negativa']
  },
  experienciaProximoNivel: {
    type: Number,
    default: 100
  },
  biografia: {
    type: String,
    maxlength: [500, 'Biografia deve ter no máximo 500 caracteres'],
    default: ''
  },
  linguagensFavoritas: [{
    type: String,
    trim: true
  }],
  conquistas: [{
    type: String,
    trim: true
  }],
  atividadesRealizadas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Atividade'
  }],
  atividadesPublicadas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Atividade'
  }],
  seguidores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  seguindo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  isAtivo: {
    type: Boolean,
    default: true
  },
  ultimoLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete (ret as any).senha;
      return ret;
    }
  }
});

// Índices para melhor performance
usuarioSchema.index({ email: 1 });
usuarioSchema.index({ pontos: -1 });
usuarioSchema.index({ nivel: -1 });
usuarioSchema.index({ rank: 1 });

// Middleware para calcular o rank baseado nos pontos
usuarioSchema.pre('save', function(next) {
  if (this.isModified('pontos') || this.isModified('experiencia')) {
    // Calcular novo nível baseado na experiência
    const novoNivel = Math.floor(this.experiencia / 100) + 1;
    if (novoNivel !== this.nivel) {
      this.nivel = novoNivel;
      this.experienciaProximoNivel = novoNivel * 100;
    }
  }
  next();
});

export const Usuario = mongoose.model<IUsuario>('Usuario', usuarioSchema);
