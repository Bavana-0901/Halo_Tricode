import React from 'react';
import { MapPin, ArrowRight, Flag, Target, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CareerGpsView({ data }) {
  if (!data) return null;

  const { role_compatibility, all_skills_flat, resume_filename } = data;
  const targetRole = role_compatibility?.[0] || { role: "Senior Developer", missing_skills: ["AWS", "System Design"] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <MapPin className="w-7 h-7 text-indigo-400" /> Career GPS & Growth Pathways
        </h1>
        <p className="text-sm text-slate-400">
          Mapping your current skill baseline to high-impact trajectory roles and step-by-step career advancement milestones.
        </p>
      </div>

      {/* VISUAL CAREER GPS PATHWAY FLOW */}
      <div className="glass-panel p-8 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          
          {/* STEP 1: CURRENT PROFILE */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 space-y-2 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-indigo-400" /> Current Baseline
            </div>
            <div className="text-lg font-bold text-white truncate">{resume_filename}</div>
            <p className="text-xs text-slate-400">{all_skills_flat?.length || 0} Core Skills Extracted</p>
            <div className="flex flex-wrap gap-1 pt-2">
              {all_skills_flat?.slice(0, 4).map(s => (
                <span key={s} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">{s}</span>
              ))}
            </div>
          </div>

          {/* ARROW 1 */}
          <div className="hidden lg:flex justify-center text-indigo-400">
            <ArrowRight className="w-8 h-8 animate-pulse" />
          </div>

          {/* STEP 2: TARGET ROLE */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-2 relative shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <Target className="w-4 h-4 text-purple-400" /> Target Next Role
            </div>
            <div className="text-lg font-bold text-white">{targetRole.role}</div>
            <p className="text-xs text-emerald-400 font-semibold">{targetRole.compatibility_score}% Current Alignment</p>
            <div className="text-[11px] text-slate-400 pt-1">
              Top match based on your technical evidence.
            </div>
          </div>

          {/* ARROW 2 */}
          <div className="hidden lg:flex justify-center text-indigo-400">
            <ArrowRight className="w-8 h-8 animate-pulse" />
          </div>

          {/* STEP 3: MILESTONE DELIVERABLE */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 space-y-2 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <Flag className="w-4 h-4 text-emerald-400" /> Milestone Destination
            </div>
            <div className="text-lg font-bold text-white">Production Ready</div>
            <p className="text-xs text-slate-400">Complete 2 gap projects & verify ATS score &gt; 85%.</p>
          </div>
        </div>
      </div>

      {/* MILESTONE STEPS LIST */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">Milestone Advancement Plan</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <div className="text-sm font-bold text-white">Bridge High-Priority Skill Gap</div>
              <p className="text-xs text-slate-400 mt-1">
                Target key missing skill: <strong className="text-indigo-300">{targetRole.missing_skills?.[0] || "Advanced Cloud / DevOps"}</strong>. Dedicate 2 weeks to hands-on deployment exercises.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <div className="text-sm font-bold text-white">Refactor Resume Action Bullet Points</div>
              <p className="text-xs text-slate-400 mt-1">
                Add quantifiable metrics (%, speedup, scale, user count) to recent project descriptions to elevate ATS Health score.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <div className="text-sm font-bold text-white">Practice Tailored Interview Questions</div>
              <p className="text-xs text-slate-400 mt-1">
                Execute interactive AI mock interview drills focusing on system design trade-offs and technical troubleshooting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
