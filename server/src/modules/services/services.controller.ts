import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const upsertSchema = z.object({
  name: z.string().min(2, 'Hizmet adi en az 2 karakter.'),
  category: z.string().min(1, 'Kategori zorunlu.').max(60).optional(),
  price: z.number().nonnegative('Fiyat negatif olamaz.'),
  durationMinutes: z.number().int().positive('Sure pozitif olmali.'),
  active: z.boolean().optional(),
});

export async function list(req: Request, res: Response) {
  const includeInactive = req.query.all === 'true';
  const services = await prisma.service.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { name: 'asc' },
  });
  res.json(services);
}

export async function create(req: Request, res: Response) {
  const data = upsertSchema.parse(req.body);
  res.status(201).json(await prisma.service.create({ data }));
}

export async function update(req: Request, res: Response) {
  const data = upsertSchema.partial().parse(req.body);
  res.json(await prisma.service.update({ where: { id: Number(req.params.id) }, data }));
}

export async function remove(req: Request, res: Response) {
  // Gecmis biletlerle iliskiyi korumak icin silmek yerine pasiflestiriyoruz.
  await prisma.service.update({ where: { id: Number(req.params.id) }, data: { active: false } });
  res.status(204).end();
}
