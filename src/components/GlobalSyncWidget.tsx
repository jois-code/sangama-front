import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const GlobalSyncWidget = () => {
  const { pesuSyncProgress, pesuSyncStatus } = useAuth();

  if (pesuSyncProgress === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-none">
      <div className="bg-surface/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.15)] flex flex-col gap-3 min-w-[280px]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
            PESU Network Sync
          </span>
          {pesuSyncProgress === 100 ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in" />
          ) : (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
        </div>
        <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary to-purple-500 h-1.5 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(139,92,246,0.8)] relative"
            style={{ width: `${pesuSyncProgress}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
        <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">
          {pesuSyncStatus}
        </span>
      </div>
    </div>
  );
};
