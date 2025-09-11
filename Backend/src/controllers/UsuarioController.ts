import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario, IUsuario } from '../models/Usuario';
import { Ranking } from '../models/Ranking';
import { ResponseHelper } from '../utils/responseHelper';
import { asyncHandler, ErrorFactory } from '../utils/asyncHandler';
import { Logger } from '../utils/logger';
import { APP_CONFIG, MESSAGES } from '../utils/constants';

class UsuarioController {
  // Registrar novo usuário
  registrar = asyncHandler(async (req: Request, res: Response) => {
    const { nome, email, senha, biografia, linguagensFavoritas } = req.body;

    // Verificar se o usuário já existe
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      throw ErrorFactory.conflict(MESSAGES.USER_ALREADY_EXISTS);
    }

    // Criptografar senha
    const senhaHash = await bcrypt.hash(senha, APP_CONFIG.BCRYPT_SALT_ROUNDS);

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
    await this.criarRankingInicial(novoUsuario._id);

    // Gerar token
    const token = this.gerarToken(novoUsuario);

    Logger.info(`Novo usuário registrado: ${email}`);

    return ResponseHelper.created(res, {
      usuario: this.sanitizeUser(novoUsuario),
      token
    }, 'Usuário registrado com sucesso');
  });

  // Login do usuário
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, senha } = req.body;

    // Buscar usuário
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      throw ErrorFactory.unauthorized(MESSAGES.INVALID_CREDENTIALS);
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw ErrorFactory.unauthorized(MESSAGES.INVALID_CREDENTIALS);
    }

    // Verificar se a conta está ativa
    if (!usuario.isAtivo) {
      throw ErrorFactory.unauthorized(MESSAGES.ACCOUNT_DISABLED);
    }

    // Atualizar último login
    usuario.ultimoLogin = new Date();
    await usuario.save();

    // Gerar token
    const token = this.gerarToken(usuario);

    Logger.info(`Login realizado: ${email}`);

    return ResponseHelper.success(res, {
      usuario: this.sanitizeUser(usuario),
      token
    }, 'Login realizado com sucesso');
  });

  // Obter perfil próprio
  obterPerfil = asyncHandler(async (req: Request, res: Response) => {
    const usuario = req.usuario!;
    
    return ResponseHelper.success(res, this.sanitizeUser(usuario));
  });

  // Atualizar perfil
  atualizarPerfil = asyncHandler(async (req: Request, res: Response) => {
    const usuario = req.usuario!;
    const { nome, biografia, linguagensFavoritas, avatar } = req.body;

    // Atualizar campos permitidos
    if (nome !== undefined) usuario.nome = nome;
    if (biografia !== undefined) usuario.biografia = biografia;
    if (linguagensFavoritas !== undefined) usuario.linguagensFavoritas = linguagensFavoritas;
    if (avatar !== undefined) usuario.avatar = avatar;

    await usuario.save();

    Logger.info(`Perfil atualizado: ${usuario.email}`);

    return ResponseHelper.success(res, this.sanitizeUser(usuario), 'Perfil atualizado com sucesso');
  });

  // Obter perfil público
  obterPerfilPublico = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const usuario = await Usuario.findById(id)
      .populate('atividadesPublicadas', 'titulo categoria dificuldade curtidas createdAt')
      .select('-senha -email -ultimoLogin -isAtivo');

    if (!usuario) {
      throw ErrorFactory.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // Buscar estatísticas do ranking
    const ranking = await Ranking.findOne({ usuario: id, periodo: 'geral' });

    const perfilPublico = {
      ...usuario.toObject(),
      estatisticas: {
        atividadesCompletadas: usuario.atividadesRealizadas.length,
        atividadesPublicadas: usuario.atividadesPublicadas.length,
        seguidores: usuario.seguidores.length,
        seguindo: usuario.seguindo.length,
        ranking: ranking ? {
          posicao: ranking.posicao,
          pontosTotal: ranking.pontosTotal,
          nivel: ranking.nivel
        } : null
      }
    };

    return ResponseHelper.success(res, perfilPublico);
  });

  // Seguir usuário
  seguirUsuario = asyncHandler(async (req: Request, res: Response) => {
    const usuarioLogado = req.usuario!;
    const { id } = req.params;

    if ((usuarioLogado._id as any).toString() === id) {
      throw ErrorFactory.badRequest('Não é possível seguir a si mesmo');
    }

    const usuarioAlvo = await Usuario.findById(id);
    if (!usuarioAlvo) {
      throw ErrorFactory.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // Verificar se já está seguindo
    const jaSegue = usuarioLogado.seguindo.includes(usuarioAlvo._id as any);
    if (jaSegue) {
      throw ErrorFactory.conflict('Já está seguindo este usuário');
    }

    // Adicionar aos arrays
    usuarioLogado.seguindo.push(usuarioAlvo._id as any);
    usuarioAlvo.seguidores.push(usuarioLogado._id as any);

    await Promise.all([usuarioLogado.save(), usuarioAlvo.save()]);

    Logger.info(`${usuarioLogado.email} começou a seguir ${usuarioAlvo.email}`);

    return ResponseHelper.success(res, {
      seguindo: true,
      totalSeguidores: usuarioAlvo.seguidores.length
    }, 'Usuário seguido com sucesso');
  });

  // Parar de seguir usuário
  pararDeSeguir = asyncHandler(async (req: Request, res: Response) => {
    const usuarioLogado = req.usuario!;
    const { id } = req.params;

    const usuarioAlvo = await Usuario.findById(id);
    if (!usuarioAlvo) {
      throw ErrorFactory.notFound(MESSAGES.USER_NOT_FOUND);
    }

    // Verificar se está seguindo
    const segueIndex = usuarioLogado.seguindo.findIndex(
      (seguindoId) => seguindoId.toString() === id
    );
    
    if (segueIndex === -1) {
      throw ErrorFactory.badRequest('Não estava seguindo este usuário');
    }

    // Remover dos arrays
    usuarioLogado.seguindo.splice(segueIndex, 1);
         const seguidorIndex = usuarioAlvo.seguidores.findIndex(
       (seguidorId) => seguidorId.toString() === (usuarioLogado._id as any).toString()
     );
    usuarioAlvo.seguidores.splice(seguidorIndex, 1);

    await Promise.all([usuarioLogado.save(), usuarioAlvo.save()]);

    Logger.info(`${usuarioLogado.email} parou de seguir ${usuarioAlvo.email}`);

    return ResponseHelper.success(res, {
      seguindo: false,
      totalSeguidores: usuarioAlvo.seguidores.length
    }, 'Parou de seguir o usuário com sucesso');
  });

  // Métodos privados
     private gerarToken(usuario: IUsuario): string {
     if (!APP_CONFIG.JWT_SECRET) {
       throw ErrorFactory.internal('JWT_SECRET não configurado');
     }

     return jwt.sign(
       { id: (usuario._id as any).toString(), email: usuario.email },
       APP_CONFIG.JWT_SECRET,
       { expiresIn: APP_CONFIG.JWT_EXPIRES_IN } as jwt.SignOptions
     );
   }

  private sanitizeUser(usuario: IUsuario) {
    const { senha, ...usuarioSemSenha } = usuario.toObject();
    return usuarioSemSenha;
  }

  private async criarRankingInicial(usuarioId: any): Promise<void> {
    const posicaoInicial = await this.calcularPosicaoInicial();
    
    const novoRanking = new Ranking({
      usuario: usuarioId,
      posicao: posicaoInicial,
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
  }

  private async calcularPosicaoInicial(): Promise<number> {
    const totalUsuarios = await Usuario.countDocuments();
    return totalUsuarios + 1;
  }
}

export default new UsuarioController(); 