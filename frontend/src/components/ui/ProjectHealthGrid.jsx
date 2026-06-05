import { useState } from 'react';
import { fetchEmployeeProjectDetails } from '../../services/employeeApi';
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, Circle, Clock, LayoutList, Users, User, Calendar, Video } from 'lucide-react';
import toast from 'react-hot-toast';

export function ProjectHealthGrid({ projects, employeeId }) {
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [loading, setLoading] = useState(false);

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

  const handleToggle = async (projectId) => {
    if (expandedProjectId === projectId) {
      setExpandedProjectId(null); // Collapse
      return;
    }
    
    setExpandedProjectId(projectId);
    
    if (!detailsCache[projectId]) {
      setLoading(true);
      try {
        const data = await fetchEmployeeProjectDetails(employeeId, projectId);
        setDetailsCache(prev => ({ ...prev, [projectId]: data }));
      } catch (err) {
        toast.error("Failed to load project details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderDetails = (projectId) => {
    if (loading && !detailsCache[projectId]) {
      return (
        <div className="flex justify-center items-center py-6 text-gray-400">
          <Loader2 className="animate-spin w-5 h-5 mr-2" /> Loading details...
        </div>
      );
    }

    const details = detailsCache[projectId];
    if (!details) return null;

    return (
      <div className="mt-4 pt-4 border-t border-gray-700/50 flex flex-col gap-5 animate-fade-in">
        
        {/* Team Members */}
        <div>
          <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Users size={14} /> Team Members ({details.teamMembers?.length || 0})
          </h5>
          <div className="flex flex-wrap gap-2">
            {details.teamMembers?.map(member => (
              <div key={member.id} className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-full pr-3 pl-1 py-1">
                {member.profilePhoto ? (
                  <img src={member.profilePhoto} alt={member.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-medium text-gray-300">
                    {member.name.charAt(0)}
                  </div>
                )}
                <span className="text-xs text-gray-300 truncate max-w-[100px]">{member.name}</span>
              </div>
            ))}
            {!details.teamMembers?.length && (
              <span className="text-xs text-gray-500 italic">No team members found.</span>
            )}
          </div>
        </div>

        {/* 2-Column Grid for Meetings and Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Meetings List */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Video size={14} /> Project Meetings ({details.meetings?.length || 0})
            </h5>
            {details.meetings?.length > 0 ? (
              <div className="space-y-2">
                {details.meetings.map(meeting => (
                  <div key={meeting.id} className="bg-gray-800/30 border border-gray-700/30 rounded p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-start text-sm">
                      <span className="font-medium text-gray-200 truncate">{meeting.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 capitalize whitespace-nowrap ml-2">
                        {meeting.status || 'Scheduled'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {meeting.date}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {meeting.time} ({meeting.duration})</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic px-2">No meetings logged for this project.</div>
            )}
          </div>

          {/* All Project Tasks */}
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <LayoutList size={14} /> Project Tasks ({details.tasks?.length || 0})
            </h5>
            {details.tasks?.length > 0 ? (
              <div className="space-y-2">
                {details.tasks.map(projectTask => {
                  const t = projectTask.task;
                  const assignees = projectTask.assignees || [];
                  return (
                    <div key={t.id} className="bg-gray-800/30 border border-gray-700/30 rounded p-3 flex flex-col gap-2 text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-start gap-2 truncate">
                          {t.status === 'done' ? (
                            <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          ) : t.status === 'in_progress' ? (
                            <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle size={16} className="text-gray-500 shrink-0 mt-0.5" />
                          )}
                          <div className={`truncate ${t.status === 'done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                            {t.title}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 capitalize border border-gray-700/50 rounded px-2 py-0.5 bg-gray-800/80">
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 ml-6 flex flex-wrap items-center gap-1">
                        <User size={12} />
                        {assignees.length > 0 
                          ? assignees.map(a => a.name).join(', ') 
                          : 'Unassigned'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic px-2">No tasks found for this project.</div>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {projects.map((project, idx) => {
        const pid = project.projectId || project.id;
        const isExpanded = expandedProjectId === pid;
        
        return (
          <div 
            key={pid || idx} 
            className={`border rounded-lg transition-all duration-200 overflow-hidden ${
              isExpanded 
                ? 'bg-gray-800/80 border-gray-600 shadow-lg md:col-span-2' 
                : 'bg-gray-800/40 border-gray-700/50 hover:border-gray-600/80 hover:bg-gray-800/60 cursor-pointer'
            }`}
          >
            {/* Clickable Header */}
            <div 
              className="p-4"
              onClick={() => handleToggle(pid)}
              role="button"
              tabIndex={0}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-200 truncate pr-2 flex items-center gap-2">
                  {project.title}
                </h4>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)] ${getRAGColor(project.health)}`} title={`Health: ${project.health || 'Unknown'}`}></div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Overall Project Progress</span>
                <span>{project.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-blue-500 rounded-full" 
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Expanded Body */}
            {isExpanded && (
              <div className="px-4 pb-4">
                {renderDetails(pid)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
