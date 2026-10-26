import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../lib/http';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  name: string;
}

// Express Request'e kullanici alanini ekle.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

/** Authorization: Bearer <token> dogrular, req.user'i doldurur. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Yetkilendirme gerekli.');
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & AuthUser;
    req.user = { id: payload.id, email: payload.email, role: payload.role, name: payload.name };
    next();
  } catch {
    throw new ApiError(401, 'Oturum gecersiz veya suresi dolmus.');
  }
}

/** Belirli rolleri zorunlu kilar (requireAuth'tan sonra kullanilir). */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Bu islem icin yetkiniz yok.');
    }
    next();
  };
}
