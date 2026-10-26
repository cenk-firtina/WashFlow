import { TicketStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/http';

// Musteriye gosterilen adimlar (CANCELLED/COMPLETED ayri ele alinir).
const STEP_ORDER: { key: TicketStatus; label: string }[] = [
  { key: 'QUEUED', label: 'Kabul Edildi' },
  { key: 'WASHING', label: 'Yikamada' },
  { key: 'DETAILING', label: 'Kurulama' },
  { key: 'READY', label: 'Teslime Hazir' },
];

const STATUS_LABELS: Record<TicketStatus, string> = {
  QUEUED: 'Sirada',
  WASHING: 'Yikamada',
  DETAILING: 'Kurulama / Detay',
  READY: 'Teslime Hazir',
  COMPLETED: 'Teslim Edildi',
  CANCELLED: 'Iptal Edildi',
};

/** Ad gizliligi: "Mehmet Yilmaz" -> "Mehmet Y." */
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export async function getPublicStatus(token: string) {
  const ticket = await prisma.jobTicket.findUnique({
    where: { trackingToken: token },
    include: {
      vehicle: { include: { customer: true } },
      services: { include: { service: true } },
    },
  });
  if (!ticket) throw new ApiError(404, 'Takip kaydi bulunamadi.');

  const activeIndex = STEP_ORDER.findIndex((s) => s.key === ticket.status);
  const isCompleted = ticket.status === 'COMPLETED';
  const isCancelled = ticket.status === 'CANCELLED';

  const steps = STEP_ORDER.map((step, index) => ({
    key: step.key,
    label: step.label,
    // COMPLETED ise tum adimlar tamam; aksi halde aktif adime kadar.
    done: isCompleted ? true : activeIndex > index,
    current: !isCompleted && !isCancelled && activeIndex === index,
  }));

  // Kalan sure (dk); negatifse 0.
  let remainingMinutes: number | null = null;
  if (ticket.estimatedReadyAt && !isCompleted && !isCancelled && ticket.status !== 'READY') {
    const diff = Math.round((ticket.estimatedReadyAt.getTime() - Date.now()) / 60000);
    remainingMinutes = Math.max(0, diff);
  }

  return {
    ticketCode: ticket.ticketCode,
    customerName: maskName(ticket.vehicle.customer.name),
    plate: ticket.vehicle.plate,
    brandModel: ticket.vehicle.brandModel,
    status: ticket.status,
    statusLabel: STATUS_LABELS[ticket.status],
    isCompleted,
    isCancelled,
    services: ticket.services.map((ts) => ts.service.name),
    estimatedReadyAt: ticket.estimatedReadyAt,
    remainingMinutes,
    steps,
    createdAt: ticket.createdAt,
  };
}
