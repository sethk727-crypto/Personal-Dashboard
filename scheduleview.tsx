import React from 'react';
import { Calendar as CalendarIcon, Battery, Moon } from 'lucide-react';

export function ScheduleView() {
  const schedule = [
    { time: '06:00', title: 'Deep Work: Software Engineering', type: 'focus', duration: 2 },
    { time: '08:00', title: 'Agribusiness Casework Review', type: 'analytical', duration: 1.5 },
    { time: '09:30', title: 'Neuro-Linguistic Programming Reading', type: 'learning', duration: 1 },
    { time: '10:30', title: 'Meeting: Project Sync', type: 'professional', duration: 1 },
    { time: '12:00', title: 'Physical Protocol (Gym)', type: 'physical', duration: 1.5 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0f1525] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              Visual Calendar Timeline
            </h2>
          </div>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
            {schedule.map((item, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-500 font-mono text-xs shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  {item.time}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm transition hover:border-slate-700">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-slate-200 text-sm">{item.title}</h3>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{item.duration}h</span>
                  </div>
                  <div className={`text-xs font-mono uppercase tracking-wider ${
                    item.type === 'focus' ? 'text-blue-400' :
                    item.type === 'physical' ? 'text-orange-400' :
                    item.type === 'analytical' ? 'text-emerald-400' :
                    'text-slate-400'
                  }`}>
                    {item.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wellness tracking */}
        <div className="col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-[#0f1525] p-6 shadow-xl">
            <h2 className="text-lg font-medium flex items-center gap-2 mb-6">
              <Battery className="w-5 h-5 text-emerald-400" />
              Energy & Recovery
            </h2>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400 font-mono">System Readiness</span>
                  <span className="text-emerald-400 font-bold">92%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-500 font-mono mb-1">HRV Base</div>
                  <div className="text-lg font-semibold text-slate-200">68 <span className="text-xs text-slate-500 font-normal">ms</span></div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-mono mb-1">RHR</div>
                  <div className="text-lg font-semibold text-slate-200">48 <span className="text-xs text-slate-500 font-normal">bpm</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0f1525] p-6 shadow-xl">
            <h2 className="text-lg font-medium flex items-center gap-2 mb-6">
              <Moon className="w-5 h-5 text-blue-400" />
              Sleep Architecture
            </h2>
            <div className="flex items-end gap-2 h-24 mb-4">
              <div className="w-1/4 bg-slate-800 rounded-t-sm h-[20%] relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">Wake</div>
              </div>
              <div className="w-1/4 bg-blue-500/20 border-t border-blue-500/50 rounded-t-sm h-[60%] relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Light</div>
              </div>
              <div className="w-1/4 bg-blue-600/40 border-t border-blue-500/50 rounded-t-sm h-[100%] relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Deep</div>
              </div>
              <div className="w-1/4 bg-purple-500/30 border-t border-purple-500/50 rounded-t-sm h-[80%] relative group">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">REM</div>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400 text-center">Total: 7h 42m</div>
          </div>
        </div>

      </div>
    </div>
  );
}
