import re
import math
import io
from typing import List, Dict, Any, Tuple
import os
from dotenv import load_dotenv

load_dotenv()
try:
    import google.generativeai as genai
    if os.environ.get("GEMINI_API_KEY"):
        genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
except ImportError:
    genai = None

# Try imports for document processing
try:
    # pyrefly: ignore [missing-import]
    import pypdf    
except ImportError:
    pypdf = None

try:
    # pyrefly: ignore [missing-import]
    import docx
except ImportError:
    docx = None

# Vector embedding & similarity setup
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Optional sentence transformers
try:
    # pyrefly: ignore [missing-import]
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
            
    elif fname.endswith((".png", ".jpg", ".jpeg", ".webp")):
        if genai and os.environ.get("GEMINI_API_KEY"):
            try:
                from PIL import Image
                image = Image.open(io.BytesIO(file_bytes))
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content([
                    "Extract all text from this image exactly as it appears. Preserve structure where possible. Do not add any introductory text, just return the text.", 
                    image
                ])
                text = response.text
            except Exception as e:
                print(f"Gemini OCR error: {e}")
                text = ""
        else:
            print("OCR requested but Gemini API key not found or module not installed.")
            text = ""
            
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
    text = text.replace("\r", "\n").replace("\t", " ")
    lines = [re.sub(r" {2,}", " ", line).strip() for line in text.split("\n")]
    return "\n".join(line for line in lines if line)


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


# --- RESUME EVIDENCE HELPERS ---
ACTION_VERB_LIST = {
    "developed", "built", "created", "designed", "implemented", "launched", "managed",
    "led", "engineered", "optimized", "increased", "reduced", "automated", "architected",
    "orchestrated", "deployed", "scaled", "delivered", "transformed", "spearheaded"
}

def _resume_bullets(text: str) -> List[str]:
    return [line.strip(" -•*\t") for line in text.splitlines() if len(line.strip(" -•*\t")) >= 20]

def _project_evidence(text: str) -> List[str]:
    lines = _resume_bullets(text)
    markers = ("project", "built", "developed", "created", "designed", "implemented", "deployed", "github")
    return [line for line in lines if any(marker in line.lower() for marker in markers)]

def _keyword_tokens(text: str) -> set:
    return set(re.findall(r"[a-z][a-z0-9+#.-]{2,}", text.lower()))

def _section_lines(text: str, headings: tuple) -> List[str]:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    active = False
    result = []
    for line in lines:
        normalized = line.lower().strip(" :-")
        if any(heading in normalized for heading in headings):
            active = True
            continue
        if active and re.fullmatch(r"[A-Z][A-Z &/]+", line):
            break
        if active and len(line) >= 12:
            result.append(line.strip(" -•*"))
    return result

