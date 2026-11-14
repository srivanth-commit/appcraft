import { Download, Pencil, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { LifetimeStats } from '../../lib/analytics';

interface ProfileMenuProps {
  name: string;
  color: string;
  avatarColors: string[];
  joinedAt: number;
  lifetime: LifetimeStats;
  onSaveName: (name: string) => Promise<void>;
  onSaveColor: (color: string) => Promise<void>;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

export function ProfileMenu({ name, color, avatarColors, joinedAt, lifetime, onSaveName, onSaveColor, onExport, onImport }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(name);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save() {
    await onSaveName(draft);
    setOpen(false);
  }

  async function handleImport(file: File) {
    setImporting(true);
    try {
      await onImport(file);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="relative">
      <button type="button" className="profile-chip" onClick={() => { setDraft(name); setOpen((v) => !v); }} aria-expanded={open} aria-label="Open account">
        <span className="profile-avatar" style={{ backgroundColor: color }}>{name.charAt(0).toUpperCase()}</span>
        <span className="hidden max-w-32 truncate sm:inline">{name}</span>
      </button>
      {open && (
        <div className="profile-popover">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="eyebrow">Local account</p>
              <p className="text-sm text-muted">Your data stays on this device.</p>
            </div>
            <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close account"><X size={16} /></button>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-elevate/50 p-3">
            <span className="profile-avatar" style={{ backgroundColor: color }}>{name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted">
                {joinedAt ? `Member since ${new Date(joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}` : '—'}
              </p>
            </div>
          </div>

          <label className="field-label">Display name<input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus /></label>

          <div className="mt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Avatar color</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {avatarColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Avatar color ${c}`}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-text ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => void onSaveColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="my-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <MiniStat label="Total focus" value={formatHours(lifetime.totalMinutes)} />
            <MiniStat label="Active days" value={String(lifetime.activeDays)} />
            <MiniStat label="Best day" value={lifetime.bestDay ? formatMinutes(lifetime.bestDay.minutes) : '—'} />
            <MiniStat label="Sessions" value={String(lifetime.totalSessions)} />
          </div>

          <div className="mb-3 border-t border-border pt-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">Data</span>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-ghost flex-1" onClick={onExport}><Download size={15} />Export</button>
              <button type="button" className="btn-ghost flex-1" onClick={() => fileRef.current?.click()} disabled={importing}>
                <Upload size={15} />{importing ? 'Importing…' : 'Import'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-2">Export a backup before wiping this browser.</p>
          </div>

          <button type="button" className="btn-primary w-full" onClick={() => void save()}><Pencil size={15} />Save name</button>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-elevate/50 px-2.5 py-2">
      <p className="text-xs font-semibold text-text">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min > 0 ? `${h}h ${min}m` : `${h}h`;
}

function formatHours(minutes: number): string {
  if (minutes === 0) return '0h';
  const h = (minutes / 60).toFixed(1);
  return `${h.replace(/\.0$/, '')}h`;
}