/** Shared UI state: pro/mini mode, mobile detection, etc. */

class UiState {
  pro = $state(false);
  isMobile = $state(false);

  init() {
    try {
      this.pro = localStorage.getItem('divcalc:pro') === '1';
    } catch {
      // ignore
    }
    this.isMobile = window.matchMedia('(max-width: 900px)').matches;
    window.matchMedia('(max-width: 900px)').addEventListener('change', (e) => {
      this.isMobile = e.matches;
    });
  }

  setPro(v: boolean) {
    this.pro = v;
    try { localStorage.setItem('divcalc:pro', v ? '1' : '0'); } catch { /* ignore */ }
  }
}

export const ui = new UiState();
