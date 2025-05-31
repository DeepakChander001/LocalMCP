export const interactionTools = [
    {
      name: 'browser_click',
      description: 'Click on an element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the element to click',
          },
        },
        required: ['selector'],
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        const result = await browserController.executeCommand('click', params);
        if (result.error) {
          throw new Error(result.error);
        }
        return { content: [{ type: 'text', text: `Clicked on ${params.selector}` }] };
      },
    },
    {
      name: 'browser_type',
      description: 'Type text into an input field',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector for the input field',
          },
          text: {
            type: 'string',
            description: 'Text to type',
          },
        },
        required: ['selector', 'text'],
      },
      handler: 'tools/execute',
      execute: async (params, { browserController }) => {
        const result = await browserController.executeCommand('type', params);
        if (result.error) {
          throw new Error(result.error);
        }
        return { content: [{ type: 'text', text: `Typed "${params.text}" into ${params.selector}` }] };
      },
    },
  ];