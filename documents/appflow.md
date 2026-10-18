# Jobby — App Flow Document



Jobby has 9 screens split across two roles: a visitor lands on the marketing page, signs up as a candidate or recruiter, and is routed to that role's home. This document traces every path a user can take, what the system does at each step, and where it can fail.

---

# 1. Navigation Map

A candidate's whole loop runs through Find Jobs: an incomplete profile sends them to Profile before they can apply. A recruiter never leaves `/recruiter`; its views switch inside the page, and both Overview and Job Postings open the same applicant panel.

## 1.1 Routes Overview

| Route | Screen | Access | Navbar | Main API Calls on Load |
|---|---|---|---|---|
| `/` | Landing | Public; logged-in users redirect to role home | Public navbar | — |
| `/login` | Login | Public; logged-in users redirect | Public navbar | — |
| `/signup` | Sign up | Public; logged-in users redirect | Public navbar | — |
| `/candidate` | Candidate dashboard (Find Jobs) | Candidate | Candidate navbar | `POST /jobs/search`, `GET /applications/my/summary` |
| `/job/:id` | Job details | Any logged-in user | Role navbar | `GET /jobs/:id` |
| `/profile` | Profile and resume | Candidate | Candidate navbar | Uses session user; `PUT /auth/profile` on save |
| `/applications` | My applications | Candidate | Candidate navbar | `GET /applications/my` |
| `/interview` | AI mock interview | Candidate | Candidate navbar | `GET /interview/questions` on start |
| `/recruiter` | Recruiter dashboard (Overview, Candidates, Postings) | Recruiter | Hidden; own sidebar | `GET /recruiter-auth/summary`, `GET /jobs/all`, `GET /auth/candidates` |

**Missing route:** There is currently no 404 route. Add a Not Found page linking back to Home.

## 1.2 Redirect Rules

| Situation | Result |
|---|---|
| Visitor opens a protected route | Redirect to `/login`. In v1.0, remember the target and return after login. |
| Candidate opens `/recruiter` | Redirect to `/candidate`. |
| Recruiter opens `/profile`, `/applications`, `/interview`, or `/candidate` | Redirect to `/recruiter`. |
| Logged-in user opens `/`, `/login`, or `/signup` | Redirect to their role home. |
| Stored token is rejected by `/me` | Clear session and return to public pages. |
| Logout | Clear `token`, `user`, and `candidateProfile` from `localStorage`, then redirect to `/`. |
| Candidate applies with an incomplete profile | Redirect to `/profile` with `state.missingField` (`name`, `email`, `resume`, or `skills`) and a message. |

## 1.3 Session Restore on Reload

1. `AuthContext` reads the token and user from `localStorage`.
2. If a token exists, call `/recruiter-auth/me` for recruiters or `/auth/me` otherwise.
3. On success, save the refreshed user. On failure, call `logout()`.
4. Set `loading` to `false` so protected routes can render.

---

# 2. Onboarding and Authentication Flows

## 2.1 Landing → Sign Up

1. The visitor lands on `/`. The page displays:
    - Hero section.
    - “Problem with traditional job boards.”
    - “Opportunity Graph” solution with four pillars.
    - Advanced Features: Resume Intelligence, Candidate Ranking, AI Interview Simulator, and Smart Job Matching.
    - Four-step “How it works” section.
    - Final call to action.
2. The visitor clicks **Get Started** or **Sign Up** and navigates to `/signup`.
3. The visitor selects a role: Candidate or Recruiter. Selecting Recruiter reveals the Company field.
4. The visitor enters name, email, password, and confirm password.
5. The client checks that all fields are filled and the passwords match.
6. The system calls:
    - Candidate: `POST /auth/register`
    - Recruiter: `POST /recruiter-auth/register`
7. On HTTP 201, save the token and user to `localStorage`:
    - Candidate → `/candidate`
    - Recruiter → `/recruiter`
8. On error, show a message above the form, such as “User already exists with this email” or a password-rule message. Preserve the entered field values.

## 2.2 Login

