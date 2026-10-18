# Jobby — UI/UX Design Brief



Jobby's interface uses a dark, indigo-accented “Cognitive Curator” system: deep navy surfaces, glass cards, and one bright accent reserved for AI insight. This brief documents the existing design system, establishes rules for extending it, and lists the screens and fixes required for v1.0.

---

# 1. Design Goals and Principles

The interface must make fit visible. Every job, applicant, and answer should display a score that users can understand at a glance, with the reason behind it available in one click.

## 1.1 Goals

1. **Show fit, not just listings:** Match percentage, resume score, and interview score are the primary visual anchors on their screens.
2. **Get candidates to value in under 10 minutes:** Upload → parsed profile → ranked jobs → apply, with no dead ends.
3. **Let recruiters triage in seconds:** Ranked lists, matched skills, and one-click decisions.
4. **Make AI trustworthy:** Explain scores, label AI-generated content, and never hide fallback results.
5. **Reduce interview anxiety:** Provide a calm, private practice space with clear progress and kind, specific feedback.

## 1.2 Design Principles

| Principle | What it means in practice |
|---|---|
| Data first, decoration second | Numbers and skills appear at the top of every card. Gradients and glows are reserved for the primary action. |
| One accent per view | `--primary` marks the main action or highest-value number. `--secondary` is used only for AI-predicted data. |
| Explain every score | Hovering or tapping a match badge shows matched and missing skills. Resume scores show their three components. |
| Progressive disclosure | Cards show four skills and “+N”; full details appear on the detail page or in an expandable row. |
| No dead ends | Every empty state has one clear next action. |
| Respect attention | No autoplaying motion, modal on page load, or browser `alert()`. |

## 1.3 Brand Personality

Jobby should feel intelligent, calm, and encouraging. It speaks like a sharp career coach: direct about gaps and generous with next steps. Visually, it is a quiet night-mode workspace where insights glow rather than a flashy job board.

| We are | We are not |
|---|---|
| Precise: “You match 7 of 9 skills.” | Vague: “Great match!” |
| Encouraging: “Add Docker to reach 89%.” | Judgemental: “Weak profile.” |
| Transparent: “AI-generated feedback.” | Pretending AI is human. |

---

# 2. Visual System

All design values must remain CSS custom properties in `frontend/src/index.css`. This file is the single source of truth. Page stylesheets must not hard-code hexadecimal colour values.

## 2.1 Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `--surface` | `#060e20` | Page background |
| `--surface-container-low` | `#091328` | Sidebar and secondary panels |
| `--surface-container` | `#0f1930` | Cards |
| `--surface-container-high` | `#141f38` | Hovered cards and inputs |
| `--surface-container-highest` | `#1a2545` | Modals and popovers |
| `--surface-bright` | `#1f2b49` | Selected rows |
| `--primary` | `#9fa7ff` | Primary actions, active navigation, key numbers |
| `--primary-dim` | `#8a95ff` | Gradient end and pressed state |
| `--primary-container` | `rgba(159,167,255,0.10)` | Tinted backgrounds for primary chips |
| `--secondary` | `#3adffa` | AI-predicted data only, such as intelligence tags and live transcript cursor |
| `--tertiary` | `#ffa9e0` | Rare AI-insight highlight; maximum one per screen |
| `--on-surface` | `#dee5ff` | Body and heading text |
| `--on-surface-variant` | `#a3aac4` | Secondary text and labels |
| `--on-primary` | `#060e20` | Text on primary buttons |
| `--outline-variant` | `rgba(64,72,93,0.20)` | Hairline borders; increase to approximately 0.40 for inputs |
| `--success` | `#10b981` | Accepted, high match, excellent score |
| `--warning` | `#f59e0b` | Pending, medium match, average score |
| `--error` | `#ef4444` | Rejected, errors, destructive actions |

### Shared Score Colour Scale

Use one score scale throughout the product.

