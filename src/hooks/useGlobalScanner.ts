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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt') return;

      const currentTime = window.performance.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Si el tiempo entre teclas es humano (lento), limpiamos el buffer
      if (timeDiff > 60) {
        keysRef.current = [];
      } else {
        // PERO si es rápido (lector), bloqueamos que la tecla llegue al campo de texto enfocado
        // Así evitamos que el código se "pegue" en nombres de clientes, búsquedas, etc.
        if (e.key.length === 1 || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
        }
      }

      if (e.key === "Enter") {
        const scannedUid = keysRef.current.join("");
        keysRef.current = [];

        if (scannedUid.length >= 6) {
          console.log(`[NFC GLOBAL] Disparando: ${scannedUid}`);
          
          // Lanzamos el evento DOM por si alguna pantalla específica quiere interceptarlo
          const customEvent = new CustomEvent('nfc-scanned', { 
            detail: { uid: scannedUid },
            cancelable: true 
          });
          const handled = !window.dispatchEvent(customEvent);

          if (!handled && !activeProcessingRef.current) {
            // Procesamos el cobro de forma asíncrona pero sin bloquear el hilo de ejecución
            processScan(scannedUid);
          }
        }
      } else if (e.key.length === 1) {
        keysRef.current.push(e.key);
      }
    };

    // Función interna para procesamiento pesado (fuera del hilo de las teclas)
    const processScan = async (uid: string) => {
      activeProcessingRef.current = true;
      try {
        const result = await (window as any).api.chargeNfcEntry({
          uid,
          amount: null, // Dejamos que el backend use el precio por defecto de settings
          userId: null
        });

        const customMsg = await (window as any).api.getSetting('nfc_custom_message').catch(() => "");

        (window as any).api.broadcastToCustomer({
          action: "SHOW_NFC_ALERT",
          type: "success",
          title: `¡Entrada Autorizada!`,
          message: `${result.clientName || 'Cliente'}`,
          subMessage: `Saldo Restante: C$ ${result.newBalance.toFixed(2)}`,
          customMessage: customMsg || "¡Bienvenido a SIPARK!"
        });
        
        success(`Lectura NFC: ${result.clientName}. Nuevo saldo: C$ ${result.newBalance.toFixed(2)}`);
        window.dispatchEvent(new CustomEvent('memberships-updated'));

      } catch (err: any) {
        const cleanMessage = err.message.replace(/Error invoking remote method '.*': /i, "");
        error("NFC: " + cleanMessage);
      } finally {
        setTimeout(() => { activeProcessingRef.current = false; }, 2000);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true }); // capture true para ser los primeros en oir
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [currentPath]);
}
