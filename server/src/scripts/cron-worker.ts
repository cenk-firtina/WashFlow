/**
 * ============================================================================
 * WashFlow - Cron Worker (cPanel Cron Job)
 * ============================================================================
 * Gunde bir kez cPanel Cron tarafindan tetiklenir. Iki is yapar:
 *   1) RETENTION: Uygun araclara "geri cagirma" WhatsApp mesajini kuyruga ekler.
 *   2) GONDERIM: Kuyruktaki PENDING mesajlari saglayiciya gonderir.
 *
 * cPanel Cron ornegi (her gun 10:00):
 *   cd ~/washflow/server && node dist/scripts/cron-worker.js >> ~/washflow/cron.log 2>&1
 *
 * Sadece gonderim yapmak (ör. 10 dk'da bir) icin:  node dist/scripts/cron-worker.js --send-only
 * ============================================================================
 */
import { prisma } from '../lib/prisma';
import { ACTIVE_STATUSES } from '../modules/tickets/tickets.service';
import { enqueueRetentionMessage, processPendingQueue } from '../services/messageQueue.service';
import { SETTING_KEYS, getBool, getNumber } from '../services/settings.service';

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function queueRetentionMessages(): Promise<number> {
  const enabled = await getBool(SETTING_KEYS.retentionEnabled);
  if (!enabled) {
    console.log('[cron] Retention WhatsApp kapali, atlaniyor.');
    return 0;
  }

  const thresholdDays = await getNumber(SETTING_KEYS.retentionDaysThreshold); // 25
  const cooldownDays = await getNumber(SETTING_KEYS.retentionCooldownDays); // 30

  const visitCutoff = daysAgo(thresholdDays); // son ziyaret bundan once olmali
  const retentionCutoff = daysAgo(cooldownDays); // son retention mesaji bundan once olmali

  // Uygun araclar:
  //  - lastVisitAt <= 25 gun once
  //  - aktif bileti yok
  //  - son 30 gunde retention mesaji almamis
  //  - musteri pazarlama mesajina izinli
  const vehicles = await prisma.vehicle.findMany({
    where: {
      lastVisitAt: { not: null, lte: visitCutoff },
      customer: { allowMarketingSms: true },
      OR: [{ lastRetentionSmsAt: null }, { lastRetentionSmsAt: { lte: retentionCutoff } }],
      tickets: { none: { status: { in: ACTIVE_STATUSES } } },
    },
    include: { customer: true },
  });

  console.log(`[cron] Retention icin uygun arac: ${vehicles.length}`);

  let queued = 0;
  for (const vehicle of vehicles) {
    await enqueueRetentionMessage({
      phone: vehicle.customer.phone,
      ad: vehicle.customer.name,
      plaka: vehicle.plate,
    });
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { lastRetentionSmsAt: new Date() },
    });
    queued++;
  }
  return queued;
}

async function main() {
  const sendOnly = process.argv.includes('--send-only');
  const startedAt = new Date().toISOString();
  console.log(`\n===== [cron-worker] baslangic ${startedAt} =====`);

  try {
    if (!sendOnly) {
      const queued = await queueRetentionMessages();
      console.log(`[cron] Kuyruga eklenen retention WhatsApp: ${queued}`);
    }

    const result = await processPendingQueue();
    console.log(
      `[cron] Gonderim -> islenen:${result.processed} basarili:${result.sent} basarisiz:${result.failed}`,
    );
  } catch (err) {
    console.error('[cron] HATA:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log(`===== [cron-worker] bitis =====\n`);
  }
}

void main();
