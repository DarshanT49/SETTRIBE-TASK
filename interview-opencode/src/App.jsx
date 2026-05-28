
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthGuard, PublicRoute, RoleGuard } from './components/layout/Guards';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import PendingApprovals from './pages/PendingApprovals';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import MyTasks from './pages/MyTasks';
import SelfTasks from './pages/SelfTasks';
import Meetings from './pages/Meetings';
import NewMeeting from './pages/NewMeeting';
import MeetingDetail from './pages/MeetingDetail';
import MeetingRoom from './pages/MeetingRoom';
import Interviews from './pages/Interviews';
import InterviewDetail from './pages/InterviewDetail';
import NewInterview from './pages/NewInterview';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

// Simple pending / denied pages
function PendingApprovalPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">Account Pending Approval</h1>
        <p className="text-gray-400 text-sm">Your registration is awaiting Admin or HR approval. You'll be notified by email once it's reviewed.</p>
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="card p-8 max-w-md text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">Access Denied</h1>
        <p className="text-gray-400 text-sm">You don't have permission to view this page.</p>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">Page Not Found</h1>
        <p className="text-gray-400 text-sm">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', borderRadius: '12px' },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
              }}
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/pending-approval" element={<PendingApprovalPage />} />
              <Route path="/access-denied" element={<AccessDenied />} />

              {/* Meeting Room (Full Screen, no layout) */}
              <Route path="/meetings/:id/room" element={<AuthGuard><MeetingRoom /></AuthGuard>} />

              {/* Protected Routes with Layout */}
              <Route path="/*" element={
                <AuthGuard>
                  <MainLayout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />

                      {/* Employees */}
                      <Route path="/employees" element={<Employees />} />
                      <Route path="/employees/:id" element={<EmployeeProfile />} />
                      <Route path="/employees/pending" element={<RoleGuard allowedRoles={['admin', 'hr']}><PendingApprovals /></RoleGuard>} />

                      {/* Projects */}
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/new" element={<NewProject />} />
                      <Route path="/projects/:id" element={<ProjectDetail />} />

                      {/* Tasks */}
                      <Route path="/tasks" element={<MyTasks />} />
                      <Route path="/self-tasks" element={<SelfTasks />} />

                      {/* Meetings */}
                      <Route path="/meetings" element={<Meetings />} />
                      <Route path="/meetings/new" element={<NewMeeting />} />
                      <Route path="/meetings/:id" element={<MeetingDetail />} />

                      {/* Interviews */}
                      <Route path="/interviews" element={<Interviews />} />
                      <Route path="/interviews/new" element={<RoleGuard allowedRoles={['admin', 'hr']}><NewInterview /></RoleGuard>} />
                      <Route path="/interviews/:id" element={<InterviewDetail />} />

                      {/* User */}
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/notifications" element={<Notifications />} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MainLayout>
                </AuthGuard>
              } />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
