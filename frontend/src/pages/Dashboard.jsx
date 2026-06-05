import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FolderKanban, CheckSquare, Video, UserCheck, Clock,
  TrendingUp, AlertTriangle, Plus, BarChart3, Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet } from '../services/storage';
import { fetchProjects } from '../services/projectApi';
import { fetchTasks } from '../services/taskApi';
import { Avatar, Button, StatusBadge, Skeleton } from '../components/ui';
import { formatRelativeTime, getMeetingStatus } from '../utils/dates';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import api from '../services/api';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      let users = await asyncGet(KEYS.USERS) || [];
      try {
        const resp = await api.get('/users');
        if (resp.data) {
          users = resp.data;
          await asyncSet(KEYS.USERS, users);
        }
      } catch (e) {
        console.warn('Could not fetch users', e);
      }

      const email = currentUser.email; // Assuming currentUser has email, else use id or token backend will resolve
      const resp = await api.get('/dashboard', { headers: { 'user-email': email } });
      const dashboardData = resp.data;

      const today = new Date().toISOString().split('T')[0];
      const thisWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      setData({
        users,
        ...dashboardData,
        today,
        thisWeek
      });
      setLoading(false);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useAutoRefresh(load);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const role = currentUser.role;

  if (role === 'admin') return <AdminDashboard data={data} currentUser={currentUser} />;
  if (role === 'hr') return <HRDashboard data={data} currentUser={currentUser} />;
  if (role === 'manager') return <ManagerDashboard data={data} currentUser={currentUser} />;
  if (role === 'panel') return <PanelDashboard data={data} currentUser={currentUser} />;
  return <EmployeeDashboard data={data} currentUser={currentUser} />;
}

