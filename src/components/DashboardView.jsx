import React from 'react';
import { Award, CheckCircle2, AlertTriangle, Cpu, BookOpen, Layers, ArrowUpRight, TrendingUp, Sparkles } from 'lucide-react';

export default function DashboardView({ data, onNavigate }) {
  if (!data) return null;

  const { compatibility, resume_summary, skills_found, skill_match, ats_analysis, resume_filename } = data;
  const score = compatibility?.overall_score || 0;
  const breakdown = compatibility?.breakdown || {};

  const getScoreColor = (s) => {
    if (s >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (s >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" /> Live Resume Analysis Dashboard
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Analysis Results for <span className="text-indigo-300">{resume_filename}</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">{resume_summary}</p>
        </div>

        {/* Compatibility Score Circle Badge */}
        <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-700/60 p-4 rounded-2xl shadow-xl flex-shrink-0">
          <div className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center font-extrabold text-3xl ${getScoreColor(score)}`}>
            <span>{score}</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-[-2px]">/ 100</span>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Job Compatibility</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {score >= 80 ? 'Exceptional Match' : score >= 60 ? 'Strong Potential Match' : 'Skill Gaps Detected'}
            </div>
            <div className="text-xs text-indigo-400 mt-1 cursor-pointer flex items-center gap-1 hover:underline" onClick={() => onNavigate('job-match')}>
              View Detailed Breakdown <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 6-FACTOR SCORE BREAKDOWN GRID */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" /> 6-Factor Compatibility Breakdown
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(breakdown).map(([factor, factorScore]) => (
            <div key={factor} className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all">
              <div className="text-xs text-slate-400 font-medium truncate mb-2">{factor}</div>
              <div className="text-2xl font-bold text-white mb-2">{factorScore}%</div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${factorScore >= 80 ? 'bg-emerald-400' : factorScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                  style={{ width: `${factorScore}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MID DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ATS Health Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-300">ATS Health Score</span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {ats_analysis?.ats_score || 0} / 100
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white mb-2">{ats_analysis?.ats_score}%</div>
            <p className="text-xs text-slate-400 mb-4">
              Bullet impact score is <strong className="text-slate-200">{ats_analysis?.bullet_impact}%</strong> with {ats_analysis?.action_verbs_found?.length || 0} action verbs detected.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('resume-analysis')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 flex items-center justify-center gap-1 transition-all"
          >
            Review ATS Audit & Strengths <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Skill Match Overview */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-300">Skill Match Overview</span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> {skill_match?.matched?.length || 0} Matched
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Matched Skills</span>
                <span className="text-emerald-400 font-semibold">{skill_match?.matched?.length || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Partial Skills</span>
                <span className="text-amber-400 font-semibold">{skill_match?.partial?.length || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Missing Skills</span>
                <span className="text-rose-400 font-semibold">{skill_match?.missing?.length || 0}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('job-match')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 flex items-center justify-center gap-1 transition-all"
          >
            View Skill Gap Analysis <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* AI Interview Kit Ready */}
        <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 to-purple-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-purple-300 text-sm font-bold">
              <Cpu className="w-5 h-5 text-purple-400" /> Personalized AI Interview
            </div>
            <p className="text-xs text-slate-300 mb-4">
              We generated 5 targeted interview questions specifically based on your resume evidence and missing JD skills.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('ai-interview')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1 transition-all"
          >
            Start Interactive AI Interview <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QUICK SKILLS FOUND PREVIEW */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Extracted Skill Taxonomy
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(skills_found || {}).map(([cat, skills]) => (
            <div key={cat} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">{cat}</div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
