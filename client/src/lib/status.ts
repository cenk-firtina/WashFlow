import type { TicketStatus } from '../types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  QUEUED: 'Sirada',
  WASHING: 'Yikamada',
  DETAILING: 'Kurulama / Detay',
  READY: 'Teslime Hazir',
  COMPLETED: 'Teslim Edildi',
  CANCELLED: 'Iptal',
};

// Kanban sutunlari (sirali). `bar` = ust renkli serit (yuvarlak koseye uyumlu).
export const BOARD_COLUMNS: { status: TicketStatus; title: string; bar: string }[] = [
  { status: 'QUEUED', title: 'Sirada', bar: 'bg-slate-400' },
  { status: 'WASHING', title: 'Yikamada', bar: 'bg-blue-500' },
  { status: 'DETAILING', title: 'Kurulama / Detay', bar: 'bg-amber-500' },
  { status: 'READY', title: 'Teslime Hazir', bar: 'bg-green-500' },
];

// Bir durumdan ilerlenebilecek sonraki durum.
export const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  QUEUED: 'WASHING',
  WASHING: 'DETAILING',
  DETAILING: 'READY',
  READY: 'COMPLETED',
};

export const STATUS_BADGE: Record<TicketStatus, string> = {
  QUEUED: 'bg-slate-100 text-slate-700',
  WASHING: 'bg-blue-100 text-blue-700',
  DETAILING: 'bg-amber-100 text-amber-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
