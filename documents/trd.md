# Jobby — Technical Requirements Document (TRD)



Jobby is a React 18 single-page application that communicates with a stateless Express 4 REST API backed by MongoDB. It uses Groq LLaMA models for AI features and Cloudinary for interview video storage. This document describes the technical implementation and the changes required before v1.0.

---

# 1. Architecture

## 1.1 System Architecture

Jobby uses a three-tier architecture consisting of the frontend, backend API, and data/storage services.

The browser performs camera, speech, and face processing locally. It sends only text, numerical results, and completed interview videos to the API.

The API maintains no session state, allowing it to scale horizontally behind a load balancer. Persistent state is stored in MongoDB and Cloudinary.

## 1.2 Request Lifecycle

1. The single-page application attaches `Authorization: Bearer <token>` using the Axios interceptor in `services/api.js`. The token is currently stored in `localStorage`.
2. Express applies CORS, JSON body parsing, and the route's middleware chain: `authMiddleware → requireRole([...]) → optional multer upload`.
3. The controller validates input and calls the relevant services, AI functions, scoring and matching logic, and Mongoose models.
4. Responses follow the `{ success, ...data }` format. Errors are passed to `errorMiddleware`, which returns an error message and, outside production, the stack trace.

## 1.3 Architectural Decisions

| Area | Decision | Reason |
|---|---|---|
| Rendering | Client-side SPA | Suitable for interactive dashboards and media; SEO is mainly needed for the landing page. |
| API | REST over JSON | Simple CRUD operations and easy testing with Supertest. |
| Database | MongoDB document model | Flexible parsed-resume structure and natural support for skill arrays. |
| AI provider | Groq (LLaMA 3.x) | Low latency for interactive interview feedback. |
| Media processing | In-browser MediaPipe and Web Speech API | Video frames stay on the device, with no server-side GPU requirement for face analysis. |
| File storage | Cloudinary for video; move resumes to object storage | Keeps database documents smaller and supports CDN delivery. |

---

# 2. Technology Stack and Configuration

## 2.1 Technology Stack

| Layer | Technology | Version in Repository | Purpose |
|---|---|---|---|
| Frontend framework | React and React DOM | `^18.2.0` | Single-page application UI |
| Build tool | Vite and `@vitejs/plugin-react` | `^5.0.8` | Development server on port 3000 and production builds |
| Routing | `react-router-dom` | `^6.20.1` | Client routes and role-based guards |
| HTTP client | Axios | `^1.6.2` | API requests with JWT interceptor |
| Icons | `lucide-react` | `^0.294.0` | UI icons |
| Computer vision | `@mediapipe/tasks-vision` | `^0.10.33` | Face landmarks for eye-contact analysis in a Web Worker |
| Speech | Web Speech API and `vosk-browser` | `^0.0.8` for Vosk | Live transcript of spoken answers; Vosk worker exists but is currently unused |
| Styling | Vanilla CSS, custom properties, Manrope font | — | “Cognitive Curator” dark theme |
| Runtime | Node.js with ES modules | `≥ 18` | API server |
| API framework | Express | `^4.18.2` | REST routes and middleware |
| Database | MongoDB and Mongoose | Mongoose `^8.0.3` | Persistence, schemas, and indexes |
| Authentication | `jsonwebtoken` and `bcryptjs` | `^9.0.2`, `^2.4.3` | JWT sessions and password hashing |
| Uploads | Multer with memory storage | `^1.4.5-lts.1` | Resume uploads up to 5 MB and video uploads up to 200 MB |
| PDF parsing | `pdf-parse` | `^2.4.5` | PDF text extraction |
| AI | `groq-sdk` and Groq REST API via `fetch` | `^0.3.2` for SDK | LLaMA 3.3 70B Versatile and LLaMA 3.1 8B Instant |
| Media storage | Cloudinary | `^2.9.0` | Interview video upload and delivery |
| Development tooling | Nodemon | `^3.0.2` | Automatic server reload |

## 2.2 Repository Layout

