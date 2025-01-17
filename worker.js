/**
 * Handles incoming messages to the worker, executes performance tests, and sends back the results.
 * @param {MessageEvent} event - The message event containing the code, data, and duration.
 */
onmessage = async (event) => {
  const { code, data, duration } = event.data;

  let result;
  try {
    // Execute the provided code with a performance test loop
    result = await eval(`(async () => {
        let PERF__ops = 0; // Count of operations performed
        let PERF__start = Date.now(); // Start time of the test
        let PERF__end = Date.now() + ${duration}; // End time of the test
        
        // Initialize global data
        ${data};
  
        // Perform operations within the specified duration
        while (Date.now() < PERF__end) {
          ${code};
          PERF__ops++;
        }
        return PERF__ops; // Return the total operations performed
    })()`);
  } catch (error) {
    // Log errors and return a result of 0
    console.error("Error during test execution:", error);
    result = 0;
  }

  // Send the result back to the main thread
  postMessage(result);
};
