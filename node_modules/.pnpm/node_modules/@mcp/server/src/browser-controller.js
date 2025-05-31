import { v4 as uuidv4 } from 'uuid';
import { logger } from './utils/logger.js';

export class BrowserController {
  constructor() {
    this.clients = new Map();
    this.pendingRequests = new Map();
  }

  addClient(ws) {
    const clientId = uuidv4();
    this.clients.set(clientId, ws);
    ws.clientId = clientId;
    logger.info(`Browser client added: ${clientId}`);
  }

  removeClient(ws) {
    if (ws.clientId) {
      this.clients.delete(ws.clientId);
      logger.info(`Browser client removed: ${ws.clientId}`);
    }
  }

  async executeCommand(command, params) {
    // Get first available client
    const client = this.clients.values().next().value;
    
    if (!client || client.readyState !== 1) {
      throw new Error('No connected browser client available');
    }

    const requestId = uuidv4();
    
    return new Promise((resolve, reject) => {
      // Set timeout for request
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Command timeout'));
      }, 30000);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
      });

      // Send command to browser
      client.send(JSON.stringify({
        type: 'command',
        requestId,
        command,
        params,
      }));
    });
  }

  handleResponse(data) {
    const { requestId, success, result, error } = data;
    const pending = this.pendingRequests.get(requestId);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);

      if (success) {
        pending.resolve(result);
      } else {
        pending.reject(new Error(error || 'Command failed'));
      }
    }
  }
}