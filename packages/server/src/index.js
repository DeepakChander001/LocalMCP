import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'default-token';

// Store connected browser clients
const browserClients = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// MCP SSE endpoint
app.get('/sse', async (req, res) => {
  console.log('MCP client connected via SSE');
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Create MCP server
  const mcpServer = new Server(
    {
      name: 'mcp-browser',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools
  mcpServer.setRequestHandler({
    method: 'tools/list',
    handler: async () => {
      return {
        tools: [
          {
            name: 'browser_navigate',
            description: 'Navigate to a URL in the browser',
            inputSchema: {
              type: 'object',
              properties: {
                url: { 
                  type: 'string', 
                  description: 'The URL to navigate to' 
                }
              },
              required: ['url']
            }
          },
          {
            name: 'browser_click',
            description: 'Click on an element using CSS selector',
            inputSchema: {
              type: 'object',
              properties: {
                selector: { 
                  type: 'string', 
                  description: 'CSS selector for the element to click' 
                }
              },
              required: ['selector']
            }
          },
          {
            name: 'browser_type',
            description: 'Type text into an input field',
            inputSchema: {
              type: 'object',
              properties: {
                selector: { 
                  type: 'string', 
                  description: 'CSS selector for the input field' 
                },
                text: { 
                  type: 'string', 
                  description: 'Text to type' 
                }
              },
              required: ['selector', 'text']
            }
          },
          {
            name: 'browser_screenshot',
            description: 'Take a screenshot of the current page',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    }
  });

  // Handle tool execution
  mcpServer.setRequestHandler({
    method: 'tools/call',
    handler: async (request) => {
      const { name, arguments: args } = request.params;
      
      // Get first connected browser client
      const browserClient = Array.from(browserClients.values())[0];
      
      if (!browserClient) {
        throw new Error('No browser client connected. Please connect the Chrome extension first.');
      }

      // Send command to browser
      return new Promise((resolve, reject) => {
        const requestId = Date.now().toString();
        
        // Store callback for this request
        browserClient.pendingRequests = browserClient.pendingRequests || new Map();
        browserClient.pendingRequests.set(requestId, { resolve, reject });
        
        // Send command to browser
        browserClient.send(JSON.stringify({
          type: 'command',
          requestId,
          command: name.replace('browser_', ''),
          params: args
        }));
        
        // Timeout after 30 seconds
        setTimeout(() => {
          if (browserClient.pendingRequests.has(requestId)) {
            browserClient.pendingRequests.delete(requestId);
            reject(new Error('Command timeout'));
          }
        }, 30000);
      });
    }
  });

  // Connect SSE transport
  const transport = new SSEServerTransport('/sse', res);
  await mcpServer.connect(transport);
  
  // Clean up on disconnect
  req.on('close', () => {
    console.log('MCP client disconnected');
  });
});

// WebSocket connection handling for browser extension
wss.on('connection', (ws) => {
  console.log('New browser client connected');
  const clientId = Date.now().toString();
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'auth') {
        if (data.token === AUTH_TOKEN) {
          browserClients.set(clientId, ws);
          ws.send(JSON.stringify({ type: 'auth_success' }));
          console.log('Browser client authenticated');
        } else {
          ws.send(JSON.stringify({ type: 'auth_failed' }));
          ws.close();
        }
        return;
      }

      // Handle responses from browser
      if (data.type === 'response' && data.requestId) {
        const pending = ws.pendingRequests?.get(data.requestId);
        if (pending) {
          ws.pendingRequests.delete(data.requestId);
          if (data.success) {
            pending.resolve({
              content: [{ 
                type: 'text', 
                text: JSON.stringify(data.result) 
              }]
            });
          } else {
            pending.reject(new Error(data.error || 'Command failed'));
          }
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Browser client disconnected');
    browserClients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`MCP Browser Control Server`);
  console.log(`- Health check: http://localhost:${PORT}/health`);
  console.log(`- WebSocket (for extension): ws://localhost:${PORT}`);
  console.log(`- MCP SSE (for Cursor/Claude): http://localhost:${PORT}/sse`);
  console.log(`- Auth Token: ${AUTH_TOKEN}`);
});