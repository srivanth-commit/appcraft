import { useCallback, useEffect, useState } from 'react';
import { db } from '../db';
import type { LocalProfile } from '../db/types';

const DEFAULT_NAME = 'Local focus log';
const DEFAULT_COLOR = '#0f766e';

const AVATAR_COLORS = [
  '#0f766e',
  '#4338ca',
  '#9a3412',
  '#7c3aed',
  '#be185d',
  '#166534',
  '#a16207',
  '#0e7490',
];

export function useProfile() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const existing = await db.getProfile();
    if (existing) {
      setProfile(existing);
    } else {
      const now = Date.now();
      const created = { id: 'local' as const, name: DEFAULT_NAME, color: DEFAULT_COLOR, created_at: now, updated_at: now };
      await db.putProfile(created);
      setProfile(created);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateName = useCallback(
    async (name: string) => {
      if (!profile) return;
      const next = { ...profile, name: name.trim() || DEFAULT_NAME, updated_at: Date.now() };
      await db.putProfile(next);
      setProfile(next);
    },
    [profile],
  );

  const updateColor = useCallback(
    async (color: string) => {
      if (!profile) return;
      const next = { ...profile, color, updated_at: Date.now() };
      await db.putProfile(next);
      setProfile(next);
    },
    [profile],
  );

  return { profile, loading, reload, updateName, updateColor, avatarColors: AVATAR_COLORS };
}
