import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SETTING_DEFAULTS } from '../src/services/settings.service';

const prisma = new PrismaClient();

async function main() {
  // --- Kullanicilar ---
  const adminPass = await bcrypt.hash('admin123', 10);
  const opPass = await bcrypt.hash('operator123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@washflow.local' },
    update: {},
    create: { name: 'Yonetici', email: 'admin@washflow.local', passwordHash: adminPass, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'operator@washflow.local' },
    update: {},
    create: { name: 'Operator', email: 'operator@washflow.local', passwordHash: opPass, role: 'OPERATOR' },
  });

  // --- Hizmetler (kategorili) ---
  const services = [
    { name: 'Ic-Dis Yikama', category: 'Yikama', price: 350, durationMinutes: 40 },
    { name: 'Detayli Yikama', category: 'Yikama', price: 750, durationMinutes: 90 },
    { name: 'Motor Yikama', category: 'Yikama', price: 250, durationMinutes: 30 },
    { name: 'Cila & Koruma', category: 'Koruma', price: 1500, durationMinutes: 150 },
    { name: 'Ic Temizlik (Koltuk)', category: 'Ic Temizlik', price: 900, durationMinutes: 120 },
  ];
  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: { category: s.category } });
    } else {
      await prisma.service.create({ data: s });
    }
  }

  // --- Sistem ayarlari (varsayilanlar) ---
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  // --- Arac markalari (TR piyasasina gore; populer olanlar isaretli) ---
  const popular = [
    'Renault', 'Fiat', 'Volkswagen', 'Ford', 'Opel', 'Toyota', 'Hyundai',
    'Peugeot', 'Dacia', 'Mercedes-Benz', 'BMW', 'Audi', 'Honda', 'Citroen', 'Togg',
  ];
  const others = [
    'Alfa Romeo', 'BYD', 'Chery', 'Chevrolet', 'Cupra', 'DS Automobiles', 'Isuzu',
    'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Mazda', 'MG', 'MINI',
    'Mitsubishi', 'Nissan', 'Porsche', 'Seat', 'Skoda', 'Smart', 'SsangYong',
    'Subaru', 'Suzuki', 'Tesla', 'Volvo', 'Alpine', 'Maserati', 'Ferrari',
    'Lamborghini', 'Bentley', 'Mahindra',
  ];
  const brands = [
    ...popular.map((name) => ({ name, isPopular: true })),
    ...others.map((name) => ({ name, isPopular: false })),
  ];
  for (const b of brands) {
    await prisma.vehicleBrand.upsert({
      where: { name: b.name },
      update: { isPopular: b.isPopular },
      create: b,
    });
  }
  console.log(`  ${brands.length} arac markasi yuklendi (${popular.length} sik kullanilan).`);

  // --- Ornek musteri + arac (opsiyonel demo verisi) ---
  const demo = await prisma.customer.upsert({
    where: { phone: '05551112233' },
    update: {},
    create: {
      name: 'Ahmet Demir',
      phone: '05551112233',
      vehicles: { create: { plate: '34ABC123', brandModel: 'VW Passat', segment: 'SEDAN' } },
    },
  });

  console.log('Seed tamamlandi.');
  console.log('  ADMIN   -> admin@washflow.local / admin123');
  console.log('  OPERATOR-> operator@washflow.local / operator123');
  console.log(`  Demo musteri id=${demo.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
