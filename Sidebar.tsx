import React from 'react';
import { Home, Mic, Calendar, Cpu, Activity, Zap } from 'lucide-react';
import { Tab } from '../types';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'overview', icon: Home, label: 'Executive Overview' },
    { id: 'notes', icon: Mic, label: 'Cognitive Notes' },
    { id: 'schedule', icon: Calendar, label: 'Schedule Sync' },
    { id: 'analytics', icon: Activity, label: 'Analytics' },
    { id: 'intelligence', icon: Cpu, label: 'AI Intelligence Hub' },
  ] as const;

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0a0f1c] flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <Zap className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="font-bold text-slate-100 tracking-wider">LifeOS<span className="text-emerald-400">.</span></span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-slate-800/50 text-emerald-400 border border-slate-700/50 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-500 mb-2">SYSTEM STATUS</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-sm font-medium text-emerald-400/90 tracking-tight">All systems nominal</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
