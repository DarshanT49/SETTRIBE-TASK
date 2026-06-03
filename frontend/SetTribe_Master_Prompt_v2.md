# SetTribe — Master System Prompt v2
## Employee Task, Meeting & Interview Management System
### Complete Flow with All Features

---

> **Tech Stack:** React 18 + Vite · React Router DOM v6 · Tailwind CSS (dark/light class strategy) · Context API · localStorage (all persistence) · @dnd-kit/core (Kanban D&D) · date-fns · uuid · Recharts · React Hot Toast · Lucide React Icons · Framer Motion · WebRTC (native browser API for video calling)

---

## ═══════════════════════════════════════
## SECTION 1 — ROLES & PERMISSION MATRIX
## ═══════════════════════════════════════

| Permission | Admin | HR | Manager | Employee | Intern | Panel |
|------------|:-----:|:--:|:-------:|:--------:|:------:|:-----:|
| Approve registration requests | ✓ | ✓ | — | — | — | — |
| Add/Edit/Deactivate employee | ✓ | — | — | — | — | — |
| View employee directory | ✓ | ✓ | ✓ | — | — | ✓ |
| Create project | ✓ | — | ✓ | ✓ (owner) | — | — |
| Assign project owner | ✓ | — | ✓ | — | — | — |
| Add team members | ✓ | — | ✓ | ✓ (owner) | — | — |
| Upload SRS / project docs | ✓ | — | ✓ | ✓ (owner) | — | — |
| Add client requirement changes | ✓ | — | ✓ | ✓ (owner) | — | — |
| Add / manage milestones | ✓ | — | ✓ | ✓ (owner) | — | — |
| Lock / delay milestone | System auto | — | — | ✓ (owner) | — | — |
| Create task (in project) | ✓ | — | ✓ | ✓ (owner/delegated) | ✓ (lead) | — |
| Assign task to intern/employee | ✓ | — | ✓ | ✓ (owner/delegated) | ✓ (lead) | — |
| Update own task status | ✓ | — | ✓ | ✓ | ✓ | — |
| Approve / reject task | ✓ | — | ✓ | ✓ (owner/lead) | — | — |
| Create self-task | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Schedule meeting | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Host meeting (standup / notes) | ✓ | ✓ | ✓ | ✓ | — | — |
| Assign task inside meeting | ✓ | — | ✓ | ✓ (owner) | — | — |
| Schedule interview | ✓ | ✓ | — | — | — | — |
| Admit candidate to interview | — | — | — | ✓ (interviewer) | — | ✓ |
| Evaluate candidate (live score) | ✓ | — | ✓ | ✓ (interviewer) | — | ✓ |
| View all notifications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View reports | ✓ (all) | ✓ (HR) | ✓ (team) | ✓ (own) | — | — |

---

## ═══════════════════════════════════════
## SECTION 2 — DATA LAYER (localStorage Schema)
## ═══════════════════════════════════════

```js
users[]                 → { id, name, employeeId, email, mobile, department, role,
                              isActive, isApproved, approvedBy, approvedAt, createdAt, profilePhoto }

registrationRequests[]  → { id, userId, status (pending|approved|rejected),
                              requestedAt, reviewedBy, reviewedAt, rejectionReason }

sessions{}              → { currentUserId, token }

projects[]              → { id, title, description, clientName, category, priority,
                              status, ownerId, managerId, teamIds[], startDate, endDate,
                              deadline, technologies[], repoLink, tags[], progress,
                              srsDocuments[], createdAt }

projectRequirements[]   → { id, projectId, version, title, description, addedBy,
                              addedAt, type (initial|change_request), clientChangeNote }

milestones[]            → { id, projectId, title, description, targetDate, actualDate,
                              status (upcoming|active|locked|delayed|completed),
                              isLocked, delayDays, delayReason, delayedAt,
                              rescheduledDate, completionPct, order }

sprints[]               → { id, projectId, name, goal, startDate, endDate, status }

tasks[]                 → { id, projectId, milestoneId, sprintId, title, description,
                              priority, assigneeIds[], creatorId, assignedBy,
                              status, startDate, dueDate, attachments[],
                              comments[], activityLog[], delayReason, newDueDate,
                              isDelayed, createdAt }

selfTasks[]             → { id, userId, title, description, date, time,
                              reminder, reminderOffset, status }

meetings[]              → { id, title, agenda, date, time, duration, hostId,
                              participantIds[], type (standup|project|hr|interview|general),
                              meetingMode (internal|external), externalLink, projectId,
                              status, chatLogs[], standupLogs[], taskAssignedInMeeting[],
                              attendanceLogs[], joinRequests[] }

meetingRsvps[]          → { meetingId, userId, status (attending|declined|no_response),
                              reason, timestamp }

interviews[]            → { id, candidateName, mobile, email, referredBy, position,
                              interviewType, date, time, link, interviewerId,
                              status (scheduled|waiting|admitted|ongoing|completed|cancelled),
                              token, notes, resumeFileName, candidatePortalStatus }

evaluations[]           → { id, interviewId, interviewerId, skills{}, strengths,
                              weaknesses, remarks, recommendation, finalStatus, isLocked,
                              submittedAt }

notifications[]         → { id, userId, type, title, message, isRead,
                              createdAt, relatedId, relatedType }

projectHistory[]        → { id, projectId, action, performedBy, targetId,
                              targetType, details, timestamp }

taskHistory[]           → { id, taskId, projectId, action, performedBy,
                              fromStatus, toStatus, details, timestamp }
```

