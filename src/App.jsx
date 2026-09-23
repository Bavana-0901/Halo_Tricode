import React, { useState } from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  ShieldCheck, 
  Layers, 
  Dna, 
  Compass, 
  MapPin, 
  Sliders, 
  GraduationCap, 
  Cpu, 
  Users, 
  Upload,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

import UploadView from './components/UploadView';
import DashboardView from './components/DashboardView';
import ResumeAnalysisView from './components/ResumeAnalysisView';
import JobMatchView from './components/JobMatchView';
import SkillDnaView from './components/SkillDnaView';
import CareerIntelligenceView from './components/CareerIntelligenceView';
import WhatIfView from './components/WhatIfView';
import AiInterviewView from './components/AiInterviewView';
import RecruiterView from './components/RecruiterView';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleAnalyze = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Failed to analyze resume.');
      }

      const data = await response.json();
      setAnalysisData(data);
      setActiveTab('dashboard');
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.message || 'An error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: 'upload', label: 'Upload & Analyze', icon: <Upload className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, disabled: !analysisData },
    { id: 'resume-analysis', label: 'Resume Analysis', icon: <ShieldCheck className="w-4 h-4" />, disabled: !analysisData },
    { id: 'job-match', label: 'Job Match', icon: <Layers className="w-4 h-4" />, disabled: !analysisData },
    { id: 'skill-dna', label: 'Skill DNA', icon: <Dna className="w-4 h-4" />, disabled: !analysisData },
    { id: 'career-intel', label: 'Career Intelligence', icon: <Compass className="w-4 h-4" />, disabled: !analysisData },
    { id: 'what-if', label: 'What-If Sandbox', icon: <Sliders className="w-4 h-4" />, disabled: !analysisData },
    { id: 'ai-interview', label: 'AI Interview', icon: <Cpu className="w-4 h-4" />, disabled: !analysisData },
    { id: 'recruiter', label: 'Recruiter Mode', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r border-slate-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 ease-in-out flex flex-col justify-between`}>
        <div>
          {/* Logo Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">TriCode <span className="text-indigo-400">AI</span></span>
            </div>
            <button className="md:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (!item.disabled) {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }
                }}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === item.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : item.disabled
                    ? 'text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Session Status */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Resume Session</div>
            <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
              {analysisData ? analysisData.resume_filename : 'No resume loaded'}
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header Bar */}
        <header className="h-16 border-b border-slate-800 glass-panel md:hidden flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-300">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-sm text-white">TriCode AI Platform</span>
          </div>
        </header>

        {/* Dynamic View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'upload' && <UploadView onAnalyze={handleAnalyze} loading={loading} error={error} />}
          {activeTab === 'dashboard' && <DashboardView data={analysisData} onNavigate={setActiveTab} />}
          {activeTab === 'resume-analysis' && <ResumeAnalysisView data={analysisData} />}
          {activeTab === 'job-match' && <JobMatchView data={analysisData} />}
          {activeTab === 'skill-dna' && <SkillDnaView data={analysisData} />}
          {activeTab === 'career-intel' && <CareerIntelligenceView data={analysisData} />}
          {activeTab === 'what-if' && <WhatIfView data={analysisData} />}
          {activeTab === 'ai-interview' && <AiInterviewView data={analysisData} />}
          {activeTab === 'recruiter' && <RecruiterView />}
        </main>
      </div>
    </div>
  );
}
