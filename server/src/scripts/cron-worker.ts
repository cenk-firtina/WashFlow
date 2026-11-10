/**
 * ============================================================================
 * WashFlow - Cron Worker (cPanel Cron Job)
 * ============================================================================
 * Mesajlar artik panodan/kabulden ANLIK gonderilir. Bu worker yalnizca
 * gonderilemeyip tekrar denenecek PENDING kayitlari tekrar gonderir (retry).
 *
 * cPanel Cron ornegi (ör. 15 dk'da bir):
 *   cd ~/washflow/server && node dist/scripts/cron-worker.js >> ~/washflow/cron.log 2>&1
 * ============================================================================
 */
import { prisma } from '../lib/prisma';
import { processPendingQueue } from '../services/messageQueue.service';

async function main() {
  const startedAt = new Date().toISOString();
  console.log(`\n===== [cron-worker] baslangic ${startedAt} =====`);

  try {
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
