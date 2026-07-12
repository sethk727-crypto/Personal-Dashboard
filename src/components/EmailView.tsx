import React from 'react';
import { Mail, Inbox } from 'lucide-react';

export function EmailView() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-400" />
            Communication Triage
          </h1>
          <p className="text-sm text-slate-400 mt-1">Inbox zero protocol active.</p>
        </div>
      </div>
      <div className="bg-[#0a0f1c]/80 backdrop-blur-md border border-slate-800 rounded-xl p-8 shadow-sm flex items-center justify-center min-h-[400px]">
        <div className="text-center text-slate-500">
          <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No new priority communications.</p>
        </div>
      </div>
    </div>
  );
}
