import { ProgramEventItem } from '../types/memorial';

export interface ProcessedPhotoUpload {
  title: string;
  caption: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  fileSizeBytes: number;
  imageDataUrl: string;
  exifStripped: boolean;
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Strips all EXIF and GPS metadata from an image file by drawing it onto a clean
 * HTML5 Canvas and re-encoding it.
 */
export async function stripExifAndPrepareImage(
  file: File,
  customTitle?: string,
  customCaption?: string
): Promise<ProcessedPhotoUpload> {
  if (!ALLOWED_MIMES.includes(file.type as any)) {
    throw new Error(
      `Format non supporté (${file.type || 'inconnu'}). Veuillez choisir un fichier JPEG, PNG ou WebP.`
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `Le fichier « ${file.name} » dépasse la limite maximale de 10 Mo.`
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image corrompue ou illisible.'));
      img.onload = () => {
        try {
          const maxDim = 2048;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDim || height > maxDim) {
            if (width >= height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible d’initialiser le traitement graphique.'));
            return;
          }

          // Fill white background for JPEG
          if (file.type === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          const outputMime = file.type as 'image/jpeg' | 'image/png' | 'image/webp';
          const cleanDataUrl = canvas.toDataURL(outputMime, 0.9);
          const approximateBytes = Math.round((cleanDataUrl.length * 3) / 4);

          resolve({
            title:
              customTitle?.trim() ||
              file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
            caption: customCaption?.trim() || '',
            mimeType: outputMime,
            fileSizeBytes: Math.min(file.size, approximateBytes),
            imageDataUrl: cleanDataUrl,
            exifStripped: true,
          });
        } catch (err) {
          reject(
            err instanceof Error
              ? err
              : new Error('Erreur lors du retrait des métadonnées GPS.')
          );
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function shareMemorialUrl(
  title = 'En mémoire de Papa Tamfeu Ariel Schogun | 1989–2026',
  text = 'Faire-part de deuil et hommage à Papa Tamfeu Ariel Schogun (1989–2026).'
): Promise<'shared' | 'copied' | 'failed'> {
  const url = window.location.href;
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return 'failed';
      }
    }
  }

  const copied = await copyTextToClipboard(url);
  return copied ? 'copied' : 'failed';
}

export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  const cleanDigits = rawPhone.replace(/[^\d]/g, '');
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanDigits}?text=${encodedText}`;
}

export function triggerBrowserPrint(): void {
  window.print();
}

export function downloadValidatedProgramIcs(
  events: ProgramEventItem[],
  displayName: string
): void {
  const nowStamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hommage Papa Tamfeu Ariel Schogun//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-TIMEZONE:Africa/Douala',
  ];

  events.forEach((evt, index) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:memorial-ptas-${evt.id}-${index}@hommage`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(
      `SUMMARY:${evt.title} — Hommage à ${displayName} (${evt.dayTitleTransmitted}, ${evt.timeLabel})`
    );
    lines.push(
      `DESCRIPTION:${evt.locationDetails || evt.location} (Fuseau : Africa/Douala)`
    );
    lines.push(`LOCATION:${evt.location}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'programme-obseques-papa-tamfeu-ariel-schogun.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
