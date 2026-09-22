import re
import math
import io
from typing import List, Dict, Any, Tuple

# Try imports for document processing
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None

# Vector embedding & similarity setup
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Optional sentence transformers
try:
    from sentence_transformers import SentenceTransformer
    ST_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
except Exception:
    ST_MODEL = None


# --- TEXT EXTRACTION ---
def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Extract clean text from PDF, DOCX, or TXT file bytes."""
    fname = filename.lower()
    text = ""
    
    if fname.endswith(".pdf"):
        if pypdf:
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
            except Exception as e:
                print(f"PDF extraction warning: {e}")
        if not text:
            # Fallback string decode
            text = file_bytes.decode('utf-8', errors='ignore')
            
    elif fname.endswith(".docx"):
        if docx:
            try:
                doc = docx.Document(io.BytesIO(file_bytes))
                text = "\n".join([p.text for p in doc.paragraphs if p.text])
            except Exception as e:
                print(f"DOCX extraction warning: {e}")
        if not text:
            text = file_bytes.decode('utf-8', errors='ignore')
            
    else:
        # Standard text
        try:
            text = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            text = file_bytes.decode('latin-1', errors='ignore')

    return clean_text(text)


def clean_text(text: str) -> str:
    """Clean text by removing excessive whitespace and invalid control characters."""
    if not text:
        return ""
    # Normalize space
    text = re.sub(r'[\r\n\t]+', ' ', text)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()


# --- CHUNKING ENGINE ---
def chunk_text(text: str, chunk_words: int = 60, overlap_words: int = 15) -> List[Dict[str, Any]]:
    """Split text into overlapping word chunks with chunk ID and character offsets."""
    words = text.split()
    if not words:
        return []
    
    chunks = []
    step = max(1, chunk_words - overlap_words)
    chunk_idx = 0
    
    for i in range(0, len(words), step):
        chunk_words_list = words[i:i + chunk_words]
        chunk_str = " ".join(chunk_words_list)
        if len(chunk_str) > 10:
            chunks.append({
                "id": f"chunk_{chunk_idx}",
                "text": chunk_str,
                "word_count": len(chunk_words_list)
            })
            chunk_idx += 1
        if i + chunk_words >= len(words):
            break
            
    return chunks


# --- VECTOR INDEX & SEARCH ---
class VectorIndex:
    """FAISS / Dense Vector Index supporting semantic search over resume text chunks."""
    def __init__(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        self.texts = [c["text"] for c in chunks]
        self.use_st = (ST_MODEL is not None)
        
        if self.texts:
            if self.use_st:
                self.embeddings = ST_MODEL.encode(self.texts, normalize_embeddings=True)
            else:
                self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
                self.embeddings = self.vectorizer.fit_transform(self.texts).toarray()
        else:
            self.embeddings = np.zeros((0, 1))

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Search top_k most relevant chunks for a query string."""
        if not self.texts or len(self.texts) == 0:
            return []
            
        if self.use_st:
            q_emb = ST_MODEL.encode([query], normalize_embeddings=True)
            sims = np.dot(self.embeddings, q_emb.T).flatten()
        else:
            try:
                q_emb = self.vectorizer.transform([query]).toarray()
                sims = cosine_similarity(self.embeddings, q_emb).flatten()
            except Exception:
                sims = np.zeros(len(self.texts))
                
        top_indices = np.argsort(sims)[::-1][:top_k]
        results = []
        for idx in top_indices:
            score = float(sims[idx])
            # Normalize score to 0..1 scale
            norm_score = max(0.0, min(1.0, (score + 1.0) / 2.0 if self.use_st else score))
            results.append({
                "chunk_id": self.chunks[idx]["id"],
                "text": self.chunks[idx]["text"],
                "similarity": round(norm_score, 3),
                "raw_score": round(score, 3)
            })
        return results


