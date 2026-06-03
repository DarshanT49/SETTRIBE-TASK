import { Trophy, Star, ShieldCheck } from 'lucide-react';

export function PerformanceScorecard({ scoreData }) {
  const getRatingColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRatingText = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Score Card */}
      <div className="card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 to-gray-900/0 z-0"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Overall Performance Score</h3>
          <div className="relative inline-flex items-center justify-center w-40 h-40 mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                strokeDasharray="440" 
                strokeDashoffset={440 - (440 * scoreData.overall) / 100}
                className={getRatingColor(scoreData.overall)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${getRatingColor(scoreData.overall)}`}>{scoreData.overall}</span>
              <span className="text-xs text-gray-400">out of 100</span>
            </div>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${getRatingColor(scoreData.overall).replace('text-', 'border-').replace('400', '500/30')} ${getRatingColor(scoreData.overall).replace('text-', 'bg-').replace('400', '900/20')}`}>
            <Star size={16} className={getRatingColor(scoreData.overall)} />
            <span className={`font-bold ${getRatingColor(scoreData.overall)}`}>{getRatingText(scoreData.overall)}</span>
          </div>

          {scoreData.rank && (
            <p className="mt-4 text-sm text-gray-400 flex items-center justify-center gap-1">
              <Trophy size={14} className="text-yellow-500" /> Rank: <strong className="text-white">{scoreData.rank}</strong> among Interns
            </p>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="lg:col-span-2 card p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-6 flex items-center gap-2">
          <ShieldCheck size={16} /> Score Breakdown by Category
        </h3>
        
        <div className="space-y-5">
          {scoreData.categories.map((cat, idx) => (
            <div key={idx}>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-medium text-gray-200">{cat.name} <span className="text-xs text-gray-500 ml-1">(Weight: {cat.weight}%)</span></span>
                <span className="text-sm font-bold text-white">{cat.score}/100</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    cat.score >= 90 ? 'bg-emerald-500' :
                    cat.score >= 75 ? 'bg-blue-500' :
                    cat.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${cat.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