**Seed Data (first load if `localStorage.seeded !== true`):**
- 6 users: Admin · HR · Manager · Employee · Intern · Panel (all pre-approved)
- 2 projects (1 active with milestones, 1 completed)
- 6 tasks across both projects
- 2 upcoming meetings (1 standup, 1 project discussion)
- 1 scheduled interview with resume
- 10 sample notifications per user

---

## ═══════════════════════════════════════
## SECTION 3 — APPLICATION ROUTES
## ═══════════════════════════════════════

```
/                           → redirect to /dashboard (if logged in) else /login
/login                      → Login page
/register                   → Registration page (triggers approval request)
/forgot-password            → Forgot password flow

/dashboard                  → Role-aware dashboard

/employees                  → Employee directory (Admin, HR, Manager, Panel)
/employees/pending          → Pending registration approvals (Admin + HR only)
/employees/:id              → Employee profile

/projects                   → Project listing
/projects/new               → Create project
/projects/:id               → Project detail (tabs)
/projects/:id/edit          → Edit project
/projects/:id/tasks         → Project-specific task board (Kanban)
/projects/:id/requirements  → Project SRS & requirements

/tasks                      → My Tasks (personal task list across all projects)
/self-tasks                 → Personal to-do board

/meetings                   → Meeting list / calendar
/meetings/new               → Schedule meeting
/meetings/:id               → Meeting detail + RSVP
/meetings/:id/room          → In-app video call room (WebRTC, 300+ users)

/interviews                 → Interview list
/interviews/new             → Schedule interview (HR + Admin)
/interviews/:id             → Interview detail + live evaluation
/candidate/:token           → Public candidate portal (no auth, wait room)

/notifications              → Full notification list
/profile                    → Current user profile + settings
/reports                    → Analytics & reports
```

---

## ═══════════════════════════════════════════════════════
## SECTION 4 — MODULE-BY-MODULE DETAILED FLOW
## ═══════════════════════════════════════════════════════

---

## ▌MODULE 1 — AUTHENTICATION & REGISTRATION APPROVAL

### `/login` — All Users
**Fields:**
| Field | Type | Validation |
|-------|------|-----------|
| Email / Employee ID | text | required |
| Password | password + show/hide | required, min 8 chars |
| Remember Me | checkbox | stores session |

- Forgot Password link
- Demo Login section: 6 role buttons → auto-fill + login
- On submit: check `users[]` → check `isApproved: true` → if pending → show "Your account is pending admin/HR approval"
- Generate `btoa(userId + Date.now())` token → store in `sessions{}`

---

### `/register` — New User Registration
**Fields:**
| Field | Type | Rules |
|-------|------|-------|
| Full Name | text | required |
| Employee ID | text | required, unique |
| Email | email | required, unique, valid format |
| Mobile Number | tel | required, 10-digit |
| Password | password | min 8 chars, 1 uppercase, 1 number |
| Confirm Password | password | must match |
| Department | dropdown | Engineering / Design / QA / HR / Management |
| Role | dropdown | Employee / Intern / Interview Panel |

> ⚠️ **Admin and HR roles cannot be self-registered — Admin assigns those manually.**

**On Submit:**
1. Validate uniqueness of email + employeeId
2. Create user record with `isApproved: false`, `isActive: false`
3. Create `registrationRequests[]` entry with `status: pending`
4. Send notification to **ALL Admin and HR users**: "New registration request from [Name] — [Role] — [Department]"
5. Show success message: "Registration submitted. Please wait for admin/HR approval."
6. Do NOT auto-login

---

### `/employees/pending` — Registration Approvals (Admin + HR)
**List of pending requests:**
| Column | Data |
|--------|------|
| Name | user's full name |
| Employee ID | their ID |
| Email | email |
| Role | requested role |
| Department | department |
| Submitted At | relative time |
| Actions | Approve / Reject buttons |

**Approve:**
- Set `isApproved: true`, `isActive: true`, `approvedBy: currentUserId`, `approvedAt: now`
- Update `registrationRequests[].status = 'approved'`
- Send notification to the registered user: "Your account has been approved. You can now log in."

**Reject:**
- Modal: Rejection Reason (textarea, required)
- Set `registrationRequests[].status = 'rejected'`, store reason
- Notify user: "Your registration was not approved. Reason: [reason]"

---

### Protected Routes
- `<AuthGuard>` — checks `sessions.currentUserId`, redirects to `/login` if absent
- `<RoleGuard allowedRoles={[]}>` — shows "403 Access Denied" page if role mismatch
- `<ApprovalGuard>` — redirects to waiting screen if `isApproved: false`

---

## ▌MODULE 2 — LAYOUT & NAVIGATION

### Sidebar (Desktop, 240px, collapsible to icon-only)
- Logo at top
- Nav links with icon + label, grouped by section
- Active link highlighted
- User avatar + name + role badge at bottom
- Logout button

**Dynamic Sidebar Links by Role:**

| Link | Admin | HR | Manager | Employee | Intern | Panel |
|------|:-----:|:--:|:-------:|:--------:|:------:|:-----:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pending Approvals | ✓ | ✓ | — | — | — | — |
| Employee Directory | ✓ | ✓ | ✓ | — | — | ✓ |
| Projects | ✓ | — | ✓ | ✓ | ✓ | — |
| My Tasks | ✓ | — | ✓ | ✓ | ✓ | — |
| My To-Dos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Meetings | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Interviews | ✓ | ✓ | ✓ | ✓(panel) | — | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓(own) | — | — |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Profile | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Top Bar
- Hamburger → slide-in drawer (mobile)
- Notification bell with unread count badge
- Dropdown: last 10 unread notifications
- "Mark all read" button
- Dark/Light mode toggle
- User avatar → profile dropdown (Profile / Logout)

