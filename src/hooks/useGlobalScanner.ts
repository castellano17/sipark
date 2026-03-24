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
        const durationStr = await api.getSetting('nfc_alert_duration').catch(() => "5");
        const duration = parseInt(durationStr || "5") * 1000;

        api.broadcastToCustomer({
          action: "SHOW_NFC_ALERT",
          type: "success",
          title: customMsg || "¡Bienvenido a SIPARK!",
          clientName: result.clientName || 'Cliente',
          chargedAmount: result.chargedAmount,
          newBalance: result.newBalance,
          duration: duration
        });
        
        success(`NFC: ${result.clientName}. Nuevo saldo: C$ ${result.newBalance.toFixed(2)}`);
        window.dispatchEvent(new CustomEvent('memberships-updated'));

      } catch (err: any) {
        const cleanMessage = err.message.replace(/Error invoking remote method '.*': /i, "");
        
        if (cleanMessage.includes("Saldo insuficiente")) {
          const durationStr = await api.getSetting('nfc_alert_duration').catch(() => "5");
          const duration = parseInt(durationStr || "5") * 1000;
          
          api.broadcastToCustomer({
            action: "SHOW_NFC_ALERT",
            type: "info",
            title: "¡Aviso!",
            message: "Saldo insuficiente en la membresía.",
            duration: duration
          });
          
          error(cleanMessage); // Alerta local (POS)
        } else {
          error("Error NFC: " + cleanMessage);
        }
      } finally {
        setTimeout(() => { activeProcessingRef.current = false; }, 2000);
      }
    };

    const handleScan = (scannedUid: string) => {
      const customEvent = new CustomEvent('nfc-scanned', { 
        detail: { uid: scannedUid },
        cancelable: true 
      });
      const handled = !window.dispatchEvent(customEvent);

      if (!handled && !activeProcessingRef.current) {
        processScan(scannedUid);
      }
    };

    const cleanup = api.onNfcData((scannedUid: string) => {
      console.log(`\n\n>>> HARDWARE HID SCANNER DETECTED: "${scannedUid}" <<<\n\n`);
      handleScan(scannedUid);
    });

    const handleSimulate = (e: any) => {
      console.log(`\n\n>>> SIMULATED SCANNER DETECTED: "${e.detail.uid}" <<<\n\n`);
      handleScan(e.detail.uid);
    };

    window.addEventListener('simulate-nfc-scan', handleSimulate as EventListener);

    return () => {
      cleanup(); // Limpiar el listener IPC
      window.removeEventListener('simulate-nfc-scan', handleSimulate as EventListener);
    };
  }, [currentPath]);
}