| Score range | Label | Token |
|---|---|---|
| 85–100 | Excellent | `--success` |
| 70–84 | Very good | `--primary` |
| 55–69 | Good | `--secondary` |
| 40–54 | Average | `--warning` |
| 0–39 | Needs work | `--error` |

Colour must never be the only indicator. Every score must also show its number and label.

## 2.2 Typography

**Font family:** Manrope, weights 400, 500, 600, 700, and 800, with a system sans-serif fallback.

The current `index.html` also loads Inter, which is unused and should be removed. Consolidate the current 15+ font sizes into these eight styles.

| Style | Size / line height | Weight | Usage |
|---|---|---|---|
| Display L | `3.5rem / 1.1` | 800 | Landing-page hero only |
| Display M | `2.5rem / 1.2` | 700 | Page heroes, such as “Welcome back, Priya” |
| Headline L | `2rem / 1.25` | 700 | Section titles and large stat values |
| Headline M | `1.75rem / 1.3` | 600 | Card titles on detail pages |
| Title | `1.25rem / 1.4` | 600 | Card and modal titles |
| Body L | `1rem / 1.6` | 400 | Default body text |
| Body M | `0.9rem / 1.55` | 400 | Card descriptions and table text |
| Label | `0.75rem / 1.4` | 600 | Stat labels, chips, and overlines; `0.05em` letter spacing and uppercase |

## 2.3 Spacing, Radius, and Elevation

| Property | Specification |
|---|---|
| Spacing | Four-point base scale: 4, 8, 12, 16, 24, 32, 48, and 64 px |
| Card padding | 32 px desktop; 20 px mobile |
| Layout | Maximum content width 1400 px; 12-column grid with 24 px gutters |
| Buttons and inputs | 8 px radius |
| Small cards | 12 px radius |
| Glass cards and modals | 16 px radius |
| Pills and badges | 999 px radius |
| Card shadows | No drop shadows; depth comes from surface steps |
| Glass cards | `backdrop-filter: blur(20px)` on `--surface-container` at approximately 80% opacity |
| Primary button glow | `0 4px 24px var(--primary-glow)` |
| Background | Two faint radial glows fixed behind content: indigo at top-left with 3% intensity and cyan at bottom-right with 2% intensity |

## 2.4 Motion

| Interaction | Specification |
|---|---|
| Card and button hover | 200–300 ms ease; lift 2 px and brighten the border |
| Page and panel entry | 250 ms fade and 8 px rise; no stagger beyond five items |
| Short waits | Spinner for waits under 3 seconds |
| Lists loading | Skeletons that match the final layout |
| AI waits over 3 seconds | Progress text, such as “Reading your resume…” followed by “Extracting skills…” |
| Score reveal | Ring or number counts up over 600 ms, once |
| Reduced motion | `prefers-reduced-motion: reduce` disables lift, count-up, and smooth scrolling |

## 2.5 Iconography

Use `lucide-react` icons.

- 16 px inline with text.
- 18 px in navigation.
- 24–28 px in stat cards.
- 2 px stroke.
- Colour inherits from the text or the relevant semantic token.

---

# 3. Component Library

Keep existing class names so engineering can refactor components in place.

