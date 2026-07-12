import React, { useEffect, useState } from 'react';
import { Activity, Clock, Github, CheckCircle2 } from 'lucide-react';

export function Topbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0a0f1c]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-8">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-mono font-medium tracking-wide uppercase">System Operational</span>
        </div>
        <div className="w-px h-4 bg-slate-800"></div>
        <div className="flex items-center gap-2 text-blue-400">
          <Github className="w-4 h-4" />
          <span className="text-xs font-mono font-medium tracking-wide uppercase">Active GitHub Sync Engine</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-mono text-slate-200">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
          <span className="text-xs text-slate-500 font-mono ml-2">
            {time.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          </span>
        </div>
      </div>
    </header>
  );
}
