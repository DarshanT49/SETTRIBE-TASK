import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FolderKanban, Clock, CheckCircle } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // Green, Blue, Yellow, Red

export function ProjectAnalytics({ projects }) {
  // Calculate metrics
  const total = projects.length;
  const completed = projects.filter(p => p.status === 'Completed').length;
  const active = projects.filter(p => p.status === 'Active').length;
  const onHold = projects.filter(p => p.status === 'On-Hold').length;
  const delayed = projects.filter(p => p.status === 'Delayed').length;

  const chartData = [
    { name: 'Completed', value: completed },
    { name: 'Active', value: active },
    { name: 'On-Hold', value: onHold },
    { name: 'Delayed', value: delayed }
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Project Metrics Summary */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Project Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4 text-center">
            <h4 className="text-3xl font-bold text-white mb-1">{total}</h4>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Total</p>
          </div>
          <div className="card p-4 text-center bg-emerald-900/20 border-emerald-900/50">
            <h4 className="text-3xl font-bold text-emerald-400 mb-1">{completed}</h4>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Completed</p>
          </div>
          <div className="card p-4 text-center bg-blue-900/20 border-blue-900/50">
            <h4 className="text-3xl font-bold text-blue-400 mb-1">{active}</h4>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Active</p>
          </div>
          <div className="card p-4 text-center bg-red-900/20 border-red-900/50">
            <h4 className="text-3xl font-bold text-red-400 mb-1">{delayed}</h4>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Delayed</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="lg:col-span-1 card p-4 flex flex-col">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Project Status Distribution</h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Current Projects List */}
      <div className="lg:col-span-1 card p-4 flex flex-col">
        <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
          <FolderKanban size={16} /> Current Projects
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
          {projects.map(project => (
            <div key={project.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm text-white truncate max-w-[70%]">{project.name}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  project.status === 'Active' ? 'bg-blue-900/50 text-blue-400' :
                  project.status === 'Completed' ? 'bg-emerald-900/50 text-emerald-400' :
                  project.status === 'Delayed' ? 'bg-red-900/50 text-red-400' :
                  'bg-yellow-900/50 text-yellow-400'
                }`}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1"><Clock size={12}/> {project.endDate}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${project.completion >= 100 ? 'bg-emerald-500' : 'bg-primary-500'}`} 
                  style={{ width: `${project.completion}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
