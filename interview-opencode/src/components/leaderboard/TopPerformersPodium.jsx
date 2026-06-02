import { getRankBadge } from './RankBadges';
import { Avatar } from '../ui';

export function TopPerformersPodium({ topThree }) {
  // Sort them so display is 2, 1, 3 left to right
  const sortedForPodium = [
    topThree.find(i => i.rank === 2),
    topThree.find(i => i.rank === 1),
    topThree.find(i => i.rank === 3)
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-center justify-end h-full pt-8 pb-4">
      <div className="flex items-end justify-center gap-2 sm:gap-6 w-full max-w-2xl mx-auto">
        {sortedForPodium.map((intern) => {
          const isFirst = intern.rank === 1;
          const isSecond = intern.rank === 2;
          const isThird = intern.rank === 3;
          
          let heightClass = "h-32";
          let bgClass = "bg-gray-800 border-gray-700";
          
          if (isFirst) {
            heightClass = "h-48";
            bgClass = "bg-yellow-900/40 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.15)]";
          } else if (isSecond) {
            heightClass = "h-40";
            bgClass = "bg-gray-800 border-gray-500/50";
          } else if (isThird) {
            heightClass = "h-32";
            bgClass = "bg-amber-900/20 border-amber-700/50";
          }

          return (
            <div key={intern.id} className="flex flex-col items-center w-1/3 max-w-[140px] group">
              {/* Avatar and Name */}
              <div className="flex flex-col items-center mb-4 transition-transform transform group-hover:-translate-y-2">
                <div className="mb-2">
                  {getRankBadge(intern.rank)}
                </div>
                <div className={`rounded-full p-1 bg-gray-900 border-2 ${isFirst ? 'border-yellow-500' : isSecond ? 'border-gray-400' : 'border-amber-600'}`}>
                   <Avatar name={intern.name} size={isFirst ? 'lg' : 'md'} />
                </div>
                <h4 className="text-white font-bold text-center mt-2 truncate w-full text-sm sm:text-base">{intern.name}</h4>
                <p className="text-xs text-primary-400 font-bold">{intern.score} pts</p>
              </div>

              {/* Podium Block */}
              <div className={`w-full ${heightClass} ${bgClass} border-t-4 rounded-t-lg flex items-start justify-center pt-4 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent opacity-50"></div>
                <span className={`text-4xl font-black opacity-20 relative z-10 ${isFirst ? 'text-yellow-500' : isSecond ? 'text-gray-300' : 'text-amber-600'}`}>
                  {intern.rank}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
