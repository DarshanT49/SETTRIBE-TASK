import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function ProductivityChart({ timeline, tasks, joinedAt }) {
  const [filterMode, setFilterMode] = useState('6_months'); // '3_months', '6_months', 'all'

  const data = useMemo(() => {
    // 1. Map timeline events to find exact completion dates for tasks
    const completionDates = {};
    if (timeline) {
      const doneEvents = timeline.filter(t => t.eventType === 'TASK_STATUS_CHANGE' && (t.toStatus || '').toLowerCase() === 'done' && t.occurredAt);
      doneEvents.forEach(e => {
        if (e.taskId) completionDates[e.taskId] = e.occurredAt.replace(' ', 'T');
      });
    }

    // 2. Gather dates for completed, working, and pending tasks
    const completedDatesList = [];
    const workingDatesList = [];
    const pendingDatesList = [];

    if (tasks && tasks.length > 0) {
      tasks.forEach(t => {
        const s = (t.status || 'todo').toLowerCase();
        
        if (s === 'done' || s === 'completed') {
          if (completionDates[t.id]) {
            completedDatesList.push(completionDates[t.id]);
          } else {
            completedDatesList.push(t.updatedAt ? t.updatedAt.replace(' ', 'T') : (t.createdAt ? t.createdAt.replace(' ', 'T') : new Date().toISOString()));
          }
        } else if (s === 'in_progress' || s === 'working') {
          workingDatesList.push(t.updatedAt ? t.updatedAt.replace(' ', 'T') : (t.createdAt ? t.createdAt.replace(' ', 'T') : new Date().toISOString()));
        } else {
          pendingDatesList.push(t.createdAt ? t.createdAt.replace(' ', 'T') : new Date().toISOString());
        }
      });
    } else if (timeline) {
      // Fallback if tasks array isn't available
      const doneEvents = timeline.filter(t => t.eventType === 'TASK_STATUS_CHANGE' && (t.toStatus || '').toLowerCase() === 'done' && t.occurredAt);
      doneEvents.forEach(e => completedDatesList.push(e.occurredAt.replace(' ', 'T')));
    }

    const now = new Date();
    let buckets = [];

    if (filterMode === 'all') {
      // MONTHLY format from joinedAt to now
      let startDate = joinedAt ? new Date(joinedAt) : new Date(now.getFullYear(), 0, 1);
      if (isNaN(startDate.getTime())) startDate = new Date(now.getFullYear(), 0, 1);
      
      let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      
      while (current <= now && buckets.length < 60) {
        buckets.push({
          key: `${current.getFullYear()}-${current.getMonth()}`,
          name: `${current.toLocaleString('default', { month: 'short' })} ${current.getFullYear().toString().substring(2)}`,
          startDate: new Date(current.getFullYear(), current.getMonth(), 1),
          endDate: new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59),
          completed: 0,
          pending: 0,
          working: 0
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      // WEEKLY format (3 or 6 months)
      const weeksCount = filterMode === '3_months' ? 13 : 26;
      
      for (let i = weeksCount - 1; i >= 0; i--) {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - (i * 7));
        const midWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 4);
        const monthStr = midWeek.toLocaleString('default', { month: 'short' });
        const weekOfMonth = Math.ceil(midWeek.getDate() / 7);
        
        buckets.push({
          key: i,
          name: `${monthStr} W${weekOfMonth}`,
          startDate: startOfWeek,
          endDate: new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59),
          completed: 0,
          pending: 0,
          working: 0
        });
      }
    }

    // Populate data
    const populate = (dateList, key) => {
      dateList.forEach(dateStr => {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const b = buckets.find(w => d >= w.startDate && d <= w.endDate);
          if (b) b[key] += 1;
        }
      });
    };

    populate(completedDatesList, 'completed');
    populate(workingDatesList, 'working');
    populate(pendingDatesList, 'pending');

    return buckets;
  }, [timeline, tasks, filterMode, joinedAt]);

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-100 print:text-black">Productivity Trend</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterMode('3_months')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${filterMode === '3_months' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            3 Months
          </button>
          <button 
            onClick={() => setFilterMode('6_months')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${filterMode === '6_months' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            6 Months
          </button>
          <button 
            onClick={() => setFilterMode('all')}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${filterMode === 'all' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            All Time
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af" 
                fontSize={11} 
                interval={0} 
                minTickGap={10}
                angle={-45}
                textAnchor="end"
                height={50}
                tick={{ dy: 10 }}
              />
              <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
              <Line type="monotone" name="Completed" dataKey="completed" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Working" dataKey="working" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Pending" dataKey="pending" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
