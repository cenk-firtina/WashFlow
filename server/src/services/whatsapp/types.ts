export interface WhatsAppSendResult {
  success: boolean;
  /** Saglayicinin dondurdugu mesaj id (loglama icin). */
  providerRef?: string;
  error?: string;
}

// Yeni bir WhatsApp saglayici eklemek icin bu arayuzu implemente edin.
export interface WhatsAppProvider {
  readonly name: string;
  /**
   * Onayli bir template mesaji gonderir.
   * @param to          Uluslararasi numara (ör. 905551112233)
   * @param templateName Meta'da onayli template adi
   * @param languageCode Template dil kodu (ör. "tr")
   * @param params       Template body parametreleri (sirali)
   */
  sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    params: string[],
  ): Promise<WhatsAppSendResult>;
}
