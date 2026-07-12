import React, { useState, useEffect } from 'react';
import { Mic, Search, Calendar, FileText, ChevronRight, CheckCircle2, Circle, RefreshCw, Github } from 'lucide-react';
import Markdown from 'react-markdown';
import { Note } from '../types';

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://api.github.com/repos/sethk727-crypto/Personal-Dashboard/contents/notes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes directory from GitHub. Ensure the directory exists.');
      }

      const files = await response.json();
      const loadedNotes: Note[] = [];
      
      for (const file of files) {
        if (file.name.endsWith('.md') && file.type === 'file') {
          const contentResponse = await fetch(file.download_url);
          const content = await contentResponse.text();
          
          let mtime = new Date().toISOString();
          const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
          if (dateMatch) {
            const dateStr = dateMatch[1].replace('_', 'T').replace(/-(\d{2})-(\d{2})$/, ':$1:$2');
            mtime = new Date(dateStr).toISOString();
          }

          loadedNotes.push({
            filename: file.name,
            mtime: mtime,
            content: content
          });
        }
      }
      
      loadedNotes.sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());
      
      setNotes(loadedNotes);
      if (loadedNotes.length > 0) {
        setSelectedNote(loadedNotes[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred fetching notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const toggleTask = (taskText: string) => {
    setTasks(prev => ({ ...prev, [taskText]: !prev[taskText] }));
  };

  const filteredNotes = notes.filter(n => 
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
      <div className="w-[380px] shrink-0 flex flex-col bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-colors">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Mic className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="font-semibold text-slate-100 tracking-tight">Cognitive Hub</h2>
            </div>
            <button 
              onClick={fetchNotes} 
              disabled={loading}
              className="p-2 text-slate-400 hover:text-blue-400 transition-colors disabled:opacity-50"
              title="Sync Notes from GitHub"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 relative">
          {loading && notes.length === 0 ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-sm">
               <RefreshCw className="w-6 h-6 animate-spin mb-3 text-blue-400" />
               <p>Syncing from GitHub...</p>
             </div>
          ) : error && notes.length === 0 ? (
             <div className="p-4 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg m-2">
               {error}
             </div>
          ) : filteredNotes.length === 0 ? (
             <div className="p-6 text-center text-sm text-slate-500">
               No notes found matching your search.
             </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = selectedNote?.filename === note.filename;
              const date = new Date(note.mtime);
              
              return (
                <button
                  key={note.filename}
                  onClick={() => setSelectedNote(note)}
                  className={`w-full text-left p-4 rounded-lg mb-2 transition-all ${
                    isSelected 
                      ? 'bg-slate-800 border-slate-700 shadow-sm' 
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
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {selectedNote ? (
          <>
            <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl p-8 flex-1 overflow-y-auto custom-scrollbar shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3 text-sm font-mono text-slate-500">
                  <FileText className="w-4 h-4" />
                  {selectedNote.filename}
                </div>
                <a 
                  href={`https://github.com/sethk727-crypto/Personal-Dashboard/tree/main/notes`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors flex items-center gap-2"
                >
                  <Github className="w-3 h-3" />
                  Edit in GitHub
                </a>
              </div>
              <div className="markdown-body prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-a:text-blue-400">
                <Markdown>{selectedNote.content}</Markdown>
              </div>
            </div>

            {currentTasks.length > 0 && (
              <div className="bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shrink-0 shadow-sm">
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
          <div className="flex-1 bg-[#0a0f1c]/80 backdrop-blur-sm border border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 shadow-sm">
            {loading ? (
              <>
                <RefreshCw className="w-8 h-8 animate-spin mb-4 text-slate-600" />
                <p>Establishing GitHub connection...</p>
              </>
            ) : (
              <>
                <FileText className="w-12 h-12 mb-4 text-slate-700" />
                <p>Select a transcript to view details</p>
                <p className="text-xs text-slate-600 mt-2">Create new markdown files in your GitHub notes directory to sync.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
