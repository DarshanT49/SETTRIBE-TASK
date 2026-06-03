import { Sparkles, ArrowRight } from 'lucide-react';

export function AIInsights({ insights }) {
  return (
    <div className="card p-6 relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-bl-full -z-10"></div>
      
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-primary-400" /> AI Performance Insights
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
        {insights.map((insight, idx) => (
          <div key={idx} className="flex items-start gap-3 bg-gray-800/40 p-3 rounded-xl border border-gray-700/50">
            <ArrowRight size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-300">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
