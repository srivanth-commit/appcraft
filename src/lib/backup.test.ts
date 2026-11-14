import { describe, it, expect, vi } from 'vitest';
import { serializeBackup, parseBackup, importBackup } from './backup';
import type { Task } from '../db/types';

const task: Task = { id: 't1', title: 'A', created_at: 1, updated_at: 1, completed: false, focus_count: 0 };

describe('backup', () => {
  it('serializes a full backup payload', () => {
    const json = serializeBackup({ tasks: [task], sessions: [], streaks: [], badges: [], profile: [] });
    const parsed = JSON.parse(json);
    expect(parsed.app).toBe('zentimer');
    expect(parsed.version).toBe(1);
    expect(parsed.data.tasks).toEqual([task]);
  });

  it('round-trips through parseBackup', () => {
    const payload = parseBackup(serializeBackup({ tasks: [], sessions: [], streaks: [], badges: [], profile: [] }));
    expect(payload.app).toBe('zentimer');
    expect(payload.version).toBe(1);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseBackup('not json')).toThrow();
  });

  it('rejects backups from other apps', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'other', version: 1, data: { tasks: [], sessions: [], streaks: [], badges: [], profile: [] } }))).toThrow();
  });

  it('rejects backups missing data sections', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'zentimer', version: 1, data: { tasks: [] } }))).toThrow();
  });

  it('does not touch existing data when the JSON is malformed', async () => {
    const restore = vi.fn(async () => undefined);
    await expect(importBackup('{ definitely not json', restore)).rejects.toThrow();
    expect(restore).not.toHaveBeenCalled();
  });

  it('rejects payloads missing profile before restoring anything', async () => {
    const restore = vi.fn(async () => undefined);
    const payload = { app: 'zentimer', version: 1, data: { tasks: [], sessions: [] } };
    await expect(importBackup(JSON.stringify(payload), restore)).rejects.toThrow();
    expect(restore).not.toHaveBeenCalled();
  });

  it('restores every section from a valid backup', async () => {
    const restore = vi.fn(async () => undefined);
    const data = {
      tasks: [task],
      sessions: [],
      streaks: [],
      badges: [],
      profile: [{ id: 'local' as const, name: 'Maya', created_at: 1, updated_at: 2 }],
    };
    const payload = await importBackup(serializeBackup(data), restore);
    expect(restore).toHaveBeenCalledTimes(1);
    expect(restore).toHaveBeenCalledWith(data);
    expect(payload.version).toBe(1);
    expect(payload.data.profile[0].name).toBe('Maya');
  });
});
