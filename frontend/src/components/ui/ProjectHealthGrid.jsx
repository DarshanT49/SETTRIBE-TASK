export function ProjectHealthGrid({ projects }) {
  if (!projects || projects.length === 0) {
    return <div className="text-sm text-gray-500 italic py-4 text-center">No active projects assigned.</div>;
  }

  const getRAGColor = (health) => {
    switch (health?.toLowerCase()) {
      case 'red': return 'bg-red-500';
      case 'amber':
      case 'yellow': return 'bg-amber-500';
      case 'green': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <div key={project.id} className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-200 truncate pr-2">{project.title}</h4>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${getRAGColor(project.health)}`} title={`Health: ${project.health || 'Unknown'}`}></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
          
          {project.burndownRate && (
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700/50 flex justify-between">
              <span>Burndown Rate:</span>
              <span className="text-gray-300 font-medium">{project.burndownRate} tasks/wk</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
