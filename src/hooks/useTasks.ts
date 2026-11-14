import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import type { FocusSession, Task } from '../db/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [allTasks, allSessions] = await Promise.all([db.getTasks(), db.getSessions()]);
    setTasks(allTasks.sort((a, b) => b.created_at - a.created_at));
    setSessionCount(allSessions.length);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addTask = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return null;
      const now = Date.now();
      const id = await db.putTask({
        id: crypto.randomUUID(),
        title: trimmed,
        created_at: now,
        updated_at: now,
        completed: false,
        focus_count: 0,
      });
      await reload();
      return id;
    },
    [reload],
  );

  const toggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      await db.putTask({
        ...task,
        completed: !task.completed,
        completed_at: task.completed ? undefined : Date.now(),
        updated_at: Date.now(),
      });
      await reload();
    },
    [tasks, reload],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      await db.deleteTask(id);
      await reload();
    },
    [reload],
  );

  const recordSession = useCallback(
    async (taskId: string | null, durationMinutes: number): Promise<void> => {
      const now = Date.now();
      const session: FocusSession = {
        id: crypto.randomUUID(),
        task_id: taskId,
        started_at: now - durationMinutes * 60_000,
        completed_at: now,
        duration_minutes: durationMinutes,
        source: 'timer',
      };
      await db.putSession(session);
      if (taskId) {
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          await db.putTask({ ...task, focus_count: task.focus_count + 1, updated_at: now });
        }
      }
      await reload();
    },
    [tasks, reload],
  );

  const recordManualSession = useCallback(
    async (input: { taskId: string | null; startedAt: number; durationMinutes: number; note: string }) => {
      const durationMinutes = Math.max(1, Math.round(input.durationMinutes));
      await db.putSession({
        id: crypto.randomUUID(),
        task_id: input.taskId,
        started_at: input.startedAt,
        completed_at: input.startedAt + durationMinutes * 60_000,
        duration_minutes: durationMinutes,
        source: 'manual',
        note: input.note.trim() || undefined,
      });
      if (input.taskId) {
        const task = tasks.find((item) => item.id === input.taskId);
        if (task) await db.putTask({ ...task, focus_count: task.focus_count + 1, updated_at: Date.now() });
      }
      await reload();
    },
    [tasks, reload],
  );

  return { tasks, sessionCount, loading, reload, addTask, toggleTask, deleteTask, recordSession, recordManualSession };
}