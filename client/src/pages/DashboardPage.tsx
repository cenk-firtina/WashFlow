import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Car, CheckCircle2, CircleDollarSign, Clock3, MessageCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { formatDateTime, formatTRY } from '../lib/format';
import type { DashboardSummary, MessageLog } from '../types';

const TYPE_LABELS: Record<string, string> = {
  INTAKE: 'Araç teslim alındı',
  READY: 'Araç hazır',
  RETENTION: 'Geri çağırma',
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  SENT: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  SENT: 'Gönderildi',
  FAILED: 'Gönderilemedi',
};

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className={`mb-3 inline-flex rounded-xl p-2 ${tone}`}>{icon}</div>
      <p className="nums text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
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
        <h1 className="text-2xl font-bold">Yönetim Panosu</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<CircleDollarSign className="h-5 w-5 text-emerald-600" />} tone="bg-emerald-50" label="Günlük Ciro" value={formatTRY(summary?.revenue ?? 0)} />
        <StatCard icon={<Car className="h-5 w-5 text-brand-600" />} tone="bg-brand-50" label="Yıkanan Araç" value={String(summary?.completedCount ?? 0)} />
        <StatCard icon={<Clock3 className="h-5 w-5 text-amber-600" />} tone="bg-amber-50" label="Aktif İş" value={String(summary?.activeCount ?? 0)} />
        <StatCard icon={<MessageCircle className="h-5 w-5 text-green-600" />} tone="bg-green-50" label="Gönderilen Bildirim" value={String(summary?.messages.SENT ?? 0)} />
      </div>

      {/* Musteriye giden WhatsApp bildirimleri */}
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageCircle className="h-5 w-5 text-green-600" /> Müşteri Bildirimleri
          </h2>
          <div className="flex flex-wrap gap-3 text-xs font-medium">
            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> {summary?.messages.SENT ?? 0} gönderildi</span>
            <span className="flex items-center gap-1 text-amber-600"><Clock3 className="h-4 w-4" /> {summary?.messages.PENDING ?? 0} bekliyor</span>
            <span className="flex items-center gap-1 text-red-600"><XCircle className="h-4 w-4" /> {summary?.messages.FAILED ?? 0} gönderilemedi</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2.5 pr-4">Tarih / Saat</th>
                <th className="py-2.5 pr-4">Telefon</th>
                <th className="py-2.5 pr-4">Bildirim</th>
                <th className="py-2.5 pr-4">Durum</th>
                <th className="py-2.5 pr-4">Mesaj</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Henüz bildirim gönderilmedi.</td></tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap py-2.5 pr-4 text-slate-500">{formatDateTime(log.createdAt)}</td>
                  <td className="nums whitespace-nowrap py-2.5 pr-4 text-slate-600">{log.phone}</td>
                  <td className="py-2.5 pr-4 text-slate-700">{TYPE_LABELS[log.type] ?? log.type}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[log.status]}`}>
                      {STATUS_LABELS[log.status] ?? log.status}
                      {log.status === 'FAILED' && <AlertTriangle className="h-3.5 w-3.5" />}
                    </span>
                  </td>
                  <td className="max-w-md truncate py-2.5 pr-4 text-slate-600" title={log.preview}>{log.preview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
