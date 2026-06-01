import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { createBulkNotifications } from '../services/notifications';
import api from '../services/api';

export default function JoinInterview() {
  const { token } = useParams();
  const [status, setStatus] = useState('Validating your interview link...');
  const [error, setError] = useState(null);
  const [roomConfig, setRoomConfig] = useState(null);
  const [connectionError, setConnectionError] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      try {
        const resp = await api.get(`/interviews/validate?token=${token}`);
        const interview = resp.data;
        
        setStatus('Link validated. Connecting to meeting room...');
        
        // Notify panel members
        if (interview.interviewerId) {
            createBulkNotifications([interview.interviewerId], {
                type: 'interview_joined',
                title: 'Candidate Joined',
                message: `${interview.candidateName} has joined the interview room. Please join now.`,
                relatedId: interview.id,
                relatedType: 'interview'
            });
        }

        const searchParams = new URLSearchParams(window.location.search);
        const meetingId = searchParams.get('meetingId');
        
        if (meetingId) {
            const tokenResp = await api.post(`/meetings/${meetingId}/join-token`, {
                userId: interview.id || `candidate-${Date.now()}`,
                displayName: interview.candidateName || 'Candidate'
            });
            
            setRoomConfig(tokenResp.data);
        } else {
            setError('Meeting ID not found in the link.');
        }

      } catch (err) {
        console.error('Validation error:', err);
        setError(err.response?.data?.message || err.response?.data || 'This interview session has expired or is invalid.');
      }
    };

    validateToken();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 animate-fade-in">
        <div className="card p-8 max-w-md text-center border-red-900/50">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (roomConfig) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-950">
        {connectionError && (
          <div className="fixed left-1/2 top-4 z-[150] w-[min(92vw,520px)] -translate-x-1/2 rounded-lg border border-red-800 bg-red-950/95 p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-red-100">Meeting media server is unreachable</h2>
            <p className="mt-1 text-xs leading-5 text-red-200">{connectionError}</p>
          </div>
        )}
        <LiveKitRoom
          token={roomConfig.token}
          serverUrl={roomConfig.url}
          connect
          audio
          video
          onError={() => {
            setConnectionError(`The browser could not connect to ${roomConfig.url}. Start LiveKit on port 7880 or update LIVEKIT_URL to the reachable LiveKit WebSocket URL.`);
          }}
          data-lk-theme="default"
          className="h-full"
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 animate-fade-in">
      <div className="card p-8 max-w-md text-center">
        <div className="text-6xl mb-4 animate-pulse">⏳</div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">Joining Interview</h1>
        <p className="text-gray-400 text-sm">{status}</p>
      </div>
    </div>
  );
}