---

## ▌MODULE 3 — DASHBOARDS (Role-Aware)

### Admin Dashboard
**Stat Cards:** Total Employees · Pending Approvals · Active Projects · Pending Tasks · Meetings Today · Interviews This Week

**Charts:** Tasks/week bar · Task status pie · Employee productivity line · Project progress

**Panels:** Recent activity feed (system-wide) · Delayed milestones alert · Quick Actions (Add Employee, Create Project, Schedule Meeting, Schedule Interview)

---

### HR Dashboard
**Stat Cards:** Total Employees · Pending Approvals · Upcoming Interviews · Pending Evaluations · Meetings Today

**Panels:** Pending registration requests (top 3 with Approve/Reject) · Today's interviews · Upcoming meetings

---

### Manager Dashboard
**Stat Cards:** Team Tasks · Pending Reviews · Upcoming Meetings · My Projects

**Panels:** Team member task completion rates · Active milestones progress · Upcoming meetings · My self-tasks

---

### Employee Dashboard
**Stat Cards:** My Open Tasks · Overdue Tasks · Upcoming Meetings · Completed This Week

**Panels:** My active project cards (with milestone progress) · Upcoming meetings · My self-tasks · ⚠️ Overdue task alert banner

---

### Intern Dashboard
Same as Employee (limited to assigned projects/tasks only)

---

### Panel Dashboard
**Stat Cards:** Assigned Interviews · Pending Evaluations · Completed Evaluations · Today's Interviews

**Panels:** Today's assigned interviews · Pending evaluation list

---

## ▌MODULE 4 — EMPLOYEE MANAGEMENT

### `/employees` — Directory (Admin, HR, Manager, Panel)

**Search & Filter:**
- Search: name / email / employee ID
- Status chips: All / Active / Inactive / Pending Approval
- Role filter, Department filter
- Grid / List / Table view toggle

**Employee Card:** Avatar · Name · Role badge · Department · Email · Status dot

**Admin-only "Add Employee" button → Modal:**
| Field | Type |
|-------|------|
| Full Name | text |
| Employee ID | text |
| Email | email |
| Mobile | tel |
| Department | dropdown |
| Role | dropdown (ALL roles) |
| Password | password |
| Status | Active / Inactive toggle |

---

### `/employees/:id` — Employee Profile

**Header:** Large avatar · Name · Role badge · Department · Email · Mobile · Employee ID · Join date · Status toggle (Admin only)

**Tabs:**

**Tab 1 — Overview:**
- Assigned projects (chip cards)
- Task completion stats bar
- Recent activity (last 10 entries from their history)

**Tab 2 — Tasks:**
- All tasks assigned to this employee across all projects
- Columns: Task Title · Project · Priority · Status · Due Date · Assigned By
- Filter by status / project

**Tab 3 — Meetings:**
- Meetings attended
- Columns: Title · Date · Host · Type · RSVP Status
- Filter: Upcoming / Past

**Tab 4 — Edit (Admin only):**
- Editable: Name · Email · Mobile · Department · Role · Employee ID
- Save → update localStorage + toast

---

## ▌MODULE 5 — PROJECT MANAGEMENT

### `/projects` — Project Listing

**Filter Bar:** Search · Status · Priority · Owner · Lead · Date Range · Grid/Table toggle

**Project Card:** Title · Client · Priority badge · Status badge · Owner chip · Team size · Milestone progress bar · Completion % · Tags

---

### `/projects/new` — Create Project (Admin, Manager, Employee)

**Section 1 — Basic Info:**
| Field | Type | Rules |
|-------|------|-------|
| Project Name | text | required |
| Description | textarea | required |
| Client Name | text | optional |
| Category | dropdown | Web / Mobile / Internal / R&D / Other |
| Priority | dropdown | Low / Medium / High / Critical |
| Status | dropdown | Planning / Active |
| Start Date | date | required |
| End Date | date | required, after Start |
| Deadline | date | optional hard deadline |
| Tags | tag input | optional |
| Technology Stack | multi-tag | optional |
| Repository Link | URL | optional |

**Section 2 — Team:**
| Field | Type | Rules |
|-------|------|-------|
| Project Owner | dropdown | Employee / Manager role only |
| Project Manager | dropdown | Manager role only |
| Team Members | multi-select | all active approved users |

**Section 3 — SRS & Documents:**
| Field | Type |
|-------|------|
| Upload SRS Document | file input (store filename + uploader + date) |
| Upload Additional Docs | file input (multiple) |
| Initial Requirements Summary | rich textarea |

**Section 4 — Milestones (add at creation time):**
- Dynamic "Add Milestone" rows:
  | Field | Type |
  |-------|------|
  | Milestone Title | text |
  | Description | textarea |
  | Target Date | date |
  | Order | auto-numbered |
- Can add multiple milestones before submitting

**On Submit:**
- Create project record
- Create milestones (first milestone gets `status: active`, `isLocked: false`; rest get `status: upcoming`)
- Create `projectRequirements[]` initial entry
- Notify all team members: "You've been added to project [name]"
- Notify project owner: "You are the owner of project [name]"
- Redirect to `/projects/:id`

---

### `/projects/:id` — Project Detail (7 Tabs)

**Header:** Title · Status badge · Priority badge · Owner chip · Manager chip · Progress % · "Edit" button (Admin/Owner/Manager)

---

#### Tab 1 — Overview

**Project Info Card:**
- Description, Client name, Category
- Tech stack tags, Repo link button
- Start date, End date, Deadline
- Current active milestone indicator