# --- SKILL TAXONOMY & EXTRACTOR ---
SKILL_TAXONOMY = {
    "Programming": [
        "python", "javascript", "typescript", "c++", "c#", "java", "golang", "go", "rust", "ruby", 
        "php", "swift", "kotlin", "r", "matlab", "scala", "dart", "html", "css", "sql", "bash", "shell"
    ],
    "Frameworks": [
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "express", "fastapi", "flask", 
        "django", "spring boot", "spring", "asp.net", "node.js", "node", "tailwind", "bootstrap", "laravel"
    ],
    "Tools & Platforms": [
        "git", "github", "gitlab", "docker", "kubernetes", "aws", "azure", "gcp", "linux", "jira", 
        "confluence", "postman", "vite", "webpack", "npm", "yarn", "terraform", "ansible", "jenkins"
    ],
    "AI / ML & Data": [
        "machine learning", "deep learning", "nlp", "computer vision", "pytorch", "tensorflow", 
        "scikit-learn", "sklearn", "pandas", "numpy", "faiss", "vector database", "llm", "rag", 
        "opencv", "keras", "huggingface", "transformers", "spacy", "data analysis", "data mining", "tableau", "power bi"
    ],
    "Databases": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "elasticsearch", 
        "dynamodb", "snowflake", "oracle", "neo4j", "cassandra"
    ],
    "Soft Skills": [
        "communication", "leadership", "problem solving", "teamwork", "critical thinking", 
        "collaboration", "project management", "agile", "scrum", "adaptability", "time management"
    ]
}

def extract_skills(text: str) -> Dict[str, List[str]]:
    """Extract categorized skills present in text."""
    lower_text = text.lower()
    found_by_category = {}
    all_found = set()

    for category, skills in SKILL_TAXONOMY.items():
        found = []
        for sk in skills:
            # Word boundary search to avoid false substrings
            pattern = r'\b' + re.escape(sk) + r'\b'
            if re.search(pattern, lower_text):
                found.append(sk.capitalize())
                all_found.add(sk.capitalize())
        if found:
            found_by_category[category] = sorted(list(set(found)))

    return found_by_category, sorted(list(all_found))


def extract_jd_requirements(jd_text: str) -> List[Dict[str, Any]]:
    """Extract required skills & qualifications from Job Description."""
    _, all_jd_skills = extract_skills(jd_text)
    
    # Also extract key bullet points/requirements
    lines = [l.strip() for l in jd_text.split('\n') if len(l.strip()) > 15]
    req_bullets = []
    for line in lines:
        if any(w in line.lower() for w in ['require', 'experience', 'ability', 'proficient', 'knowledge', 'must', 'responsible', 'skills']):
            req_bullets.append(line[:120])
            
    if not req_bullets:
        req_bullets = lines[:5]

    requirements = []
    for sk in all_jd_skills:
        requirements.append({
            "skill": sk,
            "type": "Skill",
            "importance": "High" if sk.lower() in ["python", "react", "sql", "aws", "docker", "fastapi", "java"] else "Medium"
        })
        
    for bullet in req_bullets[:5]:
        requirements.append({
            "skill": bullet,
            "type": "Requirement",
            "importance": "High"
        })

    return requirements


