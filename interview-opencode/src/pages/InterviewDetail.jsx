import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS,  asyncGet, asyncSet } from '../services/storage';
import { createNotification } from '../services/notifications';
import { Avatar, Button, Badge, Modal, Input, Select, Textarea, StarRating, StatusBadge, Skeleton } from '../components/ui';
import { formatDate, formatDateTime } from '../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const CRITERIA = ['Technical Skills', 'Communication', 'Problem Solving', 'Culture Fit', 'Experience Level'];
const RECOMMENDATIONS = ['Strongly Hire', 'Hire', 'Maybe', 'No Hire', 'Strongly No Hire'];
const REC_COLORS = {
  'Strongly Hire': 'text-emerald-400', 'Hire': 'text-green-400', 'Maybe': 'text-yellow-400',
  'No Hire': 'text-orange-400', 'Strongly No Hire': 'text-red-400' };

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

  const load = async () => {
    await new Promise(r => setTimeout(r, 200));
    const ivs = await asyncGet(KEYS.INTERVIEWS) || [];
    const iv = ivs.find(i => i.id === id);
    if (!iv) { navigate('/interviews'); return; }
    setInterview(iv);
    setUsers(await asyncGet(KEYS.USERS) || []);
    if (iv.evaluation) {
      setEvalForm({ criteria: iv.evaluation.criteria || {}, notes: iv.evaluation.notes || '', recommendation: iv.evaluation.recommendation || '', overallRating: iv.evaluation.rating || 0 });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <Skeleton className="h-96" />;
  if (!interview) return null;

  const getUser = (uid) => users.find(u => u.id === uid);
  const interviewer = getUser(interview.interviewerId);
  const isInterviewer = interview.interviewerId === currentUser.id || (interview.panelIds || []).includes(currentUser.id);
  const canEvaluate = isInterviewer || ['admin', 'hr'].includes(currentUser.role);
  const hasEvaluation = !!interview.evaluation?.rating;

  const handleSaveEval = async () => {
    if (!evalForm.recommendation || evalForm.overallRating === 0) { toast.error('Please provide a rating and recommendation'); return; }
    const ivs = await asyncGet(KEYS.INTERVIEWS) || [];
    const idx = ivs.findIndex(i => i.id === id);
    if (idx !== -1) {
      ivs[idx].evaluation = { ...evalForm, evaluatedBy: currentUser.id, evaluatedAt: new Date().toISOString() };
      asyncSet(KEYS.INTERVIEWS, ivs);
    }
    // Notify HR
    const hrUsers = (await asyncGet(KEYS.USERS) || []).filter(u => ['hr', 'admin'].includes(u.role));
    hrUsers.forEach(u => {
      if (u.id !== currentUser.id) {
        createNotification({ userId: u.id, type: 'interview_evaluated', title: 'Interview Evaluated', message: `Interview with ${interview.candidateName} has been evaluated. Recommendation: ${evalForm.recommendation}`, relatedId: id, relatedType: 'interview' });
      }
    });
    toast.success('Evaluation saved!');
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
  if (isHRAdmin) TABS.push({ id: 'history', label: 'History' });

  const recColor = REC_COLORS[interview.evaluation?.recommendation] || 'text-gray-400';

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
            {(isHRAdmin || isInterviewer) && interview.status === 'scheduled' && (
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setStatusModal('cancel')}>Cancel</Button>
                <Button size="sm" onClick={() => handleStatusUpdate('completed')}>Mark Completed</Button>
              </div>
            )}
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
                interview.mode === 'online' && ['Meeting Link', <a href={interview.meetingLink} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300">Join Meeting</a>],
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

          {(interview.panelIds || []).length > 0 && (
            <div className="lg:col-span-2 card p-5">
              <h2 className="font-semibold text-gray-100 mb-4">Interview Panel</h2>
              <div className="flex flex-wrap gap-3">
                {interview.panelIds.map(uid => {
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
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={24} className={s <= interview.evaluation.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'} />)}
                <span className="text-xl font-bold text-gray-100">{interview.evaluation.rating}/5</span>
              </div>
              <p className={`font-semibold mb-3 ${recColor}`}>{interview.evaluation.recommendation}</p>
              {interview.evaluation.criteria && Object.entries(interview.evaluation.criteria).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">{key}</span>
                  <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= val ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'} />)}</div>
                </div>
              ))}
              {interview.evaluation.notes && <p className="text-sm text-gray-400 mt-3 p-3 bg-gray-800/50 rounded-lg">{interview.evaluation.notes}</p>}
            </div>
          ) : canEvaluate ? (
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-gray-100">{hasEvaluation ? 'Update Evaluation' : 'Add Evaluation'}</h2>
              <div className="space-y-1.5">
                <label className="label">Overall Rating *</label>
                <StarRating value={evalForm.overallRating} onChange={v => setEvalForm({ ...evalForm, overallRating: v })} />
              </div>
              <div className="space-y-3">
                <label className="label">Criteria Ratings</label>
                {CRITERIA.map(c => (
                  <div key={c} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{c}</span>
                    <StarRating size={18} value={evalForm.criteria[c] || 0} onChange={v => setEvalForm(f => ({ ...f, criteria: { ...f.criteria, [c]: v } }))} />
                  </div>
                ))}
              </div>
              <Select label="Recommendation *" value={evalForm.recommendation} onChange={e => setEvalForm({ ...evalForm, recommendation: e.target.value })}>
                <option value="">Select...</option>
                {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
              <Textarea label="Notes & Feedback" value={evalForm.notes} onChange={e => setEvalForm({ ...evalForm, notes: e.target.value })} placeholder="Share your assessment notes..." />
              <div className="flex justify-end">
                <Button onClick={handleSaveEval}>Save Evaluation</Button>
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-gray-500">No evaluation submitted yet.</p>
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
    </div>
  );
}