```text
Jobby/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── auth
│   │   ├── recruiterAuth
│   │   ├── job
│   │   ├── profile
│   │   ├── application
│   │   └── interview
│   ├── middleware/
│   │   ├── authMiddleware
│   │   ├── uploadMiddleware
│   │   └── errorMiddleware
│   ├── models/
│   │   ├── User
│   │   ├── Job
│   │   ├── Application
│   │   ├── InterviewAnalysis
│   │   └── InterviewRecording
│   ├── routes/
│   ├── services/
│   │   ├── groqService.js
│   │   ├── matchingService.js
│   │   └── scoringService.js
│   ├── utils/
│   │   ├── cosineSimilarity
│   │   └── formatters
│   ├── scripts/
│   │   ├── initDatabase.js
│   │   └── smokeTest.js
│   └── seed.js
└── frontend/
    ├── public/
    │   └── workers/
    │       ├── faceWorker.js
    │       ├── voskWorker.js
    │       └── audioProcessor.js
    └── src/
        ├── context/
        │   └── AuthContext
        ├── services/
        │   └── api.js
        ├── pages/
        │   ├── Landing
        │   ├── Login
        │   ├── Signup
        │   ├── CandidateDashboard
        │   ├── JobDetails
        │   ├── Profile
        │   ├── Applications
        │   ├── Interview
        │   └── RecruiterDashboard
        └── components/
            ├── Navbar
            ├── JobCard
            ├── ApplicationCard
            ├── SearchBar
            ├── Loader
            └── UploadedCandidateCard
```

## 2.3 Backend Environment Variables

| Variable | Required | Default in Code | Notes |
|---|---|---|---|
| `PORT` | No | `5000` | API port |
| `MONGODB_URI` or `MONGO_URI` | Yes in production | `mongodb://127.0.0.1:27017/jobgraph` | Use a MongoDB Atlas SRV connection string in production. |
| `MONGODB_DB_NAME` | No | `jobgraph` | Used only when the URI is absent. |
| `GROQ_API_KEY` | Yes | None | Without it, parsing returns empty profiles and interviews use fallback questions. |
| `JWT_SECRET` | Yes | Currently has an insecure default | Remove the default. The application must refuse to start without a valid secret. It is currently missing from `.env.example`. |
| `CLOUDINARY_CLOUD_NAME` | Required for video | None | Required for Cloudinary integration. |
| `CLOUDINARY_API_KEY` | Required for video | None | Required for Cloudinary integration. |
| `CLOUDINARY_API_SECRET` | Required for video | None | Required for Cloudinary integration. |
| `NODE_ENV` | Yes in production | None | Controls production behavior, including stack-trace visibility. |
| `CORS_ORIGIN` | New | None | Defines the allowed frontend origin or origins. |

## 2.4 Frontend Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Replaces the hard-coded `http://localhost:5000/api` in `api.js`, `AuthContext.jsx`, and `Applications.jsx`. |
| `VITE_VOSK_MODEL_URL` | Optional self-hosted speech model for fallback speech recognition. |

---

# 3. API Specification

The base URL is `/api`.

All request bodies are JSON unless explicitly marked as multipart. Every response contains `success: boolean`; error responses also contain `message`.

Authentication uses:

```http
Authorization: Bearer <JWT>
```

The JWT payload contains `{ userId, email, role }` and expires after seven days.

## 3.1 Current Endpoints

### Health and Authentication

