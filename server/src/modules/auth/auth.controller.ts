import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';

const loginSchema = z.object({
  email: z.string().email('Gecerli bir e-posta girin.'),
  password: z.string().min(1, 'Sifre zorunlu.'),
});

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  res.json({ user: req.user });
}
