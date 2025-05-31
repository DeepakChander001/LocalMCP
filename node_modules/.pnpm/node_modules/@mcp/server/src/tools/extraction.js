export const extractionTools = [
    {
      name: 'browser_extract',
      description: 'Extract data from the page',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for elements to extract',
          },
        },
        required: ['selector'],
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        const result = await browserController.executeCommand('extract', params);
        return { 
          content: [{ 
            type: 'text', 
            text: JSON.stringify(result, null, 2) 
          }] 
        };
      },
    },
    {
      name: 'browser_evaluate',
      description: 'Execute JavaScript in the page context',
      inputSchema: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: 'JavaScript code to execute',
          },
        },
        required: ['script'],
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        const result = await browserController.executeCommand('evaluate', params);
        return { 
          content: [{ 
            type: 'text', 
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
          }] 
        };
      },
    },
  ];