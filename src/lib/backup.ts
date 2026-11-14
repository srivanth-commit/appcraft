import type { Badge, FocusSession, LocalProfile, StreakState, Task } from '../db/types';

export interface BackupData {
  tasks: Task[];
  sessions: FocusSession[];
  streaks: StreakState[];
  badges: Badge[];
  profile: LocalProfile[];
}

export interface BackupPayload {
  version: 1;
  exported_at: string;
  app: 'zentimer';
  data: BackupData;
}

export function serializeBackup(data: BackupData): string {
  const payload: BackupPayload = {
    version: 1,
    exported_at: new Date().toISOString(),
    app: 'zentimer',
    data,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackup(raw: string): BackupPayload {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) throw new Error('Backup is not valid JSON.');
  if (parsed.app !== 'zentimer' || parsed.version !== 1) {
    throw new Error('This is not a ZenTime backup file.');
  }
  const data = parsed.data;
  if (!isRecord(data)) throw new Error('Backup is missing required data sections.');
  for (const key of ['tasks', 'sessions', 'streaks', 'badges', 'profile'] as const) {
    if (!Array.isArray(data[key])) {
      throw new Error('Backup is missing required data sections.');
    }
  }
  return parsed as unknown as BackupPayload;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}