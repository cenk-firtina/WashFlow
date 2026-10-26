// ============================================================================
// Metin yardimcilari: Turkce -> ASCII donusumu, plaka/telefon normalizasyonu
// ve WhatsApp numara formati.
// ============================================================================

const TR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'C',
  ğ: 'g', Ğ: 'G',
  ı: 'i', İ: 'I',
  ö: 'o', Ö: 'O',
  ş: 's', Ş: 'S',
  ü: 'u', Ü: 'U',
  â: 'a', Â: 'A',
  î: 'i', Î: 'I',
  û: 'u', Û: 'U',
};

/** Turkce karakterleri ve kalan aksanli harfleri ASCII'ye donusturur. */
export function toAscii(input: string): string {
  const mapped = input.replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, (ch) => TR_MAP[ch] ?? ch);
  // Kalan diakritikleri (ör. é, ñ) temizle.
  return mapped.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Plaka normalizasyonu: buyuk harf, bosluk/isaret temizligi (Turkce I sorunu dahil). */
export function normalizePlate(input: string): string {
  return toAscii(input)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/** Telefon normalizasyonu: rakam disini at, TR formatina getir (5XXXXXXXXX -> 05XXXXXXXXX). */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('90')) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('5')) digits = '0' + digits;
  return digits;
}

/**
 * WhatsApp Cloud API icin uluslararasi numara (ulke kodlu, + ve 0 olmadan).
 * ör. 05551112233 -> 905551112233 . Varsayilan ulke kodu 90 (TR).
 */
export function toWhatsAppNumber(input: string, countryCode = '90'): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith('0')) digits = digits.slice(1);
  return countryCode + digits;
}
