import { BrowserStorageService, idbGet, idbSet, STORAGE_KEY, buildStandaloneGameHtml } from './BrowserStorageService';
import { TauriStorageService } from './TauriStorageService';
import { isTauri } from '../runtime';

export { BrowserStorageService, TauriStorageService, idbGet, idbSet, STORAGE_KEY, buildStandaloneGameHtml };

const browserService = new BrowserStorageService();
const tauriService = new TauriStorageService();

/**
 * Локальное хранилище: Tauri Desktop либо IndexedDB при браузерном предпросмотре.
 * в зависимости от окружения запуска или переданного режима.
 * @param {'auto' | 'browser' | 'tauri'} mode
 */
export function getStorageService(mode = 'auto') {
  if (mode === 'tauri') return isTauri() ? tauriService : browserService;
  if (mode === 'browser') return browserService;

  if (isTauri()) {
    return tauriService;
  }
  return browserService;
}

export const storageService = getStorageService('auto');
export default storageService;