**Team Roster:**
- Cards: avatar · name · role badge · "Task Assignment Rights" toggle (Owner/Manager can toggle for each member)
- Owner can toggle "Team Lead" for Interns → changes their `role` to `intern-lead` in project context
- Remove member button (Owner/Manager/Admin)
- "Add Member" button

**Quick Stats:** Total Tasks · Open Tasks · Overdue Tasks · Meetings Count · Milestones Completed

---

#### Tab 2 — Requirements & SRS

**Initial Requirements section:**
- Displays `projectRequirements[]` where `type: initial`
- Summary text, uploaded SRS filename (download link)
- Upload date + uploaded by

**Client Change Requests section:**
- List of all `projectRequirements[]` where `type: change_request`
- Each entry: Version number · Title · Description · Client change note · Added by · Added at

**"Add Change Request" button (Owner/Manager/Admin):**
| Field | Type |
|-------|------|
| Title | text (required) |
| Description | textarea (required) |
| Client Change Note | textarea (what the client wants changed) |
| Supporting Documents | file input |

- On submit: append to `projectRequirements[]` with `type: change_request`, notify all team members

---

#### Tab 3 — Milestones

**Business Logic:**
> - First milestone starts as **Active** when project is created
> - Once a milestone becomes **Active → it is LOCKED** (targetDate cannot be changed)
> - If milestone not completed by targetDate → Owner/Manager clicks "Mark as Delayed"
> - Delayed flow: enter reason + number of days delayed
> - System auto-pushes all **subsequent (upcoming)** milestones' targetDate by same days
> - When delayed milestone is marked complete → next milestone becomes Active → gets LOCKED
> - **No milestone's locked targetDate can be extended under any circumstance**

**Vertical Timeline View:**
Each milestone shows:
- Order number · Stage name · Target date
- Status indicator: 🔵 Upcoming · 🟡 Active (locked) · 🔴 Delayed · ✅ Completed
- 🔒 Lock icon if `isLocked: true`
- Completion %
- Delay info (if delayed: reason + days delayed shown in red)

**"Add Milestone" button (Owner/Manager/Admin) — only for upcoming milestones:**
| Field | Type |
|-------|------|
| Milestone Title | text (required) |
| Description | textarea |
| Target Date | date (required) |

**Milestone Three-dot Menu:**
- **Mark Complete** (Active milestones only) → set `status: completed`, `actualDate: today`, unlock + activate next milestone (lock it), log to `projectHistory[]`
- **Mark as Delayed** (Active milestones where targetDate has passed) → Modal:
  | Field | Type |
  |-------|------|
  | Delay Reason | textarea (required) |
  | Number of Days Delayed | number (required) |
  → Set `status: delayed`, store reason + days, auto-reschedule all subsequent milestones, show toast: "Delayed by N days. X milestones rescheduled.", notify all team members
- **Edit** (Upcoming milestones only — not locked)
- **Delete** (Upcoming milestones only)

---

#### Tab 4 — Tasks (Project Kanban)

> ⚠️ Tasks are **project-specific** — this board shows ONLY tasks belonging to this project. The global `/tasks` page shows only "My Tasks" across all projects for the logged-in user.

**Kanban Columns:**
`Backlog → Todo → In Progress → In Review → Testing → Done → Changes Requested`

**Filter Bar (above board):**
- Filter by Assignee (team members only) · Priority · Sprint · Milestone · Date Range

**"Add Task" button (Owner / Manager / Admin / delegated member):**
| Field | Type | Rules |
|-------|------|-------|
| Task Title | text | required |
| Description | textarea | required |
| Milestone | dropdown | from project's milestones |
| Sprint | dropdown | from project's sprints (optional) |
| Assign To | multi-select | team members only |
| Assigned By | auto-filled | current user |
| Priority | dropdown | Low / Medium / High / Critical |
| Start Date | date | required |
| Due Date | date | required |
| Attach Files | file input | store filename + size |
| Tags | tag input | optional |

**On Task Create:**
- Push to `tasks[]`
- Notify each assignee: "New task assigned: [title] — Due: [date] — By: [assignedBy]"
- Log to `taskHistory[]`: `{ action: 'created', performedBy, assigneeIds, details }`
- Log to `projectHistory[]`

**Task Card shows:**
- Title · Assignee avatar chips · Priority badge · Due date (red if overdue) · Sprint tag · Comment count · Attachment count

**Drag card to column → update `tasks[].status` → toast + log to `taskHistory[]`**

**Task Card Click → Detail Slide-over:**

| Section | Content |
|---------|---------|
| Header | Title · Priority badge · Status badge |
| Description | Full description text |
| Assignees | Avatar list with names |
| Assigned By | Name + date |
| Dates | Start date · Due date |
| Milestone | Linked milestone name |
| Attachments | File list with names |
| Comments | Threaded comments (add comment → stored in `tasks[].comments[]`) |
| Activity Timeline | Full `taskHistory[]` for this task: who moved it, who commented, who uploaded, status changes with timestamps |
| Actions (Owner/Lead/Manager) | Approve / Reject / Request Changes buttons |
| Delay Reason (if task overdue + not done) | Employee/Intern sees "Submit Delay Reason" button |

**Task Delay Reason Modal (triggered when task is overdue + not completed):**
| Field | Type |
|-------|------|
| Reason for delay | textarea (required) |
| New Expected Due Date | date (required) |
→ Store in `tasks[].delayReason` + `tasks[].newDueDate`, log to `taskHistory[]`, notify Owner/Manager

---

