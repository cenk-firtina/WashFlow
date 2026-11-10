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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Bir aracin servis gecmisi raporu: kac kez gelmis, hangi aralikla, ne harcamis.
 * Iptal edilmis biletler sayilmaz. Bulunamazsa null doner.
 */
export async function getVehicleHistory(plateRaw: string) {
  const plate = normalizePlate(plateRaw);
  if (!plate) return null;

  const vehicle = await prisma.vehicle.findUnique({
    where: { plate },
    include: { customer: true },
  });
  if (!vehicle) return null;

  const tickets = await prisma.jobTicket.findMany({
    where: { vehicleId: vehicle.id, status: { not: 'CANCELLED' } },
    orderBy: { createdAt: 'asc' },
    include: { services: { include: { service: true } } },
  });

  // Her ziyaret + bir onceki ziyaretten gecen gun.
  const visitsAsc = tickets.map((t, i) => {
    const prev = tickets[i - 1];
    const intervalDays = prev
      ? Math.round((t.createdAt.getTime() - prev.createdAt.getTime()) / DAY_MS)
      : null;
    return {
      id: t.id,
      ticketCode: t.ticketCode,
      date: t.createdAt,
      completedAt: t.completedAt,
      status: t.status,
      services: t.services.map((s) => s.service.name),
      totalPrice: Number(t.totalPrice),
      intervalDays,
    };
  });

  const intervals = visitsAsc
    .map((v) => v.intervalDays)
    .filter((x): x is number => x !== null);
  const avgIntervalDays = intervals.length
    ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
    : null;
  const totalSpent = tickets.reduce((s, t) => s + Number(t.totalPrice), 0);

  return {
    vehicle: {
      id: vehicle.id,
      plate: vehicle.plate,
      brandModel: vehicle.brandModel,
      segment: vehicle.segment,
    },
    customer: {
      id: vehicle.customer.id,
      name: vehicle.customer.name,
      phone: vehicle.customer.phone,
    },
    visitCount: tickets.length,
    firstVisit: tickets[0]?.createdAt ?? null,
    lastVisit: tickets[tickets.length - 1]?.createdAt ?? null,
    totalSpent,
    avgIntervalDays,
    visits: visitsAsc.reverse(), // en yeni ustte
  };
}
