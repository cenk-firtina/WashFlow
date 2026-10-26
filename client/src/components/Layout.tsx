import { BarChart3, Car, LayoutGrid, LogOut, Settings, Tags, Waves } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';

const linkBase =
  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

function navClass({ isActive }: { isActive: boolean }) {
  return `${linkBase} ${isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`;
}

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2 text-brand-700">
            <Waves className="h-6 w-6" />
            <span className="text-lg font-bold">WashFlow</span>
          </div>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navClass}>
              <LayoutGrid className="h-4 w-4" /> Pano
            </NavLink>
            <NavLink to="/kabul" className={navClass}>
              <Car className="h-4 w-4" /> Arac Kabul
            </NavLink>
            <NavLink to="/yonetim" className={navClass}>
              <BarChart3 className="h-4 w-4" /> Yonetim
            </NavLink>
            {user?.role === 'ADMIN' && (
              <>
                <NavLink to="/markalar" className={navClass}>
                  <Tags className="h-4 w-4" /> Markalar
                </NavLink>
                <NavLink to="/ayarlar" className={navClass}>
                  <Settings className="h-4 w-4" /> Ayarlar
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" /> Cikis
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
