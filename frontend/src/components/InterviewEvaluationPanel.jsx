import { useState, useEffect, useMemo } from 'react';
import { Save, Star, AlertCircle, FileText, Plus, X, Check } from 'lucide-react';
import { Button, Select, Textarea } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const DEFAULT_TECH_STACKS = ['Java', 'Python', 'Spring Boot', 'React', 'Angular', 'Node.js', 'AWS', 'SQL'];

const TECHNICAL_CRITERIA = ['Technical Skills', 'Problem Solving', 'Communication Skills'];
const HR_CRITERIA = ['Communication Skills', 'Team Fit', 'Leadership Potential', 'Adaptability'];
const DEFAULT_CRITERIA = ['Technical Skills', 'Communication', 'Problem Solving'];

const RECOMMENDATIONS = ['Strongly Recommend', 'Recommend', 'Hold', 'Not Recommended', 'Reject'];

export default function InterviewEvaluationPanel({ meeting, currentUser, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  const storageKey = `evaluation_draft_${meeting?.id}_${currentUser?.id}`;

  const defaultCriteria = useMemo(() => {
    const round = (meeting?.round || meeting?.interviewType || '').toLowerCase();
    if (round.includes('technical')) return TECHNICAL_CRITERIA;
    if (round.includes('hr')) return HR_CRITERIA;
    return DEFAULT_CRITERIA;
  }, [meeting]);

  const [form, setForm] = useState(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.criteria) return parsed; // ensure it's the new format
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    const initialMarks = {};
    defaultCriteria.forEach(c => initialMarks[c] = 0);
    return {
      criteria: [...defaultCriteria],
      marks: initialMarks,
      candidateFeedback: '',
      strengths: '',
      areasForImprovement: '',
      overallRemarks: '',
      recommendation: ''
    };
  });

  const [newSkill, setNewSkill] = useState('');

  // Auto-save Draft
  useEffect(() => {
    setSaveStatus('Saving...');
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(form));
      setSaveStatus('Draft auto-saved');
      
      const hideTimeout = setTimeout(() => setSaveStatus(''), 2000);
      return () => clearTimeout(hideTimeout);
    }, 800); // debounce
    return () => clearTimeout(timeoutId);
  }, [form, storageKey]);

  const handleMarkChange = (criterion, value) => {
    setForm(prev => ({
      ...prev,
      marks: { ...prev.marks, [criterion]: Number(value) }
    }));
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    const skill = newSkill.trim();
    if (skill && !form.criteria.includes(skill)) {
      setForm(prev => ({
        ...prev,
        criteria: [...prev.criteria, skill],
        marks: { ...prev.marks, [skill]: 0 }
      }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skill) => {
    setForm(prev => {
      const newMarks = { ...prev.marks };
      delete newMarks[skill];
      return {
        ...prev,
        criteria: prev.criteria.filter(c => c !== skill),
        marks: newMarks
      };
    });
  };

  const scoreData = useMemo(() => {
    const totalMarks = Object.values(form.marks).reduce((sum, val) => sum + val, 0);
    const maxMarks = form.criteria.length * 5;
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    const overallScore = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 5) : 0;
    return { totalMarks, maxMarks, percentage, overallScore };
  }, [form.marks, form.criteria]);

  const handleSubmit = async () => {
    if (!form.recommendation) {
      toast.error('Please select a final recommendation.');
      return;
    }
    setLoading(true);
    try {
      const criteriaArray = form.criteria.map(topic => ({
        topic,
        marks: form.marks[topic] || 0,
        max: 5
      }));

      const payload = {
        interviewId: meeting.id,
        evaluatorId: currentUser.id,
        candidateName: meeting.candidateName || 'Candidate',
        position: meeting.position || 'Role',
        overallScore: scoreData.overallScore,
        percentage: parseFloat(scoreData.percentage.toFixed(2)),
        recommendation: form.recommendation,
        notes: form.candidateFeedback,
        candidateStrengths: form.strengths,
        areasForImprovement: form.areasForImprovement,
        recommendedNextSteps: form.overallRemarks,
        skillsAssessed: JSON.stringify(criteriaArray)
      };
      
      await api.post('/evaluations', payload);
      toast.success('Evaluation submitted successfully!');
      localStorage.removeItem(storageKey);
      if (onSaved) onSaved(payload);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden w-full">
      <div className="p-4 border-b border-gray-800 shrink-0 bg-gray-800/50 flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-gray-100 flex items-center gap-2">
            <FileText size={18} className="text-primary-400" />
            Live Evaluation
          </h2>
          <p className="text-xs text-gray-500 mt-1 capitalize">{meeting?.round || meeting?.interviewType || 'General'} Round - Marks Based (0-5)</p>
        </div>
        {saveStatus && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md animate-fade-in">
            {saveStatus === 'Saving...' ? <div className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" /> : <Check size={12} />}
            {saveStatus}
          </div>
        )}
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-6 pb-20">
        
        {/* Live Score Display */}
        <div className="bg-primary-900/20 border border-primary-800/30 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Marks</p>
            <p className="text-lg font-bold text-gray-100">{scoreData.totalMarks} / {scoreData.maxMarks}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Percentage</p>
            <p className="text-lg font-bold text-gray-100">{scoreData.percentage.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Overall Score</p>
            <p className="text-lg font-bold text-gray-100 flex items-center justify-center gap-1">
               {scoreData.overallScore} <Star size={14} className="text-yellow-400 fill-yellow-400"/>
            </p>
          </div>
          <div className="flex items-center justify-center">
            <span className={`text-sm font-semibold px-2 py-1 rounded ${
              scoreData.percentage >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
              scoreData.percentage >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {scoreData.percentage >= 80 ? 'Excellent' : scoreData.percentage >= 60 ? 'Average' : 'Below Average'}
            </span>
          </div>
        </div>

        {/* Dynamic Criteria / Tech Stack */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2">
            <h3 className="text-sm font-semibold text-gray-200">Tech Stack & Skills</h3>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newSkill} 
              onChange={e => setNewSkill(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
              placeholder="e.g. Java, Python, React..." 
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              list="tech-stacks"
            />
            <datalist id="tech-stacks">
              {DEFAULT_TECH_STACKS.map(ts => <option key={ts} value={ts} />)}
            </datalist>
            <Button size="sm" onClick={handleAddSkill} disabled={!newSkill.trim()}>
              <Plus size={16} /> Add
            </Button>
          </div>

          <div className="space-y-2 mt-3">
            {form.criteria.map(criterion => (
              <div key={criterion} className="flex items-center justify-between p-2.5 bg-gray-800/30 rounded-lg border border-gray-800 group">
                <span className="text-sm font-medium text-gray-300 flex-1 truncate pr-2">{criterion}</span>
                <div className="flex items-center gap-3">
                  <Select 
                    value={form.marks[criterion] || 0}
                    onChange={(e) => handleMarkChange(criterion, e.target.value)}
                    className="h-8 w-20 text-sm bg-gray-900"
                  >
                    {[0, 1, 2, 3, 4, 5].map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </Select>
                  <button onClick={() => handleRemoveSkill(criterion)} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            {form.criteria.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">No skills added yet. Add some to begin evaluating.</p>
            )}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold text-gray-200 border-b border-gray-800 pb-2">Interview Feedback</h3>
          
          <Textarea 
            label="Candidate feedback"
            value={form.candidateFeedback}
            onChange={(e) => handleFieldChange('candidateFeedback', e.target.value)}
            rows={3}
            placeholder="General assessment of the candidate..."
          />
          <Textarea 
            label="Strengths"
            value={form.strengths}
            onChange={(e) => handleFieldChange('strengths', e.target.value)}
            rows={2}
            placeholder="What did they do well?"
          />
          <Textarea 
            label="Areas for improvement"
            value={form.areasForImprovement}
            onChange={(e) => handleFieldChange('areasForImprovement', e.target.value)}
            rows={2}
            placeholder="Where did they struggle?"
          />
          <Textarea 
            label="Overall remarks"
            value={form.overallRemarks}
            onChange={(e) => handleFieldChange('overallRemarks', e.target.value)}
            rows={2}
            placeholder="Any other observations?"
          />

          <Select 
            label="Final recommendation *" 
            value={form.recommendation} 
            onChange={e => handleFieldChange('recommendation', e.target.value)}
          >
            <option value="">Select Recommendation...</option>
            {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-900/20 text-blue-400 rounded-lg text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>Your progress is auto-saved locally. Do not forget to submit the evaluation when finished.</p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900 absolute bottom-0 left-0 right-0">
        <Button loading={loading} onClick={handleSubmit} className="w-full h-11">
            <Save size={18} className="mr-2" /> Submit Evaluation
        </Button>
      </div>
    </div>
  );
}