# --- 6-FACTOR SCORE CALCULATOR ---
def calculate_compatibility(resume_text: str, jd_text: str, vector_index: VectorIndex) -> Dict[str, Any]:
    """Calculate transparent 6-factor job compatibility score (0-100)."""
    r_cat_skills, r_skills = extract_skills(resume_text)
    j_cat_skills, j_skills = extract_skills(jd_text)
    
    r_skills_set = set([s.lower() for s in r_skills])
    j_skills_set = set([s.lower() for s in j_skills])
    
    # 1. Skill Match (25%)
    if j_skills_set:
        matched = r_skills_set.intersection(j_skills_set)
        skill_score = min(100.0, (len(matched) / len(j_skills_set)) * 100.0)
    else:
        skill_score = 75.0
        
    # 2. Experience Score (20%)
    r_exp_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', resume_text.lower())
    j_exp_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', jd_text.lower())
    r_years = max([int(x) for x in r_exp_matches], default=1)
    j_years = max([int(x) for x in j_exp_matches], default=2)
    exp_score = min(100.0, (r_years / max(1, j_years)) * 100.0)
    
    # 3. Projects Score (15%)
    proj_keywords = ["project", "built", "developed", "created", "designed", "implemented", "deployed", "github"]
    proj_count = sum(1 for kw in proj_keywords if kw in resume_text.lower())
    proj_score = min(100.0, (proj_count / 5.0) * 100.0)
    
    # 4. Education Score (10%)
    edu_keywords = ["bachelor", "master", "phd", "b.tech", "m.tech", "bs", "ms", "computer science", "engineering", "university", "degree"]
    edu_found = sum(1 for ek in edu_keywords if ek in resume_text.lower())
    edu_score = min(100.0, 60.0 + (edu_found * 10.0))
    
    # 5. Semantic Match Score (20%)
    if jd_text and vector_index.texts:
        search_res = vector_index.search(jd_text[:300], top_k=5)
        if search_res:
            avg_sim = sum(item["similarity"] for item in search_res) / len(search_res)
            semantic_score = min(100.0, avg_sim * 100.0)
        else:
            semantic_score = 60.0
    else:
        semantic_score = 60.0

    # 6. JD Coverage Score (10%)
    jd_words = set(re.findall(r'\w{4,}', jd_text.lower()))
    resume_words = set(re.findall(r'\w{4,}', resume_text.lower()))
    if jd_words:
        coverage_score = min(100.0, (len(jd_words.intersection(resume_words)) / len(jd_words)) * 120.0)
    else:
        coverage_score = 70.0

    # Weighted Overall Score
    overall_score = round(
        (skill_score * 0.25) +
        (exp_score * 0.20) +
        (proj_score * 0.15) +
        (edu_score * 0.10) +
        (semantic_score * 0.20) +
        (coverage_score * 0.10),
        1
    )

    return {
        "overall_score": int(round(overall_score)),
        "breakdown": {
            "Skill Match": int(round(skill_score)),
            "Experience": int(round(exp_score)),
            "Projects": int(round(proj_score)),
            "Education": int(round(edu_score)),
            "Semantic Match": int(round(semantic_score)),
            "JD Coverage": int(round(coverage_score))
        }
    }


# --- SKILL MATCH & SKILL GAP ENGINE ---
def analyze_skill_gaps(resume_text: str, jd_text: str, vector_index: VectorIndex) -> Dict[str, Any]:
    """Identify matched, partial, and missing skills with evidence retrieved via vector search."""
    r_cat_skills, r_skills = extract_skills(resume_text)
    j_cat_skills, j_skills = extract_skills(jd_text)
    
    r_skills_lower = {s.lower(): s for s in r_skills}
    j_skills_lower = {s.lower(): s for s in j_skills}
    
    matched_skills = []
    partial_skills = []
    missing_skills = []
    skill_gaps = []

    for sk_lower, sk_name in j_skills_lower.items():
        if sk_lower in r_skills_lower:
            # Semantic search for exact chunk evidence
            ev_chunks = vector_index.search(sk_name, top_k=1)
            evidence_text = ev_chunks[0]["text"] if ev_chunks else f"Candidate profile includes {sk_name}"
            matched_skills.append({
                "skill": sk_name,
                "status": "MATCHED",
                "evidence": evidence_text[:140] + "...",
                "match_type": "Strong"
            })
        else:
            # Check for partial mention via vector similarity search
            ev_chunks = vector_index.search(f"Experience with {sk_name}", top_k=1)
            if ev_chunks and ev_chunks[0]["similarity"] > 0.45:
                partial_skills.append({
                    "skill": sk_name,
                    "status": "PARTIAL",
                    "evidence": ev_chunks[0]["text"][:140] + "...",
                    "match_type": "Moderate"
                })
                skill_gaps.append({
                    "skill": sk_name,
                    "current_evidence": ev_chunks[0]["text"][:100] + "...",
                    "required_level": "Advanced / Production",
                    "improvement_needed": f"Add dedicated project bullet points demonstrating production implementation of {sk_name}."
                })
            else:
                missing_skills.append({
                    "skill": sk_name,
                    "status": "MISSING",
                    "evidence": "No evidence found in resume",
                    "match_type": "None"
                })
                skill_gaps.append({
                    "skill": sk_name,
                    "current_evidence": "No direct evidence found",
                    "required_level": "Intermediate to Advanced",
                    "improvement_needed": f"Acquire practical experience with {sk_name} and add a hands-on project to resume."
                })

    return {
        "matched": matched_skills,
        "partial": partial_skills,
        "missing": missing_skills,
        "gaps": skill_gaps
    }


