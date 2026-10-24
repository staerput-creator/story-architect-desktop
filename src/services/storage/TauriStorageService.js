import { invoke } from '@tauri-apps/api/core';
import { BrowserStorageService, buildStandaloneGameHtml } from './BrowserStorageService';
import { assetStorage } from '../assetStorage';
import { isTauri } from '../runtime';
export class TauriStorageService {
  constructor() { this.local = new BrowserStorageService(); this.filePath = null; this.projectId = null; }
  async saveProject(project) {
    if (!isTauri()) return this.local.saveProject(project);
    if (this.projectId !== project.projectMeta.id) this.filePath = null;
    this.projectId = project.projectMeta.id;
    try {
      const jsonContent = JSON.stringify(project, null, 2);
      if (this.filePath) await invoke('save_story_file', { filePath: this.filePath, jsonContent });
      else {
        this.filePath = await invoke('save_story_file_as', { defaultName: `${project.projectMeta.title}.story.json`, jsonContent });
        if (!this.filePath) return { success: false, cancelled: true, error: 'Сохранение отменено' };
      }
      await this.local.saveProject(project);
      return { success: true, storageType: 'local', sizeBytes: new Blob([jsonContent]).size };
    } catch (error) { return { success: false, error: String(error) }; }
  }
  startNewProject() { this.filePath = null; this.projectId = null; }
  async saveAs(project) {
    const previousFilePath = this.filePath;
    const previousProjectId = this.projectId;
    this.filePath = null;
    const result = await this.saveProject(project);
    if (!result.success) {
      this.filePath = previousFilePath;
      this.projectId = previousProjectId;
    }
    return result;
  }
  async open() {
    if (!isTauri()) return this.local.open();
    const result = await invoke('open_story_file');
    if (!result) return null;
    this.filePath = result.filePath;
    this.projectId = result.project.projectMeta?.id;
    assetStorage.hydrateFromProject(result.project);
    return result.project;
  }
  async loadProject(id) { return this.local.loadProject(id); }
  async listProjects() { return isTauri() ? invoke('get_recent_projects') : this.local.listProjects(); }
  async exportJson(project) { return isTauri() ? this.saveAs(project) : this.local.exportJson(project); }
  async exportStandaloneHtml(project) {
    if (!isTauri()) return this.local.exportStandaloneHtml(project);
    const path = await invoke('export_html_game', { filePath: `${project.projectMeta.title}.html`, htmlContent: buildStandaloneGameHtml(project) });
    return { success: Boolean(path), cancelled: !path };
  }
}
export { TauriStorageService as TauriStorageAdapter };