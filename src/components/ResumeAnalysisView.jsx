import React from 'react';
import { ShieldCheck, AlertCircle, CheckCircle, Lightbulb, Zap, FileText } from 'lucide-react';

export default function ResumeAnalysisView({ data }) {
  if (!data) return null;

  const { ats_analysis } = data;
  const { ats_score, bullet_impact, keyword_coverage, word_count, action_verbs_found, strengths, weak_areas, suggestions } = ats_analysis || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-400" /> Resume & ATS Audit Analysis
        </h1>
        <p className="text-sm text-slate-400">
          In-depth structural breakdown of your uploaded resume for Applicant Tracking Systems (ATS) and human recruiters.
        </p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">ATS Health Score</div>
          <div className="text-4xl font-extrabold text-indigo-400 mb-2">{ats_score} <span className="text-sm font-normal text-slate-500">/ 100</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${ats_score}%` }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Bullet Impact Rating</div>
          <div className="text-4xl font-extrabold text-purple-400 mb-2">{bullet_impact} <span className="text-sm font-normal text-slate-500">/ 100</span></div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${bullet_impact}%` }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">JD Keyword Coverage</div>
          <div className="text-4xl font-extrabold text-emerald-400 mb-2">{keyword_coverage}%</div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${keyword_coverage}%` }} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Action Verbs Found</div>
          <div className="text-4xl font-extrabold text-amber-400 mb-2">{action_verbs_found?.length || 0}</div>
          <div className="text-xs text-slate-400">Total word count: {word_count} words</div>
        </div>
      </div>

      {/* STRENGTHS & WEAK AREAS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resume Strengths */}
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <h3 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> Resume Strengths
          </h3>
          <ul className="space-y-3">
            {strengths?.map((str, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weak Areas */}
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-950/10">
          <h3 className="text-lg font-bold text-rose-300 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" /> Identified Weak Areas
          </h3>
          <ul className="space-y-3">
            {weak_areas?.map((wa, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-200">
                <span className="w-2 h-2 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                <span>{wa}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ACTION VERBS & IMPROVEMENT SUGGESTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Action Verbs Detected
          </h3>
          <div className="flex flex-wrap gap-2">
            {action_verbs_found?.map((verb) => (
              <span key={verb} className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 capitalize">
                {verb}
              </span>
            ))}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-400" /> Actionable Recommendations
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {suggestions?.map((sug, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold">{i+1}.</span>
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
