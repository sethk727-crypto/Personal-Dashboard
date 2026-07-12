import React from 'react';
import { Activity, Dumbbell, Moon, Target, TrendingUp, AlertTriangle } from 'lucide-react';

const RingBar = ({ progress, color }: { progress: number, color: string }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="transform -rotate-90 w-14 h-14">
        <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
        <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className={`${color} transition-all duration-1000 ease-in-out`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-[10px] font-mono font-bold text-slate-200">
        {progress}%
      </div>
    </div>
  );
};

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Advanced Telemetry</h1>
          <p className="text-sm text-slate-400 mt-1">Quantitative matrix and predictive modeling.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metabolic Caps (Ring Bars) */}
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Metabolic Targets
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">2100 KCAL</span>
          </div>
          
          <div className="flex justify-between items-center px-2">
            <div className="flex flex-col items-center gap-2">
              <RingBar progress={90} color="text-blue-500" />
              <span className="text-xs text-slate-400 font-medium">PRO</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RingBar progress={75} color="text-emerald-500" />
              <span className="text-xs text-slate-400 font-medium">CHO</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RingBar progress={60} color="text-amber-500" />
              <span className="text-xs text-slate-400 font-medium">FAT</span>
            </div>
          </div>
        </div>

        {/* Strength & Sleep */}
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-700 transition-colors flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-blue-400" />
                Physical Readiness
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <Moon className="w-5 h-5 text-indigo-400 mb-2" />
                <div className="text-2xl font-mono text-slate-100 mb-1">84<span className="text-sm text-slate-500">%</span></div>
                <div className="text-xs text-slate-400">Sleep Score</div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <Target className="w-5 h-5 text-rose-400 mb-2" />
                <div className="text-xl font-bold text-slate-100 mb-1 leading-tight mt-1">Push Day</div>
                <div className="text-xs text-slate-400 mt-2">Status: Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wagering Probability Models */}
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Predictive Models
            </h3>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded">EV+ 4.2%</span>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 group hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-slate-200">UFC 305 Main Event</span>
                <span className="text-xs font-mono text-emerald-400">+145</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Implied: 40.8%</span>
                <span className="text-blue-400 font-medium">Model: 46.5%</span>
              </div>
            </div>
            <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50 group hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-slate-200">EPL: ARS vs MCI</span>
                <span className="text-xs font-mono text-slate-400">-110</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1 text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Hedge Rec.</span>
                </div>
                <span className="font-mono text-slate-300">Exp. ROI: 2.1%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
