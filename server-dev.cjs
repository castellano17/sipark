// Servidor Express standalone para desarrollo web (sin Electron)
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mock de datos para desarrollo sin PostgreSQL
const mockData = {
  clients: [],
  products: [],
  sales: [],
  sessions: [],
  settings: {}
};

// Endpoint RPC universal
app.post('/api/rpc/:method', async (req, res) => {
  const method = req.params.method;
  const args = req.body.args || [];
  
  console.log(`[RPC] ${method}`, args);
  
  // Respuestas mock básicas
  try {
    let result;
    
    switch(method) {
      case 'getClients':
        result = mockData.clients;
        break;
      case 'getProductsServices':
        result = mockData.products;
        break;
      case 'getSales':
        result = mockData.sales;
        break;
      case 'getActiveSessions':
        result = mockData.sessions;
        break;
      case 'getDailyStats':
        result = {
          totalSales: 0,
          totalRevenue: 0,
          activeSessions: 0,
          newClients: 0
        };
        break;
      case 'getSetting':
        result = mockData.settings[args[0]] || null;
        break;
      case 'getAllSettings':
        result = mockData.settings;
        break;
      case 'checkDatabaseConnection':
        result = { connected: false, message: 'Modo desarrollo sin BD' };
        break;
      default:
        result = { message: `Mock: ${method} no implementado` };
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`[RPC Error] ${method}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 9595;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de desarrollo en http://localhost:${PORT}`);
  console.log(`⚠️  Modo MOCK - Sin PostgreSQL`);
});
