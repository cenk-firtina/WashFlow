import { Bell, Car, ChevronRight, Tag } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const SECTIONS = [
  { to: 'bildirimler', label: 'Bildirimler', desc: 'WhatsApp mesaj ayarlari', icon: Bell },
  { to: 'hizmetler', label: 'Hizmetler', desc: 'Hizmet, fiyat, sure & kategori', icon: Tag },
  { to: 'markalar', label: 'Arac Markalari', desc: 'Marka listesi & sik kullanilanlar', icon: Car },
];

export default function SettingsLayout() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Ayarlar</h1>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Genel basliklar */}
        <nav className="space-y-1 md:sticky md:top-20 md:self-start">
          {SECTIONS.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border p-3 transition ${
                  isActive
                    ? 'border-brand-200 bg-brand-50 text-brand-700'
                    : 'border-transparent text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-lg p-2 ${isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="block truncate text-xs text-slate-400">{s.desc}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Detay sayfasi */}
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
