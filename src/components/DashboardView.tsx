import React, { useState } from 'react';
import { Activity, Battery, CloudRain, ShieldCheck, Cpu, CheckCircle2, Circle } from 'lucide-react';

export function DashboardView() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Review Q3 infrastructure budget allocations', completed: false },
    { id: 2, text: 'Finalize multi-region failover strategy', completed: true },
    { id: 3, text: 'Approve new system architecture documentation', completed: false },
    { id: 4, text: 'Run daily data synchronization script', completed: false },
  ]);

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const pendingTasks = todos.filter(t => !t.completed).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Executive Overview</h1>
          <p className="text-sm text-slate-400 mt-1">System status and top-level metrics.</p>
        </div>
      </div>

      {/* Executive Briefing Banner */}
      <div className="bg-gradient-to-r from-blue-900/20 to-emerald-900/10 border border-blue-500/20 rounded-xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.05)] backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Executive Briefing</h2>
        <p className="text-slate-300">
          Good morning. The system has prioritized <strong className="text-amber-400">{pendingTasks} critical tasks</strong> for today. All core services are operating at nominal capacity.
        </p>
      </div>

      {/* High-Priority Action Framework */}
      <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          High-Priority Action Framework
        </h3>
        <div className="space-y-2">
          {todos.map(todo => (
            <button
              key={todo.id}
              onClick={() => toggleTodo(todo.id)}
              className="flex items-center gap-3 w-full text-left p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 group"
            >
              <div className="shrink-0">
                {todo.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                )}
              </div>
              <span className={`text-sm transition-colors ${todo.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {todo.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick Stats */}
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">CORE ENERGY</div>
            <div className="text-2xl font-bold text-slate-100">89%</div>
          </div>
          <Battery className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">DATA SYNC</div>
            <div className="text-2xl font-bold text-slate-100">Optimal</div>
          </div>
          <Activity className="w-8 h-8 text-blue-400 opacity-80" />
        </div>
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">SECURITY</div>
            <div className="text-2xl font-bold text-slate-100">Active</div>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>
        <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 p-5 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="text-xs text-slate-500 font-mono mb-1">WEATHER</div>
            <div className="text-2xl font-bold text-slate-100">68°F</div>
          </div>
          <CloudRain className="w-8 h-8 text-amber-400 opacity-80" />
        </div>
      </div>
    </div>
  );
}
