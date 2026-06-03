import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS,  asyncGet, asyncSet } from '../services/storage';
import { createNotification } from '../services/notifications';
import api from '../services/api';
import { Avatar, Button, Badge, Modal, Input, Select, Textarea, StarRating, StatusBadge, Skeleton } from '../components/ui';
import { formatDate, formatDateTime } from '../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import InterviewEvaluationPanel from '../components/InterviewEvaluationPanel';

const CRITERIA = ['Technical Skills', 'Communication', 'Problem Solving', 'Culture Fit', 'Experience Level'];
const RECOMMENDATIONS = ['Strongly Hire', 'Hire', 'Maybe', 'No Hire', 'Strongly No Hire'];
const REC_COLORS = {
  'Strongly Hire': 'text-emerald-400', 'Hire': 'text-green-400', 'Maybe': 'text-yellow-400',
  'No Hire': 'text-orange-400', 'Strongly No Hire': 'text-red-400' 
};

const parsePanelIds = (panelIds) => {
  if (!panelIds) return [];
  if (Array.isArray(panelIds)) return panelIds;
  if (typeof panelIds === 'string') {
    try {
      const parsed = JSON.parse(panelIds);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return panelIds.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

export default function InterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [interview, setInterview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const [evalForm, setEvalForm] = useState({ criteria: {}, notes: '', recommendation: '', overallRating: 0 });
  const [statusModal, setStatusModal] = useState(null);
  const [candidateFeedback, setCandidateFeedback] = useState(null);
  const [startingInterview, setStartingInterview] = useState(false);

  const load = async () => {
    await new Promise(r => setTimeout(r, 200));
    const ivs = await asyncGet(KEYS.INTERVIEWS) || [];
    const iv = ivs.find(i => i.id === id);
    if (!iv) { navigate('/interviews'); return; }
    
    // Attempt to fetch evaluation from API if not in local storage
    try {
      const evalResp = await api.get(`/evaluations/${id}`);
      if (evalResp.data) {
        iv.evaluation = evalResp.data;
      }
    } catch (e) {
      console.warn("Could not fetch evaluation from API, falling back to local storage if available.");
    }

    setInterview(iv);
    setUsers(await asyncGet(KEYS.USERS) || []);
    
    try {
      const fbResp = await api.get(`/candidate-feedback/interview/${id}`);
      if (fbResp.data && fbResp.data.length > 0) {
        setCandidateFeedback(fbResp.data[0]);
      }
    } catch (e) {}
    
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Skeleton className="h-96" />;
  if (!interview) return null;

  const getUser = (uid) => users.find(u => u.id === uid);
  const interviewer = getUser(interview.interviewerId);
  const isInterviewer = interview.interviewerId === currentUser.id || parsePanelIds(interview.panelIds).includes(currentUser.id);
  const canEvaluate = isInterviewer || ['admin', 'hr'].includes(currentUser.role);
  const hasEvaluation = !!interview.evaluation?.rating;

  const handleSaveEval = async (payload) => {
    const ivs = await asyncGet(KEYS.INTERVIEWS) || [];
    const idx = ivs.findIndex(i => i.id === id);
    if (idx !== -1) {
      ivs[idx].evaluation = { ...payload, evaluatedBy: currentUser.id, evaluatedAt: new Date().toISOString() };
      asyncSet(KEYS.INTERVIEWS, ivs);
    }
    const hrUsers = (await asyncGet(KEYS.USERS) || []).filter(u => ['hr', 'admin'].includes(u.role));
    hrUsers.forEach(u => {
      if (u.id !== currentUser.id) {
        createNotification({ userId: u.id, type: 'interview_evaluated', title: 'Interview Evaluated', message: `Interview with ${interview.candidateName} has been evaluated. Recommendation: ${payload.recommendation}`, relatedId: id, relatedType: 'interview' });
      }
    });
    load();
  };

  const handleStatusUpdate = async (newStatus, reason = '') => {
    const ivs = await asyncGet(KEYS.INTERVIEWS) || [];
    const idx = ivs.findIndex(i => i.id === id);
    if (idx !== -1) {
      ivs[idx].status = newStatus;
      if (reason) ivs[idx].cancellationReason = reason;
      asyncSet(KEYS.INTERVIEWS, ivs);
    }
    toast.success(`Interview marked as ${newStatus}`);
    setStatusModal(null);
    load();
  };

  const isHRAdmin = ['admin', 'hr'].includes(currentUser.role);
  const TABS = [{ id: 'details', label: 'Details' }, { id: 'evaluation', label: 'Evaluation' }];
  if (candidateFeedback || isHRAdmin) TABS.push({ id: 'feedback', label: 'Candidate Feedback' });
  if (isHRAdmin) TABS.push({ id: 'history', label: 'History' });

  const recColor = REC_COLORS[interview.evaluation?.recommendation] || 'text-gray-400';

  const handleStartInterview = async () => {
    setStartingInterview(true);
    try {
      await api.post(`/interviews/${interview.id}/start`);
      toast.success('Interview started — candidate will join automatically');
    } catch (err) {
      console.warn('Start signal failed, proceeding to room anyway:', err);
    }

    if (interview.link || interview.meetingLink) {
      window.open(interview.link || interview.meetingLink, '_blank');
      setStartingInterview(false);
      return;
    }
    
    if (interview.meetingId) {
      navigate(`/meetings/${interview.meetingId}/room`);
      return;
    }
    
    toast.loading('Preparing meeting room...', { id: 'prep_meeting' });
    const finalMeetingId = uuidv4();
    const meeting = {
      id: finalMeetingId, 
      title: `Interview: ${interview.candidateName} — ${interview.position}`,
      agenda: `Interview for ${interview.position} position — ${interview.round || 'screening'} round`,
      date: interview.date, 
      time: interview.time, 
      duration: interview.duration || '60',
      type: 'interview', 
      hostId: currentUser.id,
      participantIds: [...new Set([currentUser.id, interview.interviewerId])],
      meetingMode: 'internal', 
      projectId: '', 
      allowJoinRequests: false,
      status: 'upcoming',
      createdAt: new Date().toISOString() 
    };
    
    try {
      const { apiPost } = await import('../services/storage');
      await apiPost(KEYS.MEETINGS, meeting);
      
      const ivs = await asyncGet(KEYS.INTERVIEWS) || [];
      const idx = ivs.findIndex(i => i.id === interview.id);
      if (idx !== -1) {
        ivs[idx].meetingId = finalMeetingId;
        await asyncSet(KEYS.INTERVIEWS, ivs);
      }
      toast.success('Meeting room ready!', { id: 'prep_meeting' });
      navigate(`/meetings/${finalMeetingId}/room`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create meeting room.', { id: 'prep_meeting' });
      setStartingInterview(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4"><ArrowLeft size={16} />Back</button>
        <div className="card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl">
                {interview.candidateName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-100">{interview.candidateName}</h1>
                <p className="text-sm text-gray-400">{interview.position} · {interview.department}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <StatusBadge status={interview.status} />
                  <span className="badge bg-gray-800 text-gray-400 border border-gray-700 capitalize">{interview.round} Round</span>
                  {hasEvaluation && (
                    <span className={`badge bg-gray-800 border border-gray-700 ${recColor}`}>{interview.evaluation.recommendation}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isInterviewer && interview.status === 'scheduled' && (
                <Button loading={startingInterview} onClick={handleStartInterview} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/20">
                  {interview.link || interview.meetingLink ? 'Join External Meeting' : '▶ Start Interview'}
                </Button>
              )}
              {isInterviewer && interview.status === 'in_progress' && (
                <Button onClick={handleStartInterview} className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/20">
                  Rejoin Interview
                </Button>
              )}
              {(isHRAdmin || isInterviewer) && ['scheduled', 'in_progress'].includes(interview.status) && (
                <Button variant="secondary" size="sm" onClick={() => setStatusModal('cancel')}>Cancel</Button>
              )}
              {isHRAdmin && ['completed', 'in_progress'].includes(interview.status) && (
                <Button variant="secondary" size="sm" onClick={() => setStatusModal('status')}>Update Status</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2">
        {TABS.map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}>{t.label}</button>)}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-100">Interview Info</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Date', `${interview.date} at ${interview.time}`],
                ['Duration', `${interview.duration} minutes`],
                ['Mode', interview.mode],
                interview.mode === 'online' && ['Meeting Link', interview.meetingId ? 
                  <Link to={`/meetings/${interview.meetingId}/room`} className="text-primary-400 hover:text-primary-300">Join Meeting Room</Link> 
                  : <a href={interview.link || interview.meetingLink} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300">Join External Meeting</a>],
                interview.token && ['Shareable Link', <div className="flex items-center gap-2">
                  <a href={`/join-interview/${interview.token}`} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300 truncate max-w-[200px]" title={`${window.location.origin}/join-interview/${interview.token}`}>{window.location.origin}/join-interview/...</a>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join-interview/${interview.token}`); toast.success('Link copied!') }} className="text-gray-400 hover:text-gray-200 ml-2 border border-gray-600 px-2 py-0.5 rounded text-xs">Copy</button>
                </div>],
                interview.mode === 'in_person' && ['Location', interview.location],
                ['Scheduled By', getUser(interview.scheduledById)?.name],
                ['Interviewer', interviewer?.name],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}:</span>
                  <span className="text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-100">Candidate Info</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Email', interview.candidateEmail],
                ['Phone', interview.candidatePhone],
                ['Experience', interview.experience ? `${interview.experience} years` : 'N/A'],
                ['Source', interview.source],
                ['Resume', interview.resumeLink ? <a href={interview.resumeLink} target="_blank" rel="noreferrer" className="text-primary-400">View Resume</a> : 'Not provided'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}:</span>
                  <span className="text-gray-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {interview.jobDescription && (
            <div className="lg:col-span-2 card p-5">
              <h2 className="font-semibold text-gray-100 mb-3">Job Description</h2>
              <p className="text-sm text-gray-400">{interview.jobDescription}</p>
            </div>
          )}

          {parsePanelIds(interview.panelIds).length > 0 && (
            <div className="lg:col-span-2 card p-5">
              <h2 className="font-semibold text-gray-100 mb-4">Interview Panel</h2>
              <div className="flex flex-wrap gap-3">
                {parsePanelIds(interview.panelIds).map(uid => {
                  const u = getUser(uid);
                  if (!u) return null;
                  return <div key={uid} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg"><Avatar name={u.name} size="sm" /><span className="text-sm text-gray-200">{u.name}</span></div>;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evaluation Tab */}
      {activeTab === 'evaluation' && (
        <div className="space-y-4">
          {hasEvaluation && !canEvaluate ? (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-100 mb-4">Evaluation Results</h2>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xl font-bold text-gray-100">Score: {interview.evaluation.overallScore}/5 ({interview.evaluation.percentage}%)</span>
              </div>
              <p className={`font-semibold mb-3 ${recColor}`}>{interview.evaluation.recommendation}</p>
              
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-gray-300 border-b border-gray-800 pb-2">Skills Assessed</h3>
                {interview.evaluation.skillsAssessed && (() => {
                  try {
                    const skills = JSON.parse(interview.evaluation.skillsAssessed);
                    return skills.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between mb-2 p-2 bg-gray-800/30 rounded-lg">
                        <span className="text-sm text-gray-300">{s.topic}</span>
                        <span className="text-sm font-bold text-primary-400">{s.marks}/{s.max}</span>
                      </div>
                    ));
                  } catch (e) {
                    return <p className="text-sm text-gray-500">Could not parse skills data.</p>;
                  }
                })()}
              </div>
              
              <div className="space-y-4">
                {interview.evaluation.notes && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300">Overall Feedback</h3>
                    <p className="text-sm text-gray-400 p-3 bg-gray-800/50 rounded-lg mt-1">{interview.evaluation.notes}</p>
                  </div>
                )}
                {interview.evaluation.candidateStrengths && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300">Candidate Strengths</h3>
                    <p className="text-sm text-emerald-400/80 p-3 bg-emerald-900/10 border border-emerald-900/30 rounded-lg mt-1">{interview.evaluation.candidateStrengths}</p>
                  </div>
                )}
                {interview.evaluation.areasForImprovement && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300">Areas for Improvement</h3>
                    <p className="text-sm text-yellow-400/80 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg mt-1">{interview.evaluation.areasForImprovement}</p>
                  </div>
                )}
                {interview.evaluation.recommendedNextSteps && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300">Recommended Next Steps</h3>
                    <p className="text-sm text-blue-400/80 p-3 bg-blue-900/10 border border-blue-900/30 rounded-lg mt-1">{interview.evaluation.recommendedNextSteps}</p>
                  </div>
                )}
              </div>
            </div>
          ) : canEvaluate ? (
            <div className="card h-[800px] overflow-hidden">
               {/* Embed the InterviewEvaluationPanel for editing/creating evaluation */}
               <InterviewEvaluationPanel meeting={interview} currentUser={currentUser} onSaved={handleSaveEval} />
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-gray-500">No evaluation submitted yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Candidate Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-100 flex items-center gap-2">
            <MessageSquare size={18} className="text-primary-400" />
            Candidate Feedback
          </h2>
          {candidateFeedback ? (
            <div className="space-y-4">
              {[
                { key: 'experienceRating', label: 'Interview Experience' },
                { key: 'videoQualityRating', label: 'Video Call Quality' },
                { key: 'audioQualityRating', label: 'Audio Quality' },
                { key: 'platformRating', label: 'Platform Experience' },
                { key: 'joiningEaseRating', label: 'Ease of Joining' },
              ].map(cat => (
                <div key={cat.key} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 border border-gray-800">
                  <span className="text-gray-300 text-sm">{cat.label}</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={16} className={s <= (candidateFeedback[cat.key] || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary-900/20 border border-primary-800/30">
                <span className="text-primary-300 font-semibold text-sm">Overall Rating</span>
                <span className="text-xl font-bold text-primary-400">{candidateFeedback.overallRating || '—'}/5</span>
              </div>
              {candidateFeedback.comments && (
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Additional Comments</p>
                  <p className="text-sm text-gray-300">{candidateFeedback.comments}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No feedback submitted by the candidate yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {statusModal === 'cancel' && (
        <Modal isOpen title="Cancel Interview" onClose={() => setStatusModal(null)} size="sm">
          <div className="p-5 space-y-4">
            <Textarea label="Cancellation Reason" id="cancel-reason" placeholder="Why is this interview being cancelled?" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setStatusModal(null)}>Back</Button>
              <Button variant="danger" onClick={() => handleStatusUpdate('cancelled', document.getElementById('cancel-reason')?.value || 'Cancelled')}>Confirm Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Status Update Modal for HR */}
      {statusModal === 'status' && (
        <Modal isOpen title="Update Candidate Status" onClose={() => setStatusModal(null)} size="sm">
          <div className="p-5 space-y-3">
            {[
              { status: 'selected', label: 'Selected', color: 'bg-emerald-600 hover:bg-emerald-500 text-white', icon: '✅' },
              { status: 'rejected', label: 'Rejected', color: 'bg-red-600 hover:bg-red-500 text-white', icon: '❌' },
              { status: 'on_hold', label: 'On Hold', color: 'bg-yellow-600 hover:bg-yellow-500 text-white', icon: '⏸️' },
              { status: 'next_round', label: 'Next Round', color: 'bg-blue-600 hover:bg-blue-500 text-white', icon: '➡️' },
              { status: 'offer_released', label: 'Offer Released', color: 'bg-violet-600 hover:bg-violet-500 text-white', icon: '📄' },
            ].map(opt => (
              <button
                key={opt.status}
                onClick={() => handleStatusUpdate(opt.status)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${opt.color} border-0`}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
            <div className="pt-2">
              <Button variant="secondary" onClick={() => setStatusModal(null)} className="w-full justify-center">Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
