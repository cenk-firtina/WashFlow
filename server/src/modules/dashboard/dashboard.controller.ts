import { Request, Response } from 'express';
import { MessageStatus, MessageType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ACTIVE_STATUSES } from '../tickets/tickets.service';

// Verilen gunun [00:00, ertesi 00:00) araligini (yerel) dondurur.
function dayRange(dateStr?: string) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export async function summary(req: Request, res: Response) {
  const dateStr = typeof req.query.date === 'string' ? req.query.date : undefined;
  const { start, end } = dayRange(dateStr);

  const [revenueAgg, completedCount, intakeCount, activeCount, msgGroups] = await Promise.all([
    prisma.jobTicket.aggregate({
      _sum: { totalPrice: true },
      where: { status: 'COMPLETED', completedAt: { gte: start, lt: end } },
    }),
    prisma.jobTicket.count({ where: { status: 'COMPLETED', completedAt: { gte: start, lt: end } } }),
    prisma.jobTicket.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.jobTicket.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    // WhatsApp mesaj sayaclari (gun icinde olusturulan).
    prisma.messageQueue.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { createdAt: { gte: start, lt: end } },
    }),
  ]);

  const messageCounts: Record<MessageStatus, number> = { PENDING: 0, SENT: 0, FAILED: 0 };
  for (const g of msgGroups) messageCounts[g.status] = g._count._all;

  res.json({
    date: start.toISOString().slice(0, 10),
    revenue: Number(revenueAgg._sum.totalPrice ?? 0),
    completedCount,
    intakeCount,
    activeCount,
    messages: {
      ...messageCounts,
      total: messageCounts.PENDING + messageCounts.SENT + messageCounts.FAILED,
    },
  });
}

// WhatsApp gonderim loglari tablosu (filtrelenebilir).
export async function messageLogs(req: Request, res: Response) {
  const where: Prisma.MessageQueueWhereInput = {};
  if (typeof req.query.status === 'string') where.status = req.query.status as MessageStatus;
  if (typeof req.query.type === 'string') where.type = req.query.type as MessageType;

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const logs = await prisma.messageQueue.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(logs);
}
