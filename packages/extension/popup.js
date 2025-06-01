// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const statusDiv = document.getElementById('status');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const connectionForm = document.getElementById('connection-form');
  const infoDiv = document.getElementById('info');
  const wsUrlInput = document.getElementById('ws-url');
  const authTokenInput = document.getElementById('auth-token');

  // Check initial connection status
  checkConnectionStatus();

  // Connect button handler
  connectBtn.addEventListener('click', async () => {
    const wsUrl = wsUrlInput.value;
    const authToken = authTokenInput.value;
    
    statusDiv.textContent = 'Connecting...';
    statusDiv.className = 'status disconnected';
    
    // Send connect message to background
    chrome.runtime.sendMessage({
      action: 'connect',
      wsUrl: wsUrl,
      authToken: authToken
    }, (response) => {
      console.log('Connect response:', response);
      setTimeout(checkConnectionStatus, 500);
    });
  });

  // Disconnect button handler
  disconnectBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ action: 'disconnect' }, (response) => {
      console.log('Disconnect response:', response);
      updateUI(false);
    });
  });

  // Listen for connection updates
  chrome.runtime.onMessage.addListener((message) => {
    console.log('Popup received message:', message);
    if (message.type === 'connected') {
      updateUI(true);
    } else if (message.type === 'disconnected') {
      updateUI(false);
    }
  });

  function checkConnectionStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
      console.log('Status response:', response);
      if (response && response.isConnected) {
        updateUI(true);
      } else {
        updateUI(false);
      }
    });
  }

  function updateUI(connected) {
    if (connected) {
      statusDiv.textContent = 'Connected successfully!';
      statusDiv.className = 'status connected';
      connectionForm.style.display = 'none';
      infoDiv.style.display = 'block';
    } else {
      statusDiv.textContent = 'Not connected';
      statusDiv.className = 'status disconnected';
      connectionForm.style.display = 'block';
      infoDiv.style.display = 'none';
    }
  }
});