| Method | Endpoint | Authentication | Request | Response |
|---|---|---|---|---|
| GET | `/health` | None | — | `{ status: 'ok' }` |
| POST | `/auth/register` | None | `{ name, email, password, role?, company? }` | `201 { token, user }`; `400` if email exists |
| POST | `/auth/login` | None | `{ email, password }` | `{ token, user }`, including skills, resume score, and links; `401` for invalid credentials |
| GET | `/auth/me` | JWT | — | User without password or file bytes |
| PUT | `/auth/profile` | JWT | Multipart resume file or `resumeText`, `profileLinks` as JSON string, `name`, `phone`, and `reparse?` | Updated user with parsed skills, embedding, and resume score |
| GET | `/auth/candidates` | JWT, recruiter | Query parameters: `minScore`, `maxScore`, `skills` (CSV), and `sortBy` (`score-desc`, `score-asc`, `name`) | `{ count, candidates }` |
| GET | `/auth/candidates/:candidateId/resume` | JWT, recruiter | — | Binary file with `Content-Disposition: attachment` |
| POST | `/recruiter-auth/register` | None | `{ name, email, password, company }` | `201 { token, user }`; strong password required |
| POST | `/recruiter-auth/login` | None | `{ email, password }` | `{ token, user }`; `403` if not a recruiter |
| GET | `/recruiter-auth/me` | JWT, recruiter | — | `{ user, profileCompleteness }` |
| GET | `/recruiter-auth/summary` | JWT, recruiter | — | Summary of total, active, and closed jobs; applications by status; unique candidates; applications by job; and top five required skills |

### Jobs

| Method | Endpoint | Authentication | Request | Response |
|---|---|---|---|---|
| POST | `/jobs/create` | None currently | `{ title, description, company?, location?, salary?, requiredSkills[] }` | `201 { job }` |
| POST | `/jobs/search` | None | `{ query, candidateSkills[] }` | `{ jobs[] }` with match scores, sorted descending |
| GET | `/jobs/all` | None | — | Active jobs, newest first |
| GET | `/jobs/:id` | None | — | `{ job }`; `404` if not found |

**Required change:** Job creation must be restricted to authenticated recruiters. See Section 3.2.

### Resume Parsing and Applications

| Method | Endpoint | Authentication | Request | Response |
|---|---|---|---|---|
| POST | `/profile/parse-resume` | None currently | Multipart resume or `{ resumeText }` | `{ profile, meta }`; profile is not saved |
| POST | `/applications/apply` | JWT, candidate | `{ jobId, candidateName, candidateEmail, candidateSkills[], resume }` | `201 { application }`; `409` for duplicates |
| GET | `/applications/my` | JWT, candidate | — | `{ count, applications[] }`, including job details |
| GET | `/applications/my/summary` | JWT, candidate | — | `{ summary: { applied, accepted, rejected, pending } }` |
| GET | `/applications/job/:jobId` | JWT, recruiter who owns the job | — | Applications sorted by match score and enriched with candidate IDs and resume names |
| PATCH | `/applications/:id/status` | JWT, recruiter who owns the job | `{ status: 'accepted' or 'rejected' }` | `{ application }` |

### Mock Interviews and Recordings

| Method | Endpoint | Authentication | Request | Response |
|---|---|---|---|---|
| GET | `/interview/questions` | JWT, candidate | Query: `interviewType`, `difficulty` | `{ source: 'groq' or 'fallback', questions[5] }` |
| POST | `/interview/analyze` | JWT, candidate | `{ transcript, eye_contact_percentage, duration }` | Analysis containing score, confidence, eye contact, feedback, and saved ID |
| POST | `/interview/performance` | JWT, candidate | `{ interviewType, difficulty, qaPairs[], metrics[], totalDurationSeconds }` | Performance containing overall score, strengths, improvements, and tips |
| POST | `/interview/recordings` | JWT, candidate | Multipart video (`webm`, `mp4`, `ogg`, or `mov`, up to 200 MB), `interviewType`, `duration` | `201 { recording }` |
| GET | `/interview/recordings/me` | JWT, candidate | — | `{ recordings }` |
| GET | `/interview/recordings` | JWT, recruiter | Query: `interviewType`, `userId`, `fromDate`, `toDate`, `page`, `limit` (maximum 100) | `{ page, limit, total, recordings }` |

## 3.2 Required Changes for v1.0

