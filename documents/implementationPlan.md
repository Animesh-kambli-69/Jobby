# Jobby — Implementation Plan



Jobby aims to reach a secure, production-ready v1.0 in 13 weeks, launching on **January 25, 2027**. The plan prioritizes security and data integrity first, followed by matching and search, product completion, the interview module, and UI polish. It assumes a team of three working from the existing codebase.

---

# 1. Approach, Assumptions, and Team

Work is ordered by risk. Anything that could leak data, forge identity, or exhaust the AI budget is addressed first, because every later feature depends on trustworthy users, jobs, and applications.

## 1.1 Approach

- **Fix in place, don't rewrite:** The existing MERN structure, routes, and pages are sound. Version 1.0 refactors controllers and adds missing functionality.
- **Two-week phases:** Each phase ends with a demo. Development runs from a main branch protected by CI.
- **Feature flags:** The new matcher and interview sessions can be compared with existing behavior on staging.
- **Traceability:** Requirement IDs from the PRD (AUTH, PROF, JOB, APP, REC, INT) and defect IDs from the TRD (D1–D20) are referenced on every ticket.

## 1.2 Assumptions

| Assumption | If the assumption is wrong |
|---|---|
| Start Monday, October 26, 2026 | Shift all dates by the delay. |
| Three people: one full-stack lead, one frontend/UI engineer, and one backend engineer; design and QA are covered part-time. | Each person removed adds approximately four weeks. |
| Groq API key with sufficient testing quota, approximately 5,000 calls/month. | Use fallback paths and recorded fixtures. |
| MongoDB Atlas, Cloudinary, and hosting accounts are available by Week 1. | Phase 0 slips. |
| December 25–January 1 is a holiday buffer. | The buffer is already included in the plan. |

## 1.3 Team and Ownership

| Role | Responsibilities | Main phases |
|---|---|---|
| Full-stack lead | Architecture, security, code review, releases, migrations | 0, 1, 2, 6 |
| Backend engineer | API changes, matching, AI services, schema, tests | 1, 2, 3, 4 |
| Frontend/UI engineer | React pages, design tokens, components, accessibility, E2E | 3, 4, 5, 6 |
| Product owner (you) | Priorities, acceptance, beta recruiting, launch go/no-go | All |

## 1.4 Effort Summary

| Phase | Duration | Person-days |
|---|---|---:|
| Phase 0 — Foundations | 1 week | 12 |
| Phase 1 — Security and data integrity | 2 weeks | 26 |
| Phase 2 — Matching and search | 2 weeks | 24 |
| Phase 3 — Product completion | 2 weeks | 27 |
| Phase 4 — Interview v1 | 1.5 weeks + holiday buffer | 18 |
| Phase 5 — UI polish and accessibility | 1 week | 13 |
| Phase 6 — QA, beta, and launch | 2 weeks | 22 |
| **Total** | **13 calendar weeks** | **142** |

Capacity is approximately 150 person-days (three people × five days × approximately ten working weeks after leave), leaving a thin 5% buffer. Section 4 describes what to cut if the buffer runs out.

---

# 2. Roadmap

**v1.0 roadmap:** October 26, 2026 – January 25, 2027.

The roadmap contains seven phases. Phases run back-to-back, with one demo at the end of each. The holiday week sits between interview work and UI polish, helping prevent a delay in that period from moving the launch date. Each phase must satisfy the exit criteria listed in Section 3.

---

# 3. Phase-by-Phase Task Breakdown

Estimates are in person-days (d).

**Owner abbreviations:**
- **L:** Full-stack lead
- **B:** Backend engineer
- **F:** Frontend/UI engineer

## Phase 0 — Foundations

**Dates:** October 26–30, 2026  
**Estimate:** 12 person-days

