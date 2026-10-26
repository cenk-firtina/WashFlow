import { randomInt } from 'crypto';
import { prisma } from '../lib/prisma';

// Karistirilmasi kolay karakterler (0/O, 1/I/l) cikarildi.
const TOKEN_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** 5 karakterlik, URL dostu, benzersiz takip kodu (ör. x8k2A). */
export async function generateTrackingToken(length = 5): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let token = '';
    for (let i = 0; i < length; i++) {
      token += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
    }
    const existing = await prisma.jobTicket.findUnique({ where: { trackingToken: token } });
    if (!existing) return token;
  }
  // Cakisma olasiligi cok dusuk; olursa uzunlugu artir.
  return generateTrackingToken(length + 1);
}

/**
 * Siradaki bilet kodunu uretir: WO-1042 formatinda.
 * Mevcut en buyuk numaradan devam eder; 1000'den baslar.
 */
export async function generateTicketCode(): Promise<string> {
  const last = await prisma.jobTicket.findFirst({
    where: { ticketCode: { startsWith: 'WO-' } },
    orderBy: { id: 'desc' },
    select: { ticketCode: true },
  });
  let next = 1000;
  if (last) {
    const parsed = Number.parseInt(last.ticketCode.replace('WO-', ''), 10);
    if (!Number.isNaN(parsed)) next = parsed + 1;
  }
  return `WO-${next}`;
}
