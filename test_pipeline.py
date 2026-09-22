import urllib.request
import json
import os

# Post multipart form data to http://localhost:8000/api/analyze
import http.client

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
with open('sample_resume.txt', 'rb') as f:
    file_bytes = f.read()

with open('sample_jd.txt', 'r') as f:
    jd_text = f.read()

body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="sample_resume.txt"\r\n'
    f'Content-Type: text/plain\r\n\r\n'
).encode('utf-8') + file_bytes + (
    f'\r\n--{boundary}\r\n'
    f'Content-Disposition: form-data; name="jd_text"\r\n\r\n'
    f'{jd_text}\r\n'
    f'--{boundary}--\r\n'
).encode('utf-8')

req = urllib.request.Request(
    'http://localhost:8000/api/analyze',
    data=body,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

try:
    with urllib.request.urlopen(req) as resp:
        res_json = json.loads(resp.read().decode('utf-8'))
        print("=== ANALYSIS API RESPONSE SUCCESS ===")
        print("Overall Compatibility Score:", res_json["compatibility"]["overall_score"])
        print("Score Breakdown:", res_json["compatibility"]["breakdown"])
        print("Skills Found:", res_json["all_skills_flat"])
        print("Matched Skills Count:", len(res_json["skill_match"]["matched"]))
        print("Missing Skills Count:", len(res_json["skill_match"]["missing"]))
        print("ATS Health Score:", res_json["ats_analysis"]["ats_score"])
        print("Generated Interview Questions Count:", len(res_json["interview_questions"]))
        print("Role Compatibility Count:", len(res_json["role_compatibility"]))
        print("Semantic Evidence Count:", len(res_json["semantic_evidence"]))
except Exception as e:
    print("API Error:", e)