| Task | Description | References | Owner | Estimate |
|---|---|---|---|---:|
| 0.1 | Initialise Git repository hygiene: remove `.idea` and `_ul` files, add root README, and enable branch protection. | D19 | L | 1 |
| 0.2 | Configure `.env.example` with `JWT_SECRET` and `CORS_ORIGIN`; add boot-time environment validation using Zod; replace three hard-coded frontend URLs with `VITE_API_BASE_URL`. | D2, D16 | L | 2 |
| 0.3 | Set up ESLint and Prettier for both apps, with a pre-commit hook. | — | F | 1 |
| 0.4 | Set up the test harness using Vitest/Jest, Supertest, and `mongodb-memory-server`; add initial tests for `scoringService` and `cosineSimilarity`. | TRD 5.3 | B | 3 |
| 0.5 | Configure GitHub Actions to run lint → test → build on every pull request. | TRD 5.4 | L | 2 |
| 0.6 | Provision staging: Atlas cluster, Cloudinary, API host, frontend host, and Sentry. | TRD 5.4 | L | 2 |
| 0.7 | Create shared `scoreScale.js` and toast component for later phases. | U1, U3 | F | 1 |

**Exit criteria:**
- CI is green on `main`.
- Staging deploys on merge.
- The application refuses to boot without `JWT_SECRET`.

## Phase 1 — Security and Data Integrity

**Dates:** November 2–13, 2026  
**Estimate:** 26 person-days

| Task | Description | References | Owner | Estimate |
|---|---|---|---|---:|
| 1.1 | Protect job creation: make `POST /jobs` recruiter-only, set `recruiterId` and company from the token, and validate the request body. | D1, D20, REC-03 | B | 2 |
| 1.2 | Make Apply use session identity; add `candidateId` to `Application`; reject applications for closed jobs. | D3, APP-04 | B | 3 |
| 1.3 | Enforce ownership using `recruiterId` only in the applications controller and recruiter summary. | D14 | B | 2 |
| 1.4 | Secure or remove `/profile/parse-resume`; require JWT authentication and rate-limit all AI routes. | D6 | B | 1 |
| 1.5 | Restrict `GET /interview/recordings` to applicants for the recruiter's own jobs with `shareRecordings` enabled. | D5, REC-09 | B | 2 |
| 1.6 | Create a unified authentication validator: normalize email, enforce password rules, and validate role/company for both sign-up routes. | D11, AUTH-03/04 | L | 2 |
| 1.7 | Add Helmet, CORS allow-list, a 1 MB JSON limit, and `express-rate-limit`. | D15, SEC-04–06 | L | 2 |
| 1.8 | Add Zod request-validation schemas to every route and define stable error codes. | SEC-07 | B | 4 |
| 1.9 | Escape regex input in the candidate skill filter. | D13 | B | 0.5 |
| 1.10 | Fix `getMyApplications` sorting using `appliedAt`. | D10 | B | 0.5 |
| 1.11 | Run migrations M001–M004 for emails, `candidateId`, index swap, and `recruiterId`, with dry-run reports. | Schema 5.1 | L | 4 |
| 1.12 | Add integration tests for every route, including 401, 403, 404, and 409 paths. | TRD 5.3 | L | 3 |

**Exit criteria:**
- All Critical and High security defects (D1–D3, D5, D6) are closed with tests.
- Migrations run cleanly on a copy of real data.

## Phase 2 — Matching and Search

**Dates:** November 16–27, 2026  
**Estimate:** 24 person-days

| Task | Description | References | Owner | Estimate |
|---|---|---|---|---:|
| 2.1 | Create a skill alias map of approximately 300 canonical skills and a tested `normalizeSkills()` utility. | TRD 4.2 | B | 3 |
| 2.2 | Build a coverage matcher returning `matchScore`, `matchedSkills`, and `missingSkills`; remove LLM keyword vectors from Apply and Search. | D4, JOB-02 | B | 3 |
| 2.3 | Store `skillsNormalized` when saving profiles and jobs. | Schema 4 | B | 1 |
| 2.4 | Implement `GET /jobs` with a text index, query (`q`), location, type, level, salary filters, and pagination. | D7, JOB-03/04/06 | B | 4 |
| 2.5 | Run migrations M006–M009 for canonical skills, dropping embeddings, status history, and indexes. | Schema 5.1 | L | 3 |
| 2.6 | Connect Find Jobs search, filters, sorting, and pagination to the backend. | D17, U4 | F | 4 |
| 2.7 | Add a match-badge popover and matched/missing skills split on Job Details. | JOB-05, U8 | F | 3 |
| 2.8 | Evaluate the matcher using 30 hand-labelled candidate–job pairs; target at least 80% agreement with human rating bands. | PRD 2 | L | 3 |

