import React, { useState } from 'react';
import { Compass, CheckCircle2, XCircle, ArrowRight, Award, Lightbulb } from 'lucide-react';

export default function CareerIntelligenceView({ data }) {
  if (!data) return null;

  const { role_compatibility } = data;
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  const roles = role_compatibility || [];
  const currentRole = roles[selectedRoleIndex] || roles[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Compass className="w-7 h-7 text-indigo-400" /> Career Intelligence & Role Alignment
        </h1>
        <p className="text-sm text-slate-400">
          Evaluates your candidate profile against 7 core technology roles to pinpoint your highest compatibility and career expansion vectors.
        </p>
      </div>

      {/* 7 ROLE SELECTION CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {roles.map((r, idx) => (
          <button
            key={r.role}
            onClick={() => setSelectedRoleIndex(idx)}
            className={`p-3 rounded-xl text-left border transition-all ${
              selectedRoleIndex === idx
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                : 'glass-panel border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="text-xs font-semibold truncate mb-1">{r.role}</div>
            <div className={`text-lg font-extrabold ${r.compatibility_score >= 70 ? 'text-emerald-400' : r.compatibility_score >= 40 ? 'text-amber-400' : 'text-slate-400'}`}>
              {r.compatibility_score}%
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{r.status}</div>
          </button>
        ))}
      </div>

      {/* SELECTED ROLE DRILLDOWN */}
      {currentRole && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-slate-900/90 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-2 inline-block">
                Role Analysis
              </span>
              <h2 className="text-2xl font-bold text-white">{currentRole.role} Alignment</h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-semibold uppercase">Compatibility Score</div>
                <div className="text-3xl font-extrabold text-indigo-400">{currentRole.compatibility_score}%</div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-extrabold text-xl">
                {currentRole.compatibility_score}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Skills */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20">
              <h3 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Matched Skills ({currentRole.matched_skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentRole.matched_skills.length > 0 ? (
                  currentRole.matched_skills.map((sk) => (
                    <span key={sk} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No direct skill match yet</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20">
              <h3 className="text-sm font-bold text-rose-300 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" /> Missing Role Skills ({currentRole.missing_skills.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentRole.missing_skills.length > 0 ? (
                  currentRole.missing_skills.map((sk) => (
                    <span key={sk} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold">100% role skill coverage achieved!</span>
                )}
              </div>
            </div>
          </div>

          {/* Learning Recommendation */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Strategic Recommendation</div>
              <p className="text-xs text-slate-200">{currentRole.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