| Change | Required Implementation |
|---|---|
| Secure job creation | Replace `POST /jobs/create` with `POST /jobs`, protected by `authMiddleware` and `requireRole(['recruiter'])`. Set `recruiterId = req.userId` and derive the company from the authenticated recruiter's profile. |
| Add job management | Add `PATCH /jobs/:id` for editing, `PATCH /jobs/:id/status` for activating or closing jobs, and `GET /jobs/mine` for the recruiter's own postings. |
| Implement real job search | Add `GET /jobs?q=&location=&page=&limit=` using a MongoDB text index on title, description, company, and required skills. Add match scores when a candidate token is present. |
| Secure resume parsing | Protect `POST /profile/parse-resume` with JWT authentication and rate limiting, or remove it because profile updates already parse resumes. |
| Trust the authenticated session when applying | Change `POST /applications/apply` to accept only `{ jobId }`. Load the candidate using `req.userId` and store the candidate ID on the application. |
| Add reviewed status | Allow `PATCH /applications/:id/status` to accept `reviewed`. Automatically mark an application as reviewed when the recruiter opens it. |
| Restrict recording access | `GET /interview/recordings` must return only candidates who applied to the recruiter's jobs and have `shareRecordings = true`. |
| Support data deletion | Add `DELETE /interview/recordings/:id`, including Cloudinary deletion, and `DELETE /auth/me`. |
| Add password reset | Add `POST /auth/forgot-password` and `POST /auth/reset-password`, using a single-use token valid for 30 minutes. |
| Unify authentication | Merge the separate candidate and recruiter authentication implementations into a consistent authentication system. |
| Add pagination | Add `page` and `limit` to jobs, candidates, and applications. Default limit: 20; maximum: 100. |
| Standardize errors | Use `{ success: false, message, code }` with stable codes such as `DUPLICATE_APPLICATION`. |

---

# 4. AI and Matching Pipeline

Four AI features share one Groq account:

1. Resume parsing
2. Skill keyword extraction for matching
3. Interview question generation
4. Interview evaluation

Every AI call must have a deterministic fallback so that the product continues working when Groq is slow or unavailable.

## 4.1 Model Usage

| Feature | Model | Temperature | Maximum Tokens | Output Contract | Current Fallback |
|---|---|---:|---:|---|---|
| Resume parsing (`parseResumeWithAI`) | LLaMA 3.3 70B Versatile | 0.1 | 2,048 | JSON containing name, email, phone, skills, experience, education, and summary | Empty profile with unknown name and no skills |
| Keyword extraction (`generateEmbedding`) | LLaMA 3.1 8B Instant | 0 | 300 | Up to 25 comma-separated keywords | Vector containing 768 zeros |
| Skill extraction (`extractSkillsFromFile`, currently unused) | LLaMA 3.1 8B Instant | 0.1 | 500 | JSON array of strings | Empty array |
| Interview questions | LLaMA 3.3 70B Versatile, JSON response mode | 0.3 | 1,200 | `{ questions[5] }` | Five deduplicated questions per interview type from a fixed question bank |
| Per-answer analysis | LLaMA 3.3 70B Versatile, JSON mode | 0.2 | Default | Score from 0–100, confidence from 0–1, eye-contact assessment, and feedback | Score derived from eye-contact percentage; confidence of `0.35` |
| Overall performance | LLaMA 3.3 70B Versatile, JSON mode | 0.2 | 1,200 | Overall score, strengths, improvements, and tips | Average per-answer score, or 70, with generic lists |

## 4.2 Resume Ingestion

The resume ingestion process must follow these steps:

1. **Receive the file:** Multer stores the upload in memory. The maximum file size is 5 MB. Supported formats are PDF, DOC, DOCX, and TXT.
2. **Extract text:**
    - PDF: use `pdf-parse`, supporting both its v1 function and v2 `PDFParse` class.
    - TXT: read using UTF-8.
    - DOC/DOCX: the current implementation reads these files as UTF-8 bytes, producing unusable text. For v1.0, use `mammoth` for DOCX and reject or convert legacy DOC files.