function StatCard({ icon: Icon, label, value, color = 'primary', sublabel, trend }) {
  const colors = {
    primary: 'text-primary-400 bg-primary-900/20 border-primary-800/30',
    green: 'text-emerald-400 bg-emerald-900/20 border-emerald-800/30',
    yellow: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/30',
    red: 'text-red-400 bg-red-900/20 border-red-800/30',
    blue: 'text-blue-400 bg-blue-900/20 border-blue-800/30',
    purple: 'text-purple-400 bg-purple-900/20 border-purple-800/30',
    orange: 'text-orange-400 bg-orange-900/20 border-orange-800/30'
  };
  return (
    <div className="stat-card group hover:scale-[1.02] transition-transform">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-100">{value}</p>
          {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({ history, users }) {
  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unknown';
  return (
    <div className="space-y-3">
      {history.slice(0, 8).map(h => (
        <div key={h.id} className="flex gap-3 text-sm">
          <Avatar name={getUserName(h.performedBy)} size="xs" className="mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-gray-300">{h.details}</span>
            <p className="text-xs text-gray-600 mt-0.5">{formatRelativeTime(h.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MeetingCard({ meeting, users }) {
  const host = users.find(u => u.id === meeting.hostId);
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
      <div className="text-center w-10">
        <p className="text-xs text-gray-500">{meeting.time?.split(':')[0]}</p>
        <p className="text-base font-bold text-gray-200">{meeting.time?.split(':')[1] || '00'}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{meeting.title}</p>
        <p className="text-xs text-gray-500">Host: {host?.name} · {meeting.duration}min</p>
      </div>
      <Link to={`/meetings/${meeting.id}`}>
        <Button variant="ghost" size="sm">Join</Button>
      </Link>
    </div>
  );
}

function AdminDashboard({ data, currentUser }) {
  const {
    users, totalProjects, activeProjects, pendingTasks, todayMeetings,
    todayInterviewsList = [], pendingRegistrationRequests = [],
    delayedMilestones = [], taskStatusDistribution = [], weeklyTasks = []
  } = data;
  
  const pendingRequests = pendingRegistrationRequests.length;
  // Fallback in case backend doesn't provide history (could be fetched locally for now)
  const projectHistory = data.projectHistory || [];

  const taskStatusData = taskStatusDistribution.map(d => {
    let color = '#6b7280';
    if (d.status === 'In Progress') color = '#3b82f6';
    if (d.status === 'In Review') color = '#f59e0b';
    if (d.status === 'Completed' || d.status === 'Done') color = '#10b981';
    return { name: d.status, value: d.count, color };
  }).filter(d => d.value > 0);

  const weeklyTasksData = weeklyTasks.map(w => ({
    day: w.day,
    completed: w.tasks, // mapping simply for now
    created: 0 // dummy or add to DTO
  }));

  const upcomingMeetings = data.upcomingMeetings || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Good to see you, {currentUser.name}! Here's what's happening.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/employees"><Button variant="secondary" size="sm"><Plus size={14} />Add Employee</Button></Link>
          <Link to="/projects/new"><Button size="sm"><Plus size={14} />New Project</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users} label="Total Employees" value={users.filter(u => u.isActive).length} color="primary" />
        <StatCard icon={Shield} label="Pending Approvals" value={pendingRequests} color={pendingRequests > 0 ? 'red' : 'green'} />
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} color="blue" />
        <StatCard icon={CheckSquare} label="Pending Tasks" value={pendingTasks} color="orange" />
        <StatCard icon={Video} label="Meetings Today" value={todayMeetings} color="purple" />
        <StatCard icon={UserCheck} label="Today's Interviews" value={data.todayInterviews || 0} color="yellow" />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Tasks Chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-primary-400" /> Tasks This Week</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyTasksData} barSize={12}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
              <Bar dataKey="created" fill="#6366f1" radius={[4, 4, 0, 0]} name="Created" />
              <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-100 mb-4">Task Status</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={taskStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {taskStatusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1">
            {taskStatusData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: d.color }} /><span className="text-gray-400">{d.name}</span></div>
                <span className="text-gray-300 font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delayed Milestones + Activity + Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Feed */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-100 mb-4">Recent Activity</h2>
          <ActivityFeed history={projectHistory} users={users} />
        </div>

        {/* Delayed Milestones */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" /> Delayed Milestones
          </h2>
          {delayedMilestones.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No delayed milestones 🎉</div>
          ) : (
            <div className="space-y-3">
              {delayedMilestones.map(m => (
                <div key={m.id} className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
                  <p className="text-sm font-medium text-red-400">{m.title}</p>
                  <p className="text-xs text-gray-500 mt-1">Delayed by {m.delayDays} days</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">Upcoming Meetings</h2>
            <Link to="/meetings" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          <div className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">No upcoming meetings</div>
            ) : upcomingMeetings.map(m => <MeetingCard key={m.id} meeting={m} users={users} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function HRDashboard({ data, currentUser }) {
  const { users, todayMeetings, pendingRegistrationRequests = [], todayInterviewsList = [] } = data;
  const pendingRequests = pendingRegistrationRequests;
  const todayInterviews = todayInterviewsList;


  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">HR Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome, {currentUser.name}!</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Employees" value={users.filter(u => u.isActive).length} color="primary" />
        <StatCard icon={Shield} label="Pending Approvals" value={pendingRequests.length} color={pendingRequests.length > 0 ? 'red' : 'green'} />
        <StatCard icon={UserCheck} label="Today's Interviews" value={todayInterviews.length} color="blue" />
        <StatCard icon={Video} label="Meetings Today" value={todayMeetings.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending Approvals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">Pending Registrations</h2>
            <Link to="/employees/pending" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No pending requests</div>
          ) : pendingRequests.slice(0, 3).map(req => {
            const user = users.find(u => String(u.id) === String(req.userId));
            if (!user) return null;
            return (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-3">
                <Avatar name={user.name} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role} · {user.department}</p>
                </div>
                <Link to="/employees/pending"><Button size="sm" variant="secondary">Review</Button></Link>
              </div>
            );
          })}
        </div>

        {/* Today's Interviews */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">Today's Interviews</h2>
            <Link to="/interviews" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          {todayInterviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No interviews today</div>
          ) : todayInterviews.map(i => (
            <div key={i.id} className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-200">{i.candidateName}</p>
                  <p className="text-xs text-gray-500">{i.position} · {i.time}</p>
                </div>
                <StatusBadge status={i.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard({ data, currentUser }) {
  const {
    users, pendingTasks, pendingApprovals, todayMeetings, activeProjects,
    myProjects = [], upcomingMeetings = [], teamProductivity = []
  } = data;
  
  const teamTasksCount = pendingTasks;
  const pendingReviews = pendingApprovals;
  
  const mappedTeamProductivity = teamProductivity.map(u => ({
    name: u.userName.split(' ')[0],
    completed: u.completedTasks,
    pending: u.pendingTasks
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Manager Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Team overview for {currentUser.name}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Team Tasks" value={teamTasksCount} color="primary" />
        <StatCard icon={Clock} label="Pending Reviews" value={pendingReviews} color="orange" />
        <StatCard icon={Video} label="Upcoming Meetings" value={upcomingMeetings.length} color="blue" />
        <StatCard icon={FolderKanban} label="My Projects" value={myProjects.length} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-100 mb-4">Team Productivity</h2>
          {mappedTeamProductivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No team data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mappedTeamProductivity} barSize={12}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#f9fafb' }} />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">My Projects</h2>
            <Link to="/projects" className="text-xs text-primary-400">View all →</Link>
          </div>
          {myProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No projects assigned</div>
          ) : myProjects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg mb-3 hover:border-gray-600 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-200">{p.title}</p>
                <div className="mt-1 h-1.5 bg-gray-700 rounded-full"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${p.progress}%` }} /></div>
              </div>
              <span className="text-xs text-gray-500">{p.progress}%</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard({ data, currentUser }) {
  const {
    users, pendingTasks, todayMeetings, overdueTasks = [],
    myProjects = [], upcomingMeetings = [], myInterviewsList = []
  } = data;
  
  const openTasks = new Array(pendingTasks).fill({}); // Dummy array for length checking if needed, but we can just use pendingTasks
  const openTasksCount = pendingTasks;
  const completedThisWeek = data.completedThisWeek || 0;
  
  const parsePanelIds = (panelIds) => {
    if (!panelIds) return [];
    if (Array.isArray(panelIds)) return panelIds;
    if (typeof panelIds === 'string') {
      try {
        const parsed = JSON.parse(panelIds);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return panelIds.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const myInterviews = myInterviewsList;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">My Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {currentUser.name}!</p>
      </div>

      {overdueTasks.length > 0 && (
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}!</p>
            <p className="text-xs text-red-500 mt-0.5">Please submit delay reasons for overdue tasks.</p>
          </div>
          <Link to="/tasks" className="ml-auto"><Button variant="danger" size="sm">View Tasks</Button></Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="Open Tasks" value={openTasksCount} color="primary" />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={overdueTasks.length} color={overdueTasks.length > 0 ? 'red' : 'green'} />
        <StatCard icon={Video} label="Upcoming Meetings" value={upcomingMeetings.length} color="blue" />
        <StatCard icon={TrendingUp} label="Completed / Week" value={completedThisWeek} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Projects */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">My Projects</h2>
            <Link to="/projects" className="text-xs text-primary-400">View all →</Link>
          </div>
          {myProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No projects yet</div>
          ) : myProjects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg mb-3 hover:border-gray-600 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-200">{p.title}</p>
                <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${p.progress}%` }} /></div>
                <p className="text-xs text-gray-500 mt-0.5">{p.progress}% complete</p>
              </div>
              <StatusBadge status={p.status} />
            </Link>
          ))}
        </div>

        {/* Upcoming Meetings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-100">Upcoming Meetings</h2>
            <Link to="/meetings" className="text-xs text-primary-400">View all →</Link>
          </div>
          {upcomingMeetings.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">No upcoming meetings</div>
          ) : upcomingMeetings.slice(0, 3).map(m => <MeetingCard key={m.id} meeting={m} users={users} />)}
        </div>
        
        {/* Assigned Interviews */}
        {(myInterviews.length > 0 || currentUser.role === 'employee') && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-100">Assigned Interviews</h2>
              <Link to="/interviews" className="text-xs text-primary-400">View all →</Link>
            </div>
            {myInterviews.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">No interviews assigned</div>
            ) : myInterviews.slice(0, 3).map(i => (
              <Link key={i.id} to={`/interviews/${i.id}`} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg mb-3 hover:border-gray-600 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-200">{i.candidateName}</p>
                  <p className="text-xs text-gray-500">{i.position} · {i.date} {i.time}</p>
                </div>
                <StatusBadge status={i.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PanelDashboard({ data, currentUser }) {
  const { myInterviewsList = [] } = data;
  const myInterviews = myInterviewsList;
  const pending = myInterviews.filter(i => ['scheduled', 'waiting'].includes(i.status));
  const todayI = myInterviews.filter(i => i.date === data.today);
  const completed = myInterviews.filter(i => i.status === 'completed');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Panel Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Interview evaluator view</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Assigned Interviews" value={myInterviews.length} color="primary" />
        <StatCard icon={Clock} label="Pending Evaluations" value={pending.length} color="orange" />
        <StatCard icon={CheckSquare} label="Completed" value={completed.length} color="green" />
        <StatCard icon={Video} label="Today's Interviews" value={todayI.length} color="blue" />
      </div>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-100">My Interviews</h2>
          <Link to="/interviews" className="text-xs text-primary-400">View all →</Link>
        </div>
        {myInterviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">No interviews assigned</div>
        ) : myInterviews.map(i => (
          <Link key={i.id} to={`/interviews/${i.id}`} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg mb-3 hover:border-gray-600 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-200">{i.candidateName}</p>
              <p className="text-xs text-gray-500">{i.position} · {i.date} {i.time}</p>
            </div>
            <StatusBadge status={i.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  );
}
