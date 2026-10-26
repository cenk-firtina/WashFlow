import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/http';
import * as service from './tickets.service';

const createSchema = z.object({
  plate: z.string().min(2, 'Plaka zorunlu.'),
  brandModel: z.string().optional(),
  segment: z.enum(['SEDAN', 'SUV', 'VAN']).optional(),
  notes: z.string().optional(),
  serviceIds: z.array(z.number().int().positive()).min(1, 'En az bir hizmet secin.'),
  customer: z.object({
    id: z.number().int().positive().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    allowMarketingSms: z.boolean().optional(),
  }),
});

const statusSchema = z.object({
  status: z.enum(['QUEUED', 'WASHING', 'DETAILING', 'READY', 'COMPLETED', 'CANCELLED']),
});

export async function create(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  res.status(201).json(await service.createTicket(data));
}

export async function board(_req: Request, res: Response) {
  res.json(await service.listBoard());
}

export async function getOne(req: Request, res: Response) {
  const ticket = await service.getTicket(Number(req.params.id));
  if (!ticket) throw new ApiError(404, 'Bilet bulunamadi.');
  res.json(ticket);
}

export async function patchStatus(req: Request, res: Response) {
  const { status } = statusSchema.parse(req.body);
  res.json(await service.updateStatus(Number(req.params.id), status));
}
