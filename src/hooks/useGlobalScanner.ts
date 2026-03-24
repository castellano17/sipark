import { useEffect, useRef } from "react";
import { useNotification } from "./useNotification";

export function useGlobalScanner(currentPath: string) {
  const { error, success } = useNotification();
  const activeProcessingRef = useRef<boolean>(false);

  useEffect(() => {
    // Escuchar directamente los datos del lector NFC a través de node-hid (Hardware)
    const api = (window as any).api;
    if (!api || !api.onNfcData) {
      console.warn("API de hardware NFC no disponible.");
      return;
    }

    const processScan = async (uid: string) => {
      activeProcessingRef.current = true;
      try {
        const result = await api.chargeNfcEntry({
          uid,
          amount: null,
          userId: null
        });

        const customMsg = await api.getSetting('nfc_custom_message').catch(() => "");

        api.broadcastToCustomer({
          action: "SHOW_NFC_ALERT",
          type: "success",
          title: customMsg || "¡Bienvenido a SIPARK!",
          clientName: result.clientName || 'Cliente',
          chargedAmount: result.chargedAmount,
          newBalance: result.newBalance
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

    const cleanup = api.onNfcData((scannedUid: string) => {
      console.log(`\n\n>>> HARDWARE HID SCANNER DETECTED: "${scannedUid}" <<<\n\n`);
      
      const customEvent = new CustomEvent('nfc-scanned', { 
        detail: { uid: scannedUid },
        cancelable: true 
      });
      // Despachamos evento al DOM. Si alguien llama preventDefault (ej. POSScreen),
      // handled será false.
      const handled = !window.dispatchEvent(customEvent);

      if (!handled && !activeProcessingRef.current) {
        // En este punto, no revisamos "activeElement" porque el lector corre 
        // a nivel de hardware, por lo que NUNCA interfiere con inputs.
        processScan(scannedUid);
      }
    });

    return () => {
      cleanup(); // Limpiar el listener IPC
    };
  }, [currentPath]);
}
