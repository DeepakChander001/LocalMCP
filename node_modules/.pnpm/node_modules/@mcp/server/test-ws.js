import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Connected to server');
  // Send auth with the correct token
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'default-token'  // Use the token shown in your server
  }));
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('Error:', error);
});

ws.on('close', () => {
  console.log('Connection closed');
});