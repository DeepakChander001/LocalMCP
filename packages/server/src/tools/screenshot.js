export const screenshotTools = [
    {
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        const result = await browserController.executeCommand('screenshot', {});
        return { 
          content: [{ 
            type: 'image',
            data: result.screenshot,
            mimeType: 'image/png'
          }] 
        };
      },
    },
  ];