**Exit criteria:**
- Identical inputs always produce identical scores.
- Search returns correct results for 20 test queries.
- P95 search latency is below two seconds on 1,000 seeded jobs.

## Phase 3 — Product Completion

**Dates:** November 30–December 11, 2026  
**Estimate:** 27 person-days

| Task | Description | References | Owner | Estimate |
|---|---|---|---|---:|
| 3.1 | Add DOCX parsing with Mammoth; reject legacy DOC files with a clear message and truncate text to 12,000 characters. | D9, PROF-02 | B | 2 |
| 3.2 | Move resume files to private object storage, use signed download URLs, and run migration M005. | D12 | L | 4 |
| 3.3 | Use JSON-mode resume parsing with schema validation; preserve old skills if parsing fails. | TRD 4.2 | B | 2 |
| 3.4 | Add editable skills to Profile, a resume-score breakdown, and tips. | PROF-05, PROF-08, U13 | F | 4 |
| 3.5 | Implement the job management API: edit, close/reopen, and `GET /jobs/mine`. | D18, REC-04 | B | 3 |
| 3.6 | Add recruiter UI features: job-row actions, applicant slide-over, and automatic “reviewed” status when opened. | REC-04, REC-07 | F | 4 |
| 3.7 | Align the Applications page with backend statuses and add a timeline to each card. | D8, U2, APP-05 | F | 2 |
| 3.8 | Replace every `alert()` with toasts and add an Apply guard that explains missing fields inline. | U3, U7 | F | 2 |
| 3.9 | Add 404 and error pages, plus first-run onboarding prompts for both roles. | U12, App Flow 3.3–3.4 | F | 2 |
| 3.10 | Add an account-deletion endpoint with cascading deletion. | PRD 6 privacy | B | 2 |

**Exit criteria:**
- Every P0 requirement in PRD Sections 4.1–4.5 is built.
- Recruiters can post, edit, and close jobs and make applicant decisions.
- Candidates can correct their skills.

## Phase 4 — Interview v1

**Dates:** December 14–23, 2026, with buffer through January 1, 2027  
**Estimate:** 18 person-days

| Task | Description | References | Owner | Estimate |
|---|---|---|---|---:|
| 4.1 | Create the `InterviewSession` model; link analyses and recordings using `sessionId`; save question text. | Schema 4.2 | B | 3 |
| 4.2 | Add a consent checkbox and pre-flight screen with camera preview, microphone level, and browser checks. | INT-09 | F | 3 |
| 4.3 | Provide typed-answer fallback when `SpeechRecognition` is unavailable. | INT-03, U9 | F | 2 |
| 4.4 | Build an interview-history page with score trends and a recordings list. | INT-07, INT-08 | F | 3 |
| 4.5 | Support recording deletion from the database and Cloudinary, plus a `shareRecordings` toggle. | INT-09 | B | 2 |
| 4.6 | Add a 20-second Groq timeout, retries with backoff, and a per-user daily AI cap. | TRD 4.6 | B | 2 |
| 4.7 | Add a recording-retention job using `deleteAfter`, with a 90-day period. | Schema 5.3 | B | 1 |
| 4.8 | Add a Playwright test using a fake media stream through all five questions. | TRD 5.3 | L | 2 |

**Exit criteria:**
- A complete interview works in Chrome and Edge, and with typed answers in Firefox/Safari.
- Recordings remain private unless shared.
- Interview history displays past sessions.

## Phase 5 — UI Polish and Accessibility

**Dates:** January 4–8, 2027  
**Estimate:** 13 person-days

