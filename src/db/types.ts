export interface Task {
  id: string;
  title: string;
  created_at: number;
  updated_at: number;
  completed: boolean;
  completed_at?: number;
  focus_count: number;
}

export interface FocusSession {
  id: string;
  task_id: string | null;
  started_at: number;
  completed_at: number;
  duration_minutes: number;
  source?: 'timer' | 'manual';
  note?: string;
}

export interface LocalProfile {
  id: 'local';
  name: string;
  created_at: number;
  updated_at: number;
  color?: string;
}

export interface StreakState {
  key: 'current' | 'longest';
  days: number;
  updated_at: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlocked_at: number | null;
}

export type TaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'focus_count' | 'completed'>;