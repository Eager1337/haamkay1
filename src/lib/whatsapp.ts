export const WHATSAPP_NUMBER = '23276682626';

const isMobile = () =>
  typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

/**
 * Builds a WhatsApp link that avoids api.whatsapp.com (blocked on some networks).
 * Mobile uses the wa.me short link, desktop goes straight to WhatsApp Web.
 */
export function whatsappUrl(message?: string, number: string = WHATSAPP_NUMBER) {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return isMobile()
    ? `https://wa.me/${number}${text}`
    : `https://web.whatsapp.com/send?phone=${number}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
}

/** Opens WhatsApp in a new tab, falling back to the alternate host if blocked. */
export function openWhatsApp(message?: string, number: string = WHATSAPP_NUMBER) {
  const url = whatsappUrl(message, number);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) window.location.href = url;
}
