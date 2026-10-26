import { Prisma, VehicleSegment } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { normalizePhone, normalizePlate } from '../../utils/text';

/** Ad veya telefona gore musteri arar (max 20). */
export async function searchCustomers(query?: string) {
  const where: Prisma.CustomerWhereInput = query
    ? {
        OR: [
          { name: { contains: query } },
          { phone: { contains: normalizePhone(query) || query } },
        ],
      }
    : {};
  return prisma.customer.findMany({
    where,
    include: { vehicles: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export async function getCustomer(id: number) {
  return prisma.customer.findUnique({ where: { id }, include: { vehicles: true } });
}

interface CreateCustomerInput {
  name: string;
  phone: string;
  allowMarketingSms?: boolean;
  vehicle?: { plate: string; brandModel?: string; segment?: VehicleSegment };
}

/** Musteri (ve istege bagli ilk aracini) olusturur. */
export async function createCustomer(input: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      name: input.name.trim(),
      phone: normalizePhone(input.phone),
      allowMarketingSms: input.allowMarketingSms ?? true,
      vehicles: input.vehicle
        ? {
            create: {
              plate: normalizePlate(input.vehicle.plate),
              brandModel: input.vehicle.brandModel?.trim() || null,
              segment: input.vehicle.segment ?? 'SEDAN',
            },
          }
        : undefined,
    },
    include: { vehicles: true },
  });
}

interface UpdateCustomerInput {
  name?: string;
  phone?: string;
  allowMarketingSms?: boolean;
}

export async function updateCustomer(id: number, input: UpdateCustomerInput) {
  return prisma.customer.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      phone: input.phone ? normalizePhone(input.phone) : undefined,
      allowMarketingSms: input.allowMarketingSms,
    },
    include: { vehicles: true },
  });
}
