import React from 'react';
import { Calendar, Clock, Video, Users } from 'lucide-react';

export function ScheduleView() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
            <Calendar className="w-6 h-6 text-emerald-400" />
            Schedule Sync
          </h1>
          <p className="text-sm text-slate-400 mt-1">Daily timeline and focus blocks.</p>
        </div>
      </div>

      <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="relative border-l border-slate-800 ml-4 space-y-8 py-4">
          
          <div className="relative pl-8">
            <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-100 font-semibold">Deep Work Block</h3>
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                09:00 - 11:30
              </div>
            </div>
            <p className="text-sm text-slate-400">Architecture design for the new data pipeline. No interruptions.</p>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-100 font-semibold">Engineering Sync</h3>
              <div className="flex items-center gap-1.5 text-xs font-mono text-blue-400 bg-blue-400/10 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                13:00 - 14:00
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
              <div className="flex items-center gap-1.5"><Video className="w-4 h-4" /> Zoom</div>
              <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 5 attendees</div>
            </div>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-[-4px] top-1.5 w-2 h-2 bg-slate-600 rounded-full"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-slate-100 font-semibold opacity-70">Physical Training</h3>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                16:30 - 18:00
              </div>
            </div>
            <p className="text-sm text-slate-500">Push day routine. Supplements prepped.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
