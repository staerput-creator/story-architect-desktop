import { BrowserStorageService } from './BrowserStorageService';
import { assetStorage } from '../assetStorage';

const DEFAULT_API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  'http://127.0.0.1:8080/api';

const TOKEN_KEY = 'story-architect-jwt-v4';

/**
 * Реализация IStorageService для синхронизации с Web Backend (Rust + Axum REST API)
 * с локальным кешированием в IndexedDB для офлайн-отказоустойчивости.
 */
export class ApiStorageService {
  constructor(baseUrl = DEFAULT_API_BASE) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.localMirror = new BrowserStorageService();
  }

  getAuthHeaders() {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  setAuthToken(token) {
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
  }

  async saveProject(project) {
    await this.localMirror.saveProject(project);
    try {
      const res = await fetch(`${this.baseUrl}/projects`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(project)
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errBody.error || `Ошибка сервера (${res.status}), сохранено локально`
        };
      }
      return { success: true };
    } catch (err) {
      return {
        success: true,
        error: `Сервер недоступен (${err?.message || 'offline'}), сохранено в локальный кеш`
      };
    }
  }

  async loadProject(id) {
    await assetStorage.initFromStorage();
    if (id) {
      try {
        const res = await fetch(`${this.baseUrl}/projects/${encodeURIComponent(id)}`, {
          headers: this.getAuthHeaders()
        });
        if (res.ok) {
          const remoteProject = await res.json();
          assetStorage.hydrateFromProject(remoteProject);
          await this.localMirror.saveProject(remoteProject);
          return remoteProject;
        }
      } catch {
        // Fallback to local mirror when offline
      }
    }
    return this.localMirror.loadProject(id);
  }

  async listProjects() {
    try {
      const res = await fetch(`${this.baseUrl}/projects`, {
        headers: this.getAuthHeaders()
      });
      if (res.ok) {
        const list = await res.json();
        if (Array.isArray(list)) return list;
      }
    } catch {
      // Fallback to local mirror
    }
    return this.localMirror.listProjects();
  }

  async exportJson(project) {
    return this.localMirror.exportJson(project);
  }

  async exportStandaloneHtml(project) {
    return this.localMirror.exportStandaloneHtml(project);
  }
}
