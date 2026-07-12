import React, { useState } from 'react';
import { Mic, Search, Calendar, FileText, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import Markdown from 'react-markdown';
import { Note } from '../types';

const MOCK_NOTES: Note[] = [
  {
    filename: 'voice_note_2026-07-12_15-53-46.md',
    mtime: '2026-07-12T15:53:46',
    content: `# Executive Summary
Meeting with the engineering team regarding the new deployment pipeline.

## Action Items
- [ ] Review Q3 infrastructure budget.
- [ ] Finalize the multi-region failover strategy.
- [ ] Ping DevOps regarding the staging latency spikes.

## Key Decisions
We decided to push the migration to next sprint to ensure proper testing. The current architecture will hold up for the next few weeks.
`
  },
  {
    filename: 'voice_note_2026-07-12_15-53-03.md',
    mtime: '2026-07-12T15:53:03',
    content: `# Product Roadmap Brainstorm
Thoughts on the new UX design language.

## Action Items
- [ ] Create a prototype of the new dashboard layout.
- [ ] Research dark mode color palettes.

## Notes
The current design feels too cluttered. We need to focus on information density and typography. Using a Bloomberg terminal-inspired aesthetic might be interesting.
`
  },
  {
    filename: 'voice_note_2026-07-12_15-27-35.md',
    mtime: '2026-07-12T15:27:35',
    content: `# Daily Reflection
Good progress today on the backend API optimization.

## Action Items
- [ ] Document the new caching strategy.
- [ ] Update the API specs in Confluence.
`
  },
  {
    filename: 'voice_note_2026-07-12_14-48-09.md',
    mtime: '2026-07-12T14:48:09',
    content: `# Client Feedback Call
Discussed the new reporting features with the enterprise client.

## Action Items
- [ ] Add CSV export functionality to the reports.
- [ ] Look into customizing the PDF headers.

## Feedback
They love the new charts but want more granular control over the data export options.
`
  }
];

export function NotesView() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(MOCK_NOTES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (taskText: string) => {
    setTasks(prev => ({ ...prev, [taskText]: !prev[taskText] }));
  };

  const filteredNotes = MOCK_NOTES.filter(n => 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const extractTasks = (content: string) => {
    const lines = content.split('\n');
    return lines.filter(line => line.includes('- [ ]') || line.includes('- [x]')).map(line => line.replace(/- \[[ x]\] /, '').trim());
  };

  const currentTasks = selectedNote ? extractTasks(selectedNote.content) : [];

  return (
    <div className="h-full flex gap-6 max-w-7xl mx-auto">
      {/* Left Pane: Notes Feed */}
      <div className="w-[380px] shrink-0 flex flex-col bg-[#0a0f1c] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Mic className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="font-semibold text-slate-100 tracking-tight">Cognitive Notes</h2>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {filteredNotes.map((note) => {
            const isSelected = selectedNote?.filename === note.filename;
            const date = new Date(note.mtime);
            
            return (
              <button
                key={note.filename}
                onClick={() => setSelectedNote(note)}
                className={`w-full text-left p-4 rounded-lg mb-2 transition-all ${
                  isSelected 
                    ? 'bg-slate-800/80 border-slate-700 shadow-sm' 
                    : 'bg-transparent hover:bg-slate-800/30 border-transparent'
                } border`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <Calendar className="w-3 h-3" />
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {isSelected && <ChevronRight className="w-4 h-4 text-blue-400" />}
                </div>
                <h3 className="font-medium text-slate-200 text-sm truncate mb-1">
                  {note.content.split('\n')[0].replace('# ', '') || 'Untitled Note'}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {note.content.split('\n').slice(1).join(' ').trim()}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Pane: Markdown Engine & Tasks */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {selectedNote ? (
          <>
            <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-8 flex-1 overflow-y-auto custom-scrollbar shadow-sm">
              <div className="flex items-center gap-3 text-sm font-mono text-slate-500 mb-6 border-b border-slate-800 pb-4">
                <FileText className="w-4 h-4" />
                {selectedNote.filename}
              </div>
              <div className="markdown-body prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-blue-400">
                <Markdown>{selectedNote.content}</Markdown>
              </div>
            </div>

            {currentTasks.length > 0 && (
              <div className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-6 shrink-0 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Linguistic Extraction Checklist
                </h3>
                <div className="space-y-3">
                  {currentTasks.map((task, idx) => (
                    <button 
                      key={idx}
                      onClick={() => toggleTask(task)}
                      className="flex items-start gap-3 w-full text-left group"
                    >
                      <div className="mt-0.5 shrink-0">
                        {tasks[task] ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                        )}
                      </div>
                      <span className={`text-sm transition-colors ${tasks[task] ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-slate-200'}`}>
                        {task}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 bg-[#0a0f1c] border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
            Select a transcript to view details
          </div>
        )}
      </div>
    </div>
  );
}
