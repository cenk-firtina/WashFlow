import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Loader2, Search, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api';
import { formatTRY } from '../lib/format';
import type { Service, Ticket, VehicleSegment } from '../types';

const SEGMENTS: { value: VehicleSegment; label: string }[] = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'VAN', label: 'Van' },
];

export default function IntakePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [plate, setPlate] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [brandModel, setBrandModel] = useState('');
  const [segment, setSegment] = useState<VehicleSegment>('SEDAN');
  const [allowMarketingSms, setAllowMarketingSms] = useState(true);
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [lookupState, setLookupState] = useState<'idle' | 'found' | 'new'>('idle');
  const [error, setError] = useState('');
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get<Service[]>('/services')).data,
  });

  const lookup = useMutation({
    mutationFn: async (p: string) => (await api.get('/vehicles/lookup', { params: { plate: p } })).data,
    onSuccess: (data) => {
      if (data.found && data.vehicle) {
        const v = data.vehicle;
        setCustomerId(v.customer.id);
        setName(v.customer.name);
        setPhone(v.customer.phone);
        setBrandModel(v.brandModel ?? '');
        setSegment(v.segment);
        setAllowMarketingSms(v.customer.allowMarketingSms);
        setLookupState('found');
      } else {
        setCustomerId(null);
        setLookupState('new');
      }
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const payload = {
        plate,
        brandModel: brandModel || undefined,
        segment,
        notes: notes || undefined,
        serviceIds: selected,
        customer: customerId
          ? { id: customerId }
          : { name, phone, allowMarketingSms },
      };
      return (await api.post<Ticket>('/tickets', payload)).data;
    },
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      setCreatedTicket(ticket);
    },
    onError: (err) => setError(apiError(err)),
  });

  const total = services.filter((s) => selected.includes(s.id)).reduce((sum, s) => sum + Number(s.price), 0);
  const totalMinutes = services
    .filter((s) => selected.includes(s.id))
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  function toggleService(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function resetForm() {
    setPlate('');
    setCustomerId(null);
    setName('');
    setPhone('');
    setBrandModel('');
    setSegment('SEDAN');
    setNotes('');
    setSelected([]);
    setLookupState('idle');
    setError('');
    setCreatedTicket(null);
  }

  function onPlateBlur() {
    const trimmed = plate.trim();
    if (trimmed.length >= 4) lookup.mutate(trimmed);
  }

  // ---- Basari ekrani ----
  if (createdTicket) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto mb-3 h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">Arac Kabul Edildi</h2>
        <p className="mt-1 text-slate-500">
          Bilet <span className="font-mono font-semibold">{createdTicket.ticketCode}</span> olusturuldu, INTAKE
          WhatsApp mesaji kuyruga alindi.
        </p>
        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <p><b>Plaka:</b> {createdTicket.vehicle.plate}</p>
          <p><b>Musteri:</b> {createdTicket.vehicle.customer.name}</p>
          <p><b>Tahmini teslim:</b> {createdTicket.estimatedReadyAt ? new Date(createdTicket.estimatedReadyAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
          <p><b>Takip linki:</b> <span className="font-mono">/t/{createdTicket.trackingToken}</span></p>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={resetForm} className="flex-1 rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700">
            Yeni Kabul
          </button>
          <button onClick={() => navigate('/')} className="flex-1 rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50">
            Panoya Git
          </button>
        </div>
      </div>
    );
  }

  const canSubmit = plate.trim().length >= 4 && selected.length > 0 && (customerId || (name && phone));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* SOL: Arac & Musteri */}
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">1. Arac Bilgisi</h2>
          <label className="mb-1 block text-sm font-medium text-slate-700">Plaka</label>
          <div className="flex gap-2">
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onBlur={onPlateBlur}
              placeholder="34ABC123"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-lg font-mono uppercase tracking-wider outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <button
              onClick={onPlateBlur}
              disabled={lookup.isPending}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 text-white hover:bg-slate-900 disabled:opacity-60"
            >
              {lookup.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              Sorgula
            </button>
          </div>

          {lookupState === 'found' && (
            <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Kayitli musteri bulundu, bilgiler dolduruldu.
            </p>
          )}
          {lookupState === 'new' && (
            <p className="mt-2 flex items-center gap-1 text-sm text-amber-600">
              <UserPlus className="h-4 w-4" /> Yeni plaka. Lutfen musteri bilgilerini girin.
            </p>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Marka / Model</label>
              <input
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
                placeholder="VW Passat"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Segment</label>
              <div className="flex gap-2">
                {SEGMENTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSegment(s.value)}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium ${
                      segment === s.value ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">2. Musteri</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Ad Soyad</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!!customerId}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Telefon</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!!customerId}
                placeholder="05xxxxxxxxx"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100"
              />
            </div>
          </div>
          {!customerId && (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={allowMarketingSms} onChange={(e) => setAllowMarketingSms(e.target.checked)} />
              Kampanya / hatirlatma mesajlarina izin veriyor
            </label>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">3. Hizmetler</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const active = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                    active ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5">{s.category}</span>
                      <span>{s.durationMinutes} dk</span>
                    </div>
                  </div>
                  <span className="font-semibold text-slate-700">{formatTRY(s.price)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">Not (opsiyonel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </section>
      </div>

      {/* SAG: Ozet */}
      <aside className="lg:col-span-1">
        <div className="sticky top-20 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Ozet</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Secili hizmet</span><span>{selected.length}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Tahmini sure</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {totalMinutes} dk</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
              <span>Toplam</span><span>{formatTRY(total)}</span>
            </div>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
            Kabul Et
          </button>
          <p className="mt-2 text-center text-xs text-slate-400">
            Kabul edildiginde musteriye otomatik INTAKE WhatsApp mesaji gonderilir.
          </p>
        </div>
      </aside>
    </div>
  );
}
