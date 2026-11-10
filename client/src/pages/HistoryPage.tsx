import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CircleDollarSign, Clock, History, Loader2, Repeat, Search } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDateTime, formatTRY } from '../lib/format';
import { STATUS_BADGE, STATUS_LABELS } from '../lib/status';
import type { VehicleHistory } from '../types';

function dateOnly(iso: string | null): string {
  if (!iso) return '-';
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="mb-2 inline-flex rounded-lg bg-slate-100 p-2 text-slate-600">{icon}</div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function HistoryPage() {
  const [plate, setPlate] = useState('');
  const [query, setQuery] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['history', query],
    queryFn: async () =>
      (await api.get<{ found: boolean; report: VehicleHistory | null }>('/vehicles/history', { params: { plate: query } })).data,
    enabled: query.length >= 2,
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQuery(plate.trim());
  }

  const report = data?.report;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <History className="h-6 w-6 text-brand-600" /> Araç Servis Geçmişi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Plaka girin; aracın kaç kez geldiğini, hangi aralıklarla ve ne harcadığını görün.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="34ABC123"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg font-mono uppercase tracking-wider outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={plate.trim().length < 2 || isFetching}
          className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 text-white hover:bg-slate-900 disabled:opacity-60"
        >
          {isFetching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          Sorgula
        </button>
      </form>

      {query.length >= 2 && !isFetching && !report && (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-card">
          <span className="font-mono font-semibold">{query}</span> plakalı araca ait kayıt bulunamadı.
        </div>
      )}

      {report && (
        <>
          {/* Arac / musteri basligi */}
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <p className="font-mono text-2xl font-bold tracking-wider">{report.vehicle.plate}</p>
            <p className="text-sm text-slate-500">
              {report.vehicle.brandModel || 'Marka/model yok'} · {report.customer.name} · {report.customer.phone}
            </p>
          </div>

          {/* Ozet istatistikler */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<Repeat className="h-5 w-5" />} label="Toplam ziyaret" value={String(report.visitCount)} />
            <Stat icon={<CircleDollarSign className="h-5 w-5" />} label="Toplam harcama" value={formatTRY(report.totalSpent)} />
            <Stat icon={<Clock className="h-5 w-5" />} label="Ort. ziyaret aralığı" value={report.avgIntervalDays !== null ? `${report.avgIntervalDays} gün` : '-'} />
            <Stat icon={<CalendarClock className="h-5 w-5" />} label="Son ziyaret" value={dateOnly(report.lastVisit)} />
          </div>

          {/* Ziyaret zaman cizelgesi */}
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="mb-4 text-lg font-semibold">Ziyaretler ({report.visitCount})</h2>
            {report.visits.length === 0 && <p className="py-6 text-center text-slate-400">Henüz ziyaret yok.</p>}
            <ol className="space-y-0">
              {report.visits.map((v, i) => {
                const isLast = i === report.visits.length - 1;
                return (
                  <li key={v.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                        {report.visitCount - i}
                      </div>
                      {!isLast && <div className="w-0.5 flex-1 bg-slate-200" style={{ minHeight: 24 }} />}
                    </div>
                    <div className="flex-1 pb-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{dateOnly(v.date)}</span>
                          <span className="font-mono text-xs text-slate-400">{v.ticketCode}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[v.status]}`}>
                            {STATUS_LABELS[v.status]}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-700">{formatTRY(v.totalPrice)}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {v.services.map((s, idx) => (
                          <span key={idx} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {v.intervalDays === null ? 'İlk ziyaret' : `Önceki ziyaretten ${v.intervalDays} gün sonra`}
                        {v.completedAt && ` · Teslim: ${formatDateTime(v.completedAt)}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
