import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageCircle, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import type { SystemSettings } from '../types';

const KEYS = {
  intake: 'intake_wa_enabled',
  ready: 'ready_wa_enabled',
  retention: 'retention_wa_enabled',
  threshold: 'retention_days_threshold',
  cooldown: 'retention_cooldown_days',
  lang: 'wa_lang',
  waTplIntake: 'wa_tpl_intake',
  waTplReady: 'wa_tpl_ready',
  waTplRetention: 'wa_tpl_retention',
  tplIntake: 'tpl_intake',
  tplReady: 'tpl_ready',
  tplRetention: 'tpl_retention',
};

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-green-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SystemSettings>({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<SystemSettings>('/settings')).data,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => (await api.patch<SystemSettings>('/settings', form)).data,
    onSuccess: (updated) => {
      setForm(updated);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setError('');
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (err) => setError(apiError(err)),
  });

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  const bool = (key: string) => form[key] === 'true';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <MessageCircle className="h-6 w-6 text-green-600" /> WhatsApp Ayarlari
      </h1>

      <section className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Otomatik Bildirim Anahtarlari</h2>
        <Toggle checked={bool(KEYS.intake)} onChange={(v) => set(KEYS.intake, String(v))} label="Arac Kabul (INTAKE)" desc="Bilet acildiginda musteriye WhatsApp." />
        <Toggle checked={bool(KEYS.ready)} onChange={(v) => set(KEYS.ready, String(v))} label="Teslime Hazir (READY)" desc="Durum 'Hazir' olunca WhatsApp." />
        <Toggle checked={bool(KEYS.retention)} onChange={(v) => set(KEYS.retention, String(v))} label="Geri Cagirma (RETENTION)" desc="Cron ile uzun sure gelmeyen musterilere WhatsApp." />
      </section>

      <section className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Geri cagirma esigi (gun)</label>
          <input type="number" min={1} value={form[KEYS.threshold] ?? ''} onChange={(e) => set(KEYS.threshold, e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <p className="mt-1 text-xs text-slate-400">Son ziyaretten kac gun sonra hatirlatilsin.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tekrar bekleme (gun)</label>
          <input type="number" min={1} value={form[KEYS.cooldown] ?? ''} onChange={(e) => set(KEYS.cooldown, e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          <p className="mt-1 text-xs text-slate-400">Ayni musteriye tekrar mesaj icin min. gun.</p>
        </div>
      </section>

      {/* WhatsApp Cloud API template eslemesi */}
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Meta Template Eslemesi</h2>
          <p className="mt-1 text-xs text-slate-500">
            Mesaj metinleri Meta Business'ta onaylanan template'lerde tanimlidir. Buraya her mesaj tipi icin
            <b> onayli template adini</b> ve <b>dil kodunu</b> girin. Parametre sirasi:
            INTAKE → ad, plaka, saat, link · READY → ad, plaka · RETENTION → plaka.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Dil kodu</label>
            <input value={form[KEYS.lang] ?? ''} onChange={(e) => set(KEYS.lang, e.target.value)} placeholder="tr" className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" />
          </div>
          <div />
          {[
            { key: KEYS.waTplIntake, label: 'INTAKE template adi' },
            { key: KEYS.waTplReady, label: 'READY template adi' },
            { key: KEYS.waTplRetention, label: 'RETENTION template adi' },
          ].map((t) => (
            <div key={t.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{t.label}</label>
              <input value={form[t.key] ?? ''} onChange={(e) => set(t.key, e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm" />
            </div>
          ))}
        </div>
      </section>

      {/* Log/onizleme metinleri */}
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Onizleme Metinleri (log icin)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Panelde/loglarda gorunecek okunur metin. Gercek gonderim Meta template'i ile yapilir; bu metni
            template ile ayni tutmaniz onerilir. Yer tutucular:{' '}
            <code className="rounded bg-slate-100 px-1">{'{ad}'}</code>{' '}
            <code className="rounded bg-slate-100 px-1">{'{plaka}'}</code>{' '}
            <code className="rounded bg-slate-100 px-1">{'{saat}'}</code>{' '}
            <code className="rounded bg-slate-100 px-1">{'{link}'}</code>
          </p>
        </div>
        {[
          { key: KEYS.tplIntake, label: 'Kabul (INTAKE)' },
          { key: KEYS.tplReady, label: 'Teslime Hazir (READY)' },
          { key: KEYS.tplRetention, label: 'Geri Cagirma (RETENTION)' },
        ].map((t) => (
          <div key={t.key}>
            <label className="mb-1 block text-sm font-medium text-slate-700">{t.label}</label>
            <textarea
              rows={2}
              value={form[t.key] ?? ''}
              onChange={(e) => set(t.key, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </section>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Kaydet
        </button>
        {saved && <span className="text-sm font-medium text-green-600">Ayarlar kaydedildi ✓</span>}
      </div>
    </div>
  );
}