| Task | Description | References | Owner | Estimate |
|---|---|---|---|---:|
| 5.1 | Consolidate typography scale, radii, and breakpoints into design tokens; remove Inter. | U10, U11 | F | 3 |
| 5.2 | Add a responsive navbar menu and recruiter bottom tabs below 768 px. | U14 | F | 2 |
| 5.3 | Complete keyboard and screen-reader checks: job-card links, labels, focus rings, and live regions. | U6, UI/UX 5.1 | F | 3 |
| 5.4 | Fix contrast for input borders and secondary text; add axe-core to CI. | UI/UX 5.1 | L | 2 |
| 5.5 | Add skeleton loaders and empty states based on App Flow Section 7. | App Flow 7 | F | 2 |
| 5.6 | Review microcopy using the UI/UX Section 5.3 voice table. | UI/UX 5.3 | L | 1 |

**Exit criteria:**
- Zero serious axe violations.
- All screens are usable at a 375 px width.

## Phase 6 — QA, Beta, and Launch

**Dates:** January 11–22, 2027  
**Estimate:** 22 person-days

| Task | Description | References | Owner | Estimate |
|---|---|---|---|---:|
| 6.1 | Run full regression testing: unit, integration, and E2E journeys on staging. | TRD 5.3 | L | 3 |
| 6.2 | Load-test 200 concurrent users on Search and Apply; fix performance hotspots. | TRD NFR | B | 3 |
| 6.3 | Conduct a security review covering the OWASP checklist, dependency audit, and secret scan. | SEC | L | 2 |
| 6.4 | Run a closed beta with 20 candidates and five recruiters; collect feedback and triage issues daily. | PRD 2 | All | 8 |
| 6.5 | Fix beta bugs classified as P0/P1 only. | — | B, F | 4 |
| 6.6 | Deploy to production, configure monitoring alerts and runbook, and rehearse rollback. | TRD 5.4 | L | 2 |

**Exit criteria:**
- The launch checklist in Section 5 is fully completed.
- The go/no-go meeting takes place on Friday, January 22.

---

# 4. Dependencies, Risks, and Contingency

## 4.1 Critical Dependencies

| Dependency | Needed for | What it blocks |
|---|---|---|
| `candidateId` on applications (Tasks 1.2, 1.11) | Phase 2 matcher storage, Phase 3 timeline, account deletion | Most of Phases 2–3 |
| `recruiterId` on jobs (Tasks 1.1, 1.11) | Job management (3.5), recording access control (1.5) | Recruiter features |
| Skill alias map (2.1) | Matcher (2.2), search filters (2.4), skill editing (3.4) | Phase 2 |
| Object-storage bucket (0.6) | Resume migration (3.2) | Phase 3 |
| Interview session model (4.1) | History (4.4), deletion (4.5), retention (4.7) | Phase 4 |
| Beta users recruited by the product owner by January 4 | Closed beta (6.4) | Launch |

## 4.2 Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Migrations encounter messy real data, including duplicate emails with different casing and orphan applications. | Medium | High | Generate dry-run reports in Phase 1, prepare a manual-merge list, and take a snapshot before each migration step. | L |
| The new matcher feels worse than the old one to users. | Low | High | Use a labelled evaluation set (2.8) and a feature flag to compare results on staging. | L |
| Groq rate limits occur during beta. | Medium | Medium | Use daily caps, retry/backoff, fallbacks, and recorded test fixtures. | B |
| The holiday period loses more than one week. | Medium | Medium | Phase 4 has its own buffer; defer Task 4.4 to v1.1 if needed. | L |
| Browser media APIs behave differently across devices. | Medium | Medium | Add a pre-flight check, typed-answer fallback, and tests across four browser/OS pairs. | F |
| Privacy or legal review requests changes to recording behavior. | Low | High | Build consent and retention into Phase 4 and draft the privacy note in Phase 3. | Product owner |
| One team member becomes unavailable. | Medium | High | Pair on migrations and authentication, and maintain a documented runbook. | All |

## 4.3 Contingency: What to Cut

If the plan slips by more than one week, defer the following to v1.1 without blocking launch:

1. **Interview history page (4.4):** Keep the data and ship the UI later. Saves three days.
2. **Resume-score tips (part of 3.4):** Saves 1.5 days.
3. **Recruiter bottom tab bar (part of 5.2):** Saves one day.
4. **Reduce load testing from 200 to 100 users (6.2):** Saves 1.5 days.
5. **Reduce beta duration from two weeks to one week (6.4):** Saves four days.

