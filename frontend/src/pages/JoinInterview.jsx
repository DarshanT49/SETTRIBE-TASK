import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import { createBulkNotifications } from '../services/notifications';
import api from '../services/api';
import { Camera, Mic, Volume2, Wifi, WifiOff, Settings, Loader2 } from 'lucide-react';
import InterviewEvaluationPanel from '../components/InterviewEvaluationPanel';

export default function JoinInterview() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [status, setStatus] = useState('Validating your interview link...');
  const [error, setError] = useState(null);
  const [roomConfig, setRoomConfig] = useState(null);
  const [connectionError, setConnectionError] = useState('');
  const [interviewData, setInterviewData] = useState(null);
  const [isPreJoin, setIsPreJoin] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('candidate');

  // Waiting room device state
  const [cameraStream, setCameraStream] = useState(null);
  const [micLevel, setMicLevel] = useState(0);
  const [devices, setDevices] = useState({ cameras: [], mics: [], speakers: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [connectivityStatus, setConnectivityStatus] = useState('checking'); // checking | good | poor | offline
  const [speakerTesting, setSpeakerTesting] = useState(false);
  const [showEvalPanel, setShowEvalPanel] = useState(false);

  // Auto-show eval panel for interviewer once room is connected
  useEffect(() => {
    if (roomConfig && userRole === 'interviewer') {
      setShowEvalPanel(true);
    }
  }, [roomConfig, userRole]);

  const videoRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micAnimFrameRef = useRef(null);
  const speakerAudioRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // ---- Device enumeration ----
  const enumerateDevices = useCallback(async () => {
    try {
      const devList = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: devList.filter(d => d.kind === 'videoinput'),
        mics: devList.filter(d => d.kind === 'audioinput'),
        speakers: devList.filter(d => d.kind === 'audiooutput'),
      });
    } catch (e) {
      console.warn('Device enumeration failed', e);
    }
  }, []);

  // ---- Camera preview ----
  const startCameraPreview = useCallback(async (deviceId) => {
    // Stop any existing stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
    }

    try {
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn('Camera access failed:', e);
    }
  }, [cameraStream]);

  // ---- Mic level monitoring ----
  const startMicMonitor = useCallback(async (deviceId) => {
    // Cleanup previous
    if (micAnalyserRef.current?.stream) {
      micAnalyserRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
    }

    try {
      const constraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      micAnalyserRef.current = { stream, audioCtx, analyser };

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        micAnimFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn('Mic access failed:', e);
    }
  }, []);

  // ---- Speaker test ----
  const testSpeaker = () => {
    setSpeakerTesting(true);
    if (!speakerAudioRef.current) {
      speakerAudioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+Onpyai4F4cW13hJGdoZyUi4F4cG13g5CcoZ2VjIJ5cW55hJGdoZ2VjIJ5cW55hJGdoZ2VjIJ5cW55hJGdoZ2VjIJ5cW55hJGdoZ2VjIJ5cW55hJGdoZ2VjIJ5cW55hA==');
    }
    speakerAudioRef.current.currentTime = 0;
    speakerAudioRef.current.play().then(() => {
      setTimeout(() => setSpeakerTesting(false), 1500);
    }).catch(() => {
      setSpeakerTesting(false);
    });
  };

  // ---- Connectivity check ----
  const checkConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      setConnectivityStatus('offline');
      return;
    }
    try {
      const start = performance.now();
      await fetch(api.defaults.baseURL + '/../', { method: 'HEAD', mode: 'no-cors' });
      const latency = performance.now() - start;
      setConnectivityStatus(latency < 500 ? 'good' : 'poor');
    } catch {
      setConnectivityStatus(navigator.onLine ? 'poor' : 'offline');
    }
  }, []);

  // ---- Initialization: devices + connectivity ----
  useEffect(() => {
    if (isPreJoin && !roomConfig) {
      enumerateDevices();
      startCameraPreview(selectedCamera || undefined);
      startMicMonitor(selectedMic || undefined);
      checkConnectivity();
      const connInterval = setInterval(checkConnectivity, 10000);

      return () => {
        clearInterval(connInterval);
        if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
        if (micAnalyserRef.current?.stream) micAnalyserRef.current.stream.getTracks().forEach(t => t.stop());
        if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
      };
    }
  // Only re-run when isPreJoin flips on or device selection changes
   
  }, [isPreJoin, roomConfig, selectedCamera, selectedMic]);

  // ---- Token validation ----
  useEffect(() => {
    let cancelled = false;

    const validateToken = async () => {
      try {
        const resp = await api.get(`/interviews/validate?token=${token}`);
        const interview = resp.data;
        if (!cancelled) {
          setInterviewData(interview);
          if (currentUser && (currentUser.role === 'HR' || currentUser.id === interview.interviewerId)) {
            setUserName(currentUser.name || 'Interviewer');
            setUserRole('interviewer');
          } else {
            setUserName(interview.candidateName || '');
            setUserRole('candidate');
          }
          setIsPreJoin(true);
          setStatus('Link validated.');
        }
      } catch (err) {
        console.error('Validation error:', err);
        if (!cancelled) setError(err.response?.data?.message || err.response?.data || 'This interview session has expired or is invalid.');
      }
    };

    validateToken();

    return () => {
      cancelled = true;
    };
   
  }, [token]);

  const handleJoin = async () => {
    try {
      setStatus('Connecting to meeting room...');
      const tokenResp = await api.post(`/interviews/${interviewData.id}/join-token`, {
        userId: `${userRole}-${Date.now()}`,
        displayName: userName || (userRole === 'candidate' ? 'Candidate' : 'Interviewer')
      });
      setRoomConfig(tokenResp.data);

      if (userRole === 'candidate' && interviewData.interviewerId) {
        createBulkNotifications([interviewData.interviewerId], {
          type: 'interview_joined',
          title: 'Candidate Joined',
          message: `${userName || interviewData.candidateName} has joined the interview room. Please join now.`,
          relatedId: interviewData.id,
          relatedType: 'interview'
        });
      }
    } catch (err) {
      setError('Failed to connect to the room.');
    }
  };

  // Clean up streams when entering the call
  useEffect(() => {
    if (roomConfig) {
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      if (micAnalyserRef.current?.stream) micAnalyserRef.current.stream.getTracks().forEach(t => t.stop());
      if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
    }
   
  }, [roomConfig]);

  // ---- Error screen ----
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

  // ---- Pre-Join Screen ----
  if (isPreJoin && !roomConfig) {
    const connIcon = {
      checking: <Loader2 size={14} className="animate-spin text-gray-400" />,
      good: <Wifi size={14} className="text-emerald-400" />,
      poor: <Wifi size={14} className="text-yellow-400" />,
      offline: <WifiOff size={14} className="text-red-400" />,
    };
    const connLabel = {
      checking: 'Checking...',
      good: 'Connection Good',
      poor: 'Weak Connection',
      offline: 'Offline',
    };

    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 animate-fade-in">
        <div className="w-full max-w-2xl space-y-6">

          {/* ---- Interview Info & Setup Card ---- */}
          <div className="card p-6 border-primary-900/50">
            <h1 className="text-2xl font-bold text-gray-100 mb-4">Interview Setup</h1>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">CANDIDATE</p>
                <p className="text-sm text-gray-200 font-semibold">{interviewData?.candidateName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-0.5">POSITION</p>
                <p className="text-sm text-gray-200 font-semibold">{interviewData?.position}</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Your Name</label>
                <input 
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:border-primary-500 focus:outline-none"
                  placeholder="Enter your name"
                />
              </div>

            </div>
          </div>

          {/* ---- Camera Preview + Device Checks ---- */}
          <div className="card p-6 border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Camera size={16} className="text-primary-400" /> Pre-Join Check
              </h2>
              <button
                onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                <Settings size={14} /> Device Settings
              </button>
            </div>

            {/* Camera preview */}
            <div className="relative w-full aspect-video bg-gray-900 rounded-xl overflow-hidden mb-4 border border-gray-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraStream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                  <Camera size={32} className="mb-2" />
                  <p className="text-xs">Camera not available</p>
                </div>
              )}
            </div>

            {/* Status indicators row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Camera */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <Camera size={14} className={cameraStream ? 'text-emerald-400' : 'text-gray-500'} />
                <span className="text-xs text-gray-300">{cameraStream ? 'Camera OK' : 'No Camera'}</span>
              </div>

              {/* Microphone level */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <Mic size={14} className={micLevel > 5 ? 'text-emerald-400' : 'text-gray-500'} />
                <div className="flex-1">
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-100"
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speaker test */}
              <button
                onClick={testSpeaker}
                disabled={speakerTesting}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors text-left"
              >
                <Volume2 size={14} className={speakerTesting ? 'text-primary-400 animate-pulse' : 'text-gray-400'} />
                <span className="text-xs text-gray-300">{speakerTesting ? 'Playing...' : 'Test Speaker'}</span>
              </button>

              {/* Connectivity */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
                {connIcon[connectivityStatus]}
                <span className="text-xs text-gray-300">{connLabel[connectivityStatus]}</span>
              </div>
            </div>

            {/* Device settings (expandable) */}
            {showDeviceSettings && (
              <div className="mt-4 pt-4 border-t border-gray-800 space-y-3 animate-fade-in">
                {devices.cameras.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Camera</label>
                    <select
                      value={selectedCamera}
                      onChange={e => setSelectedCamera(e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 outline-none focus:border-primary-600"
                    >
                      {devices.cameras.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 8)}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                {devices.mics.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Microphone</label>
                    <select
                      value={selectedMic}
                      onChange={e => setSelectedMic(e.target.value)}
                      className="w-full text-sm rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-gray-200 outline-none focus:border-primary-600"
                    >
                      {devices.mics.map(d => (
                        <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 8)}`}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={handleJoin}
              disabled={!userName.trim()}
              className="w-full mt-6 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all"
            >
              Join Meeting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Live Video Call ----
  if (roomConfig) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-950">
        {connectionError && (
          <div className="fixed left-1/2 top-4 z-[150] w-[min(92vw,520px)] -translate-x-1/2 rounded-lg border border-red-800 bg-red-950/95 p-4 shadow-xl">
            <h2 className="text-sm font-semibold text-red-100">Meeting media server is unreachable</h2>
            <p className="mt-1 text-xs leading-5 text-red-200">{connectionError}</p>
          </div>
        )}
        <div className={`h-full ${showEvalPanel ? 'md:mr-[380px]' : ''}`}>
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

        {/* Evaluation panel toggle (visible for logged-in interviewers) */}
        {userRole === 'interviewer' && (
          <button 
            onClick={() => setShowEvalPanel(!showEvalPanel)}
            className="fixed top-4 right-4 z-[9999] bg-gray-900 border border-gray-700 text-gray-200 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
          >
            {showEvalPanel ? 'Hide Evaluation' : 'Evaluate Candidate'}
          </button>
        )}

        {showEvalPanel && interviewData && userRole === 'interviewer' && (
          <aside className="fixed bottom-0 right-0 top-0 z-[120] w-full md:w-[380px] border-l border-gray-800 shadow-2xl overflow-hidden pt-16 md:pt-0">
            <InterviewEvaluationPanel
              meeting={interviewData}
              currentUser={{ id: interviewData.interviewerId || 'interviewer' }}
              onSaved={() => { setShowEvalPanel(false); }}
            />
          </aside>
        )}
      </div>
    );
  }

  // ---- Loading / Connecting ----
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 animate-fade-in">
      <div className="card p-8 max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-primary-900/30 border border-primary-700/50 flex items-center justify-center mx-auto mb-6">
          <Loader2 size={28} className="text-primary-500 animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-gray-100 mb-2">Joining Interview</h1>
        <p className="text-gray-400 text-sm">{status}</p>
      </div>
    </div>
  );
}
