import { useState } from 'react';
import { Plus } from 'lucide-react';

interface TaskFormProps {
  onAdd: (title: string) => void;
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [title, setTitle] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title);
    setTitle('');
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        aria-label="New task title"
      />
      <button type="submit" className="btn-primary shrink-0" aria-label="Add task">
        <Plus size={18} />
      </button>
    </form>
  );
}