import { Car } from 'lucide-react';
import { BrandsManager } from '../components/BrandsManager';

export default function BrandsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Car className="h-6 w-6 text-brand-600" /> Marka Yonetimi
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Arac Kabul ekranindaki marka listesini buradan yonetin. "Sik kullanilan" markalar
          dropdown'da en ustte gosterilir.
        </p>
      </div>
      <BrandsManager />
    </div>
  );
}
