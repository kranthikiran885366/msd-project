const { parentPort, workerData } = require('worker_threads');
const vm = require('vm');

async function runHandler() {
  const { code, request } = workerData;

  try {
    // Create a secure context
    const context = vm.createContext({
      Response: Response,
      Request: Request,
      fetch: fetch,
      console: console,
      URL: URL,
      Headers: Headers,
      crypto: crypto,
    });

    // Add the handler code to the context
    vm.runInContext(code, context);

    // Get the handler function
    const handler = context.default || context.handler;
    if (typeof handler !== 'function') {
      throw new Error('No handler function found');
    }

    // Create a request object from the test request
    const testRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    // Run the handler
    const startTime = performance.now();
    const response = await handler(testRequest);
    const endTime = performance.now();

    // Send back the result
    parentPort.postMessage({
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text(),
      timing: {
        total: Math.round(endTime - startTime),
        coldStart: 0, // This would be measured in a real edge environment
      },
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
  } catch (error) {
    parentPort.postMessage({
      error: error.message,
      stack: error.stack,
    });
  }
}

runHandler().catch((error) => {
  parentPort.postMessage({
    error: error.message,
    stack: error.stack,
  });
});