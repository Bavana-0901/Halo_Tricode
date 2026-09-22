import React, { useState } from 'react';
import { Database, Search, Sparkles, Layers, FileText, CheckCircle2 } from 'lucide-react';

export default function EvidenceView({ data }) {
  if (!data) return null;

  const { semantic_evidence, vector_chunks } = data;
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChunks = searchQuery.trim()
    ? vector_chunks?.filter(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : vector_chunks;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Database className="w-7 h-7 text-indigo-400" /> Vector Database & Semantic Evidence Vault
        </h1>
        <p className="text-sm text-slate-400">
          Raw vector search results showing exact resume text passages indexed by FAISS / dense embeddings for JD requirements.
        </p>
      </div>

      {/* TOP SEMANTIC MATCHES */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> Vector Matches for Job Requirements
        </h3>

        <div className="space-y-4">
          {semantic_evidence?.map((ev, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-900/60 border border-indigo-500/20 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-indigo-300">JD REQUIREMENT: "{ev.jd_requirement}"</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Similarity: {(ev.similarity_score * 100).toFixed(1)}% ({ev.match_rating})
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                "{ev.resume_evidence}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAW VECTOR CHUNKS EXPLORER */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" /> Indexed Resume Chunks ({vector_chunks?.length || 0})
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vector chunks..."
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChunks?.map((chunk) => (
            <div key={chunk.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono text-indigo-400">{chunk.id}</span>
                <span>{chunk.word_count} words</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                "{chunk.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
