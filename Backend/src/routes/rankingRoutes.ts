import { Router } from 'express';
import RankingController from '../controllers/RankingController';
import AuthMiddleware from '../middleware/auth';
import ValidacaoMiddleware from '../middleware/validacao';

const router = Router();

// Rotas públicas
router.get(
  '/',
  RankingController.obterRankingGeral
);

router.get(
  '/estatisticas',
  RankingController.obterEstatisticas
);

router.get(
  '/usuario/:id',
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  RankingController.obterPosicaoUsuario
);

router.get(
  '/usuario/:id/historico',
  ValidacaoMiddleware.validar(ValidacaoMiddleware.idSchema, 'params'),
  RankingController.obterHistoricoUsuario
);

// Rotas administrativas (protegidas)
router.post(
  '/recalcular',
  AuthMiddleware.verificarToken,
  RankingController.recalcularRankings
);

export default router; 