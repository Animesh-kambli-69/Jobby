# Jobby — Product Requirements Document (PRD)



## 1. Overview

### 1.1 Product Description

Jobby, branded as JobGraph in the codebase, is an AI-powered job platform that matches candidates with jobs based on their skills, ranks applicants for recruiters, and helps candidates practise interviews using a camera-based AI mock interview system.

**Technology Stack:**
- MongoDB — Database
- Express.js — Backend framework
- React 18 + Vite — Frontend
- Node.js — Runtime environment
- Groq-hosted LLaMA 3.x models — Resume parsing, skill extraction, interview questions, and feedback

This document describes the product as it currently exists in the codebase and defines the requirements for a public v1.0 release. Features marked as Gap are not yet working end to end.

### 1.2 Problem Statement

- Candidates send the same resume to multiple job boards, receive little feedback on their suitability, and rarely hear back.
- Recruiters receive large numbers of unranked applications and spend significant time reviewing unsuitable resumes.
- Both candidates and recruiters lack a shared, objective understanding of job fit. Candidates cannot easily see why a job suits them, while recruiters cannot clearly understand why a candidate ranks where they do.

### 1.3 Product Vision

Build an opportunity graph in which every candidate profile and job is represented through structured skills. The platform calculates and explains compatibility scores in both directions and helps candidates improve their skills through interview practice.

### 1.4 Product Summary

| Area | Functionality | Primary User |
|---|---|---|
| Accounts and roles | Email/password registration and login; candidate and recruiter roles; JWT sessions valid for 7 days | Both |
| Resume intelligence | Upload PDF, DOC, DOCX, or TXT files up to 5 MB, or paste text; AI extracts profile details and calculates a resume score from 0–100 | Candidate |
| Job discovery | Lists active jobs ranked by skill-match percentage | Candidate |
| Applications | One-click applications, one application per job per email, and application-status tracking | Candidate |
| Recruiter dashboard | Analytics, candidate pool, skill and score filters, job postings, ranked applicants, accept/reject actions, and resume downloads | Recruiter |
| AI mock interview | Technical, behavioral, or mixed interviews; three difficulty levels; five resume-based questions; voice answers, live transcript, eye-contact tracking, AI feedback, and Cloudinary video storage | Candidate |

## 2. Goals, Non-Goals, and Success Metrics

### 2.1 Goals

The v1.0 release will be successful if a candidate can register and submit their first application in under 10 minutes, and a recruiter can post a job and obtain a ranked shortlist without manually reviewing every unsuitable resume.

1. **Accurate matching:** Every job displays a match percentage based on actual skill overlap, and the same score is available to recruiters.
2. **Fast profile creation:** One resume upload generates a complete, editable profile containing skills and a resume score.
3. **Recruiter efficiency:** Applicants are ranked by match score, matched skills are visible, and decisions can be made with one click.
4. **Interview readiness:** Candidates can practise interviews tailored to their resumes and track their improvement.
5. **Trust:** Users can access only the data they are authorised to view. Resumes and interview videos remain private by default.

### 2.2 Non-Goals for v1.0

- Payments, paid job promotions, or subscription billing.
- Messaging or chat between recruiters and candidates.
- Live interviews with human interviewers or interview scheduling.
- Native mobile applications; the platform will use a responsive website.
- Multi-recruiter company workspaces with separate roles and permissions.
- Applicant Tracking System (ATS) integrations with Greenhouse, Lever, or Workday.

### 2.3 Success Metrics

| Metric | Definition | v1.0 Target |
|---|---|---|
| Profile completion rate | Candidates with parsed skills ÷ registered candidates | ≥ 70% |
| Time to first application | Median time from sign-up to first application | ≤ 10 min |
| Resume parsing success | Parses returning at least 3 skills ÷ total parses | ≥ 95% |
| Match relevance | Accepted applicants with match ≥ 60% ÷ all accepted applicants | ≥ 75% |
| Applicants per active job | Average applications per active job after 14 days | ≥ 10 |
| Recruiter decision rate | Applications accepted or rejected within 7 days ÷ applications received | ≥ 60% |
| Interview completion | Mock interviews reaching the feedback screen ÷ interviews started | ≥ 65% |
| Interview improvement | Candidates whose third interview score exceeds their first | ≥ 50% |
| API reliability | Successful responses ÷ all requests, excluding 4xx responses | ≥ 99.5% |

