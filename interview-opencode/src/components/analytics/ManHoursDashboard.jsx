   
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
   
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Clock, CheckCircle, TrendingUp, Calendar, Activity, AlertCircle, Download } from 'lucide-react';
   
import { worklogService } from '../../services/worklogs';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ManHoursDashboard({ userId }) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Normally we'd fetch from the actual API:
        // const data = await worklogService.getUserAnalytics(userId);
        
        // Using mock data for demonstration while backend is integrated
        setTimeout(() => {
          setAnalytics({
            totalHoursWorked: 420.5,
            hoursWorkedThisWeek: 34.5,
            hoursWorkedThisMonth: 85.0,
            averageDailyHours: 6.8,
            averageWeeklyHours: 34.0,
            efficiencyScore: 108,
            aiInsights: [
              "You have contributed 180 hours to the MTMS Platform, representing 42% of your total work effort.",
              "Most of your delays occur in Backend testing tasks. Consider allocating more time.",
              "Your task completion efficiency is at 108%. Excellent work!"
            ],
            projectAnalytics: [
              { projectName: 'MTMS Platform', totalHoursContributed: 180, tasksWorkedOn: 40, projectContributionPercentage: 52 },
              { projectName: 'Employee Management', totalHoursContributed: 120, tasksWorkedOn: 25, projectContributionPercentage: 35 },
              { projectName: 'Internal Tools', totalHoursContributed: 45, tasksWorkedOn: 10, projectContributionPercentage: 13 }
            ],
            taskAnalytics: [
              { taskName: 'Authentication Module', estimatedHours: 10, actualHoursWorked: 8, taskStatus: 'Completed', efficiencyPercentage: 125, timeDifference: -2 },
              { taskName: 'Dashboard UI', estimatedHours: 15, actualHoursWorked: 16, taskStatus: 'In Progress', efficiencyPercentage: 93, timeDifference: 1 },
              { taskName: 'API Integration', estimatedHours: 8, actualHoursWorked: 7.5, taskStatus: 'Completed', efficiencyPercentage: 106, timeDifference: -0.5 }
            ],
            dailyProductivity: [
              { name: 'Mon', hours: 7.5 }, { name: 'Tue', hours: 8.2 }, { name: 'Wed', hours: 6.5 },
              { name: 'Thu', hours: 7.8 }, { name: 'Fri', hours: 4.5 }
            ],
            hoursPerCategory: [
              { name: 'Development', value: 250 },
              { name: 'Testing', value: 80 },
              { name: 'Meetings', value: 50 },
              { name: 'Documentation', value: 40 }
            ]
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchAnalytics();
    }
  }, [userId]);

  if (loading) {
    return <div className="text-white text-center p-12">Loading Analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-white text-center p-12">No analytics data available.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Man-Hours & Productivity</h2>
          <p className="text-gray-400 text-sm">Track your invested time and overall productivity.</p>
        </div>
        {currentUser?.role !== 'intern' && (
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Monthly Report</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-gray-400 font-medium">Total Hours</h3>
          </div>
          <p className="text-2xl font-bold text-white">{analytics.totalHoursWorked}h</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-gray-400 font-medium">This Month</h3>
          </div>
          <p className="text-2xl font-bold text-white">{analytics.hoursWorkedThisMonth}h</p>
          <p className="text-sm text-emerald-400 mt-1">Avg {analytics.averageDailyHours}h / day</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-gray-400 font-medium">This Week</h3>
          </div>
          <p className="text-2xl font-bold text-white">{analytics.hoursWorkedThisWeek}h</p>
          <p className="text-sm text-purple-400 mt-1">Avg {analytics.averageWeeklyHours}h / week</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700/50 p-5 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-gray-400 font-medium">Efficiency Score</h3>
          </div>
          <p className="text-2xl font-bold text-white">{analytics.efficiencyScore}%</p>
          <p className="text-sm text-gray-400 mt-1">Actual vs Estimated</p>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          My Time Insights
        </h3>
        <ul className="space-y-3">
          {analytics.aiInsights.map((insight, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-300">
              <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Productivity Graph */}
        <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Daily Productivity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyProductivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Workload Distribution */}
        <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Workload by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.hoursPerCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.hoursPerCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Breakdown */}
      <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Project-Wise Contribution</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="pb-3 pr-4 font-medium">Project Name</th>
                <th className="pb-3 px-4 font-medium text-right">Hours Contributed</th>
                <th className="pb-3 px-4 font-medium text-right">Tasks Completed</th>
                <th className="pb-3 pl-4 font-medium text-right">Contribution %</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {analytics.projectAnalytics.map((proj, i) => (
                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                  <td className="py-4 pr-4 font-medium text-white">{proj.projectName}</td>
                  <td className="py-4 px-4 text-right">{proj.totalHoursContributed}h</td>
                  <td className="py-4 px-4 text-right">{proj.tasksWorkedOn}</td>
                  <td className="py-4 pl-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-emerald-400">{proj.projectContributionPercentage}%</span>
                      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${proj.projectContributionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Performance Table */}
      <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Task-Level Planned vs Actual</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="pb-3 pr-4 font-medium">Task Name</th>
                <th className="pb-3 px-4 font-medium">Status</th>
                <th className="pb-3 px-4 font-medium text-right">Estimated</th>
                <th className="pb-3 px-4 font-medium text-right">Actual</th>
                <th className="pb-3 pl-4 font-medium text-right">Efficiency</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {analytics.taskAnalytics.map((task, i) => (
                <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                  <td className="py-4 pr-4 font-medium text-white">{task.taskName}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      task.taskStatus === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {task.taskStatus}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">{task.estimatedHours}h</td>
                  <td className="py-4 px-4 text-right">{task.actualHoursWorked}h</td>
                  <td className="py-4 pl-4 text-right">
                    <span className={task.timeDifference <= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {task.efficiencyPercentage}% 
                      <span className="text-xs ml-1 text-gray-500">
                        ({task.timeDifference <= 0 ? 'Ahead' : 'Overrun'})
                      </span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