3. **Limit input size:** Truncate extracted text to approximately 12,000 characters before sending it to the AI model.
4. **Parse the AI response:** The current implementation strips code fences, extracts the first JSON object using a regular expression, and calls `JSON.parse`. For v1.0, use JSON response mode and validate the result with a schema such as Zod. Invalid fields should be dropped rather than causing the entire parse to fail.
5. **Normalize skills:** Trim whitespace, remove case-insensitive duplicates, and map aliases to canonical names. For example, `nodejs` and `node js` become `Node.js`, while `reactjs` becomes `React`.
6. **Calculate and save:** Compute the resume score and skill vector, then save the parsed profile to the user.

## 4.3 Resume Scoring

The resume score is calculated as:

\[
\text{resumeScore} =
\operatorname{round}\left(
\min(100,\;0.3E+0.4S+0.3C)
\right)
\]

Where:

- \(E\) = experience score
- \(S\) = skills score
- \(C\) = content completeness score

### Experience Score (E: 0–100)

For stated years of experience:

| Experience | Score |
|---|---:|
| 10 years or more | 100 |
| 7–9 years | 90 |
| 5–6 years | 80 |
| 3–4 years | 70 |
| 2–3 years | 60 |
| 1–2 years | 50 |
| Less than 1 year | 40 |

Role-keyword scores:

| Keywords | Score |
|---|---:|
| Senior, lead, principal | 90 |
| Mid-level | 70 |
| Junior, entry-level | 50 |
| Fresher, graduate | 40 |
| Otherwise | 30 |

### Skills Score (S: 0–100)

The skills score combines:

- Points based on the number of listed skills, ranging from 10 for fewer than five skills to 40 for 20 or more skills.
- Hard-skill points based on a predefined list of 55 skills, ranging from 15 for fewer than three matching hard skills to 60 for ten or more.

### Content Score (C: 0–100)

| Content Item | Points |
|---|---:|
| Name | 15 |
| Valid email | 15 |
| Phone | 10 |
| Education | 20 |
| Master's degree, PhD, or MBA | Additional 10 |
| Bachelor's degree | Additional 5 |
| Summary longer than 50 characters | 20 |
| Summary longer than 200 characters | Additional 10 |
| At least one skill | 10 |

## 4.4 Job Matching

### Current Algorithm

The current `generateEmbedding(text)` function asks the LLaMA 3.1 8B model for up to 25 keywords. It then builds a 768-slot vector in which each slot contains the count of a keyword divided by 10, capped at 1, and applies L2 normalization.

The keyword list combines the AI-generated keywords with approximately 120 common skills. The match score is calculated as:

\[
\text{matchScore}=\text{cosine similarity}\times100
\]

### Current Defect

The AI generates different keywords for different texts. Consequently, slot \(i\) may represent one skill in the candidate vector and another skill in the job vector.

Cosine similarity then compares unrelated dimensions, making match scores unreliable. The process also requires two AI calls per application and one AI call per search.

### Required v1.0 Algorithm

Use deterministic, explainable skill matching.

1. Canonicalize candidate and job skill lists using the alias map from Section 4.2.
2. Calculate the matched and missing skills:

    - `matched = jobSkills ∩ candidateSkills`
    - `missing = jobSkills − candidateSkills`

3. Calculate skill coverage:

\[
\text{matchScore} =
\operatorname{round}\left(
100\times\frac{|\text{matched}|}{|\text{jobSkills}|}
\right)
\]

4. Return `{ matchScore, matchedSkills, missingSkills }` with every job and store these values on the application.
5. In v1.1, optionally combine coverage with semantic similarity from a real embedding model. Store profile and job vectors once and use MongoDB Atlas Vector Search:

\[
\text{finalScore}=0.7(\text{coverage})+0.3(\text{semantic similarity})
\]

## 4.5 Mock Interview Pipeline

