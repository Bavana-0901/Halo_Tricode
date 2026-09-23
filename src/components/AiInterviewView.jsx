import React, { useState } from 'react';
import { Cpu, Send, CheckCircle2, Award, Sparkles, RefreshCw, ArrowRight, HelpCircle } from 'lucide-react';

export default function AiInterviewView({ data }) {
  if (!data) return null;

  const { interview_questions, resume_text, jd_text } = data;
  const questions = interview_questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [answersLog, setAnswersLog] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = questions[currentIndex];

  const handleNext = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || evaluating) return;

    setEvaluating(true);
    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: currentQ.id,
          question_text: currentQ.question,
          user_answer: userAnswer,
          resume_text,
          jd_text,
          expected_topics: currentQ.expected_topics || [],
          resume_evidence: currentQ.source || ''
        })
      });
      const evalData = await res.json();

      const newLogItem = {
        question: currentQ.question,
        category: currentQ.category,
        answer: userAnswer,
        score: evalData.score,
        feedback: evalData.feedback,
        strengths: evalData.strengths,
        improvements: evalData.improvements
        ,source: currentQ.source
      };

      const updatedLogs = [...answersLog, newLogItem];
      setAnswersLog(updatedLogs);
      setUserAnswer('');

      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserAnswer('');
    setAnswersLog([]);
    setIsCompleted(false);
  };

  const avgScore = answersLog.length > 0 
    ? Math.round(answersLog.reduce((acc, curr) => acc + curr.score, 0) / answersLog.length) 
    : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Cpu className="w-7 h-7 text-purple-400" /> Personalized AI Technical Interview
        </h1>
        <p className="text-sm text-slate-400">
          5 questions generated specifically from evidence extracted from the uploaded resume.
        </p>
      </div>

      {!isCompleted ? (
        currentQ && (
          <div className="glass-panel p-8 rounded-2xl border border-indigo-500/30 bg-slate-900/90 space-y-6">
            {/* PROGRESS BAR */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
              <span className="text-indigo-400">{currentQ.category}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* QUESTION BOX */}
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-lg font-semibold text-white leading-relaxed">{currentQ.question}</div>
              <div className="text-xs text-slate-400 italic">Context: {currentQ.context}</div>
            </div>

            {/* USER ANSWER INPUT */}
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Your Answer (Use STAR method: Situation, Task, Action, Result)
                </label>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  rows={5}
                  placeholder="Type your technical response here in detail..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{userAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
                <button
                  type="submit"
                  disabled={!userAnswer.trim() || evaluating}
                  className={`px-6 py-3 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all ${
                    !userAnswer.trim() || evaluating
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg'
                  }`}
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Answer...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Answer & Continue <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )
      ) : (
        /* INTERVIEW RESULTS DASHBOARD */
        <div className="space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-indigo-500/30 text-center bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" /> Interview Completed
            </div>
            <h2 className="text-3xl font-extrabold text-white">Interview Performance Score</h2>
            <div className="text-6xl font-black text-indigo-400">{avgScore} <span className="text-xl font-medium text-slate-500">/ 100</span></div>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              {data.candidate?.name || 'Candidate'} completed {answersLog.length} of {questions.length} questions. Review the evidence-based feedback below.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-2xl mx-auto">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500">Name</div><div className="text-xs text-white mt-1">{data.candidate?.name || 'Not provided'}</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500">Email</div><div className="text-xs text-white mt-1 break-all">{data.candidate?.email || 'Not provided'}</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500">Phone</div><div className="text-xs text-white mt-1">{data.candidate?.phone || 'Not provided'}</div></div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-[10px] uppercase text-slate-500">Age</div><div className="text-xs text-white mt-1">{data.candidate?.age || 'Not provided'}</div></div>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-xs text-slate-300">
              <div>Questions<strong className="block text-white text-lg">{answersLog.length}</strong></div>
              <div>Strong answers<strong className="block text-emerald-300 text-lg">{answersLog.filter((log) => log.score >= 70).length}</strong></div>
              <div>Needs review<strong className="block text-amber-300 text-lg">{answersLog.filter((log) => log.score < 50).length}</strong></div>
            </div>
            <div className="text-left max-w-3xl mx-auto border-t border-slate-800 pt-5 space-y-3">
              <h3 className="text-sm font-bold text-white">Candidate Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-500">Professional Role:</span> <span className="text-slate-200">{data.candidate?.professional_role || 'Not provided'}</span></div>
                <div><span className="text-slate-500">Experience:</span> <span className="text-slate-200">{data.candidate?.experience?.join('; ') || 'Not provided'}</span></div>
                <div><span className="text-slate-500">Education:</span> <span className="text-slate-200">{data.candidate?.education?.join('; ') || 'Not provided'}</span></div>
                <div><span className="text-slate-500">Certifications:</span> <span className="text-slate-200">{data.candidate?.certifications?.join('; ') || 'Not provided'}</span></div>
                <div><span className="text-slate-500">Key Skills:</span> <span className="text-slate-200">{data.candidate?.skills?.join(', ') || 'Not provided'}</span></div>
              </div>
              <div className="text-xs"><span className="text-slate-500">Projects:</span> <span className="text-slate-200">{data.candidate?.projects?.join('; ') || 'Not provided'}</span></div>
            </div>

            <button
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 transition-all"
            >
              Retake Interview Session
            </button>
          </div>

          {/* DETAILED RESPONSES REVIEW */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Question-by-Question Evaluation Log</h3>
            {answersLog.map((log, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="text-sm font-bold text-indigo-300">Q{idx + 1}: {log.category}</div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-extrabold ${log.score >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    Score: {log.score}%
                  </span>
                </div>
                <div className="text-sm text-white font-medium">"{log.question}"</div>
                <div className="text-xs text-slate-500">Resume evidence: {log.source || 'Resume text'}</div>
                <div className="p-3 rounded-xl bg-slate-950 text-xs text-slate-300 italic border border-slate-800">
                  Your Answer: "{log.answer}"
                </div>
                <div className="text-xs text-slate-400">
                  <strong className="text-slate-200">Feedback:</strong> {log.feedback}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
