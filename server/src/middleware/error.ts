import { Prisma } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../lib/http';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Kaynak bulunamadi.' });
}

// Merkezi hata yakalayici. Express 4'te 4 parametreli imza zorunludur.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'Gecersiz veri.',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique kisit ihlali
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'alan';
      return res.status(409).json({ error: `Bu ${target} zaten kayitli.` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Kayit bulunamadi.' });
    }
  }

  // eslint-disable-next-line no-console
  console.error('[UNHANDLED]', err);
  return res.status(500).json({ error: 'Sunucu hatasi.' });
}
