import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Clock, MessageSquare, Phone, Undo2, X } from 'lucide-react';
import { api } from '../lib/api';
import { elapsedSince, formatTRY } from '../lib/format';
import { BOARD_COLUMNS, NEXT_STATUS, PREV_STATUS, STATUS_LABELS } from '../lib/status';
import type { Ticket, TicketStatus } from '../types';

export default function BoardPage() {
  const queryClient = useQueryClient();

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Operasyon Panosu</h1>
        <span className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Canli (5 sn)
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BOARD_COLUMNS.map((col) => {
          const columnTickets = tickets.filter((t) => t.status === col.status);
          return (
            <div key={col.status} className="overflow-hidden rounded-2xl bg-slate-50">
              <div className={`h-1.5 ${col.bar}`} />
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="font-semibold">{col.title}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                  {columnTickets.length}
                </span>
              </div>

              <div className="space-y-3 px-3 pb-3">
                {isLoading && <p className="px-1 text-sm text-slate-400">Yukleniyor...</p>}
                {!isLoading && columnTickets.length === 0 && (
                  <p className="px-1 py-6 text-center text-sm text-slate-400">Bos</p>
                )}

                {columnTickets.map((t) => {
                  const next = NEXT_STATUS[t.status];
                  const prev = PREV_STATUS[t.status];
                  return (
                    <div key={t.id} className="rounded-xl bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-lg font-bold tracking-wide">{t.vehicle.plate}</p>
                          <p className="text-xs text-slate-400">{t.ticketCode}</p>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" /> {elapsedSince(t.createdAt)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {t.services.map((s) => (
                          <span key={s.id} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {s.service.name}
                          </span>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {t.vehicle.customer.name}</span>
                        <span className="font-semibold text-slate-700">{formatTRY(t.totalPrice)}</span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        {prev && (
                          <button
                            onClick={() => changeStatus.mutate({ id: t.id, status: prev })}
                            disabled={changeStatus.isPending}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 text-sm text-slate-500 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                            title={`Geri al: ${STATUS_LABELS[prev]}`}
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                        )}
                        {next && (
                          <button
                            onClick={() => changeStatus.mutate({ id: t.id, status: next })}
                            disabled={changeStatus.isPending}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
                          >
                            {STATUS_LABELS[next]} <ArrowRight className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => changeStatus.mutate({ id: t.id, status: 'CANCELLED' })}
                          className="rounded-lg border border-slate-200 px-2 text-slate-400 hover:border-red-200 hover:text-red-500"
                          title="Iptal"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {t.status === 'READY' && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-green-600">
                          <MessageSquare className="h-3 w-3" /> READY WhatsApp kuyruga alindi
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
