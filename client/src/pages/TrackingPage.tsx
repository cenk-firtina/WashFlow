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
    refetchInterval: 5000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-brand-950 px-6 text-center">
        <XCircle className="h-12 w-12 text-red-400" />
        <h1 className="text-lg font-semibold text-white">Takip kaydı bulunamadı</h1>
        <p className="text-sm text-brand-200">Bağlantı hatalı veya süresi dolmuş olabilir.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-950 px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md animate-fade-up">
        <div className="mb-6 flex items-center justify-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Waves className="h-5 w-5" />
          </span>
          <span className="text-xl font-bold tracking-tight">WashFlow</span>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-pop">
          {/* Plaka basligi */}
          <div className="bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-6 text-center text-white">
            <p className="text-sm text-brand-200">Sn. {data.customerName}</p>
            <p className="mt-1 inline-block rounded-lg bg-white/10 px-4 py-1 font-mono text-3xl font-bold tracking-widest ring-1 ring-white/20">
              {data.plate}
            </p>
            {data.brandModel && <p className="mt-1 text-sm text-brand-200">{data.brandModel}</p>}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {data.services.map((s, i) => (
                <span key={i} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white ring-1 ring-white/15">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Durum */}
            <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-100">
              {data.isCancelled ? (
                <p className="font-semibold text-red-600">İşlem iptal edildi</p>
              ) : data.isCompleted ? (
                <p className="flex items-center justify-center gap-2 font-semibold text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" /> Aracınız teslim edildi
                </p>
              ) : data.status === 'READY' ? (
                <p className="flex items-center justify-center gap-2 text-lg font-bold text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" /> Aracınız teslime hazır!
                </p>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Güncel Durum</p>
                  <p className="text-xl font-bold text-brand-700">{data.statusLabel}</p>
                  {data.remainingMinutes !== null && (
                    <p className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                      <Clock className="h-4 w-4" /> Tahmini kalan: ~{data.remainingMinutes} dk
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Adimlar */}
            {!data.isCancelled && (
              <ol className="space-y-0">
                {data.steps.map((step, i) => {
                  const isLast = i === data.steps.length - 1;
                  return (
                    <li key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                            step.done
                              ? 'bg-emerald-500 text-white'
                              : step.current
                                ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                                : 'bg-slate-100 text-slate-300'
                          }`}
                        >
                          {step.done ? <Check className="h-5 w-5" /> : i + 1}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`} style={{ minHeight: 30 }} />
                        )}
                      </div>
                      <div className={`pb-7 pt-1.5 ${step.current ? 'font-semibold text-brand-700' : step.done ? 'text-slate-700' : 'text-slate-400'}`}>
                        {step.label}
                        {step.current && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-brand-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" /> işleniyor
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-brand-300/80">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Bu sayfa otomatik güncellenir
        </p>
      </div>
    </div>
  );
}
