import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

export class MCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'localmcp-browser',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
  }

  setupTools() {
    // Register browser navigation tool
    this.server.setRequestHandler({
      method: 'tools/call',
      handler: async (request) => {
        const { name, arguments: args } = request.params;
        
        // Handle different tools based on name
        switch (name) {
          case 'browser_navigate':
            return this.handleNavigate(args);
          case 'browser_click':
            return this.handleClick(args);
          case 'browser_type':
            return this.handleType(args);
          case 'browser_screenshot':
            return this.handleScreenshot(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      }
    });

    // List available tools
    this.server.setRequestHandler({
      method: 'tools/list',
      handler: async () => {
        return {
          tools: [
            {
              name: 'browser_navigate',
              description: 'Navigate to a URL',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'The URL to navigate to' }
                },
                required: ['url']
              }
            },
            {
              name: 'browser_click',
              description: 'Click on an element',
              inputSchema: {
                type: 'object',
                properties: {
                  selector: { type: 'string', description: 'CSS selector for the element' }
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
                  selector: { type: 'string', description: 'CSS selector for the input' },
                  text: { type: 'string', description: 'Text to type' }
                },
                required: ['selector', 'text']
              }
            },
            {
              name: 'browser_screenshot',
              description: 'Take a screenshot',
              inputSchema: {
                type: 'object',
                properties: {}
              }
            }
          ]
        };
      }
    });
  }

  async handleNavigate(args) {
    const { url } = args;
    if (!this.server.browserController) {
      throw new Error('Browser controller not initialized');
    }
    
    await this.server.browserController.executeCommand('navigate', { url });
    return {
      content: [{ type: 'text', text: `Navigated to ${url}` }]
    };
  }

  async handleClick(args) {
    const { selector } = args;
    if (!this.server.browserController) {
      throw new Error('Browser controller not initialized');
    }
    
    await this.server.browserController.executeCommand('click', { selector });
    return {
      content: [{ type: 'text', text: `Clicked on ${selector}` }]
    };
  }

  async handleType(args) {
    const { selector, text } = args;
    if (!this.server.browserController) {
      throw new Error('Browser controller not initialized');
    }
    
    await this.server.browserController.executeCommand('type', { selector, text });
    return {
      content: [{ type: 'text', text: `Typed "${text}" into ${selector}` }]
    };
  }

  async handleScreenshot(args) {
    if (!this.server.browserController) {
      throw new Error('Browser controller not initialized');
    }
    
    const result = await this.server.browserController.executeCommand('screenshot', {});
    return {
      content: [{ 
        type: 'image',
        data: result.screenshot,
        mimeType: 'image/png'
      }]
    };
  }

  async handleSSEConnection(req, res, browserController) {
    const transport = new SSEServerTransport('/messages', res);
    
    // Pass browser controller to server context
    this.server.browserController = browserController;
    
    await this.server.connect(transport);
    
    console.log('MCP SSE client connected');
  }

  async handleStdioConnection() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}