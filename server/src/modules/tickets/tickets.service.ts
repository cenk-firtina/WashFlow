import { Prisma, TicketStatus, VehicleSegment } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/http';
import { generateTicketCode, generateTrackingToken } from '../../utils/codes';
import { normalizePhone, normalizePlate } from '../../utils/text';
import { enqueueIntakeMessage, enqueueReadyMessage } from '../../services/messageQueue.service';

// Panoda gorunen "aktif" durumlar.
export const ACTIVE_STATUSES: TicketStatus[] = ['QUEUED', 'WASHING', 'DETAILING', 'READY'];

// Bilet + iliskili tum veriyi tek sekilde donmek icin ortak include.
const ticketInclude = {
  vehicle: { include: { customer: true } },
  services: { include: { service: true } },
} satisfies Prisma.JobTicketInclude;

export type TicketWithRelations = Prisma.JobTicketGetPayload<{ include: typeof ticketInclude }>;

interface CreateTicketInput {
  plate: string;
  brandModel?: string;
  segment?: VehicleSegment;
  notes?: string;
  serviceIds: number[];
  customer: {
    id?: number;
    name?: string;
    phone?: string;
    allowMarketingSms?: boolean;
  };
}

/**
 * Hizli Arac Kabul: musteri/arac bul-veya-olustur, bilet ac, INTAKE WhatsApp mesajini sira.
 */
export async function createTicket(input: CreateTicketInput): Promise<TicketWithRelations> {
  const plate = normalizePlate(input.plate);
  if (!plate) throw new ApiError(422, 'Plaka gecersiz.');
  if (!input.serviceIds?.length) throw new ApiError(422, 'En az bir hizmet secmelisiniz.');

  // Secilen hizmetleri cek (fiyat/sure snapshot'i icin).
  const services = await prisma.service.findMany({
    where: { id: { in: input.serviceIds }, active: true },
  });
  if (services.length !== input.serviceIds.length) {
    throw new ApiError(422, 'Secilen hizmetlerden bazilari gecersiz.');
  }

  const totalPrice = services.reduce((sum, s) => sum + Number(s.price), 0);
  const totalMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const estimatedReadyAt = new Date(Date.now() + totalMinutes * 60 * 1000);

  const ticketCode = await generateTicketCode();
  const trackingToken = await generateTrackingToken();

  const ticket = await prisma.$transaction(async (tx) => {
    // 1) Araci plakadan bul.
    let vehicle = await tx.vehicle.findUnique({ where: { plate } });

    if (vehicle) {
      // Varsa marka/model & segment guncelle, ziyaret zamanini isle.
      vehicle = await tx.vehicle.update({
        where: { id: vehicle.id },
        data: {
          brandModel: input.brandModel?.trim() || vehicle.brandModel,
          segment: input.segment ?? vehicle.segment,
          lastVisitAt: new Date(),
        },
      });
    } else {
      // Yoksa musteriyi coz (id ile ya da yeni olustur), sonra araci yarat.
      let customerId = input.customer.id;
      if (!customerId) {
        if (!input.customer.name || !input.customer.phone) {
          throw new ApiError(422, 'Yeni musteri icin ad ve telefon zorunlu.');
        }
        const created = await tx.customer.create({
          data: {
            name: input.customer.name.trim(),
            phone: normalizePhone(input.customer.phone),
            allowMarketingSms: input.customer.allowMarketingSms ?? true,
          },
        });
        customerId = created.id;
      }
      vehicle = await tx.vehicle.create({
        data: {
          customerId,
          plate,
          brandModel: input.brandModel?.trim() || null,
          segment: input.segment ?? 'SEDAN',
          lastVisitAt: new Date(),
        },
      });
    }

    // 2) Bileti olustur (+ hizmet snapshot'lari).
    return tx.jobTicket.create({
      data: {
        ticketCode,
        trackingToken,
        vehicleId: vehicle.id,
        status: 'QUEUED',
        notes: input.notes?.trim() || null,
        totalPrice,
        estimatedReadyAt,
        services: {
          create: services.map((s) => ({ serviceId: s.id, price: s.price })),
        },
      },
      include: ticketInclude,
    });
  });

  // 3) INTAKE WhatsApp mesajini kuyruga ekle (commit sonrasi; toggle kapaliysa atlanir).
  await enqueueIntakeMessage({
    phone: ticket.vehicle.customer.phone,
    ad: ticket.vehicle.customer.name,
    plaka: ticket.vehicle.plate,
    estimatedReadyAt: ticket.estimatedReadyAt,
    trackingToken: ticket.trackingToken,
  });

  return ticket;
}

/** Panodaki aktif biletler (Kanban + polling). */
export async function listBoard(): Promise<TicketWithRelations[]> {
  return prisma.jobTicket.findMany({
    where: { status: { in: ACTIVE_STATUSES } },
    include: ticketInclude,
    orderBy: { createdAt: 'asc' },
  });
}

export async function getTicket(id: number): Promise<TicketWithRelations | null> {
  return prisma.jobTicket.findUnique({ where: { id }, include: ticketInclude });
}

/**
 * Durum guncelleme. READY'e geciste READY WhatsApp mesajini siraya alir,
 * COMPLETED'ta completedAt isler.
 */
export async function updateStatus(id: number, status: TicketStatus): Promise<TicketWithRelations> {
  const current = await prisma.jobTicket.findUnique({ where: { id }, include: ticketInclude });
  if (!current) throw new ApiError(404, 'Bilet bulunamadi.');

  const becomingReady = status === 'READY' && current.status !== 'READY';

  const updated = await prisma.jobTicket.update({
    where: { id },
    data: {
      status,
      completedAt: status === 'COMPLETED' ? new Date() : current.completedAt,
    },
    include: ticketInclude,
  });

  if (becomingReady) {
    await enqueueReadyMessage({
      phone: updated.vehicle.customer.phone,
      ad: updated.vehicle.customer.name,
      plaka: updated.vehicle.plate,
    });
  }

  return updated;
}
