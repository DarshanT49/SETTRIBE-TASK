   
import { useAuth } from '../contexts/AuthContext';

// Import components
import { ProfileSummary } from '../components/progress/ProfileSummary';
import { ProjectAnalytics } from '../components/progress/ProjectAnalytics';
import { TaskAnalytics } from '../components/progress/TaskAnalytics';
import { AttendanceActivity } from '../components/progress/AttendanceActivity';
import { PerformanceScorecard } from '../components/progress/PerformanceScorecard';
import { SkillsGrowth } from '../components/progress/SkillsGrowth';
import { GoalTracking } from '../components/progress/GoalTracking';
import { FeedbackReviews } from '../components/progress/FeedbackReviews';
import { Achievements } from '../components/progress/Achievements';
import { AIInsights } from '../components/progress/AIInsights';
import { ExportReports } from '../components/progress/ExportReports';
import { ManHoursDashboard } from '../components/analytics/ManHoursDashboard';

export default function MyProgress({ targetEmployee, isEmbedded = false }) {
  const { currentUser } = useAuth();
  const displayUser = targetEmployee || currentUser;
  
  // Mock Data Generators for the dashboard sections
  const internProfile = {
    name: displayUser?.name || 'Intern Name',
    employeeId: displayUser?.employeeId || 'INT-1024',
    role: displayUser?.role || 'Intern',
    department: displayUser?.department || 'Engineering',
    reportingManager: 'Sarah Jenkins',
    joiningDate: 'Jan 15, 2026',
    internshipDuration: '6 Months',
    daysCompleted: 138,
    remainingDays: 45
  };

  const generalStats = {
    totalWorkingDays: 95,
    projectsAssigned: 4,
    tasksAssigned: 45,
    tasksCompleted: 38,
    performanceScore: 88,
    attendancePercentage: 96
  };

  const projectData = [
    { id: 1, name: 'Customer Portal Redesign', status: 'Completed', endDate: 'Mar 30, 2026', completion: 100 },
    { id: 2, name: 'API Rate Limiting', status: 'Active', endDate: 'Jun 15, 2026', completion: 65 },
    { id: 3, name: 'Mobile App Notifications', status: 'Delayed', endDate: 'May 20, 2026', completion: 40 },
    { id: 4, name: 'Internal Auth Service', status: 'On-Hold', endDate: 'Jul 01, 2026', completion: 10 }
  ];

  const taskSummary = {
    completed: 38,
    inProgress: 5,
    pending: 2,
    overdue: 1
  };

  const weeklyTaskData = [
    { day: 'Mon', completed: 2 },
    { day: 'Tue', completed: 4 },
    { day: 'Wed', completed: 3 },
    { day: 'Thu', completed: 6 },
    { day: 'Fri', completed: 5 }
  ];

  const monthlyTaskData = [
    { month: 'Jan', completionRate: 75 },
    { month: 'Feb', completionRate: 82 },
    { month: 'Mar', completionRate: 90 },
    { month: 'Apr', completionRate: 88 },
    { month: 'May', completionRate: 95 }
  ];



  const attendanceStats = {
    present: 91,
    absent: 2,
    late: 3,
    leaves: 4,
    meetingParticipation: 85,
    totalMeetings: 40,
    attendedMeetings: 34
  };

  const activityData = [
    { day: 'Mon', hours: 8.5 },
    { day: 'Tue', hours: 9.0 },
    { day: 'Wed', hours: 7.5 },
    { day: 'Thu', hours: 8.0 },
    { day: 'Fri', hours: 6.5 }
  ];

  const scorecardData = {
    overall: 88,
    rank: 3,
    categories: [
      { name: 'Task Completion', weight: 30, score: 92 },
      { name: 'Quality of Work', weight: 20, score: 85 },
      { name: 'Project Contribution', weight: 20, score: 90 },
      { name: 'Attendance', weight: 15, score: 96 },
      { name: 'Communication', weight: 10, score: 80 },
      { name: 'Meeting Participation', weight: 5, score: 85 }
    ]
  };

  const skillsData = [
    { subject: 'React/Frontend', A: 90, fullMark: 100 },
    { subject: 'Java/Backend', A: 75, fullMark: 100 },
    { subject: 'Database/SQL', A: 65, fullMark: 100 },
    { subject: 'Problem Solving', A: 85, fullMark: 100 },
    { subject: 'Communication', A: 80, fullMark: 100 },
    { subject: 'Learning Progress', A: 95, fullMark: 100 }
  ];

  const goalsList = [
    { id: 1, title: 'Complete API Rate Limiting Module', description: 'Finish implementation and tests for the rate limiter.', progress: 65, targetDate: 'Jun 15' },
    { id: 2, title: 'Resolve 10 High Priority Bugs', description: 'Pick up and resolve bugs from the backlog.', progress: 100, targetDate: 'May 30' },
    { id: 3, title: 'Improve Code Coverage to 80%', description: 'Write unit tests for existing modules.', progress: 40, targetDate: 'Jul 01' }
  ];

  const feedbackList = [
    { id: 1, from: 'Sarah Jenkins (Manager)', date: 'May 28', type: 'positive', message: 'Excellent work on the customer portal! The UI looks very polished.' },
    { id: 2, from: 'David Chen (Senior Dev)', date: 'May 20', type: 'constructive', message: 'Good progress, but try to break down large tasks into smaller logical units.' },
    { id: 3, from: 'HR Review', date: 'Apr 30', type: 'positive', message: 'Great participation in team meetings and very good attendance record.' }
  ];

  const achievementsList = [
    { id: 1, title: 'First Task Completed', description: 'Completed very first assigned task.', earned: true, date: 'Jan 18' },
    { id: 2, title: 'Project Champion', description: 'Delivered a project module ahead of schedule.', earned: true, date: 'Mar 25' },
    { id: 3, title: 'Bug Squasher', description: 'Fixed 20+ critical bugs.', earned: true, date: 'May 10' },
    { id: 4, title: 'Perfect Attendance', description: '100% attendance for a full month.', earned: false }
  ];

  const aiInsightsData = [
    "Your task completion rate increased by 15% this month. Keep it up!",
    "You perform exceptionally well on Frontend (React) tasks.",
    "Most of your delays occur in Backend testing tasks. Consider allocating more time for testing.",
    "Your productivity peaks between 10 AM and 2 PM based on your activity history.",
    "Consider contributing more to documentation to improve your overall rating."
  ];

  return (
    <div className={`flex flex-col gap-12 max-w-[1600px] mx-auto ${isEmbedded ? '' : 'pb-12'}`}>
      {!isEmbedded && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">My Progress Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Track your performance, contributions, and growth.</p>
          </div>
        </div>
      )}

      {/* 1. Profile Summary Section */}
      <section>
        <ProfileSummary intern={internProfile} stats={generalStats} />
      </section>

      {/* NEW: Man-Hours & Productivity Dashboard */}
      <section className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800/60">
        <ManHoursDashboard userId={displayUser?.id || 'mock-id'} />
      </section>

      {/* 6. Performance Scorecard Section */}
      <section>
        <PerformanceScorecard scoreData={scorecardData} />
      </section>

      {/* 2. Project Analytics */}
      <section>
        <ProjectAnalytics projects={projectData} />
      </section>

      {/* 3. Task Analytics */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-3">Task Performance</h2>
        <TaskAnalytics taskSummary={taskSummary} weeklyData={weeklyTaskData} monthlyData={monthlyTaskData} />
      </section>

      {/* 5. Attendance & 7. Skills */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-3">Attendance & Activity</h2>
          <AttendanceActivity stats={attendanceStats} activityData={activityData} />
        </section>
        
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-white border-b border-gray-800 pb-3">Skills Growth Tracker</h2>
          <SkillsGrowth skillsData={skillsData} />
        </section>
      </div>

      {/* 8, 9 & 10. Goals, Feedback, Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GoalTracking goals={goalsList} />
        <FeedbackReviews feedbackList={feedbackList} />
        <Achievements achievements={achievementsList} />
      </div>

      {/* 11 & 12. AI Insights & Exports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <AIInsights insights={aiInsightsData} />
        </div>
        <div className="lg:col-span-2">
          <ExportReports />
        </div>
      </div>
    </div>
  );
}
