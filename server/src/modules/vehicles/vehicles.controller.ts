import { Request, Response } from 'express';
import * as service from './vehicles.service';

export async function lookup(req: Request, res: Response) {
  const plate = typeof req.query.plate === 'string' ? req.query.plate : '';
  const vehicle = await service.lookupByPlate(plate);
  // Bulunamazsa 200 + null (frontend "yeni musteri formu" acar).
  res.json({ found: !!vehicle, vehicle });
}

export async function list(req: Request, res: Response) {
  const query = typeof req.query.query === 'string' ? req.query.query : undefined;
  res.json(await service.listVehicles(query));
}