# --- ATS ANALYSIS ENGINE ---
def analyze_ats(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """Perform comprehensive ATS health check, bullet impact evaluation, and keyword audit."""
    words = re.findall(r'\w+', resume_text)
    word_count = len(words)
    
    # Action verbs check
    action_verbs = [
        "developed", "built", "created", "designed", "implemented", "launched", "managed",
        "led", "engineered", "optimized", "increased", "reduced", "automated", "architected",
        "orchestrated", "deployed", "scaled", "delivered", "transformed", "spearheaded"
    ]
    found_verbs = set([w.lower() for w in words if w.lower() in action_verbs])
    
    # Bullet metrics check (numbers, percentages)
    metric_matches = re.findall(r'\b\d+(?:%|\+|k|m|x)?\b', resume_text.lower())
    
    # Keyword coverage
    r_cat_skills, r_skills = extract_skills(resume_text)
    j_cat_skills, j_skills = extract_skills(jd_text)
    
    j_skills_set = set([s.lower() for s in j_skills])
    r_skills_set = set([s.lower() for s in r_skills])
    kw_coverage = (len(r_skills_set.intersection(j_skills_set)) / max(1, len(j_skills_set))) * 100.0

    ats_score = int(min(100, max(40, (kw_coverage * 0.5) + (len(found_verbs) * 2.5) + (min(word_count, 600) / 10))))
    bullet_impact = int(min(100, (len(metric_matches) * 12) + (len(found_verbs) * 4)))

    strengths = []
    if len(found_verbs) >= 5:
        strengths.append(f"Strong action verb usage ({len(found_verbs)} unique action verbs found).")
    if len(metric_matches) >= 3:
        strengths.append(f"Quantifiable results included ({len(metric_matches)} metrics/percentages detected).")
    if r_skills:
        strengths.append(f"Clear technical skill taxonomy with {len(r_skills)} key skills identified.")

    weak_areas = []
    if len(metric_matches) < 3:
        weak_areas.append("Low metric density: Add measurable outcomes (e.g. 'Improved efficiency by 30%').")
    if len(found_verbs) < 5:
        weak_areas.append("Passive bullet phrasing: Replace passive verbs with high-impact action verbs.")
    if kw_coverage < 60:
        weak_areas.append(f"Missing core JD keywords ({int(100 - kw_coverage)}% keyword gap).")

    suggestions = [
        "Tailor bullet points to directly match the phrasing of requirements in the target Job Description.",
        "Ensure clear section headings (Experience, Projects, Skills, Education) for standard ATS parsing.",
        "Quantify project accomplishments using numerical metrics (%, $, scale, users, speed improvements)."
    ]

    return {
        "ats_score": ats_score,
        "bullet_impact": bullet_impact,
        "keyword_coverage": int(round(kw_coverage)),
        "word_count": word_count,
        "action_verbs_found": sorted(list(found_verbs)),
        "metrics_found": len(metric_matches),
        "strengths": strengths if strengths else ["Basic resume structure is readable."],
        "weak_areas": weak_areas if weak_areas else ["No major structural weaknesses detected."],
        "suggestions": suggestions
    }


# --- TAILORED INTERVIEW GENERATOR ---
def generate_interview_questions(resume_text: str, jd_text: str, gaps: List[Dict[str, Any]], vector_index: VectorIndex) -> List[Dict[str, Any]]:
    """Generate 5 personalized, non-generic interview questions based on candidate profile & JD gaps."""
    r_cat_skills, r_skills = extract_skills(resume_text)
    
    questions = []
    
    # Q1: Project & Architecture Question
    top_proj_chunks = vector_index.search("project built developed architecture", top_k=1)
    proj_context = top_proj_chunks[0]["text"][:120] if top_proj_chunks else "your core technical projects"
    questions.append({
        "id": "q1",
        "category": "Project Architecture & System Design",
        "question": f"In your resume, you mentioned work on: '{proj_context}...'. Can you walk me through the system architecture and key technical trade-offs you made?",
        "context": "Evaluates practical implementation depth and architectural decision-making."
    })
    
    # Q2: Skill Gap / Challenge Question
    if gaps:
        gap_skill = gaps[0]["skill"]
        questions.append({
            "id": "q2",
            "category": "Target Skill Gap & Deep Dive",
            "question": f"The job description strongly emphasizes production experience with {gap_skill}. How would you approach applying {gap_skill} in our environment given your background?",
            "context": f"Probes candidate's adaptability to bridge the identified {gap_skill} gap."
        })
    else:
        questions.append({
            "id": "q2",
            "category": "Technical Mastery",
            "question": "How do you optimize performance and manage scalability challenges in your primary stack?",
            "context": "Tests senior-level optimization capabilities."
        })

    # Q3: Hands-on Problem Solving
    questions.append({
        "id": "q3",
        "category": "Debugging & Troubleshooting",
        "question": "Describe a critical bug or production outage you faced in a recent project. How did you diagnose the root cause and resolve it?",
        "context": "Measures analytical troubleshooting and resilience under pressure."
    })

    # Q4: Domain / JD Requirement
    j_cat_skills, j_skills = extract_skills(jd_text)
    core_jd_sk = j_skills[0] if j_skills else "software engineering best practices"
    questions.append({
        "id": "q4",
        "category": "Job Role Fit",
        "question": f"Our team relies heavily on {core_jd_sk}. What are the top 3 best practices or design patterns you enforce when working with {core_jd_sk}?",
        "context": f"Verifies alignment with key team skill: {core_jd_sk}."
    })

    # Q5: Behavioral & Leadership
    questions.append({
        "id": "q5",
        "category": "Collaboration & Delivery",
        "question": "Tell me about a situation where you had a technical disagreement with a team member or stakeholder regarding project requirements. How did you resolve it?",
        "context": "Assesses communication, teamwork, and conflict resolution skills."
    })

    return questions


# --- CAREER INTELLIGENCE ROLE COMPATIBILITY ---
TARGET_ROLES = {
    "Software Developer": ["python", "javascript", "sql", "git", "html", "css", "c++", "java"],
    "Backend Developer": ["python", "fastapi", "django", "node.js", "postgresql", "docker", "redis", "sql", "rest api"],
    "Data Analyst": ["python", "sql", "pandas", "numpy", "tableau", "power bi", "data analysis", "excel"],
    "Data Scientist": ["python", "r", "scikit-learn", "pandas", "numpy", "machine learning", "statistics", "sql"],
    "ML Engineer": ["python", "pytorch", "tensorflow", "scikit-learn", "docker", "fastapi", "deep learning", "nlp"],
    "AI Engineer": ["python", "pytorch", "transformers", "llm", "rag", "vector database", "faiss", "fastapi", "openai"],
    "DevOps Engineer": ["docker", "kubernetes", "aws", "terraform", "ansible", "linux", "ci/cd", "bash", "git"]
}

def analyze_role_compatibility(resume_text: str) -> List[Dict[str, Any]]:
    """Evaluate compatibility across 7 target tech roles."""
    r_cat_skills, r_skills = extract_skills(resume_text)
    r_skills_lower = set([s.lower() for s in r_skills])

    role_results = []
    for role_name, req_skills in TARGET_ROLES.items():
        matched = [s for s in req_skills if s in r_skills_lower]
        missing = [s for s in req_skills if s not in r_skills_lower]
        
        match_percentage = int(round((len(matched) / len(req_skills)) * 100))
        
        role_results.append({
            "role": role_name,
            "compatibility_score": match_percentage,
            "status": "High Match" if match_percentage >= 70 else ("Moderate Match" if match_percentage >= 40 else "Growth Area"),
            "matched_skills": [m.capitalize() for m in matched],
            "missing_skills": [ms.capitalize() for ms in missing],
            "required_skills": [req.capitalize() for req in req_skills],
            "recommendation": f"Focus on gaining hands-on experience in {', '.join([m.capitalize() for m in missing[:2]])}." if missing else "Strong alignment! Ready for application."
        })

    return sorted(role_results, key=lambda x: x["compatibility_score"], reverse=True)
