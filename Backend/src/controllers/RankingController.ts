import { Request, Response } from 'express';
import { Ranking } from '../models/Ranking';
import { Usuario } from '../models/Usuario';

class RankingController {
  // Obter ranking geral
  async obterRankingGeral(req: Request, res: Response) {
    try {
      const { 
        periodo = 'geral', 
        categoria,
        pagina = 1, 
        limite = 50 
      } = req.query;

      const paginaNum = parseInt(pagina as string);
      const limiteNum = parseInt(limite as string);
      const skip = (paginaNum - 1) * limiteNum;

      // Construir filtros
      const filtros: any = { periodo };
      if (categoria) filtros.categoria = categoria;

      const [rankings, total] = await Promise.all([
        Ranking.find(filtros)
          .populate('usuario', 'nome avatar nivel')
          .sort({ posicao: 1 })
          .skip(skip)
          .limit(limiteNum),
        
        Ranking.countDocuments(filtros)
      ]);

      const totalPaginas = Math.ceil(total / limiteNum);

      res.json({
        sucesso: true,
        dados: {
          rankings: rankings.map(ranking => ({
            posicao: ranking.posicao,
            usuario: ranking.usuario,
            pontosTotal: ranking.pontosTotal,
            nivel: ranking.nivel,
            estatisticas: {
              atividadesCompletadas: ranking.estatisticas.atividadesCompletadas,
              atividadesPublicadas: ranking.estatisticas.atividadesPublicadas,
              tempoTotalEstudo: ranking.estatisticas.tempoTotalEstudo,
              sequenciaAtual: ranking.estatisticas.sequenciaAtual,
              maiorSequencia: ranking.estatisticas.maiorSequencia,
              linguagensDominadas: ranking.estatisticas.linguagensDominadas,
              mediaAvaliacao: ranking.estatisticas.mediaAvaliacao
            }
          })),
          paginacao: {
            paginaAtual: paginaNum,
            totalPaginas,
            totalItens: total,
            itensPorPagina: limiteNum,
            temProxima: paginaNum < totalPaginas,
            temAnterior: paginaNum > 1
          },
          filtros: {
            periodo,
            categoria
          }
        }
      });
    } catch (error) {
      console.error('Erro ao obter ranking geral:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Obter posição do usuário no ranking
  async obterPosicaoUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { periodo = 'geral', categoria } = req.query;

      // Construir filtros
      const filtros: any = { usuario: id, periodo };
      if (categoria) filtros.categoria = categoria;

      const ranking = await Ranking.findOne(filtros)
        .populate('usuario', 'nome avatar nivel');

      if (!ranking) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado no ranking'
        });
      }

      // Buscar usuários próximos (5 acima e 5 abaixo)
      const posicaoAtual = ranking.posicao;
      const rankingsProximos = await Ranking.find({
        periodo: ranking.periodo,
        categoria: ranking.categoria,
        posicao: {
          $gte: Math.max(1, posicaoAtual - 5),
          $lte: posicaoAtual + 5
        }
      })
      .populate('usuario', 'nome avatar nivel')
      .sort({ posicao: 1 });

