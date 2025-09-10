import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

class ValidacaoMiddleware {
  // Middleware genérico para validação
  validar(schema: Joi.ObjectSchema, propriedade: 'body' | 'query' | 'params' = 'body') {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req[propriedade], { abortEarly: false });
      
      if (error) {
        const erros = error.details.map(detail => ({
          campo: detail.path.join('.'),
          mensagem: detail.message
        }));

        return res.status(400).json({
          sucesso: false,
          mensagem: 'Dados inválidos',
          erros
        });
      }

      next();
    };
  }

  // Schemas de validação para usuários
  get usuarioSchemas() {
    return {
      registro: Joi.object({
        nome: Joi.string()
          .min(2)
          .max(50)
          .trim()
          .required()
          .messages({
            'string.min': 'Nome deve ter pelo menos 2 caracteres',
            'string.max': 'Nome deve ter no máximo 50 caracteres',
            'any.required': 'Nome é obrigatório'
          }),
        email: Joi.string()
          .email()
          .lowercase()
          .trim()
          .required()
          .messages({
            'string.email': 'Email deve ter um formato válido',
            'any.required': 'Email é obrigatório'
          }),
        senha: Joi.string()
          .min(6)
          .required()
          .messages({
            'string.min': 'Senha deve ter pelo menos 6 caracteres',
            'any.required': 'Senha é obrigatória'
          }),
        biografia: Joi.string()
          .max(500)
          .allow('')
          .messages({
            'string.max': 'Biografia deve ter no máximo 500 caracteres'
          }),
        linguagensFavoritas: Joi.array()
          .items(Joi.string().trim())
          .default([])
      }),

      login: Joi.object({
        email: Joi.string()
          .email()
          .required()
          .messages({
            'string.email': 'Email deve ter um formato válido',
            'any.required': 'Email é obrigatório'
          }),
        senha: Joi.string()
          .required()
          .messages({
            'any.required': 'Senha é obrigatória'
          })
      }),

      atualizacao: Joi.object({
        nome: Joi.string()
          .min(2)
          .max(50)
          .trim()
          .messages({
            'string.min': 'Nome deve ter pelo menos 2 caracteres',
            'string.max': 'Nome deve ter no máximo 50 caracteres'
          }),
        biografia: Joi.string()
          .max(500)
          .allow('')
          .messages({
            'string.max': 'Biografia deve ter no máximo 500 caracteres'
          }),
        linguagensFavoritas: Joi.array()
          .items(Joi.string().trim())
      })
    };
  }

  // Schemas de validação para atividades
  get atividadeSchemas() {
    return {
      criacao: Joi.object({
        titulo: Joi.string()
          .min(3)
          .max(100)
          .trim()
          .required()
          .messages({
            'string.min': 'Título deve ter pelo menos 3 caracteres',
            'string.max': 'Título deve ter no máximo 100 caracteres',
            'any.required': 'Título é obrigatório'
          }),
        descricao: Joi.string()
          .max(1000)
          .trim()
          .required()
          .messages({
            'string.max': 'Descrição deve ter no máximo 1000 caracteres',
            'any.required': 'Descrição é obrigatória'
          }),
        categoria: Joi.string()
          .trim()
          .required()
          .messages({
            'any.required': 'Categoria é obrigatória'
          }),
        linguagem: Joi.string()
          .trim()
          .required()
          .messages({
            'any.required': 'Linguagem é obrigatória'
          }),
        dificuldade: Joi.string()
          .valid('facil', 'medio', 'dificil', 'expert')
          .required()
          .messages({
            'any.only': 'Dificuldade deve ser: facil, medio, dificil ou expert',
            'any.required': 'Dificuldade é obrigatória'
          }),
        tempoEstimado: Joi.number()
          .min(1)
          .required()
          .messages({
            'number.min': 'Tempo estimado deve ser pelo menos 1 minuto',
            'any.required': 'Tempo estimado é obrigatório'
          }),
        tags: Joi.array()
          .items(Joi.string().trim().lowercase())
          .default([]),
        questoes: Joi.array()
          .items(
            Joi.object({
              titulo: Joi.string()
                .max(200)
                .trim()
                .required()
                .messages({
                  'string.max': 'Título da questão deve ter no máximo 200 caracteres',
                  'any.required': 'Título da questão é obrigatório'
                }),
              descricao: Joi.string()
                .max(2000)
                .trim()
                .required()
                .messages({
                  'string.max': 'Descrição da questão deve ter no máximo 2000 caracteres',
                  'any.required': 'Descrição da questão é obrigatória'
                }),
              dificuldade: Joi.string()
                .valid('facil', 'medio', 'dificil', 'expert')
                .required(),
              linguagem: Joi.string()
                .trim()
                .required(),
              codigoInicial: Joi.string().allow('').default(''),
              solucaoEsperada: Joi.string().allow('').default(''),
              testCases: Joi.array()
                .items(
                  Joi.object({
                    entrada: Joi.string().required(),
                    saidaEsperada: Joi.string().required(),
                    descricao: Joi.string().allow('')
                  })
                )
                .min(1)
                .required()
                .messages({
                  'array.min': 'Pelo menos um caso de teste é obrigatório'
                }),
              dicas: Joi.array()
                .items(Joi.string().max(500))
                .default([]),
              pontosRecompensa: Joi.number()
                .min(1)
                .required()
                .messages({
                  'number.min': 'Pontos de recompensa devem ser pelo menos 1'
                })
            })
          )
          .min(1)
          .required()
          .messages({
            'array.min': 'Pelo menos uma questão é obrigatória'
          }),
        isPublica: Joi.boolean().default(false)
      }),

      atualizacao: Joi.object({
        titulo: Joi.string()
          .min(3)
          .max(100)
          .trim(),
        descricao: Joi.string()
          .max(1000)
          .trim(),
        categoria: Joi.string().trim(),
        linguagem: Joi.string().trim(),
        dificuldade: Joi.string()
          .valid('facil', 'medio', 'dificil', 'expert'),
        tempoEstimado: Joi.number().min(1),
        tags: Joi.array()
          .items(Joi.string().trim().lowercase()),
        isPublica: Joi.boolean()
      }),

      filtros: Joi.object({
        categoria: Joi.string().trim(),
        linguagem: Joi.string().trim(),
        dificuldade: Joi.string()
          .valid('facil', 'medio', 'dificil', 'expert'),
        autor: Joi.string().length(24), // ObjectId do MongoDB
        tags: Joi.alternatives().try(
          Joi.string().trim(),
          Joi.array().items(Joi.string().trim())
        ),
        busca: Joi.string().trim(),
        pagina: Joi.number().min(1).default(1),
        limite: Joi.number().min(1).max(50).default(10),
        ordenacao: Joi.string()
          .valid('recente', 'antigo', 'populares', 'pontos')
          .default('recente')
      })
    };
  }

  // Schema para comentários
  get comentarioSchema() {
    return Joi.object({
      texto: Joi.string()
        .min(1)
        .max(500)
        .trim()
        .required()
        .messages({
          'string.min': 'Comentário não pode estar vazio',
          'string.max': 'Comentário deve ter no máximo 500 caracteres',
          'any.required': 'Texto do comentário é obrigatório'
        })
    });
  }

  // Schema para parâmetros de ID
  get idSchema() {
    return Joi.object({
      id: Joi.string()
        .length(24)
        .required()
        .messages({
          'string.length': 'ID deve ter 24 caracteres',
          'any.required': 'ID é obrigatório'
        })
    });
  }
}

export default new ValidacaoMiddleware(); 