#### Tab 5 — Meetings

- List of meetings linked to this project
- Columns: Title · Date · Host · Participants · Type · Status
- "Schedule Meeting" button → pre-fills Project name in meeting form
- Filter: Upcoming / Past

---

#### Tab 6 — Files

- All documents uploaded to this project (SRS + task attachments + change request docs)
- Table: Filename · Type · Uploaded by · Date · Size · Download icon
- "Upload File" button → file input → store metadata only

---

#### Tab 7 — Project History (Audit Trail)

> Full chronological log of everything that happened in this project

**Each entry shows:**
- Actor avatar + name
- Action description (e.g., "Assigned task 'Fix login bug' to @John")
- Target (task name / milestone name / member name)
- Timestamp (date + time)

**Filter by type:**
- Member Added/Removed · Task Created · Task Assigned · Task Status Changed · Milestone Added · Milestone Delayed · Milestone Completed · Requirement Changed · File Uploaded · Meeting Scheduled · Sprint Created

---

### `/tasks` — My Tasks Page (Personal, all roles except HR/Panel)

> This is NOT the project Kanban. This shows only tasks assigned TO the current logged-in user, across all projects.

**List/Table view:**
- Columns: Task Title · Project · Priority · Status · Due Date · Assigned By · Milestone
- Filter: Status / Priority / Project / Date Range
- Click → goes to that project's task detail slide-over

---

## ▌MODULE 6 — SELF TASKS (`/self-tasks`)

**Layout:** Two columns — "To Do" | "Done"

**Filter:** Search · Today / Upcoming / Completed / Overdue

**"Add To-Do" button → Modal:**
| Field | Type |
|-------|------|
| Task Title | text (required) |
| Description | textarea |
| Date | date |
| Time | time |
| Reminder Toggle | on/off |
| Reminder Offset | 5 min / 10 min / 30 min / 1 hour / 1 day before |

**Each card:** Title · Due date · Description snippet · Checkbox (mark done) · Edit · Delete

**Reminder engine:** `setInterval()` every 30s → if reminder time passed → browser notification + in-app toast

---

## ▌MODULE 7 — MEETING MANAGEMENT

### Business Rules
- **Anyone** (all roles) can schedule a meeting
- **Anyone** can request to join a meeting (even if not invited)
- Meeting types determine the host's in-meeting tools

---

### `/meetings` — List Page (All Roles)

**Toggle:** List view ↔ Calendar grid (month view with colored dots per meeting type)

**Filter Bar:** Search · Upcoming/Past/My Meetings · Type · Status

**Meeting Row:** Title · Date+Time · Host · Duration · Type badge · Status badge · My RSVP status chip

**"Schedule Meeting" button**

---

### `/meetings/new` — Schedule Meeting (All Roles)

**Fields:**
| Field | Type | Rules |
|-------|------|-------|
| Meeting Title | text | required |
| Agenda | textarea | required |
| Date | date | required |
| Time | time | required |
| Duration | dropdown | 15min / 30min / 1hr / 1.5hr / 2hr / Custom |
| Meeting Type | dropdown | Standup / Project Discussion / HR / Interview / General |
| Participants | multi-select | Specific users / Entire Department / Team Members / All |
| Meeting Mode | radio | Internal Video Call / External Link |
| External Link | URL (conditional) | shown if External selected |
| Project (optional) | dropdown | links meeting to a project |
| Allow Join Requests | toggle | if ON, non-invited users can request to join |

**On Submit:**
- Create meeting in `meetings[]`, notify all participants: "You've been invited to: [title] on [date] at [time]"

---

### `/meetings/:id` — Meeting Detail

**Meeting Info Card:**
- Title · Agenda (full) · Host avatar+name · Date · Time · Duration · Type badge · Mode badge

**Participant List with RSVP status:**
- ✅ Attending · ❌ Declined (reason shown) · ⬜ No Response

**"Can't Attend" button (for participants):**
| Field | Type |
|-------|------|
| Reason | dropdown: Personal Emergency / Sick Leave / Network Issue / Other |
| Additional Notes | textarea |
→ Update `meetingRsvps[]`, notify host: "[Name] cannot attend — Reason: [reason]"

**"Request to Join" button (for non-invited users, if allow join requests is ON):**
- Adds join request to `meetings[].joinRequests[]`
- Notifies host: "[Name] has requested to join your meeting"

**For Host:**
- See who declined + reasons
- See join requests → Approve / Reject each
- "Start Meeting" button (enabled 15 min before scheduled time)
- Attendance tracking table (after meeting ends): Present / Late / Absent / Excused

---

### `/meetings/:id/room` — Video Call Room (WebRTC, 300+ users)

> **Architecture Note:** For 300+ users, use SFU (Selective Forwarding Unit) pattern. Each participant sends one stream to the server which forwards to all. Simulate with WebRTC + a signaling layer. For the localStorage demo, simulate participants with avatar tiles. Real getUserMedia() for actual camera/mic.

**Layout:** Full-screen dark room

**Video Grid:**
- Current user tile (real camera if enabled, else large avatar)
- Other participants: simulated tiles with avatars + name labels
- Active speaker highlighted (animated border)
- Pinned view: click any tile to pin/focus

**Bottom Control Bar (centered, floating):**
| Control | Action |
|---------|--------|
| Mute / Unmute mic | toggle icon state |
| Camera On/Off | show camera feed or avatar tile |
| Screen Share | `getDisplayMedia()` API |
| Emoji Reactions | popover emoji grid → selected emoji floats on screen for 3s |
| Raise Hand | toggles 🙋 icon on your tile |
| Background Filter | None / Blur (CSS `filter: blur()`) / Virtual background colors |
| Meeting Timer | elapsed time display |
| Copy Invite Link | copies URL to clipboard |
| Grid Layout | 2x2 / 3x3 / Speaker view toggle |
| Fullscreen | toggle browser fullscreen |
| End / Leave | red button → confirmation modal → navigate back |

