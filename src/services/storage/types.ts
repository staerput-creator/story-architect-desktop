export interface DialogueLine {
  charId: string;
  text: string;
}

export interface NodeEffect {
  id: string;
  varId: string;
  action: 'set' | 'add' | 'sub' | 'toggle';
  value: boolean | number;
  logicalOp?: 'AND' | 'OR';
}

export interface EdgeCondition {
  varId: string;
  operator: '==' | '!=' | '>=' | '>' | '<=' | '<';
  value: boolean | number;
}

export interface StoryNodeData {
  label: string;
  type: 'start' | 'scene' | 'decision' | 'ending';
  notes: string;
  imageId?: string | null;
  image?: string | null;
  dialogue: DialogueLine[];
  effects: NodeEffect[];
}

export interface StoryNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: StoryNodeData;
  className?: string;
}

export interface StoryEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  data?: {
    conditions: EdgeCondition[];
    effects: NodeEffect[];
  };
}

export interface CharacterGroup {
  id: string;
  name: string;
}

export interface StoryCharacter {
  id: string;
  name: string;
  color: string;
  groupId: string;
}

export interface StoryVariable {
  id: string;
  name: string;
  type: 'boolean' | 'number';
  initialValue: boolean | number;
}

export interface ProjectMetadata {
  id: string;
  title: string;
  description?: string;
  driveFileId?: string | null;
  lastSyncedAt?: string | null;
  updatedAt: string;
  ownerEmail?: string;
  nodesCount?: number;
  charactersCount?: number;
  sizeBytes?: number;
}

export interface StoryProject {
  version: string;
  appName: string;
  updatedAt: string;
  projectMeta: ProjectMetadata;
  nodes: StoryNode[];
  edges: StoryEdge[];
  groups: CharacterGroup[];
  characters: StoryCharacter[];
  variables: StoryVariable[];
  assetsMap?: Record<string, string>;
  assets?: Record<string, string>;
  currentTheme?: 'dark' | 'light' | 'soft';
}

export interface IStorageService {
  saveProject(project: StoryProject): Promise<{ success: boolean; error?: string }>;
  loadProject(id?: string): Promise<StoryProject>;
  listProjects(): Promise<ProjectMetadata[]>;
  exportJson(project: StoryProject): Promise<void>;
  exportStandaloneHtml(project: StoryProject): Promise<void>;
}
