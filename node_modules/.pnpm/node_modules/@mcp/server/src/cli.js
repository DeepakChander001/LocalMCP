#!/usr/bin/env node
import { WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
  console.log('Usage: pnpm --filter @localmcp/server exec -- <command> [args...]');
  console.log('Commands:');
  console.log('  click <selector>     - Click on an element');
  console.log('  type <selector> <text> - Type text into an input');
  console.log('  navigate <url>       - Navigate to a URL');
  console.log('  screenshot           - Take a screenshot');
  console.log('  extract <selector>   - Extract data from elements');
  process.exit(1);
}

const ws = new WebSocket('ws://localhost:3000');
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'default-token';

ws.on('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    token: AUTH_TOKEN
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  if (message.type === 'auth_success') {
    // Send command
    const params = {};
    
    switch (command) {
      case 'click':
        params.selector = args[0];
        break;
      case 'type':
        params.selector = args[0];
        params.text = args.slice(1).join(' ');
        break;
      case 'navigate':
        params.url = args[0];
        break;
      case 'extract':
        params.selector = args[0];
        break;
    }
    
    ws.send(JSON.stringify({
      type: 'command',
      command,
      params,
      requestId: 'cli-' + Date.now()
    }));
  } else if (message.type === 'response') {
    if (message.success) {
      console.log('Success:', message.result);
    } else {
      console.error('Error:', message.error);
    }
    ws.close();
    process.exit(message.success ? 0 : 1);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  process.exit(1);
});