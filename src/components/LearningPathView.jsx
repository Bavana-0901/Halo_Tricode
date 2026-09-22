import React from 'react';
import { GraduationCap, BookOpen, Code, FolderCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LearningPathView({ data }) {
  if (!data) return null;

  const { learning_path } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-indigo-400" /> Actionable Learning Path Roadmap
        </h1>
        <p className="text-sm text-slate-400">
          Targeted 4-stage action plan (Learn &rarr; Practice &rarr; Project &rarr; Assessment) for every identified skill gap.
        </p>
      </div>

      <div className="space-y-6">
        {learning_path?.map((item, idx) => (
          <div key={item.skill} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
                  {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-white">Target Skill: <span className="text-indigo-300">{item.skill}</span></h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* STAGE 1: LEARN */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <BookOpen className="w-4 h-4" /> 1. Learn
                </div>
                <p className="text-xs text-slate-300">{item.learn}</p>
              </div>

              {/* STAGE 2: PRACTICE */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                  <Code className="w-4 h-4" /> 2. Practice
                </div>
                <p className="text-xs text-slate-300">{item.practice}</p>
              </div>

              {/* STAGE 3: PROJECT */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-pink-400 uppercase tracking-wider">
                  <FolderCheck className="w-4 h-4" /> 3. Build Project
                </div>
                <p className="text-xs text-slate-300">{item.project}</p>
              </div>

              {/* STAGE 4: ASSESSMENT */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> 4. Assess
                </div>
                <p className="text-xs text-slate-300">{item.assessment}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