These targets are proposed starting points and should be confirmed with the team before launch.

## 3. Target Users and Personas

Jobby supports two user roles stored in the `role` field:

- **Candidate:** The default role.
- **Recruiter:** A user who posts jobs and reviews applicants.

A third operational role, Admin, is needed for v1.0 moderation but has not yet been implemented.

### 3.1 User Personas

| Persona | Profile | Goals | Pain Points | Key Screens |
|---|---|---|---|---|
| Priya — Fresh Graduate | B.Tech CS graduate with 0–1 years of experience; applies to 30+ roles monthly | Find suitable jobs and practise interviews | No feedback on job fit; interview anxiety | Profile, Find Jobs, AI Interview |
| Arjun — Mid-Level Engineer | Four years of React/Node experience; passively looking for opportunities | See high-match jobs and apply quickly | Irrelevant job alerts and lengthy forms | Find Jobs, Job Details, Applications |
| Meera — In-House Recruiter | Hires 5–10 engineers per quarter for one company | Post jobs quickly and obtain a ranked shortlist | Hundreds of unranked resumes per role | Recruiter Overview, Postings, Applicants |
| Rahul — Agency Recruiter | Sources candidates for multiple clients | Search the candidate pool by skills and score | Keyword searches miss skill synonyms | Candidate Pool and Filters |
| Operations Admin — Future Role | Internal team member | Remove spam jobs and fake accounts | No moderation tools | Admin Console, not yet built |

### 3.2 Jobs to Be Done

- When I upload my resume, I want my skills captured correctly so that I do not have to enter them manually.
- When I browse jobs, I want to see how well I match each role so that I can focus on suitable opportunities.
- When I post a job, I want applicants ranked by their suitability so that I can review the strongest matches first.
- Before a real interview, I want to practise questions based on my resume and receive honest feedback.

## 4. Feature Requirements

**Priority definitions:**
- P0: Required for v1.0.
- P1: Should be delivered in v1.0.
- P2: Planned for a later release.

**Status definitions:**
- Built: Implemented.
- Partial: Implemented with known defects or limitations.
- Gap: Not implemented or not working end to end.

### 4.1 Authentication and Accounts

| ID | Requirement | Priority | Status |
|---|---|---|---|
| AUTH-01 | Candidate sign-up requires name, email, and password. Recruiter sign-up also requires company name. | P0 | Built |
| AUTH-02 | Role selection on login and sign-up. Recruiters use `/api/recruiter-auth`; candidates use `/api/auth`. | P0 | Built |
| AUTH-03 | Password must contain at least 8 characters, including uppercase, lowercase, and a digit. Enforce for both roles. | P0 | Partial — recruiter only |
| AUTH-04 | Emails must be trimmed and converted to lowercase on every write and lookup. | P0 | Partial — recruiter only |
| AUTH-05 | JWT sessions last 7 days and are restored after reload through `/me`. | P0 | Built |
| AUTH-06 | Role-based routing: `/candidate`, `/profile`, `/applications`, and `/interview` for candidates; `/recruiter` for recruiters. | P0 | Built |
| AUTH-07 | Forgot/reset password through an email link. | P1 | Gap |
| AUTH-08 | Email verification before applying for jobs or posting jobs. | P1 | Gap |
| AUTH-09 | Logout clears the token, user information, and cached profile. | P0 | Built |

### 4.2 Candidate Profile and Resume Intelligence

| ID | Requirement | Priority | Status |
|---|---|---|---|
| PROF-01 | Upload PDF, DOC, DOCX, or TXT resumes up to 5 MB, or paste resume text. | P0 | Built |
| PROF-02 | Extract text from PDFs using `pdf-parse` and from DOC/DOCX using a proper parser such as `mammoth`. | P0 | Partial — DOCX is read as raw bytes |
| PROF-03 | AI extracts name, email, phone, skills, experience, education, and summary. | P0 | Built |
| PROF-04 | Calculate a resume score from 0–100 using experience (30%), skills (40%), and content completeness (30%). | P0 | Built |
| PROF-05 | Allow candidates to edit extracted skills, experience, and education manually. | P1 | Gap |
| PROF-06 | Support GitHub, LinkedIn, LeetCode, and portfolio links. | P1 | Built |
| PROF-07 | Display the stored resume filename and upload date, with an option to upload again. | P0 | Built |
| PROF-08 | Display suggestions for improving the resume score. | P2 | Gap |