| Component | Existing class / file | Variants | Required states and rules |
|---|---|---|---|
| Button | `.btn` | Primary, Secondary, Tertiary, Large, Destructive, Icon-only | Default; hover lifts 2 px; active scales to 0.98; focus uses a 2 px primary ring with 2 px offset; disabled uses 40% opacity and no pointer interaction; loading replaces the icon with a spinner while keeping the label |
| Text input / textarea | `.input`, `.textarea` | Leading icon, helper text, password with show/hide | Default, focus with primary border and ring, error with red border and message, disabled; labels must always be visible above fields |
| Select | Native `<select>` | Role picker, sort, interview level | Same states as inputs; custom chevron |
| Segmented control | Profile File/Text toggle; interview type cards | Two or three options | Selected option uses primary-container fill and primary border |
| File drop zone | `.file-upload-label` | Empty, file chosen, uploading, error | Drag and drop; display filename, size, and type; helper text: “PDF, DOCX or TXT up to 5 MB” |
| Glass card | `.glass-card` | Default, interactive, selected | 16 px radius and 32 px padding; interactive cards must be links or buttons with a focus ring |
| Stat card | `.stat-card` | Icon, value, label | Value uses Headline L; label uses Label style; optional trend delta |
| Job card | `JobCard.jsx` | With match, without match | Title, company, match badge at top-right, two-line description, four skills plus “+N”, and metadata for location, salary, and posting date |
| Application card | `ApplicationCard.jsx` | Candidate view, recruiter view | Status chip, match percentage, date; recruiter view adds Accept/Reject and resume download |
| Candidate card | `UploadedCandidateCard.jsx`, recruiter talent rows | Compact, full | Avatar initials, name, resume score, top skills, links |
| Match badge | `.match-score.high/.medium/.low` | High ≥ 70, Medium 40–69, Low < 40 | Pill with trending icon and text such as “84% match”; tooltip/popover lists matched and missing skills |
| Score ring | Profile `.card-score` | Small 48 px, large 120 px | Ring stroke uses the shared score colour; number centred with label below |
| Skill tag | `.skill-badge` | Neutral, matched, missing | Matched uses success tint and check; missing uses outline and dashed styling; not interactive unless used for filtering |
| Intelligence tag | `.intelligence-tag` | AI label | Cyan dot plus “AI” label for AI-generated values |
| Status chip | Application status classes | Pending, Reviewed, Accepted, Rejected | Semantic colour, icon, and label; same chip on candidate and recruiter screens |
| Navbar | `Navbar.jsx` | Public, candidate, recruiter | Active link underline and primary text; username and score pill; collapses to a menu below 768 px; hidden on recruiter dashboard |
| Sidebar | Recruiter dashboard | Expanded 240 px, collapsed 72 px | Active item uses primary-container fill |
| Modal | Post Job modal | Form modal | Focus trapped, Escape closes, focus returns to trigger, maximum width 640 px |
| Toast | New | Success, error, info | Bottom-right; auto-dismiss after 4 seconds; pause on hover; use `role="status"` |
| Loader | `Loader.jsx`, `.loader` | Spinner, skeleton, AI progress | Skeleton matches final layout; AI progress shows step text |
| Empty state | `.empty-state` | Standard empty state | 48 px icon, title, one sentence, one primary action |
| Chat bubble | Interview conversation | Interviewer, candidate | Interviewer on the left using surface-high; candidate on the right using primary-container |
| Recording control | Interview | Idle, recording, processing | Large 64 px round button; recording uses a pulsing red dot and timer; Space toggles recording |
| Bar chart | Recruiter score distribution | Five buckets | Bars use `--primary`, value labels appear on bars, and axis labels use Label style |

---

# 4. Screen-by-Screen Design Brief

Each screen's purpose, layout, and v1.0 changes are specified below.

## 4.1 Landing Page (`/`)

**Purpose:** Explain the Opportunity Graph in 10 seconds and convert visitors to sign-ups.

**Layout:**

1. Hero with Display L headline, one-line value proposition, **Get Started** primary CTA, and **I'm Hiring** secondary CTA.
2. Problem section.
3. Four-pillar solution grid:
    - Opportunity Registry.
    - Application Graph Engine.
    - Adaptive Search Layer.
    - Application Visibility.
4. Four feature cards:
    - Resume Intelligence.
    - Candidate Ranking.
    - AI Interview Simulator.
    - Smart Job Matching.
5. Four-step “How it works” section.
6. Final CTA.
7. Footer.

**Required for v1.0:**
- Add a product screenshot or animated mock-up of a match badge in the hero.
- Split CTAs by role.
- Add the trust line: “Your resume and videos stay private”.

