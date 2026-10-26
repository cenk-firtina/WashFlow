import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, Loader2, Pencil, Plus, Power, Tag, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { api, apiError } from '../lib/api';
import { formatTRY } from '../lib/format';
import { useAuth } from '../store/auth';
import type { Service } from '../types';

interface FormState {
  id: number | null;
  name: string;
  category: string;
  price: string;
  durationMinutes: string;
}

const EMPTY: FormState = { id: null, name: '', category: '', price: '', durationMinutes: '' };

export function ServicesManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');

  const { data: services = [] } = useQuery({
    queryKey: ['servicesAll'],
    queryFn: async () => (await api.get<Service[]>('/services', { params: { all: true } })).data,
  });

  // Mevcut kategoriler (hizli secim icin datalist).
  const categories = useMemo(
    () => Array.from(new Set(services.map((s) => s.category).filter(Boolean))).sort(),
    [services],
  );

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['servicesAll'] });
    queryClient.invalidateQueries({ queryKey: ['services'] }); // kabul ekranindaki liste
  }

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        category: form.category.trim() || 'Genel',
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
      };
      if (form.id) return (await api.patch(`/services/${form.id}`, body)).data;
      return (await api.post('/services', body)).data;
    },
    onSuccess: () => {
      invalidate();
      setForm(EMPTY);
      setError('');
    },
    onError: (err) => setError(apiError(err)),
  });

  const toggleActive = useMutation({
    mutationFn: async (s: Service) => (await api.patch(`/services/${s.id}`, { active: !s.active })).data,
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err)),
  });

  function startEdit(s: Service) {
    setForm({
      id: s.id,
      name: s.name,
      category: s.category,
      price: String(s.price),
      durationMinutes: String(s.durationMinutes),
    });
    setError('');
  }

  const canSubmit = form.name.trim().length >= 2 && Number(form.price) >= 0 && Number(form.durationMinutes) > 0;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Tag className="h-5 w-5 text-brand-600" /> Hizmet Yonetimi
        </h2>
        <span className="text-sm text-slate-400">{services.filter((s) => s.active).length} aktif hizmet</span>
      </div>

      {/* Ekle / Duzenle formu (sadece ADMIN) */}
      {isAdmin && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-600">
            {form.id ? `Hizmet duzenleniyor (#${form.id})` : 'Yeni hizmet ekle'}
          </p>
          <div className="grid gap-3 sm:grid-cols-12">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Hizmet adi"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-4"
            />
            <input
              list="service-categories"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Kategori"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-3"
            />
            <datalist id="service-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <div className="relative sm:col-span-2">
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="Fiyat"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-8 text-sm"
              />
              <span className="pointer-events-none absolute right-2 top-2 text-xs text-slate-400">₺</span>
            </div>
            <div className="relative sm:col-span-2">
              <input
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                placeholder="Sure"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-9 text-sm"
              />
              <span className="pointer-events-none absolute right-2 top-2 text-xs text-slate-400">dk</span>
            </div>
            <div className="flex gap-2 sm:col-span-1">
              <button
                onClick={() => save.mutate()}
                disabled={!canSubmit || save.isPending}
                title={form.id ? 'Guncelle' : 'Ekle'}
                className="flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
              {form.id && (
                <button
                  onClick={() => { setForm(EMPTY); setError(''); }}
                  title="Vazgec"
                  className="rounded-lg border border-slate-300 px-2 text-slate-500 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      {/* Hizmet tablosu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="py-2 pr-4 font-medium">Hizmet</th>
              <th className="py-2 pr-4 font-medium">Kategori</th>
              <th className="py-2 pr-4 font-medium">Fiyat</th>
              <th className="py-2 pr-4 font-medium">Sure</th>
              <th className="py-2 pr-4 font-medium">Durum</th>
              {isAdmin && <th className="py-2 pr-4 font-medium text-right">Islem</th>}
            </tr>
          </thead>
          <tbody>
            {services.length === 0 && (
              <tr><td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400">Hizmet yok.</td></tr>
            )}
            {services.map((s) => (
              <tr key={s.id} className={`border-b border-slate-50 ${!s.active ? 'opacity-50' : ''}`}>
                <td className="py-2 pr-4 font-medium">{s.name}</td>
                <td className="py-2 pr-4">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s.category}</span>
                </td>
                <td className="py-2 pr-4 font-semibold text-slate-700">{formatTRY(s.price)}</td>
                <td className="whitespace-nowrap py-2 pr-4 text-slate-500">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {s.durationMinutes} dk</span>
                </td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {s.active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(s)} title="Duzenle" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {s.active ? (
                        <button onClick={() => toggleActive.mutate(s)} title="Pasiflestir" className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => toggleActive.mutate(s)} title="Aktiflestir" className="rounded-lg p-1.5 text-green-500 hover:bg-green-50">
                          <Power className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isAdmin && (
        <p className="mt-3 text-xs text-slate-400">Hizmet ekleme/duzenleme yetkisi yalnizca yoneticidedir.</p>
      )}
    </section>
  );
}
