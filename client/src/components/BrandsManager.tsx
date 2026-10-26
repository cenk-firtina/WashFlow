import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Pencil, Plus, Power, Star, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { api, apiError } from '../lib/api';
import { useAuth } from '../store/auth';
import type { VehicleBrand } from '../types';

interface FormState {
  id: number | null;
  name: string;
  isPopular: boolean;
}
const EMPTY: FormState = { id: null, name: '', isPopular: false };

export function BrandsManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');

  const { data: brands = [] } = useQuery({
    queryKey: ['brandsAll'],
    queryFn: async () => (await api.get<VehicleBrand[]>('/brands', { params: { all: true } })).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['brandsAll'] });
    queryClient.invalidateQueries({ queryKey: ['brands'] }); // kabul ekranindaki dropdown
  }

  const save = useMutation({
    mutationFn: async () => {
      const body = { name: form.name.trim(), isPopular: form.isPopular };
      if (form.id) return (await api.patch(`/brands/${form.id}`, body)).data;
      return (await api.post('/brands', body)).data;
    },
    onSuccess: () => { invalidate(); setForm(EMPTY); setError(''); },
    onError: (err) => setError(apiError(err)),
  });

  const patchBrand = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<VehicleBrand> }) =>
      (await api.patch(`/brands/${id}`, data)).data,
    onSuccess: invalidate,
    onError: (err) => setError(apiError(err)),
  });

  const popularCount = brands.filter((b) => b.isPopular && b.active).length;
  const canSubmit = form.name.trim().length >= 1;

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Star className="h-5 w-5 text-amber-500" /> Arac Markalari
        </h2>
        <span className="text-sm text-slate-400">
          {brands.filter((b) => b.active).length} marka · {popularCount} sik kullanilan
        </span>
      </div>

      {isAdmin && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-600">
            {form.id ? `Marka duzenleniyor (#${form.id})` : 'Yeni marka ekle'}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Marka adi (ör. Volkswagen)"
              className="min-w-[220px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.isPopular}
                onChange={(e) => setForm((f) => ({ ...f, isPopular: e.target.checked }))}
              />
              Sik kullanilan
            </label>
            <button
              onClick={() => save.mutate()}
              disabled={!canSubmit || save.isPending}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : form.id ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {form.id ? 'Guncelle' : 'Ekle'}
            </button>
            {form.id && (
              <button onClick={() => { setForm(EMPTY); setError(''); }} className="rounded-lg border border-slate-300 px-2 py-2 text-slate-500 hover:bg-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="py-2 pr-4 font-medium">Marka</th>
              <th className="py-2 pr-4 font-medium">Sik Kullanilan</th>
              <th className="py-2 pr-4 font-medium">Durum</th>
              {isAdmin && <th className="py-2 pr-4 text-right font-medium">Islem</th>}
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 && (
              <tr><td colSpan={isAdmin ? 4 : 3} className="py-8 text-center text-slate-400">Marka yok.</td></tr>
            )}
            {brands.map((b) => (
              <tr key={b.id} className={`border-b border-slate-50 ${!b.active ? 'opacity-50' : ''}`}>
                <td className="py-2 pr-4 font-medium">{b.name}</td>
                <td className="py-2 pr-4">
                  <button
                    disabled={!isAdmin}
                    onClick={() => patchBrand.mutate({ id: b.id, data: { isPopular: !b.isPopular } })}
                    title={b.isPopular ? 'Sik kullanilanlardan cikar' : 'Sik kullanilan yap'}
                    className={`${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <Star className={`h-5 w-5 ${b.isPopular ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                  </button>
                </td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {b.active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="py-2 pr-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setForm({ id: b.id, name: b.name, isPopular: b.isPopular })} title="Duzenle" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
                        <Pencil className="h-4 w-4" />
                      </button>
                      {b.active ? (
                        <button onClick={() => patchBrand.mutate({ id: b.id, data: { active: false } })} title="Pasiflestir" className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button onClick={() => patchBrand.mutate({ id: b.id, data: { active: true } })} title="Aktiflestir" className="rounded-lg p-1.5 text-green-500 hover:bg-green-50">
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
        <p className="mt-3 text-xs text-slate-400">Marka ekleme/duzenleme yetkisi yalnizca yoneticidedir.</p>
      )}
    </section>
  );
}