**Right Side Panel (collapsible, toggle button):**

*Participants Tab:*
- Full participant list with: Host badge · Muted icon · Active speaker dot · Raised hand icon
- **Host-only controls per participant:** Mute / Remove / Admit (for join requests)

*Chat Tab:*
- Message list with sender name + timestamp
- Message input + emoji picker
- All chat stored in `meetings[].chatLogs[]`

---

**Meeting Type — Special In-Meeting Tools:**

### Standup Meeting (Host Tools Only)
"📋 Standup Mode" floating button → opens right panel in standup form mode:

For each intern/employee participant, a structured form:
| Field | Type |
|-------|------|
| Yesterday's Work | textarea |
| Today's Plan | textarea |
| Blockers | textarea |
| Project Worked On | dropdown (from projects) |
| Tasks Completed | text |

"Log Stand-up" button → stores in `meetings[].standupLogs[]` with userId + timestamp
All standup logs are visible to host + admin + manager after meeting

---

### Project Discussion Meeting (Host/Owner Tools)
"➕ Assign Task" floating button → mini task form inside meeting:
| Field | Type |
|-------|------|
| Task Title | text (required) |
| Description | textarea |
| Assign To | multi-select (from meeting participants only) |
| Project | dropdown |
| Priority | dropdown |
| Due Date | date |

→ On save: creates task in `tasks[]`, sends notification, stores in `meetings[].taskAssignedInMeeting[]`

---

### General / HR Meeting
Standard controls only — no special panels.

---

## ▌MODULE 8 — INTERVIEW MANAGEMENT

### Business Logic
- Only **Admin + HR** can schedule interviews
- Candidate receives a link → visits `/candidate/:token` → waits in lobby
- Interviewer **Admits** the candidate → interview starts
- Interviewer scores candidate **live during the interview** (not after)
- System generates and **simulates sending an email** to the candidate

---

### `/interviews` — Interview List

**Table columns:** Candidate Name · Position · Date & Time · Type · Interviewer · Status badge

**Filter:** Status · Date Range · Interviewer · Position

**"Schedule Interview" button (Admin + HR only)**

---

### `/interviews/new` — Schedule Interview

**Fields:**
| Field | Type | Rules |
|-------|------|-------|
| Candidate Name | text | required |
| Mobile Number | tel | required |
| Email | email | required |
| Referred By | text | optional |
| Position Applied For | dropdown or text | required |
| Interview Type | dropdown | Technical / HR Round / Final Round |
| Interview Date | date | required |
| Interview Time | time | required |
| Assigned Interviewer | dropdown | Employee / Manager / Panel users only |
| Meeting Link | text | external Jitsi/Meet URL OR use internal portal |
| Upload Resume | file input | store filename + uploader |
| Notes for Interviewer | textarea | optional |

**On Submit:**
1. Create interview record in `interviews[]`
2. Generate unique UUID token → construct candidate link: `window.location.origin/candidate/[token]`
3. Show email preview modal:
   ```
   To: [candidate email]
   Subject: Interview Invitation — [Position] at SetTribe
   Body:
   Dear [Name],
   You have been scheduled for a [Type] interview for the position of [Position].
   Date: [date] | Time: [time]
   Please click the link below to join your interview portal:
   [candidate portal link]
   Please join 5 minutes early and ensure your camera/mic are ready.
   Regards, SetTribe HR Team
   ```
4. Push notification to interviewer: "You have an interview scheduled with [Candidate] on [date] at [time]"

---

### `/interviews/:id` — Interview Detail

**Candidate Info Card:**
- Name · Email · Mobile · Position · Referred By
- Interview type · Date & Time
- Interviewer chip (name + avatar)
- Status badge
- Resume download button (filename link)
- Candidate portal link (one-click copy)

**Action Buttons (Admin/HR):** Edit Details · Cancel Interview · Mark as Completed

---

**Evaluation Section (Interviewer + Admin — enabled when interview status = admitted/ongoing/completed):**

> Interviewers score the candidate **live during the interview**, not just after.

**Skill Rating Table (0–5 interactive dots/stars per skill):**

| Category | Skills |
|----------|--------|
| Frontend | HTML/CSS · JavaScript · React / Angular |
| Backend | Java · Spring Boot · Python |
| Database | SQL |
| Testing | Manual Testing · Automation Testing |
| Cloud & DevOps | AWS / Azure |
| Soft Skills | Communication · Problem Solving |

**Additional Fields:**
| Field | Type |
|-------|------|
| Strengths | textarea |
| Weaknesses | textarea |
| Remarks | textarea |
| Recommendation | dropdown: Strong Hire / Hire / Maybe / Reject |
| Final Status | selector: Free Mode / Mentor Mode / Not Selected |

**Save Evaluation** → update `evaluations[]` → lock form (`isLocked: true`) — only Admin can unlock
**Auto-save every 30 seconds** during live interview (saves to localStorage without locking)

---

### `/candidate/:token` — Public Candidate Portal (No Auth)

**Flow:**
1. Read token from URL → lookup `interviews[]`
2. If invalid/cancelled → error card: "This interview link is invalid or has expired"
3. If valid → show:

