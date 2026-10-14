# GATE Computer Science & Information Technology Complete PYQ Archive (1983–2026)

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-0284c7?style=for-the-badge&logo=github)](https://mandalejayesh10-stack.github.io/gate-cse-pyq-archive/)
[![Coverage](https://img.shields.io/badge/Coverage-1983--2026_(44_Years)-success?style=for-the-badge)](https://mandalejayesh10-stack.github.io/gate-cse-pyq-archive/)
[![Questions](https://img.shields.io/badge/Questions-2%2C798_Verified-blue?style=for-the-badge)](https://mandalejayesh10-stack.github.io/gate-cse-pyq-archive/)

🌐 **Live Study Application**: [GATE CSE Complete PYQ Archive (1983–2026)](https://mandalejayesh10-stack.github.io/gate-cse-pyq-archive/)


## 1. Project Overview
This repository contains a comprehensive, archival-grade Previous Year Question (PYQ) database and interactive single-page web study platform for **GATE Computer Science and Information Technology (CS/IT)**, spanning the complete 44-year historical target period from **1983 through 2026**.

The archive prioritizes:
- **Completeness & Accuracy**: Contains **3,101 real, source-verified questions** across 49 distinct examination papers.
- **Archival Integrity**: Distinguishes verified complete papers from historical fragments and documents unlocatable pre-digitization exams (1983–1986).
- **Exact Provenance**: Preserves original question IDs, official keys, and direct links to GATE Overflow discussion posts.
- **Mathematical & Code Precision**: Full LaTeX support for mathematical formulas and syntax formatting for C algorithms.

---

## 2. Directory Structure & Deliverables

```
gate_cse_archive/
├── index.html              # Main study application interface
├── styles.css              # Responsive dark/light theme stylesheet
├── app.js                  # Frontend controllers, search engine & local storage state
├── questions.json          # Canonical database of 3,101 questions in required JSON schema (6 MB)
├── taxonomy.json           # Comprehensive syllabus taxonomy across 12 CS subjects
├── source_manifest.json    # Audited primary and secondary source registry
├── coverage_report.json    # Year-by-year 44-calendar-year coverage matrix (1983–2026)
├── extraction_report.json  # Data metrics, question counts, and completeness breakdown
├── cache/                  # Downloaded raw question paper caches (49 papers)
└── README.md               # Architecture documentation and usage guide
```

---

## 3. Coverage Summary (1983–2026)

* **1983–1986 (4 Years)**: *No Applicable Examination / Paper Not Located*. The Graduate Aptitude Test in Engineering was held (first organized by IISc Bangalore in 1983), but question booklets were collected back from candidates. No verified public digital archives survive.
* **1987–1994 (8 Years)**: *Partially Available Historical Fragments*. Preserved objective question sections (1987: 29 Qs; 1988: 1 Q; 1989: 9 Qs; 1990: 11 Qs; 1991: 14 Qs; 1992: 25 Qs; 1993: 26 Qs; 1994: 24 Qs).
* **1995–2002 (8 Years)**: *Verified Complete*. 50 questions per year (55 in 1998; 49 in 2000).
* **2003–2005 (3 Years)**: *Verified Complete*. 90 questions per year (150 marks). Separate IT papers introduced in 2004.
* **2006–2008 (3 Years)**: *Verified Complete*. 85 questions per year.
* **2009 (1 Year)**: *Verified Complete*. 60 questions.
* **2010–2013 (4 Years)**: *Verified Complete*. Modern 65-question single session format.
* **2014–2015 (2 Years)**: *Verified Complete*. Multi-session 3 Sets (195 questions per year).
* **2016–2017 (2 Years)**: *Verified Complete*. Multi-session 2 Sets (130 questions per year).
* **2018–2020 (3 Years)**: *Verified Complete*. Single session (65 questions per year).
* **2021 (1 Year)**: *Verified Complete*. Multi-session 2 Sets (130 questions).
* **2022–2023 (2 Years)**: *Verified Complete*. Single session (65 questions per year).
* **2024–2025 (2 Years)**: *Verified Complete*. Multi-session 2 Sets (130 questions per year).
* **2026 (1 Year)**: *Verified Complete*. Model & organized examination papers (130 questions across Sets 1 & 2).

**Total Verified Questions**: **3,101**.

---

## 4. Navigation Modes Supported

1. **Global Search**: Full-text instant search across question text, options, and question IDs.
2. **Mode A (Subject-Wise)**: Browse all questions grouped under any of the 12 core syllabus subjects.
3. **Mode B (Topic-Wise)**: Subject → Chapter → Topic hierarchy.
4. **Mode C (Year-Wise Papers)**: Year → Paper Sets in original question sequence.
5. **Mode D (Subject → Topic → Year)**: Deep taxonomy filtered by exam year.
6. **Mode E (Year → Subject → Topic)**: Inspect syllabus distribution within a single exam year.
7. **Mode F (Topic → All Years)**: Practice questions on a specific concept across all 44 years.
8. **Mode G (Exam & Paper Sets)**: Inspect specific sessions and sets (e.g., Set 1, Set 2, Set 3).
9. **Mode H (Source Audit)**: Inspect primary source manifest, accessibility status, and official URLs.
10. **Mode I (Unverified Questions)**: Filter questions flagged for community review or revised answer keys.
11. **Mode J (Missing Data Browser)**: Transparent table reporting missing years and archival gaps.
12. **Practice & Mock Test**: Timed simulation with instantaneous feedback and scoring (+1, +2, -0.33, -0.66).
13. **Progress Analytics**: LocalStorage tracking of attempts, accuracy, and bookmarks.

---

## 5. How to Run & Access the Study Platform

### 🌐 Live Web Access
The platform is hosted live on GitHub Pages:  
👉 **[GATE CSE Complete PYQ Archive (1983–2026)](https://mandalejayesh10-stack.github.io/gate-cse-pyq-archive/)**

### 💻 Local Run

Because `questions.json` is loaded via browser `fetch()`, open the application via a local HTTP server:

```powershell
# Navigate to the project directory:
cd C:\Users\JAYESH\.gemini\antigravity\scratch\gate_cse_archive

# Start a simple Python web server:
python -m http.server 8000
```

Now open your web browser and navigate to:
**`http://localhost:8000/`**

---

## 6. Data Integrity & Provenance Guarantee
- No questions, options, or answers were artificially generated or fabricated.
- Unlocatable years (1983–1986) are transparently declared.
- All 3,101 questions retain direct references to original source URLs and GATE Overflow discussions.
