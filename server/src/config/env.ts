import dotenv from 'dotenv';
import path from 'path';

// cPanel Passenger uygulamayi app koku disinda calistirabildigi icin .env'i
// bu dosyaya gore (../../.env = server/.env) acikca yukluyoruz.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Eksik ortam degiskeni: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback;
}

function toInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isProd: optional('NODE_ENV', 'development') === 'production',
  // Passenger PORT'u kendisi atar; yoksa 4000.
  port: toInt('PORT', 4000),
  publicBaseUrl: optional('PUBLIC_BASE_URL', 'http://localhost:4000').replace(/\/+$/, ''),
  serveClient: optional('SERVE_CLIENT', 'true') === 'true',

  jwtSecret: required('JWT_SECRET', process.env.NODE_ENV === 'production' ? undefined : 'dev-secret-change-me'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '12h'),

  corsOrigins: optional('CORS_ORIGINS')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  whatsapp: {
    // "mock" -> gondermez, loglar (lokal/kimliksiz). "cloud" -> Meta WhatsApp Cloud API.
    provider: optional('WHATSAPP_PROVIDER', 'mock').toLowerCase() as 'mock' | 'cloud',
    cloud: {
      apiVersion: optional('WHATSAPP_API_VERSION', 'v21.0'),
      phoneNumberId: optional('WHATSAPP_PHONE_NUMBER_ID'),
      accessToken: optional('WHATSAPP_ACCESS_TOKEN'),
    },
    // Varsayilan ulke kodu (TR). 05xx -> 905xx donusumu icin.
    defaultCountryCode: optional('WHATSAPP_COUNTRY_CODE', '90'),
    batchSize: toInt('MESSAGE_BATCH_SIZE', 100),
    maxRetries: toInt('MESSAGE_MAX_RETRIES', 3),
  },
};
