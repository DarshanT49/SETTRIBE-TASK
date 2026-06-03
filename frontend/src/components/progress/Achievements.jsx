import { Award, Star } from 'lucide-react';

export function Achievements({ achievements }) {
  return (
    <div className="card p-6 h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <Award size={16} /> Achievements & Milestones
      </h3>
      
      <div className="flex-1 grid grid-cols-2 gap-4 overflow-y-auto pr-2 scrollbar-hide">
        {achievements.map((item) => (
          <div key={item.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${
              item.earned 
                ? 'bg-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                : 'bg-gray-700/50 text-gray-500'
            }`}>
              <Star size={24} className={item.earned ? "fill-yellow-500" : ""} />
            </div>
            <h4 className={`text-sm font-bold mb-1 ${item.earned ? 'text-white' : 'text-gray-500'}`}>
              {item.title}
            </h4>
            <p className="text-xs text-gray-500">{item.description}</p>
            {item.earned && item.date && (
              <span className="text-[10px] text-gray-400 mt-2 bg-gray-700 px-2 py-0.5 rounded-full">{item.date}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
