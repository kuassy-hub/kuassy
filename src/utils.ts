/**
 * Utility functions for KuassyShop
 */

export function cleanPhone(raw: string | undefined | null): string {
  return String(raw || '').replace(/\D/g, '');
}

export function formatPhoneDisplay(raw: string | undefined | null): string {
  if (!raw) return '';
  const cleaned = cleanPhone(raw);
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return raw;
}

export function formatDate(timestamp: number | undefined | null): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Image shrinker matching original script: compresses to max 600px, 75% quality JPEG DataURL
 */
export function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erreur de chargement de l\'image'));
      img.onload = () => {
        const maxDim = 600;
        const k = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * k);
        canvas.height = Math.round(img.height * k);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Audio beep alert on new order (Oscillator 880Hz, 400ms)
 */
export function playOrderAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      try {
        osc.stop();
        ctx.close();
      } catch {
        // ignore
      }
    }, 450);
  } catch (e) {
    console.warn('Audio alert error:', e);
  }
}

/**
 * Desktop push notification
 */
export function triggerDesktopNotification(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ED254E"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3.8 6h16.4M16 10a4 4 0 0 1-8 0"/></svg>'
      });
    }
  } catch {
    // Ignore notification error
  }
}

/**
 * WhatsApp link to message a client
 */
export function getWhatsAppClientLink(phone: string, text?: string): string {
  const clean = cleanPhone(phone);
  if (!clean) return '#';
  const param = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${clean}${param}`;
}

/**
 * WhatsApp link to notify supplier with formatted client request
 */
export function getWhatsAppSupplierLink(
  supplierPhone: string,
  clientName: string,
  clientTel: string,
  itemName: string,
  price?: string
): string {
  const clean = cleanPhone(supplierPhone);
  if (!clean) return '#';
  const msg = `Bonjour, confirmation : mon client ${clientName} (${clientTel}) souhaite acheter : ${itemName}${price ? ` pour ${price}` : ''}.`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

/**
 * WhatsApp link for customer placing an order to send directly to shop owner
 */
export function getWhatsAppShopOrderLink(
  shopPhone: string,
  itemName: string,
  price: string,
  clientName: string,
  clientTel: string,
  address?: string,
  note?: string
): string {
  const clean = cleanPhone(shopPhone);
  if (!clean) return '#';
  let msg = `🛍️ *NOUVELLE COMMANDE SUR LA BOUTIQUE*\n\n`;
  msg += `• *Article:* ${itemName}\n`;
  if (price) msg += `• *Prix:* ${price}\n`;
  msg += `• *Client:* ${clientName}\n`;
  msg += `• *Téléphone:* ${clientTel}\n`;
  if (address) msg += `• *Livraison:* ${address}\n`;
  if (note) msg += `• *Note:* ${note}\n\n`;
  msg += `Merci de confirmer la disponibilité et la livraison !`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}
