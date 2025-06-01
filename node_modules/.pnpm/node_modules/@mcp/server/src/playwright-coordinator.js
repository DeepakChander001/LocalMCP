import { WebSocketServer } from 'ws';
import express from 'express';

const app = express();
app.use(express.json());

// Keep track of connected extensions
const connectedExtensions = new Set();

// WebSocket server for extensions (same port as before)
const wss = new WebSocketServer({ port: 3000 });

wss.on('connection', (ws, req) => {
  console.log('Extension connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'auth' && data.token === 'default-token') {
        connectedExtensions.add(ws);
        ws.send(JSON.stringify({ type: 'auth_success' }));
        console.log('Extension authenticated');
      }
      
      // Forward commands from extension if needed
      if (data.type === 'command') {
        console.log('Command from extension:', data);
        // Handle any extension-specific commands
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    connectedExtensions.delete(ws);
    console.log('Extension disconnected');
  });
});

// Notify all connected extensions about Playwright actions
function notifyExtensions(action, data) {
  const message = JSON.stringify({ type: 'playwright_action', action, data });
  connectedExtensions.forEach(ws => {
    if (ws.readyState === 1) { // WebSocket.OPEN = 1
      ws.send(message);
    }
  });
}

// API endpoint for coordination (optional)
app.post('/notify', (req, res) => {
  notifyExtensions(req.body.action, req.body.data);
  res.json({ success: true, notified: connectedExtensions.size });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    extensionsConnected: connectedExtensions.size,
    mode: 'playwright-compatible'
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Playwright Coordinator running on port ${PORT}`);
  console.log(`Extension WebSocket on port 3000`);
  console.log(`Use Playwright MCP in Cursor for browser automation`);
});