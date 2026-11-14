import { useEffect, useRef, useState } from 'react';
import type { Phase } from '../lib/pomodoro';
import { CONFIG, durationFor, isWork, nextPhase } from '../lib/pomodoro';

const STORAGE_KEY = 'zentimer-timer-state';
const STALE_GRACE_MS = 2 * 60 * 60 * 1000;

interface TimerOptions {
  activeTaskId: string | null;
  onWorkComplete: (taskId: string | null, durationMinutes: number) => Promise<void> | void;
  onPhaseChange?: (phase: Phase) => void;
}

interface TimerSnapshot {
  phase: Phase;
  running: boolean;
  endsAt: number | null;
  secondsLeft: number;
  startedAt: number | null;
  workCount: number;
}

const PHASES: Phase[] = ['work', 'short_break', 'long_break'];

function isFiniteInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value);
}

function loadPersistedState(): TimerSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const p = parsed as Partial<TimerSnapshot>;
    if (typeof p.phase !== 'string' || !PHASES.includes(p.phase as Phase)) return null;
    const phase = p.phase;
    const workCount = isFiniteInt(p.workCount) && p.workCount >= 0 ? p.workCount : 0;
    const maxSeconds = durationFor(phase);
    const secondsLeft = isFiniteInt(p.secondsLeft)
      ? Math.min(Math.max(0, p.secondsLeft), maxSeconds)
      : maxSeconds;
    const startedAt = isFiniteInt(p.startedAt) && p.startedAt > 0 ? p.startedAt : null;
    const endsAt = isFiniteInt(p.endsAt) && p.endsAt > 0 ? p.endsAt : null;
    const running = p.running === true && endsAt !== null;
    return { phase, running, endsAt: running ? endsAt : null, secondsLeft, startedAt, workCount };
  } catch {
    return null;
  }
}

function initialTimerState(): TimerSnapshot {
  const persisted = loadPersistedState();
  if (!persisted) {
    return { phase: 'work', running: false, endsAt: null, secondsLeft: durationFor('work'), startedAt: null, workCount: 0 };
  }
  if (persisted.running && persisted.endsAt !== null) {
    const now = Date.now();
    if (persisted.endsAt > now) {
      return { ...persisted, secondsLeft: Math.max(0, Math.ceil((persisted.endsAt - now) / 1000)) };
    }
    if (now - persisted.endsAt <= STALE_GRACE_MS) {
      return { ...persisted, running: true, secondsLeft: 0 };
    }
    return {
      phase: persisted.phase,
      running: false,
      endsAt: null,
      secondsLeft: durationFor(persisted.phase),
      startedAt: null,
      workCount: persisted.workCount,
    };
  }
  return { ...persisted, running: false, endsAt: null };
}

export function useTimer({ activeTaskId, onWorkComplete, onPhaseChange }: TimerOptions) {
  const snapshotRef = useRef<TimerSnapshot | null>(null);
  if (snapshotRef.current === null) {
    snapshotRef.current = initialTimerState();
  }
  const snapshot = snapshotRef.current;

  const [phase, setPhase] = useState<Phase>(snapshot.phase);
  const [running, setRunning] = useState(snapshot.running);
  const [endsAt, setEndsAt] = useState<number | null>(snapshot.endsAt);
  const [secondsLeft, setSecondsLeft] = useState(snapshot.secondsLeft);
  const [startedAt, setStartedAt] = useState<number | null>(snapshot.startedAt);
  const [workCount, setWorkCount] = useState(snapshot.workCount);

  const completingRef = useRef(false);
  const stateRef = useRef({ phase, running, endsAt, secondsLeft, startedAt, workCount, activeTaskId });
  stateRef.current = { phase, running, endsAt, secondsLeft, startedAt, workCount, activeTaskId };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (stateRef.current.running) pause();
        else start();
      } else if (e.key === 'r' || e.key === 'R') {
        reset();
      } else if (e.key === 'n' || e.key === 'N') {
        skip();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running || endsAt === null) return;
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [running, endsAt]);

  useEffect(() => {
    const recompute = () => {
      const { running: r, endsAt: e } = stateRef.current;
      if (!r || e === null) return;
      setSecondsLeft(Math.max(0, Math.ceil((e - Date.now()) / 1000)));
    };
    document.addEventListener('visibilitychange', recompute);
    window.addEventListener('focus', recompute);
    return () => {
      document.removeEventListener('visibilitychange', recompute);
      window.removeEventListener('focus', recompute);
    };
  }, []);

  useEffect(() => {
    if (!running || secondsLeft > 0 || completingRef.current) return;
    completingRef.current = true;
    completePhase()
      .catch(() => undefined)
      .finally(() => {
        completingRef.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secondsLeft]);

  useEffect(() => {
    const payload: TimerSnapshot = { phase, running, endsAt, secondsLeft, startedAt, workCount };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage unavailable — timer keeps working in memory
    }
  }, [phase, running, endsAt, secondsLeft, startedAt, workCount]);

  async function completePhase() {
    const { phase: p, workCount: wc, startedAt: s, activeTaskId: t } = stateRef.current;
    setRunning(false);
    setEndsAt(null);
    if (isWork(p)) {
      const elapsedMs = s !== null ? Math.max(0, Date.now() - s) : CONFIG.WORK * 1000;
      const durationMinutes = Math.max(1, Math.round(elapsedMs / 60_000));
      setStartedAt(null);
      await onWorkComplete(t, durationMinutes);
      const next = nextPhase('work', wc + 1);
      setWorkCount(wc + 1);
      setPhase(next);
      setSecondsLeft(durationFor(next));
      onPhaseChange?.(next);
      return;
    }
    if (p === 'long_break') {
      setWorkCount(0);
    }
    setPhase('work');
    setSecondsLeft(durationFor('work'));
    onPhaseChange?.('work');
  }

  function start() {
    const { phase: p, secondsLeft: left, startedAt: s } = stateRef.current;
    if (left <= 0) return;
    const now = Date.now();
    if (isWork(p) && s === null) setStartedAt(now);
    setEndsAt(now + left * 1000);
    setRunning(true);
  }

  function pause() {
    const { endsAt: e } = stateRef.current;
    if (e !== null) {
      setSecondsLeft(Math.max(0, Math.ceil((e - Date.now()) / 1000)));
    }
    setRunning(false);
    setEndsAt(null);
  }

  function reset() {
    setRunning(false);
    setEndsAt(null);
    setStartedAt(null);
    setSecondsLeft(durationFor(stateRef.current.phase));
  }

  function skip() {
    const { phase: p, workCount: wc } = stateRef.current;
    setRunning(false);
    setEndsAt(null);
    setStartedAt(null);
    if (isWork(p)) {
      const next = nextPhase('work', wc + 1);
      setWorkCount(wc + 1);
      setPhase(next);
      setSecondsLeft(durationFor(next));
      onPhaseChange?.(next);
      return;
    }
    if (p === 'long_break') {
      setWorkCount(0);
    }
    setPhase('work');
    setSecondsLeft(durationFor('work'));
    onPhaseChange?.('work');
  }

  return {
    phase,
    secondsLeft,
    running,
    workCount,
    start,
    pause,
    reset,
    skip,
  };
}