| Step | Location | Implementation |
|---|---|---|
| Capture | Browser main thread | Use `getUserMedia({ audio, video })`. Stop recording if a media track ends. |
| Transcript | Browser main thread | Use `window.SpeechRecognition` or `webkitSpeechRecognition` with continuous recognition and interim results. |
| Eye-contact analysis | `faceWorker.js` Web Worker | MediaPipe Face Landmarker identifies face landmarks. A frame counts as centered when the iris center lies within 35–65% horizontally and 25–75% vertically of the eye box. Calculate eye contact as centered frames divided by total frames. |
| Video recording | `MediaRecorder` | Prefer WebM codecs. Upload the video to `/interview/recordings` after recording stops, without blocking the interview flow. |
| Per-answer analysis | API | Call `/interview/analyze` and save an `InterviewAnalysis` record. |
| Final analysis | API | Call `/interview/performance` after the fifth question. |
| Offline speech fallback (v1.1) | `voskWorker.js` and `audioProcessor.js` | Use the small English Vosk model for Firefox and Safari fallback support. |

## 4.6 AI Guardrails

- All AI routes must require JWT authentication.
- Apply configurable per-user limits of 20 resume parses and 10 interviews per day.
- Set a 20-second timeout for each Groq call.
- Retry once with exponential backoff after HTTP 429 or 5xx errors.
- Never log complete resume text in production. Log text length and model latency instead.
- Pass resume text as data inside a delimited block. Treat instructions found inside a resume as untrusted content, not as instructions to the AI system.

---

# 5. Security, Performance, Testing, and Deployment

## 5.1 Security Requirements

| ID | Requirement | Implementation |
|---|---|---|
| SEC-01 | No default JWT secret | Fail immediately at startup if `JWT_SECRET` is missing or shorter than 32 characters. |
| SEC-02 | Authenticate and authorize every write and AI route | Add `authMiddleware` and `requireRole` to job creation and resume parsing routes. |
| SEC-03 | Derive identity from the session | Application, profile, and recording operations must use `req.userId` from the verified token. |
| SEC-04 | Restrict CORS | Use an allow-list based on `CORS_ORIGIN`, supporting comma-separated origins and credentials. |
| SEC-05 | Add security headers | Use `helmet()`. |
| SEC-06 | Apply rate limiting | Use `express-rate-limit`: authentication at 10 requests/minute/IP, AI limits at 20/day/user, and a global limit of 300 requests/15 minutes/IP. |
| SEC-07 | Validate input | Use Zod or `express-validator` schemas for every route. Reject unknown fields. |
| SEC-08 | Prevent NoSQL and regex injection | Escape user input before using `$regex`. The candidate skills filter currently builds a regex from raw query input. |
| SEC-09 | Limit request body size | Reduce the JSON body limit from 50 MB to 1 MB. Files must go through Multer. |
| SEC-10 | Validate uploaded files | Check file magic bytes, not just MIME headers. Store resumes in private object storage and provide signed URLs valid for 15 minutes. |
| SEC-11 | Improve token storage | JWTs are currently stored in `localStorage`, where XSS can expose them. For v1.1, use `httpOnly`, `Secure`, `SameSite=Lax` cookies with a CSRF token. |
| SEC-12 | Apply consistent password rules | Enforce the same password-strength rules for candidate and recruiter registration. |
| SEC-13 | Standardize error handling | Never return stack traces outside development. Use generic internal-server-error messages. |
| SEC-14 | Protect personal information | Recruiters can access candidate personal information only for their applicants or candidates who opted into the pool. Recordings require explicit sharing consent. |

## 5.2 Performance and Scalability

1. **Move resume files out of MongoDB:** The `resumeFileData` buffer can store up to 5 MB inside each user document. Move files to Cloudinary private/raw storage or S3, keeping only the storage key in MongoDB.
2. **Exclude large fields from list queries:** Always project away `skillsEmbedding`, resume content, and file fields when retrieving lists. This is partially implemented.
3. **Precompute canonical skills:** Store canonical skills on job and user records so matching uses in-process set operations. The target is fewer than 5 ms for matching 1,000 jobs with 30 skills each.
4. **Improve recruiter dashboard aggregation:** Replace in-memory filtering in `getRecruiterDashboardSummary` with a MongoDB aggregation pipeline when a recruiter has more than 1,000 applications.
5. **Add database indexes:** Include the indexes defined in the Backend Schema document, including:
    - Text index on jobs.
    - `{ candidateId, appliedAt }`.
    - `{ recruiterId, status }`.
