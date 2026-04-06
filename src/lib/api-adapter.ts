// API Adapter: Funciona tanto en Electron como en navegador web
// En Electron usa IPC, en navegador usa fetch al servidor Express

const isElectron = () => {
  return typeof window !== 'undefined' && window.api !== undefined;
};

const API_BASE_URL = 'http://localhost:9595/api/rpc';

// Wrapper genérico que decide si usar IPC o fetch
async function callApi(method: string, ...args: any[]) {
  if (isElectron()) {
    // Modo Electron: usar IPC directo
    return (window.api as any)[method](...args);
  } else {
    // Modo Web: usar fetch al servidor Express
    try {
      const response = await fetch(`${API_BASE_URL}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ args })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      return result.data;
    } catch (error: any) {
      console.error(`Error en API ${method}:`, error);
      throw error;
    }
  }
}

// Exportar proxy que intercepta todas las llamadas
export const api = new Proxy({} as any, {
  get: (_target, method: string) => {
    return (...args: any[]) => callApi(method, ...args);
  }
});

// Para compatibilidad con código existente que usa window.api
if (typeof window !== 'undefined' && !window.api) {
  (window as any).api = api;
}
