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
      // Ignorar teclas modificadoras o de control largas
      if (e.key.length > 1 && e.key !== 'Enter') return;

      const currentTime = window.performance.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Si ha pasado mucho tiempo (>500ms), es un humano o inicio de escaneo. Reseteamos buffer.
      if (timeDiff > 500) {
        keysRef.current = [];
      }

      if (e.key === "Enter") {
        const scannedUid = keysRef.current.join("");
        keysRef.current = []; // Limpiar para el siguiente

        if (scannedUid.length >= 4) {
          console.log(`\n\n>>> DIGITAL SCANNER DETECTED: "${scannedUid}" <<<\n\n`);
          
          const customEvent = new CustomEvent('nfc-scanned', { 
            detail: { uid: scannedUid },
            cancelable: true 
          });
          const handled = !window.dispatchEvent(customEvent);

          if (!handled && !activeProcessingRef.current) {
            const activeTagName = document.activeElement?.tagName.toUpperCase();
            if (activeTagName === 'INPUT' || activeTagName === 'TEXTAREA') {
              console.log("Input focused, ignoring global NFC charge.");
              return;
            }
            processScan(scannedUid);
          }
        }
      } else if (e.key.length === 1) {
        keysRef.current.push(e.key);
      }
    };

    const processScan = async (uid: string) => {
      activeProcessingRef.current = true;
      try {
        const result = await (window as any).api.chargeNfcEntry({
          uid,
          amount: null,
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
        
        success(`NFC: ${result.clientName}. Nuevo saldo: C$ ${result.newBalance.toFixed(2)}`);
        window.dispatchEvent(new CustomEvent('memberships-updated'));

      } catch (err: any) {
        const cleanMessage = err.message.replace(/Error invoking remote method '.*': /i, "");
        error("Error NFC: " + cleanMessage);
      } finally {
        setTimeout(() => { activeProcessingRef.current = false; }, 2000);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true }); // capture true para ser los primeros en oir
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [currentPath]);
}
