import { useEffect, useState } from 'react';

export function useOffline(): boolean {
  const [offline, setOffline] = useState(() => typeof navigator === 'undefined' ? false : !navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return offline;
}