def _safe_resume_evidence(value: str, limit: int = 180) -> str:
    value = re.sub(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", "", value)
    value = re.sub(r"(?:https?://|www\.)\S+|github\.com/\S+", "", value, flags=re.I)
    value = re.sub(r"(?:\+?\d[\d ()-]{7,}\d)", "", value)
    return re.sub(r"\s{2,}", " ", value).strip()[:limit]

def extract_candidate_info(text: str) -> Dict[str, Any]:
    email_match = re.search(r"\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b", text)
    phone_match = re.search(r"(?:\+?\d[\d ()-]{7,}\d)", text)
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
    name = first_line if first_line and not re.search(r"@|resume|curriculum vitae|phone|email", first_line, re.I) else None
    age_match = re.search(r"\bage\s*[:\-]?\s*(\d{2})\b", text, re.I)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    role = next((line for line in lines[1:4] if not re.search(r"@|phone|email|linkedin|github", line, re.I)), None)
    education = _section_lines(text, ("education", "academic"))
    certifications = _section_lines(text, ("certification", "certifications"))
    projects = _section_lines(text, ("project", "projects"))
    experience = _section_lines(text, ("experience", "employment", "work history"))
    return {
        "name": name,
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "age": int(age_match.group(1)) if age_match else None,
        "professional_role": role,
        "experience": experience,
        "education": education,
        "certifications": certifications,
        "projects": projects,
        "skills": extract_skills(text)[1]
    }


# --- 5-FACTOR SCORE CALCULATOR ---
def calculate_compatibility(resume_text: str, jd_text: str, vector_index: VectorIndex) -> Dict[str, Any]:
    """Calculate evidence-based compatibility scores from the supplied resume and JD."""
    r_cat_skills, r_skills = extract_skills(resume_text)
    j_cat_skills, j_skills = extract_skills(jd_text)
    
    r_skills_set = set([s.lower() for s in r_skills])
    j_skills_set = set([s.lower() for s in j_skills])
    
    matched = r_skills_set.intersection(j_skills_set)
    skill_score = (len(matched) / len(j_skills_set) * 100.0) if j_skills_set else 0.0
        
    # 2. Experience Score (20%)
    r_exp_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', resume_text.lower())
    j_exp_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)', jd_text.lower())
    r_years = max([int(x) for x in r_exp_matches], default=0)
    j_years = max([int(x) for x in j_exp_matches], default=0)
    exp_score = 100.0 if j_years == 0 and r_years > 0 else (0.0 if j_years == 0 else min(100.0, r_years / j_years * 100.0))
    
    # 3. Projects Score (15%): score only the resume's Projects section.
    project_lines = _section_lines(resume_text, ("project",))
    if not project_lines:
        project_lines = [
            line.strip(" -•*") for line in resume_text.splitlines()
            if re.search(r"\bproject\b", line, re.I) and len(line.strip()) >= 20
        ]
    project_text = " ".join(project_lines)
    project_skills = {skill.lower() for skill in extract_skills(project_text)[1]}
    jd_skill_set = {skill.lower() for skill in j_skills}
    jd_tokens = _keyword_tokens(jd_text)
    project_tokens = _keyword_tokens(project_text)
    project_relevance = len(project_skills & jd_skill_set) / max(1, len(jd_skill_set))
    text_relevance = len(project_tokens & jd_tokens) / max(1, len(jd_tokens))
    contribution_count = sum(bool(re.search(
        r"\b(?:built|created|developed|designed|implemented|deployed|managed|optimized|architected|led)\b",
        line, re.I
    )) for line in project_lines)
    measurable_count = sum(bool(re.search(
        r"\b\d+(?:\.\d+)?\s*(?:%|x|\+|k|m|users?|clients?|requests?|seconds?|hours?)\b",
        line, re.I
    )) for line in project_lines)
    complexity_score = min(100.0, len(project_skills) / max(1, len(jd_skill_set)) * 100.0)
    detail_score = min(100.0, sum(len(line.split()) for line in project_lines) / max(1, len(project_lines)) * 4.0)
    project_count_score = min(100.0, len(project_lines) * 35.0)
    contribution_score = contribution_count / max(1, len(project_lines)) * 100.0
    measurable_score = measurable_count / max(1, len(project_lines)) * 100.0
    relevance_score = min(100.0, project_relevance * 75.0 + text_relevance * 25.0)
    proj_score = round(
        project_count_score * 0.15 + detail_score * 0.15 + relevance_score * 0.30 +
        complexity_score * 0.20 + contribution_score * 0.15 + measurable_score * 0.05
    ) if project_lines else 0
    
    # 4. Education Score (10%)
    edu_keywords = ["bachelor", "master", "phd", "b.tech", "m.tech", "bs", "ms", "computer science", "engineering", "university", "degree"]
    edu_found = sum(1 for ek in edu_keywords if ek in resume_text.lower())
    edu_score = min(100.0, edu_found / max(1, len(edu_keywords)) * 140.0)

    # 6. JD Coverage Score (10%)
    jd_words = set(re.findall(r'\w{4,}', jd_text.lower()))
    resume_words = set(re.findall(r'\w{4,}', resume_text.lower()))
    coverage_score = (len(jd_words.intersection(resume_words)) / len(jd_words) * 100.0) if jd_words else 0.0

    # Weighted Overall Score
    overall_score = round(
        (skill_score * 0.35) + (exp_score * 0.15) + (proj_score * 0.20) +
        (edu_score * 0.10) + (coverage_score * 0.20),
        1
    )

    return {
        "overall_score": int(round(overall_score)),
        "breakdown": {
            "Skill Match": int(round(skill_score)),
            "Experience": int(round(exp_score)),
            "Projects": int(round(proj_score)),
            "Education": int(round(edu_score)),
            "JD Coverage": int(round(coverage_score))
        }
    }


