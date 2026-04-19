export interface PruningTaskDefinition {
  name: string;
  type: 'once' | 'recurring';
  months: number[]; // 0-11 (Jan-Dec)
}

export interface Plant {
  id: string;
  name: string;
  location: string;
  pruningMonths: number[]; // 0-11 (Jan-Dec) - Keep for backward compatibility
  pruningTasks?: PruningTaskDefinition[]; // New grouped tasks
  imageUrl?: string;
  careInstructions?: string; // Markdown
}

export interface Task {
  id: string;
  plantId: string;
  month: number; // 0-11
  year: number;
  completed: boolean;
  taskName?: string; // Links to PruningTaskDefinition.name
}

export interface AppSettings {
  geminiApiKey?: string;
  hasSeenWelcome?: boolean;
}

export interface AppState {
  plants: Plant[];
  tasks: Task[];
  settings: AppSettings;
}

