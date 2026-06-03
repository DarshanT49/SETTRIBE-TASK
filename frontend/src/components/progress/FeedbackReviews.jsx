import { MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

export function FeedbackReviews({ feedbackList }) {
  return (
    <div className="card p-6 h-full flex flex-col">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <MessageSquare size={16} /> Recent Feedback
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
        {feedbackList.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex-shrink-0 mt-1">
              {item.type === 'positive' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ThumbsUp size={14} />
                </div>
              ) : item.type === 'constructive' ? (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <MessageSquare size={14} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                  <ThumbsDown size={14} />
                </div>
              )}
            </div>
            
            <div className="flex-1 bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-200">{item.from}</span>
                <span className="text-xs text-gray-500">{item.date}</span>
              </div>
              <p className="text-sm text-gray-400">{item.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