**Resume Score Labels**

| Score | Label |
|---|---|
| 85–100 | Excellent |
| 70–84 | Very Good |
| 55–69 | Good |
| 40–54 | Average |
| Below 40 | Needs Improvement |

### 4.3 Job Discovery

| ID | Requirement | Priority | Status |
|---|---|---|---|
| JOB-01 | List active jobs with title, company, location, salary, posting date, and top four required skills. | P0 | Built |
| JOB-02 | Display each job's match percentage for the signed-in candidate and sort jobs by match. | P0 | Partial — scoring algorithm defect |
| JOB-03 | Search jobs by title, company, and description. | P0 | Gap — UI sends query, but API ignores it |
| JOB-04 | Filter jobs by location, job type, salary range, and experience. | P1 | Gap — UI only |
| JOB-05 | Provide a job details page with description, required skills, and matched versus missing skills. | P0 | Partial — matched/missing skill split is absent |
| JOB-06 | Support pagination or infinite scrolling beyond 20 jobs. | P1 | Gap |

### 4.4 Applications

| ID | Requirement | Priority | Status |
|---|---|---|---|
| APP-01 | Block applications until the profile contains name, email, resume, and at least one skill. Redirect to Profile with a message. | P0 | Built |
| APP-02 | Allow only one application per candidate per job using a unique index. | P0 | Built |
| APP-03 | Store the match score on the application when the candidate applies. | P0 | Built |
| APP-04 | Obtain applicant identity from the authenticated session, not the request body. | P0 | Gap |
| APP-05 | Show all candidate applications with job, date, status, match score, filtering, and search. | P0 | Partial — status names mismatch |
| APP-06 | Display application counters for applied, accepted, rejected, and pending. | P0 | Built |
| APP-07 | Allow candidates to withdraw an application while it is pending. | P2 | Gap |
| APP-08 | Send email notifications when application status changes. | P1 | Gap |

### 4.5 Recruiter Workspace

| ID | Requirement | Priority | Status |
|---|---|---|---|
| REC-01 | Overview showing total, active, and closed jobs; applications by status; unique candidates; top five required skills; and score distribution. | P0 | Built |
| REC-02 | Allow job creation with title, description, company, location, salary, and comma-separated skills. Company defaults to the recruiter's company. | P0 | Built |
| REC-03 | Assign each job to its posting recruiter through `recruiterId` and require recruiter authentication for creation. | P0 | Gap |
| REC-04 | Allow recruiters to edit, close, and reopen jobs. | P0 | Gap |
| REC-05 | Display applicants for each job, sorted by match score, with skills, contact details, and resume download. | P0 | Built |
| REC-06 | Allow recruiters to accept or reject applications and make the updated status visible to candidates. | P0 | Built |
| REC-07 | Mark an application as reviewed when it is opened. | P1 | Gap |
| REC-08 | Filter the candidate pool by minimum/maximum resume score and skills; sort by score or name. | P1 | Built |
| REC-09 | Let recruiters view interview recordings only for candidates who applied to their jobs and consented. | P1 | Gap — all recordings are visible to any recruiter |

### 4.6 AI Mock Interview

| ID | Requirement | Priority | Status |
|---|---|---|---|
| INT-01 | Allow selection of technical, behavioral, or mixed interview types and entry, mid, or senior difficulty levels. | P0 | Built |
| INT-02 | Generate five unique questions based on the candidate's resume, with a fallback question bank if AI fails. | P0 | Built |
| INT-03 | Support voice answers with the camera on and live transcription through browser speech recognition. | P0 | Built — Chrome/Edge only |
| INT-04 | Measure eye-contact percentage using MediaPipe Face Landmarker in a Web Worker. | P1 | Built |
| INT-05 | Store per-answer score, confidence, and feedback in `InterviewAnalysis`. | P0 | Built |
| INT-06 | Generate a final report with overall score, 3–5 strengths, improvements, and tips. | P0 | Built |
| INT-07 | Upload videos to Cloudinary, with a maximum size of 200 MB, and list them under “My Recordings.” | P1 | Partial — recording list UI is absent |
| INT-08 | Maintain interview history with score trends. | P1 | Gap |
| INT-09 | Obtain explicit consent before camera, microphone, and recording access; allow candidates to delete their recordings. | P0 | Gap |

