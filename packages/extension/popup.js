document.getElementById('connect').addEventListener('click', async () => {
  const serverUrl = document.getElementById('serverUrl').value;
  const token = document.getElementById('token').value;
  const statusDiv = document.getElementById('status');
  
  if (!token) {
    statusDiv.textContent = 'Please enter the auth token';
    statusDiv.className = 'error';
    return;
  }
  
  statusDiv.textContent = 'Connecting...';
  statusDiv.className = '';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'connect',
      serverUrl,
      token
    });
    
    if (response.success) {
      statusDiv.textContent = 'Connected successfully!';
      statusDiv.className = 'success';
      // Close popup after 2 seconds
      setTimeout(() => window.close(), 2000);
    }
  } catch (error) {
    statusDiv.textContent = 'Connection failed: ' + error.message;
    statusDiv.className = 'error';
  }
});

// Load saved URL on startup
chrome.storage.local.get(['serverUrl'], (result) => {
  if (result.serverUrl) {
    document.getElementById('serverUrl').value = result.serverUrl;
  }
});