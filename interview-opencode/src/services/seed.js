import { v4 as uuidv4 } from 'uuid';
import { KEYS, asyncSet } from './storage';

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();
const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString();
const tomorrow = new Date(Date.now() + 86400000).toISOString();

const ADMIN_ID = 'user-admin-001';
const HR_ID = 'user-hr-001';
const MANAGER_ID = 'user-manager-001';
const EMPLOYEE_ID = 'user-employee-001';
const INTERN_ID = 'user-intern-001';
const PANEL_ID = 'user-panel-001';

const PROJECT1_ID = 'proj-001';
const PROJECT2_ID = 'proj-002';

const MILESTONE1_ID = 'ms-001';
const MILESTONE2_ID = 'ms-002';
const MILESTONE3_ID = 'ms-003';
const MILESTONE4_ID = 'ms-004';

export function seedData() {
  if (localStorage.getItem(KEYS.SEEDED) === 'true') return;

  // === USERS ===
  const users = [
    {
      id: ADMIN_ID,
      name: 'Alex Thompson',
      employeeId: 'EMP001',
      email: 'admin@settribe.com',
      mobile: '9876543210',
      department: 'Management',
      role: 'admin',
      isActive: true,
      isApproved: true,
      approvedBy: null,
      approvedAt: now,
      createdAt: lastMonth,
      profilePhoto: null,
      password: 'Admin@1234' },
    {
      id: HR_ID,
      name: 'Priya Sharma',
      employeeId: 'EMP002',
      email: 'hr@settribe.com',
      mobile: '9876543211',
      department: 'HR',
      role: 'hr',
      isActive: true,
      isApproved: true,
      approvedBy: ADMIN_ID,
      approvedAt: lastMonth,
      createdAt: lastMonth,
      profilePhoto: null,
      password: 'Hr@12345' },
    {
      id: MANAGER_ID,
      name: 'Rajesh Kumar',
      employeeId: 'EMP003',
      email: 'manager@settribe.com',
      mobile: '9876543212',
      department: 'Engineering',
      role: 'manager',
      isActive: true,
      isApproved: true,
      approvedBy: ADMIN_ID,
      approvedAt: lastMonth,
      createdAt: lastMonth,
      profilePhoto: null,
      password: 'Manager@123' },
    {
      id: EMPLOYEE_ID,
      name: 'Ananya Patel',
      employeeId: 'EMP004',
      email: 'employee@settribe.com',
      mobile: '9876543213',
      department: 'Engineering',
      role: 'employee',
      isActive: true,
      isApproved: true,
      approvedBy: ADMIN_ID,
      approvedAt: lastMonth,
      createdAt: lastMonth,
      profilePhoto: null,
      password: 'Employee@123' },
    {
      id: INTERN_ID,
      name: 'Ravi Verma',
      employeeId: 'EMP005',
      email: 'intern@settribe.com',
      mobile: '9876543214',
      department: 'Engineering',
      role: 'intern',
      isActive: true,
      isApproved: true,
      approvedBy: ADMIN_ID,
      approvedAt: lastMonth,
      createdAt: lastMonth,
      profilePhoto: null,
      password: 'Intern@1234' },
    {
      id: PANEL_ID,
      name: 'Deepika Singh',
      employeeId: 'EMP006',
      email: 'panel@settribe.com',
      mobile: '9876543215',
      department: 'Engineering',
      role: 'panel',
      isActive: true,
      isApproved: true,
      approvedBy: ADMIN_ID,
      approvedAt: lastMonth,
      createdAt: lastMonth,
      profilePhoto: null,
      password: 'Panel@1234' },
  ];
  asyncSet(KEYS.USERS, users);

  // === SESSIONS ===
  asyncSet(KEYS.SESSIONS, { currentUserId: null, token: null });

  // === PROJECTS ===
  const projects = [
    {
      id: PROJECT1_ID,
      title: 'E-Commerce Platform Redesign',
      description: 'Complete redesign and rebuild of the existing e-commerce platform with modern UI/UX, improved performance, and new features including AI-based recommendations.',
      clientName: 'TechMart Inc.',
      category: 'Web',
      priority: 'high',
      status: 'active',
      ownerId: EMPLOYEE_ID,
      managerId: MANAGER_ID,
      teamIds: [EMPLOYEE_ID, INTERN_ID, MANAGER_ID],
      startDate: lastMonth,
      endDate: nextMonth,
      deadline: nextMonth,
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'AWS'],
      repoLink: 'https://github.com/settribe/ecommerce',
      tags: ['redesign', 'ecommerce', 'frontend', 'backend'],
      progress: 45,
      srsDocuments: [{ name: 'SRS_v1.0.pdf', uploadedBy: MANAGER_ID, uploadedAt: lastMonth, size: '2.4 MB' }],
      createdAt: lastMonth },
    {
      id: PROJECT2_ID,
      title: 'HR Analytics Dashboard',
      description: 'Internal analytics dashboard for HR to track employee performance, attendance, and engagement metrics.',
      clientName: 'Internal',
      category: 'Internal',
      priority: 'medium',
      status: 'completed',
      ownerId: MANAGER_ID,
      managerId: MANAGER_ID,
      teamIds: [MANAGER_ID, EMPLOYEE_ID],
      startDate: new Date(Date.now() - 60 * 86400000).toISOString(),
      endDate: yesterday,
      deadline: yesterday,
      technologies: ['React', 'Recharts', 'Python', 'FastAPI'],
      repoLink: '',
      tags: ['analytics', 'hr', 'internal'],
      progress: 100,
      srsDocuments: [],
      createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  ];
  asyncSet(KEYS.PROJECTS, projects);

  // === PROJECT REQUIREMENTS ===
  const projectRequirements = [
    {
      id: uuidv4(),
      projectId: PROJECT1_ID,
      version: '1.0',
      title: 'Initial Requirements',
      description: 'Complete platform redesign with responsive UI, cart management, checkout flow, user auth, product catalog, AI recommendations, and admin panel.',
      addedBy: MANAGER_ID,
      addedAt: lastMonth,
      type: 'initial',
      clientChangeNote: '' },
    {
      id: uuidv4(),
      projectId: PROJECT1_ID,
      version: '1.1',
      title: 'Add Wishlist Feature',
      description: 'Client wants a wishlist functionality where users can save products for later purchase.',
      addedBy: MANAGER_ID,
      addedAt: twoDaysAgo,
      type: 'change_request',
      clientChangeNote: 'Please add a "Save for Later" / Wishlist option on product pages and in cart.' },
  ];
  asyncSet(KEYS.PROJECT_REQUIREMENTS, projectRequirements);

  // === MILESTONES ===
  const milestones = [
    {
      id: MILESTONE1_ID,
      projectId: PROJECT1_ID,
      title: 'UI/UX Design & Prototyping',
      description: 'Complete Figma designs for all pages, user flow diagrams, and interactive prototypes.',
      targetDate: yesterday,
      actualDate: twoDaysAgo,
      status: 'completed',
      isLocked: true,
      delayDays: 0,
      delayReason: '',
      delayedAt: null,
      rescheduledDate: null,
      completionPct: 100,
      order: 1 },
    {
      id: MILESTONE2_ID,
      projectId: PROJECT1_ID,
      title: 'Frontend Development',
      description: 'Implement all UI components, pages, state management, and API integration layer.',
      targetDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      actualDate: null,
      status: 'active',
      isLocked: true,
      delayDays: 0,
      delayReason: '',
      delayedAt: null,
      rescheduledDate: null,
      completionPct: 60,
      order: 2 },
    {
      id: MILESTONE3_ID,
      projectId: PROJECT1_ID,
      title: 'Backend API Development',
      description: 'Build REST APIs for all features, implement authentication, database schema, and third-party integrations.',
      targetDate: new Date(Date.now() + 21 * 86400000).toISOString(),
      actualDate: null,
      status: 'upcoming',
      isLocked: false,
      delayDays: 0,
      delayReason: '',
      delayedAt: null,
      rescheduledDate: null,
      completionPct: 0,
      order: 3 },
    {
      id: MILESTONE4_ID,
      projectId: PROJECT1_ID,
      title: 'QA Testing & Deployment',
      description: 'End-to-end testing, bug fixes, performance optimization, and production deployment.',
      targetDate: new Date(Date.now() + 28 * 86400000).toISOString(),
      actualDate: null,
      status: 'upcoming',
      isLocked: false,
      delayDays: 0,
      delayReason: '',
      delayedAt: null,
      rescheduledDate: null,
      completionPct: 0,
      order: 4 },
  ];
  asyncSet(KEYS.MILESTONES, milestones);

  // === SPRINTS ===
  const sprints = [
    { id: 'sprint-001', projectId: PROJECT1_ID, name: 'Sprint 1', goal: 'Setup & Design', startDate: lastMonth, endDate: yesterday, status: 'completed' },
    { id: 'sprint-002', projectId: PROJECT1_ID, name: 'Sprint 2', goal: 'Core Components', startDate: now, endDate: new Date(Date.now() + 14 * 86400000).toISOString(), status: 'active' },
  ];
  asyncSet(KEYS.SPRINTS, sprints);

  // === TASKS ===
  const tasks = [
    {
      id: 'task-001',
      projectId: PROJECT1_ID,
      milestoneId: MILESTONE2_ID,
      sprintId: 'sprint-002',
      title: 'Implement product listing page with filters',
      description: 'Create a responsive product listing page with search, category filter, price range slider, and sort options.',
      priority: 'high',
      assigneeIds: [EMPLOYEE_ID],
      creatorId: MANAGER_ID,
      assignedBy: MANAGER_ID,
      status: 'in_progress',
      startDate: now,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
      attachments: [{ name: 'design_mockup.png', size: '1.2 MB', uploadedBy: EMPLOYEE_ID, uploadedAt: now }],
      comments: [{ id: uuidv4(), userId: MANAGER_ID, text: 'Please ensure mobile responsiveness is perfect.', createdAt: yesterday }],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: now,
      tags: ['frontend', 'ui'] },
    {
      id: 'task-002',
      projectId: PROJECT1_ID,
      milestoneId: MILESTONE2_ID,
      sprintId: 'sprint-002',
      title: 'Shopping cart with localStorage persistence',
      description: 'Implement full cart functionality including add/remove/update quantity, persist to localStorage, and sync with server.',
      priority: 'high',
      assigneeIds: [EMPLOYEE_ID, INTERN_ID],
      creatorId: MANAGER_ID,
      assignedBy: MANAGER_ID,
      status: 'todo',
      startDate: tomorrow,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      attachments: [],
      comments: [],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: now,
      tags: ['frontend', 'cart'] },
    {
      id: 'task-003',
      projectId: PROJECT1_ID,
      milestoneId: MILESTONE2_ID,
      sprintId: 'sprint-002',
      title: 'User authentication UI (Login/Register/Forgot)',
      description: 'Design and implement all auth pages with form validation, error handling, and success flows.',
      priority: 'critical',
      assigneeIds: [INTERN_ID],
      creatorId: EMPLOYEE_ID,
      assignedBy: EMPLOYEE_ID,
      status: 'in_review',
      startDate: twoDaysAgo,
      dueDate: tomorrow,
      attachments: [],
      comments: [{ id: uuidv4(), userId: EMPLOYEE_ID, text: 'Looking good! Just fix the mobile padding.', createdAt: now }],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: twoDaysAgo,
      tags: ['auth', 'frontend'] },
    {
      id: 'task-004',
      projectId: PROJECT1_ID,
      milestoneId: MILESTONE2_ID,
      sprintId: 'sprint-002',
      title: 'Setup Tailwind design system and component library',
      description: 'Create base design tokens, reusable components (Button, Input, Card, Modal, Badge), and document usage.',
      priority: 'medium',
      assigneeIds: [EMPLOYEE_ID],
      creatorId: MANAGER_ID,
      assignedBy: MANAGER_ID,
      status: 'done',
      startDate: lastMonth,
      dueDate: yesterday,
      attachments: [],
      comments: [],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: lastMonth,
      tags: ['design-system'] },
    {
      id: 'task-005',
      projectId: PROJECT1_ID,
      milestoneId: MILESTONE3_ID,
      sprintId: null,
      title: 'Design database schema for product catalog',
      description: 'Create ERD and PostgreSQL schema for products, categories, variants, inventory, and pricing.',
      priority: 'high',
      assigneeIds: [MANAGER_ID],
      creatorId: MANAGER_ID,
      assignedBy: MANAGER_ID,
      status: 'backlog',
      startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      dueDate: new Date(Date.now() + 18 * 86400000).toISOString(),
      attachments: [],
      comments: [],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: now,
      tags: ['backend', 'database'] },
    {
      id: 'task-006',
      projectId: PROJECT2_ID,
      milestoneId: null,
      sprintId: null,
      title: 'Build employee performance dashboard',
      description: 'HR analytics charts for headcount, attrition, performance distribution.',
      priority: 'medium',
      assigneeIds: [EMPLOYEE_ID],
      creatorId: MANAGER_ID,
      assignedBy: MANAGER_ID,
      status: 'done',
      startDate: new Date(Date.now() - 50 * 86400000).toISOString(),
      dueDate: yesterday,
      attachments: [],
      comments: [],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
      tags: ['analytics'] },
  ];
  asyncSet(KEYS.TASKS, tasks);

  // === SELF TASKS ===
  asyncSet(KEYS.SELF_TASKS, []);

  // === MEETINGS ===
  const todayDate = new Date();
  const meetingToday = new Date(todayDate);
  meetingToday.setHours(11, 0, 0, 0);
  const meetingTomorrow = new Date(Date.now() + 86400000);
  meetingTomorrow.setHours(15, 0, 0, 0);

  const meetings = [
    {
      id: 'meeting-001',
      title: 'Daily Standup — E-Commerce Team',
      agenda: 'Daily sync to discuss yesterday\'s progress, today\'s plan, and any blockers.',
      date: meetingToday.toISOString().split('T')[0],
      time: '11:00',
      duration: '30',
      hostId: MANAGER_ID,
      participantIds: [MANAGER_ID, EMPLOYEE_ID, INTERN_ID],
      type: 'standup',
      meetingMode: 'internal',
      externalLink: '',
      projectId: PROJECT1_ID,
      status: 'upcoming',
      chatLogs: [],
      standupLogs: [],
      taskAssignedInMeeting: [],
      attendanceLogs: [],
      joinRequests: [],
      allowJoinRequests: true,
      createdAt: yesterday },
    {
      id: 'meeting-002',
      title: 'Project Kickoff — E-Commerce Redesign',
      agenda: 'Review project scope, timeline, team responsibilities, and technical architecture decisions.',
      date: meetingTomorrow.toISOString().split('T')[0],
      time: '15:00',
      duration: '60',
      hostId: MANAGER_ID,
      participantIds: [ADMIN_ID, MANAGER_ID, EMPLOYEE_ID, INTERN_ID],
      type: 'project',
      meetingMode: 'internal',
      externalLink: '',
      projectId: PROJECT1_ID,
      status: 'upcoming',
      chatLogs: [],
      standupLogs: [],
      taskAssignedInMeeting: [],
      attendanceLogs: [],
      joinRequests: [],
      allowJoinRequests: false,
      createdAt: yesterday },
  ];
  asyncSet(KEYS.MEETINGS, meetings);

  // === MEETING RSVPs ===
  const meetingRsvps = [
    { meetingId: 'meeting-001', userId: EMPLOYEE_ID, status: 'attending', reason: '', timestamp: now },
    { meetingId: 'meeting-001', userId: INTERN_ID, status: 'attending', reason: '', timestamp: now },
    { meetingId: 'meeting-002', userId: ADMIN_ID, status: 'attending', reason: '', timestamp: now },
    { meetingId: 'meeting-002', userId: EMPLOYEE_ID, status: 'no_response', reason: '', timestamp: now },
  ];
  asyncSet(KEYS.MEETING_RSVPS, meetingRsvps);

  // === INTERVIEWS ===
  const interviewToken = uuidv4();
  const interviews = [
    {
      id: 'interview-001',
      candidateName: 'Karan Mehta',
      mobile: '9988776655',
      email: 'karan.mehta@email.com',
      referredBy: 'Rajesh Kumar',
      position: 'Senior Frontend Developer',
      interviewType: 'technical',
      date: tomorrow.split('T')[0],
      time: '10:00',
      link: '',
      interviewerId: PANEL_ID,
      status: 'scheduled',
      token: interviewToken,
      notes: 'Candidate has 4 years of React experience. Focus on system design and performance optimization questions.',
      resumeFileName: 'Karan_Mehta_Resume.pdf',
      candidatePortalStatus: 'waiting',
      createdAt: now },
  ];
  asyncSet(KEYS.INTERVIEWS, interviews);

  // === EVALUATIONS ===
  asyncSet(KEYS.EVALUATIONS, []);

  // === NOTIFICATIONS ===
  const notifications = [];
  const allUserIds = [ADMIN_ID, HR_ID, MANAGER_ID, EMPLOYEE_ID, INTERN_ID, PANEL_ID];

  allUserIds.forEach(userId => {
    notifications.push(
      { id: uuidv4(), userId, type: 'task_assigned', title: 'New Task Assigned', message: 'You have been assigned "Implement product listing page with filters"', isRead: false, createdAt: now, relatedId: 'task-001', relatedType: 'task' },
      { id: uuidv4(), userId, type: 'meeting_invited', title: 'Meeting Invitation', message: 'You\'ve been invited to "Daily Standup — E-Commerce Team" tomorrow at 11:00 AM', isRead: false, createdAt: now, relatedId: 'meeting-001', relatedType: 'meeting' },
      { id: uuidv4(), userId, type: 'project_added', title: 'Added to Project', message: 'You\'ve been added to the "E-Commerce Platform Redesign" project', isRead: true, createdAt: yesterday, relatedId: PROJECT1_ID, relatedType: 'project' },
      { id: uuidv4(), userId, type: 'milestone_completed', title: 'Milestone Completed', message: '"UI/UX Design & Prototyping" milestone has been completed successfully', isRead: true, createdAt: yesterday, relatedId: MILESTONE1_ID, relatedType: 'milestone' },
    );
  });

  // Admin/HR specific
  [ADMIN_ID, HR_ID].forEach(userId => {
    notifications.push(
      { id: uuidv4(), userId, type: 'interview_scheduled', title: 'Interview Scheduled', message: 'Interview with Karan Mehta scheduled for tomorrow at 10:00 AM', isRead: false, createdAt: now, relatedId: 'interview-001', relatedType: 'interview' },
    );
  });

  // Panel specific
  notifications.push(
    { id: uuidv4(), userId: PANEL_ID, type: 'interview_scheduled', title: 'Interview Assigned', message: 'You are the interviewer for Karan Mehta (Senior Frontend Developer) — Tomorrow 10:00 AM', isRead: false, createdAt: now, relatedId: 'interview-001', relatedType: 'interview' },
  );

  asyncSet(KEYS.NOTIFICATIONS, notifications);

  // === PROJECT HISTORY ===
  const projectHistory = [
    { id: uuidv4(), projectId: PROJECT1_ID, action: 'project_created', performedBy: MANAGER_ID, targetId: PROJECT1_ID, targetType: 'project', details: 'Project "E-Commerce Platform Redesign" created', timestamp: lastMonth },
    { id: uuidv4(), projectId: PROJECT1_ID, action: 'member_added', performedBy: MANAGER_ID, targetId: EMPLOYEE_ID, targetType: 'user', details: 'Ananya Patel added to project team', timestamp: lastMonth },
    { id: uuidv4(), projectId: PROJECT1_ID, action: 'member_added', performedBy: MANAGER_ID, targetId: INTERN_ID, targetType: 'user', details: 'Ravi Verma added to project team', timestamp: lastMonth },
    { id: uuidv4(), projectId: PROJECT1_ID, action: 'milestone_completed', performedBy: EMPLOYEE_ID, targetId: MILESTONE1_ID, targetType: 'milestone', details: 'Milestone "UI/UX Design & Prototyping" marked as completed', timestamp: yesterday },
    { id: uuidv4(), projectId: PROJECT1_ID, action: 'task_created', performedBy: MANAGER_ID, targetId: 'task-001', targetType: 'task', details: 'Task "Implement product listing page with filters" created and assigned to Ananya Patel', timestamp: now },
    { id: uuidv4(), projectId: PROJECT1_ID, action: 'requirement_changed', performedBy: MANAGER_ID, targetId: null, targetType: 'requirement', details: 'Client change request added: "Add Wishlist Feature"', timestamp: twoDaysAgo },
  ];
  asyncSet(KEYS.PROJECT_HISTORY, projectHistory);

  // === TASK HISTORY ===
  const taskHistory = [
    { id: uuidv4(), taskId: 'task-001', projectId: PROJECT1_ID, action: 'created', performedBy: MANAGER_ID, fromStatus: null, toStatus: 'todo', details: 'Task created and assigned', timestamp: now },
    { id: uuidv4(), taskId: 'task-001', projectId: PROJECT1_ID, action: 'status_changed', performedBy: EMPLOYEE_ID, fromStatus: 'todo', toStatus: 'in_progress', details: 'Status changed from Todo to In Progress', timestamp: now },
    { id: uuidv4(), taskId: 'task-003', projectId: PROJECT1_ID, action: 'created', performedBy: EMPLOYEE_ID, fromStatus: null, toStatus: 'todo', details: 'Task created and assigned to Ravi Verma', timestamp: twoDaysAgo },
    { id: uuidv4(), taskId: 'task-003', projectId: PROJECT1_ID, action: 'status_changed', performedBy: INTERN_ID, fromStatus: 'in_progress', toStatus: 'in_review', details: 'Submitted for review', timestamp: now },
  ];
  asyncSet(KEYS.TASK_HISTORY, taskHistory);

  localStorage.setItem(KEYS.SEEDED, 'true');
}
