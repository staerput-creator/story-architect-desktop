import type { StoryProject, ProjectMetadata } from './types';

export type StorageType = 'local' | 'host' | 'gdrive' | 's3' | 'webdav';
export interface SaveResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
  storageType?: StorageType;
  sizeBytes?: number;
  revision?: number;
}
export interface IStorageAdapter {
  saveProject(project: StoryProject): Promise<SaveResult>;
  loadProject(id?: string): Promise<StoryProject | null>;
  listProjects(): Promise<ProjectMetadata[]>;
  exportJson(project: StoryProject): Promise<void>;
  exportStandaloneHtml(project: StoryProject): Promise<void>;
}