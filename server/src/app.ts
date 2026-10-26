import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error';
import api from './routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // cPanel/Passenger ters vekil arkasinda
  app.use(express.json({ limit: '1mb' }));

  // CORS: client ayri domainde ise izin ver; ayni origin ise gereksiz.
  if (env.corsOrigins.length > 0) {
    app.use(cors({ origin: env.corsOrigins, credentials: true }));
  } else if (!env.serveClient) {
    app.use(cors());
  }

  // --- API ---
  app.use('/api', api);

  // --- React build'ini servis et (cPanel tek-app senaryosu) ---
  if (env.serveClient) {
    // dist/index.js -> ../../client/dist  (server/dist'ten client/dist'e)
    const clientDist = path.resolve(__dirname, '../../client/dist');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      // SPA fallback: /api disindaki tum GET'ler index.html'e.
      app.get(/^(?!\/api).*/, (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[uyari] client build bulunamadi: ${clientDist} (once client build alin)`);
    }
  }

  // --- Hata yakalayicilar ---
  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}
