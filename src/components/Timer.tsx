import React, { useState, useEffect } from "react";

interface TimerProps {
  startTime: Date;
  durationMinutes: number;
  onExpire?: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  startTime,
  durationMinutes,
  onExpire,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - startTime.getTime();
      const elapsedMins = Math.floor(elapsedMs / 60000);

      setElapsed(elapsedMins);

      if (elapsedMins >= durationMinutes && !isExpired) {
        setIsExpired(true);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, isExpired, onExpire]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const remaining = Math.max(0, durationMinutes - elapsed);

  const formatTime = (value: number) => String(value).padStart(2, "0");

  return (
    <div className="text-center">
      <div
        className="text-5xl font-bold font-mono text-primary mb-2"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {formatTime(minutes)}:{formatTime(seconds)}
      </div>
      <div className="text-sm text-muted-foreground">
        {isExpired ? (
          <span className="text-rose-600 font-semibold">Tiempo expirado</span>
        ) : (
          <span>Quedan {remaining} min</span>
        )}
      </div>
    </div>
  );
};
