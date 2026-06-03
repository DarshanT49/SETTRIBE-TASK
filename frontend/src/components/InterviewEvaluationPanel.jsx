import { useState, useEffect, useMemo } from 'react';
import { Save, Star, AlertCircle, FileText } from 'lucide-react';
import { Button, Select, Textarea } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';

const TECHNICAL_CRITERIA = ['HTML/CSS', 'JavaScript', 'React.js', 'Java', 'Spring Boot', 'PHP', 'Database (MySQL/PostgreSQL)', 'API Development', 'Problem Solving', 'System Design', 'Communication Skills'];
const TESTING_CRITERIA = ['Manual Testing', 'Automation Testing', 'Test Case Writing', 'Bug Reporting', 'API Testing', 'Selenium', 'Performance Testing', 'QA Processes', 'Communication Skills'];
const HR_CRITERIA = ['Communication Skills', 'Team Fit', 'Leadership Potential', 'Adaptability', 'Problem Solving'];
const MANAGERIAL_CRITERIA = ['Project Management', 'Team Leadership', 'Strategic Thinking', 'Conflict Resolution', 'Communication Skills'];
const DESIGN_CRITERIA = ['UI/UX Principles', 'Prototyping', 'Design Tools (Figma)', 'User Research', 'Creativity', 'Communication Skills'];
const DEFAULT_CRITERIA = ['Technical Skills', 'Communication', 'Problem Solving', 'Culture Fit', 'Experience Level'];

const RECOMMENDATIONS = ['Strongly Recommend', 'Recommend', 'Hold', 'Not Recommended', 'Reject'];

export default function InterviewEvaluationPanel({ meeting, currentUser, onSaved }) {
  const [loading, setLoading] = useState(false);
  
  // Determine Criteria Based on Interview Round/Type
  const criteriaList = useMemo(() => {
    const round = (meeting?.round || meeting?.interviewType || '').toLowerCase();
    if (round.includes('technical')) return TECHNICAL_CRITERIA;
    if (round.includes('testing') || round.includes('qa')) return TESTING_CRITERIA;
    if (round.includes('hr')) return HR_CRITERIA;
    if (round.includes('manager')) return MANAGERIAL_CRITERIA;
    if (round.includes('design')) return DESIGN_CRITERIA;
    return DEFAULT_CRITERIA;
  }, [meeting]);

  const storageKey = `evaluation_draft_${meeting?.id}_${currentUser?.id}`;

  const [form, setForm] = useState(() => {
    const savedDraft = localStorage.getItem(storageKey);
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error("Failed to parse draft", e);
      }
    }
    const initialMarks = {};
    criteriaList.forEach(c => initialMarks[c] = 0);
    return {
      marks: initialMarks,
      overallFeedback: '',
      candidateStrengths: '',
      areasForImprovement: '',
      recommendedNextSteps: '',
      recommendation: ''
    };
  });

  // Auto-save Draft
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(form));
    }, 1000); // 1-second debounce
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

  const scoreData = useMemo(() => {
    const totalMarks = Object.values(form.marks).reduce((sum, val) => sum + val, 0);
    const maxMarks = criteriaList.length * 5;
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    const overallScore = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 5) : 0;
    return { totalMarks, maxMarks, percentage, overallScore };
  }, [form.marks, criteriaList]);

  const handleSubmit = async () => {
    if (!form.recommendation) {
      toast.error('Please select a final recommendation.');
      return;
    }
    setLoading(true);
    try {
      const criteriaArray = criteriaList.map(topic => ({
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
        notes: form.overallFeedback,
        candidateStrengths: form.candidateStrengths,
        areasForImprovement: form.areasForImprovement,
        recommendedNextSteps: form.recommendedNextSteps,
        skillsAssessed: JSON.stringify(criteriaArray)
      };
      
      await api.post('/evaluations', payload);
      toast.success('Evaluation saved successfully!');
      localStorage.removeItem(storageKey); // Clear draft after successful save
      if (onSaved) onSaved(payload);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden w-full">
      <div className="p-4 border-b border-gray-800 shrink-0 bg-gray-800/50">
        <h2 className="font-semibold text-gray-100 flex items-center gap-2">
          <FileText size={18} className="text-primary-400" />
          Live Evaluation
        </h2>
        <p className="text-xs text-gray-500 mt-1 capitalize">{meeting?.round || meeting?.interviewType || 'General'} Round - Marks Based (0-5)</p>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        
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

        {/* Dynamic Criteria */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-200 border-b border-gray-800 pb-2">Evaluation Criteria</h3>
          {criteriaList.map(criterion => (
            <div key={criterion} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-gray-800">
              <span className="text-sm font-medium text-gray-300 w-2/3">{criterion}</span>
              <div className="w-1/3 max-w-[100px]">
                <Select 
                  value={form.marks[criterion] || 0}
                  onChange={(e) => handleMarkChange(criterion, e.target.value)}
                  className="h-8 text-sm bg-gray-900"
                >
                  {[0, 1, 2, 3, 4, 5].map(val => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </div>

        {/* Feedback Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 border-b border-gray-800 pb-2">Interview Feedback</h3>
          
          <Textarea 
            label="Overall Feedback"
            value={form.overallFeedback}
            onChange={(e) => handleFieldChange('overallFeedback', e.target.value)}
            rows={3}
            placeholder="General assessment of the candidate..."
          />
          <Textarea 
            label="Candidate Strengths"
            value={form.candidateStrengths}
            onChange={(e) => handleFieldChange('candidateStrengths', e.target.value)}
            rows={2}
            placeholder="What did they do well?"
          />
          <Textarea 
            label="Areas for Improvement"
            value={form.areasForImprovement}
            onChange={(e) => handleFieldChange('areasForImprovement', e.target.value)}
            rows={2}
            placeholder="Where did they struggle?"
          />
          <Textarea 
            label="Recommended Next Steps"
            value={form.recommendedNextSteps}
            onChange={(e) => handleFieldChange('recommendedNextSteps', e.target.value)}
            rows={2}
            placeholder="e.g., Proceed to HR round, Needs another technical screening"
          />

          <Select 
            label="Final Recommendation *" 
            value={form.recommendation} 
            onChange={e => handleFieldChange('recommendation', e.target.value)}
          >
            <option value="">Select Recommendation...</option>
            {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-900/20 text-blue-400 rounded-lg text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <p>Your inputs are auto-saved locally. If you lose connection, they will be restored when you return.</p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900">
        <Button loading={loading} onClick={handleSubmit} className="w-full h-11">
            <Save size={18} className="mr-2" /> Submit Evaluation
        </Button>
      </div>
    </div>
  );
}


