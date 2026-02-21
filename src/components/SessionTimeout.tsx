import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import axios from 'axios';

interface SessionTimeoutProps {
  timeout?: number; // Timeout in milliseconds (default: 15 minutes)
  warningTime?: number; // Warning time before timeout in milliseconds (default: 2 minutes)
  onTimeout?: () => void;
  onExtend?: () => void;
}

export function SessionTimeout({
  timeout = 15 * 60 * 1000, // 15 minutes
  warningTime = 2 * 60 * 1000, // 2 minutes
  onTimeout,
  onExtend,
}: SessionTimeoutProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const warningTimeoutRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const clearAllTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const handleLogout = () => {
    clearAllTimers();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setShowWarning(false);
    if (onTimeout) {
      onTimeout();
    } else {
      navigate('/login');
    }
  };

  const startCountdown = () => {
    setRemainingTime(warningTime);
    countdownRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1000) {
          handleLogout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  const resetTimers = () => {
    clearAllTimers();
    setShowWarning(false);

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      startCountdown();
    }, timeout - warningTime);

    // Set final timeout
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  };

  const handleExtendSession = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const data = response.data || {};
        const tokensPayload = data.tokens || data.data?.tokens;
        const accessToken =
          tokensPayload?.accessToken ?? data.accessToken ?? data.access_token;
        const updatedRefreshToken =
          tokensPayload?.refreshToken ?? data.refreshToken ?? data.refresh_token;

        if (accessToken) {
          localStorage.setItem('token', accessToken);
        }
        if (updatedRefreshToken) {
          localStorage.setItem('refreshToken', updatedRefreshToken);
        }
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
    }

    resetTimers();
    if (onExtend) {
      onExtend();
    }
  };

  // Reset timers on user activity
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const resetOnActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, resetOnActivity);
    });

    // Initial timer setup
    resetTimers();

    return () => {
      clearAllTimers();
      events.forEach((event) => {
        document.removeEventListener(event, resetOnActivity);
      });
    };
  }, [showWarning]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      show={showWarning}
      onClose={() => setShowWarning(false)}
      sm
      disableDefaultClose
      showCloseButton={false}
    >
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <h2 className="text-center text-lg font-semibold text-gray-900">Session Expiring Soon</h2>
          <p className="text-center text-sm text-gray-600">
            Your session is about to expire due to inactivity.
          </p>
        </div>
        <div className="py-2 text-center">
          <div className="mb-2 text-4xl font-bold text-gray-900">
            {formatTime(remainingTime)}
          </div>
          <p className="text-sm text-gray-600">
            You will be logged out automatically
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Logout Now
          </Button>
          <Button className="w-full" onClick={handleExtendSession}>
            Continue Session
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SessionTimeout;
