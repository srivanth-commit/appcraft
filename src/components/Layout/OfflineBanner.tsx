import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  return (
    <div className="flex w-full items-center justify-center gap-2 bg-amber-500/15 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
      <WifiOff size={16} />
      <span>Offline — all data is saved locally in your browser.</span>
    </div>
  );
}