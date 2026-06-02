import { getRankBadge } from './RankBadges';
import { Avatar } from '../ui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function LeaderboardTable({ interns }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500">
            <th className="p-4 font-medium">Rank</th>
            <th className="p-4 font-medium">Intern</th>
            <th className="p-4 font-medium hidden sm:table-cell">Department</th>
            <th className="p-4 font-medium">Overall Score</th>
            <th className="p-4 font-medium hidden lg:table-cell">Task Rate</th>
            <th className="p-4 font-medium hidden lg:table-cell">Quality</th>
            <th className="p-4 font-medium hidden xl:table-cell">Attendance</th>
            <th className="p-4 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {interns.map((intern, index) => (
            <tr key={intern.id} className="hover:bg-gray-800/50 transition-colors">
              <td className="p-4">
                {getRankBadge(intern.rank)}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={intern.name} size="sm" />
                  <div>
                    <p className="font-medium text-white text-sm">{intern.name}</p>
                    <p className="text-xs text-gray-500 lg:hidden">{intern.department}</p>
                  </div>
                </div>
              </td>
              <td className="p-4 hidden sm:table-cell text-sm text-gray-300">
                {intern.department}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{intern.score}</span>
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full hidden sm:block">
                    <div 
                      className={`h-1.5 rounded-full ${intern.score >= 90 ? 'bg-emerald-500' : intern.score >= 75 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                      style={{ width: `${intern.score}%` }}
                    ></div>
                  </div>
                </div>
              </td>
              <td className="p-4 hidden lg:table-cell text-sm text-gray-400">
                {intern.metrics.taskRate}%
              </td>
              <td className="p-4 hidden lg:table-cell text-sm text-gray-400">
                {intern.metrics.quality}%
              </td>
              <td className="p-4 hidden xl:table-cell text-sm text-gray-400">
                {intern.metrics.attendance}%
              </td>
              <td className="p-4">
                {intern.trend > 0 ? (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                    <TrendingUp size={14} /> +{intern.trend}
                  </span>
                ) : intern.trend < 0 ? (
                  <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
                    <TrendingDown size={14} /> {intern.trend}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                    <Minus size={14} /> -
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
