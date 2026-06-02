import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { createBulkNotifications } from '../services/notifications';
import api from '../services/api';

import { useNavigate } from 'react-router-dom';

export default function JoinInterview() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Validating your interview link...');
  const [error, setError] = useState(null);
  const [roomConfig, setRoomConfig] = useState(null);
  const [connectionError, setConnectionError] = useState('');
  const [interviewData, setInterviewData] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const resp = await api.get(`/interviews/validate?token=${token}`);
        const interview = resp.data;
        setInterviewData(interview);
        
        if (interview.joinStatus === 'WAITING_ROOM') {
            setIsWaiting(true);
            return;
        }

        setIsWaiting(false);
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
    
    // Polling if in waiting room
    let intervalId;
    if (isWaiting) {
        intervalId = setInterval(validateToken, 10000); // Check every 10 seconds
    }
    
    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [token, isWaiting]);

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

  if (isWaiting) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="card p-8 max-w-md text-center border-primary-900/50">
          <div className="w-16 h-16 rounded-full bg-primary-900/30 border border-primary-700/50 flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Waiting Room</h1>
          <p className="text-gray-400 text-sm mb-6">
            Please wait. Your interview starts soon and the interviewer has not joined the meeting yet.
          </p>
          <div className="bg-gray-800/50 p-4 rounded-lg text-left">
            <p className="text-xs text-gray-500 font-medium mb-1">CANDIDATE</p>
            <p className="text-sm text-gray-200 font-semibold mb-3">{interviewData?.candidateName}</p>
            <p className="text-xs text-gray-500 font-medium mb-1">POSITION</p>
            <p className="text-sm text-gray-200 font-semibold">{interviewData?.position}</p>
          </div>
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
          onDisconnected={() => {
            if (interviewData) {
              navigate(`/candidate-feedback/${interviewData.id}`);
            }
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
