import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, getDB } from './index';

beforeEach(async () => {
  const dbh = await getDB();
  await Promise.all((['tasks', 'sessions', 'streaks', 'badges', 'profile'] as const).map((s) => dbh.clear(s)));
});

describe('db facade', () => {
  it('persists and reads tasks with indexes', async () => {
    const id = await db.putTask({
      id: crypto.randomUUID(),
      title: 'Write docs',
      created_at: 1,
      updated_at: 2,
      completed: false,
      focus_count: 0,
    });
    const tasks = await db.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(id);
    expect(tasks[0].title).toBe('Write docs');
  });

  it('deletes tasks', async () => {
    const id = crypto.randomUUID();
    await db.putTask({ id, title: 'x', created_at: 1, updated_at: 1, completed: false, focus_count: 0 });
    await db.deleteTask(id);
    expect(await db.getTasks()).toHaveLength(0);
  });

  it('persists sessions with nullable task_id', async () => {
    await db.putSession({ id: 's1', task_id: null, started_at: 1, completed_at: 2, duration_minutes: 25 });
    const sessions = await db.getSessions();
    expect(sessions[0].task_id).toBeNull();
  });

  it('round-trips streak and badge records', async () => {
    await db.putStreak({ key: 'current', days: 3, updated_at: 1 });
    await db.putBadge({ id: 'b1', name: 'First Spark', description: 'x', unlocked: true, unlocked_at: 1 });
    expect((await db.getStreaks())[0].days).toBe(3);
    expect((await db.getBadges())[0].name).toBe('First Spark');
  });

  it('round-trips the local profile', async () => {
    await db.putProfile({ id: 'local', name: 'Maya', color: '#4338ca', created_at: 1, updated_at: 2 });
    expect((await db.getProfile())?.name).toBe('Maya');
    expect((await db.getProfile())?.color).toBe('#4338ca');
  });

  it('exports all stores and restores over the top', async () => {
    await db.putTask({ id: 't1', title: 'A', created_at: 1, updated_at: 1, completed: false, focus_count: 0 });
    await db.putSession({ id: 's1', task_id: null, started_at: 1, completed_at: 2, duration_minutes: 25 });
    await db.putProfile({ id: 'local', name: 'Maya', color: '#0f766e', created_at: 1, updated_at: 2 });

    const backup = await db.exportAll();
    expect(backup.tasks).toHaveLength(1);
    expect(backup.sessions).toHaveLength(1);
    expect(backup.profile[0].name).toBe('Maya');

    await db.putTask({ id: 't2', title: 'Should vanish', created_at: 1, updated_at: 1, completed: false, focus_count: 0 });

    await db.restoreAll({ tasks: backup.tasks, sessions: backup.sessions, streaks: backup.streaks, badges: backup.badges, profile: backup.profile });

    const tasks = await db.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('t1');
  });
});