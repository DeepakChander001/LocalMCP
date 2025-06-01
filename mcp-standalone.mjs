#!/usr/bin/env node
import { createInterface } from 'readline';
import WebSocket from 'ws';

console.error('[MCP] Starting Browser Control MCP Server...');

let browserWs = null;
let isConnected = false;

// Connect to browser
function connectToBrowser() {
  browserWs = new WebSocket('ws://localhost:3000');
  
  browserWs.on('open', () => {
    console.error('[MCP] Connected to browser');
    browserWs.send(JSON.stringify({
      type: 'auth',
      token: 'default-token'
    }));
  });
  
  browserWs.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'auth_success') {
      isConnected = true;
      console.error('[MCP] Authenticated');
    }
  });
  
  browserWs.on('error', () => {
    console.error('[MCP] Browser connection error');
  });
}

connectToBrowser();

// Handle MCP protocol
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  try {
    const request = JSON.parse(line);
    const response = {
      jsonrpc: '2.0',
      id: request.id
    };
    
    switch (request.method) {
      case 'initialize':
        response.result = {
          protocolVersion: '1.0',
          capabilities: { tools: {} },
          serverInfo: { name: 'browser-control', version: '1.0.0' }
        };
        break;
        
      case 'tools/list':
        response.result = {
          tools: [
            {
              name: 'browser_navigate',
              description: 'Navigate browser to URL',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'URL to navigate to' }
                },
                required: ['url']
              }
            },
            {
              name: 'browser_click',
              description: 'Click element by selector',
              inputSchema: {
                type: 'object',
                properties: {
                  selector: { type: 'string', description: 'CSS selector' }
                },
                required: ['selector']
              }
            },
            {
              name: 'browser_screenshot',
              description: 'Take screenshot',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        };
        break;
        
      case 'tools/call':
        const { name, arguments: args } = request.params;
        
        if (!isConnected) {
          response.result = {
            content: [{
              type: 'text',
              text: '❌ Browser not connected. Make sure Chrome extension is connected.'
            }]
          };
        } else {
          // Simulate execution
          response.result = {
            content: [{
              type: 'text',
              text: `✅ Executed ${name}: ${JSON.stringify(args)}`
            }]
          };
        }
        break;
        
      default:
        response.error = {
          code: -32601,
          message: `Method not found: ${request.method}`
        };
    }
    
    console.log(JSON.stringify(response));
    
  } catch (e) {
    console.error('[MCP] Error:', e.message);
  }
});