import { prisma } from '../lib/prisma';

// ----------------------------------------------------------------------------
// Sistem ayarlari: anahtar/deger tablosu uzerine tiplenmis bir katman.
// WhatsApp Cloud API: template ADLARI Meta'da yonetilir; burada hangi
// template'in hangi mesaj tipinde kullanilacagi + dil + onizleme metni tutulur.
// ----------------------------------------------------------------------------

export const SETTING_KEYS = {
  intakeEnabled: 'intake_wa_enabled',
  readyEnabled: 'ready_wa_enabled',
  retentionEnabled: 'retention_wa_enabled',
  retentionDaysThreshold: 'retention_days_threshold',
  retentionCooldownDays: 'retention_cooldown_days',
  waLang: 'wa_lang',
  // Meta'da onayli template adlari:
  waTplIntake: 'wa_tpl_intake',
  waTplReady: 'wa_tpl_ready',
  waTplRetention: 'wa_tpl_retention',
  // Loglarda gorunecek insan-okur onizleme metinleri ({ad}{plaka}{saat}{link}):
  tplIntake: 'tpl_intake',
  tplReady: 'tpl_ready',
  tplRetention: 'tpl_retention',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

// Varsayilan degerler (tablo bos olsa da sistem calisir).
export const SETTING_DEFAULTS: Record<SettingKey, string> = {
  [SETTING_KEYS.intakeEnabled]: 'true',
  [SETTING_KEYS.readyEnabled]: 'true',
  [SETTING_KEYS.retentionEnabled]: 'true',
  [SETTING_KEYS.retentionDaysThreshold]: '25',
  [SETTING_KEYS.retentionCooldownDays]: '30',
  [SETTING_KEYS.waLang]: 'tr',
  [SETTING_KEYS.waTplIntake]: 'intake_notification',
  [SETTING_KEYS.waTplReady]: 'ready_notification',
  [SETTING_KEYS.waTplRetention]: 'retention_notification',
  [SETTING_KEYS.tplIntake]:
    'Sn. {ad}, {plaka} plakali araciniz teslim alinmistir. Tahmini teslim: {saat}. Takip: {link}',
  [SETTING_KEYS.tplReady]:
    'Sn. {ad}, {plaka} plakali aracinizin islemleri tamamlanmistir, teslime hazirdir. Keyifli surusler dileriz.',
  [SETTING_KEYS.tplRetention]:
    '{plaka} temizligi ozledi! Bu haftaya ozel indirim kodunuz: TEMIZ15. Bekleriz.',
};

/** Tum ayarlari (varsayilanlarla birlesik) dondurur. */
export async function getAllSettings(): Promise<Record<SettingKey, string>> {
  const rows = await prisma.systemSetting.findMany();
  const map: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map as Record<SettingKey, string>;
}

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? SETTING_DEFAULTS[key];
}

export async function getBool(key: SettingKey): Promise<boolean> {
  return (await getSetting(key)) === 'true';
}

export async function getNumber(key: SettingKey): Promise<number> {
  const parsed = Number.parseInt(await getSetting(key), 10);
  return Number.isNaN(parsed) ? Number.parseInt(SETTING_DEFAULTS[key], 10) : parsed;
}

/** Birden fazla ayari topluca gunceller (upsert). */
export async function updateSettings(patch: Partial<Record<SettingKey, string>>): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined) as [SettingKey, string][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}

/** Sablondaki {ad} {plaka} {saat} {link} yer tutucularini doldurur. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match);
}
