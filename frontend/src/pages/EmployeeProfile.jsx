import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Calendar, Save, Download, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet } from '../services/storage';
import { fetchProjectMembers } from '../services/projectApi';
import { fetchTaskAssignees } from '../services/taskApi';
import { fetchProjects } from '../services/projectApi';
import { fetchTasks } from '../services/taskApi';
import { fetchEmployeeDashboard, fetchEmployeeById } from '../services/employeeApi';
import { Avatar, Button, Input, Select, StatusBadge, PriorityBadge, Skeleton } from '../components/ui';
import { formatDate } from '../utils/dates';
import toast from 'react-hot-toast';
import MyProgress from './MyProgress';

// New Chart & Widget Components
import { ProductivityChart } from '../components/ui/charts/ProductivityChart';
import { TimeAllocationChart } from '../components/ui/charts/TimeAllocationChart';
import { ProjectHealthGrid } from '../components/ui/ProjectHealthGrid';
import { PerformanceScore } from '../components/ui/PerformanceScore';
import { StatCard } from '../components/ui/StatCard';
import { AuditActivityTable } from '../components/ui/tables/AuditActivityTable';
import { TaskTimeline } from '../components/ui/TaskTimeline';


// Utilities
import { calculateCompositeScore, getPerformanceTrend } from '../utils/performanceMath';

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Management'];
const ALL_ROLES = ['admin', 'hr', 'employee', 'intern', 'panel'];
const roleColors = {
  admin: 'bg-red-900/40 text-red-400 border border-red-800/50',
  hr: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  employee: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  intern: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  panel: 'bg-purple-900/40 text-purple-400 border border-purple-800/50'
};

// --- Mock Data Generators for Visualizations & Data Grids ---
const generateMockProductivityData = () => {
  const data = [];
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];
  weeks.forEach(w => {
    data.push({ name: w, tasks: Math.floor(Math.random() * 15) + 5 });
  });
  return data;
};

const generateMockTimeAllocation = () => [
  { name: 'Coding', value: 40 },
  { name: 'Meetings', value: 30 },
  { name: 'Code Review', value: 20 },
  { name: 'Admin', value: 10 },
];




const generateMockProjectGridData = (projects) => {
  return projects.map((p, i) => {
    const budget = 100 + Math.floor(Math.random() * 200);
    const actual = budget * (0.5 + Math.random() * 0.7); // 50% to 120% of budget
    const totalMilestones = 5 + Math.floor(Math.random() * 5);
    return {
      id: p.id,
      name: p.title,
      projectId: `PRJ-${String(i + 1).padStart(3, '0')}`,
      hoursBilled: actual,
      budgetHours: budget,
      actualHours: Math.round(actual),
      milestonesCompleted: Math.floor((p.progress / 100) * totalMilestones),
      milestonesTotal: totalMilestones,
      overdueDays: Math.random() > 0.7 ? Math.floor(Math.random() * 14) + 1 : 0
    };
  });
};


