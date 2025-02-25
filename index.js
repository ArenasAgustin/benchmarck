// DOM Element Selectors
const $globalCode = document.querySelector("#global");
let $testCases = document.querySelectorAll(
  ".test-case:not(.global):not(.hidden)"
);
let $bars = document.querySelectorAll(".bar:not(.hidden)");
let $percentages = document.querySelectorAll(".percentage:not(.hidden)");
let $indexes = document.querySelectorAll(".index:not(.hidden)");

// Variables
let $testCaseCounter = document.querySelectorAll(
  ".test-case:not(.global):not(.hidden)"
).length;

// Base HTML elements for cloning
const baseHtmlTest = document.querySelector(".test-case.hidden");
const baseHtmlBar = document.querySelector(".bar.hidden");
const baseHtmlPercentage = document.querySelector(".percentage.hidden");
const baseHtmlIndex = document.querySelector(".index.hidden");

/**
 * Generates a color in the gradient from green to red based on a given ratio.
 * @param {number} ratio - A value between 0 (green) and 1 (red).
 * @returns {string} - The interpolated color in RGB format.
 */
function getGradientColor(ratio) {
  let startColor, endColor;

  if (ratio <= 0.5) {
    // Green to Yellow
    startColor = [0, 255, 0]; // Green
    endColor = [255, 255, 0]; // Yellow
    ratio *= 2; // Scale to [0, 1] for this range
  } else {
    // Yellow to Red
    startColor = [255, 255, 0]; // Yellow
    endColor = [255, 0, 0]; // Red
    ratio = (ratio - 0.5) * 2; // Scale to [0, 1] for this range
  }

  const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
  const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
  const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

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

    if (results.length === 1) {
      bar.setAttribute("fill", "rgb(0, 255, 0)");
    } else {
      const ratio =
        sortedResults.findIndex((x) => x.index === index) /
        (results.length - 1);
      bar.setAttribute("fill", getGradientColor(ratio));
    }

    bar.setAttribute("height", (result / maxOps) * 300);
    percentage.textContent = `${Math.round((result / maxOps) * 100)}%`;
  });
}

/**
 * Clones and resets an element with a unique ID.
 * @param {number} newId - The new unique ID for the element.
 * @returns {HTMLElement} - The cloned and reset element.
 */
function cloneAndResetElement(newId, type) {
  let aux = null;

  if (type === "bar") {
    aux = baseHtmlBar;
  } else if (type === "percentage") {
    aux = baseHtmlPercentage;
  } else {
    aux = baseHtmlIndex;
  }

  const newElement = aux.cloneNode(true);

  newElement.setAttribute("data-id", newId);

  if (type === "bar") {
    newElement.setAttribute("height", 0);
  } else if (type === "percentage") {
    newElement.textContent = "0%";
  } else {
    newElement.textContent = newId;
  }

  newElement.classList.remove("hidden");

  return newElement;
}

/**
 * Updates the global variables for bars and percentages.
 */
function updateGlobalCode() {
  $testCases = document.querySelectorAll(
    ".test-case:not(.global):not(.hidden)"
  );
  $bars = document.querySelectorAll(".bar:not(.hidden)");
  $percentages = document.querySelectorAll(".percentage:not(.hidden)");
  $indexes = document.querySelectorAll(".index:not(.hidden)");
}

/**
 * Repositions and adjusts all bars to ensure proper distribution in the chart.
 */
function adjustChartBars() {
  const totalBars = $bars.length;
  const barSpacing = 400 / totalBars + 1;
  const chartWidth = 400;
  const barWidth = (chartWidth - barSpacing * (totalBars - 1)) / totalBars;

  $bars.forEach((bar, index) => {
    const barX = index * (barWidth + barSpacing);

    bar.setAttribute("width", barWidth);
    bar.setAttribute("x", barX);

    const indexElement = $indexes[index];
    const percentageElement = $percentages[index];

    if (indexElement) {
      indexElement.style.left = `${barX}px`;
    }
    if (percentageElement) {
      percentageElement.style.left = `${barX}px`;
    }
  });
}

/**
 * Adds a new test case with unique identifiers and resets its values.
 */
function addTestCase(code = "") {
  let newTestCase = null;
  $testCaseCounter++;

  newTestCase = baseHtmlTest.cloneNode(true);

  newTestCase.classList.remove("hidden");

  newTestCase.dataset.id = $testCaseCounter;
  newTestCase.querySelector(".test-id").textContent = $testCaseCounter;
  newTestCase.querySelector(".code").value = code;
  newTestCase.querySelector(".ops").textContent = "0 ops/s";

  newTestCase
    .querySelector(".delete-button")
    .addEventListener("click", deleteTestCase);
  newTestCase
    .querySelector(".copy-button")
    .addEventListener("click", copyTestCase);
  newTestCase
    .querySelector(".clear-button")
    .addEventListener("click", clearTestCase);
  newTestCase
    .querySelector(".code")
    .addEventListener("focusout", updateURLWithTests);

  document.querySelector(".test-cases").appendChild(newTestCase);

  const deleteButton = newTestCase.querySelector(".delete-button");
  deleteButton.addEventListener("click", deleteTestCase);

  const newBar = cloneAndResetElement($testCaseCounter, "bar");
  const newPercentage = cloneAndResetElement($testCaseCounter, "percentage");
  const newIndex = cloneAndResetElement($testCaseCounter, "index");

  document.querySelector(".chart").appendChild(newBar);
  document.querySelector(".percentages").appendChild(newPercentage);
  document.querySelector(".indexes").appendChild(newIndex);

  updateGlobalCode();
  adjustChartBars();
}

/**
 * Updates the IDs and content of a list of elements based on their position.
 * @param {NodeListOf<HTMLElement>} elements - The list of elements to update.
 */
