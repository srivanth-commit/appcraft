import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Task } from '../../db/types';
import { TaskForm } from './TaskForm';
import { TaskItem } from './TaskItem';

interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  activeTaskId: string | null;
  onAdd: (title: string) => void;
  onSelect: (id: string | null) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskDrawer({ open, onClose, tasks, activeTaskId, onAdd, onSelect, onToggle, onDelete }: TaskDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panelRef}
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] animate-in rounded-t-3xl bg-surface border border-border overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/90 backdrop-blur-xl px-5 py-4">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close tasks">
            <X size={20} />
          </button>
        </div>
        <div className="p-5">
          <TaskForm onAdd={onAdd} />
          <ul className="mt-4 flex flex-col gap-2">
            {tasks.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted">No tasks yet</li>
            ) : (
              tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  active={task.id === activeTaskId}
                  onSelect={() => {
                    onSelect(activeTaskId === task.id ? null : task.id);
                    onClose();
                  }}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
