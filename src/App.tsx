import React, { useState } from 'react';
import { Tab } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { DashboardView } from './components/DashboardView';
import { NotesView } from './components/NotesView';
import { ScheduleView } from './components/ScheduleView';
import { AINewsView } from './components/AINewsView';
import { EmailView } from './components/EmailView';

import { AnalyticsView } from './components/AnalyticsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="flex h-screen bg-[#050811] text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Topbar />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative z-10">
          {activeTab === 'overview' && <DashboardView />}
          {activeTab === 'notes' && <NotesView />}
          {activeTab === 'schedule' && <ScheduleView />}
          {activeTab === 'analytics' && (
            <div className="space-y-12 max-w-7xl mx-auto">
              <AnalyticsView />
              <AINewsView />
            </div>
          )}
          {activeTab === 'email' && <EmailView />}
        </main>
      </div>
    </div>
  );
}

