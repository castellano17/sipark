import { useEffect, useRef } from "react";
import { useNotification } from "./useNotification";

export function useGlobalScanner(currentPath: string) {
  const { error, success } = useNotification();
  const keysRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(window.performance.now());
  const activeProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    // Si estamos en pantallas que piden que las dejemos manejar sus propios eventos manuales
    // podemos evitar el hook global, o simplemente disparamos el CustomEvent y que ellos lo atrapen
    // Dejaremos que dispare siempre un CustomEvent. Si alguien lo atrapa y llama event.preventDefault(),
    // significa que la pantalla actual se hizo cargo (ej. POS o Membresias).

    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignorar teclas modificadoras
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') return;

      const currentTime = window.performance.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Resetear si teclea lento (más de 60ms entre teclas es humano, < 30ms es lector)
      if (timeDiff > 60) {
        keysRef.current = [];
      }

      if (e.key === "Enter") {
        if (keysRef.current.length >= 6) { 
          const scannedUid = keysRef.current.join("");
          keysRef.current = [];

          // Prevenir que el "Enter" haga submit en formularios por accidente si fue súper rápido
          if (timeDiff < 60) {
             e.preventDefault();
             e.stopPropagation();
          }

          console.log(`[NFC GLOBAL] Escaneo Rápido Detectado: ${scannedUid} | Ruta actual: ${currentPath}`);

          if (activeProcessingRef.current) return; // Evitar dobles lecturas simultáneas puestas en el lector

          // Disparar Evento para que Pantallas Específicas (POS, Membresia) lo procesen si están enfocadas
          const customEvent = new CustomEvent('nfc-scanned', { 
            detail: { uid: scannedUid },
            cancelable: true 
          });
          const handled = !window.dispatchEvent(customEvent);

          // Si 'handled = true', significa que la pantalla actual usó event.preventDefault() 
          // en el event listener, por tanto, el "Oído Global" No debe hacer el Cobro Rápido.
          if (handled) {
            return;
          }

          // ===== FAST CHARGE POR DEFECTO (Escenario C) =====
          // Si ninguna pantalla interceptó el escaner, hacemos el Cobro Rápido
          activeProcessingRef.current = true;
          try {
            // Aquí iría la consulta real a backend para descontar (api.chargeNfcCard(uid))
            // Este es un ejemplo funcional usando el API general de tarjeta
            const cardInfo = await (window as any).api.getNfcCardByUid(scannedUid);
            if (!cardInfo) {
              (window as any).api.broadcastToCustomer({
                action: "SHOW_NFC_ALERT",
                type: "error",
                title: "Tarjeta Desconocida",
                message: "Acércate a caja para registrarla"
              });
              error("Tarjeta Desconocida o Inactiva");
              return;
            }

            // Aquí el sistema hace el cargo de 1 Hora o monto por defecto
            const settings = await (window as any).api.getAllSettings();
            const entryPriceSetting = Array.isArray(settings)
              ? settings.find((s: any) => s.key === 'nfc_entry_price')
              : null;
            const entryPrice = parseFloat(entryPriceSetting?.value || '100');
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            const result = await (window as any).api.chargeNfcEntry({
              uid: scannedUid,
              amount: entryPrice,
              userId: currentUser.id || null,
            });

            const customMsg = await (window as any).api.getSetting('nfc_custom_message');

            // Asumiendo que descontamos. ¡Mandamos éxito visual al cliente!
            (window as any).api.broadcastToCustomer({
              action: "SHOW_NFC_ALERT",
              type: "success",
              title: `¡Entrada Autorizada!`,
              message: `${result.clientName || 'Cliente'}`,
              subMessage: `Saldo Restante: C$ ${result.newBalance.toFixed(2)}`,
              customMessage: customMsg || "¡Bienvenido a SIPARK!"
            });
            success(`NFC Rápido: Entrada cobrada. Saldo restante: C$ ${result.newBalance.toFixed(2)}`);
            
            // Avisar a otras pantallas (ej: Gestión Membresías) para refrescar saldo
            window.dispatchEvent(new CustomEvent('memberships-updated'));

          } catch (err: any) {
            const cleanMessage = err.message.replace(/Error invoking remote method '.*': /i, "");
            error("Error leyendo tarjeta rápida: " + cleanMessage);
          } finally {
             // Prevenir lecturas rebotadas por 2 segundos
             setTimeout(() => { activeProcessingRef.current = false; }, 2000);
          }
        }
        keysRef.current = [];
      } else if (e.key.length === 1) { // Normal character
        // Si el tiempo entre teclas es muy corto (lector), bloqueamos que se escriba en los inputs
        if (timeDiff < 50) {
          e.preventDefault();
          e.stopPropagation();
        }
        keysRef.current.push(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true }); // capture true para ser los primeros en oir
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [currentPath]);
}
