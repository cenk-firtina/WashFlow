import { BarChart3, Car, History, LayoutGrid, LogOut, Settings, Waves } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';

interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  end?: boolean;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Pano', short: 'Pano', icon: LayoutGrid, end: true },
  { to: '/kabul', label: 'Araç Kabul', short: 'Kabul', icon: Car },
  { to: '/gecmis', label: 'Geçmiş', short: 'Geçmiş', icon: History },
  { to: '/yonetim', label: 'Yönetim', short: 'Yönetim', icon: BarChart3 },
  { to: '/ayarlar', label: 'Ayarlar', short: 'Ayarlar', icon: Settings, adminOnly: true },
];

function initials(name?: string): string {
  if (!name) return '•';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function topNavClass({ isActive }: { isActive: boolean }) {
  return `relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'bg-white/10 text-white shadow-inner ring-1 ring-white/10'
      : 'text-brand-200/80 hover:bg-white/5 hover:text-white'
  }`;
}

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const items = NAV_ITEMS.filter((i) => !i.adminOnly || user?.role === 'ADMIN');

  return (
    <div className="flex min-h-screen flex-col">
      {/* Ust bar: koyu navy marka bandi */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-gradient-to-r from-brand-950 to-brand-900 shadow-pop">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-brand-950 shadow-pop ring-1 ring-white/20">
              <Waves className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              Wash<span className="text-accent-400">Flow</span>
            </span>
          </div>

          {/* Masaustu navigasyon */}
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} className={topNavClass}>
                <i.icon className="h-4 w-4" /> {i.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3 ring-1 ring-white/10 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-xs font-bold text-brand-950">
                {initials(user?.name)}
              </span>
              <span className="text-sm font-medium text-white">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              title="Çıkış"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-brand-200/80 transition-colors hover:bg-red-500/20 hover:text-red-200"
            >
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Icerik (mobilde alt bar icin ekstra alt bosluk) */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 sm:py-8 md:pb-8">
        <div key={location.pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      {/* Mobil alt tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur-lg md:hidden">
        <div
          className="mx-auto grid max-w-lg px-1 pb-[env(safe-area-inset-bottom)]"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-brand-700' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-xl px-4 py-1 transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                    <i.icon className="h-5 w-5" />
                  </span>
                  {i.short}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