# --- SKILL MATCH & SKILL GAP ENGINE ---
def analyze_skill_gaps(resume_text: str, jd_text: str, vector_index: VectorIndex) -> Dict[str, Any]:
    """Classify JD skills from explicit resume evidence without treating similarity as proof."""
    r_cat_skills, r_skills = extract_skills(resume_text)
    j_cat_skills, j_skills = extract_skills(jd_text)

    r_skills_lower = {s.lower(): s for s in r_skills}
    soft_skills = {skill.lower() for skill in j_cat_skills.get("Soft Skills", [])}
    j_skills_lower = {
        s.lower(): s for s in j_skills
        if s.lower() not in soft_skills or s.lower() in r_skills_lower
    }

    matched_skills = []
    partial_skills = []
    missing_skills = []
    skill_gaps = []

    for sk_lower, sk_name in j_skills_lower.items():
        if sk_lower in r_skills_lower:
            evidence_lines = [
                line.strip(" -•*") for line in resume_text.splitlines()
                if re.search(re.escape(sk_name), line, re.I)
            ]
            evidence_text = evidence_lines[0] if evidence_lines else f"{sk_name} is listed in the uploaded resume."
            implementation_evidence = any(
                not re.search(r"\b(?:skills?|technologies?|tools?|proficien(?:t|cy))\b", line, re.I)
                and (
                    re.search(r"\b(?:built|created|developed|designed|implemented|deployed|managed|optimized|used|worked)\b", line, re.I)
                    or re.search(r"\b\d+(?:%|\+|x|users?|clients?|requests?)\b", line, re.I)
                    or re.search(r"\b(?:project|experience|application|system|api|database|analysis|reporting)\b", line, re.I)
                )
                for line in evidence_lines
            )
            if implementation_evidence:
                matched_skills.append({
                    "skill": sk_name,
                    "status": "MATCHED",
                    "evidence": evidence_text[:140] + ("..." if len(evidence_text) > 140 else ""),
                    "match_type": "Strong"
                })
            else:
                partial_skills.append({
                    "skill": sk_name,
                    "status": "PARTIAL",
                    "evidence": evidence_text[:140] + ("..." if len(evidence_text) > 140 else ""),
                    "match_type": "Moderate"
                })
                skill_gaps.append({
                    "skill": sk_name,
                    "current_evidence": evidence_text[:100],
                    "required_level": "Practical implementation",
                    "improvement_needed": f"Add a concrete responsibility, project, or result demonstrating {sk_name}."
                })
        else:
            missing_skills.append({
                "skill": sk_name,
                "status": "MISSING",
                "evidence": "No explicit evidence found in uploaded resume",
                "match_type": "None"
            })
            skill_gaps.append({
                "skill": sk_name,
                "current_evidence": "No explicit evidence found in uploaded resume",
                "required_level": "Intermediate to Advanced",
                "improvement_needed": f"Add resume evidence demonstrating practical use of {sk_name}."
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

    bullets = _resume_bullets(resume_text)
    bullet_count = len(bullets)
    lower_words = [w.lower() for w in words]
    found_verbs = sorted({word for word in lower_words if word in ACTION_VERB_LIST})
    strong_bullet_count = sum(bool(re.search(r"\b(?:" + "|".join(ACTION_VERB_LIST) + r")\b", bullet, re.I)) for bullet in bullets)
    measurable_bullet_count = sum(bool(re.search(r"\b\d+(?:\.\d+)?\s*(?:%|x|\+|k|m|users?|clients?|seconds?|hours?)?\b", bullet, re.I)) for bullet in bullets)
    technical_bullet_count = sum(bool(extract_skills(bullet)[1]) for bullet in bullets)

    r_cat_skills, r_skills = extract_skills(resume_text)
    j_cat_skills, j_skills = extract_skills(jd_text)
    j_skills_set = set([s.lower() for s in j_skills])
    r_skills_set = set([s.lower() for s in r_skills])
    kw_coverage = (len(r_skills_set.intersection(j_skills_set)) / max(1, len(j_skills_set))) * 100.0

    headings = sum(bool(re.search(r"\b(?:experience|education|projects?|skills?|summary|certifications?)\b", line, re.I)) for line in resume_text.splitlines())
    contact_signals = sum(bool(re.search(pattern, resume_text, re.I)) for pattern in [r"\b[^\s@]+@[^\s@]+\.[^\s@]+\b", r"(?:\+?\d[\d ()-]{7,}\d)"])
    bullet_impact = round((strong_bullet_count / max(1, bullet_count) * 35) + (measurable_bullet_count / max(1, bullet_count) * 30) + (technical_bullet_count / max(1, bullet_count) * 20) + min(15, len(project_lines := _project_evidence(resume_text)) * 3))
    ats_score = round(min(100, kw_coverage * 0.35 + bullet_impact * 0.3 + min(20, headings * 4) + contact_signals * 5 + min(10, word_count / 60)))

    strengths = []
    if strong_bullet_count:
        strengths.append(f"{strong_bullet_count} of {bullet_count} detected bullets begin with strong action language.")
    if measurable_bullet_count:
        strengths.append(f"{measurable_bullet_count} of {bullet_count} detected bullets include measurable results.")
    if r_skills:
        strengths.append(f"Clear technical skill taxonomy with {len(r_skills)} key skills identified.")

    weak_areas = []
    if measurable_bullet_count < max(1, bullet_count // 2):
        weak_areas.append(f"Only {measurable_bullet_count} of {bullet_count} detected bullets include measurable results.")
    if strong_bullet_count < max(1, bullet_count // 2):
        weak_areas.append(f"Only {strong_bullet_count} of {bullet_count} detected bullets use strong action verbs.")
    if kw_coverage < 60:
        weak_areas.append(f"Missing core JD keywords ({int(100 - kw_coverage)}% keyword gap).")
    if headings == 0:
        weak_areas.append("No standard resume section headings were detected.")

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
        "action_verbs_found": found_verbs,
        "metrics_found": measurable_bullet_count,
        "bullet_count": bullet_count,
        "strong_bullet_count": strong_bullet_count,
        "measurable_bullet_count": measurable_bullet_count,
        "strengths": strengths,
        "weak_areas": weak_areas,
        "suggestions": suggestions
    }


# --- TAILORED INTERVIEW GENERATOR ---
def generate_interview_questions(resume_text: str, jd_text: str, gaps: List[Dict[str, Any]], vector_index: VectorIndex) -> List[Dict[str, Any]]:
    """Generate five questions using only concrete evidence extracted from the resume."""
    _, skills = extract_skills(resume_text)
    projects = extract_candidate_info(resume_text)["projects"]
    bullets = _resume_bullets(resume_text)
    evidence = projects or bullets
    if not evidence:
        evidence = [line for line in resume_text.splitlines() if len(line.strip()) >= 20]
    evidence = [_safe_resume_evidence(line) for line in evidence if _safe_resume_evidence(line)]
    if not evidence:
        return []

    primary = evidence[0]
    secondary = evidence[1] if len(evidence) > 1 else primary
    skill = skills[0] if skills else None
    skill_question = (
        f"Your resume lists {skill}. Where did you use {skill}, and what implementation decision did you make with it?"
        if skill else
        f"Your resume states: '{primary}'. What specific implementation decision did you make in this work?"
    )
    return [
        {
            "id": "q1", "category": "Resume Evidence",
            "question": f"Your resume states: '{primary}'. What was your specific contribution, and what did you implement?",
            "context": "Tests the candidate's direct ownership of a claim in the resume.",
            "source": primary, "expected_topics": ["contribution", "implementation", "ownership"]
        },
        {
            "id": "q2", "category": "Technical Skill Application",
            "question": skill_question,
            "context": "Tests practical use of a technology explicitly listed in the resume.",
            "source": skill or primary, "skill": skill, "expected_topics": [skill or "implementation", "technical decision"]
        },
        {
            "id": "q3", "category": "Project Design",
            "question": f"For the resume work described as '{secondary}', how did you design the solution and decide between the technologies you used?",
            "context": "Tests design reasoning tied to a specific resume project or responsibility.",
            "source": secondary, "expected_topics": ["design", "technology choice", "trade-off"]
        },
        {
            "id": "q4", "category": "Problem Solving",
            "question": f"The resume reports: '{primary}'. What was the hardest problem behind this result, how did you investigate it, and how did you verify the outcome?",
            "context": "Tests problem-solving and validation of an actual resume claim.",
            "source": primary, "expected_topics": ["problem", "investigation", "validation", "result"]
        },
        {
            "id": "q5", "category": "Advanced Practical Understanding",
            "question": f"Looking at your resume evidence '{secondary}', what would you improve now and why, given the constraints of that work?",
            "context": "Tests reflection and advanced decision-making about claimed experience.",
            "source": secondary, "expected_topics": ["constraints", "improvement", "decision-making"]
        }
    ]


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
