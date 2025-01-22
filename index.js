// DOM Element Selectors
const $globalCode = document.querySelector("#global");
let $bars = document.querySelectorAll(".bar");
let $percentages = document.querySelectorAll(".percentage");

// Constants
const COLORS = ["green", "yellow", "orange", "red", "purple"];
let testCaseCounter = document.querySelectorAll(".test-case").length;

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

  const { resolve, promise } = Promise.withResolvers();
  worker.onmessage = (event) => resolve(event.data);

  return promise;
}

/**
 * Executes all test cases, updates the chart, and displays the results.
 */
async function runTestCases() {
  const $testCases = document.querySelectorAll(".test-case");

  $bars.forEach((bar) => bar.setAttribute("height", 0));
  $percentages.forEach((percentage) => (percentage.textContent = ""));

  const globalCode = $globalCode.value;
  const promises = Array.from($testCases).map(async (testCase) => {
    const $code = testCase.querySelector(".code");
    const $ops = testCase.querySelector(".ops");

    $ops.textContent = "Loading...";

    const result = await runTest({ code: $code.value, data: globalCode });
    $ops.textContent = `${result.toLocaleString()} ops/s`;

    return result;
  });

  const results = await Promise.all(promises);
  const maxOps = Math.max(...results);

  const sortedResults = results
    .map((result, index) => ({ result, index }))
    .sort((a, b) => b.result - a.result);

  results.forEach((result, index) => {
    const bar = $bars[index];
    const percentage = $percentages[index];

    const indexColor = sortedResults.findIndex((x) => x.index === index);
    const color = COLORS[indexColor];

    const height = (result / maxOps) * 300;
    bar.setAttribute("height", height);
    bar.setAttribute("fill", color);

    const percentageValue = Math.round((result / maxOps) * 100);
    percentage.textContent = `${percentageValue}%`;
  });
}

/**
 * Clones and resets an element with a unique ID.
 * @param {HTMLElement} element - The element to clone.
 * @param {number} newId - The new unique ID for the element.
 * @returns {HTMLElement} - The cloned and reset element.
 */
function cloneAndResetElement(element, newId) {
  const newElement = element.cloneNode(true);
  newElement.setAttribute("data-id", newId);

  if (element.classList.contains("bar")) {
    newElement.setAttribute("height", 0);
  } else if (element.classList.contains("percentage")) {
    newElement.textContent = "0%";
  }

  return newElement;
}

/**
 * Updates the global variables for bars and percentages.
 */
function updateGlobalCode() {
  $bars = document.querySelectorAll(".bar");
  $percentages = document.querySelectorAll(".percentage");
}

/**
 * Repositions and adjusts all bars to ensure proper distribution in the chart.
 */
function adjustChartBars() {
  const totalBars = $bars.length;
  const barSpacing = 460 / totalBars;
  const chartWidth = 460;

  // Calculate bar width dynamically based on the total number of bars
  const barWidth = (chartWidth - barSpacing * (totalBars - 1)) / totalBars;

  $bars.forEach((bar, index) => {
    const xPosition = index * (barWidth + barSpacing);
    bar.setAttribute("width", barWidth);
    bar.setAttribute("x", xPosition);
  });

  $percentages.forEach((percentage, index) => {
    const xPosition = index * (barWidth + barSpacing) + barWidth / 2;
    percentage.setAttribute("x", xPosition);
  });
}

/**
 * Adds a new test case with unique identifiers and resets its values.
 */
function addTestCase() {
  const testCases = document.querySelectorAll(".test-case");
  const lastTestCase = testCases[testCases.length - 1];
  testCaseCounter++;

  const newTestCase = lastTestCase.cloneNode(true);
  newTestCase.dataset.id = testCaseCounter;
  newTestCase.querySelector(".test-id").textContent = testCaseCounter;
  newTestCase.querySelector(".code").value = "";
  newTestCase.querySelector(".ops").textContent = "0 ops/s";

  lastTestCase.after(newTestCase);

  const deleteButton = newTestCase.querySelector(".delete-button");
  deleteButton.addEventListener("click", deleteTestCase);

  const lastBar = $bars[$bars.length - 1];
  const lastPercentage = $percentages[$percentages.length - 1];

  const newBar = cloneAndResetElement(lastBar, testCaseCounter);
  const newPercentage = cloneAndResetElement(lastPercentage, testCaseCounter);

  lastBar.after(newBar);
  lastPercentage.after(newPercentage);

  updateGlobalCode();
  adjustChartBars();
}

/**
 * Deletes a test case and its corresponding chart elements.
 * @param {Event} event - The click event triggered by the delete button.
 */
function deleteTestCase(event) {
  const testCase = event.target.closest(".test-case");
  testCase.remove();

  const id = testCase.dataset.id;
  document.querySelector(`.bar[data-id="${id}"]`).remove();
  document.querySelector(`.percentage[data-id="${id}"]`).remove();

  testCaseCounter--;
  updateGlobalCode();
  adjustChartBars();
}

/**
 * Copies the code from a test case to the clipboard.
 * @param {Event} event - The click event triggered by the copy button.
 */
function copyTestCase(event) {
  const testCase = event.target.closest(".test-case");
  const codeText = testCase.querySelector(".code").value;
  window.navigator.clipboard.writeText(codeText);
}

// Initialize test cases on page load
runTestCases();

// Re-run test cases when the send button is clicked
document.querySelector(".send-button").addEventListener("click", runTestCases);

// Attach the addTestCase function to the add button
document.querySelector(".add-button").addEventListener("click", addTestCase);

// Use event delegation for dynamic delete buttons
document
  .querySelector(".delete-button")
  .addEventListener("click", deleteTestCase);

// Use event delegation for dynamic copy buttons
document.querySelector(".copy-button").addEventListener("click", copyTestCase);
