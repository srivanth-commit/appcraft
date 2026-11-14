import { Moon, Sun, Timer as TimerIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AnalyticsView } from '../Analytics/AnalyticsView';
import { TimerView } from '../Timer/TimerView';
import { TaskPanel } from '../Tasks/TaskPanel';
import { TaskDrawer } from '../Tasks/TaskDrawer';
import { OfflineBanner } from './OfflineBanner';
import { TabBar, type Tab } from './TabBar';
import { useTasks } from '../../hooks/useTasks';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useStreak } from '../../hooks/useStreak';
import { useOffline } from '../../hooks/useOffline';
import { ManualSessionForm } from '../History/ManualSessionForm';
import { ProfileMenu } from './ProfileMenu';
import { useProfile } from '../../hooks/useProfile';
import { db } from '../../db';
import { importBackup, serializeBackup } from '../../lib/backup';

export function AppShell() {
  const offline = useOffline();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [loggingPast, setLoggingPast] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('timer');
  const [toast, setToast] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  );

  const tasks = useTasks();
  const analytics = useAnalytics();
  const streak = useStreak();
  const profile = useProfile();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (tab === 'analytics') void analytics.reload();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const storage = navigator.storage;
    if (storage && typeof storage.persist === 'function') {
      storage.persist().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function handleExport() {
    void (async () => {
      const backup = await db.exportAll();
      const json = serializeBackup(backup);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zentimer-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    })();
  }

  async function handleImport(file: File) {
    const confirmed = window.confirm('This will overwrite all current data. Continue?');
    if (!confirmed) return;
    try {
      const text = await file.text();
      await importBackup(text, db.restoreAll);
      await Promise.all([tasks.reload(), analytics.reload(), streak.refresh(), profile.reload()]);
      setToast('Backup imported successfully.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Import failed — invalid backup file.');
    }
  }

  async function handleManualSave(input: { taskId: string | null; startedAt: number; durationMinutes: number; note: string }) {
    await tasks.recordManualSession(input);
    void analytics.reload();
    void streak.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {offline && <OfflineBanner />}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border px-4 py-3 backdrop-blur-xl bg-bg/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <TimerIcon size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">ZenTime</span>
          <nav className="ml-4 hidden gap-1 rounded-xl bg-elevate/50 p-1 lg:flex" aria-label="Primary navigation">
            <button
              type="button"
              className={`segment text-xs ${tab === 'timer' ? 'segment-active' : 'segment-inactive'}`}
              onClick={() => setTab('timer')}
            >
              Focus
            </button>
            <button
              type="button"
              className={`segment text-xs ${tab === 'analytics' ? 'segment-active' : 'segment-inactive'}`}
              onClick={() => setTab('analytics')}
            >
              Insights
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {profile.profile && (
            <ProfileMenu
              name={profile.profile.name}
              color={profile.profile.color ?? '#0f766e'}
              avatarColors={profile.avatarColors}
              joinedAt={profile.profile.created_at}
              lifetime={analytics.lifetime}
              onSaveName={profile.updateName}
              onSaveColor={profile.updateColor}
              onExport={handleExport}
              onImport={handleImport}
            />
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 gap-6 p-4 sm:p-6 lg:grid lg:grid-cols-[300px_1fr]">
        <div className={tab === 'timer' ? 'contents' : 'hidden'}>
            <aside className="hidden lg:block">
              <TaskPanel
                tasks={tasks.tasks}
                activeTaskId={activeTaskId}
                onAdd={(title) => void tasks.addTask(title)}
                onSelect={(id) => setActiveTaskId(id)}
                onLogPast={() => setLoggingPast(true)}
                onToggle={(id) => void tasks.toggleTask(id)}
                onDelete={(id) => {
                  if (activeTaskId === id) setActiveTaskId(null);
                  void tasks.deleteTask(id);
                }}
              />
            </aside>

            <div className="flex flex-col items-center gap-6">
              <button
                type="button"
                className="btn-ghost lg:hidden w-full"
                onClick={() => setDrawerOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <line x1="2" y1="12" x2="14" y2="12" />
                </svg>
                Tasks
              </button>

              <TimerView
                tasks={tasks.tasks}
                activeTaskId={activeTaskId}
                onSelectTask={(id) => setActiveTaskId(id)}
                onRecordSession={tasks.recordSession}
                onRecordManualSession={handleManualSave}
                onReload={() => {
                  void tasks.reload();
                  void analytics.reload();
                  void streak.refresh();
                }}
                currentStreak={streak.current}
              />

              {loggingPast && (
                <section className="card w-full max-w-lg animate-in overflow-hidden" aria-label="Log past focus session">
                  <ManualSessionForm
                    tasks={tasks.tasks}
                    onSave={handleManualSave}
                    onClose={() => setLoggingPast(false)}
                  />
                </section>
              )}
            </div>
        </div>

        {tab === 'analytics' && (
          <div className="col-span-full">
            <AnalyticsView
              data={analytics}
              badges={streak.badges}
              currentStreak={streak.current}
              longestStreak={streak.longest}
              tasks={tasks.tasks}
              onRecordManualSession={handleManualSave}
            />
          </div>
        )}
      </main>

      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tasks={tasks.tasks}
        activeTaskId={activeTaskId}
        onAdd={(title) => void tasks.addTask(title)}
        onSelect={(id) => {
          setActiveTaskId(id);
          setDrawerOpen(false);
        }}
        onToggle={(id) => void tasks.toggleTask(id)}
        onDelete={(id) => {
          if (activeTaskId === id) setActiveTaskId(null);
          void tasks.deleteTask(id);
        }}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-in rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium shadow-lg"
        >
          {toast}
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}