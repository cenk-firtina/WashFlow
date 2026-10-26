import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './lib/prisma';

const app = createApp();

// cPanel Passenger uygulamayi kendi yonetir; app'i export etmek yeterlidir.
// Dogrudan (node dist/index.js) calistirmada da dinlemeye baslariz.
const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[washflow] API ${env.port} portunda calisiyor (${env.nodeEnv})`);
});

// Temiz kapanis
async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n[washflow] ${signal} alindi, kapatiliyor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