1. The user opens `/login`, selects a role (Candidate by default), and enters email and password.
2. The system calls the selected role's login endpoint.
3. On success, redirect to the role's home.
4. If a candidate account selects the Recruiter role, show: “This account is not a recruiter account”.
5. On failure, show “Invalid credentials” without revealing which field was incorrect.

## 2.3 First-Run Candidate Onboarding (Target v1.0)

Currently, a new candidate lands on Find Jobs without skills, so no match scores are displayed. The target v1.0 flow is:

1. After sign-up, show a one-step prompt: “Upload your resume to see your match score on every job”, with **Upload now** and **Skip** options.
2. **Upload now** → `/profile`, with the upload panel focused.
3. After successful parsing, show a toast: “We found 18 skills. Your resume score is 72.” Include a **See matched jobs** button leading to `/candidate`.
4. **Skip** → `/candidate`, with a persistent banner until a resume is uploaded.

## 2.4 First-Run Recruiter Onboarding (Target v1.0)

1. After sign-up, show an empty state on Overview: “Post your first job to start receiving ranked applicants”.
2. Provide a **Post a job** button.
3. Clicking it opens the **Create New Opportunity** modal.

## 2.5 Forgot Password (v1.1)

1. On `/login`, click **Forgot password?** to open `/forgot-password`.
2. The user enters their email.
3. Always respond: “If an account exists, we've emailed a link” to avoid revealing whether an account exists.
4. The email link opens `/reset-password?token=…`.
5. The user enters the new password twice.
6. On success, redirect to `/login`.

---

# 3. Candidate Flows

## 3.1 Build or Update Profile (`/profile`)

1. The candidate sees a profile card containing:
    - Avatar, name, and email.
    - Resume score ring with label.
    - Summary.
    - Skills tags.
    - Experience and education.
    - Profile links.
2. If the page was opened after an unsuccessful application attempt, show a guidance banner naming the missing field and highlight the relevant panel.
3. The candidate edits Profile Links: GitHub, LinkedIn, LeetCode, and portfolio.
4. Under **Upload Resume**, the candidate chooses File or Paste text.
    - **File:** Select PDF, DOC, DOCX, or TXT up to 5 MB. Display the filename.
    - **Text:** Paste resume text into the textarea.
5. The candidate clicks **Update profile** or **Parse with AI**.
6. The system sends multipart `PUT /auth/profile`. The server extracts the text, calls Groq to parse it, generates the skill vector, calculates the resume score, and saves the user.
7. Show the loader message: “Analysing your resume…” (typically 5–15 seconds).
8. On success, refresh the profile card with the new skills and score. Show an “uploaded candidate” success card and save the updated user to `localStorage`.
9. On failure, display an error message and preserve the previous profile.

## 3.2 Discover Jobs (`/candidate`)

1. The hero section greets the candidate by first name.
2. Stat cards display Resume Score, Matched Jobs, Applied Jobs, and Rejected Jobs.
3. Quick actions include **My Profile**, **Applications**, and **AI Interview**.
4. On load, call `POST /jobs/search` with the candidate's skills. Return jobs sorted by match percentage.
5. Each JobCard displays:
    - Job title and company.
    - Match badge.
    - First 120 characters of the description.
    - Up to four skills, followed by `+N` if more exist.
    - Location and salary.
    - Posted date, such as “Today” or “3 days ago”.
6. The candidate enters a search term and clicks **Search**. The same endpoint is called with the query. **Current gap:** the server ignores the query until search is implemented.
7. The candidate can toggle filters for location, job type, salary, and experience. **Current gap:** these filters affect only the UI.
8. If there are no results, show “No Opportunities Found” with a **Refresh** action.
9. Clicking a job card opens `/job/:id`.

## 3.3 View Job and Apply (`/job/:id`)

1. Call `GET /jobs/:id`.
2. Display the job title, company, location, salary, description, required skills, and an “About this role” section containing status, type, and level.
3. When the candidate clicks **Apply Now**, run client-side guards in this order:
    - Not logged in → show an alert and redirect to `/login`.
    - Name missing → redirect to `/profile` with `missingField: name`.
    - Email missing → redirect to `/profile` with `missingField: email`.
    - Resume missing → redirect to `/profile` with `missingField: resume`.
    - Skills missing → redirect to `/profile` with `missingField: skills`.
