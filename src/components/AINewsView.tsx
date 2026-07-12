import React, { useState } from 'react';
import { Cpu, ExternalLink, Filter, Zap } from 'lucide-react';
import { AINewsItem } from '../types';

const INITIAL_NEWS: AINewsItem[] = [
  {
    id: '1',
    title: 'OpenAI announces GPT-4o with real-time multimodal capabilities',
    source: 'OpenAI Blog',
    abstract: [
      'Native multimodal processing without intermediate conversion',
      'Audio latency reduced to 232ms average',
      'Matches GPT-4 Turbo performance on text/code while being 50% cheaper'
    ],
    timestamp: '2 hours ago',
    impactScore: 9.5
  },
  {
    id: '2',
    title: 'Google DeepMind reveals AlphaFold 3',
    source: 'Nature',
    abstract: [
      'Predicts structure of all life\'s molecules, not just proteins',
      '50% improvement in prediction accuracy for protein-ligand interactions',
      'Available through AlphaFold Server for non-commercial research'
    ],
    timestamp: '5 hours ago',
    impactScore: 9.0
  },
  {
    id: '3',
    title: 'Anthropic releases Claude 3.5 Sonnet',
    source: 'Anthropic News',
    abstract: [
      'Operates at twice the speed of Claude 3 Opus',
      'Introduces new Artifacts UI for real-time collaboration',
      'Sets new industry benchmarks in graduate-level reasoning (GPQA)'
    ],
    timestamp: '1 day ago',
    impactScore: 8.5
  },
  {
    id: '4',
    title: 'Meta open-sources Llama 3 8B and 70B models',
    source: 'Meta AI',
    abstract: [
      'Trained on 15T tokens of data',
      'Demonstrates state-of-the-art performance for their parameter scale',
      '400B parameter model currently in training phase'
    ],
    timestamp: '2 days ago',
    impactScore: 8.8
  }
];

export function AINewsView() {
  const [news] = useState<AINewsItem[]>(INITIAL_NEWS);

  const getImpactColor = (score: number) => {
    if (score >= 9) return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    if (score >= 8) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
            <Cpu className="w-6 h-6 text-blue-400" />
            AI Intelligence Hub
          </h1>
          <p className="text-sm text-slate-400 mt-1">Real-time tracking of high-impact technology breakthroughs.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg flex items-center gap-2 border border-slate-700/50 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filter Stream</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-8">
        {news.map((item) => (
          <div key={item.id} className="bg-[#0a0f1c] border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors group flex flex-col shadow-sm">
            <div className="flex items-start justify-between mb-4 gap-4">
              <h2 className="text-lg font-semibold text-slate-100 leading-tight group-hover:text-blue-400 transition-colors">
                {item.title}
              </h2>
              <div className={`shrink-0 px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${getImpactColor(item.impactScore)}`}>
                <Zap className="w-3 h-3" />
                <span className="text-xs font-mono font-bold">{item.impactScore.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4 text-xs font-mono">
              <span className="px-2 py-1 bg-slate-800 rounded text-slate-300 border border-slate-700/50">{item.source}</span>
              <span className="text-slate-500">{item.timestamp}</span>
            </div>

            <ul className="space-y-2 mb-6 flex-1">
              {item.abstract.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-slate-800 flex justify-between items-center mt-auto">
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1.5 transition-colors">
                <ExternalLink className="w-4 h-4" />
                Read Full Analysis
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
