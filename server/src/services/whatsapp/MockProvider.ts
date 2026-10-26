import { WhatsAppProvider, WhatsAppSendResult } from './types';

// Gelistirme/provasyon icin: gercekten mesaj gondermez, konsola yazar.
export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'mock';

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    params: string[],
  ): Promise<WhatsAppSendResult> {
    const ref = `MOCK-WA-${Date.now()}`;
    // eslint-disable-next-line no-console
    console.log(
      `[whatsapp:mock] -> ${to} | template="${templateName}" (${languageCode}) | params=[${params.join(' | ')}] | ref=${ref}`,
    );
    return { success: true, providerRef: ref };
  }
}
