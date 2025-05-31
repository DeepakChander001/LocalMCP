export const navigationTools = [
    {
      name: 'browser_navigate',
      description: 'Navigate to a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to navigate to',
          },
        },
        required: ['url'],
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        const result = await browserController.executeCommand('navigate', params);
        return { content: [{ type: 'text', text: `Navigated to ${params.url}` }] };
      },
    },
    {
      name: 'browser_back',
      description: 'Go back to the previous page',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        await browserController.executeCommand('goBack', {});
        return { content: [{ type: 'text', text: 'Navigated back' }] };
      },
    },
    {
      name: 'browser_forward',
      description: 'Go forward to the next page',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        await browserController.executeCommand('goForward', {});
        return { content: [{ type: 'text', text: 'Navigated forward' }] };
      },
    },
    {
      name: 'browser_refresh',
      description: 'Refresh the current page',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        await browserController.executeCommand('refresh', {});
        return { content: [{ type: 'text', text: 'Page refreshed' }] };
      },
    },
  ];