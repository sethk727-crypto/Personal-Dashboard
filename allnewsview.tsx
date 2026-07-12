import React from 'react';
import { Cpu, ExternalLink, Zap } from 'lucide-react';
import { AINewsItem } from '../types';

export function AINewsView() {
  const news: AINewsItem[] = [
    {
      id: '1',
      title: 'New Sparse Autoencoder Architecture Reduces Hallucinations by 40%',
      source: 'Anthropic Research',
      abstract: 'Researchers demonstrate a novel approach to feature extraction in LLMs, allowing for more interpretability and significantly reduced hallucination rates in analytical tasks.',
      timestamp: '2 hours ago',
      impactScore: 9.2
    },
    {
      id: '2',
      title: 'Local Models Now Rival GPT-4 on GSM8K Benchmark',
      source: 'Hugging Face Blog',
      abstract: 'The latest release of open-weight models under 8B parameters demonstrates unprecedented reasoning capabilities when quantized for consumer hardware.',
      timestamp: '5 hours ago',
      impactScore: 8.5
    },
    {
      id: '3',
      title: 'Context Windows Extended to 10M Tokens in Production',
      source: 'Google DeepMind',
      abstract: 'New ring-attention mechanisms allow for effectively infinite context windows, fundamentally changing RAG architectures and long-document processing.',
      timestamp: '12 hours ago',
      impactScore: 9.8
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-emerald-400" />
            AI Intelligence Hub
          </h1>
          <p className="text-slate-400 mt-2 font-mono text-sm">Real-time signal extraction from machine learning research.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          LIVE FEED
        </div>
      </div>

      <div className="space-y-4">
        {news.map(item => (
          <article key={item.id} className="group p-6 rounded-2xl bg-[#0f1525] border border-slate-800 hover:border-slate-600 transition-colors shadow-xl">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-blue-400">{item.source}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500">{item.timestamp}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded text-xs font-mono border border-slate-800">
                <span className="text-slate-400">IMPACT</span>
                <span className={item.impactScore > 9 ? 'text-emerald-400' : 'text-slate-300'}>{item.impactScore.toFixed(1)}</span>
              </div>
            </div>
            
            <h2 className="text-lg font-medium text-slate-200 mb-3 group-hover:text-emerald-400 transition-colors">
              {item.title}
            </h2>
            
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {item.abstract}
            </p>
            
            <a href="https://arxiv.org/list/cs.AI/recent" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors">
              READ FULL PAPER <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
