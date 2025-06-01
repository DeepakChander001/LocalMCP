// background.js
let ws = null;
let isConnected = false;
let reconnectInterval = null;

function connectToServer() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return; // Already connected
  }

  console.log('Attempting to connect to WebSocket server...');
  
  try {
    ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      isConnected = true;
      updateIcon(true);
      
      // Send auth immediately
      ws.send(JSON.stringify({
        type: 'auth',
        token: 'default-token'
      }));
      
      // Clear reconnect interval
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };
    
    ws.onmessage = (event) => {
      console.log('Message received:', event.data);
      const data = JSON.parse(event.data);
      
      if (data.type === 'auth_success') {
        console.log('Authentication successful');
        chrome.runtime.sendMessage({ type: 'connected' });
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      isConnected = false;
      updateIcon(false);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      isConnected = false;
      updateIcon(false);
      chrome.runtime.sendMessage({ type: 'disconnected' });
      
      // Start reconnecting
      if (!reconnectInterval) {
        reconnectInterval = setInterval(connectToServer, 5000);
      }
    };
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    isConnected = false;
    updateIcon(false);
  }
}

function updateIcon(connected) {
  const path = connected ? 'icon-connected.png' : 'icon-disconnected.png';
  chrome.action.setIcon({ path: { 
    '16': path, 
    '48': path, 
    '128': path 
  }});
}

function disconnect() {
  if (ws) {
    ws.close();
    ws = null;
  }
  isConnected = false;
  updateIcon(false);
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
    reconnectInterval = null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'connect') {
    connectToServer();
    sendResponse({ status: 'connecting' });
  } else if (request.action === 'disconnect') {
    disconnect();
    sendResponse({ status: 'disconnected' });
  } else if (request.action === 'getStatus') {
    sendResponse({ 
      isConnected: isConnected,
      wsState: ws ? ws.readyState : null
    });
  }
  
  return true; // Keep message channel open
});

// Auto-connect on extension load
connectToServer();