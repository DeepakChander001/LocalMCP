let websocket = null;
let debuggeeId = null;
let authToken = null;

// Load saved settings
chrome.storage.local.get(['authToken', 'serverUrl'], (result) => {
  if (result.authToken && result.serverUrl) {
    authToken = result.authToken;
    connectToServer(result.serverUrl);
  }
});

function connectToServer(serverUrl) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.close();
  }

  websocket = new WebSocket(serverUrl);

  websocket.onopen = () => {
    console.log('Connected to MCP server');
    // Authenticate
    websocket.send(JSON.stringify({
      type: 'auth',
      token: authToken
    }));
  };

  websocket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);

    switch (message.type) {
      case 'command':
        await executeCommand(message);
        break;
      case 'auth_success':
        console.log('Authentication successful');
        break;
      case 'auth_failed':
        console.error('Authentication failed');
        websocket.close();
        break;
    }
  };

  websocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  websocket.onclose = () => {
    console.log('Disconnected from server');
  };
}

async function executeCommand(message) {
  const { command, params, requestId } = message;
  
  try {
    let result;
    
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    switch (command) {
      case 'navigate':
        await chrome.tabs.update(tab.id, { url: params.url });
        result = { success: true, url: params.url };
        break;
      
      case 'click':
        result = await executeInPage(tab.id, `
          const element = document.querySelector('${params.selector}');
          if (element) {
            element.click();
            return { success: true };
          }
          return { success: false, error: 'Element not found' };
        `);
        break;
      
      case 'type':
        result = await executeInPage(tab.id, `
          const element = document.querySelector('${params.selector}');
          if (element) {
            element.value = '${params.text}';
            element.dispatchEvent(new Event('input', { bubbles: true }));
            return { success: true };
          }
          return { success: false, error: 'Element not found' };
        `);
        break;
      
      case 'screenshot':
        const dataUrl = await chrome.tabs.captureVisibleTab();
        result = { success: true, screenshot: dataUrl };
        break;
      
      default:
        throw new Error(`Unknown command: ${command}`);
    }

    sendResponse(requestId, { success: true, result });
  } catch (error) {
    console.error('Command execution error:', error);
    sendResponse(requestId, { success: false, error: error.message });
  }
}

function executeInPage(tabId, code) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: new Function(code),
    world: 'MAIN'
  }).then(results => results[0].result);
}

function sendResponse(requestId, data) {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    websocket.send(JSON.stringify({
      type: 'response',
      requestId,
      ...data
    }));
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'connect') {
    authToken = request.token;
    chrome.storage.local.set({ 
      authToken: request.token, 
      serverUrl: request.serverUrl 
    });
    connectToServer(request.serverUrl);
    sendResponse({ success: true });
  }
  return true;
});