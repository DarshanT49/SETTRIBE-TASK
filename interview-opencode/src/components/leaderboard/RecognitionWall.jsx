import { Trophy, Star, Zap, Flame, Rocket } from 'lucide-react';
import { Avatar } from '../ui';

export function RecognitionWall({ wallOfFame }) {
  return (
    <div className="card p-6 h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-400 mb-6 flex items-center gap-2">
        <Star size={16} className="text-yellow-500 fill-yellow-500" /> Hall of Fame
      </h3>
      
      <div className="flex-1 space-y-4">
        <div className="bg-gradient-to-r from-yellow-900/30 to-gray-800/30 border border-yellow-700/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 flex-shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
            <Trophy size={20} className="fill-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-yellow-500 uppercase tracking-wider font-bold mb-1">Intern of the Month</p>
            <p className="text-sm font-bold text-white">{wallOfFame.internOfMonth.name}</p>
          </div>
          <Avatar name={wallOfFame.internOfMonth.name} size="sm" />
        </div>

        <div className="bg-gradient-to-r from-emerald-900/30 to-gray-800/30 border border-emerald-700/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
            <TrendingUpIcon size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-emerald-500 uppercase tracking-wider font-bold mb-1">Most Improved</p>
            <p className="text-sm font-bold text-white">{wallOfFame.mostImproved.name}</p>
          </div>
          <Avatar name={wallOfFame.mostImproved.name} size="sm" />
        </div>

        <div className="bg-gradient-to-r from-blue-900/30 to-gray-800/30 border border-blue-700/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 flex-shrink-0">
            <Zap size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-blue-500 uppercase tracking-wider font-bold mb-1">Fastest Delivery</p>
            <p className="text-sm font-bold text-white">{wallOfFame.fastestDelivery.name}</p>
          </div>
          <Avatar name={wallOfFame.fastestDelivery.name} size="sm" />
        </div>

        <div className="bg-gradient-to-r from-purple-900/30 to-gray-800/30 border border-purple-700/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 flex-shrink-0">
            <Rocket size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-purple-500 uppercase tracking-wider font-bold mb-1">Rising Star</p>
            <p className="text-sm font-bold text-white">{wallOfFame.risingStar.name}</p>
          </div>
          <Avatar name={wallOfFame.risingStar.name} size="sm" />
        </div>
      </div>
    </div>
  );
}

function TrendingUpIcon({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );
}
