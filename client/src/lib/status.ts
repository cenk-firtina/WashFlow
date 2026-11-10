import type { TicketStatus } from '../types';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  QUEUED: 'Sırada',
  WASHING: 'Yıkamada',
  DETAILING: 'Kurulama / Detay',
  READY: 'Teslime Hazır',
  COMPLETED: 'Teslim Edildi',
  CANCELLED: 'İptal',
};

// Kanban sutunlari (sirali). `bar` = ust renkli serit (yuvarlak koseye uyumlu).
// Panoda tek aktif durum: Islemde (QUEUED). "Tamamlandi" -> COMPLETED.
export const BOARD_COLUMNS: { status: TicketStatus; title: string; bar: string }[] = [
  { status: 'QUEUED', title: 'İşlemde', bar: 'bg-brand-500' },
];

// Bir durumdan ilerlenebilecek sonraki durum.
export const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  QUEUED: 'COMPLETED',
};

// Geri alma kullanilmiyor.
export const PREV_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {};

export const STATUS_BADGE: Record<TicketStatus, string> = {
  QUEUED: 'bg-slate-100 text-slate-700',
  WASHING: 'bg-blue-100 text-blue-700',
  DETAILING: 'bg-amber-100 text-amber-700',
  READY: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
