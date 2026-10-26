import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const upsertSchema = z.object({
  name: z.string().min(1, 'Marka adi zorunlu.').max(80),
  isPopular: z.boolean().optional(),
  active: z.boolean().optional(),
});

// Markalari dondurur: once sik kullanilanlar, sonra alfabetik.
export async function list(req: Request, res: Response) {
  const includeInactive = req.query.all === 'true';
  const brands = await prisma.vehicleBrand.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
  });
  res.json(brands);
}

export async function create(req: Request, res: Response) {
  const data = upsertSchema.parse(req.body);
  res.status(201).json(await prisma.vehicleBrand.create({ data }));
}

export async function update(req: Request, res: Response) {
  const data = upsertSchema.partial().parse(req.body);
  res.json(await prisma.vehicleBrand.update({ where: { id: Number(req.params.id) }, data }));
}

export async function remove(req: Request, res: Response) {
  // Referans butunlugu icin silmek yerine pasiflestiriyoruz.
  await prisma.vehicleBrand.update({ where: { id: Number(req.params.id) }, data: { active: false } });
  res.status(204).end();
}
