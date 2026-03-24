const HID = require('node-hid');
const api = require('./api.cjs');

let nfcDevice = null;
let mainWindowRef = null;
let customerWindowRef = null;
let checkInterval = null;
let buffer = [];
let lastKeyTime = 0;

// Mapeo básico de HID usage IDs (scancodes) a caracteres (layout US)
const HID_KEY_MAP = {
  4: 'A', 5: 'B', 6: 'C', 7: 'D', 8: 'E', 9: 'F', 10: 'G', 11: 'H', 12: 'I', 13: 'J', 14: 'K', 15: 'L', 16: 'M',
  17: 'N', 18: 'O', 19: 'P', 20: 'Q', 21: 'R', 22: 'S', 23: 'T', 24: 'U', 25: 'V', 26: 'W', 27: 'X', 28: 'Y', 29: 'Z',
  30: '1', 31: '2', 32: '3', 33: '4', 34: '5', 35: '6', 36: '7', 37: '8', 38: '9', 39: '0',
  40: 'ENTER'
};

function processHidData(data) {
  // Los reportes estándar de teclado por lo general tienen 8 bytes.
  // byte 0: modifier keys
  // byte 2: keyCode 1
  if (data.length >= 3) {
    const keycode = data[2];
    if (keycode === 0) return; // key release event (a veces)

    const char = HID_KEY_MAP[keycode];
    if (char) {
      if (char === 'ENTER') {
        const uid = buffer.join('');
        buffer = [];
        if (uid.length >= 4) {
          console.log(`[NFC HID] Tarjeta leída: ${uid}`);
          sendToRenderers(uid);
        }
      } else {
        const now = Date.now();
        if (now - lastKeyTime > 500) {
          buffer = []; // reset si pasó mucho tiempo
        }
        buffer.push(char);
        lastKeyTime = now;
      }
    }
  }
}

function sendToRenderers(uid) {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('nfc-data', uid);
  }
  if (customerWindowRef && !customerWindowRef.isDestroyed()) {
    customerWindowRef.webContents.send('nfc-data', uid);
  }
}

async function startListening(mainWindow, customerWindow) {
  mainWindowRef = mainWindow;
  customerWindowRef = customerWindow;

  await tryConnect();

  // Polling para reconectar si se pierde o si no estaba conectado inicialmente
  if (!checkInterval) {
    checkInterval = setInterval(async () => {
      if (!nfcDevice) {
        await tryConnect();
      }
    }, 5000);
  }
}

async function tryConnect() {
  if (nfcDevice) return;

  try {
    const devices = HID.devices();
    
    // Obtenemos la configuración de VID/PID de la BD (ej. "1234:5678")
    // Si no está configurado, podemos buscar uno que se llame "Sycreader" u otro genérico,
    // o simplemente tomamos el primer dispositivo definido como teclado (peligroso, puede agarrar el teclado principal).
    const configuredVidPid = await api.getSetting("nfc_reader_vid_pid").catch(() => null);
    
    let targetDevice = null;

    if (configuredVidPid && configuredVidPid.includes(':')) {
      const [vidStr, pidStr] = configuredVidPid.split(':');
      const vid = parseInt(vidStr, 10);
      const pid = parseInt(pidStr, 10);
      targetDevice = devices.find(d => d.vendorId === vid && d.productId === pid && d.usage === 6); // usage 6 es teclado
      if (!targetDevice) {
         targetDevice = devices.find(d => d.vendorId === vid && d.productId === pid);
      }
    } else {
      // Auto-detección genérica (basado en nombres comunes de lectores RFID)
      const nfcKeywords = ["sycreader", "rfid", "nfc", "reader", "smart", "acr122"];
      targetDevice = devices.find(d => {
         const prod = (d.product || "").toLowerCase();
         const man = (d.manufacturer || "").toLowerCase();
         return nfcKeywords.some(kw => prod.includes(kw) || man.includes(kw)) && (d.usage === 6 || d.usagePage === 1);
      });
    }

    if (targetDevice) {
      console.log(`[NFC HID] Conectando a lector: ${targetDevice.product} (VID: ${targetDevice.vendorId}, PID: ${targetDevice.productId})`);
      nfcDevice = new HID.HID(targetDevice.path);
      
      nfcDevice.on('data', processHidData);
      
      nfcDevice.on('error', (err) => {
        console.error("[NFC HID] Error en dispositivo:", err);
        closeDevice();
      });
    }
  } catch (err) {
    console.error("[NFC HID] Error intentando conectar:", err.message);
    closeDevice();
  }
}

function closeDevice() {
  if (nfcDevice) {
    try {
      nfcDevice.close();
    } catch (e) {}
    nfcDevice = null;
  }
}

// Expone una función para obtener lista de dispositivos USB HID
function getAvailableDevices() {
  try {
    const devices = HID.devices();
    return devices.map(d => ({
      vendorId: d.vendorId,
      productId: d.productId,
      product: d.product || 'Unknown Device',
      manufacturer: d.manufacturer || 'Unknown Manufacturer',
      path: d.path,
      usage: d.usage,
      usagePage: d.usagePage
    }));
  } catch(e) {
    return [];
  }
}

module.exports = {
  startListening,
  getAvailableDevices
};