4. If all checks pass, call `POST /applications/apply`. Show a spinner on the button.
5. On HTTP 201, switch the panel to **Application Submitted!**, with a link to Applications.
6. On HTTP 409, show “You have already applied for this job” and display the submitted state.
7. **Back** → `/candidate`.

## 3.4 Track Applications (`/applications`)

1. Call `GET /applications/my`, with job details populated.
2. Display stat cards and filter tabs:
    - All
    - Pending
    - Reviewed
    - Accepted
    - Rejected

   **v1.0 alignment:** today's UI uses statuses that do not exist in the current schema.
3. Each application card shows job title, company, location, salary, applied date, match percentage, and a status chip with an icon.
4. Search filters applications by job title or company as the user types.
5. If there are no applications, show “No Applications Yet” with a **Browse jobs** button leading to `/candidate`.

## 3.5 Application Status Lifecycle

| From | Event | To | Who |
|---|---|---|---|
| — | Candidate applies | `pending` | Candidate |
| `pending` | Recruiter opens the applicant (v1.0) | `reviewed` | System |
| `pending` or `reviewed` | Recruiter clicks Accept | `accepted` | Recruiter |
| `pending` or `reviewed` | Recruiter clicks Reject | `rejected` | Recruiter |
| `pending` | Candidate withdraws (P2) | `withdrawn` | Candidate |

Accepted and rejected are final statuses in v1.0.

---

# 4. AI Mock Interview Flow (`/interview`)

The page is a three-stage state machine held in `stage`: `setup → practicing → feedback`. The practicing stage loops once per question, five times.

## 4.1 Setup

1. The candidate chooses the interview type:
    - **Technical:** Data structures, algorithms, and system design.
    - **Behavioral:** STAR method and past experience.
    - **Mixed:** A combination of both.
2. The candidate chooses a level: Entry, Mid (default), or Senior.
3. **v1.0 consent checkbox:** “I agree to camera and microphone use and to saving this recording to my account”, with a link to the privacy note. The Start button remains disabled until consent is given.
4. The candidate clicks **Start Interview**. The system calls:

   `GET /interview/questions?interviewType=&difficulty=`

5. The server builds resume context from the candidate's name, skills, experience, education, summary, and resume text. It asks Groq for five questions, removes duplicates, and fills any missing questions from the fallback bank.
6. The client shuffles the five questions, adds the welcome message and first question to the conversation, starts the interview timer, and moves to `practicing`.

## 4.2 Practicing (Repeated for Each of Five Questions)

| Step | User Action | System Action |
|---|---|---|
| 1 | Reads the question in the chat panel | Displays question number out of five and progress |
| 2 | Clicks **Start recording** | Calls `getUserMedia` for camera and microphone; displays live video preview; initializes face worker; starts `MediaRecorder` and `SpeechRecognition` for live transcription |
| 3 | Speaks the answer | Updates transcript in place; worker scores each video frame for eye contact |
| 4 | Clicks **Stop recording** | Stops recognition and recorder; worker finalizes eye-contact percentage; uses transcript as answer text; calls `POST /interview/analyze` for score, confidence, eye-contact note, and feedback; begins video upload to `POST /interview/recordings` in the background |
| 5 | Reviews the per-answer metrics card | Displays score, confidence, eye-contact percentage, and duration |
| 6 | Clicks **Submit answer** | Requires a voice answer; appends Q&A to history; interviewer posts “Good answer… Next question: …” |
| 7 | Finishes question five | Interviewer posts the closing line and the system calls `POST /interview/performance` |

### Interruptions

- If the camera or microphone track ends during an answer, stop recording and show “Camera or microphone was turned off”.
- When the user leaves the page, release all media resources and terminate the worker.

## 4.3 Feedback

1. Display **Interview Complete!**, the overall score (0–100), and total duration.
2. Show three panels:
    - Strengths.
    - Areas to Improve.
    - Pro Tips.

   Each panel contains 3–5 bullet points.
