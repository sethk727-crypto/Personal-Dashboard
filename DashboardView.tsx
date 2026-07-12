import React from 'react';
import { Activity, Battery, CloudRain, ShieldCheck, Cpu } from 'lucide-react';

export function DashboardView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Overview</h1>
          <p className="text-sm text-slate-400 mt-1">System status and top-level metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Stats */}
        <div className="bg-[#0a0f1c] border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">CORE ENERGY</div>
            <div className="text-2xl font-bold text-slate-100">89%</div>
          </div>
          <Battery className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
        <div className="bg-[#0a0f1c] border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">DATA SYNC</div>
            <div className="text-2xl font-bold text-slate-100">Optimal</div>
          </div>
          <Activity className="w-8 h-8 text-blue-400 opacity-80" />
        </div>
        <div className="bg-[#0a0f1c] border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">SECURITY</div>
            <div className="text-2xl font-bold text-slate-100">Active</div>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
        <div className="bg-[#0a0f1c] border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">WEATHER</div>
            <div className="text-2xl font-bold text-slate-100">68°F</div>
          </div>
          <CloudRain className="w-8 h-8 text-indigo-400 opacity-80" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-6 shadow-sm min-h-[300px]">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            System Resources
          </h3>
          <div className="flex items-center justify-center h-[200px] border border-slate-800/50 rounded-lg bg-slate-900/30">
            <span className="text-sm text-slate-500 font-mono">Telemetry visualization offline</span>
          </div>
        </div>
        <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-6 shadow-sm min-h-[300px]">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Recent Activity Log
          </h3>
          <div className="space-y-4">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className="flex items-center gap-4 text-sm">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                 <div className="text-slate-300 flex-1 truncate">Synchronized daily metrics with upstream server.</div>
                 <div className="text-xs font-mono text-slate-500 shrink-0">{i}h ago</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
