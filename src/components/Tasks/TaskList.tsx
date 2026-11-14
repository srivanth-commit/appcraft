import { History, ListChecks } from 'lucide-react';
import type { Task } from '../../db/types';
import { TaskForm } from './TaskForm';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onAdd: (title: string) => void;
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onLogPast: () => void;
}

export function TaskList({ tasks, activeTaskId, onAdd, onSelect, onToggle, onDelete, onLogPast }: TaskListProps) {
  return (
    <section className="card flex flex-col p-4" aria-label="Tasks">
      <div className="mb-4 flex items-center gap-2">
        <ListChecks size={18} className="text-primary" />
        <h2 className="text-lg font-semibold">Tasks</h2>
      </div>
      <TaskForm onAdd={onAdd} />
      <button type="button" className="btn-ghost mt-3 w-full" onClick={onLogPast}><History size={16} />Log past focus</button>
      <ul className="mt-4 flex flex-col gap-2 overflow-y-auto">
        {tasks.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted">No tasks yet — add one to track focus time.</li>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              active={task.id === activeTaskId}
              onSelect={() => onSelect(activeTaskId === task.id ? null : task.id)}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))
        )}
      </ul>
    </section>
  );
}