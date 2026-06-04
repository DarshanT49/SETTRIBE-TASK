import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Calendar, Edit2, Save, X, Download, Clock, Laptop, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet } from '../services/storage';
import { fetchProjectMembers } from '../services/projectApi';
import { fetchTaskAssignees } from '../services/taskApi';
import { fetchProjects } from '../services/projectApi';
import { fetchTasks } from '../services/taskApi';
import { Avatar, Button, Input, Select, StatusBadge, PriorityBadge, Skeleton } from '../components/ui';
import { formatDate } from '../utils/dates';
import toast from 'react-hot-toast';
import MyProgress from './MyProgress';

// New Chart & Widget Components
import { ProductivityChart } from '../components/ui/charts/ProductivityChart';
import { TimeAllocationChart } from '../components/ui/charts/TimeAllocationChart';
import { CompetencyRadar } from '../components/ui/charts/CompetencyRadar';
import { ActivityHeatmap } from '../components/ui/charts/ActivityHeatmap';
import { ProjectHealthGrid } from '../components/ui/ProjectHealthGrid';
import { CollaborationNetwork } from '../components/ui/CollaborationNetwork';
import { OrgChart } from '../components/ui/OrgChart';
import { PerformanceScore } from '../components/ui/PerformanceScore';
import { StatCard } from '../components/ui/StatCard';
import { ProjectDataGrid } from '../components/ui/tables/ProjectDataGrid';
import { MeetingLogTable } from '../components/ui/tables/MeetingLogTable';
import { AuditActivityTable } from '../components/ui/tables/AuditActivityTable';

// Utilities
import { calculateCompositeScore, getPerformanceTrend } from '../utils/performanceMath';

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Management'];
const ALL_ROLES = ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'];
const roleColors = {
  admin: 'bg-red-900/40 text-red-400 border border-red-800/50',
  hr: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  manager: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
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

const generateMockCompetencyData = (role) => {
  const isManager = role === 'manager';
  return [
    { subject: 'Frontend', score: Math.floor(Math.random() * 40) + 60, baseline: isManager ? 70 : 80 },
    { subject: 'Backend', score: Math.floor(Math.random() * 40) + 50, baseline: isManager ? 60 : 70 },
    { subject: 'Communication', score: Math.floor(Math.random() * 30) + 70, baseline: isManager ? 90 : 70 },
    { subject: 'Leadership', score: Math.floor(Math.random() * 40) + (isManager ? 60 : 30), baseline: isManager ? 85 : 40 },
    { subject: 'Problem Solving', score: Math.floor(Math.random() * 30) + 70, baseline: 80 },
    { subject: 'Teamwork', score: Math.floor(Math.random() * 20) + 80, baseline: 85 },
  ];
};

const generateMockActivityHeatmap = () => {
  const data = [];
  for (let i = 0; i < 90; i++) { // Last 90 days
    data.push({
      date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0],
      intensity: Math.floor(Math.random() * 5),
      count: Math.floor(Math.random() * 15)
    });
  }
  return data;
};

const generateMockCollaborators = () => {
  const names = ['Alex Mercer', 'Sarah Chen', 'Michael Chang', 'Emma Watson', 'James Wilson'];
  return names.map((name, i) => ({
    id: `collab-${i}`,
    name,
    interactionScore: Math.floor(Math.random() * 80) + 20
  }));
};

