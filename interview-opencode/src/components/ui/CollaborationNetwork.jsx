import { User } from 'lucide-react';

export function CollaborationNetwork({ mainUser, collaborators }) {
  if (!collaborators || collaborators.length === 0) {
    return <div className="text-sm text-gray-500 italic text-center py-4">No collaboration data.</div>;
  }

  return (
    <div className="relative h-64 w-full flex items-center justify-center">
      {/* Central User */}
      <div className="absolute z-10 bg-gray-800 border-2 border-primary-500 rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-lg shadow-primary-500/20">
        <User size={24} className="text-primary-400" />
        <span className="text-[9px] text-gray-300 truncate w-14 text-center mt-0.5 px-1">{mainUser.name.split(' ')[0]}</span>
      </div>

      {/* Collaborators positioned in a circle */}
      {collaborators.map((collab, index) => {
        // Calculate position
        const angle = (index / collaborators.length) * 2 * Math.PI - Math.PI / 2; // start from top
        const radius = 90; // distance from center
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Line properties
        const lineWidth = Math.max(1, (collab.interactionScore / 100) * 4); // thicker line for more interactions
        
        return (
          <div key={collab.id} className="absolute inset-0 flex items-center justify-center">
            {/* Connecting line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <line 
                x1="50%" y1="50%" 
                x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`} 
                stroke="#4b5563" 
                strokeWidth={lineWidth} 
                strokeDasharray={collab.interactionScore < 30 ? "4 4" : "none"}
                opacity={0.6}
              />
            </svg>

            {/* Collaborator Node */}
            <div 
              className="absolute bg-gray-800 border border-gray-600 rounded-full flex flex-col items-center justify-center transition-transform hover:scale-110 z-10 shadow-md"
              style={{ 
                transform: `translate(${x}px, ${y}px)`,
                width: `${Math.max(40, (collab.interactionScore / 100) * 60)}px`,
                height: `${Math.max(40, (collab.interactionScore / 100) * 60)}px`
              }}
              title={`${collab.name} - Interaction Score: ${collab.interactionScore}`}
            >
              <span className="text-[10px] text-gray-300 truncate w-full text-center px-1">{collab.name.split(' ')[0]}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