function updateIndexes(elements) {
  elements.forEach((element, index) => {
    const newId = index + 1;
    const classList = element.classList;

    element.setAttribute("data-id", newId);

    if (classList.contains("test-case")) {
      element.dataset.id = newId;
      element.querySelector(".test-id").textContent = newId;
    } else if (classList.contains("index")) {
      element.textContent = newId;
    }
  });
}

/**
 * Deletes a test case and its corresponding chart elements.
 * @param {Event} event - The click event triggered by the delete button.
 */
function deleteTestCase(event) {
  if ($testCaseCounter > 1) {
    const testCase = event.target.closest(".test-case:not(.hidden)");
    const id = testCase.dataset.id;

    testCase.remove();

    document.querySelector(`.bar[data-id="${id}"]`).remove();
    document.querySelector(`.percentage[data-id="${id}"]`).remove();
    document.querySelector(`.index[data-id="${id}"]`).remove();

    $testCaseCounter--;

    updateGlobalCode();
    adjustChartBars();

    updateIndexes($testCases);
    updateIndexes($bars);
    updateIndexes($percentages);
    updateIndexes($indexes);

    updateURLWithTests();
  }
}

/**
 * Deletes all test cases except the global one.
 */
function deleteAllTestCases() {
  document
    .querySelectorAll(".test-case:not(.global):not(.hidden)")
    .forEach((testCase) => testCase.remove());

  document.querySelectorAll(".bar:not(.hidden)").forEach((bar) => bar.remove());

  document
    .querySelectorAll(".percentage:not(.hidden)")
    .forEach((percentage) => percentage.remove());

  document
    .querySelectorAll(".index:not(.hidden)")
    .forEach((index) => index.remove());

  $testCaseCounter = 0;
}

/**
 * Copies the code from a test case to the clipboard.
 * @param {Event} event - The click event triggered by the copy button.
 */
function copyTestCase(event) {
  const codeText = event.target
    .closest(".test-case:not(.hidden)")
    .querySelector(".code").value;
  window.navigator.clipboard.writeText(codeText);
}

/**
 * Clears all test cases and resets associated chart elements.
 */
function clearAllTestCases() {
  document
    .querySelectorAll(".test-case:not(.global):not(.hidden) .code")
    .forEach((input) => (input.value = ""));

  $bars.forEach((bar) => {
    bar.setAttribute("height", 0);
    bar.setAttribute("fill", "#ccc");
  });

  $percentages.forEach((percentage) => (percentage.textContent = "0%"));

  history.replaceState(
    null,
    "",
    `${window.location.origin}${window.location.pathname}`
  );
}

/**
 * Clears the code from a test case and resets its corresponding chart element.
 */
function clearTestCase(event) {
  const testCase = event.target.closest(".test-case:not(.hidden)");
  const id = testCase.dataset.id;
  const bar = document.querySelector(`.bar[data-id="${id}"]`);

  testCase.querySelector(".code").value = "";

  bar.setAttribute("height", 0);
  bar.setAttribute("fill", "#ccc");

  document.querySelector(`.percentage[data-id="${id}"]`).textContent = "0%";

  updateURLWithTests();
}

/**
 * Parses the URL to extract test data and updates the page accordingly.
 */
function updateURLWithTests() {
  const testCases = [
    ...document.querySelectorAll(".test-case:not(.hidden) .code"),
  ].map((code) => btoa(code.value));

  const newURL = `${window.location.origin}${
    window.location.pathname
  }?data=${testCases.join("|")}`;

  history.replaceState(null, "", newURL);
}

/**
 * Loads test data from the URL and updates the page accordingly.
 */
function loadTestsFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedData = urlParams.get("data");

  if (!encodedData) return;

  try {
    const decodedData = encodedData.split("|").map((test) => atob(test));

    deleteAllTestCases();

    document.querySelector(".test-case:not(.hidden) .code").value =
      decodedData.shift();

    decodedData.forEach((test) => {
      addTestCase(test);
    });
  } catch (error) {
    console.error("Error decoding test data:", error);
  }
}

/**
 * Initializes the page by loading test data from the URL and running test cases.
 */
function documentLoaded() {
  // Load test data from the URL on page load
  loadTestsFromURL();

  // Initialize test cases on page load
  runTestCases();
}

// Run the documentLoaded function when the DOM is ready
window.addEventListener("DOMContentLoaded", documentLoaded);

// Re-run test cases when the run button is clicked
document.querySelector(".run-button").addEventListener("click", runTestCases);

// Run tests when key combinations are pressed
document.addEventListener("keydown", (event) => {
  // Run tests with Ctrl + Enter
  if (event.ctrlKey && event.key === "Enter") {
    runTestCases();
  }

  // Add new test case with Ctrl + Shift + Enter
  if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
    addTestCase();
  }
});

// Attach the addTestCase function to the add button
document
  .querySelector(".add-button")
  .addEventListener("click", () => addTestCase());

// Clear all test cases except the first one
document
  .querySelector(".clear-all-button")
  .addEventListener("click", clearAllTestCases);

// Use event delegation for dynamic delete buttons
document
  .querySelectorAll(".delete-button")
  .forEach((button) => button.addEventListener("click", deleteTestCase));

// Use event delegation for dynamic copy buttons
document
  .querySelectorAll(".copy-button")
  .forEach((button) => button.addEventListener("click", copyTestCase));

// Clear a single test case
document
  .querySelectorAll(".clear-button")
  .forEach((button) => button.addEventListener("click", clearTestCase));

// Update the code when it changes
document
  .querySelectorAll(".code")
  .forEach((code) => code.addEventListener("focusout", updateURLWithTests));