**Waiting Room (before admitted):**
- SetTribe logo + "Interview Portal" heading
- Candidate name · Position · Scheduled date/time
- Interviewer name (first name only)
- Status: "⏳ Waiting for interviewer to admit you..."
- Animated waiting indicator (pulse dot)
- Instructions card: "Please ensure your camera and microphone are allowed. Join 5 minutes early. Keep your resume ready."
- Camera/Mic test section (preview tile with toggle)

> Status is polled every 5 seconds from `interviews[candidatePortalStatus]`

**After Admitted:**
- Status changes to "✅ You have been admitted!"
- "Join Interview" button becomes active → navigates to meeting room or opens external link

**On Interviewer Side (in `/interviews/:id`):**
- "Admit Candidate" button → changes `interviews[candidatePortalStatus]` to `admitted` → candidate's page updates automatically

---

## ▌MODULE 9 — NOTIFICATION SYSTEM

### Notification Types & Triggers:

| Type | Trigger | Recipient(s) |
|------|---------|-------------|
| `registration_request` | New user registers | All Admin + HR users |
| `registration_approved` | Admin/HR approves | The new user |
| `registration_rejected` | Admin/HR rejects | The new user |
| `task_assigned` | Task created | All assignees |
| `task_deadline_5min` | 5 min before task due | All assignees |
| `task_overdue` | Task past due, not complete | Assignee + Owner/Manager |
| `task_delay_submitted` | Assignee submits delay reason | Owner + Manager |
| `task_approved` | Lead approves task | Task creator |
| `task_rejected` | Lead rejects task | Task creator |
| `meeting_invited` | Meeting created | All participants |
| `meeting_join_request` | User requests to join | Meeting host |
| `meeting_join_approved` | Host approves request | Requesting user |
| `meeting_cant_attend` | Participant declines | Meeting host |
| `meeting_starting_soon` | 10 min before meeting | All participants |
| `meeting_starting_1hr` | 1 hour before meeting | All participants |
| `interview_scheduled` | Interview created | Interviewer |
| `interview_reminder` | 30 min before interview | Interviewer |
| `candidate_waiting` | Candidate joins portal | Interviewer |
| `evaluation_pending` | Interview marked complete | Interviewer |
| `project_added` | Added to project team | New team member |
| `milestone_delayed` | Milestone delay logged | All project members |
| `milestone_completed` | Milestone marked done | All project members |
| `requirement_changed` | Client change request added | All project members |
| `standup_logged` | Stand-up form submitted | Host + Admin + Manager |

---

### Task Deadline Notification — 5 Min Before

**Reminder Engine (runs every 60 seconds via `setInterval()`):**
1. Scan `tasks[]` where `dueDate` is within next 5 minutes AND `status !== 'completed'`
2. Check `notifications[]` to avoid duplicate (sent in last 10 min)
3. If no duplicate → create notification: "⏰ Task due in 5 minutes: [title]"
4. Show browser notification + in-app toast

**If task is overdue (dueDate passed, status not completed):**
1. Create overdue notification every 30 min (if not duplicate)
2. Show "Submit Delay Reason" CTA on the task card for the assignee

---

### `/notifications` — Full Notification Page

**Features:**
- Paginated list (all notifications for current user)
- Grouped by: Today / Yesterday / This Week / Older
- "Mark All Read" button
- Filter by type dropdown
- Delete individual notification
- Click → mark as read + navigate to related route

---

## ▌MODULE 10 — REPORTS & ANALYTICS (`/reports`)

### Admin View
- All charts: Tasks/week · Status distribution · Employee productivity · Project progress · Meeting attendance · Interview success ratio
- Filters: Weekly / Monthly / Yearly
- Export: CSV + PDF simulation

### HR View
- Hiring pipeline funnel · Interview count by month · Candidate avg scores · Evaluation status breakdown

### Manager View
- Team task completion rates · Sprint progress · Member workload distribution

### Employee View
- My completed vs pending donut · My meeting attendance rate · My productivity over time

---

## ▌MODULE 11 — PROFILE (`/profile`)

**Personal Info (editable):** Full Name · Mobile · Department · Profile Photo (base64, <100KB)

**Account Info (read-only):** Role · Employee ID · Member since

**Password Change:** Current Password · New Password · Confirm Password

**Notification Preferences (toggles):** In-app notifications · Meeting reminders (1hr + 10min) · Task deadline reminders · Interview reminders

---

## ═══════════════════════════════════════
## SECTION 5 — USER-BY-USER ACCESS SUMMARY
## ═══════════════════════════════════════

### 🔴 ADMIN — Full System Access
- Approve/Reject registrations
- Add/Edit/Deactivate any employee (all roles)
- Create/Edit/Delete any project, assign owner, add members
- Full milestone + requirement management
- Full task management (create, assign, approve, reject)
- Full meeting management (schedule, host, standup, task assign in meeting)
- Full interview management (schedule, admit candidate, evaluate, unlock evaluations)
- View all reports + analytics
- Receive all system notifications

---

### 🟠 HR — Employee + Interview Focus
- Approve/Reject registrations
- View employee directory (read-only)
- Schedule + edit + cancel interviews
- View all interview details, view evaluations (read-only)
- Schedule + join meetings (full meeting room access)
- View HR analytics + reports
- Self-tasks
- Receive: registration requests, interview, meeting notifications

---

### 🟡 MANAGER — Team + Project Focus
- View employee directory (read-only)
- Create projects, assign owner, add members
- Full project management (milestones, sprints, tasks, requirements)
- Create + assign tasks to team members
- Approve/reject team tasks
- Full meeting management (schedule, host standup, assign tasks in meeting)
- View/evaluate assigned interviews (if set as interviewer)
- View team analytics
- Self-tasks
- Receive: task, project, meeting, interview (if assigned) notifications

