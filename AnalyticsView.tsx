import React from 'react';
import { Activity, Dumbbell, Moon, Target, TrendingUp, AlertTriangle } from 'lucide-react';

export function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Quantitative Matrix</h1>
          <p className="text-sm text-slate-400 mt-1">Metabolic & Market Telemetry</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metabolic Caps */}
        <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Metabolic Caps
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">2100 / 2400 KCAL</span>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Protein</span>
                <span className="font-mono text-slate-300">180g / 200g</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[90%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Carbs</span>
                <span className="font-mono text-slate-300">150g / 200g</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[75%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Fats</span>
                <span className="font-mono text-slate-300">50g / 65g</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[77%]"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Strength & Sleep */}
        <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
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
                <div className="text-xs text-slate-400">Sleep Quality</div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <Target className="w-5 h-5 text-rose-400 mb-2" />
                <div className="text-2xl font-mono text-slate-100 mb-1">Push</div>
                <div className="text-xs text-slate-400">Today's Split</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
