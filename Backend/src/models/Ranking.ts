import mongoose, { Document, Schema } from 'mongoose';

// Interface para o documento de ranking
export interface IRanking extends Document {
  usuario: mongoose.Types.ObjectId;
  posicao: number;
  pontosTotal: number;
  nivel: number;
  categoria?: string; // ranking geral ou por categoria específica
  periodo: 'semanal' | 'mensal' | 'anual' | 'geral';
  atividades: {
    atividadeId: mongoose.Types.ObjectId;
    pontos: number;
    dataCompletacao: Date;
  }[];
  conquistas: {
    nome: string;
    descricao: string;
    icone: string;
    dataObtencao: Date;
    pontos: number;
  }[];
  estatisticas: {
    atividadesCompletadas: number;
    atividadesPublicadas: number;
    tempoTotalEstudo: number; // em minutos
    sequenciaAtual: number; // dias consecutivos
    maiorSequencia: number;
    linguagensDominadas: string[];
    mediaAvaliacao: number;
  };
  ultimaAtualizacao: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do ranking
const rankingSchema = new Schema<IRanking>({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'Usuário é obrigatório']
  },
  posicao: {
    type: Number,
    required: [true, 'Posição é obrigatória'],
    min: [1, 'Posição deve ser pelo menos 1']
  },
  pontosTotal: {
    type: Number,
    required: [true, 'Pontos total é obrigatório'],
    default: 0,
    min: [0, 'Pontos não podem ser negativos']
  },
  nivel: {
    type: Number,
    required: [true, 'Nível é obrigatório'],
    default: 1,
    min: [1, 'Nível mínimo é 1']
  },
  categoria: {
    type: String,
    trim: true,
    default: null
  },
  periodo: {
    type: String,
    enum: ['semanal', 'mensal', 'anual', 'geral'],
    required: [true, 'Período é obrigatório'],
    default: 'geral'
  },
  atividades: [{
    atividadeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Atividade',
      required: true
    },
    pontos: {
      type: Number,
      required: true,
      min: [0, 'Pontos não podem ser negativos']
    },
    dataCompletacao: {
      type: Date,
      required: true
    }
  }],
  conquistas: [{
    nome: {
      type: String,
      required: [true, 'Nome da conquista é obrigatório'],
      trim: true
    },
    descricao: {
      type: String,
      required: [true, 'Descrição da conquista é obrigatória'],
      trim: true
    },
    icone: {
      type: String,
      required: [true, 'Ícone da conquista é obrigatório'],
      trim: true
    },
    dataObtencao: {
      type: Date,
      required: true,
      default: Date.now
    },
    pontos: {
      type: Number,
      required: true,
      min: [0, 'Pontos da conquista não podem ser negativos']
    }
  }],
  estatisticas: {
    atividadesCompletadas: {
      type: Number,
      default: 0,
      min: [0, 'Atividades completadas não podem ser negativas']
    },
    atividadesPublicadas: {
      type: Number,
      default: 0,
      min: [0, 'Atividades publicadas não podem ser negativas']
    },
    tempoTotalEstudo: {
      type: Number,
      default: 0,
      min: [0, 'Tempo total de estudo não pode ser negativo']
    },
    sequenciaAtual: {
      type: Number,
      default: 0,
      min: [0, 'Sequência atual não pode ser negativa']
    },
    maiorSequencia: {
      type: Number,
      default: 0,
      min: [0, 'Maior sequência não pode ser negativa']
    },
    linguagensDominadas: [{
      type: String,
      trim: true
    }],
    mediaAvaliacao: {
      type: Number,
      default: 0,
      min: [0, 'Média de avaliação não pode ser negativa'],
      max: [5, 'Média de avaliação não pode ser maior que 5']
    }
  },
  ultimaAtualizacao: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índices para melhor performance
rankingSchema.index({ usuario: 1, periodo: 1, categoria: 1 }, { unique: true });
rankingSchema.index({ posicao: 1, periodo: 1, categoria: 1 });
rankingSchema.index({ pontosTotal: -1, periodo: 1, categoria: 1 });
rankingSchema.index({ nivel: -1 });
rankingSchema.index({ ultimaAtualizacao: 1 });

// Middleware para atualizar a posição baseada nos pontos
rankingSchema.pre('save', function(next) {
  if (this.isModified('pontosTotal')) {
    this.ultimaAtualizacao = new Date();
  }
  next();
});

// Método estático para recalcular rankings
rankingSchema.statics.recalcularRankings = async function(periodo: string = 'geral', categoria?: string) {
  const filtro: any = { periodo };
  if (categoria) filtro.categoria = categoria;

  const rankings = await this.find(filtro).sort({ pontosTotal: -1 });
  
  for (let i = 0; i < rankings.length; i++) {
    rankings[i].posicao = i + 1;
    await rankings[i].save();
  }
  
  return rankings;
};

// Método para adicionar conquista
rankingSchema.methods.adicionarConquista = function(conquista: {
  nome: string;
  descricao: string;
  icone: string;
  pontos: number;
}) {
  // Verificar se a conquista já existe
  const conquistaExiste = this.conquistas.some((c: any) => c.nome === conquista.nome);
  
  if (!conquistaExiste) {
    this.conquistas.push({
      ...conquista,
      dataObtencao: new Date()
    });
    this.pontosTotal += conquista.pontos;
    return true;
  }
  return false;
};

export const Ranking = mongoose.model<IRanking>('Ranking', rankingSchema); 