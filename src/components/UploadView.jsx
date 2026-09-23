import React, { useState } from 'react';
import { Upload, FileText, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function UploadView({ onAnalyze, loading, error }) {
  const [file, setFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleJdFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || (!jdFile && !jdText.trim())) return;
    onAnalyze(file, jdFile, jdText);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Career Intelligence Platform
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl mb-3">
          Resume Analysis & AI Interview Match
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto">
          Upload your resume or paste text, along with a target job description, to receive dynamic compatibility insights and tailored interview questions.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Resume Card */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border border-slate-800 hover:border-indigo-500/30 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-4 text-white font-semibold text-lg">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Upload Resume</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Supported: <strong className="text-slate-200">PDF, DOCX, TXT, MD, CSV, RTF</strong>
              </p>

              <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all mb-4">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.rtf,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileText className={`w-12 h-12 mb-3 ${file ? 'text-indigo-400' : 'text-slate-500'}`} />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-white max-w-[200px] truncate">{file.name}</p>
                    <p className="text-xs text-indigo-400 mt-1">{(file.size / 1024).toFixed(1)} KB • Ready</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Click or drag resume here</p>
                    <p className="text-xs text-slate-500 mt-1">PDF or Word document up to 10MB</p>
                  </div>
                )}
              </label>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Private Analysis</span>
            </div>
          </div>

          {/* Job Description Input Card */}
          <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between border border-slate-800 hover:border-indigo-500/30 transition-all">
            <div>
              <div className="flex items-center gap-2 mb-4 text-white font-semibold text-lg">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>Job Description</span>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Upload a JD file or paste the full target job posting.
              </p>

              <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 cursor-pointer bg-slate-900/50 hover:bg-slate-900/80 transition-all mb-4">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.rtf,.csv"
                  onChange={handleJdFileChange}
                  className="hidden"
                />
                {jdFile ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-white max-w-[200px] truncate">{jdFile.name}</p>
                    <p className="text-xs text-indigo-400 mt-1">Ready</p>
                  </div>
                ) : (
                  <div className="text-center flex items-center justify-center gap-2 text-slate-300">
                    <Upload className="w-4 h-4" /> <span className="text-sm font-medium">Upload JD File</span>
                  </div>
                )}
              </label>

              <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs font-semibold uppercase">
                <span className="flex-1 h-px bg-slate-800"></span> OR PASTE JD <span className="flex-1 h-px bg-slate-800"></span>
              </div>

              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste target job requirements, qualifications, and role responsibilities..."
                rows={4}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="mt-2 text-right">
              <span className="text-xs text-slate-500">{jdText.trim().split(/\s+/).filter(Boolean).length} words</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center pt-4">
          <button
            type="submit"
            disabled={!file || (!jdFile && !jdText.trim()) || loading}
            className={`inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white shadow-xl shadow-indigo-500/20 transition-all duration-200 ${!file || (!jdFile && !jdText.trim()) || loading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Analysis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span>Analyze Resume & Match</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
