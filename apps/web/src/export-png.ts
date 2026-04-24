import * as htmlToImage from 'html-to-image';

export async function exportBuildAsPng(weaponName: string = 'build'): Promise<void> {
  const el = document.querySelector('.layout') as HTMLElement | null;
  if (!el) return;
  try {
    const dataUrl = await htmlToImage.toPng(el, {
      backgroundColor: '#07080c',
      pixelRatio: 2,
      cacheBust: true,
    });
    const link = document.createElement('a');
    const ts = new Date().toISOString().split('T')[0];
    const safeName = (weaponName || 'build').replace(/[^a-zA-Z0-9а-яА-Я-_]/g, '-');
    link.download = `divcalc-${safeName}-${ts}.png`;
    link.href = dataUrl;
    link.click();
  } catch (e) {
    console.error('PNG export failed', e);
    throw e;
  }
}

export function shareToTelegram(buildUrl: string, weaponName: string): void {
  const text = `Division 2 билд${weaponName ? ` «${weaponName}»` : ''} — ${buildUrl}`;
  const url = `https://t.me/share/url?url=${encodeURIComponent(buildUrl)}&text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}
