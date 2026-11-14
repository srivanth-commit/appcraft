import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Task, FocusSession, StreakState, Badge, LocalProfile } from './types';

export const DB_VERSION = 2;

export interface ZenTimeDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-created': number; 'by-updated': number };
  };
  sessions: {
    key: string;
    value: FocusSession;
    indexes: { 'by-started': number; 'by-task': string };
  };
  streaks: {
    key: string;
    value: StreakState;
  };
  badges: {
    key: string;
    value: Badge;
  };
  profile: {
    key: string;
    value: LocalProfile;
  };
}

let dbPromise: Promise<IDBPDatabase<ZenTimeDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ZenTimeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ZenTimeDB>('zentimer', DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
          tasks.createIndex('by-created', 'created_at');
          tasks.createIndex('by-updated', 'updated_at');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('by-started', 'started_at');
          sessions.createIndex('by-task', 'task_id');
        }
        if (!db.objectStoreNames.contains('streaks')) {
          db.createObjectStore('streaks', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('badges')) {
          db.createObjectStore('badges', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const db = {
  async putTask(task: Task): Promise<string> {
    const id = task.id || crypto.randomUUID();
    const record = { ...task, id };
    const dbh = await getDB();
    await dbh.put('tasks', record);
    return id;
  },

  async deleteTask(id: string): Promise<void> {
    const dbh = await getDB();
    await dbh.delete('tasks', id);
  },

  async getTasks(): Promise<Task[]> {
    const dbh = await getDB();
    return dbh.getAll('tasks');
  },

  async putSession(session: FocusSession): Promise<void> {
    const dbh = await getDB();
    await dbh.put('sessions', session);
  },

  async getSessions(): Promise<FocusSession[]> {
    const dbh = await getDB();
    return dbh.getAll('sessions');
  },

  async putStreak(state: StreakState): Promise<void> {
    const dbh = await getDB();
    await dbh.put('streaks', state);
  },

  async getStreaks(): Promise<StreakState[]> {
    const dbh = await getDB();
    return dbh.getAll('streaks');
  },

  async putBadge(badge: Badge): Promise<void> {
    const dbh = await getDB();
    await dbh.put('badges', badge);
  },

  async getBadges(): Promise<Badge[]> {
    const dbh = await getDB();
    return dbh.getAll('badges');
  },

  async getProfile(): Promise<LocalProfile | undefined> {
    const dbh = await getDB();
    return dbh.get('profile', 'local');
  },

  async putProfile(profile: LocalProfile): Promise<void> {
    const dbh = await getDB();
    await dbh.put('profile', profile);
  },

  async exportAll(): Promise<{ tasks: Task[]; sessions: FocusSession[]; streaks: StreakState[]; badges: Badge[]; profile: LocalProfile[] }> {
    const dbh = await getDB();
    const [tasks, sessions, streaks, badges, profile] = await Promise.all([
      dbh.getAll('tasks'),
      dbh.getAll('sessions'),
      dbh.getAll('streaks'),
      dbh.getAll('badges'),
      dbh.getAll('profile'),
    ]);
    return { tasks, sessions, streaks, badges, profile };
  },

  async restoreAll(
    data: { tasks: Task[]; sessions: FocusSession[]; streaks: StreakState[]; badges: Badge[]; profile: LocalProfile[] },
  ): Promise<void> {
    const dbh = await getDB();
    const stores = ['tasks', 'sessions', 'streaks', 'badges', 'profile'] as const;
    const tx = dbh.transaction([...stores], 'readwrite');
    await Promise.all(stores.map((store) => tx.objectStore(store).clear()));
    await Promise.all([
      ...data.tasks.map((t) => tx.objectStore('tasks').put(t)),
      ...data.sessions.map((s) => tx.objectStore('sessions').put(s)),
      ...data.streaks.map((s) => tx.objectStore('streaks').put(s)),
      ...data.badges.map((b) => tx.objectStore('badges').put(b)),
      ...data.profile.map((p) => tx.objectStore('profile').put(p)),
    ]);
    await tx.done;
  },
};