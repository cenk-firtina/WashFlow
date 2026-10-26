import { Request, Response } from 'express';
import { z } from 'zod';
import { SETTING_KEYS, getAllSettings, updateSettings } from '../../services/settings.service';

// Tum ayarlari dondur (frontend ayar ekrani icin).
export async function getAll(_req: Request, res: Response) {
  res.json(await getAllSettings());
}

const boolStr = z.enum(['true', 'false']);
const patchSchema = z
  .object({
    [SETTING_KEYS.intakeEnabled]: boolStr,
    [SETTING_KEYS.readyEnabled]: boolStr,
    [SETTING_KEYS.retentionEnabled]: boolStr,
    [SETTING_KEYS.retentionDaysThreshold]: z.string().regex(/^\d+$/),
    [SETTING_KEYS.retentionCooldownDays]: z.string().regex(/^\d+$/),
    [SETTING_KEYS.waLang]: z.string().min(2).max(10),
    [SETTING_KEYS.waTplIntake]: z.string().min(1),
    [SETTING_KEYS.waTplReady]: z.string().min(1),
    [SETTING_KEYS.waTplRetention]: z.string().min(1),
    [SETTING_KEYS.tplIntake]: z.string().min(5),
    [SETTING_KEYS.tplReady]: z.string().min(5),
    [SETTING_KEYS.tplRetention]: z.string().min(5),
  })
  .partial();

export async function update(req: Request, res: Response) {
  const patch = patchSchema.parse(req.body);
  await updateSettings(patch);
  res.json(await getAllSettings());
}
