import os
import json
import uvicorn
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pipeline import (
    extract_text_from_bytes,
    chunk_text,
    VectorIndex,
    extract_skills,
    extract_jd_requirements,
    calculate_compatibility,
    analyze_skill_gaps,
    analyze_ats,
    generate_interview_questions,
    extract_candidate_info,
    analyze_role_compatibility,
    TARGET_ROLES
)

app = FastAPI(
    title="AI Career & Talent Intelligence Platform API",
    version="1.0.0",
    description="Vector search & NLP pipeline for resume processing, job compatibility, ATS auditing, and recruiter copilot."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory storage for active sessions & recruiter datasets
RECRUITER_CANDIDATES_DB: List[Dict[str, Any]] = []


# --- SCHEMAS ---
class WhatIfRequest(BaseModel):
    resume_text: str
    jd_text: str
    additional_skills: List[str]

class AnswerEvalRequest(BaseModel):
    question_id: str
    question_text: str
    user_answer: str
    resume_text: Optional[str] = ""
    jd_text: Optional[str] = ""
    expected_topics: Optional[List[str]] = None
    resume_evidence: Optional[str] = ""

class RecruiterCopilotRequest(BaseModel):
    query: str


# --- HEALTH CHECK ---
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "AI Career Intelligence Engine"}