3. If Groq fails, average the per-answer scores and display generic tips.
4. Provide two actions:
    - **Practice again:** Return to setup while keeping the same choices.
    - **Back to dashboard:** Return to the candidate dashboard.
5. **v1.1:** Add **View history**, showing past scores as a trend and links to saved recordings.

## 4.4 Unsupported Browser

If `SpeechRecognition` is unavailable (Firefox or Safari), v1.0 should display “Voice answers need Chrome or Edge” and offer **Type my answers** instead. This option provides a text box without recording.

In v1.1, replace this limitation with the Vosk offline recognizer already present in `public/workers`.

---

# 5. Recruiter Flows (`/recruiter`)

The recruiter dashboard replaces the top navbar with a left sidebar containing **Overview**, **Candidates**, **Job Postings**, a **Post Job** button, and **Logout**. The active view is stored in `activeView`.

## 5.1 Overview

1. On load, call:
    - `GET /recruiter-auth/summary`
    - `GET /jobs/all`, currently filtered to the recruiter's company on the client side.
    - `GET /auth/candidates`
2. Display the header **Recruitment Analytics** with KPI cards for:
    - Total jobs.
    - Active jobs.
    - Total applications.
    - Pending applications.
    - Accepted applications.
    - Unique candidates.
    - Average resume score.
3. **Active Job Performance:** Show each posting with its applicant count. Clicking a job opens its applicant panel (Section 5.3).
4. **Top Ranked Talent:** Display the top three candidates by resume score. **View All** opens the Candidates view.
5. **Applicant Score Distribution:** Show five score buckets, from 0–20 through 80–100.

## 5.2 Post a Job

1. The recruiter clicks **Post Job**, opening the **Create New Opportunity** modal.
2. Fields:
    - Title*.
    - Description*.
    - Company, pre-filled with the recruiter's company.
    - Location.
    - Salary.
    - Required skills*, entered as comma-separated values.
3. The client validates required fields. The skills string is split, trimmed, and empty values are removed.
4. Submit the job:
    - Current endpoint: `POST /jobs/create`.
    - Target v1.0 endpoint: `POST /jobs`, with recruiter authentication.
5. On success, close the modal, reload postings, and show confirmation. In v1.0, use a toast instead of `alert()`.
6. On failure, show “Failed to create job. Please try again.” and preserve the form values.

## 5.3 Review Applicants for a Job

1. The recruiter selects a job in Overview or Job Postings.
2. Call `GET /applications/job/:jobId`.
3. The server checks job ownership. Return HTTP 403 if the job does not belong to the recruiter.
4. Display the applicant panel, sorted by match score, with:
    - Name and email.
    - Match percentage.
    - Skills.
    - Applied date.
    - Status.
    - Resume filename.
5. Provide status filters: All, Pending, Accepted, Rejected, and Reviewed in v1.0.
6. **Download resume:** Call `GET /auth/candidates/:id/resume` and save the original file in the browser.
7. **Accept or Reject:** Call `PATCH /applications/:id/status`. Show a spinner on the selected row, then update its status chip.
8. **v1.0:** Add **Close job** and **Edit job** buttons to the job header.

## 5.4 Candidate Pool

1. The recruiter opens **Candidates** and calls `GET /auth/candidates` with filters.
2. Available filters:
    - Minimum score.
    - Maximum score.
    - Skills, entered as comma-separated values.
    - Sort: score high-to-low, score low-to-high, or name.
3. Each candidate card displays:
    - Name and email.
    - Resume score with a label.
    - Top skills.
    - Experience.
    - Profile links.
    - Resume download.

### Resume Score Labels

| Score | Label |
|---|---|
| 85 and above | Excellent |
| 70–84 | Strong |
| 55–69 | Good |
| 40–54 | Fair |

**Open question for v1.0:** Should recruiters see only applicants to their jobs, or should Jobby maintain an open candidate pool that users can opt into?

## 5.5 Job Postings

1. Display the recruiter's jobs with title, location, status, applicant count, and posted date.
2. Clicking a job opens its applicant panel (Section 5.3).

---

# 6. Empty, Loading, and Error States

