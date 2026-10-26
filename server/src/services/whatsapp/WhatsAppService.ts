import { env } from '../../config/env';
import { toWhatsAppNumber } from '../../utils/text';
import { CloudWhatsAppProvider } from './CloudProvider';
import { MockWhatsAppProvider } from './MockProvider';
import { WhatsAppProvider, WhatsAppSendResult } from './types';

// ----------------------------------------------------------------------------
// WhatsAppService: saglayicidan bagimsiz tek giris noktasi.
// - Numarayi uluslararasi formata cevirir (905551112233).
// - WHATSAPP_PROVIDER env'ine gore Mock veya Cloud kullanir.
// ----------------------------------------------------------------------------

export class WhatsAppService {
  private provider: WhatsAppProvider;

  constructor(provider?: WhatsAppProvider) {
    this.provider = provider ?? WhatsAppService.resolveProvider();
  }

  static resolveProvider(): WhatsAppProvider {
    switch (env.whatsapp.provider) {
      case 'cloud':
        return new CloudWhatsAppProvider();
      case 'mock':
      default:
        return new MockWhatsAppProvider();
    }
  }

  get providerName(): string {
    return this.provider.name;
  }

  async sendTemplate(
    phone: string,
    templateName: string,
    languageCode: string,
    params: string[],
  ): Promise<WhatsAppSendResult> {
    const to = toWhatsAppNumber(phone, env.whatsapp.defaultCountryCode);
    if (!/^\d{10,15}$/.test(to)) {
      return { success: false, error: `Gecersiz telefon numarasi: ${phone}` };
    }
    return this.provider.sendTemplate(to, templateName, languageCode, params);
  }
}

// Uygulama genelinde tekil instance.
let instance: WhatsAppService | null = null;
export function getWhatsAppService(): WhatsAppService {
  if (!instance) instance = new WhatsAppService();
  return instance;
}
