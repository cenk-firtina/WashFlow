import { env } from '../../config/env';
import { WhatsAppProvider, WhatsAppSendResult } from './types';

// ----------------------------------------------------------------------------
// Meta WhatsApp Cloud API - template mesaj gonderimi.
// Dokuman: https://developers.facebook.com/docs/whatsapp/cloud-api
// Endpoint: POST https://graph.facebook.com/{version}/{phone_number_id}/messages
// Gereken: WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN (.env)
// Node 18+ global fetch kullanir, ek bagimlilik yok.
// ----------------------------------------------------------------------------

export class CloudWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'cloud';

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    params: string[],
  ): Promise<WhatsAppSendResult> {
    const { apiVersion, phoneNumberId, accessToken } = env.whatsapp.cloud;
    if (!phoneNumberId || !accessToken) {
      return { success: false, error: 'WhatsApp Cloud kimlik bilgileri (.env) eksik.' };
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: params.length
          ? [
              {
                type: 'body',
                parameters: params.map((text) => ({ type: 'text', text })),
              },
            ]
          : [],
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        messages?: { id: string }[];
        error?: { message?: string; code?: number };
      };

      if (res.ok && data.messages?.[0]?.id) {
        return { success: true, providerRef: data.messages[0].id };
      }
      return {
        success: false,
        error: data.error?.message
          ? `WhatsApp ${data.error.code ?? ''}: ${data.error.message}`
          : `WhatsApp gonderim hatasi (HTTP ${res.status})`,
      };
    } catch (err) {
      return { success: false, error: `WhatsApp baglanti hatasi: ${(err as Error).message}` };
    }
  }
}
