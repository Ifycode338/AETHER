import React from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function SessionTimeoutWarning() {
  const { sessionWarning, sessionTimeRemaining, resetSessionTimeout, dismissSessionWarning } = useAuth();

  if (!sessionWarning || !sessionTimeRemaining) return null;

  const minutes = Math.floor(sessionTimeRemaining / 60000);
  const seconds = Math.floor((sessionTimeRemaining % 60000) / 1000);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-right">
      <div className="bg-[#071f15] border border-[#22C55E]/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm mb-1">Session Expiring Soon</h3>
            <p className="text-white/60 text-xs mb-3">
              Your session will expire in {minutes}m {seconds}s. Refresh to continue.
            </p>
            <div className="flex gap-2">
              <button
                onClick={resetSessionTimeout}
                className="flex-1 px-3 py-2 rounded-lg bg-[#22C55E] text-[#051510] text-xs font-medium hover:bg-[#16a34a] transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh Session
              </button>
              <button
                onClick={dismissSessionWarning}
                className="px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
