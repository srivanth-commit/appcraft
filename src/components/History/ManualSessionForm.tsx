import { CalendarClock, Check, X } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '../../db/types';

interface ManualSessionFormProps {
  tasks: Task[];
  onSave: (input: { taskId: string | null; startedAt: number; durationMinutes: number; note: string }) => Promise<void>;
  onClose: () => void;
}

export function ManualSessionForm({ tasks, onSave, onClose }: ManualSessionFormProps) {
  const [date, setDate] = useState(() => {
    const current = new Date();
    current.setMinutes(current.getMinutes() - current.getTimezoneOffset());
    return current.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState('25');
  const [taskId, setTaskId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const startedAt = new Date(date).getTime();
    const durationMinutes = Number(duration);
    if (!Number.isFinite(startedAt) || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return;
    setSaving(true);
    await onSave({ taskId: taskId || null, startedAt, durationMinutes, note });
    setSaving(false);
    onClose();
  }

  return (
    <form onSubmit={submit} className="px-5 py-5" aria-label="Log a past focus session">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={17} className="text-primary" />
          <div>
            <h3 className="font-semibold leading-tight">Log a past session</h3>
            <p className="text-xs text-muted-2">Missed the timer? Register it now with its date.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="icon-button" aria-label="Close log form"><X size={17} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field-label">When did you study?<input className="input" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="field-label">Minutes<input className="input" type="number" min="1" max="1440" value={duration} onChange={(event) => setDuration(event.target.value)} /></label>
      </div>
      <label className="field-label mt-3">Task
        <select className="input" value={taskId} onChange={(event) => setTaskId(event.target.value)}>
          <option value="">Unassigned</option>
          {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
        </select>
      </label>
      <label className="field-label mt-3">Note <span className="font-normal text-muted">(optional)</span><input className="input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you work on?" /></label>
      <button type="submit" className="btn-primary mt-4 w-full" disabled={saving}><Check size={16} />{saving ? 'Saving...' : 'Register session'}</button>
    </form>
  );
}
