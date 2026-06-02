import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getRankBadge } from './RankBadges';

export function MyRankInsights({ insights }) {
  const isImproved = insights.trend > 0;
  const isDeclined = insights.trend < 0;

  return (
    <div className="card p-6 h-full flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-6 flex items-center gap-2">
          <Target size={16} /> My Performance Insights
        </h3>
        
        <div className="flex items-center gap-6 mb-8">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Rank</p>
            <div className="inline-block mt-1">
              {getRankBadge(insights.currentRank)}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Trend</p>
            {isImproved ? (
              <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
                <TrendingUp size={16} /> Up {insights.trend} places
              </span>
            ) : isDeclined ? (
              <span className="flex items-center gap-1 text-red-400 text-sm font-bold">
                <TrendingDown size={16} /> Down {Math.abs(insights.trend)} places
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400 text-sm font-bold">
                <Minus size={16} /> Maintained
              </span>
            )}
            <p className="text-xs text-gray-500 mt-1">Prev: #{insights.previousRank}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Dept Rank</p>
            <p className="text-lg font-bold text-white">#{insights.departmentRank}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Project Rank</p>
            <p className="text-lg font-bold text-white">#{insights.projectRank}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
        <p className="text-sm text-gray-300">
          <span className="font-bold text-primary-400">Next Milestone:</span> You need <strong className="text-white">{insights.pointsToNext} more points</strong> to reach <strong className="text-white">Rank #{insights.currentRank - 1}</strong>.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Tip: {insights.tip}
        </p>
      </div>
    </div>
  );
}
