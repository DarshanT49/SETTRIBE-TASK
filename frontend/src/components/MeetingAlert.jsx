import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { asyncGet, KEYS } from '../services/storage';
import { getMeetingDateTime, formatDateTime } from '../utils/dates';
import { Bell, Volume2, Video } from 'lucide-react';

const ALERT_AUDIO_SRC = '/faespencer-monday-marimba-194523.mp3';
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function MeetingAlert() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeAlert, setActiveAlert] = useState(null);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);
  const audioRef = useRef(null);
  const activeAlertRef = useRef(null);

  useEffect(() => {
    activeAlertRef.current = activeAlert;
  }, [activeAlert]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio(ALERT_AUDIO_SRC);
      audioRef.current.loop = true;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const startBeep = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay prevented by browser:", error);
          setIsAudioBlocked(true);
        });
      }
    }
  }, []);

  const stopBeep = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const acknowledgeAlert = () => {
    if (activeAlert && currentUser) {
      const storageKey = `acknowledgedMeetingAlerts:${currentUser.id}`;
      const acknowledged = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!acknowledged.includes(activeAlert.id)) {
        acknowledged.push(activeAlert.id);
        localStorage.setItem(storageKey, JSON.stringify(acknowledged));
      }
    }
    stopBeep();
    setActiveAlert(null);
    setIsAudioBlocked(false);
  };

  const handleJoinMeeting = () => {
    if (activeAlert) {
      const meetingId = activeAlert.id;
      acknowledgeAlert();
      navigate(`/meetings/${meetingId}/room`);
    }
  };

  const manuallyPlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsAudioBlocked(false);
      }).catch(e => console.error("Still blocked:", e));
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const checkMeetings = async () => {
      if (activeAlertRef.current) return;

      try {
        const rawMeetings = await asyncGet(KEYS.MEETINGS) || [];
        const meetings = rawMeetings.filter(m => m.type !== 'interview');
        const storageKey = `acknowledgedMeetingAlerts:${currentUser.id}`;
        const acknowledged = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const now = Date.now();

        const nextMeeting = meetings
          .filter(meeting => {
            if (!meeting.participantIds?.some(id => String(id) === String(currentUser.id))) return false;
            if (acknowledged.includes(meeting.id)) return false;
            if (meeting.status === 'completed' || meeting.status === 'cancelled') return false;

            // If the user is already in this specific meeting room, do not trigger the alarm
            if (window.location.pathname === `/meetings/${meeting.id}/room`) return false;

            const meetingTime = getMeetingDateTime(meeting).getTime();
            const timeUntilMeeting = meetingTime - now;
            return timeUntilMeeting > 0 && timeUntilMeeting <= FIVE_MINUTES_MS;
          })
          .sort((a, b) => getMeetingDateTime(a).getTime() - getMeetingDateTime(b).getTime())[0];

        if (nextMeeting) {
          setActiveAlert(nextMeeting);
          startBeep();
          
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Meeting Starting Soon', {
              body: `${nextMeeting.title} at ${formatDateTime(getMeetingDateTime(nextMeeting).toISOString())}`,
            });
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          }
        }
      } catch (error) {
        console.error("Failed to check meetings for alerts", error);
      }
    };

    checkMeetings();

    const interval = setInterval(checkMeetings, 10000);
    return () => {
      clearInterval(interval);
      stopBeep();
    };
  }, [currentUser, startBeep, stopBeep]);

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-pulse-slow">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center animate-bounce">
            <Bell className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-100 mb-2">
          Meeting Starting Soon
        </h2>
        
        <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
          <p className="text-lg font-medium text-gray-200 text-center mb-1">
            {activeAlert.title}
          </p>
          <p className="text-sm text-gray-400 text-center">
            {formatDateTime(getMeetingDateTime(activeAlert).toISOString())}
          </p>
        </div>

        {isAudioBlocked && (
          <button
            onClick={manuallyPlayAudio}
            className="w-full py-3 px-4 mb-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
          >
            <Volume2 className="w-5 h-5" />
            Click to Unmute Alert
          </button>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleJoinMeeting}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
            <Video className="w-5 h-5" />
            Join Meeting
          </button>
          
          <button
            onClick={acknowledgeAlert}
            className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-gray-900/20"
          >
            Acknowledge & Mute
          </button>
        </div>
      </div>
    </div>
  );
}
