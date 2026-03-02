import { useState, useEffect } from "react";

export type TimerStatus = "active" | "warning" | "expired";

interface UseTimerReturn {
  elapsed: number;
  remaining: number;
  status: TimerStatus;
  formattedTime: string;
  formattedRemaining: string;
}

export function useTimer(
  startTime: string,
  durationMinutes: number,
  onExpire?: () => void,
  isPaused: boolean = false,
): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<TimerStatus>("active");
  const [hasExpired, setHasExpired] = useState(false);
  const [pausedElapsed, setPausedElapsed] = useState(0);

  useEffect(() => {
    if (isPaused) {
      setPausedElapsed(elapsed);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTime);
      const elapsedMs = now.getTime() - start.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      setElapsed(elapsedSeconds);

      const durationSeconds = durationMinutes * 60;
      const remainingSeconds = durationSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        if (!hasExpired) {
          setHasExpired(true);
          onExpire?.();
        }
        setStatus("expired");
      } else if (remainingSeconds <= 600) {
        // 10 minutos = 600 segundos
        setStatus("warning");
      } else {
        setStatus("active");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, hasExpired, onExpire, isPaused]);

  const durationSeconds = durationMinutes * 60;
  const remaining = Math.max(0, durationSeconds - elapsed);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const remainingMinutes = Math.floor(remaining / 60);
  const remainingSeconds = remaining % 60;

  const formatTime = (value: number) => String(value).padStart(2, "0");

  const formattedTime = `${formatTime(minutes)}:${formatTime(seconds)}`;
  const formattedRemaining = `${formatTime(remainingMinutes)}:${formatTime(remainingSeconds)}`;

  return {
    elapsed,
    remaining,
    status,
    formattedTime,
    formattedRemaining,
  };
}
