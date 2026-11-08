import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: number;
      username: string;
      email: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as {
        id: number;
        username: string;
        email: string;
      };
      req.user = decoded;
    } catch {
      // Ignore token failure for optional auth
    }
  }
  next();
}

export function adminAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check admin key / secret header
  const adminKey =
    req.headers['x-admin-key'] ||
    req.headers['x-admin-token'] ||
    req.headers['admin-secret'];
  const configuredAdminKey = process.env.ADMIN_KEY || process.env.ADMIN_SECRET || 'pitchpredict-admin-secret-2026';

  if (adminKey && (adminKey === configuredAdminKey || adminKey === config.jwtSecret)) {
    return next();
  }

  // Check JWT session
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      req.user = decoded;
      if (
        decoded.role === 'admin' ||
        decoded.isAdmin === true ||
        decoded.is_admin === true ||
        decoded.username?.toLowerCase() === 'admin' ||
        decoded.email?.toLowerCase().includes('admin')
      ) {
        return next();
      }
    } catch {
      // Invalid token
    }
  }

  return res.status(403).json({ error: 'Admin authorization required. Access denied.' });
}