## 4.2 Sign Up and Login (`/signup`, `/login`)

**Purpose:** Let users create an account or sign in with the correct role.

**Layout:**
- Centred glass card, 440 px wide.
- Two-option segmented control for Candidate and Recruiter instead of a dropdown.
- Form fields.
- Full-width primary button.
- Link to the other authentication page.

**Required for v1.0:**
- Live password checklist: 8+ characters, uppercase, lowercase, and number.
- Show/hide password control.
- “Forgot password?” link.
- Animate the Company field into view when Recruiter is selected.

## 4.3 Candidate Dashboard — Find Jobs (`/candidate`)

**Purpose:** Show the best-fit jobs first.

**Layout:**
1. Greeting hero and four stat cards: Resume Score, Matched Jobs, Applied, Rejected.
2. Three quick-action tiles: My Profile, Applications, AI Interview.
3. Search bar with Filters toggle.
4. Filter row: location, job type, salary, experience.
5. Results header, such as “24 opportunities, sorted by match”.
6. Job card grid: three columns on wide screens, two at 968 px, and one at 768 px.

**Required for v1.0:**
- Replace the “Rejected Jobs” stat with “Accepted” or “In review”.
- Add a no-skills banner.
- Add sorting: Best match / Newest.
- Add pagination.

## 4.4 Job Details (`/job/:id`)

**Purpose:** Help candidates decide whether to apply.

**Layout:**
- Back link.
- Two-column layout:
    - Left: title, company, metadata, match badge, description, and required skills split into “You have” and “You're missing”.
    - Right: sticky Apply card and “About this role” panel.

**Required for v1.0:**
- Show matched and missing skills separately.
- If the profile is incomplete, disable Apply and explain why inline rather than redirecting without warning.
- If the user already applied, display a message such as “Applied on 12 Oct”.

## 4.5 Profile (`/profile`)

**Purpose:** Turn a resume into a strong, accurate profile.

**Layout:**
- Two columns:
    - Left profile card: avatar, name, score ring and label, summary, skills, experience, education, and links.
    - Right panels: Profile Links form, Upload Resume with File/Text toggle and drop zone, and primary Analyse Resume button.

**Required for v1.0:**
- Editable skill tags with add/remove controls.
- Resume score breakdown:
    - Experience: 30%.
    - Skills: 40%.
    - Completeness: 30%.
- Tips for improving the score.
- Upload progress steps.
- “Last updated” timestamp and filename.

## 4.6 Applications (`/applications`)

**Purpose:** Show candidates the status of every application.

**Layout:**
- Header.
- Five stat cards.
- Search and status tabs.
- Application cards sorted newest first.

**Required for v1.0:**
- Use backend statuses: Pending, Reviewed, Accepted, Rejected.
- Add a simple timeline to each card: Applied → Reviewed → Decision.

## 4.7 AI Interview (`/interview`)

**Purpose:** Provide a calm, realistic rehearsal with useful feedback.

### Setup Layout

- Title: “Practice makes perfect”.
- Three interview-type cards with icons and descriptions.
- Three level pills: Entry (green), Mid (amber), Senior (red).
- Consent checkbox.
- Start Interview button.

### Practicing Layout

- Left 60%: video preview, eye-contact meter, and recording control.
- Right 40%: chat transcript, question progress (n/5), and live transcript.
- Per-answer metric card after each answer.
- Submit Answer primary button.

### Feedback Layout

- Large score ring and interview duration.
- Three columns: Strengths, Areas to Improve, Pro Tips.
- Per-question breakdown accordion.
- Practise Again and Dashboard actions.

**Required for v1.0:**
- Pre-flight screen with camera preview, microphone level, and browser support check.
- Clear recording indicator.
- Typed-answer fallback.

## 4.8 Recruiter Dashboard (`/recruiter`)

