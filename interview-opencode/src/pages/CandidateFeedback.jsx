import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Button, Textarea } from '../components/ui';

export default function CandidateFeedback() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [form, setForm] = useState({
    experienceRating: 0,
    videoQualityRating: 0,
    audioQualityRating: 0,
    platformRating: 0,
    joiningEaseRating: 0,
    comments: ''
  });

  const categories = [
    { key: 'experienceRating', label: 'Overall Interview Experience' },
    { key: 'videoQualityRating', label: 'Video Call Quality' },
    { key: 'audioQualityRating', label: 'Audio Quality' },
    { key: 'platformRating', label: 'Platform Experience' },
    { key: 'joiningEaseRating', label: 'Ease of Joining' },
  ];

  const handleRating = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async () => {
    // Validate
    if (categories.some(c => form[c.key] === 0)) {
        toast.error('Please provide a rating for all categories.');
        return;
    }

    setLoading(true);
    try {
        await api.post('/candidate-feedback', {
            interviewId: interviewId,
            experienceRating: form.experienceRating,
            videoQualityRating: form.videoQualityRating,
            audioQualityRating: form.audioQualityRating,
            platformRating: form.platformRating,
            joiningEaseRating: form.joiningEaseRating,
            overallRating: Math.round(
                (form.experienceRating + form.videoQualityRating + form.audioQualityRating + 
                 form.platformRating + form.joiningEaseRating) / 5
            ),
            comments: form.comments
        });
        setSubmitted(true);
    } catch (err) {
        console.error(err);
        toast.error('Failed to submit feedback. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  if (submitted) {
    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="card p-8 max-w-md text-center border-primary-900/50">
                <CheckCircle size={48} className="mx-auto text-primary-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-100 mb-2">Thank You!</h1>
                <p className="text-gray-400 text-sm mb-6">
                    Your feedback has been successfully submitted. We appreciate your time and wish you the best in your career journey.
                </p>
                <Button onClick={() => window.location.href = 'https://settribe.com'} className="w-full">
                    Return to Home
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 animate-fade-in flex justify-center items-start">
        <div className="card max-w-2xl w-full p-6 md:p-8 mt-10">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-100 mb-2">Interview Feedback</h1>
                <p className="text-gray-400 text-sm">Please rate your interview experience on our platform.</p>
            </div>

            <div className="space-y-6 mb-8">
                {categories.map(cat => (
                    <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-gray-800/30 border border-gray-800">
                        <span className="text-gray-200 font-medium">{cat.label}</span>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    onClick={() => handleRating(cat.key, star)}
                                    className="focus:outline-none hover:scale-110 transition-transform"
                                >
                                    <Star 
                                        size={24} 
                                        className={form[cat.key] >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'} 
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mb-8">
                <Textarea 
                    label="Additional Comments or Suggestions (Optional)"
                    value={form.comments}
                    onChange={(e) => setForm(f => ({ ...f, comments: e.target.value }))}
                    rows={4}
                    placeholder="Tell us how we can improve..."
                />
            </div>

            <div className="flex justify-end">
                <Button loading={loading} onClick={handleSubmit} className="w-full sm:w-auto">
                    Submit Feedback
                </Button>
            </div>
        </div>
    </div>
  );
}
