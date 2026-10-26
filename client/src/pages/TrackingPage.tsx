import { useQuery } from '@tanstack/react-query';
import { Check, CheckCircle2, Clock, Loader2, Waves, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import type { TrackingStatus } from '../types';

export default function TrackingPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tracking', token],
    queryFn: async () => (await api.get<TrackingStatus>(`/tracking/${token}`)).data,
    refetchInterval: 5000, // Musteri tarafi: 5 sn polling
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-6 text-center">
        <XCircle className="h-12 w-12 text-red-400" />
        <h1 className="text-lg font-semibold">Takip kaydi bulunamadi</h1>
        <p className="text-sm text-slate-500">Baglanti hatali veya suresi dolmus olabilir.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-600 to-brand-700 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <Waves className="h-7 w-7" />
          <span className="text-xl font-bold">WashFlow</span>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="text-center">
            <p className="text-sm text-slate-500">Sn. {data.customerName}</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-wider">{data.plate}</p>
            {data.brandModel && <p className="text-sm text-slate-400">{data.brandModel}</p>}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-1">
            {data.services.map((s, i) => (
              <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {s}
              </span>
            ))}
          </div>

          {/* Durum rozeti / kalan sure */}
          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
            {data.isCancelled ? (
              <p className="font-semibold text-red-600">Islem iptal edildi</p>
            ) : data.isCompleted ? (
              <p className="flex items-center justify-center gap-2 font-semibold text-emerald-600">
                <CheckCircle2 className="h-5 w-5" /> Araciniz teslim edildi
              </p>
            ) : data.status === 'READY' ? (
              <p className="flex items-center justify-center gap-2 text-lg font-bold text-green-600">
                <CheckCircle2 className="h-6 w-6" /> Araciniz teslime hazir!
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-500">Durum</p>
                <p className="text-lg font-bold text-brand-700">{data.statusLabel}</p>
                {data.remainingMinutes !== null && (
                  <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                    <Clock className="h-4 w-4" /> Tahmini kalan: ~{data.remainingMinutes} dk
                  </p>
                )}
              </>
            )}
          </div>

          {/* Adim adim progress */}
          {!data.isCancelled && (
            <ol className="mt-6 space-y-0">
              {data.steps.map((step, i) => {
                const isLast = i === data.steps.length - 1;
                return (
                  <li key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                          step.done
                            ? 'border-green-500 bg-green-500 text-white'
                            : step.current
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 bg-white text-slate-300'
                        }`}
                      >
                        {step.done ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      {!isLast && <div className={`w-0.5 flex-1 ${step.done ? 'bg-green-500' : 'bg-slate-200'}`} style={{ minHeight: 28 }} />}
                    </div>
                    <div className={`pb-6 pt-1 ${step.current ? 'font-semibold text-brand-700' : step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                      {step.label}
                      {step.current && <span className="ml-2 inline-block animate-pulse text-xs text-brand-500">● isleniyor</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-white/70">Bu sayfa otomatik olarak guncellenir.</p>
      </div>
    </div>
  );
}