**Purpose:** Help recruiters triage applicants and manage job postings.

**Layout:** Fixed left sidebar with logo, Overview, Candidates, Job Postings, Post Job, user details, and Logout. The main content changes with the selected view.

### Overview

- “Recruitment Analytics” header.
- KPI row.
- Active Job Performance list.
- Top Ranked Talent, showing three candidates.
- Applicant Score Distribution bar chart.

### Candidates

- Filter bar: minimum/maximum score, skills, and sorting.
- Candidate card grid.

### Job Postings

- Table with title, location, status chip, applicants, posted date, and actions.

### Applicant Panel

- Slide-over panel from the right, replacing the current inline layout.
- Applicants sorted by match, skills, status filter, Accept/Reject controls, and resume download.

**Required for v1.0:**
- Job row actions: Edit, Close, Reopen.
- Bulk selection to reject applicants.
- Keyboard shortcuts A/R for the focused applicant.
- On mobile, replace the sidebar with a bottom tab bar.

## 4.9 System Pages

Add the following pages:
- 404 / Not Found.
- Generic error page.
- Forgot password.
- Reset password.
- Account settings, including change password, delete account, and download my data.

---

# 5. Accessibility, Responsive Behaviour, and Content Voice

## 5.1 Accessibility — WCAG 2.1 AA

| Area | Requirement |
|---|---|
| Contrast | Body text 4.5:1; large text and UI borders 3:1 against their surfaces. Input borders at 20% outline opacity fail 3:1; raise to approximately 40% or use `#3a4560`. |
| Keyboard | Every action reachable by Tab. Job cards must be links or buttons, not clickable `<div>` elements. Escape closes modals. All interactive elements have visible focus rings. |
| Screen readers | Use header, nav, and main landmarks. Icon-only buttons need `aria-label`. Match badges should read, for example, “84 percent match, 7 of 9 skills”. Use live regions for toasts, AI progress, and transcript updates. |
| Forms | Visible labels linked with `for`/`id`; errors linked through `aria-describedby`; no placeholder-only fields. |
| Media | Interview questions appear as text and may optionally be read aloud. Announce recording state. Eye contact must never be required to complete an interview. |
| Motion | Honour `prefers-reduced-motion`. |
| Touch targets | Minimum 44 × 44 px. |
| Charts | Provide a text or table alternative for score distribution. |

## 5.2 Responsive Breakpoints

| Width | Behaviour |
|---|---|
| ≥ 1200 px | Full layout, three-column job grid, expanded recruiter sidebar |
| 968–1199 px | Two-column job grid; job details right panel narrows to 320 px |
| 768–967 px | Single-column detail pages; recruiter sidebar collapses to icons |
| < 768 px | Navbar becomes a menu button; stat cards use a 2 × 2 grid; job grid becomes one column; recruiter sidebar becomes bottom tabs; interview stacks video above chat |
| < 480 px | 16 px side gutters; buttons full width; tables become stacked cards |

The CSS currently mixes 992, 968, 768, 600, and 480 px breakpoints. Standardise on **1200 / 968 / 768 / 480 px**.

## 5.3 Content Voice and Microcopy

Use clear, encouraging, specific language.

| Moment | Write | Avoid |
|---|---|---|
| Match badge tooltip | “You have 7 of 9 skills. Missing: Docker, AWS.” | “Great fit!” |
| Incomplete profile | “Add your resume to apply. It takes about a minute.” | “Error: resume required” |
| Parse success | “We found 18 skills. Check them and remove any that are wrong.” | “Profile updated successfully! Skills extracted by AI.” |
| Rejection | “Not selected this time” | “Rejected” in red capitals |
| AI fallback | “Basic feedback (AI is busy right now)” | Silently presenting generic tips as personalised |
| Duplicate application | “You applied on 12 Oct. We'll show updates here.” | “409 Conflict” |

