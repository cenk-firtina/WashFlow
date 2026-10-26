import { useQuery } from '@tanstack/react-query';
import { Car, CheckCircle2, CircleDollarSign, Clock3, MessageCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ServicesManager } from '../components/ServicesManager';
import { api } from '../lib/api';
import { formatDateTime, formatTRY } from '../lib/format';
import type { DashboardSummary, MessageLog } from '../types';

const TYPE_LABELS: Record<string, string> = {
  INTAKE: 'Kabul',
  READY: 'Hazir',
  RETENTION: 'Geri Cagirma',
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SENT: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2 ${tone}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const { data: summary } = useQuery({
    queryKey: ['dashboard', date],
    queryFn: async () => (await api.get<DashboardSummary>('/dashboard/summary', { params: { date } })).data,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['messageLogs'],
    queryFn: async () => (await api.get<MessageLog[]>('/dashboard/messages', { params: { limit: 100 } })).data,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Yonetim Panosu</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />} tone="bg-emerald-50" label="Gunluk Ciro" value={formatTRY(summary?.revenue ?? 0)} />
        <StatCard icon={<Car className="h-5 w-5 text-brand-600" />} tone="bg-brand-50" label="Yikanan Arac" value={String(summary?.completedCount ?? 0)} />
        <StatCard icon={<Clock3 className="h-5 w-5 text-amber-600" />} tone="bg-amber-50" label="Aktif Is" value={String(summary?.activeCount ?? 0)} />
        <StatCard icon={<MessageCircle className="h-5 w-5 text-green-600" />} tone="bg-green-50" label="Gonderilen WhatsApp" value={String(summary?.messages.SENT ?? 0)} />
      </div>

      {/* WhatsApp log tablosu */}
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageCircle className="h-5 w-5 text-green-600" /> WhatsApp Loglari
          </h2>
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> {summary?.messages.SENT ?? 0}</span>
            <span className="flex items-center gap-1 text-amber-600"><Clock3 className="h-4 w-4" /> {summary?.messages.PENDING ?? 0}</span>
            <span className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" /> {summary?.messages.FAILED ?? 0}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="py-2 pr-4 font-medium">Zaman</th>
                <th className="py-2 pr-4 font-medium">Telefon</th>
                <th className="py-2 pr-4 font-medium">Tip</th>
                <th className="py-2 pr-4 font-medium">Template</th>
                <th className="py-2 pr-4 font-medium">Durum</th>
                <th className="py-2 pr-4 font-medium">Onizleme</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Henuz mesaj kaydi yok.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-50">
                  <td className="whitespace-nowrap py-2 pr-4 text-slate-500">{formatDateTime(log.createdAt)}</td>
                  <td className="whitespace-nowrap py-2 pr-4 font-mono">{log.phone}</td>
                  <td className="py-2 pr-4">{TYPE_LABELS[log.type] ?? log.type}</td>
                  <td className="whitespace-nowrap py-2 pr-4 font-mono text-xs text-slate-500">{log.templateName}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[log.status]}`}>
                      {log.status}
                    </span>
                    {log.status === 'FAILED' && log.errorLog && (
                      <span className="ml-1 text-xs text-red-400" title={log.errorLog}>⚠</span>
                    )}
                  </td>
                  <td className="max-w-xs truncate py-2 pr-4 text-slate-600" title={log.preview}>{log.preview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hizmet yonetimi (ad, kategori, fiyat, sure) */}
      <ServicesManager />
    </div>
  );
}
