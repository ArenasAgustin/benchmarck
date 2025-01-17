// DOM Element Selectorss
const $globalCode = document.querySelector("#global");
const $sendButton = document.querySelector(".send-button");
const $addButton = document.querySelector(".add-button");
const $deleteButtons = document.querySelectorAll(".delete-button");
const $copyButtons = document.querySelectorAll(".copy-button");
let $bars = document.querySelectorAll(".bar");
let $percentages = document.querySelectorAll(".percentage");

// Constants
const COLORS = ["green", "yellow", "orange", "red", "purple"];

/**
 * Runs a test case using a Web Worker and returns the result.
 * @param {Object} params - Parameters for the test.
 * @param {string} params.code - Code to be tested.
 * @param {string} params.data - Global data to be used during the test.
 * @returns {Promise<number>} - The test result in operations per second.
 */
async function runTest({ code, data }) {
  const worker = new Worker("worker.js");
  worker.postMessage({ code, data, duration: 1000 });

  // Custom promise resolver to handle asynchronous worker messages
  const { resolve, promise } = Promise.withResolvers();
  worker.onmessage = (event) => resolve(event.data);

  return promise;
}

/**
 * Executes all test cases, updates the chart, and displays the results.
 */
async function runTestCases() {
  const $testCases = document.querySelectorAll(".test-case");
  console.log($bars, $percentages);
  // Reset bars and percentages
  $bars.forEach((bar) => bar.setAttribute("height", 0));
  $percentages.forEach((percentage) => (percentage.textContent = ""));

  const globalCode = $globalCode.value;

  // Process each test case asynchronously
  const promises = Array.from($testCases).map(async (testCase) => {
    const $code = testCase.querySelector(".code");
    const $ops = testCase.querySelector(".ops");

    const codeValue = $code.value;
    $ops.textContent = "Loading...";

    const result = await runTest({ code: codeValue, data: globalCode });

    $ops.textContent = `${result.toLocaleString()} ops/s`;

    return result;
  });

  // Wait for all test results
  const results = await Promise.all(promises);

  // Calculate the maximum operations per second (ops)
  const maxOps = Math.max(...results);

  // Sort results for coloring bars
  const sortedResults = results
    .map((result, index) => ({ result, index }))
    .sort((a, b) => b.result - a.result);

  // Update chart with results
  results.forEach((result, index) => {
    const bar = $bars[index];
    const percentage = $percentages[index];

    const indexColor = sortedResults.findIndex((x) => x.index === index);
    const color = COLORS[indexColor];

    const height = (result / maxOps) * 300; // 300 is the height of the chart
    bar.setAttribute("height", height);
    bar.setAttribute("fill", color);

    const percentageValue = Math.round((result / maxOps) * 100);
    percentage.textContent = `${percentageValue}%`;
  });
}

/**
 * Creates and appends a new test case with unique identifiers and resets its values.
 */
function addTestCase() {
  // Get the list of existing test cases and clone the last one
  const testCases = document.querySelectorAll(".test-case");
  const lastTestCase = testCases[testCases.length - 1];

  const newId = testCases.length + 1; // Generate a new unique ID
  const newTestCase = lastTestCase.cloneNode(true);

  // Assign a new ID and update the display
  newTestCase.dataset.id = newId;
  newTestCase.querySelector(".test-id").textContent = newId;

  // Reset the code input and operations text
  newTestCase.querySelector(".code").value = "";
  newTestCase.querySelector(".ops").textContent = "0 ops/s";

  // Append the new test case to the DOM
  lastTestCase.after(newTestCase);

  // Attach the deleteTestCase function to the new delete button
  const deleteButton = newTestCase.querySelector(".delete-button");
  deleteButton.addEventListener("click", deleteTestCase);

  // Clone and reset the corresponding chart elements
  const chartBars = document.querySelectorAll(".bar");
  const chartPercentages = document.querySelectorAll(".percentage");

  const lastBar = chartBars[chartBars.length - 1];
  const lastPercentage = chartPercentages[chartPercentages.length - 1];

  const newBar = lastBar.cloneNode(true);
  const newPercentage = lastPercentage.cloneNode(true);

  // Update the new bar and percentage with unique data attributes and reset values
  newBar.setAttribute("data-id", newId);
  newBar.setAttribute("height", 0);

  newPercentage.setAttribute("data-id", newId);
  newPercentage.textContent = "0%";

  // Append the new chart elements to the DOM
  lastBar.after(newBar);
  lastPercentage.after(newPercentage);

  // TASK: Make a function to update the global variables with the new chart elements
  // Update the global variables with the new chart elements
  $bars = document.querySelectorAll(".bar");
  $percentages = document.querySelectorAll(".percentage");
}

/**
 * Deletes a test case and its corresponding chart bar and percentage display.
 * @param {Event} event - The click event triggered by the delete button.
 */
function deleteTestCase(event) {
  // Find the closest test-case element and remove it
  const testCase = event.target.closest(".test-case");
  testCase.remove();

  // Retrieve the ID of the test case from its data attribute
  const id = testCase.dataset.id;

  // Remove the corresponding bar from the chart
  const chartBar = document.querySelector(`.bar[data-id="${id}"]`);
  if (chartBar) chartBar.remove();

  // Remove the corresponding percentage display
  const chartPercentage = document.querySelector(
    `.percentage[data-id="${id}"]`
  );
  if (chartPercentage) chartPercentage.remove();

  // Update the IDs of all remaining test cases
  const testCases = document.querySelectorAll(".test-case");

  // TASK: Make a function to update the IDs of all test cases and chart elements
  testCases.forEach((testCase, index) => {
    testCase.dataset.id = index + 1;
    testCase.querySelector(".test-id").textContent = index + 1;
  });

  // Update the data IDs of all remaining chart elements
  const chartBars = document.querySelectorAll(".bar");
  const chartPercentages = document.querySelectorAll(".percentage");

  // TASK: Make a function to update the IDs of all test cases and chart elements
  chartBars.forEach((bar, index) => bar.setAttribute("data-id", index + 1));
  chartPercentages.forEach((percentage, index) =>
    percentage.setAttribute("data-id", index + 1)
  );

  // TASK: Make a function to update the global variables with the new chart elements
  // Update the global variables with the new chart elements
  $bars = chartBars;
  $percentages = chartPercentages;
}

/**
 * Copies the code from a test case to the clipboard.
 * @param {Event} event - The click event triggered by the copy button.
 */
function copyTestCase(event) {
  // Locate the closest test-case element from the event source
  const testCase = event.target.closest(".test-case");

  // Copy the value of the code textarea to the clipboard
  const codeText = testCase.querySelector(".code").value;
  window.navigator.clipboard.writeText(codeText);
}

// Initialize test cases on page load
runTestCases();

// Re-run test cases when the send button is clicked
$sendButton.addEventListener("click", () => runTestCases());

// Attach the addTestCase function to the add button
$addButton.addEventListener("click", addTestCase);

// Attach the deleteTestCase function to the delete button
$deleteButtons.forEach((button) =>
  button.addEventListener("click", deleteTestCase)
);

// Attach the copyTestCase function to all copy buttons
$copyButtons.forEach((button) =>
  button.addEventListener("click", copyTestCase)
);
