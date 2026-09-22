import React, { useState } from 'react';
import { Sliders, Plus, X, Sparkles, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function WhatIfView({ data }) {
  if (!data) return null;

  const { resume_text, jd_text, compatibility, role_compatibility, ats_analysis } = data;

  const [inputSkill, setInputSkill] = useState('');
  const [addedSkills, setAddedSkills] = useState(['AWS', 'Docker']);
  const [simData, setSimData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!inputSkill.trim()) return;
    const clean = inputSkill.trim();
    if (!addedSkills.includes(clean)) {
      setAddedSkills([...addedSkills, clean]);
    }
    setInputSkill('');
  };

  const handleRemoveSkill = (sk) => {
    setAddedSkills(addedSkills.filter(s => s !== sk));
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/what-if', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text,
          jd_text,
          additional_skills: addedSkills
        })
      });
      const result = await res.json();
      if (result.success) {
        setSimData(result);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const initialScore = compatibility?.overall_score || 0;
  const updatedScore = simData ? simData.updated_compatibility?.overall_score : initialScore;
  const scoreDiff = updatedScore - initialScore;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Sliders className="w-7 h-7 text-indigo-400" /> What-If Scenario Sandbox
        </h1>
        <p className="text-sm text-slate-400">
          Simulate adding new skills (e.g. "What if I learn AWS and Docker?") to see real-time recalculations of your job compatibility, role fit, and ATS health.
        </p>
      </div>

      {/* INPUT CONTROLS */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> Add Hypothetical Skills to Profile
        </h3>

        <form onSubmit={handleAddSkill} className="flex gap-3">
          <input
            type="text"
            value={inputSkill}
            onChange={(e) => setInputSkill(e.target.value)}
            placeholder="Type a skill (e.g. AWS, Kubernetes, PyTorch, GraphQL)..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        </form>

        {/* ADDED SKILLS CHIPS */}
        <div className="flex flex-wrap gap-2 pt-2">
          {addedSkills.map((sk) => (
            <span key={sk} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              {sk}
              <button onClick={() => handleRemoveSkill(sk)} className="hover:text-rose-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        {/* RECALCULATE BUTTON */}
        <div>
          <button
            onClick={runSimulation}
            disabled={loading || addedSkills.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Recalculating Vector Index & Scores...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Run Real-Time Recalculation
              </>
            )}
          </button>
        </div>
      </div>

      {/* SIMULATION RESULTS COMPARISON */}
      {simData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* INITIAL VS UPDATED OVERALL SCORE */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Baseline Score</div>
              <div className="text-3xl font-extrabold text-slate-400">{initialScore} / 100</div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 text-center">
              <div className="text-xs text-indigo-300 font-bold uppercase mb-1">Recalculated Score</div>
              <div className="text-4xl font-extrabold text-indigo-400">{updatedScore} / 100</div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 text-center">
              <div className="text-xs text-emerald-300 font-bold uppercase mb-1">Impact Boost</div>
              <div className="text-4xl font-extrabold text-emerald-400">+{scoreDiff} Pts</div>
            </div>
          </div>

          {/* UPDATED ROLE COMPATIBILITY PREVIEW */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">Recalculated Target Role Alignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {simData.updated_role_compatibility?.slice(0, 4).map((r) => (
                <div key={r.role} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-bold text-slate-300 truncate">{r.role}</div>
                  <div className="text-2xl font-extrabold text-indigo-400 my-1">{r.compatibility_score}%</div>
                  <div className="text-[11px] text-slate-400 truncate">{r.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
