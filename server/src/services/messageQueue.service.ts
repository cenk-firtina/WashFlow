import { MessageType } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { getWhatsAppService } from './whatsapp/WhatsAppService';
import {
  SETTING_KEYS,
  getAllSettings,
  getBool,
  renderTemplate,
} from './settings.service';

// ----------------------------------------------------------------------------
// WhatsApp bildirim kuyrugu: enqueue (template + onizleme) ve
// processPendingQueue (Cloud API gonderim).
// ----------------------------------------------------------------------------

interface EnqueueInput {
  phone: string;
  type: MessageType;
  templateName: string;
  languageCode: string;
  params: string[];
  preview: string;
  scheduledAt?: Date;
}

export async function enqueueMessage(input: EnqueueInput) {
  return prisma.messageQueue.create({
    data: {
      phone: input.phone,
      type: input.type,
      templateName: input.templateName,
      languageCode: input.languageCode,
      params: input.params,
      preview: input.preview,
      scheduledAt: input.scheduledAt ?? new Date(),
    },
  });
}

interface IntakeVars {
  phone: string;
  ad: string;
  plaka: string;
  estimatedReadyAt?: Date | null;
  trackingToken: string;
}

/** INTAKE WhatsApp mesajini (toggle aciksa) kuyruga ekler. */
export async function enqueueIntakeMessage(v: IntakeVars) {
  if (!(await getBool(SETTING_KEYS.intakeEnabled))) return null;
  const s = await getAllSettings();
  const saat = v.estimatedReadyAt
    ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' }).format(v.estimatedReadyAt)
    : '-';
  const link = `${env.publicBaseUrl}/t/${v.trackingToken}`;
  const params = [v.ad, v.plaka, saat, link];
  const preview = renderTemplate(s[SETTING_KEYS.tplIntake], { ad: v.ad, plaka: v.plaka, saat, link });
  return enqueueMessage({
    phone: v.phone,
    type: 'INTAKE',
    templateName: s[SETTING_KEYS.waTplIntake],
    languageCode: s[SETTING_KEYS.waLang],
    params,
    preview,
  });
}

interface ReadyVars {
  phone: string;
  ad: string;
  plaka: string;
}

/** READY WhatsApp mesajini (toggle aciksa) kuyruga ekler. */
export async function enqueueReadyMessage(v: ReadyVars) {
  if (!(await getBool(SETTING_KEYS.readyEnabled))) return null;
  const s = await getAllSettings();
  const params = [v.ad, v.plaka];
  const preview = renderTemplate(s[SETTING_KEYS.tplReady], { ad: v.ad, plaka: v.plaka });
  return enqueueMessage({
    phone: v.phone,
    type: 'READY',
    templateName: s[SETTING_KEYS.waTplReady],
    languageCode: s[SETTING_KEYS.waLang],
    params,
    preview,
  });
}

interface RetentionVars {
  phone: string;
  ad: string;
  plaka: string;
}

/** RETENTION WhatsApp mesajini kuyruga ekler (toggle kontrolu cron tarafinda). */
export async function enqueueRetentionMessage(v: RetentionVars) {
  const s = await getAllSettings();
  const params = [v.plaka];
  const preview = renderTemplate(s[SETTING_KEYS.tplRetention], { ad: v.ad, plaka: v.plaka });
  return enqueueMessage({
    phone: v.phone,
    type: 'RETENTION',
    templateName: s[SETTING_KEYS.waTplRetention],
    languageCode: s[SETTING_KEYS.waLang],
    params,
    preview,
  });
}

export interface ProcessResult {
  processed: number;
  sent: number;
  failed: number;
}

/**
 * Kuyruktaki PENDING (gonderim zamani gelmis) mesajlari WhatsApp Cloud API'ye
 * gonderir. Cron worker tarafindan cagrilir.
 */
export async function processPendingQueue(limit = env.whatsapp.batchSize): Promise<ProcessResult> {
  const wa = getWhatsAppService();
  const now = new Date();

  const pending = await prisma.messageQueue.findMany({
    where: { status: 'PENDING', scheduledAt: { lte: now } },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });

  const result: ProcessResult = { processed: pending.length, sent: 0, failed: 0 };

  for (const item of pending) {
    const params = Array.isArray(item.params) ? (item.params as string[]) : [];
    const res = await wa.sendTemplate(
      item.phone,
      item.templateName ?? '',
      item.languageCode,
      params,
    );

    if (res.success) {
      result.sent++;
      await prisma.messageQueue.update({
        where: { id: item.id },
        data: { status: 'SENT', sentAt: new Date(), errorLog: res.providerRef ?? null },
      });
    } else {
      const retries = item.retries + 1;
      const giveUp = retries >= env.whatsapp.maxRetries;
      result.failed++;
      await prisma.messageQueue.update({
        where: { id: item.id },
        data: {
          status: giveUp ? 'FAILED' : 'PENDING',
          retries,
          errorLog: res.error ?? 'Bilinmeyen hata',
          scheduledAt: giveUp ? item.scheduledAt : new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    }
  }

  return result;
}