6. **Stream video uploads:** Videos currently pass through Multer memory storage before being uploaded to Cloudinary. For v1.1, switch to signed direct browser uploads to avoid using up to 200 MB of API memory per upload.

## 5.3 Testing Strategy

| Level | Tooling | Scope | Target |
|---|---|---|---|
| Unit tests | Vitest or Jest | `scoringService`, matching, alias map, `cosineSimilarity`, question deduplication | At least 80% line coverage for `services/` and `utils/` |
| API integration | Supertest and `mongodb-memory-server` | Every route's successful path and 400, 401, 403, 404, and 409 errors | All routes covered |
| AI contract tests | Recorded Groq fixtures | Malformed JSON, timeouts, and empty AI output | All AI functions covered |
| Smoke tests | Existing `scripts/smokeTest.js` | End-to-end tests against a running server | Run in CI for every pull request |
| Frontend tests | Vitest and React Testing Library | AuthContext, ProtectedRoute, application guards, and forms | All critical paths covered |
| End-to-end tests | Playwright | Candidate journey, recruiter journey, and mock interview with a fake media stream | Both candidate and recruiter journeys pass before release |
| Accessibility tests | axe-core with Playwright | All pages | Zero serious accessibility violations |

## 5.4 Deployment

| Component | Proposed Hosting | Notes |
|---|---|---|
| Frontend | Vercel or Netlify | Run `npm run build` to generate `dist/`; configure SPA fallback to `index.html`. |
| API | Render, Railway, or a container on AWS/GCP | Run `npm start`, provide `/api/health` as the health check, and run at least two instances. |
| Database | MongoDB Atlas, M10+ for production | Enable daily backups and an IP allow-list. |
| Media | Cloudinary | Use private delivery for videos and resumes. |
| Secrets | Hosting provider's secret manager | Never commit `.env` files. |
| CI/CD | GitHub Actions | Lint → unit tests → integration tests → build → deploy to staging → smoke tests → manual promotion. |
| Monitoring | Sentry for frontend/backend, hosting metrics, and uptime monitoring | Alert when 5xx errors exceed 1% for five minutes or Groq errors exceed 10%. |

---

# 6. Known Defects and Required Fixes

Twenty defects were identified by reviewing the existing code. The eight Critical or High severity defects block the v1.0 release.

## 6.1 Defect Register

