import { Router } from 'express';
import UsuarioController from '../controllers/UsuarioController';
import AuthMiddleware from '../middleware/auth';
import ValidacaoMiddleware from '../middleware/validacao';

const router = Router();

// Rotas públicas (sem autenticação)
router.post(
  '/registrar',
  ValidacaoMiddleware.validar(ValidacaoMiddleware.usuarioSchemas.registro),
  UsuarioController.registrar
);

router.post(
  '/login',
  ValidacaoMiddleware.validar(ValidacaoMiddleware.usuarioSchemas.login),
  UsuarioController.login
);

router.get(
  '/:id/publico',
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  UsuarioController.obterPerfilPublico
);

// Rotas protegidas (com autenticação)
router.get(
  '/perfil',
  AuthMiddleware.verificarToken,
  UsuarioController.obterPerfil
);

router.put(
  '/perfil',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.usuarioSchemas.atualizacao),
  UsuarioController.atualizarPerfil
);

router.post(
  '/:id/seguir',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  UsuarioController.seguirUsuario
);

router.delete(
  '/:id/seguir',
  AuthMiddleware.verificarToken,
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  UsuarioController.pararDeSeguir
);

export default router; 