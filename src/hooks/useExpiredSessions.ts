import { useState, useEffect, useRef } from "react";

interface ExpiredSession {
  id: number;
  client_name: string;
  package_name: string;
  extra_minutes: number;
}

export function useExpiredSessions() {
  const [expiredSessions, setExpiredSessions] = useState<ExpiredSession[]>([]);
  const [expiredCount, setExpiredCount] = useState(0);
  const previousCountRef = useRef(0);
  const notifiedSessionsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    checkExpiredSessions();
    const interval = setInterval(checkExpiredSessions, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkExpiredSessions = async () => {
    try {
      const sessions = await (window as any).api.getActiveSessions();
      const now = new Date();
      
      const expired: ExpiredSession[] = [];

      for (const session of sessions) {
        if (session.status !== "active" || !session.start_time) continue;

        const start = new Date(session.start_time);
        const durationMs = (session.duration_minutes || 60) * 60000;
        const endTime = new Date(start.getTime() + durationMs);

        if (now > endTime) {
          const extraMinutes = Math.ceil((now.getTime() - endTime.getTime()) / 60000);
          expired.push({
            id: session.id,
            client_name: session.client_name || "Cliente General",
            package_name: session.package_name || "Entrada",
            extra_minutes: extraMinutes,
          });
        }
      }

      setExpiredSessions(expired);
      setExpiredCount(expired.length);

      // Notificar si hay nuevas sesiones vencidas
      if (expired.length > previousCountRef.current) {
        const newExpired = expired.filter(s => !notifiedSessionsRef.current.has(s.id));
        
        for (const session of newExpired) {
          notifiedSessionsRef.current.add(session.id);
          
          // Notificación del sistema
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("⏰ Tiempo Vencido", {
              body: `${session.client_name} - ${session.extra_minutes} min extra`,
              icon: "/icon.png",
              tag: `expired-${session.id}`,
            });
          }

          // Sonido de alerta
          playAlertSound();
        }
      }

      previousCountRef.current = expired.length;

      // Limpiar sesiones notificadas que ya no están vencidas
      const expiredIds = new Set(expired.map(s => s.id));
      notifiedSessionsRef.current.forEach(id => {
        if (!expiredIds.has(id)) {
          notifiedSessionsRef.current.delete(id);
        }
      });
    } catch (error) {
      console.error("Error checking expired sessions:", error);
    }
  };

  const playAlertSound = () => {
    try {
      const audio = new Audio("/alert.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback: usar beep del sistema
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gainNode.gain.value = 0.3;
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.2);
      });
    } catch (error) {
      console.error("Error playing alert sound:", error);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return {
    expiredSessions,
    expiredCount,
    requestNotificationPermission,
  };
}
