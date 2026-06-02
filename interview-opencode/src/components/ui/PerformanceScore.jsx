import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function PerformanceScore({ score, trend }) {
  let trendIcon = <Minus size={16} className="text-gray-500" />;
  let trendColor = "text-gray-500";
  let trendText = "No change";

  if (trend) {
    if (trend.isImproving && trend.difference > 0) {
      trendIcon = <TrendingUp size={16} className="text-emerald-500" />;
      trendColor = "text-emerald-500";
      trendText = `+${trend.difference} pts (30d)`;
    } else if (!trend.isImproving && trend.difference > 0) {
      trendIcon = <TrendingDown size={16} className="text-red-500" />;
      trendColor = "text-red-500";
      trendText = `-${trend.difference} pts (30d)`;
    }
  }

  // Get color based on score
  const getScoreColor = (s) => {
    if (s >= 85) return 'text-emerald-400';
    if (s >= 70) return 'text-blue-400';
    if (s >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle cx="48" cy="48" r="40" stroke="#374151" strokeWidth="6" fill="transparent" />
          <circle 
            cx="48" cy="48" r="40" 
            stroke="currentColor" 
            strokeWidth="6" 
            fill="transparent"
            strokeDasharray={251.2}
            strokeDashoffset={251.2 - (251.2 * score) / 100}
            className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Score</span>
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
        {trendIcon}
        <span>{trendText}</span>
      </div>
    </div>
  );
}
