import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, apiPost } from '../services/storage';
import { createNotification, createBulkNotifications } from '../services/notifications';
import { Button, Input, Select, Textarea, Avatar } from '../components/ui';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import emailjs from '@emailjs/browser';

const ROUNDS = ['screening', 'technical', 'hr', 'final'];
const MODES = ['online', 'in_person', 'phone'];
const SOURCES = ['LinkedIn', 'Job Portal', 'Referral', 'Walk-in', 'Other'];

export default function NewInterview() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    candidateName: '', candidateEmail: '', candidatePhone: '', position: '',
    department: 'Engineering', round: 'screening', mode: 'online',
    date: '', time: '', duration: '60', interviewerId: '',
    panelIds: [], meetingLink: '', location: '', source: 'Job Portal',
    experience: '', jobDescription: '', resumeLink: '' });

  const EMAIL_TEMPLATES = [
    {
      id: 'default',
      name: 'Standard Interview',
      content: `Hi {{candidateName}},

You have been scheduled for an interview for the {{position}} position on {{date}} at {{time}}.

Please click the link below to join the video call at the scheduled time:
{{joinLink}}

Best regards,
SetTribe HR Team`
    },
    {
      id: 'technical',
      name: 'Technical Round',
      content: `Hi {{candidateName}},

Congratulations on moving to the technical round for the {{position}} position! 
Your technical interview is scheduled on {{date}} at {{time}}.

Please ensure you are in a quiet environment and have a stable internet connection.
Join the video call using this link:
{{joinLink}}

Best regards,
SetTribe Engineering & HR Team`
    },
    {
      id: 'final',
      name: 'Final HR Round',
      content: `Hi {{candidateName}},

We are excited to invite you to the final HR discussion for the {{position}} position.
This interview will take place on {{date}} at {{time}}.

You can join the video call here:
{{joinLink}}

We look forward to speaking with you!

Best regards,
SetTribe HR Team`
    }
  ];

  const [selectedTemplateId, setSelectedTemplateId] = useState(EMAIL_TEMPLATES[0].id);
  const [emailTemplate, setEmailTemplate] = useState(EMAIL_TEMPLATES[0].content);

  useEffect(() => {
    (async () => {
    const us = await asyncGet(KEYS.USERS) || [];
    setUsers(us.filter(u => u.isActive && u.isApproved && ['panel', 'manager', 'employee', 'hr'].includes(u.role)));
  })();
  }, []);

  const handleSubmit = async () => {
    if (!form.candidateName || !form.candidateEmail || !form.position || !form.date || !form.time || !form.interviewerId) {
      toast.error('Please fill in all required fields'); return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const interviewId = uuidv4();
    let meetingLink = form.meetingLink;
    
    let finalMeetingId = '';
    // Auto-create meeting room for online interviews
    if (form.mode === 'online' && !meetingLink) {
      finalMeetingId = uuidv4();
      const meeting = {
        id: finalMeetingId, title: `Interview: ${form.candidateName} — ${form.position}`,
        agenda: `Interview for ${form.position} position — ${form.round} round`,
        date: form.date, time: form.time, duration: String(form.duration),
        type: 'interview', hostId: currentUser.id,
        participantIds: [...new Set([currentUser.id, form.interviewerId, ...form.panelIds])],
        meetingMode: 'internal', projectId: '', allowJoinRequests: false,
        status: 'upcoming',
        createdAt: new Date().toISOString() };
      await apiPost(KEYS.MEETINGS, meeting);
    }
    
    // Generate secure token and expiry
    const secureToken = uuidv4();
    let tokenLink = form.meetingLink;
    if (form.mode === 'online' && (!form.meetingLink || form.meetingLink === '')) {
        tokenLink = `/join-interview/${secureToken}?meetingId=${finalMeetingId}`;
    }
    
    const interviewDateTime = new Date(`${form.date}T${form.time}`);
    const expiryTimestamp = interviewDateTime.getTime() + (parseInt(form.duration) * 60000);

    // Map form to backend Interview schema
    const interview = {
      id: interviewId,
      candidateName: form.candidateName,
      mobile: form.candidatePhone,
      email: form.candidateEmail,
      referredBy: form.source,
      position: form.position,
      department: form.department,
      interviewType: form.round,
      round: form.round,
      mode: form.mode,
      duration: form.duration,
      date: form.date,
      time: form.time,
      link: meetingLink,
      meetingId: finalMeetingId,
      interviewerId: form.interviewerId,
      panelIds: JSON.stringify(form.panelIds),
      status: 'scheduled',
      token: `token-${interviewId}`,
      notes: form.jobDescription,
      resumeFileName: form.resumeLink,
      candidatePortalStatus: 'waiting',
      createdAt: new Date().toISOString(),
      expiryTimestamp: String(expiryTimestamp),
      joinStatus: 'WAITING'
    };
    await apiPost(KEYS.INTERVIEWS, interview);

    // Notify interviewer and panel
    createNotification({
      userId: form.interviewerId,
      type: 'interview_scheduled',
      title: 'Interview Assigned',
      message: `You've been assigned to interview ${form.candidateName} for ${form.position} on ${form.date} at ${form.time}`,
      relatedId: interviewId, relatedType: 'interview' });
    if (form.panelIds.length > 0) {
      createBulkNotifications(form.panelIds, {
        type: 'interview_scheduled', title: 'Added to Interview Panel',
        message: `You've been added to the interview panel for ${form.candidateName} (${form.position}) on ${form.date}`,
        relatedId: interviewId, relatedType: 'interview' });
    }

    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || 'https://settribe-task.onrender.com';
    let internalLink = `${frontendUrl}${tokenLink}`;
    // If the app is using a custom backend URL via localStorage, we must pass it to the candidate 
    // so their device knows where to connect to the backend.
    const storedApiBase = window.localStorage.getItem('settribe_api_base_url');
    if (storedApiBase && !tokenLink.startsWith('http')) {
      internalLink += `&apiBase=${encodeURIComponent(storedApiBase)}`;
    }

    const fullJoinLink = form.mode === 'online' 
      ? (tokenLink.startsWith('http') ? tokenLink : internalLink)
      : form.location || 'In Person';

    let finalMessage = emailTemplate
      .replace(/{{candidateName}}/g, form.candidateName)
      .replace(/{{position}}/g, form.position)
      .replace(/{{date}}/g, form.date)
      .replace(/{{time}}/g, form.time)
      .replace(/{{joinLink}}/g, fullJoinLink);
      
    const finalMessageHtml = finalMessage.replace(/\n/g, '<br/>');

    // Send candidate email via EmailJS
    const templateParams = {
      candidate_name: form.candidateName,
      candidate_email: form.candidateEmail,
      interview_date: `${form.date} at ${form.time}`,
      role: form.position,
      join_link: fullJoinLink,
      title: `Interview Invitation - ${form.position}`,
      name: 'SetTribe HR Team',
      email: currentUser?.email || 'hr@settribe.com',
      custom_message: finalMessage,
      custom_message_html: finalMessageHtml
    };

    try {
      const { EMAIL_CONFIG } = await import('../utils/emailConfig');
      const serviceId = EMAIL_CONFIG.SERVICE_ID;
      const templateId = EMAIL_CONFIG.TEMPLATE_ID;
      const publicKey = EMAIL_CONFIG.PUBLIC_KEY;
      
      console.log('Sending email with variables:', { serviceId, templateId, publicKey });
      
      await emailjs.send(
        serviceId,
        templateId,
        templateParams,
        publicKey
      );
      toast.success('Interview scheduled and invitation sent!');
    } catch (err) {
      console.error('EmailJS error:', err);
      toast.error('Scheduled, but failed to send email.');
    }

    navigate(`/interviews/${interviewId}`);
    setLoading(false);
  };

  const togglePanel = (uid) => {
    setForm(f => ({ ...f, panelIds: f.panelIds.includes(uid) ? f.panelIds.filter(id => id !== uid) : [...f.panelIds, uid] }));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4"><ArrowLeft size={16} />Back</button>
        <h1 className="text-2xl font-bold text-gray-100">Schedule Interview</h1>
      </div>

      <div className="card p-6 space-y-6">
        {/* Candidate Info */}
        <div>
          <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2"><span className="w-5 h-5 bg-primary-600 rounded text-white text-xs flex items-center justify-center">1</span>Candidate Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Candidate Name *" value={form.candidateName} onChange={e => setForm({ ...form, candidateName: e.target.value })} />
            <Input label="Email *" type="email" value={form.candidateEmail} onChange={e => setForm({ ...form, candidateEmail: e.target.value })} />
            <Input label="Phone" type="tel" value={form.candidatePhone} onChange={e => setForm({ ...form, candidatePhone: e.target.value })} />
            <Input label="Years of Experience" type="number" min="0" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
            <Select label="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Resume Link" type="url" value={form.resumeLink} onChange={e => setForm({ ...form, resumeLink: e.target.value })} placeholder="https://..." />
          </div>
        </div>

        {/* Interview Details */}
        <div>
          <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2"><span className="w-5 h-5 bg-primary-600 rounded text-white text-xs flex items-center justify-center">2</span>Interview Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Position *" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
            <Select label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
              {['Engineering', 'Design', 'QA', 'HR', 'Management'].map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select label="Round" value={form.round} onChange={e => setForm({ ...form, round: e.target.value })}>
              {ROUNDS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </Select>
            <Select label="Mode" value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })}>
              {MODES.map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
            </Select>
            <Input label="Date *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Time *" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            <Select label="Duration" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
              {['30', '45', '60', '90', '120'].map(d => <option key={d} value={d}>{d} minutes</option>)}
            </Select>
            {form.mode === 'in_person' && <Input label="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Office Room 3B..." />}
            {form.mode === 'online' && <Input label="External Meeting Link (optional)" type="url" value={form.meetingLink} onChange={e => setForm({ ...form, meetingLink: e.target.value })} placeholder="Auto-created if empty" />}
          </div>
          <div className="mt-4">
            <Textarea label="Job Description" value={form.jobDescription} onChange={e => setForm({ ...form, jobDescription: e.target.value })} />
          </div>
        </div>

        {/* Interviewer & Panel */}
        <div>
          <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2"><span className="w-5 h-5 bg-primary-600 rounded text-white text-xs flex items-center justify-center">3</span>Interviewer & Panel</h2>
          <div className="mb-4">
            <Select label="Primary Interviewer *" value={form.interviewerId} onChange={e => setForm({ ...form, interviewerId: e.target.value })}>
              <option value="">Select interviewer...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </Select>
          </div>
          <div>
            <label className="label mb-2">Interview Panel (optional)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {users.filter(u => u.id !== form.interviewerId).map(u => (
                <label key={u.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-colors ${form.panelIds.includes(u.id) ? 'bg-primary-900/30 border-primary-800/50' : 'border-transparent hover:bg-gray-800'}`}>
                  <input type="checkbox" checked={form.panelIds.includes(u.id)} onChange={() => togglePanel(u.id)} className="rounded border-gray-600 bg-gray-700 text-primary-600" />
                  <Avatar name={u.name} size="xs" />
                  <div>
                    <p className="text-xs font-medium text-gray-200">{u.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Email Customization */}
        <div>
          <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-primary-600 rounded text-white text-xs flex items-center justify-center">4</span>
            Email to Candidate
          </h2>
          
          <div className="mb-4">
            <Select 
              label="Select a Template" 
              value={selectedTemplateId}
              onChange={e => {
                const tmpl = EMAIL_TEMPLATES.find(t => t.id === e.target.value);
                if (tmpl) {
                  setSelectedTemplateId(tmpl.id);
                  setEmailTemplate(tmpl.content);
                } else if (e.target.value === 'custom') {
                  setSelectedTemplateId('custom');
                }
              }}
            >
              {EMAIL_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              <option value="custom">Custom Template</option>
            </Select>
          </div>

          <div className="mb-2 text-xs text-gray-400">
            Customize the email below. Placeholders like <code>{`{{candidateName}}`}</code>, <code>{`{{date}}`}</code>, and <code>{`{{joinLink}}`}</code> will be replaced automatically.
          </div>
          <Textarea 
            label="Email Message" 
            value={emailTemplate} 
            onChange={e => {
              setEmailTemplate(e.target.value);
              setSelectedTemplateId('custom');
            }} 
            rows={10}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button loading={loading} onClick={handleSubmit}><Plus size={14} />Schedule Interview</Button>
        </div>
      </div>
    </div>
  );
}
