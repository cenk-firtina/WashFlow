import { prisma } from '../../lib/prisma';
import { normalizePlate } from '../../utils/text';

/**
 * Plakaya gore araci + musterisini bulur (Hizli Kabul ekraninda on-doldurma).
 * Bulunamazsa null doner.
 */
export async function lookupByPlate(plateRaw: string) {
  const plate = normalizePlate(plateRaw);
  if (!plate) return null;
  return prisma.vehicle.findUnique({
    where: { plate },
    include: { customer: true },
  });
}

export async function listVehicles(query?: string) {
  const plate = query ? normalizePlate(query) : undefined;
  return prisma.vehicle.findMany({
    where: plate ? { plate: { contains: plate } } : {},
    include: { customer: true },
    orderBy: { lastVisitAt: 'desc' },
    take: 50,
  });
}
