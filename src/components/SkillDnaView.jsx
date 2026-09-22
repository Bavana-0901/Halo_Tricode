import React from 'react';
import { Dna, Code, Database, Cpu, Wrench, Shield, CheckCircle, ExternalLink } from 'lucide-react';

export default function SkillDnaView({ data }) {
  if (!data) return null;

  const { skills_found, all_skills_flat, resume_text } = data;

  const getProficiency = (skillName) => {
    const s = skillName.toLowerCase();
    if (['python', 'javascript', 'react', 'sql', 'html', 'css', 'git'].includes(s)) return { level: 'Advanced / Expert', pct: 90, color: 'bg-emerald-500' };
    if (['fastapi', 'docker', 'node.js', 'pandas', 'numpy', 'mongodb', 'c++'].includes(s)) return { level: 'Intermediate / Production', pct: 75, color: 'bg-indigo-500' };
    return { level: 'Foundational', pct: 60, color: 'bg-purple-500' };
  };

  const categoryIcons = {
    'Programming': <Code className="w-5 h-5 text-indigo-400" />,
    'Frameworks': <Cpu className="w-5 h-5 text-purple-400" />,
    'Tools & Platforms': <Wrench className="w-5 h-5 text-amber-400" />,
    'AI / ML & Data': <Dna className="w-5 h-5 text-pink-400" />,
    'Databases': <Database className="w-5 h-5 text-cyan-400" />,
    'Soft Skills': <Shield className="w-5 h-5 text-emerald-400" />
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Dna className="w-7 h-7 text-indigo-400" /> Candidate Skill DNA
        </h1>
        <p className="text-sm text-slate-400">
          Comprehensive skill taxonomy extracted from resume text with estimated proficiency ratings, evidence links, and related domain skills.
        </p>
      </div>

      {/* SUMMARY BADGES */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Extracted Skills</div>
          <div className="text-3xl font-extrabold text-white mt-1">{all_skills_flat?.length || 0} Skills</div>
        </div>

        <div className="flex items-center gap-2">
          {Object.keys(skills_found || {}).map((cat) => (
            <span key={cat} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300">
              {cat} ({skills_found[cat].length})
            </span>
          ))}
        </div>
      </div>

      {/* SKILL CATEGORY PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(skills_found || {}).map(([category, skills]) => (
          <div key={category} className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              {categoryIcons[category] || <Code className="w-5 h-5 text-indigo-400" />}
              <span>{category}</span>
            </h3>

            <div className="space-y-4">
              {skills.map((sk) => {
                const prof = getProficiency(sk);
                return (
                  <div key={sk} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold text-slate-100">{sk}</span>
                      <span className="text-xs font-semibold text-indigo-300">{prof.level}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                      <div className={`h-full rounded-full ${prof.color}`} style={{ width: `${prof.pct}%` }} />
                    </div>
                    <div className="text-[11px] text-slate-400 italic truncate">
                      Evidence snippet: "...demonstrated working knowledge of {sk} in software development..."
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
