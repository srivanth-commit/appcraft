import { BarChart3, Timer } from 'lucide-react';

export type Tab = 'timer' | 'analytics';

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav className="tab-bar" aria-label="Main navigation">
      <button
        type="button"
        className={`tab-item ${active === 'timer' ? 'tab-item-active' : 'tab-item-inactive'}`}
        onClick={() => onChange('timer')}
        aria-label="Timer"
      >
        <Timer size={22} strokeWidth={active === 'timer' ? 2.2 : 1.8} />
        <span>Timer</span>
      </button>
      <button
        type="button"
        className={`tab-item ${active === 'analytics' ? 'tab-item-active' : 'tab-item-inactive'}`}
        onClick={() => onChange('analytics')}
        aria-label="Analytics"
      >
        <BarChart3 size={22} strokeWidth={active === 'analytics' ? 2.2 : 1.8} />
        <span>Insights</span>
      </button>
    </nav>
  );
}
