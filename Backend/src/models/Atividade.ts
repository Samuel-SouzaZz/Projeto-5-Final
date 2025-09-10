import mongoose, { Document, Schema } from 'mongoose';

// Interface para uma questão/exercício
export interface IQuestao {
  titulo: string;
  descricao: string;
  dificuldade: 'facil' | 'medio' | 'dificil' | 'expert';
  linguagem: string;
  codigoInicial?: string;
  solucaoEsperada?: string;
  testCases: {
    entrada: string;
    saidaEsperada: string;
    descricao?: string;
  }[];
  dicas: string[];
  pontosRecompensa: number;
}

// Interface para o documento da atividade
export interface IAtividade extends Document {
  titulo: string;
  descricao: string;
  categoria: string;
  linguagem: string;
  dificuldade: 'facil' | 'medio' | 'dificil' | 'expert';
  questoes: IQuestao[];
  autor: mongoose.Types.ObjectId;
  tags: string[];
  pontosTotal: number;
  tempoEstimado: number; // em minutos
  visualizacoes: number;
  curtidas: mongoose.Types.ObjectId[];
  comentarios: {
    usuario: mongoose.Types.ObjectId;
    texto: string;
    data: Date;
  }[];
  usuariosCompletaram: {
    usuario: mongoose.Types.ObjectId;
    dataCompletacao: Date;
    pontuacao: number;
    tempoGasto: number; // em minutos
  }[];
  isPublica: boolean;
  isAprovada: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para questões
const questaoSchema = new Schema<IQuestao>({
  titulo: {
    type: String,
    required: [true, 'Título da questão é obrigatório'],
    trim: true,
    maxlength: [200, 'Título deve ter no máximo 200 caracteres']
  },
  descricao: {
    type: String,
    required: [true, 'Descrição da questão é obrigatória'],
    trim: true,
    maxlength: [2000, 'Descrição deve ter no máximo 2000 caracteres']
  },
  dificuldade: {
    type: String,
    enum: ['facil', 'medio', 'dificil', 'expert'],
    required: [true, 'Dificuldade é obrigatória']
  },
  linguagem: {
    type: String,
    required: [true, 'Linguagem é obrigatória'],
    trim: true
  },
  codigoInicial: {
    type: String,
    default: ''
  },
  solucaoEsperada: {
    type: String,
    default: ''
  },
  testCases: [{
    entrada: {
      type: String,
      required: true
    },
    saidaEsperada: {
      type: String,
      required: true
    },
    descricao: String
  }],
  dicas: [{
    type: String,
    maxlength: [500, 'Dica deve ter no máximo 500 caracteres']
  }],
  pontosRecompensa: {
    type: Number,
    required: true,
    min: [1, 'Pontos de recompensa devem ser pelo menos 1']
  }
}, { _id: false });

// Schema da atividade
const atividadeSchema = new Schema<IAtividade>({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true,
    minlength: [3, 'Título deve ter pelo menos 3 caracteres'],
    maxlength: [100, 'Título deve ter no máximo 100 caracteres']
  },
  descricao: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true,
    maxlength: [1000, 'Descrição deve ter no máximo 1000 caracteres']
  },
  categoria: {
    type: String,
    required: [true, 'Categoria é obrigatória'],
    trim: true
  },
  linguagem: {
    type: String,
    required: [true, 'Linguagem é obrigatória'],
    trim: true
  },
  dificuldade: {
    type: String,
    enum: ['facil', 'medio', 'dificil', 'expert'],
    required: [true, 'Dificuldade é obrigatória']
  },
  questoes: [questaoSchema],
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Autor é obrigatório']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  pontosTotal: {
    type: Number,
    default: 0,
    min: [0, 'Pontos totais não podem ser negativos']
  },
  tempoEstimado: {
    type: Number,
    required: [true, 'Tempo estimado é obrigatório'],
    min: [1, 'Tempo estimado deve ser pelo menos 1 minuto']
  },
  visualizacoes: {
    type: Number,
    default: 0,
    min: [0, 'Visualizações não podem ser negativas']
  },
  curtidas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  comentarios: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    texto: {
      type: String,
      required: [true, 'Texto do comentário é obrigatório'],
      trim: true,
      maxlength: [500, 'Comentário deve ter no máximo 500 caracteres']
    },
    data: {
      type: Date,
      default: Date.now
    }
  }],
  usuariosCompletaram: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    dataCompletacao: {
      type: Date,
      default: Date.now
    },
    pontuacao: {
      type: Number,
      required: true,
      min: [0, 'Pontuação não pode ser negativa']
    },
    tempoGasto: {
      type: Number,
      required: true,
      min: [0, 'Tempo gasto não pode ser negativo']
    }
  }],
  isPublica: {
    type: Boolean,
    default: false
  },
  isAprovada: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para melhor performance
atividadeSchema.index({ categoria: 1 });
atividadeSchema.index({ linguagem: 1 });
atividadeSchema.index({ dificuldade: 1 });
atividadeSchema.index({ autor: 1 });
atividadeSchema.index({ tags: 1 });
atividadeSchema.index({ isPublica: 1, isAprovada: 1 });
atividadeSchema.index({ pontosTotal: -1 });
atividadeSchema.index({ visualizacoes: -1 });

// Middleware para calcular pontos totais baseado nas questões
atividadeSchema.pre('save', function(next) {
  if (this.isModified('questoes')) {
    this.pontosTotal = this.questoes.reduce((total, questao) => total + questao.pontosRecompensa, 0);
  }
  next();
});

export const Atividade = mongoose.model<IAtividade>('Atividade', atividadeSchema); 