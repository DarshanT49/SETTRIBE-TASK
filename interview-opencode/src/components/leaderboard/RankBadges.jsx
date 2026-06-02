import { Crown, Star, Award } from 'lucide-react';

export function getRankBadge(rank) {
  switch (rank) {
    case 1:
      return (
        <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full border border-yellow-500/30 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]">
          <Crown size={14} className="fill-yellow-500" />
          <span className="text-xs">1st</span>
        </div>
      );
    case 2:
      return (
        <div className="flex items-center gap-1 bg-gray-300/20 text-gray-300 px-2 py-1 rounded-full border border-gray-300/30 font-bold">
          <Crown size={14} className="fill-gray-300" />
          <span className="text-xs">2nd</span>
        </div>
      );
    case 3:
      return (
        <div className="flex items-center gap-1 bg-amber-700/20 text-amber-600 px-2 py-1 rounded-full border border-amber-700/30 font-bold">
          <Crown size={14} className="fill-amber-600" />
          <span className="text-xs">3rd</span>
        </div>
      );
    case 4:
    case 5:
      return (
        <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20 font-bold">
          <Award size={14} />
          <span className="text-xs">Top 5</span>
        </div>
      );
    default:
      if (rank <= 10) {
        return (
          <div className="flex items-center gap-1 bg-purple-500/10 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20 font-bold">
            <Star size={14} />
            <span className="text-xs">Top 10</span>
          </div>
        );
      }
      return <span className="text-gray-500 font-medium px-2 text-sm">#{rank}</span>;
  }
}
