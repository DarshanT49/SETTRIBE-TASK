import { useState } from 'react';
import { Plus, X, Save, Star } from 'lucide-react';
import { Button, Input, Select, Textarea } from './ui';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function InterviewEvaluationPanel({ meeting, currentUser, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  
  // Accordion state
  const [techOpen, setTechOpen] = useState(true);
  const [softOpen, setSoftOpen] = useState(true);
  const [notesOpen, setNotesOpen] = useState(true);
  
  const [form, setForm] = useState({
    communicationScore: 0,
    problemSolvingScore: 0,
    cultureFitScore: 0,
    recommendation: 'Move to Next Round',
    notes: ''
  });

  const RECOMMENDATIONS = ['Selected', 'Rejected', 'On Hold', 'Move to Next Round'];

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    setSkills(prev => [...prev, { skill: newSkillName.trim(), rating: 0 }]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (index) => {
    setSkills(prev => prev.filter((_, i) => i !== index));
  };

  const handleSkillRating = (index, rating) => {
    const updated = [...skills];
    updated[index].rating = rating;
    setSkills(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
        const payload = {
            interviewId: meeting.id, // Ensure this matches the actual interview ID
            evaluatorId: currentUser.id,
            candidateName: 'Candidate', // Could pull from context if available
            position: 'Role',
            communicationScore: form.communicationScore,
            problemSolvingScore: form.problemSolvingScore,
            cultureFitScore: form.cultureFitScore,
            overallScore: Math.round((form.communicationScore + form.problemSolvingScore + form.cultureFitScore) / 3),
            recommendation: form.recommendation,
            notes: form.notes,
            skillsAssessed: JSON.stringify(skills)
        };
        await api.post('/evaluations', payload);
        toast.success('Evaluation saved successfully!');
        if (onSaved) onSaved();
    } catch (err) {
        console.error(err);
        toast.error('Failed to save evaluation.');
    } finally {
        setLoading(false);
    }
  };

  const renderStars = (currentRating, onRate) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onRate(star)}
          className="focus:outline-none hover:scale-110 transition-transform"
        >
          <Star size={16} className={currentRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-hidden w-full">
      <div className="p-4 border-b border-gray-800 shrink-0">
        <h2 className="font-semibold text-gray-100 flex items-center gap-2">
          <Star size={18} className="text-primary-400" />
          Live Evaluation
        </h2>
        <p className="text-xs text-gray-500 mt-1">Rate the candidate during the interview</p>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        
        {/* Dynamic Skills */}
        <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-800/20">
          <button 
            onClick={() => setTechOpen(!techOpen)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-200">Technical Skills</h3>
            <span className="text-gray-400 font-bold">{techOpen ? '-' : '+'}</span>
          </button>
          
          {techOpen && (
            <div className="p-3 border-t border-gray-800 space-y-3">
              <div className="flex gap-2">
                <Input 
                    placeholder="Skill name (e.g., Java)" 
                    value={newSkillName} 
                    onChange={e => setNewSkillName(e.target.value)} 
                    className="h-8 text-sm"
                />
                <Button size="sm" onClick={handleAddSkill} disabled={!newSkillName.trim()}>
                    <Plus size={16} />
                </Button>
              </div>

              <div className="space-y-3">
                {skills.map((s, idx) => (
                  <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-700/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-base font-medium text-gray-200">{s.skill}</span>
                      <button onClick={() => handleRemoveSkill(idx)} className="text-gray-500 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                    {renderStars(s.rating, (val) => handleSkillRating(idx, val))}
                  </div>
                ))}
                {skills.length === 0 && <p className="text-xs text-gray-500 italic">No technical skills added yet.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Soft Skills */}
        <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-800/20">
          <button 
            onClick={() => setSoftOpen(!softOpen)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-200">Soft Skills</h3>
            <span className="text-gray-400 font-bold">{softOpen ? '-' : '+'}</span>
          </button>
          
          {softOpen && (
            <div className="p-3 border-t border-gray-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">Communication</span>
                {renderStars(form.communicationScore, (val) => setForm(f => ({ ...f, communicationScore: val })))}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">Problem Solving</span>
                {renderStars(form.problemSolvingScore, (val) => setForm(f => ({ ...f, problemSolvingScore: val })))}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-200">Culture Fit</span>
                {renderStars(form.cultureFitScore, (val) => setForm(f => ({ ...f, cultureFitScore: val })))}
              </div>
            </div>
          )}
        </div>

        {/* Notes & Decision */}
        <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-800/20">
          <button 
            onClick={() => setNotesOpen(!notesOpen)}
            className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-200">Notes & Decision</h3>
            <span className="text-gray-400 font-bold">{notesOpen ? '-' : '+'}</span>
          </button>
          
          {notesOpen && (
            <div className="p-3 border-t border-gray-800 space-y-4">
              <Select 
                label="Recommendation" 
                value={form.recommendation} 
                onChange={e => setForm(f => ({ ...f, recommendation: e.target.value }))}
                className="text-sm"
              >
                {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>

              <Textarea 
                label="Overall Notes"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={4}
                placeholder="Candidate strengths, weaknesses..."
                className="text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 shrink-0 bg-gray-900">
        <Button loading={loading} onClick={handleSubmit} className="w-full">
            <Save size={16} /> Save Evaluation
        </Button>
      </div>
    </div>
  );
}
