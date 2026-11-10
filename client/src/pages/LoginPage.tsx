import { KeyRound, Loader2, Mail, Waves } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@washflow.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-950 px-4 py-10">
      {/* Arka plan: lacivert derinlik + yumusak isiklar */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pop ring-1 ring-white/20">
            <Waves className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">WashFlow</h1>
            <p className="text-sm text-brand-200">Oto Yıkama Yönetim Paneli</p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-3xl border border-white/10 bg-white/95 p-7 shadow-pop backdrop-blur"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">E-posta</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Şifre</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white shadow-card transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Giriş Yap
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-300/80">© WashFlow · Tüm hakları saklıdır</p>
      </div>
    </div>
  );
}
