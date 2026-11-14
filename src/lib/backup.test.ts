import { describe, it, expect } from 'vitest';
import { serializeBackup, parseBackup } from './backup';
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
});