const generateMockAuditData = () => {
  const actions = ['TASK_STATUS_UPDATE', 'CODE_COMMIT', 'LOGIN', 'API_KEY_ROTATION', 'MEETING_SCHEDULING'];
  return Array.from({ length: 15 }).map((_, i) => {
    const d = new Date(Date.now() - Math.floor(Math.random() * 1000000000));
    return {
      id: i,
      timestamp: d.toISOString().replace('T', ' ').substring(0, 16),
      actionId: actions[Math.floor(Math.random() * actions.length)],
      description: `User performed action with ID: ${Math.floor(Math.random() * 1000)}`,
      timeSpent: `00:${Math.floor(Math.random() * 45 + 5).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

const generateMockProjectGridData = (projects) => {
  return projects.map((p, i) => {
    const budget = 100 + Math.floor(Math.random() * 200);
    const actual = budget * (0.5 + Math.random() * 0.7); // 50% to 120% of budget
    const totalMilestones = 5 + Math.floor(Math.random() * 5);
    return {
      id: p.id,
      name: p.title,
      projectId: `PRJ-${String(i+1).padStart(3, '0')}`,
      hoursBilled: actual,
      budgetHours: budget,
      actualHours: Math.round(actual),
      milestonesCompleted: Math.floor((p.progress / 100) * totalMilestones),
      milestonesTotal: totalMilestones,
      overdueDays: Math.random() > 0.7 ? Math.floor(Math.random() * 14) + 1 : 0
    };
  });
};

const generateMockMeetingLogData = () => {
  const periods = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago'];
  return periods.map(period => {
    const total = 5 + Math.floor(Math.random() * 10);
    return {
      period,
      totalMeetings: total,
      totalHours: total * (0.5 + Math.random()),
      noShowRate: Math.random() * 15, // 0 to 15%
      avgDurationMins: 30 + Math.random() * 45
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
      // Simulate network delay for skeleton
      await new Promise(r => setTimeout(r, 600));
      
      const allUsers = await asyncGet(KEYS.USERS) || [];
      const emp = allUsers.find(u => u.id === id);
      if (!emp) { 
        if(isMounted) navigate('/employees'); 
        return; 
      }
      
      if(isMounted) {
        setEmployee(emp);
        setUsers(allUsers);
        setEditForm({ 
          name: emp.name, 
          email: emp.email, 
          mobile: emp.mobile, 
          department: emp.department, 
          role: emp.role, 
          employeeId: emp.employeeId 
        });

        const allTasks = await fetchTasks();
        const taskResponses = await Promise.all(allTasks.map(t => fetchTaskAssignees(t.id).catch(() => [])));
        const tasksWithAssignees = allTasks.map((t, idx) => ({ ...t, assigneeIds: taskResponses[idx].map(a => a.userId) }));
        const empTasks = tasksWithAssignees.filter(t => t.assigneeIds.includes(id));
        setTasks(empTasks);

        const allMeetings = await asyncGet(KEYS.MEETINGS) || [];
        const empMeetings = allMeetings.filter(m => m.participantIds.includes(id));
        setMeetings(empMeetings);

        const allProjects = await fetchProjects();
        const projResponses = await Promise.all(allProjects.map(p => fetchProjectMembers(p.id).catch(() => [])));
        const projectsWithMembers = allProjects.map((p, idx) => ({ ...p, teamIds: projResponses[idx].map(m => m.userId) }));
        const empProjects = projectsWithMembers.filter(p => p.teamIds.includes(id));
        setProjects(empProjects);
        
        // Generate Dashboard Metrics
        const okrs = [{ progress: 85 }, { progress: 60 }, { progress: 100 }];
        const feedback = [{ score: 90 }, { score: 85 }, { score: 95 }];
        const currentScore = calculateCompositeScore(empTasks, okrs, feedback);
        
        const completedTasks = empTasks.filter(t => t.status === 'done').length;
        const totalTasks = empTasks.length || 1;
        
        setDashboardData({
          kpis: {
            totalHours: (120 + Math.random() * 60).toFixed(1),
            hoursVariance: `+${(Math.random() * 10).toFixed(1)} hr`,
            hoursPositive: Math.random() > 0.3,
            completionRate: ((completedTasks / totalTasks) * 100).toFixed(1),
            tasksCompleted: completedTasks,
            tasksTotal: totalTasks,
            avgTurnaround: (3 + Math.random() * 5).toFixed(1),
            defectRate: (1 + Math.random() * 5).toFixed(1)
          },
          productivityData: generateMockProductivityData(),
          timeAllocationData: generateMockTimeAllocation(),
          competencyData: generateMockCompetencyData(emp.role),
          activityHeatmapData: generateMockActivityHeatmap(),
          collaborators: generateMockCollaborators(),
          projectGridData: generateMockProjectGridData(empProjects),
          meetingLogData: generateMockMeetingLogData(),
          auditData: generateMockAuditData(),
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

  const isManager = employee.role === 'manager';
  const directReports = users.filter(u => u.department === employee.department && u.role !== 'manager' && u.id !== employee.id).slice(0, 4);
  
  // Transform projects for the health grid visualization
  const healthProjects = projects.map(p => ({
    ...p,
    health: p.progress > 80 ? 'green' : p.progress > 40 ? 'amber' : 'red',
    burndownRate: Math.floor(  Math.random() * 5) + 2
  }));

  const TABS = ['dashboard', 'tasks', 'meetings'];
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
            {tab === 'dashboard' ? '360° Dashboard' : tab}
          </button>
        ))}
      </div>

      {/* 360 Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Executive KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard 
              title="Total Hours Logged" 
              value={`${dashboardData.kpis.totalHours} hrs`} 
              variance={dashboardData.kpis.hoursVariance} 
              isPositiveVariance={dashboardData.kpis.hoursPositive} 
            />
            <StatCard 
              title="Task Completion Rate" 
              value={`${dashboardData.kpis.completionRate}%`} 
            />
            <StatCard 
              title="Tasks Done / Assigned" 
              value={`${dashboardData.kpis.tasksCompleted} / ${dashboardData.kpis.tasksTotal}`} 
            />
            <StatCard 
              title="Avg Turnaround Time" 
              value={`${dashboardData.kpis.avgTurnaround} days`} 
            />
            <StatCard 
              title="Quality / Defect Rate" 
              value={`${dashboardData.kpis.defectRate}%`} 
              variance="-1.2%" 
              isPositiveVariance={true} 
            />
          </div>

          {/* Row 1: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:break-inside-avoid">
            <div className="card p-5 lg:col-span-2 print:border-gray-300 print:bg-white">
              <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Productivity Timeline (6 Months)</h2>
              <ProductivityChart data={dashboardData.productivityData} />
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
            <ProjectHealthGrid projects={healthProjects} />
            {/* Detailed tabular numerical grid */}
            <ProjectDataGrid data={dashboardData.projectGridData} />
          </div>

          {/* Row 2: Radar, Heatmap, OrgChart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4 print:break-inside-avoid">
            <div className="card p-5 print:border-gray-300 print:bg-white">
              <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Competency Radar</h2>
              <CompetencyRadar data={dashboardData.competencyData} />
            </div>
            <div className="card p-5 lg:col-span-2 flex flex-col justify-between print:border-gray-300 print:bg-white">
              <div>
                <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Activity Heatmap (90 Days)</h2>
                <ActivityHeatmap data={dashboardData.activityHeatmapData} />
              </div>
              
              {isManager && (
                <div className="mt-6 pt-6 border-t border-gray-800 print:border-gray-300">
                  <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Span of Control</h2>
                  <OrgChart manager={employee} reports={directReports} />
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Meetings & Collab */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            <div className="card p-5 print:border-gray-300 print:bg-white">
              <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Collaboration Network</h2>
              <CollaborationNetwork mainUser={employee} collaborators={dashboardData.collaborators} />
            </div>
            <div className="card p-5 print:border-gray-300 print:bg-white">
              <MeetingLogTable data={dashboardData.meetingLogData} />
            </div>
          </div>

          {/* Row 4: HR Snapshot & Audit Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:break-inside-avoid">
            <div className="card p-5 print:border-gray-300 print:bg-white">
              <h2 className="font-semibold text-gray-100 mb-4 print:text-black">Leave, Capacity & Payroll Context</h2>
              <div className="space-y-4">
                <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 text-emerald-400 mb-3"><Clock size={16} /><h3 className="font-medium text-gray-200 print:text-black">Capacity & Leave</h3></div>
                  <div className="space-y-2 text-sm text-gray-300 print:text-gray-700">
                    <div className="flex justify-between border-b border-gray-700/50 pb-1">
                      <span>Available PTO Balance:</span> <span className="font-mono text-emerald-400">{dashboardData.payroll.pto} Days</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-700/50 pb-1">
                      <span>Leaves Taken This Year:</span> <span className="font-mono">{dashboardData.payroll.leavesTaken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Status:</span> <span className="text-emerald-500 font-medium">Online</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50 print:bg-gray-50 print:border-gray-300">
                  <div className="flex items-center gap-2 text-blue-400 mb-3"><Laptop size={16} /><h3 className="font-medium text-gray-200 print:text-black">Payroll Hours & Assets</h3></div>
                  <div className="space-y-2 text-sm text-gray-300 print:text-gray-700">
                    <div className="flex justify-between border-b border-gray-700/50 pb-1">
                      <span>Billable Hours:</span> <span className="font-mono">{dashboardData.payroll.billable} hrs</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-700/50 pb-1">
                      <span>Non-Billable Hours:</span> <span className="font-mono">{dashboardData.payroll.nonBillable} hrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hardware Assigned:</span> <span className="font-mono">MacBook Pro 16"</span>
                    </div>
                  </div>
                </div>
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