export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'dashboard';
  });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // ── Real API calls (parallel) ──────────────────────────────────────
        // If the current user is admin/hr, use the aggregated dashboard endpoint.
        // Otherwise fall back to just loading the user profile.
        let emp = null;
        let apiDashboard = null;

        if (currentUser?.role === 'admin' || currentUser?.role === 'hr') {
          const [empData, dashData] = await Promise.all([
            fetchEmployeeById(id),
            fetchEmployeeDashboard(id).catch(() => null)   // graceful fallback if API not yet deployed
          ]);
          emp = empData;
          apiDashboard = dashData;
        } else {
          emp = await fetchEmployeeById(id);
        }

        const allMeetings = await asyncGet(KEYS.MEETINGS) || [];
        const empMeetings = allMeetings.filter(m => m.participantIds.includes(id) && m.type !== 'interview');
        setMeetings(empMeetings);

        if (isMounted) {
          setEmployee(emp);
          setEditForm({
            name: emp.name,
            email: emp.email,
            mobile: emp.mobile,
            department: emp.department,
            role: emp.role,
            employeeId: emp.employeeId
          });

          // ── Derive tasks & projects from API dashboard or legacy fallback ──
          let empTasks = [];
          let empProjects = [];

          if (apiDashboard) {
            // API dashboard already has aggregated data — extract for legacy tabs
            empProjects = apiDashboard.projects || [];
            // For the tasks tab, fetch separately (lightweight)
            try {
              const allTasks = await fetchTasks();
              const taskResponses = await Promise.all(allTasks.map(t => fetchTaskAssignees(t.id).catch(() => [])));
              const tasksWithAssignees = allTasks.map((t, idx) => ({ ...t, assigneeIds: taskResponses[idx].map(a => a.userId) }));
              empTasks = tasksWithAssignees.filter(t => t.assigneeIds.some(aId => String(aId) === String(id)));
            } catch (e) { console.error('Failed to load tasks for tasks tab:', e); }
          } else {
            // Legacy fallback for non-admin/hr viewers
            try {
              const allTasks = await fetchTasks();
              const taskResponses = await Promise.all(allTasks.map(t => fetchTaskAssignees(t.id).catch(() => [])));
              const tasksWithAssignees = allTasks.map((t, idx) => ({ ...t, assigneeIds: taskResponses[idx].map(a => a.userId) }));
              empTasks = tasksWithAssignees.filter(t => t.assigneeIds.some(aId => String(aId) === String(id)));

              const allProjects = await fetchProjects();
              const projResponses = await Promise.all(allProjects.map(p => fetchProjectMembers(p.id).catch(() => [])));
              const projectsWithMembers = allProjects.map((p, idx) => ({ ...p, teamIds: projResponses[idx].map(m => m.userId) }));
              empProjects = projectsWithMembers.filter(p => p.teamIds.some(tId => String(tId) === String(id)));
            } catch (e) { console.error('Legacy fetch failed:', e); }
          }

          setTasks(empTasks);
          setProjects(empProjects);

          // Meetings (still from localStorage — to be migrated in a future phase)
          const allMeetings = await asyncGet(KEYS.MEETINGS) || [];
          const empMeetings = allMeetings.filter(m => m.participantIds?.some(pId => String(pId) === String(id)));
          setMeetings(empMeetings);

          // ── Build dashboard data ──────────────────────────────────────────
          const realKpis = apiDashboard?.kpis;
          const realTimeline = apiDashboard?.timeline || [];
          const realProjectSummaries = apiDashboard?.projects || [];

          // For legacy fallback (non-admin/hr), compute past projects manually
          let realPastProjects = apiDashboard?.pastProjects;
          if (!apiDashboard) {
            const legacyPast = empProjects.filter(p => ['completed', 'done'].includes((p.status || '').toLowerCase()));
            realPastProjects = legacyPast.map(p => ({
              projectId: p.id,
              title: p.title,
              status: p.status,
              progress: p.progress || 0,
              tasksCompleted: 0,
              tasksAssigned: 0,
              deadline: p.deadline
            }));
            empProjects = empProjects.filter(p => !['completed', 'done'].includes((p.status || '').toLowerCase()));
          } else {
            realPastProjects = realPastProjects || [];
          }

          const okrs = [{ progress: 85 }, { progress: 60 }, { progress: 100 }];
          const feedback = [{ score: 90 }, { score: 85 }, { score: 95 }];
          const currentScore = calculateCompositeScore(empTasks, okrs, feedback);

          const completedTasks = empTasks.filter(t => t.status === 'done').length;
          const totalTasks = empTasks.length || 1;

          // Compile Comprehensive Audit Log
          const comprehensiveAudit = [];

          // 1. Add realTimeline events
          realTimeline.forEach(t => {
            comprehensiveAudit.push({
              timestamp: t.occurredAt || new Date().toISOString(),
              actionId: t.eventType,
              description: t.title || t.workDescription || 'Activity recorded',
              timeSpent: t.loggedHours ? `${t.loggedHours} hr` : '--'
            });
          });

          // 2. Add Project History (actions performed by this employee)
          const allHistory = await asyncGet(KEYS.PROJECT_HISTORY) || [];
          allHistory.filter(h => String(h.performedBy) === String(id)).forEach(h => {
            comprehensiveAudit.push({
              timestamp: h.timestamp || new Date().toISOString(),
              actionId: h.action?.toUpperCase() || 'PROJECT_ACTION',
              description: h.details || 'Project action performed',
              timeSpent: '--'
            });
          });

          // 3. Add Meetings hosted by employee
          allMeetings.filter(m => String(m.hostId) === String(id)).forEach(m => {
            const meetingTime = m.createdAt || (m.date && m.time ? m.date + 'T' + m.time : new Date().toISOString());
            comprehensiveAudit.push({
              timestamp: meetingTime,
              actionId: 'MEETING_CREATED',
              description: `Scheduled meeting: ${m.title}`,
              timeSpent: '--'
            });
          });

          // 4. Add Tasks assigned or completed
          empTasks.forEach(t => {
            if (t.createdAt) {
              comprehensiveAudit.push({
                timestamp: t.createdAt,
                actionId: 'TASK_ASSIGNED',
                description: `Assigned to task: ${t.title}`,
                timeSpent: '--'
              });
            }
            if (t.status === 'done' && t.updatedAt) {
              comprehensiveAudit.push({
                timestamp: t.updatedAt,
                actionId: 'TASK_COMPLETED',
                description: `Completed task: ${t.title}`,
                timeSpent: '--'
              });
            }
          });

          // Sort descending by timestamp
          comprehensiveAudit.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          const formattedAuditData = comprehensiveAudit.map((a, i) => ({
            id: i,
            timestamp: (a.timestamp || '').replace('T', ' ').substring(0, 16),
            actionId: a.actionId,
            description: a.description,
            timeSpent: a.timeSpent
          }));

          setDashboardData({
            // ── Real KPIs from API (fallback to computed values) ──
            kpis: {
              totalProjects: realKpis?.totalProjects ?? realProjectSummaries.length,
              tasksCompleted: realKpis?.totalTasksCompleted ?? completedTasks,
              tasksPending: realKpis?.totalTasksPending ?? (empTasks.length - completedTasks),
              tasksOverdue: realKpis?.totalTasksOverdue ?? 0,
              completionRate: realKpis?.completionRate ?? ((completedTasks / totalTasks) * 100).toFixed(1),
              avgTurnaround: realKpis?.avgTurnaroundDays ?? (3 + Math.random() * 5).toFixed(1),
              // Kept for legacy chart StatCards
              totalHours: (120 + Math.random() * 60).toFixed(1),
              hoursVariance: `+${(Math.random() * 10).toFixed(1)} hr`,
              hoursPositive: Math.random() > 0.3,
              defectRate: (1 + Math.random() * 5).toFixed(1)
            },
            // ── Real timeline from API ──
            timeline: realTimeline,
            // ── Real project summaries from API ──
            projectSummaries: realProjectSummaries,
            pastProjects: realPastProjects,
            // ── Mock data for chart widgets (these need separate backend endpoints in future) ──
            productivityData: generateMockProductivityData(),
            timeAllocationData: generateMockTimeAllocation(),

            auditData: formattedAuditData,
            payroll: {
              pto: (10 + Math.random() * 10).toFixed(1),
              leavesTaken: Math.floor(Math.random() * 15),
              billable: Math.floor(100 + Math.random() * 50),
              nonBillable: Math.floor(20 + Math.random() * 40)
            },
            performanceScore: currentScore,
            performanceTrend: getPerformanceTrend(currentScore)
          });

          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load employee profile:', err);
        if (isMounted) navigate('/employees');
      }
    };
    load();
    return () => { isMounted = false; };
  }, [id, navigate]);


  const saveEdit = async () => {
    const updatedUsers = [...users];
    const idx = updatedUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      updatedUsers[idx] = { ...updatedUsers[idx], ...editForm };
      await asyncSet(KEYS.USERS, updatedUsers);
      setEmployee(updatedUsers[idx]);
      setUsers(updatedUsers);
      toast.success('Profile updated!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }


  // Transform projects for the health grid visualization
  const healthProjects = projects.map(p => ({
    ...p,
    health: p.progress > 80 ? 'green' : p.progress > 40 ? 'amber' : 'red',
    burndownRate: Math.floor(Math.random() * 5) + 2
  }));

  const TABS = ['dashboard', 'timeline', 'tasks', 'meetings'];
  if (['intern', 'employee'].includes(employee.role)) TABS.push('performance');
  if (currentUser.role === 'admin') TABS.push('edit');

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:text-black">
      {/* Header Area */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          {currentUser.role === 'admin' && (
            <button onClick={handlePrint} className="flex items-center gap-2 text-primary-400 hover:text-primary-300 text-sm bg-primary-900/20 px-3 py-1.5 rounded-lg border border-primary-800/50 transition-colors">
              <Download size={16} /> Export PDF
            </button>
          )}
        </div>
      </div>

      <div className="card p-6 print:shadow-none print:border-gray-300 print:bg-white">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="relative">
            <Avatar name={employee.name} photo={employee.profilePhoto} size="xl" />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${employee.isActive ? 'bg-emerald-500' : 'bg-gray-600'}`} />
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-100 print:text-black">{employee.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${roleColors[employee.role]} print:border-gray-400 print:text-gray-800 print:bg-gray-100`}>{employee.role}</span>
                  <span className="text-gray-500 text-sm print:text-gray-600">{employee.department}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 print:hidden">
                <PerformanceScore score={dashboardData.performanceScore} trend={dashboardData.performanceTrend} />
                {currentUser.role === 'admin' && (
                  <button onClick={async () => {
                    const updatedUsers = [...users];
                    const idx = updatedUsers.findIndex(u => u.id === id);
                    if (idx !== -1) {
                      updatedUsers[idx].isActive = !updatedUsers[idx].isActive;
                      await asyncSet(KEYS.USERS, updatedUsers);
                      setEmployee(updatedUsers[idx]);
                      setUsers(updatedUsers);
                      toast.success(`Account ${updatedUsers[idx].isActive ? 'activated' : 'deactivated'}`);
                    }
                  }} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${employee.isActive ? 'border-red-800/50 text-red-400 hover:bg-red-900/20' : 'border-green-800/50 text-green-400 hover:bg-green-900/20'}`}>
                    {employee.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 print:grid-cols-4">
              <div className="flex items-center gap-2 text-sm text-gray-400 print:text-gray-700"><Mail size={14} className="text-gray-600 print:text-gray-400" />{employee.email}</div>
              <div className="flex items-center gap-2 text-sm text-gray-400 print:text-gray-700"><Phone size={14} className="text-gray-600 print:text-gray-400" />{employee.mobile || 'N/A'}</div>
              <div className="flex items-center gap-2 text-sm text-gray-400 print:text-gray-700"><Building size={14} className="text-gray-600 print:text-gray-400" />{employee.employeeId}</div>
              <div className="flex items-center gap-2 text-sm text-gray-400 print:text-gray-700"><Calendar size={14} className="text-gray-600 print:text-gray-400" />Joined {formatDate(employee.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide print:hidden">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn capitalize ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'dashboard' ? 'Dashboard' : tab === 'timeline' ? '⏱ Timeline' : tab}
          </button>
        ))}
      </div>

      {/* 360 Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* Executive KPI Stat Cards — driven by real API data */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="Projects Worked On"
              value={String(dashboardData.kpis.totalProjects)}
            />
            <StatCard
              title="Tasks Completed"
              value={String(dashboardData.kpis.tasksCompleted)}
            />
            <StatCard
              title="Tasks Pending"
              value={String(dashboardData.kpis.tasksPending)}
            />
            <StatCard
              title="Overdue Tasks"
              value={String(dashboardData.kpis.tasksOverdue)}
              variance={dashboardData.kpis.tasksOverdue > 0 ? `${dashboardData.kpis.tasksOverdue} overdue` : 'None overdue'}
              isPositiveVariance={dashboardData.kpis.tasksOverdue === 0}
            />
            <StatCard
              title="Completion Rate"
              value={`${dashboardData.kpis.completionRate}%`}
              variance={`~${dashboardData.kpis.avgTurnaround}d avg`}
              isPositiveVariance={true}
            />
          </div>

          {/* Row 1: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:break-inside-avoid">
            <div className="card p-5 lg:col-span-2 print:border-gray-300 print:bg-white">
              <ProductivityChart timeline={dashboardData.timeline} tasks={tasks} joinedAt={employee?.createdAt} />
            </div>
            <div className="card p-5 print:border-gray-300 print:bg-white">
              <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Time Allocation</h2>
              <TimeAllocationChart data={dashboardData.timeAllocationData} />
            </div>
          </div>

          {/* Detailed Project Data Grid */}
          <div className="card p-5 print:border-gray-300 print:bg-white print:break-inside-avoid">
            <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Project & Task Data Grid</h2>
            {/* Visual Grid for quick health checks */}
            <ProjectHealthGrid projects={healthProjects} employeeId={id} />
          </div>



          {/* Row 4: Completed Projects & Audit Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            <div className="card p-5 print:border-gray-300 print:bg-white flex flex-col h-full max-h-[500px]">
              <h2 className="font-semibold text-gray-100 mb-4 print:text-black shrink-0">Completed Projects</h2>
              <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {dashboardData.pastProjects?.length > 0 ? (
                  dashboardData.pastProjects.map((project) => (
                    <div key={project.projectId} className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 print:bg-gray-50 print:border-gray-300 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-200 print:text-black truncate pr-2">{project.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300 capitalize whitespace-nowrap">
                            {project.status || 'Completed'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-3 space-y-1">
                          <div><span className="text-gray-500">Progress:</span> {project.progress}%</div>
                          <div><span className="text-gray-500">Tasks Completed:</span> {project.tasksCompleted} / {project.tasksAssigned}</div>
                          {project.deadline && <div><span className="text-gray-500">Deadline:</span> {project.deadline}</div>}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => navigate(`/projects/${project.projectId}`)}
                      >
                        View Project Details
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 italic py-4 text-center">No completed projects found.</div>
                )}
              </div>
            </div>

            <div className="card p-5 print:border-gray-300 print:bg-white overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 text-purple-400 mb-2"><Shield size={16} /><h2 className="font-semibold text-gray-100 print:text-black">Audit & Activity Log</h2></div>
              <div className="flex-1 overflow-hidden">
                <AuditActivityTable data={dashboardData.auditData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="card p-5 print:hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-100 text-lg">Activity Timeline</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {dashboardData.timeline.length > 0
                  ? `${dashboardData.timeline.length} events — task changes, worklogs & standups`
                  : 'Chronological record of all activity'}
              </p>
            </div>
          </div>
          <TaskTimeline
            events={dashboardData.timeline}
            onProjectClick={(projectId) => navigate(`/projects/${projectId}`)}
          />
        </div>
      )}

      {/* Legacy Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="card overflow-hidden print:border-gray-300 print:bg-white">
          <div className="p-4 border-b border-gray-800 print:border-gray-300">
            <h2 className="font-semibold text-gray-100 print:text-black">All Tasks ({tasks.length})</h2>
          </div>
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No tasks assigned</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-800 print:border-gray-300">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 print:divide-gray-300">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-gray-800/30 print:hover:bg-transparent">
                    <td className="px-4 py-3 text-sm text-gray-200 print:text-black">{t.title}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Legacy Meetings Tab */}
      {activeTab === 'meetings' && (
        <div className="card overflow-hidden print:border-gray-300 print:bg-white">
          <div className="p-4 border-b border-gray-800 print:border-gray-300">
            <h2 className="font-semibold text-gray-100 print:text-black">Meetings ({meetings.length})</h2>
          </div>
          {meetings.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No meetings found</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-800 print:border-gray-300">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 print:divide-gray-300">
                {meetings.map(m => (
                  <tr key={m.id} className="hover:bg-gray-800/30 print:hover:bg-transparent">
                    <td className="px-4 py-3 text-sm text-gray-200 print:text-black">{m.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.date} {m.time}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 capitalize">{m.type}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Performance Tab (Intern/Employee only) */}
      {activeTab === 'performance' && ['intern', 'employee'].includes(employee.role) && (
        <div className="mt-4 print:hidden">
          <MyProgress targetEmployee={employee} isEmbedded={true} />
        </div>
      )}

      {/* Edit Tab (Admin only) - Hidden in Print */}
      {activeTab === 'edit' && currentUser.role === 'admin' && (
        <div className="card p-6 print:hidden">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            <Input label="Employee ID" value={editForm.employeeId} onChange={e => setEditForm({ ...editForm, employeeId: e.target.value })} />
            <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            <Input label="Mobile" type="tel" value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} />
            <Select label="Department" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select label="Role" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
              {ALL_ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-800">
            <Button variant="secondary" onClick={() => setActiveTab('dashboard')}>Cancel</Button>
            <Button onClick={saveEdit}><Save size={14} /> Save Changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
