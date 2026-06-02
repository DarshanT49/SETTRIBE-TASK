import { Flag, CheckCircle2 } from 'lucide-react';

export function GoalTracking({ goals }) {
  return (
    <div className="card p-6 h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <Flag size={16} /> Current Goals & Objectives
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-white text-sm">{goal.title}</h4>
              {goal.progress === 100 ? (
                <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              ) : (
                <span className="text-xs font-bold text-gray-400">{goal.progress}%</span>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mb-3">{goal.description}</p>
            
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  goal.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'
                }`} 
                style={{ width: `${goal.progress}%` }}
              ></div>
            </div>
            
            <div className="mt-2 text-right">
              <span className="text-[10px] text-gray-500 uppercase">Target: {goal.targetDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
