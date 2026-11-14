import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import type { Task } from '../../db/types';

interface TaskItemProps {
  task: Task;
  active: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, active, onSelect, onToggle, onDelete }: TaskItemProps) {
  return (
    <li
      className={`group flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        active ? 'border-primary/60 bg-primary/10' : 'border-border bg-elevate/40'
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className="shrink-0 text-muted hover:text-emerald-500"
      >
        {task.completed ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 text-left"
        onClick={() => onSelect(task.id)}
        aria-label={`Focus on ${task.title}`}
      >
        <span className={`block truncate text-sm ${task.completed ? 'text-muted line-through' : 'text-text'}`}>
          {task.title}
        </span>
        <span className="text-xs text-muted">{task.focus_count} focus sessions</span>
      </button>
      {active && (
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">focus</span>
      )}
      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete ${task.title}`}
        className="shrink-0 text-muted opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}