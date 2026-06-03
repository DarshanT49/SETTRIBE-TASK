import { User } from 'lucide-react';

export function OrgChart({ manager, reports }) {
  if (!reports || reports.length === 0) {
    return <div className="text-sm text-gray-500 italic">No direct reports.</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <div className="card p-3 flex items-center gap-3 border-emerald-500/30 border">
        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
          <User size={20} className="text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-200">{manager.name}</p>
          <p className="text-xs text-gray-500 capitalize">{manager.role}</p>
        </div>
      </div>
      
      <div className="w-px h-6 bg-gray-700 my-1"></div>
      <div className="w-3/4 h-px bg-gray-700"></div>
      
      <div className="flex justify-around w-full mt-4 gap-4 overflow-x-auto pb-4">
        {reports.map((report) => (
          <div key={report.id} className="flex flex-col items-center min-w-[120px]">
            <div className="w-px h-4 bg-gray-700 mb-1 -mt-4"></div>
            <div className="card p-3 flex flex-col items-center text-center w-full bg-gray-800/40 border-0">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mb-2">
                <User size={16} className="text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-300 truncate w-full">{report.name}</p>
              <p className="text-[10px] text-gray-500 capitalize truncate w-full">{report.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
