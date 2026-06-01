import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { asyncGet, KEYS } from '../services/storage';
import { getMeetingDateTime, formatDateTime } from '../utils/dates';
import { Bell, X } from 'lucide-react';

export function MeetingAlert() {
  const { currentUser } = useAuth();
  const [activeAlert, setActiveAlert] = useState(null);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const intervalRef = useRef(null);

  // Unlock audio context on first user interaction to bypass autoplay policy
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const startBeep = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    // Stop existing if any
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch(e){}
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Play a repeating beep
    const playSingleBeep = () => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed') return;
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      oscillatorRef.current = osc;
    };

    playSingleBeep();
    intervalRef.current = setInterval(playSingleBeep, 1000); // Beep every second
  }, []);

  const stopBeep = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch(e){}
      oscillatorRef.current = null;
    }
  }, []);

  const acknowledgeAlert = () => {
    if (activeAlert) {
      const acknowledged = JSON.parse(localStorage.getItem('acknowledgedMeetings') || '[]');
      if (!acknowledged.includes(activeAlert.id)) {
        acknowledged.push(activeAlert.id);
        localStorage.setItem('acknowledgedMeetings', JSON.stringify(acknowledged));
      }
    }
    stopBeep();
    setActiveAlert(null);
  };

  useEffect(() => {
    if (!currentUser) return;

    const checkMeetings = async () => {
      // If there's already an active alert, don't interrupt it
      if (activeAlert) return;

      try {
        const meetings = await asyncGet(KEYS.MEETINGS) || [];
        const acknowledged = JSON.parse(localStorage.getItem('acknowledgedMeetings') || '[]');
        
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;

        for (const meeting of meetings) {
          if (!meeting.participantIds?.includes(currentUser.id)) continue;
          if (acknowledged.includes(meeting.id)) continue;

          const meetingTime = getMeetingDateTime(meeting).getTime();
          const timeUntilMeeting = meetingTime - now;

          // If the meeting is within the next 5 minutes (and not already started)
          if (timeUntilMeeting > 0 && timeUntilMeeting <= FIVE_MINUTES) {
            setActiveAlert(meeting);
            startBeep();
            
            if ('Notification' in window && Notification.permission === 'granted') {
              const notification = new Notification('Meeting Starting Soon', {
                body: `${meeting.title} at ${formatDateTime(getMeetingDateTime(meeting).toISOString())}`,
              });
              notification.onclick = () => {
                window.focus();
                notification.close();
              };
            }

            break; // Only alert for one meeting at a time
          }
        }
      } catch (error) {
        console.error("Failed to check meetings for alerts", error);
      }
    };

    // Initial check
    checkMeetings();

    // Check every 10 seconds
    const interval = setInterval(checkMeetings, 10000);
    return () => {
      clearInterval(interval);
      stopBeep();
    };
  }, [currentUser, activeAlert, startBeep, stopBeep]);

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

        <button
          onClick={acknowledgeAlert}
          className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary-500/20"
        >
          Acknowledge & Mute
        </button>
      </div>
    </div>
  );
}
