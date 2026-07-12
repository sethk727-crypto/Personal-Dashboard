import React, { useState } from 'react';
import { CheckCircle2, Circle, Flame, Target, TrendingUp, Dumbbell, Code2, ChevronDown } from 'lucide-react';

export function DashboardView() {
  const todos = [
    { id: 1, text: 'Review Agribusiness casestudy financials', done: true },
    { id: 2, text: 'Complete System Design mock interview', done: false, priority: true },
    { id: 3, text: 'Finalize Q3 technical architecture review', done: false },
    { id: 4, text: 'Read chapter 4 of Neuro-Linguistic Programming text', done: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50 p-8">
        <div className="absolute top-0 right-0 p-32 opacity-10 blur-3xl rounded-full bg-blue-500 mix-blend-screen pointer-events-none"></div>
        <div className="relative z-10 flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Morning Executive Briefing</h1>
          <p className="text-slate-400 leading-relaxed max-w-2xl">
            Good morning. You have 3 high-priority tasks today. System readiness is optimal (92%). Recommend front-loading analytical work before 14:00.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0f1525] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              High-Priority Actions
            </h2>
          </div>
          <div className="space-y-3">
            {todos.map(todo => (
              <div key={todo.id} className={`flex items-start gap-3 p-3 rounded-xl border ${todo.done ? 'bg-slate-900/50 border-transparent opacity-60' : 'bg-slate-800/40 border-slate-700/50'}`}>
                <button className="mt-0.5 flex-shrink-0">
                  {todo.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <div className="flex flex-col">
                  <span className={`text-sm ${todo.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                    {todo.text}
                  </span>
                  {todo.priority && (
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mt-1">Priority • Urgent</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="col-span-1 grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0f1525] p-5 shadow-xl flex items-start justify-between group">
            <div>
              <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Nutrition Engine</div>
              <div className="text-2xl font-semibold text-slate-100">2,450 <span className="text-sm font-normal text-slate-400">kcal</span></div>
              <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> On Track (180g P)</div>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0f1525] p-5 shadow-xl flex flex-col group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Gym Protocol</div>
                <div className="text-sm font-medium text-slate-100">Plan Session</div>
              </div>
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Dumbbell className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Target Time</label>
                <input 
                  type="time" 
                  className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors" 
                  defaultValue="17:30" 
                />
              </div>
              <div className="relative">
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Routine Droplet</label>
                <select className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer transition-colors">
                  <option>Push (Chest, Shoulders, Triceps)</option>
                  <option>Pull (Back, Biceps, Rear Delts)</option>
                  <option>Legs (Quads, Hams, Calves)</option>
                  <option>Active Recovery (Mobility/Cardio)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 bottom-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0f1525] p-5 shadow-xl flex items-start justify-between group">
            <div>
              <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Deep Work</div>
              <div className="text-2xl font-semibold text-slate-100">4.5 <span className="text-sm font-normal text-slate-400">hrs</span></div>
              <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +1.2 hrs this week</div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
