import { Request, Response } from 'express';
import { z } from 'zod';
import { ApiError } from '../../lib/http';
import * as service from './customers.service';

const segmentEnum = z.enum(['SEDAN', 'SUV', 'VAN']);

const createSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter.'),
  phone: z.string().min(10, 'Gecerli bir telefon girin.'),
  allowMarketingSms: z.boolean().optional(),
  vehicle: z
    .object({
      plate: z.string().min(2),
      brandModel: z.string().optional(),
      segment: segmentEnum.optional(),
    })
    .optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  allowMarketingSms: z.boolean().optional(),
});

export async function list(req: Request, res: Response) {
  const query = typeof req.query.query === 'string' ? req.query.query : undefined;
  res.json(await service.searchCustomers(query));
}

export async function getOne(req: Request, res: Response) {
  const customer = await service.getCustomer(Number(req.params.id));
  if (!customer) throw new ApiError(404, 'Musteri bulunamadi.');
  res.json(customer);
}

export async function create(req: Request, res: Response) {
  const data = createSchema.parse(req.body);
  res.status(201).json(await service.createCustomer(data));
}

export async function update(req: Request, res: Response) {
  const data = updateSchema.parse(req.body);
  res.json(await service.updateCustomer(Number(req.params.id), data));
}
