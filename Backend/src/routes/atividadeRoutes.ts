import { Router } from 'express';
import AtividadeController from '../controllers/AtividadeController';
import AuthMiddleware from '../middleware/auth';
import ValidacaoMiddleware from '../middleware/validacao';

const router = Router();

// Rotas públicas ou semi-públicas
router.get(
  '/',
  ValidacaoMiddleware.validar(ValidacaoMiddleware.atividadeSchemas.filtros, 'query'),
  AuthMiddleware.verificarTokenOpcional,
  AtividadeController.listar
);

router.get(
  '/:id',
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  AuthMiddleware.verificarTokenOpcional,
  AtividadeController.obterPorId
);

// Rotas protegidas (requerem autenticação)
router.post(
  '/',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.atividadeSchemas.criacao),
  AtividadeController.criar
);

router.put(
  '/:id',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  ValidacaoMiddleware.validar(ValidacaoMiddleware.atividadeSchemas.atualizacao),
  AtividadeController.atualizar
);

router.delete(
  '/:id',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  AtividadeController.deletar
);

router.post(
  '/:id/curtir',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  AtividadeController.curtir
);

router.post(
  '/:id/comentarios',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  ValidacaoMiddleware.validar(ValidacaoMiddleware.comentarioSchema),
  AtividadeController.adicionarComentario
);

router.post(
  '/:id/completar',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  AtividadeController.marcarComoCompletada
);

export default router; 