### 4.7 Platform Requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| PLT-01 | Provide a marketing landing page explaining the opportunity graph and platform features. | P0 | Built |
| PLT-02 | Support responsive layouts at 768 px and 968 px breakpoints. | P0 | Built |
| PLT-03 | Provide an admin console to suspend users and remove jobs. | P2 | Gap |
| PLT-04 | Provide the API health endpoint `/api/health`. | P0 | Built |

## 5. User Stories and Acceptance Criteria

### 5.1 Candidate User Stories

**US-01 — Sign Up as a Candidate**  
Related requirements: AUTH-01, AUTH-03

- Given I am on `/signup` with the Candidate role selected, when I submit a valid name, email, and password meeting the password rules, an account is created, I am logged in, and I am redirected to `/candidate`.
- Given the email already exists, I see “User already exists with this email,” and no account is created.
- Given the password and confirmation password do not match, the form does not submit.

**US-02 — Build My Profile from a Resume**  
Related requirements: PROF-01 to PROF-04

- Given I upload a two-page PDF under 5 MB, my profile displays extracted skills, experience, education, summary, and a resume score with its label within 15 seconds.
- Given I upload a file other than PDF, DOC, DOCX, or TXT, I see “Invalid file type,” and nothing is saved.
- Given AI parsing fails, my resume is still saved, I see a retry message, and my previous skills are not erased.

**US-03 — See Jobs Ranked by Fit**  
Related requirements: JOB-01, JOB-02

- Given my profile contains skills, the Find Jobs list is sorted by match percentage in descending order, and each job card displays a match indicator: green for 70% or above, amber for 40–69%, and grey for below 40%.
- Given my profile has no skills, jobs appear newest first without match indicators, along with a prompt to upload a resume.

**US-04 — Search Jobs**  
Related requirement: JOB-03

- Given I enter “react” and search, only jobs whose title, company, description, or skills contain “react” are displayed.
- Search must be case-insensitive, and results must remain ranked by match score.

**US-05 — Apply to a Job**  
Related requirements: APP-01 to APP-04

- Given my profile is complete, clicking Apply Now creates one application, and the button changes to “Application Submitted!”
- Given my resume or skills are missing, I am redirected to `/profile` with a message identifying the missing field, and that field is highlighted.
- Given I have already applied, I see “You have already applied for this job,” and the API returns HTTP 409.
- The application is linked to my account ID. Changing the request body must not allow me to apply using another person's email.

**US-06 — Track My Applications**  
Related requirements: APP-05, APP-06

- The Applications page displays Total, Pending, Reviewed, Accepted, and Rejected counts using the backend's status values.
- The status filter tabs must use the same values as the backend.
- Search filters applications by job title or company as I type.

**US-07 — Practise an Interview**  
Related requirements: INT-01 to INT-06

- Given I select “Technical” and “Mid Level” and start an interview, I receive five questions one at a time that reference my resume skills or projects.
- I cannot submit an answer until I have recorded it with the camera and microphone enabled.
- After the fifth answer, I receive an overall score out of 100, strengths, improvements, and tips within 20 seconds.
- If the camera or microphone is turned off during an answer, recording stops, and I see an explanation.

### 5.2 Recruiter User Stories

**US-08 — Post a Job**  
Related requirements: REC-02, REC-03

- Given I enter the job title, description, and required skills, the job is saved with my user ID as its owner and my company as the company name.
- The job appears in Job Postings and becomes visible to candidates immediately.
- An unauthenticated user or candidate attempting to create a job receives HTTP 401 or 403.

**US-09 — Review Ranked Applicants**  
Related requirements: REC-05, REC-06