**Never cut:** Phase 1 security work, migrations, consent and recording privacy, or accessibility basics.

---

# 5. QA, Launch Checklist, and v1.1 Backlog

## 5.1 Definition of Done

Every ticket must satisfy all of the following:

- Code reviewed by at least one other engineer, with CI green.
- A unit or integration test covers the change, including at least one failure path.
- Acceptance criteria from the relevant PRD user story are verified on staging.
- No new serious axe-core violations are introduced on modified screens.
- Documentation is updated, including the API table in the TRD and the schema document if a field changes.

## 5.2 Launch Checklist

Before launch, verify every item:

- [ ] All P0 requirements in PRD Section 4 are marked Built.
- [ ] TRD defects D1–D15 are closed with tests.
- [ ] Migrations M001–M009 run on a production snapshot, and reports are reviewed.
- [ ] `JWT_SECRET`, `CORS_ORIGIN`, Groq, Cloudinary, and storage secrets are configured in production.
- [ ] Rate limits and daily AI caps are active.
- [ ] Sentry and uptime alerts are reaching the team channel; a test alert has been sent.
- [ ] Atlas backups are enabled and at least one restore has been tested.
- [ ] Privacy note and terms are published; consent appears before recording.
- [ ] Candidate and recruiter E2E journeys pass on production.
- [ ] Load testing passes at the agreed concurrency; API P95 latency for reads is below 500 ms.
- [ ] The seed script is blocked in production.
- [ ] The rollback plan is rehearsed using the previous build and a database snapshot.
- [ ] The product owner signs off on the go/no-go decision.

## 5.3 Post-Launch Monitoring: First 14 Days

| Signal | Alert threshold | Action |
|---|---|---|
| API 5xx rate | Above 1% for five minutes | On-call lead investigates. |
| Groq failure rate | Above 10% for ten minutes | Check quota; fallbacks should operate automatically. |
| Resume parsing success | Below 90% daily | Inspect failing file types. |
| Sign-up to first application | Median above 15 minutes | Review the onboarding funnel. |
| Interview completion | Below 50% daily | Check browser/device breakdown. |

## 5.4 v1.1 Backlog

**Target:** Six weeks after launch.

| Item | PRD reference | Estimate |
|---|---|---:|
| Forgot/reset password | AUTH-07 | 3 days |
| Email verification | AUTH-08 | 2 days |
| Email notifications on status changes | APP-08 | 3 days |
| `httpOnly` cookie sessions and CSRF protection | SEC-11 | 3 days |
| Vosk offline speech fallback | INT-03 | 4 days |
| Semantic matching blended with a real embedding model | TRD 4.4 | 6 days |
| Signed direct-to-Cloudinary video upload | TRD 5.2 | 2 days |
| Withdraw application | APP-07 | 1 day |
| Admin console for suspending users and removing jobs | PLT-03 | 6 days |
| Light theme | UI/UX 6.3 | 4 days |

---

# 6. Release Summary

The implementation plan moves Jobby from its existing MERN codebase to a production-ready v1.0 through seven phases:

1. **Foundations:** Establish code quality, CI, testing, and staging.
2. **Security and data integrity:** Secure authentication, job creation, applications, recordings, and migrations.
3. **Matching and search:** Introduce deterministic skill matching, normalized skills, search filters, and pagination.
4. **Product completion:** Finish resume handling, recruiter job management, application status flows, onboarding, and account deletion.
5. **Interview v1:** Add consent, interview sessions, recording privacy, typed-answer fallback, and AI safeguards.
6. **UI polish and accessibility:** Improve responsive behavior, accessibility, design consistency, and screen states.
7. **QA, beta, and launch:** Complete regression and security checks, test with beta users, deploy, and prepare rollback.

**Target launch date:** January 25, 2027.

The plan prioritizes security, migrations, recording consent and privacy, and accessibility. Lower-priority features can move to v1.1 if the schedule slips, while the launch checklist and phase exit criteria determine whether v1.0 is ready for release.