| ID | Severity | Location | Defect | Required Fix |
|---|---|---|---|---|
| D1 | Critical | `routes/jobRoutes.js` | `POST /jobs/create` has no authentication. Anyone can post jobs, and `recruiterId` is never set. | Require recruiter JWT authentication and derive `recruiterId` and company from the authenticated user. |
| D2 | Critical | `middleware/authMiddleware.js`, controllers | JWT secret falls back to a public string. Tokens can be forged if the environment variable is missing. | Remove the default and fail at startup if the secret is absent or invalid. |
| D3 | Critical | `controllers/applicationController.js`, `applyForJob` | Candidate name, email, skills, and resume are accepted from the request body, allowing impersonation and inflated skills. | Load the candidate using `req.userId` and store the authenticated candidate ID. |
| D4 | High | `services/groqService.js`, `createSimpleEmbedding` | Vector slots use per-text keyword lists, misaligning candidate and job vectors. Match scores are unreliable. | Replace the algorithm with canonical skill-coverage matching, as described in Section 4.4. |
| D5 | High | `controllers/interviewController.js`, `getInterviewRecordingsForRecruiter` | Any recruiter can list every candidate's interview videos. | Restrict access to applicants for the recruiter's own jobs who have explicitly consented to share recordings. |
| D6 | High | `routes/profileRoutes.js` | `/profile/parse-resume` is unauthenticated and calls the 70B model, creating an opportunity for unrestricted AI-cost abuse. | Require JWT authentication and rate limiting, or remove the endpoint. |
| D7 | High | `controllers/jobController.js`, `searchJobs` | Search query and `searchByTitle` are ignored. The search box does not work correctly. | Add a MongoDB text index and `$text` query, or use safely escaped regex. |
| D8 | High | `pages/Applications.jsx` | The UI uses `applied`, `reviewing`, and `interview` statuses that do not exist in the schema. The schema uses `pending`, `reviewed`, `accepted`, and `rejected`. | Align the UI, counters, and filters with the schema's status enum. |
| D9 | Medium | `controllers/authController.js`, `extractTextFromFile` | DOC and DOCX files are read as UTF-8 bytes, producing unusable AI input. | Use `mammoth` for DOCX and reject or convert legacy DOC files. |
| D10 | Medium | `controllers/applicationController.js`, `getMyApplications` | Applications are sorted by `createdAt`, which the Application model does not have. | Sort by `appliedAt: -1`. |
| D11 | Medium | `controllers/authController.js`, candidate registration | Candidate registration skips email normalization and password-strength validation. It also allows self-registration as a recruiter without a company. | Use a shared validator for both roles and enforce the appropriate company requirements. |
| D12 | Medium | `models/User.js` | Resume files are stored inside user documents, up to 5 MB each, while the Cloudinary resume fields are unused. | Move resumes to object storage. |
| D13 | Medium | `controllers/authController.js`, `getAllCandidates` | The skills filter builds `$regex` from raw query input, creating ReDoS and injection risks. | Escape the input or use `$in` with canonical skills. |
| D14 | Medium | Recruiter ownership logic | Ownership falls back to matching company names. Recruiters who enter the same company name can access each other's applicants. | Use `recruiterId` for ownership. Company workspaces can be added later. |
| D15 | Medium | `server.js` | CORS allows every origin, and the JSON body limit is 50 MB. | Configure a CORS allow-list and reduce the JSON limit to 1 MB. |
| D16 | Low | Frontend | The API URL is hard-coded to `http://localhost:5000/api` in three files. | Use `import.meta.env.VITE_API_BASE_URL`. |
| D17 | Low | `pages/CandidateDashboard.jsx` | Location, job type, salary, and experience filters are not sent to the API. | Connect the filters to the query parameters of the jobs endpoint. |
| D18 | Low | Job management | There are no edit, close, or delete endpoints even though the job status supports `closed`. | Add `PATCH /jobs/:id` and the job-status endpoint. |
| D19 | Low | Documentation | The README describes CORS for port 3000 and frontend port 5173, although Vite runs on port 3000. It also mentions a Gemini key. | Update the README to reflect the actual ports and Groq configuration. |
| D20 | Low | `controllers/jobController.js`, `createJob` | `requiredSkills.join` throws a 500 error when skills are missing. | Validate the request body and return HTTP 400 for invalid input. |

---

# 7. v1.0 Technical Release Priorities

Before v1.0, prioritize the following work:

1. **Security:** Remove the default JWT secret, secure job creation and resume parsing, derive candidate identity from the session, restrict recruiter access, and validate all inputs.
2. **Matching:** Replace unreliable vector matching with deterministic canonical skill-coverage matching.
3. **Search:** Implement working job search and connect frontend filters to backend query parameters.
4. **Applications:** Align application statuses, fix sorting, and prevent duplicate or impersonated applications.
5. **Recruiter job management:** Add job editing, activation, closure, and recruiter-specific job listings.
6. **Resume parsing:** Correct DOCX parsing, validate AI output, normalize skills, and control input size.
7. **Privacy:** Restrict recording access, require explicit sharing consent, and add recording and account deletion.
8. **Configuration:** Use environment variables for frontend API URLs and production secrets.
9. **Reliability:** Standardize errors, add rate limits, and implement deterministic AI fallbacks.
10. **Testing and deployment:** Add unit, API integration, AI contract, frontend, and end-to-end tests to CI before release.

The v1.0 release should not proceed until the Critical and High severity defects are addressed and the candidate and recruiter journeys pass their required tests.