      res.json({
        sucesso: true,
        dados: {
          ranking: {
            posicao: ranking.posicao,
            usuario: ranking.usuario,
            pontosTotal: ranking.pontosTotal,
            nivel: ranking.nivel,
            estatisticas: ranking.estatisticas,
            ultimaAtualizacao: ranking.ultimaAtualizacao
          },
          proximosUsuarios: rankingsProximos.map(r => ({
            posicao: r.posicao,
            usuario: r.usuario,
            pontosTotal: r.pontosTotal,
            nivel: r.nivel,
            ehUsuarioAtual: r.usuario._id.toString() === id
          }))
        }
      });
    } catch (error) {
      console.error('Erro ao obter posição do usuário:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Obter estatísticas gerais do ranking
  async obterEstatisticas(req: Request, res: Response) {
    try {
      const { periodo = 'geral', categoria } = req.query;

      // Construir filtros
      const filtros: any = { periodo };
      if (categoria) filtros.categoria = categoria;

      const [
        totalUsuarios,
        maiorPontuacao,
        mediaPontuacao,
        usuarioMaisAtivo,
        linguagensMaisPopulares
      ] = await Promise.all([
        // Total de usuários no ranking
        Ranking.countDocuments(filtros),

        // Maior pontuação
        Ranking.findOne(filtros)
          .sort({ pontosTotal: -1 })
          .populate('usuario', 'nome avatar'),

        // Média de pontuação
        Ranking.aggregate([
          { $match: filtros },
          { $group: { _id: null, media: { $avg: '$pontosTotal' } } }
        ]),

        // Usuário mais ativo (mais atividades completadas)
        Ranking.findOne(filtros)
          .sort({ 'estatisticas.atividadesCompletadas': -1 })
          .populate('usuario', 'nome avatar'),

        // Linguagens mais populares
        Ranking.aggregate([
          { $match: filtros },
          { $unwind: '$estatisticas.linguagensDominadas' },
          { 
            $group: { 
              _id: '$estatisticas.linguagensDominadas', 
              count: { $sum: 1 } 
            } 
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      res.json({
        sucesso: true,
        dados: {
          estatisticasGerais: {
            totalUsuarios,
            mediaPontuacao: mediaPontuacao[0]?.media || 0,
            maiorPontuacao: {
              pontos: maiorPontuacao?.pontosTotal || 0,
              usuario: maiorPontuacao?.usuario
            },
            usuarioMaisAtivo: {
              atividadesCompletadas: usuarioMaisAtivo?.estatisticas.atividadesCompletadas || 0,
              usuario: usuarioMaisAtivo?.usuario
            },
            linguagensMaisPopulares: linguagensMaisPopulares.map(lang => ({
              linguagem: lang._id,
              usuariosAtivos: lang.count
            }))
          },
          filtros: {
            periodo,
            categoria
          }
        }
      });
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Recalcular rankings (rota administrativa)
  async recalcularRankings(req: Request, res: Response) {
    try {
      const { periodo = 'geral', categoria } = req.body;

      // Verificar se o usuário tem permissão (pode adicionar verificação de admin aqui)
      const usuario = req.usuario!;
      if (usuario.nivel < 10) { // Exemplo: apenas usuários nível 10+ podem recalcular
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Permissão insuficiente para recalcular rankings'
        });
      }

      const rankingsRecalculados = await (Ranking as any).recalcularRankings(periodo, categoria);

      res.json({
        sucesso: true,
        mensagem: 'Rankings recalculados com sucesso',
        dados: {
          totalRecalculados: rankingsRecalculados.length,
          periodo,
          categoria
        }
      });
    } catch (error) {
      console.error('Erro ao recalcular rankings:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Obter histórico de atividades de um usuário
  async obterHistoricoUsuario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { periodo = 'geral' } = req.query;

      const ranking = await Ranking.findOne({ 
        usuario: id, 
        periodo 
      })
      .populate('atividades.atividadeId', 'titulo categoria dificuldade')
      .populate('usuario', 'nome avatar nivel');

      if (!ranking) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Histórico não encontrado'
        });
      }

      // Ordenar atividades por data mais recente
      const atividadesOrdenadas = ranking.atividades
        .sort((a, b) => new Date(b.dataCompletacao).getTime() - new Date(a.dataCompletacao).getTime())
        .slice(0, 50); // Limitar a 50 atividades mais recentes

      res.json({
        sucesso: true,
        dados: {
          usuario: ranking.usuario,
          estatisticas: ranking.estatisticas,
          conquistas: ranking.conquistas,
          historicoAtividades: atividadesOrdenadas,
          resumo: {
            totalPontos: ranking.pontosTotal,
            posicaoAtual: ranking.posicao,
            atividadesCompletadas: ranking.estatisticas.atividadesCompletadas,
            tempoTotalEstudo: ranking.estatisticas.tempoTotalEstudo
          }
        }
      });
    } catch (error) {
      console.error('Erro ao obter histórico do usuário:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }
}

export default new RankingController(); 