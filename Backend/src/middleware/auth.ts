import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario, IUsuario } from '../models/Usuario';

// Estender a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      usuario?: IUsuario;
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
}

class AuthMiddleware {
  // Middleware para verificar se o usuário está autenticado
  async verificarToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Token de acesso não fornecido'
        });
      }

      const token = authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Token de acesso inválido'
        });
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return res.status(500).json({
          sucesso: false,
          mensagem: 'Erro de configuração do servidor'
        });
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      
      const usuario = await Usuario.findById(decoded.id);
      if (!usuario) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Usuário não encontrado'
        });
      }

      if (!usuario.isAtivo) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Conta de usuário desativada'
        });
      }

      req.usuario = usuario;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Token inválido'
        });
      }
      
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Token expirado'
        });
      }

      console.error('Erro no middleware de autenticação:', error);
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor'
      });
    }
  }

  // Middleware opcional - não falha se não houver token
  async verificarTokenOpcional(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return next();
      }

      const token = authHeader.split(' ')[1];
      
      if (!token) {
        return next();
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next();
      }

      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      const usuario = await Usuario.findById(decoded.id);
      
      if (usuario && usuario.isAtivo) {
        req.usuario = usuario;
      }
      
      next();
    } catch (error) {
      // Em caso de erro, apenas continue sem autenticar
      next();
    }
  }

  // Middleware para verificar se o usuário é o dono do recurso
  verificarProprietario(campo: string = 'autor') {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.usuario) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Usuário não autenticado'
        });
      }

      // Esta verificação será feita no controller específico
      // onde temos acesso ao recurso
      next();
    };
  }

  // Middleware para verificar nível mínimo do usuário
  verificarNivelMinimo(nivelMinimo: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.usuario) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Usuário não autenticado'
        });
      }

      if (req.usuario.nivel < nivelMinimo) {
        return res.status(403).json({
          sucesso: false,
          mensagem: `Nível mínimo ${nivelMinimo} necessário`
        });
      }

      next();
    };
  }
}

export default new AuthMiddleware(); 