- Given a job has applications, selecting it displays applicants sorted by match score, with name, email, skills, application date, and resume download.
- Clicking Accept or Reject updates the status immediately. The candidate sees the updated status on their next page load.
- A recruiter requesting applicants for a job they do not own receives HTTP 403.

**US-10 — Search the Candidate Pool**  
Related requirement: REC-08

- Given I set the minimum resume score to 60 and enter the skills “node, mongodb,” only candidates with a resume score of at least 60 and at least one of the specified skills are displayed.
- Results are sorted by score.

**US-11 — Close a Job**  
Related requirement: REC-04

- Given I close a job, it disappears from candidate job search.
- Existing applications remain visible to the recruiter.
- New applications for the closed job are rejected with HTTP 400.

## 6. Non-Functional Requirements, Risks, and Release Scope

### 6.1 Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | API read requests must have p95 latency below 500 ms. Resume parsing must complete within 15 seconds. Job search must complete within 2 seconds for 1,000 active jobs. |
| Availability | The API must achieve 99.5% monthly uptime. |
| Security | Passwords must be hashed using bcrypt with a cost factor of at least 10. JWT secrets must come from environment variables and must never use default values. HTTPS is required, CORS must be restricted to the application origin, and authentication and AI endpoints must be rate-limited. |
| Privacy | Resumes and interview videos must be accessible only to their owners and authorised recruiters for jobs to which candidates have applied. Candidates must be able to delete their accounts and data, following the stated DPDP Act 2023 / GDPR-style privacy requirements. |
| Accessibility | Meet WCAG 2.1 AA requirements, including keyboard navigation, visible focus indicators, 4.5:1 text contrast on the dark theme, and captions for interview prompts. |
| Browser support | Support the latest two versions of Chrome, Edge, Firefox, and Safari. The AI interview currently requires Chrome or Edge until a fallback speech engine is available. |
| Scalability | Use a stateless API behind a load balancer. Store files in object storage rather than MongoDB documents. |
| Observability | Maintain structured logs, error tracking, AI call latency measurements, and AI failure counts. |
| AI cost management | Enforce per-user daily limits on AI calls and prevent unauthenticated access to AI endpoints. |

### 6.2 Assumptions

- Groq's free or paid service remains available for `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.
- Candidates create their resumes in English.
- One recruiter account represents one company for v1.0.

### 6.3 Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Match scores appear random to users. | Loss of trust in the platform's core functionality. | Fix vector alignment, display matched and missing skills, and implement skill normalisation. |
| The LLM returns malformed JSON or hallucinated skills. | Incorrect candidate profiles. | Use JSON mode, validate against a schema, and allow users to edit their skills. |
| Groq experiences an outage or rate limit. | Resume parsing and interviews may fail. | Retain existing question fallbacks and add retry with backoff and a parsing queue. |
| Interview video privacy complaints. | Legal exposure and loss of user trust. | Add a consent screen, restrict recruiter access, provide deletion controls, and define a retention limit. |
| Unauthenticated job creation or resume parsing. | Spam jobs and AI cost abuse. | Require authentication and role validation on every write operation and AI route. |
| Web Speech API is unavailable on Safari or Firefox. | Interviews become unusable for some users. | Add a Vosk worker fallback, which already exists in the repository, or allow typed answers. |

### 6.4 Release Scope

| Release | Scope |
|---|---|
| **v1.0 — MVP Launch** | All P0 requirements, including fixes for partial or missing functionality: secured routes, correct matching, working search, aligned application statuses, job editing and closing, consent, and privacy controls. |
| **v1.1** | P1 features: password reset, email verification, notifications, job filters, pagination, interview history, and editable skills. |
| **v2.0** | P2 features: admin console, application withdrawal, resume score improvement tips, and company workspaces. |

### 6.5 Open Questions

1. **Final product name:** Should the platform be called Jobby or JobGraph?
2. **Recruiter access to candidates:** Should recruiters see candidates who have not applied to their jobs, or only candidates who have applied?
3. **Interview recording retention:** How long should interview recordings be stored? The proposed retention period is 90 days.

---

**End of Document**

Note: This PRD reflects the requirements, implementation statuses, and release plans in the supplied source text. The statuses and targets have not been independently verified against the codebase.