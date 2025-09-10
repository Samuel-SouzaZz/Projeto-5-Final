import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario, IUsuario } from '../models/Usuario';
import { Ranking } from '../models/Ranking';

class UsuarioController {
  // Registrar novo usuário
  async registrar(req: Request, res: Response) {
    try {
      const { nome, email, senha, biografia, linguagensFavoritas } = req.body;

      // Verificar se o usuário já existe
      const usuarioExistente = await Usuario.findOne({ email });
      if (usuarioExistente) {
        return res.status(409).json({
          sucesso: false,
          mensagem: 'Usuário já existe com este email'
        });
      }

      // Criptografar senha
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const senhaHash = await bcrypt.hash(senha, saltRounds);

      // Criar usuário
      const novoUsuario = new Usuario({
        nome,
        email,
        senha: senhaHash,
        biografia: biografia || '',
        linguagensFavoritas: linguagensFavoritas || []
      });

      await novoUsuario.save();

      // Criar entrada no ranking
      const novoRanking = new Ranking({
        usuario: novoUsuario._id,
        posicao: await this.calcularPosicaoInicial(),
        pontosTotal: 0,
        nivel: 1,
        periodo: 'geral',
        estatisticas: {
          atividadesCompletadas: 0,
          atividadesPublicadas: 0,
          tempoTotalEstudo: 0,
          sequenciaAtual: 0,
          maiorSequencia: 0,
          linguagensDominadas: [],
          mediaAvaliacao: 0
        }
      });

      await novoRanking.save();

      // Gerar token
      const token = this.gerarToken(novoUsuario);

      res.status(201).json({
        sucesso: true,
        mensagem: 'Usuário criado com sucesso',
        dados: {
          usuario: {
            id: novoUsuario._id,
            nome: novoUsuario.nome,
            email: novoUsuario.email,
            avatar: novoUsuario.avatar,
            nivel: novoUsuario.nivel,
            pontos: novoUsuario.pontos,
            rank: novoUsuario.rank
          },
          token
        }
      });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Login do usuário
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      // Buscar usuário
      const usuario = await Usuario.findOne({ email });
      if (!usuario) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Credenciais inválidas'
        });
      }

      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Credenciais inválidas'
        });
      }

      // Verificar se a conta está ativa
      if (!usuario.isAtivo) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Conta desativada'
        });
      }

      // Atualizar último login
      usuario.ultimoLogin = new Date();
      await usuario.save();

      // Gerar token
      const token = this.gerarToken(usuario);

      res.json({
        sucesso: true,
        mensagem: 'Login realizado com sucesso',
        dados: {
          usuario: {
            id: usuario._id,
            nome: usuario.nome,
            email: usuario.email,
            avatar: usuario.avatar,
            nivel: usuario.nivel,
            pontos: usuario.pontos,
            rank: usuario.rank,
            biografia: usuario.biografia,
            linguagensFavoritas: usuario.linguagensFavoritas
          },
          token
        }
      });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Obter perfil do usuário logado
  async obterPerfil(req: Request, res: Response) {
    try {
      const usuario = req.usuario!;
      
      // Buscar ranking do usuário
      const ranking = await Ranking.findOne({ 
        usuario: usuario._id, 
        periodo: 'geral' 
      });

      res.json({
        sucesso: true,
        dados: {
          id: usuario._id,
          nome: usuario.nome,
          email: usuario.email,
          avatar: usuario.avatar,
          biografia: usuario.biografia,
          linguagensFavoritas: usuario.linguagensFavoritas,
          pontos: usuario.pontos,
          nivel: usuario.nivel,
          experiencia: usuario.experiencia,
          experienciaProximoNivel: usuario.experienciaProximoNivel,
          rank: usuario.rank,
          conquistas: usuario.conquistas,
          ranking: ranking?.estatisticas,
          createdAt: usuario.createdAt
        }
      });
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar perfil do usuário
  async atualizarPerfil(req: Request, res: Response) {
    try {
      const usuario = req.usuario!;
      const { nome, biografia, linguagensFavoritas } = req.body;

      // Atualizar campos permitidos
      if (nome) usuario.nome = nome;
      if (biografia !== undefined) usuario.biografia = biografia;
      if (linguagensFavoritas) usuario.linguagensFavoritas = linguagensFavoritas;

      await usuario.save();

      res.json({
        sucesso: true,
        mensagem: 'Perfil atualizado com sucesso',
        dados: {
          id: usuario._id,
          nome: usuario.nome,
          email: usuario.email,
          avatar: usuario.avatar,
          biografia: usuario.biografia,
          linguagensFavoritas: usuario.linguagensFavoritas
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Obter perfil público de um usuário
  async obterPerfilPublico(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const usuario = await Usuario.findById(id)
        .populate('atividadesPublicadas', 'titulo categoria dificuldade visualizacoes curtidas')
        .select('-senha');

      if (!usuario) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      // Buscar ranking do usuário
      const ranking = await Ranking.findOne({ 
        usuario: usuario._id, 
        periodo: 'geral' 
      });

      res.json({
        sucesso: true,
        dados: {
          id: usuario._id,
          nome: usuario.nome,
          avatar: usuario.avatar,
          biografia: usuario.biografia,
          linguagensFavoritas: usuario.linguagensFavoritas,
          pontos: usuario.pontos,
          nivel: usuario.nivel,
          rank: usuario.rank,
          conquistas: usuario.conquistas,
          atividadesPublicadas: usuario.atividadesPublicadas,
          estatisticas: ranking?.estatisticas,
          createdAt: usuario.createdAt
        }
      });
    } catch (error) {
      console.error('Erro ao obter perfil público:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Seguir usuário
  async seguirUsuario(req: Request, res: Response) {
    try {
      const usuarioLogado = req.usuario!;
      const { id } = req.params;

      if ((usuarioLogado._id as any).toString() === id) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Você não pode seguir a si mesmo'
        });
      }

      const usuarioParaSeguir = await Usuario.findById(id);
      if (!usuarioParaSeguir) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      // Verificar se já está seguindo
      const jaSeguindo = usuarioLogado.seguindo.includes(usuarioParaSeguir._id as any);
      if (jaSeguindo) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Você já está seguindo este usuário'
        });
      }

      // Adicionar aos arrays
      usuarioLogado.seguindo.push(usuarioParaSeguir._id as any);
      usuarioParaSeguir.seguidores.push(usuarioLogado._id as any);

      await Promise.all([
        usuarioLogado.save(),
        usuarioParaSeguir.save()
      ]);

      res.json({
        sucesso: true,
        mensagem: 'Usuário seguido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Parar de seguir usuário
  async pararDeSeguir(req: Request, res: Response) {
    try {
      const usuarioLogado = req.usuario!;
      const { id } = req.params;

      const usuarioParaPararDeSeguir = await Usuario.findById(id);
      if (!usuarioParaPararDeSeguir) {
        return res.status(404).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      // Remover dos arrays
      usuarioLogado.seguindo = usuarioLogado.seguindo.filter(
        seguindoId => seguindoId.toString() !== id
      );
      usuarioParaPararDeSeguir.seguidores = usuarioParaPararDeSeguir.seguidores.filter(
        seguidorId => seguidorId.toString() !== (usuarioLogado._id as any).toString()
      );

      await Promise.all([
        usuarioLogado.save(),
        usuarioParaPararDeSeguir.save()
      ]);

      res.json({
        sucesso: true,
        mensagem: 'Parou de seguir o usuário'
      });
    } catch (error) {
      console.error('Erro ao parar de seguir usuário:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Métodos auxiliares privados
  private gerarToken(usuario: IUsuario): string {
    const jwtSecret = process.env.JWT_SECRET!;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(
      { id: (usuario._id as any).toString(), email: usuario.email },
      jwtSecret,
      { expiresIn: jwtExpiresIn } as jwt.SignOptions
    );
  }

  private async calcularPosicaoInicial(): Promise<number> {
    const totalUsuarios = await Usuario.countDocuments();
    return totalUsuarios + 1;
  }
}

export default new UsuarioController(); 