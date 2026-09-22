import React, { useState } from 'react';
import { Users, Upload, Search, Send, Sparkles, CheckCircle2, AlertTriangle, Layers, Filter, Trophy } from 'lucide-react';

export default function RecruiterView() {
  const [files, setFiles] = useState([]);
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);

  // Recruiter Copilot state
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResponse, setCopilotResponse] = useState(null);

  const handleFilesChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleAnalyzeMulti = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !jdText.trim()) return;

    setLoading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('jd_text', jdText);

    try {
      const res = await fetch('/api/recruiter/analyze', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (err) {
      console.error("Recruiter analyze error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopilotSearch = async (e) => {
    e.preventDefault();
    if (!copilotQuery.trim() || copilotLoading) return;

    setCopilotLoading(true);
    try {
      const res = await fetch('/api/recruiter/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: copilotQuery })
      });
      const data = await res.json();
      setCopilotResponse(data);
    } catch (err) {
      console.error("Copilot search error:", err);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-7 h-7 text-indigo-400" /> Recruiter Mode & Candidate Copilot
        </h1>
        <p className="text-sm text-slate-400">
          Upload multiple candidate resumes, compare candidates against target JD requirements, and query candidate vector indexes using Recruiter Copilot.
        </p>
      </div>

      {/* MULTI-RESUME UPLOAD FORM */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-400" /> Multi-Candidate Resume Processing
        </h3>

        <form onSubmit={handleAnalyzeMulti} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Upload Candidate Resumes (Select Multiple Files)
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={handleFilesChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
              <div className="text-xs text-slate-500 mt-2">
                {files.length > 0 ? `${files.length} resume file(s) selected.` : "Choose PDF/DOCX/TXT files."}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Job Description
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={4}
                placeholder="Paste Job Description for candidate comparison ranking..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={files.length === 0 || !jdText.trim() || loading}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
              files.length === 0 || !jdText.trim() || loading
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg'
            }`}
          >
            {loading ? (
              <span>Processing Vector Embeddings for {files.length} Candidates...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Analyze & Rank Candidates
              </>
            )}
          </button>
        </form>
      </div>

      {/* CANDIDATES COMPARISON MATRIX */}
      {candidates.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Candidate Ranking Matrix ({candidates.length} Profiles)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Candidate Name</th>
                  <th className="p-3">Match Score</th>
                  <th className="p-3">ATS Score</th>
                  <th className="p-3">Matched Skills</th>
                  <th className="p-3">Missing Gaps</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {candidates.map((cand, idx) => (
                  <tr key={cand.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-indigo-400">#{idx + 1}</td>
                    <td className="p-3 font-semibold text-white">{cand.name}</td>
                    <td className="p-3 font-extrabold text-emerald-400">{cand.score}%</td>
                    <td className="p-3 text-purple-300 font-semibold">{cand.ats_score}%</td>
                    <td className="p-3 text-emerald-400">{cand.matched_count} skills</td>
                    <td className="p-3 text-rose-400">{cand.missing_count} skills</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECRUITER COPILOT SEARCH CHAT */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" /> Recruiter Copilot Search
          </div>
          <h3 className="text-lg font-bold text-white">Ask Anything About Uploaded Candidates</h3>
          <p className="text-xs text-slate-400">
            Examples: "Find candidates with Python and SQL", "Who has ML experience?", "Which candidates are missing AWS?"
          </p>
        </div>

        <form onSubmit={handleCopilotSearch} className="flex gap-3">
          <input
            type="text"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            placeholder="Type your search query across candidate vector index..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={!copilotQuery.trim() || copilotLoading}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-sm font-semibold text-white flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Query Copilot
          </button>
        </form>

        {copilotResponse && (
          <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/20 space-y-3">
            <div className="text-sm font-bold text-purple-300">{copilotResponse.answer}</div>
            
            <div className="space-y-2">
              {copilotResponse.matches?.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-white">
                    <span>{m.candidate_name} (Score: {m.candidate_score}%)</span>
                    <span className="text-purple-400">Relevance: {m.relevance_score * 100}%</span>
                  </div>
                  <div className="text-slate-400 font-mono italic">"{m.matched_chunk}"</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
