import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'default-token';

app.use(cors());
app.use(express.json());

// Store connected browser client
let browserWs = null;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '1.0.0',
    browserConnected: browserWs !== null && browserWs.readyState === WebSocket.OPEN
  });
});

// SSE endpoint for MCP
app.get('/sse', (req, res) => {
  console.log('MCP client connected via SSE');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send initial connection message
  res.write('data: {"type":"connection","status":"connected"}\n\n');

  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    console.log('MCP client disconnected');
    clearInterval(keepAlive);
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`
MCP Browser Control Server
- Health check: http://localhost:${PORT}/health
- WebSocket (for extension): ws://localhost:${PORT}
- MCP SSE (for Cursor/Claude): http://localhost:${PORT}/sse
- Auth Token: ${AUTH_TOKEN}
  `);
});

// WebSocket server for browser extension
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New browser client connected');
  let isAuthenticated = false;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'auth') {
        if (data.token === AUTH_TOKEN) {
          isAuthenticated = true;
          browserWs = ws;
          ws.send(JSON.stringify({ type: 'auth_success' }));
          console.log('Browser client authenticated');
        } else {
          ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid token' }));
          ws.close();
        }
      } else if (data.type === 'command' && isAuthenticated) {
        console.log('Command received:', data.command, data.params);
        // Commands are handled by the browser extension
        ws.send(JSON.stringify({ 
          type: 'command_received', 
          requestId: data.requestId 
        }));
      } else if (data.type === 'response') {
        console.log('Response from browser:', data);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Browser client disconnected');
    if (browserWs === ws) {
      browserWs = null;
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});