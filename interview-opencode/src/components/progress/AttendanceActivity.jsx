import { CalendarCheck, CalendarX, Clock, Coffee, Users, Video } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AttendanceActivity({ stats, activityData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CalendarCheck size={18} />
            <span className="text-sm font-medium">Present Days</span>
          </div>
          <h4 className="text-2xl font-bold text-white">{stats.present}</h4>
        </div>
        <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <CalendarX size={18} />
            <span className="text-sm font-medium">Absent Days</span>
          </div>
          <h4 className="text-2xl font-bold text-white">{stats.absent}</h4>
        </div>
        <div className="bg-yellow-900/10 border border-yellow-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <Clock size={18} />
            <span className="text-sm font-medium">Late Logins</span>
          </div>
          <h4 className="text-2xl font-bold text-white">{stats.late}</h4>
        </div>
        <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Coffee size={18} />
            <span className="text-sm font-medium">Leave Days</span>
          </div>
          <h4 className="text-2xl font-bold text-white">{stats.leaves}</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Activity & Hours Logged (Past Week)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="day" type="category" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#374151', opacity: 0.4 }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Hours Logged" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 flex flex-col justify-center space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Video size={16} /> Meeting Participation
            </h3>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold text-white">{stats.meetingParticipation}%</span>
              <span className="text-sm text-gray-400 mb-1">Participation Rate</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
              <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${stats.meetingParticipation}%` }}></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Meetings</p>
              <p className="text-xl font-bold text-white">{stats.totalMeetings}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Attended</p>
              <p className="text-xl font-bold text-emerald-400">{stats.attendedMeetings}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