# --- MAIN SINGLE RESUME + JD ANALYSIS ROUTE ---
@app.post("/api/analyze")
async def analyze_resume_and_jd(
    file: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None)
):
    if not file:
        raise HTTPException(status_code=400, detail="Resume file is required.")
        
    try:
        contents = await file.read()
        raw_text = extract_text_from_bytes(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read upload file: {str(e)}")

    if not raw_text or len(raw_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded file.")

    actual_jd_text = ""
    if jd_file:
        try:
            jd_contents = await jd_file.read()
            actual_jd_text = extract_text_from_bytes(jd_contents, jd_file.filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read JD file: {str(e)}")
    elif jd_text:
        actual_jd_text = jd_text

    if not actual_jd_text or len(actual_jd_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Could not extract readable text from the job description.")

    # 1. Text Chunking
    chunks = chunk_text(raw_text, chunk_words=60, overlap_words=15)
    
    # 2. Build Vector Index (FAISS / Cosine Similarity)
    vector_index = VectorIndex(chunks)

    # 3. Calculate 6-factor Compatibility Score
    compatibility = calculate_compatibility(raw_text, actual_jd_text, vector_index)

    # 4. Extract Skills (Resume & JD)
    resume_skills_categorized, resume_skills_flat = extract_skills(raw_text)
    jd_skills_categorized, jd_skills_flat = extract_skills(actual_jd_text)

    # 5. Skill Gap Analysis & Evidence Retrieval
    skill_analysis = analyze_skill_gaps(raw_text, actual_jd_text, vector_index)

    # 6. Semantic Evidence Search for Top JD Requirements
    jd_requirements = extract_jd_requirements(actual_jd_text)
    semantic_evidence = []
    for req in jd_requirements[:6]:
        req_title = req["skill"]
        search_res = vector_index.search(req_title, top_k=1)
        if search_res:
            top_match = search_res[0]
            semantic_evidence.append({
                "jd_requirement": req_title,
                "resume_evidence": top_match["text"],
                "similarity_score": top_match["similarity"],
                "match_rating": "Strong Match" if top_match["similarity"] > 0.65 else ("Moderate Match" if top_match["similarity"] > 0.45 else "Weak Match")
            })

    # 7. ATS Audit Analysis
    ats_report = analyze_ats(raw_text, actual_jd_text)

    # 8. Personalized Interview Questions
    interview_questions = generate_interview_questions(raw_text, actual_jd_text, skill_analysis["gaps"], vector_index)

    # 9. Role Compatibility (7 Roles)
    role_compatibility = analyze_role_compatibility(raw_text)

    # 10. Generate Learning Path Modules for Gaps
    learning_path = []
    for gap in skill_analysis["gaps"]:
        sk = gap["skill"]
        learning_path.append({
            "skill": sk,
            "learn": f"Complete intensive training module on {sk} principles & fundamentals.",
            "practice": f"Build 3 mini-exercises using {sk} in a sandbox environment.",
            "project": f"Implement a production-ready feature utilizing {sk} with unit tests and GitHub documentation.",
            "assessment": f"Pass the {sk} hands-on code review challenge."
        })

    # Build response object
    result = {
        "success": True,
        "resume_filename": file.filename,
        "resume_text": raw_text,
        "jd_text": actual_jd_text,
        "candidate": extract_candidate_info(raw_text),
        "resume_summary": f"Uploaded candidate resume ({len(raw_text.split())} words, {len(resume_skills_flat)} skills identified across {len(resume_skills_categorized)} categories).",
        "compatibility": compatibility,
        "skills_found": resume_skills_categorized,
        "all_skills_flat": resume_skills_flat,
        "jd_skills": jd_skills_categorized,
        "skill_match": {
            "matched": skill_analysis["matched"],
            "partial": skill_analysis["partial"],
            "missing": skill_analysis["missing"]
        },
        "skill_gaps": skill_analysis["gaps"],
        "semantic_evidence": semantic_evidence,
        "ats_analysis": ats_report,
        "interview_questions": interview_questions,
        "role_compatibility": role_compatibility,
        "learning_path": learning_path,
        "vector_chunks": chunks
    }

    return result


# --- WHAT-IF SIMULATION ROUTE ---
@app.post("/api/what-if")
async def what_if_simulation(req: WhatIfRequest):
    augmented_resume = req.resume_text + "\n\nAdditional Skills & Acquired Experience:\n" + ", ".join(req.additional_skills)
    
    chunks = chunk_text(augmented_resume, chunk_words=60, overlap_words=15)
    vector_index = VectorIndex(chunks)

    compatibility = calculate_compatibility(augmented_resume, req.jd_text, vector_index)
    skill_analysis = analyze_skill_gaps(augmented_resume, req.jd_text, vector_index)
    role_compatibility = analyze_role_compatibility(augmented_resume)
    ats_report = analyze_ats(augmented_resume, req.jd_text)

    return {
        "success": True,
        "added_skills": req.additional_skills,
        "updated_compatibility": compatibility,
        "updated_skill_gaps": skill_analysis["gaps"],
        "updated_role_compatibility": role_compatibility,
        "updated_ats_score": ats_report["ats_score"]
    }


# --- INTERACTIVE INTERVIEW EVALUATION ROUTE ---
@app.post("/api/interview/evaluate")
async def evaluate_interview_answer(req: AnswerEvalRequest):
    ans = req.user_answer.strip()

    if len(ans.split()) < 3 or "qwerty" in ans.lower() or "asdf" in ans.lower():
        return {
            "score": 0,
            "feedback": "Answer is irrelevant or too short.",
            "strengths": [],
            "improvements": ["Provide a detailed technical answer demonstrating your experience."]
        }

    try:
        import google.generativeai as genai
        if os.environ.get("GEMINI_API_KEY"):
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""
You are an expert technical interviewer evaluating a candidate's answer.
Question: {req.question_text}
Candidate's Answer: {ans}
Relevant Resume Evidence: {req.resume_evidence or req.resume_text[:2000]}
Expected topics: {req.expected_topics or []}

Evaluate the candidate's answer based on Relevance (0-30), Correctness (0-30), Completeness (0-20), Technical Accuracy (0-10), and Evidence (0-10).
CRITICAL RULES:
- If the answer is irrelevant, nonsense, or does not answer the question, give a score of 0. Do NOT give a positive score just because text was entered.
- Return ONLY a valid JSON object with the following keys exactly: "score" (integer 0-100), "feedback" (string), "strengths" (list of strings), "improvements" (list of strings).
"""
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            if raw_text.startswith("```json"):
                raw_text = raw_text[7:-3].strip()
            elif raw_text.startswith("```"):
                raw_text = raw_text[3:-3].strip()
            eval_data = json.loads(raw_text)
            
            return {
                "score": max(0, min(100, int(eval_data.get("score", 0)))),
                "feedback": eval_data.get("feedback", "No feedback provided."),
                "strengths": eval_data.get("strengths", []),
                "improvements": eval_data.get("improvements", [])
            }
        else:
            raise Exception("No GEMINI_API_KEY found")
    except Exception as e:
        print(f"LLM Eval error: {e}")
        answer_terms = set(__import__("re").findall(r"[a-z][a-z0-9+#.-]{2,}", ans.lower()))
        question_terms = set(__import__("re").findall(r"[a-z][a-z0-9+#.-]{3,}", req.question_text.lower()))
        resume_terms = set(__import__("re").findall(r"[a-z][a-z0-9+#.-]{2,}", (req.resume_evidence or req.resume_text).lower()))
        expected_terms = {topic.lower() for topic in (req.expected_topics or [])}
        relevant_terms = (question_terms | expected_terms) & resume_terms
        covered_terms = answer_terms & relevant_terms
        technical_terms = answer_terms & set(extract_skills(req.resume_text + " " + req.jd_text)[1].__iter__())
        if not covered_terms and not technical_terms:
            return {
                "score": 0,
                "feedback": "The response does not address the resume- or job-specific question.",
                "strengths": [],
                "improvements": ["Answer the question directly and support the explanation with a concrete technical example."]
            }
        coverage = len(covered_terms) / max(1, len(relevant_terms))
        score = min(85, round(35 + coverage * 35 + min(15, len(technical_terms) * 5)))
        return {
            "score": score,
            "feedback": "The response contains terms relevant to the question, but detailed correctness could not be verified without the language model evaluator.",
            "strengths": ["Addressed relevant resume or JD topics."],
            "improvements": ["Add concrete implementation details, decisions, and measurable outcomes."]
        }


# --- RECRUITER MULTI-RESUME ROUTE ---
@app.post("/api/recruiter/analyze")
async def recruiter_analyze(
    files: List[UploadFile] = File(...),
    jd_text: str = Form(...)
):
    global RECRUITER_CANDIDATES_DB
    RECRUITER_CANDIDATES_DB = []

    candidates_summary = []

    for file in files:
        try:
            contents = await file.read()
            text = extract_text_from_bytes(contents, file.filename)
            chunks = chunk_text(text, chunk_words=60, overlap_words=15)
            v_index = VectorIndex(chunks)

            comp = calculate_compatibility(text, jd_text, v_index)
            r_cat_skills, r_skills = extract_skills(text)
            gaps = analyze_skill_gaps(text, jd_text, v_index)
            ats = analyze_ats(text, jd_text)

            candidate_data = {
                "id": f"cand_{len(RECRUITER_CANDIDATES_DB)+1}",
                "name": file.filename.replace(".pdf", "").replace(".docx", "").replace("_", " ").title(),
                "filename": file.filename,
                "score": comp["overall_score"],
                "score_breakdown": comp["breakdown"],
                "skills": r_skills,
                "categorized_skills": r_cat_skills,
                "matched_count": len(gaps["matched"]),
                "missing_count": len(gaps["missing"]),
                "skill_gaps": gaps["gaps"],
                "ats_score": ats["ats_score"],
                "resume_text": text,
                "vector_index": v_index
            }
            
            RECRUITER_CANDIDATES_DB.append(candidate_data)
            
            candidates_summary.append({
                "id": candidate_data["id"],
                "name": candidate_data["name"],
                "filename": candidate_data["filename"],
                "score": candidate_data["score"],
                "score_breakdown": candidate_data["score_breakdown"],
                "skills": candidate_data["skills"],
                "matched_count": candidate_data["matched_count"],
                "missing_count": candidate_data["missing_count"],
                "ats_score": candidate_data["ats_score"]
            })
        except Exception as e:
            print(f"Error processing candidate file {file.filename}: {e}")

    # Rank by compatibility score
    candidates_summary.sort(key=lambda x: x["score"], reverse=True)

    return {
        "success": True,
        "total_candidates": len(candidates_summary),
        "candidates": candidates_summary
    }


# --- RECRUITER COPILOT ROUTE ---
@app.post("/api/recruiter/copilot")
async def recruiter_copilot(req: RecruiterCopilotRequest):
    query = req.query.strip().lower()
    if not RECRUITER_CANDIDATES_DB:
        return {
            "answer": "No candidates uploaded yet. Please upload candidate resumes in Recruiter Mode first.",
            "matches": []
        }

    matches = []
    for cand in RECRUITER_CANDIDATES_DB:
        # Search candidate vector index
        v_res = cand["vector_index"].search(query, top_k=2)
        top_sim = v_res[0]["similarity"] if v_res else 0.0
        
        # Check skill match
        has_direct_skill = any(q_term in [s.lower() for s in cand["skills"]] for q_term in query.split())

        if top_sim > 0.40 or has_direct_skill:
            matches.append({
                "candidate_name": cand["name"],
                "candidate_score": cand["score"],
                "matched_chunk": v_res[0]["text"] if v_res else "Matches direct skill profile",
                "relevance_score": round(max(top_sim, 0.75 if has_direct_skill else 0.4), 2)
            })

    matches.sort(key=lambda x: x["relevance_score"], reverse=True)

    if matches:
        names = ", ".join([m["candidate_name"] for m in matches])
        answer = f"Found {len(matches)} matching candidates for your query ('{req.query}'): {names}."
    else:
        answer = f"No candidate resume directly matched query '{req.query}' in the current database."

    return {
        "answer": answer,
        "matches": matches
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