---

### 🟢 EMPLOYEE — Task + Project Focus
- Create projects (becomes owner) — or join as team member
- If **Project Owner**: manage team roster, add milestones, add requirements, create + assign tasks, approve tasks
- If **Team Member**: view project, update own tasks, add comments/files
- View and update own tasks (across all projects on `/tasks`)
- If **delegated task assignment rights**: can assign tasks to specific members
- Schedule + join meetings (full room — no stand-up mode unless host)
- If **Interview Panel**: view assigned interviews, submit live evaluation
- View own analytics
- Self-tasks
- Receive: task (assigned, deadline, overdue), project, meeting, interview (if panel) notifications

---

### 🔵 INTERN — Limited Contributor
- View only projects they are added to
- If **Team Lead (intern-lead)**: create + assign tasks to other interns in project
- Update own task status, add comments, upload files, submit delay reason
- View own tasks on `/tasks`
- Schedule + join meetings (no standup mode unless host)
- Submit delay reasons for overdue tasks
- Self-tasks
- Receive: task (assigned, deadline, overdue), meeting, project notifications

---

### 🟣 INTERVIEW PANEL — Interview Evaluator
- View employee directory (read-only)
- View only their assigned interviews
- **Admit candidate** when they arrive at portal
- **Score candidate live** (0–5 per skill during interview)
- Submit evaluation + lock it
- Schedule + join meetings (full room)
- Self-tasks
- Receive: interview scheduled, candidate waiting, meeting notifications

---

## ═══════════════════════════════════════
## SECTION 6 — FILE & FOLDER STRUCTURE
## ═══════════════════════════════════════

```
src/
  assets/
  components/
    ui/           → Button, Input, Modal, Badge, Avatar, Toast, Skeleton,
                    EmptyState, Table, FileUpload, TagInput, StarRating
    layout/       → Sidebar, Topbar, MobileNav, AuthGuard, RoleGuard, ApprovalGuard
    kanban/       → KanbanBoard, KanbanColumn, TaskCard, TaskDetailSlider
    meeting/      → MeetingRoom, VideoTile, ControlBar, ParticipantPanel,
                    ChatPanel, StandupPanel, InMeetingTaskCreator, EmojiReactions
    charts/       → BarChart, PieChart, LineChart, DonutChart (Recharts wrappers)
  contexts/
    AuthContext.jsx
    NotificationContext.jsx
    ThemeContext.jsx
    ProjectContext.jsx
  pages/
    Login.jsx
    Register.jsx
    ForgotPassword.jsx
    Dashboard.jsx
    Employees.jsx
    EmployeeProfile.jsx
    PendingApprovals.jsx
    Projects.jsx
    ProjectDetail.jsx          ← 7 tabs inside
    NewProject.jsx
    MyTasks.jsx                ← personal task list (not kanban)
    SelfTasks.jsx
    Meetings.jsx
    MeetingDetail.jsx
    MeetingRoom.jsx
    NewMeeting.jsx
    Interviews.jsx
    InterviewDetail.jsx
    NewInterview.jsx
    CandidatePortal.jsx        ← public, no auth
    Notifications.jsx
    Profile.jsx
    Reports.jsx
    NotFound.jsx
    AccessDenied.jsx
  services/
    storage.js          → asyncGet / asyncSet / asyncUpdate / asyncDelete
    seed.js             → seed data generator
    notifications.js    → createNotification() helper for all types
    auth.js             → login / logout / session helpers
    reminderEngine.js   → setInterval scanner (tasks, meetings, self-tasks)
    emailSimulator.js   → generate email preview content
  hooks/
    useAuth.js
    useNotifications.js
    useReminderEngine.js
    useProjectHistory.js
    useTaskHistory.js
  utils/
    dates.js            → formatting, milestone recalculation
    permissions.js      → hasPermission(user, action, context) helper
    validators.js       → form validation rules
  App.jsx               → router + guards
  main.jsx
```

---

## ═══════════════════════════════════════
## SECTION 7 — GLOBAL UI & TECHNICAL REQUIREMENTS
## ═══════════════════════════════════════

### Theme
- Dark/Light toggle in topbar · `localStorage.theme` · Tailwind `dark:` class strategy · Default: dark mode
- Primary brand: Indigo (#6366f1) · Indigo scale for accents · Neutral grays for surfaces

### Responsive
| Breakpoint | Layout |
|------------|--------|
| < 768px | Single column · Bottom nav instead of sidebar |
| 768–1024px | Sidebar collapses to icon-only |
| > 1024px | Full sidebar (240px) + main content |

### Loading States
- Every localStorage read: 200ms simulated async delay via `asyncGet()`
- Skeleton loaders during delay

### Toast Notifications
- Fixed bottom-right stack · Types: success/error/warning/info · Auto-dismiss 4 seconds

### Empty States
- Every list/board/table: styled empty state (illustration + message + CTA button)

### Form Validation
- Controlled inputs · Inline error messages · Required fields · Email format · Password strength

### Video Call — Technical Notes (300+ Users)
- Use `getUserMedia()` for camera/mic
- Use `getDisplayMedia()` for screen sharing
- Simulate 300+ participants with avatar tiles (localStorage participant list)
- Real streams only for actual connected users
- CSS `filter: blur(8px)` for background blur effect
- Performance: virtual scrolling for participant grid beyond 20 tiles

---

*SetTribe Master System Prompt v2 — Complete ✓*
*Ready for implementation phase.*
