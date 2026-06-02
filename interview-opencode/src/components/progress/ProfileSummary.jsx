import { Calendar, CheckSquare, Target, TrendingUp, User, Briefcase, Award } from 'lucide-react';

export function ProfileSummary({ intern, stats }) {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card p-6 flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-bl-full -z-10"></div>
        
        <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-3xl font-bold text-primary-400 border-4 border-gray-700 shadow-xl flex-shrink-0">
          {intern.name.charAt(0)}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white mb-1">{intern.name}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
            <span className="badge bg-blue-900/40 text-blue-400 border border-blue-800/50">{intern.role}</span>
            <span className="badge bg-gray-800 text-gray-300">{intern.department}</span>
            <span className="badge bg-gray-800 text-gray-300">ID: {intern.employeeId}</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400 justify-center md:justify-start">
              <User size={16} className="text-gray-500" />
              <span>Manager: <strong className="text-gray-300">{intern.reportingManager}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 justify-center md:justify-start">
              <Calendar size={16} className="text-gray-500" />
              <span>Joined: <strong className="text-gray-300">{intern.joiningDate}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 justify-center md:justify-start">
              <Briefcase size={16} className="text-gray-500" />
              <span>Duration: <strong className="text-gray-300">{intern.internshipDuration}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-400 justify-center md:justify-start">
              <Target size={16} className="text-gray-500" />
              <span>Days Left: <strong className="text-gray-300">{intern.remainingDays}</strong> / {intern.daysCompleted + intern.remainingDays}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-primary-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Total Working Days</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.totalWorkingDays}</h3>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <Calendar size={20} className="text-primary-400" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Tasks Completed</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.tasksCompleted} <span className="text-sm text-gray-500 font-normal">/ {stats.tasksAssigned}</span></h3>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <CheckSquare size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Current Score</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.performanceScore}%</h3>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <Award size={20} className="text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card p-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-400">Attendance</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.attendancePercentage}%</h3>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
