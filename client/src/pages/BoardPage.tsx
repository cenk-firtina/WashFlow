import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Calendar, CarFront, Check, CheckCircle2, Clock, Loader2, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { elapsedSince, formatTime, formatTRY } from '../lib/format';
import type { Ticket, TicketStatus } from '../types';

const TODAY_STR = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, yerel

export default function BoardPage() {
  const queryClient = useQueryClient();
  // Bilgi verilen biletler (kalici): localStorage'da tutulur, reload'a dayanir.
  const [notified, setNotified] = useState<Set<number>>(() => {
    try {
      return new Set<number>(JSON.parse(localStorage.getItem('wf-notified') ?? '[]'));
    } catch {
      return new Set<number>();
    }
  });
  const [notifyError, setNotifyError] = useState('');
  const [date, setDate] = useState(TODAY_STR);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['board'],
    queryFn: async () => (await api.get<Ticket[]>('/tickets/board')).data,
    refetchInterval: 5000, // Canli guncelleme: 5 sn polling
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: TicketStatus }) =>
      (await api.patch(`/tickets/${id}/status`, { status })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['board'] }),
  });

  // Manuel WhatsApp bildirimi: READY -> "hazir", digeri -> "teslim aldik".
  const notify = useMutation({
    mutationFn: async ({ id, kind }: { id: number; kind: 'INTAKE' | 'READY' }) =>
      (await api.post(`/tickets/${id}/notify`, { kind })).data as { queued: boolean; sent: boolean; error?: string },
    onSuccess: (d, v) => {
      if (d.sent) {
        setNotifyError('');
        setNotified((prev) => {
          const next = new Set(prev).add(v.id);
          try {
            localStorage.setItem('wf-notified', JSON.stringify([...next]));
          } catch {
            /* localStorage yoksa yok say */
          }
          return next;
        });
      } else {
        setNotifyError(d.error ?? 'Mesaj gönderilemedi.');
      }
    },
    onError: () => setNotifyError('Mesaj gönderilemedi.'),
  });

  // Secilen gunde teslim edilenler (gunluk tablo).
  const { data: completed = [] } = useQuery({
    queryKey: ['board-completed', date],
    queryFn: async () => (await api.get<Ticket[]>('/tickets/completed', { params: { date } })).data,
    refetchInterval: 5000,
  });
  const completedTotal = completed.reduce((s, t) => s + Number(t.totalPrice), 0);

  const activeCount = tickets.length;
  const rows = tickets; // tek aktif durum (Islemde); sunucu createdAt'e gore sirali
  const isToday = date === TODAY_STR();
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Islemde satir aksiyonlari: Tamamlandi + Iptal.
  function Actions({ t }: { t: Ticket }) {
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => changeStatus.mutate({ id: t.id, status: 'COMPLETED' })}
          disabled={changeStatus.isPending}
          className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Check className="h-4 w-4" /> Tamamlandı
        </button>
        <button
          onClick={() => changeStatus.mutate({ id: t.id, status: 'CANCELLED' })}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-slate-400 hover:border-red-200 hover:text-red-500"
          title="İptal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Tamamlananlar: WhatsApp "Araciniz hazir" bilgi butonu.
  function NotifyButton({ t }: { t: Ticket }) {
    const notifying = notify.isPending && notify.variables?.id === t.id;
    const done = notified.has(t.id);
    return (
      <button
        onClick={() => notify.mutate({ id: t.id, kind: 'READY' })}
        disabled={notifying || done}
        className={`flex items-center gap-1 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-sm font-medium disabled:opacity-100 ${
          done
            ? 'cursor-default border-green-200 bg-green-100 text-green-700'
            : 'border-green-200 bg-green-50 text-green-700 hover:border-green-300 hover:bg-green-100 disabled:opacity-60'
        }`}
        title={done ? 'Müşteriye bilgi verildi' : 'WhatsApp: Aracınız hazır'}
      >
        {notifying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : done ? (
          <Check className="h-4 w-4" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        {done ? 'Bilgi Verildi' : 'Bilgi Ver'}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operasyon Panosu</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {activeCount > 0 ? `${activeCount} araç işlemde` : 'Şu an işlemde araç yok'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-card focus-within:ring-2 focus-within:ring-brand-100">
            <Calendar className="h-4 w-4 text-brand-600" />
            <input
              type="date"
              value={date}
              max={TODAY_STR()}
              onChange={(e) => setDate(e.target.value || TODAY_STR())}
              className="bg-transparent text-sm font-medium text-slate-700 outline-none"
            />
          </label>
          <span className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Canlı · 5 sn
          </span>
        </div>
      </div>

      {notifyError && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{notifyError}</div>
      )}

      {/* Masaustu: tablo */}
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Plaka / Kod</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Hizmetler</th>
              <th className="px-4 py-3">Süre</th>
              <th className="px-4 py-3 text-right">Tutar</th>
              <th className="px-4 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">Yükleniyor…</td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-1 text-slate-300">
                    <CarFront className="h-7 w-7" />
                    <span className="text-xs font-medium text-slate-400">Şu an işlemde araç yok</span>
                  </div>
                </td>
              </tr>
            )}

            {rows.map((t) => (
              <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-4 py-3 align-top">
                  <p className="font-mono text-base font-bold tracking-wide text-slate-900">{t.vehicle.plate}</p>
                  <p className="text-xs text-slate-400">{t.ticketCode}</p>
                </td>
                <td className="px-4 py-3 align-top text-slate-600">{t.vehicle.customer.name}</td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-1">
                    {t.services.map((s) => (
                      <span key={s.id} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                        {s.service.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="h-3.5 w-3.5" /> {elapsedSince(t.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-3 align-top text-right font-bold text-slate-800">{formatTRY(t.totalPrice)}</td>
                <td className="px-4 py-3 align-top">
                  <Actions t={t} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobil: kart listesi */}
      <div className="space-y-3 md:hidden">
        {isLoading && <div className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />}
        {!isLoading && rows.length === 0 && (
          <div className="flex flex-col items-center gap-1 rounded-2xl border border-slate-200/70 bg-white py-12 text-slate-300 shadow-card">
            <CarFront className="h-7 w-7" />
            <span className="text-xs font-medium text-slate-400">Şu an işlemde araç yok</span>
          </div>
        )}

        {rows.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
            <div>
              <p className="font-mono text-lg font-bold tracking-wide text-slate-900">{t.vehicle.plate}</p>
              <p className="text-xs text-slate-400">{t.ticketCode} · {t.vehicle.customer.name}</p>
            </div>

            <div className="mt-2 flex flex-wrap gap-1">
              {t.services.map((s) => (
                <span key={s.id} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {s.service.name}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-sm">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="h-3.5 w-3.5" /> {elapsedSince(t.createdAt)}
              </span>
              <span className="font-bold text-slate-800">{formatTRY(t.totalPrice)}</span>
            </div>

            <div className="mt-3">
              <Actions t={t} />
            </div>
          </div>
        ))}
      </div>

      {/* Bugun teslim edilenler — gunluk tablo */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="capitalize">{isToday ? 'Bugün' : dateLabel}</span> Tamamlananlar
            <span className="nums rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-700">
              {completed.length}
            </span>
          </h2>
          {completed.length > 0 && (
            <span className="nums text-sm text-slate-500">
              Toplam <span className="font-bold text-slate-800">{formatTRY(completedTotal)}</span>
            </span>
          )}
        </div>

        {/* Masaustu: tablo */}
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Plaka / Kod</th>
                  <th className="px-4 py-3">Müşteri</th>
                  <th className="px-4 py-3">Hizmetler</th>
                  <th className="px-4 py-3">Saat</th>
                  <th className="px-4 py-3 text-right">Tutar</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completed.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      {isToday ? 'Bugün henüz tamamlanan araç yok.' : 'Bu tarihte tamamlanan araç yok.'}
                    </td>
                  </tr>
                )}
                {completed.map((t) => (
                  <tr key={t.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-4 py-3 align-top">
                      <p className="font-mono text-base font-bold tracking-wide text-slate-900">{t.vehicle.plate}</p>
                      <p className="text-xs text-slate-400">{t.ticketCode}</p>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-600">{t.vehicle.customer.name}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1">
                        {t.services.map((s) => (
                          <span key={s.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {s.service.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-slate-500">
                      {t.completedAt ? formatTime(t.completedAt) : '-'}
                    </td>
                    <td className="px-4 py-3 align-top text-right font-bold text-slate-800">{formatTRY(t.totalPrice)}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex justify-end">
                        <NotifyButton t={t} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobil: kart listesi */}
        <div className="space-y-3 md:hidden">
          {completed.length === 0 && (
            <div className="rounded-2xl border border-slate-200/70 bg-white py-10 text-center text-sm text-slate-400 shadow-card">
              {isToday ? 'Bugün henüz tamamlanan araç yok.' : 'Bu tarihte tamamlanan araç yok.'}
            </div>
          )}
          {completed.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-lg font-bold tracking-wide text-slate-900">{t.vehicle.plate}</p>
                  <p className="text-xs text-slate-400">{t.ticketCode} · {t.vehicle.customer.name}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> {t.completedAt ? formatTime(t.completedAt) : '-'}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {t.services.map((s) => (
                  <span key={s.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {s.service.name}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                <span className="font-bold text-slate-800">{formatTRY(t.totalPrice)}</span>
                <NotifyButton t={t} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
