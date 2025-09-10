import { Request, Response } from 'express';
import { Atividade } from '../models/Atividade';
import { Usuario } from '../models/Usuario';
import { Ranking } from '../models/Ranking';

class AtividadeController {
  // Criar nova atividade
  async criar(req: Request, res: Response) {
    try {
      const usuario = req.usuario!;
      const dadosAtividade = {
        ...req.body,
        autor: (usuario._id as any)
      };

      const novaAtividade = new Atividade(dadosAtividade);
      await novaAtividade.save();

      // Adicionar à lista de atividades publicadas do usuário
      usuario.atividadesPublicadas.push(novaAtividade._id as any);
      await usuario.save();

      // Atualizar estatísticas do ranking
      const ranking = await Ranking.findOne({ 
        usuario: usuario._id, 
        periodo: 'geral' 
      });

      if (ranking) {
        ranking.estatisticas.atividadesPublicadas += 1;
        await ranking.save();
      }

      res.status(201).json({
        sucesso: true,
        mensagem: 'Atividade criada com sucesso',
        dados: novaAtividade
      });
    } catch (error) {
      console.error('Erro ao criar atividade:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Listar atividades com filtros e paginação
  async listar(req: Request, res: Response) {
    try {
      const {
        categoria,
        linguagem,
        dificuldade,
        autor,
        tags,
        busca,
        pagina = 1,
        limite = 10,
        ordenacao = 'recente'
      } = req.query;

      // Construir filtros
      const filtros: any = {
        isPublica: true,
        isAprovada: true
      };

      if (categoria) filtros.categoria = categoria;
      if (linguagem) filtros.linguagem = linguagem;
      if (dificuldade) filtros.dificuldade = dificuldade;
      if (autor) filtros.autor = autor;
      
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : [tags];
        filtros.tags = { $in: tagsArray };
      }

      if (busca) {
        filtros.$or = [
          { titulo: { $regex: busca, $options: 'i' } },
          { descricao: { $regex: busca, $options: 'i' } },
          { tags: { $regex: busca, $options: 'i' } }
        ];
      }

      // Definir ordenação
      let ordenacaoObj: any = {};
      switch (ordenacao) {
        case 'antigo':
          ordenacaoObj = { createdAt: 1 };
          break;
        case 'populares':
          ordenacaoObj = { visualizacoes: -1 };
          break;
        case 'pontos':
          ordenacaoObj = { pontosTotal: -1 };
          break;
        default:
          ordenacaoObj = { createdAt: -1 };
      }

      const paginaNum = parseInt(pagina as string);
      const limiteNum = parseInt(limite as string);
      const skip = (paginaNum - 1) * limiteNum;

      const [atividades, total] = await Promise.all([
        Atividade.find(filtros)
          .populate('autor', 'nome avatar nivel')
          .sort(ordenacaoObj)
          .skip(skip)
          .limit(limiteNum)
          .select('-questoes.solucaoEsperada'), // Não mostrar soluções na listagem

        Atividade.countDocuments(filtros)
      ]);

      const totalPaginas = Math.ceil(total / limiteNum);

      res.json({
        sucesso: true,
        dados: {
          atividades,
          paginacao: {
            paginaAtual: paginaNum,
            totalPaginas,
            totalItens: total,
            itensPorPagina: limiteNum,
            temProxima: paginaNum < totalPaginas,
            temAnterior: paginaNum > 1
          }
        }
      });
    } catch (error) {
      console.error('Erro ao listar atividades:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Obter detalhes de uma atividade específica
  async obterPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = req.usuario; // Opcional

      const atividade = await Atividade.findById(id)
        .populate('autor', 'nome avatar nivel pontos')
        .populate('comentarios.usuario', 'nome avatar nivel');

      if (!atividade) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Atividade não encontrada'
        });
      }

      // Verificar se pode ver a atividade
      if (!atividade.isPublica && (!usuario || atividade.autor._id.toString() !== (usuario._id as any).toString())) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Acesso negado'
        });
      }

      // Incrementar visualizações se não for o autor
      if (!usuario || atividade.autor._id.toString() !== (usuario._id as any).toString()) {
        atividade.visualizacoes += 1;
        await atividade.save();
      }

      // Preparar resposta (remover soluções se não for o autor)
      const atividadeObj = atividade.toObject();
      if (!usuario || atividade.autor._id.toString() !== (usuario._id as any).toString()) {
        atividadeObj.questoes = atividadeObj.questoes.map((questao: any) => {
          const { solucaoEsperada, ...questaoSemSolucao } = questao;
          return questaoSemSolucao;
        });
      }

      // Verificar se o usuário já completou
      let jaCompletou = false;
      if (usuario) {
        jaCompletou = atividade.usuariosCompletaram.some(
          (completacao: any) => completacao.usuario.toString() === (usuario._id as any).toString()
        );
      }

      res.json({
        sucesso: true,
        dados: {
          ...atividadeObj,
          jaCompletou,
          totalCompletacoes: atividade.usuariosCompletaram.length,
          totalCurtidas: atividade.curtidas.length
        }
      });
    } catch (error) {
      console.error('Erro ao obter atividade:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar atividade (apenas o autor)
  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = req.usuario!;
      const dadosAtualizacao = req.body;

      const atividade = await Atividade.findById(id);
      if (!atividade) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Atividade não encontrada'
        });
      }

      // Verificar se é o autor
      if (atividade.autor.toString() !== (usuario._id as any).toString()) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Apenas o autor pode atualizar esta atividade'
        });
      }

      // Atualizar campos permitidos
      Object.assign(atividade, dadosAtualizacao);
      await atividade.save();

      res.json({
        sucesso: true,
        mensagem: 'Atividade atualizada com sucesso',
        dados: atividade
      });
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Deletar atividade (apenas o autor)
  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = req.usuario!;

      const atividade = await Atividade.findById(id);
      if (!atividade) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Atividade não encontrada'
        });
      }

      // Verificar se é o autor
      if (atividade.autor.toString() !== (usuario._id as any).toString()) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Apenas o autor pode deletar esta atividade'
        });
      }

      await Atividade.findByIdAndDelete(id);

      // Remover da lista de atividades publicadas do usuário
      usuario.atividadesPublicadas = usuario.atividadesPublicadas.filter(
        (atividadeId: any) => atividadeId.toString() !== id
      );
      await usuario.save();

      res.json({
        sucesso: true,
        mensagem: 'Atividade deletada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Curtir/descurtir atividade
  async curtir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = req.usuario!;

      const atividade = await Atividade.findById(id);
      if (!atividade) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Atividade não encontrada'
        });
      }

      const jaCurtiu = atividade.curtidas.includes(usuario._id as any);

      if (jaCurtiu) {
        // Remover curtida
        atividade.curtidas = atividade.curtidas.filter(
          (curtidaId: any) => curtidaId.toString() !== (usuario._id as any).toString()
        );
      } else {
        // Adicionar curtida
        atividade.curtidas.push(usuario._id as any);
      }

      await atividade.save();

      res.json({
        sucesso: true,
        mensagem: jaCurtiu ? 'Curtida removida' : 'Atividade curtida',
        dados: {
          curtiu: !jaCurtiu,
          totalCurtidas: atividade.curtidas.length
        }
      });
    } catch (error) {
      console.error('Erro ao curtir atividade:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Adicionar comentário
  async adicionarComentario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { texto } = req.body;
      const usuario = req.usuario!;

      const atividade = await Atividade.findById(id);
      if (!atividade) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Atividade não encontrada'
        });
      }

      const novoComentario = {
        usuario: usuario._id as any,
        texto,
        data: new Date()
      };

      atividade.comentarios.push(novoComentario as any);
      await atividade.save();

      // Popular o comentário para retorno
      await atividade.populate('comentarios.usuario', 'nome avatar nivel');

      const comentarioAdicionado = atividade.comentarios[atividade.comentarios.length - 1];

      res.status(201).json({
        sucesso: true,
        mensagem: 'Comentário adicionado com sucesso',
        dados: comentarioAdicionado
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Marcar atividade como completada
  async marcarComoCompletada(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { pontuacao, tempoGasto } = req.body;
      const usuario = req.usuario!;

      const atividade = await Atividade.findById(id);
      if (!atividade) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Atividade não encontrada'
        });
      }

      // Verificar se já completou
      const jaCompletou = atividade.usuariosCompletaram.some(
        (completacao: any) => completacao.usuario.toString() === (usuario._id as any).toString()
      );

      if (jaCompletou) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Atividade já foi completada'
        });
      }

      // Adicionar à lista de completados
      const completacao = {
        usuario: usuario._id as any,
        dataCompletacao: new Date(),
        pontuacao: pontuacao || atividade.pontosTotal,
        tempoGasto: tempoGasto || 0
      };

      atividade.usuariosCompletaram.push(completacao as any);
      await atividade.save();

      // Atualizar pontos e experiência do usuário
      const pontosGanhos = Math.floor((pontuacao / 100) * atividade.pontosTotal);
      usuario.pontos += pontosGanhos;
      usuario.experiencia += pontosGanhos;

      // Adicionar à lista de atividades realizadas
      if (!usuario.atividadesRealizadas.includes(atividade._id as any)) {
        usuario.atividadesRealizadas.push(atividade._id as any);
      }

      await usuario.save();

      // Atualizar ranking
      const ranking = await Ranking.findOne({ 
        usuario: usuario._id, 
        periodo: 'geral' 
      });

      if (ranking) {
        ranking.pontosTotal += pontosGanhos;
        ranking.estatisticas.atividadesCompletadas += 1;
        ranking.estatisticas.tempoTotalEstudo += tempoGasto || 0;
        
        // Adicionar atividade ao histórico
        ranking.atividades.push({
          atividadeId: atividade._id as any,
          pontos: pontosGanhos,
          dataCompletacao: new Date()
        } as any);

        await ranking.save();
      }

      res.json({
        sucesso: true,
        mensagem: 'Atividade marcada como completada',
        dados: {
          pontosGanhos,
          novosPontos: usuario.pontos,
          novaExperiencia: usuario.experiencia,
          novoNivel: usuario.nivel
        }
      });
    } catch (error) {
      console.error('Erro ao marcar atividade como completada:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }
}

export default new AtividadeController(); 