Use sentence case for all headings and buttons, numerals for every number, and Indian-English spelling consistently.

---

# 6. Current UX Issues and Required Deliverables

## 6.1 Issues Found in the Code

| ID | Screen | Issue | Recommendation |
|---|---|---|---|
| U1 | All | Score colours and labels differ by screen. Candidate dashboard uses 70/40 thresholds with grey; recruiter uses 85/70/55/40 with “Strong”/“Fair”; scoring service uses “Very Good”/“Average”. | Use one shared score scale from Section 2.1 in a `scoreScale.js` helper. |
| U2 | Applications | Status tabs (Applied, In Review, Interview) do not match real statuses, so counts show 0. | Use Pending, Reviewed, Accepted, Rejected. |
| U3 | Job details, recruiter | Browser `alert()` is used for login prompts, validation, and success. | Replace with inline messages and toasts. |
| U4 | Find Jobs | Search and filters appear functional but do nothing. | Hide until connected or implement backend support. |
| U5 | Find Jobs | “Rejected Jobs” appears as a headline stat. | Replace with “In review” or “Accepted”. |
| U6 | Job card | The entire card is a clickable `<div>`, which is not keyboard-accessible. | Wrap it in a link. |
| U7 | Job details | Apply redirects to Profile without warning. | Explain the missing field in the Apply panel first. |
| U8 | Match badge | Badge is hidden when score is 0, making “no match” and “no profile” look identical. | Show “0% match” versus “Add resume to see match”. |
| U9 | Interview | Submission is blocked unless voice was recorded, with no fallback for unsupported browsers. | Add a pre-flight check and typed-answer fallback. |
| U10 | Global | Inter is loaded in HTML while CSS uses Manrope. | Keep Manrope only. |
| U11 | Global | More than 15 font sizes, five breakpoints, and inconsistent radii (8/10/12/16/20 px). | Consolidate to the scales in Section 2. |
| U12 | Global | No 404 page. | Add a Not Found screen. |
| U13 | Profile | Extracted skills cannot be corrected. | Add editable skill tags. |
| U14 | Recruiter | Navbar is hidden, but the sidebar has no mobile navigation. | Add a bottom tab bar below 768 px. |

## 6.2 Design Deliverables for v1.0

- [ ] Token file covering colours, typography, spacing, radius, and motion, exported to Figma variables and matching `index.css`.
- [ ] Figma component library covering every component in Section 3, including all states.
- [ ] High-fidelity desktop and mobile frames for all nine screens and the system pages.
- [ ] Empty, loading, and error variants for every screen, following the App Flow Document, Section 7.
- [ ] Interactive candidate prototype: sign up → upload resume → apply.
- [ ] Interactive recruiter prototype: post job → review applicants → accept.
- [ ] Interview pre-flight, recording, and feedback prototype.
- [ ] Accessibility annotations covering focus order, labels, and contrast checks.
- [ ] Usability testing with five candidates and three recruiters, followed by a findings summary.

## 6.3 Open Design Questions

1. Should v1.1 offer a light theme, or should Jobby remain dark-only?
2. Should recruiters see the resume score by default, or only the match percentage for each job?
3. Should candidates see their rank among applicants for a job?

---

# 7. Implementation Summary

The v1.0 design work should prioritise consistency, clarity, accessibility, and functional user journeys.

The main priorities are:

1. Establish the shared design tokens and score scale.
2. Standardise typography, spacing, radii, breakpoints, and motion.
3. Build a consistent component library with complete interaction states.
4. Make candidate matching and application status easy to understand.
5. Improve recruiter applicant review and job management.
6. Make AI interview recording, feedback, and fallback behaviour clear.
7. Add missing system pages and meaningful empty, loading, and error states.
8. Validate desktop and mobile experiences through usability testing.

The overall goal is to make Jobby feel like a calm, transparent career workspace: candidates understand their fit and next steps, while recruiters can review relevant applicants quickly and confidently.
