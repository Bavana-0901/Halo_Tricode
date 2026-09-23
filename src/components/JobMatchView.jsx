import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Search, Layers, FileCode } from 'lucide-react';

export default function JobMatchView({ data }) {
  if (!data) return null;

  const { skill_match, skill_gaps } = data;
  const { matched, partial, missing } = skill_match || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Layers className="w-7 h-7 text-indigo-400" /> Job Requirement Match & Skill Gap Analysis
        </h1>
        <p className="text-sm text-slate-400">
          Requirement-by-requirement comparison between target Job Description and your extracted resume evidence.
        </p>
      </div>

      {/* MATCHED, PARTIAL, MISSING TABS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">MATCHED SKILLS</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">{matched?.length || 0}</div>
          <p className="text-xs text-slate-400">Skills fully verified in resume text</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">PARTIAL MATCHES</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">{partial?.length || 0}</div>
          <p className="text-xs text-slate-400">Skills with moderate semantic evidence</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-950/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">MISSING SKILLS</span>
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">{missing?.length || 0}</div>
          <p className="text-xs text-slate-400">Required JD skills absent from resume</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-950/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-rose-300">Missing Skills</h3>
          <span className="text-xs font-semibold text-rose-300">Total Missing Skills: {missing?.length || 0}</span>
        </div>
        {missing?.length ? (
          <div className="flex flex-wrap gap-2">
            {missing.map((item) => <span key={item.skill} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-200 border border-rose-500/20">{item.skill}</span>)}
          </div>
        ) : <p className="text-sm text-emerald-400">No major missing skills detected.</p>}
      </div>

      {/* MATCHED & PARTIAL SKILLS LIST */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Skill Match Breakdown</h3>
        <div className="space-y-3">
          {matched?.map((item) => (
            <div key={item.skill} className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MATCHED</span>
                <div>
                  <div className="text-sm font-bold text-white">{item.skill}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Evidence: "{item.evidence}"</div>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-400 px-3 py-1 bg-emerald-950/40 rounded-lg border border-emerald-800/50 flex-shrink-0">{item.match_type}</span>
            </div>
          ))}

          {partial?.map((item) => (
            <div key={item.skill} className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">PARTIAL</span>
                <div>
                  <div className="text-sm font-bold text-white">{item.skill}</div>
                  <div className="text-xs text-slate-400 mt-0.5">Evidence: "{item.evidence}"</div>
                </div>
              </div>
              <span className="text-xs font-medium text-amber-400 px-3 py-1 bg-amber-950/40 rounded-lg border border-amber-800/50 flex-shrink-0">{item.match_type}</span>
            </div>
          ))}

          {missing?.map((item) => (
            <div key={item.skill} className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">MISSING</span>
                <div>
                  <div className="text-sm font-bold text-white">{item.skill}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.evidence}</div>
                </div>
              </div>
              <span className="text-xs font-medium text-rose-400 px-3 py-1 bg-rose-950/40 rounded-lg border border-rose-800/50 flex-shrink-0">Required</span>
            </div>
          ))}
        </div>
      </div>

      {/* SKILL GAP MATRIX */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Detailed Skill Gap Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Target Skill</th>
                <th className="p-3">Current Resume Evidence</th>
                <th className="p-3">Required Level</th>
                <th className="p-3">Improvement Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {skill_gaps?.map((gap, i) => (
                <tr key={i} className="hover:bg-slate-900/40">
                  <td className="p-3 font-bold text-indigo-300">{gap.skill}</td>
                  <td className="p-3 text-slate-400 max-w-xs truncate">{gap.current_evidence}</td>
                  <td className="p-3 text-slate-300 font-medium">{gap.required_level}</td>
                  <td className="p-3 text-amber-300">{gap.improvement_needed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
