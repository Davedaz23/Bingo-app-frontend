'use client';

export function ReconnectBanner() {
  return (
    <div className="bg-red-900/80 border-b border-red-700 px-3 py-1.5 flex items-center gap-2 text-sm flex-shrink-0">
      <div className="w-3 h-3 rounded-full border-2 border-red-400 border-t-transparent spinner" />
      <span className="text-red-300 font-medium text-xs">Reconnecting...</span>
    </div>
  );
}