Every screen must have loading, empty, and error states designed. In v1.0, replace every browser `alert()` with an inline message or toast.

## 6.1 General and Candidate Screens

| Screen | Loading State | Empty State | Error State |
|---|---|---|---|
| App shell | Full-screen “Loading…” while restoring the session | — | Invalid token triggers silent logout to public pages |
| Sign up / Login | Button spinner; inputs disabled | — | Inline red message above form; field-level password-rule hints |
| Find Jobs | Skeleton job cards | “No Opportunities Found” with Refresh; if there are no skills, show “Upload your resume to see match scores” banner | “Couldn't load jobs” with Retry |
| Job details | Centered loader | “Job not found” with Back to jobs | HTTP 409 duplicate application appears as submitted state; network error shows a toast |
| Profile | “Analysing your resume…” overlay, typically 5–15 seconds | If no resume, expand the upload panel and show “—” in the score ring | Invalid type or file over 5 MB: inline message. AI failure: “We saved your file but couldn't read it. Try again or paste text.” |
| Applications | “Loading your application graph…” | “No Applications Yet” with Browse jobs | “Couldn't load applications” with Retry |
| Interview setup | Start button spinner while questions generate | — | “Unable to generate interview questions right now”. The fallback bank should normally prevent this. |

## 6.2 Interview and Recruiter Screens

| Screen | Loading State | Empty State | Error State |
|---|---|---|---|
| Interview practicing | Camera warming up, maximum five seconds | — | Permission denied: explain how to enable camera/mic. If a device is turned off, stop recording. If upload fails, show “Recording not saved” without blocking the interview. |
| Interview feedback | “Generating your feedback…” | — | Groq failure: show fallback feedback with a small “Basic feedback” tag |
| Recruiter overview | KPI skeletons | “Post your first job” call to action | Summary failure: show “—” on cards with Retry |
| Recruiter applicants | Panel loader | “No applications yet for this job” | HTTP 403: “You can only view applications for your own jobs” |
| Candidate pool | Candidate card skeletons | “No candidates match these filters” with Clear filters | Retry |
| Any route | — | Unknown URL displays a 404 page (to add) | HTTP 500: generic “Something went wrong” message with Home link |

---

# 7. v1.0 and v1.1 Implementation Priorities

The following items are explicitly identified in the document as target behavior, gaps, or future enhancements.

## 7.1 Target v1.0

- Add the candidate resume-upload onboarding prompt after sign-up.
- Add the recruiter first-job empty state.
- Remember protected-route destinations and return users after login.
- Align application status filters with the actual status schema.
- Implement recruiter-authenticated job creation using `POST /jobs`.
- Add job editing and closing controls.
- Add the Reviewed application status.
- Add camera and microphone consent before mock interviews.
- Replace browser alerts with inline messages or toasts.
- Add a Not Found page and consistent loading, empty, and error states.
- Fix job search and connect filters to the backend.
- Decide whether the candidate pool is restricted to applicants or available as an opt-in pool.

## 7.2 Target v1.1

- Implement forgot-password and reset-password flows.
- Add interview history with score trends and saved recording links.
- Replace the browser speech-recognition limitation with Vosk offline recognition.

---

# 8. Key User Journeys at a Glance

## Candidate Journey

1. Visit the landing page.
2. Sign up as a candidate or log in.
3. Upload a resume or skip onboarding.
4. Discover jobs and view match scores.
5. Open a job and complete any missing profile fields.
6. Apply for the job.
7. Track application statuses.
8. Practise with the AI mock interview and review feedback.

## Recruiter Journey

1. Visit the landing page.
2. Sign up as a recruiter or log in.
3. Open the recruiter dashboard.
4. Post a job.
5. Review recruitment analytics and ranked talent.
6. Open a job's applicant panel.
7. Download resumes and accept or reject applications.
8. Manage job postings and filter candidates.

## Visitor and Authentication Journey

1. Visit `/`.
2. Choose Sign Up or Login.
3. Select Candidate or Recruiter.
4. Complete the relevant authentication flow.
5. Redirect to the appropriate role home.
6. Restore the session on reload or return to public pages if the token is invalid.