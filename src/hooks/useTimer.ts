import { useState, useEffect, useRef } from "react";

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
  isPending: boolean = false,
): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<TimerStatus>("active");
  const [hasExpired, setHasExpired] = useState(false);
  const onExpireRef = useRef(onExpire);
  const startTimeRef = useRef(startTime);

  // Actualizar la referencia sin causar re-render
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Actualizar startTimeRef solo cuando cambia de pending a active
  useEffect(() => {
    if (!isPending) {
      startTimeRef.current = startTime;
    }
  }, [isPending, startTime]);

  useEffect(() => {
    // Si está en espera, resetear todo
    if (isPending) {
      setElapsed(0);
      setStatus("active");
      setHasExpired(false);
      return;
    }

    // Si está pausada, no actualizar
    if (isPaused) {
      return;
    }

    // Resetear hasExpired cuando se inicia una nueva sesión
    setHasExpired(false);

    // Iniciar el intervalo para actualizar cada segundo
    const interval = setInterval(() => {
      const now = new Date();
      const start = new Date(startTimeRef.current);
      
      // Validar que startTime sea válido
      if (isNaN(start.getTime())) {
        console.error("❌ startTime inválido:", startTimeRef.current);
        return;
      }
      
      const elapsedMs = now.getTime() - start.getTime();
      const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

      setElapsed(elapsedSeconds);

      const durationSeconds = durationMinutes * 60;
      const remainingSeconds = durationSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        setHasExpired(prev => {
          if (!prev) {
            onExpireRef.current?.();
          }
          return true;
        });
        setStatus("expired");
      } else if (remainingSeconds <= 600) {
        setStatus("warning");
      } else {
        setStatus("active");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [durationMinutes, isPaused, isPending]);

  const durationSeconds = durationMinutes * 60;
  const remaining = isPending ? durationSeconds : Math.max(0, durationSeconds - elapsed);

  // Calcular horas, minutos y segundos para el tiempo transcurrido
  const safeElapsed = Math.max(0, elapsed);
  const hours = Math.floor(safeElapsed / 3600);
  const minutes = Math.floor((safeElapsed % 3600) / 60);
  const seconds = safeElapsed % 60;
  
  // Calcular horas, minutos y segundos para el tiempo restante
  const safeRemaining = Math.max(0, remaining);
  const remainingHours = Math.floor(safeRemaining / 3600);
  const remainingMinutes = Math.floor((safeRemaining % 3600) / 60);
  const remainingSeconds = safeRemaining % 60;

  const formatTime = (value: number) => String(Math.max(0, Math.floor(value))).padStart(2, "0");

  const formattedTime = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
  const formattedRemaining = `${formatTime(remainingHours)}:${formatTime(remainingMinutes)}:${formatTime(remainingSeconds)}`;

  return {
    elapsed,
    remaining,
    status,
    formattedTime,
    formattedRemaining,
  };
}
