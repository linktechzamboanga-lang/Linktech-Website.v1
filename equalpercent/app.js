
"use strict";

/* =========================================
   EQUAL PERCENT — LINKTECH
   ========================================= */

const EqualPercent = (() => {
    const DB_NAME = "EqualPercentDB";
    const DB_VERSION = 1;
    const STORE_NAME = "calculations";
    const MAX_VALUES = 100;

    const LENGTH_FACTORS = {
        m: 1,
        cm: 0.01,
        ft: 0.3048,
        in: 0.0254
    };

    let db = null;
    let currentTotal = null;
    let currentValues = [];
    let currentOperation = "add";
    let nextValueId = 3;

    const $ = id => document.getElementById(id);

    const OPERATION_SYMBOLS = {
        add: "+",
        subtract: "−",
        multiply: "×",
        divide: "÷"
    };

    function formatNumber(value) {
        if (!Number.isFinite(value)) return "Error";

        return Number(value.toFixed(10)).toLocaleString("en-US", {
            maximumFractionDigits: 10
        });
    }

    function notify(message, type = "info") {
        const area = $("notificationArea");

        if (!area) {
            console[type === "error" ? "error" : "log"](message);
            return;
        }

        const notice = document.createElement("div");
        notice.className = "notification";

        if (type === "error") notice.classList.add("error");
        if (type === "success") notice.classList.add("success");

        notice.textContent = message;
        area.appendChild(notice);

        window.setTimeout(() => notice.remove(), 4000);
    }

    function safely(action, options = {}) {
        try {
            return action();
        } catch (error) {
            console.error(error);

            if (!options.silent) {
                notify(
                    error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
                    "error"
                );
            }

            return null;
        }
    }

    function readNumber(id, label, options = {}) {
        const element = $(id);

        if (!element) {
            throw new Error(`Missing input: ${id}`);
        }

        const raw = element.value.trim();

        if (raw === "") {
            throw new Error(`Please enter ${label}.`);
        }

        const value = Number(raw);

        if (!Number.isFinite(value)) {
            throw new Error(`Enter a valid number for ${label}.`);
        }

        if (options.nonNegative && value < 0) {
            throw new Error(`${label} cannot be negative.`);
        }

        return value;
    }

    /* =========================================
       MAIN CALCULATOR
       ========================================= */

    function getValueInputs() {
        return Array.from(
            document.querySelectorAll("#valuesContainer .calc-value")
        );
    }

    function readValues() {
        const inputs = getValueInputs();

        if (inputs.length < 2) {
            throw new Error("Enter at least two values.");
        }

        if (inputs.length > MAX_VALUES) {
            throw new Error(`You can enter up to ${MAX_VALUES} values.`);
        }

        return inputs.map((input, index) => {
            const raw = input.value.trim();

            if (raw === "") {
                throw new Error(`Please enter Value ${index + 1}.`);
            }

            const value = Number(raw);

            if (!Number.isFinite(value)) {
                throw new Error(`Value ${index + 1} is invalid.`);
            }

            return value;
        });
    }

    function computeTotal(values, operation) {
        if (!OPERATION_SYMBOLS[operation]) {
            throw new Error("Choose a valid operation.");
        }

        let total = values[0];

        // Deliberately evaluates from left to right.
        for (let i = 1; i < values.length; i++) {
            const value = values[i];

            if (operation === "add") total += value;
            if (operation === "subtract") total -= value;
            if (operation === "multiply") total *= value;

            if (operation === "divide") {
                if (value === 0) {
                    throw new Error("Division by zero is not allowed.");
                }

                total /= value;
            }

            if (!Number.isFinite(total)) {
                throw new Error("The total is outside the supported number range.");
            }
        }

        return total;
    }

    function renderEmptyCalculation() {
        currentTotal = null;
        currentValues = [];

        $("totalResult").textContent = "—";
        $("calculationDetails").textContent =
            "Enter at least two values to calculate.";

        updatePercentageDisplay();
    }

    function calculateTotal(options = {}) {
        const values = readValues();
        const operation = $("operation").value;
        const total = computeTotal(values, operation);

        currentValues = values;
        currentOperation = operation;
        currentTotal = total;

        $("totalResult").textContent = formatNumber(total);

        $("calculationDetails").textContent =
            values.map(formatNumber).join(` ${OPERATION_SYMBOLS[operation]} `) +
            ` = ${formatNumber(total)}`;

        updatePercentageDisplay();

        if (options.notify) {
            notify(`Expected total: ${formatNumber(total)}`, "success");
        }

        return total;
    }

    function refreshTotalSilently() {
        try {
            calculateTotal();
        } catch {
            renderEmptyCalculation();
        }
    }

    function addValueInput() {
        const container = $("valuesContainer");
        const inputs = getValueInputs();

        if (inputs.length >= MAX_VALUES) {
            notify(`Maximum ${MAX_VALUES} values allowed.`, "error");
            return;
        }

        const id = nextValueId++;
        const wrapper = document.createElement("div");
        wrapper.className = "value-row";

        const label = document.createElement("label");
        label.htmlFor = `value${id}`;
        label.textContent = `Value ${inputs.length + 1}`;

        const input = document.createElement("input");
        input.id = `value${id}`;
        input.className = "calc-value";
        input.type = "number";
        input.step = "any";
        input.inputMode = "decimal";
        input.placeholder = `Enter value ${inputs.length + 1}`;

        wrapper.append(label, input);
        container.appendChild(wrapper);
        input.focus();

        // The new blank value is not counted until it is filled.
        refreshTotalSilently();
    }

    function clearMainData() {
        const container = $("valuesContainer");

        // Remove all extra fields, keeping only the first two.
        const rows = Array.from(container.querySelectorAll(".value-row"));

        rows.forEach((row, index) => {
            if (index >= 2) row.remove();
        });

        const inputs = getValueInputs();

        inputs.forEach(input => {
            input.value = "";
            input.removeAttribute("aria-invalid");
        });

        $("operation").value = "add";
        $("percentage").value = "";
        $("percentage").removeAttribute("aria-invalid");

        nextValueId = 3;
        renderEmptyCalculation();

        notify("Calculator data cleared. Saved history was not deleted.", "success");
    }

    /* =========================================
       PERCENTAGE CALCULATOR
       Uses the main calculator's total.
       ========================================= */

    function updatePercentageDisplay() {
        const valuesOutput = $("percentageValues");
        const operationOutput = $("percentageOperation");
        const totalOutput = $("percentageTotal");
        const usedOutput = $("percentageUsed");
        const answerOutput = $("percentageAnswer");
        const formulaOutput = $("percentageFormula");

        if (
            !valuesOutput || !operationOutput || !totalOutput ||
            !usedOutput || !answerOutput || !formulaOutput
        ) {
            console.error("Percentage section is missing required HTML elements.");
            return null;
        }

        if (currentTotal === null || !Number.isFinite(currentTotal)) {
            valuesOutput.textContent = "Add and complete values in the main calculator.";
            operationOutput.textContent = "Operation: —";
            totalOutput.textContent = "—";
            usedOutput.textContent = "—";
            answerOutput.textContent = "—";
            formulaOutput.textContent =
                "Your total and percentage formula will appear here.";
            return null;
        }

        valuesOutput.textContent = currentValues
            .map(formatNumber)
            .join(` ${OPERATION_SYMBOLS[currentOperation]} `);

        operationOutput.textContent =
            `Operation: ${currentOperation.charAt(0).toUpperCase() + currentOperation.slice(1)}`;

        totalOutput.textContent = formatNumber(currentTotal);

        const rawPercentage = $("percentage").value.trim();

        if (rawPercentage === "") {
            usedOutput.textContent = "Not entered";
            answerOutput.textContent = "—";
            formulaOutput.textContent =
                `Expected total = ${formatNumber(currentTotal)}. Enter a percentage to calculate its value.`;

            $("percentage").removeAttribute("aria-invalid");
            return null;
        }

        const percentage = Number(rawPercentage);

        if (!Number.isFinite(percentage) || percentage < 0) {
            usedOutput.textContent = "Invalid";
            answerOutput.textContent = "—";
            formulaOutput.textContent =
                "Enter a valid percentage of zero or greater.";

            $("percentage").setAttribute("aria-invalid", "true");
            return null;
        }

        const answer = currentTotal * percentage / 100;

        if (!Number.isFinite(answer)) {
            usedOutput.textContent = `${formatNumber(percentage)}%`;
            answerOutput.textContent = "Calculation error";
            formulaOutput.textContent =
                "The percentage answer is outside the supported number range.";

            $("percentage").setAttribute("aria-invalid", "true");
            return null;
        }

        usedOutput.textContent = `${formatNumber(percentage)}%`;
        answerOutput.textContent = formatNumber(answer);

        formulaOutput.textContent =
            `${formatNumber(currentTotal)} × ${formatNumber(percentage)} ÷ 100 = ${formatNumber(answer)}`;

        $("percentage").removeAttribute("aria-invalid");

        return answer;
    }

    function calculatePercentage() {
        // Recalculate the main total from current inputs every time.
        const total = calculateTotal();

        const rawPercentage = $("percentage").value.trim();

        if (rawPercentage === "") {
            throw new Error("Enter a percentage, such as 30 or 1.2.");
        }

        const percentage = Number(rawPercentage);

        if (!Number.isFinite(percentage) || percentage < 0) {
            throw new Error("Enter a valid percentage of zero or greater.");
        }

        const answer = total * percentage / 100;

        if (!Number.isFinite(answer)) {
            throw new Error("The percentage answer is outside the supported range.");
        }

        updatePercentageDisplay();

        notify(
            `${formatNumber(percentage)}% of ${formatNumber(total)} = ${formatNumber(answer)}`,
            "success"
        );

        return answer;
    }

    function clearPercentage() {
        $("percentage").value = "";
        $("percentage").removeAttribute("aria-invalid");
        updatePercentageDisplay();

        notify("Percentage input cleared. Your main values are unchanged.", "success");
    }

    async function copyPercentageAnswer() {
        // Refresh from the actual current main values first.
        calculateTotal();

        const answer = updatePercentageDisplay();

        if (answer === null) {
            throw new Error("Enter a valid percentage before copying the answer.");
        }

        const text = formatNumber(answer);

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const temporary = document.createElement("textarea");
            temporary.value = text;
            temporary.setAttribute("readonly", "");
            temporary.style.position = "fixed";
            temporary.style.opacity = "0";

            document.body.appendChild(temporary);
            temporary.select();

            const success = document.execCommand("copy");
            temporary.remove();

            if (!success) {
                throw new Error("Copy failed. Please select and copy the answer manually.");
            }
        }

        notify("Percentage answer copied.", "success");
    }

    /* =========================================
       LENGTH CONVERTER
       ========================================= */

    function convertLength() {
        const value = readNumber("lengthValue", "a length");
        const from = $("lengthFrom").value;
        const to = $("lengthTo").value;

        if (!(from in LENGTH_FACTORS) || !(to in LENGTH_FACTORS)) {
            throw new Error("Choose valid length units.");
        }

        const result = value * LENGTH_FACTORS[from] / LENGTH_FACTORS[to];

        if (!Number.isFinite(result)) {
            throw new Error("Converted length is outside the supported range.");
        }

        $("lengthResult").textContent =
            `${formatNumber(result)} ${to}`;
    }

    /* =========================================
       AREA, PERIMETER, AND VOLUME
       ========================================= */

    function calculateDimensions() {
        const length = readNumber("dimensionLength", "length", { nonNegative: true });
        const width = readNumber("dimensionWidth", "width", { nonNegative: true });
        const height = readNumber("dimensionHeight", "height", { nonNegative: true });
        const unit = $("dimensionUnit").value;

        if (!(unit in LENGTH_FACTORS)) {
            throw new Error("Choose a valid measurement unit.");
        }

        const area = length * width;
        const perimeter = 2 * (length + width);
        const volume = length * width * height;

        if (![area, perimeter, volume].every(Number.isFinite)) {
            throw new Error("Dimensions are outside the supported range.");
        }

        $("areaResult").textContent = `${formatNumber(area)} ${unit}²`;
        $("perimeterResult").textContent = `${formatNumber(perimeter)} ${unit}`;
        $("volumeResult").textContent = `${formatNumber(volume)} ${unit}³`;
    }

    /* =========================================
       INDEXEDDB — SAVED HISTORY
       ========================================= */

    function openDatabase() {
        return new Promise((resolve, reject) => {
            if (!("indexedDB" in window)) {
                reject(new Error("This browser does not support local history."));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = event => {
                const database = event.target.result;

                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, {
                        keyPath: "id",
                        autoIncrement: true
                    });
                }
            };

            request.onsuccess = () => {
                db = request.result;

                db.onversionchange = () => {
                    db.close();
                    db = null;
                };

                resolve(db);
            };

            request.onerror = () => {
                reject(request.error || new Error("Could not open saved history."));
            };
        });
    }

    function getAllHistory() {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error("Saved history is not available."));
                return;
            }

            let request;

            try {
                request = db.transaction(STORE_NAME, "readonly")
                    .objectStore(STORE_NAME)
                    .getAll();
            } catch (error) {
                reject(error);
                return;
            }

            request.onsuccess = () => {
                const records = request.result || [];

                records.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );

                resolve(records);
            };

            request.onerror = () => {
                reject(request.error || new Error("Could not read saved history."));
            };
        });
    }

    function saveCurrentCalculation() {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error("Saved history is not ready."));
                return;
            }

            let total;
            let values;
            let percentage = null;
            let percentageAnswer = null;

            try {
                total = calculateTotal();
                values = currentValues.slice();

                const raw = $("percentage").value.trim();

                if (raw !== "") {
                    percentage = Number(raw);

                    if (!Number.isFinite(percentage) || percentage < 0) {
                        throw new Error("Enter a valid percentage before saving.");
                    }

                    percentageAnswer = total * percentage / 100;

                    if (!Number.isFinite(percentageAnswer)) {
                        throw new Error("Percentage answer is outside the supported range.");
                    }
                }
            } catch (error) {
                reject(error);
                return;
            }

            const record = {
                date: new Date().toISOString(),
                values,
                operation: currentOperation,
                total,
                percentage,
                percentageAnswer
            };

            let transaction;
            let request;

            try {
                transaction = db.transaction(STORE_NAME, "readwrite");
                request = transaction.objectStore(STORE_NAME).add(record);
            } catch (error) {
                reject(error);
                return;
            }

            transaction.oncomplete = async () => {
                try {
                    await renderHistory();
                    notify("Calculation saved on this device.", "success");
                    resolve(request.result);
                } catch (error) {
                    reject(error);
                }
            };

            transaction.onerror = () => {
                reject(transaction.error || new Error("Could not save calculation."));
            };

            transaction.onabort = () => {
                reject(transaction.error || new Error("Saving was cancelled."));
            };
        });
    }

    function deleteHistoryRecord(id) {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error("Saved history is not available."));
                return;
            }

            let transaction;

            try {
                transaction = db.transaction(STORE_NAME, "readwrite");
                transaction.objectStore(STORE_NAME).delete(id);
            } catch (error) {
                reject(error);
                return;
            }

            transaction.oncomplete = async () => {
                try {
                    await renderHistory();
                    notify("Saved calculation deleted.", "success");
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            transaction.onerror = () => {
                reject(transaction.error || new Error("Could not delete history record."));
            };
        });
    }

    function clearAllHistory() {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error("Saved history is not available."));
                return;
            }

            let transaction;

            try {
                transaction = db.transaction(STORE_NAME, "readwrite");
                transaction.objectStore(STORE_NAME).clear();
            } catch (error) {
                reject(error);
                return;
            }

            transaction.oncomplete = async () => {
                try {
                    await renderHistory();
                    notify("All saved history was deleted.", "success");
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            transaction.onerror = () => {
                reject(transaction.error || new Error("Could not clear history."));
            };
        });
    }

    function renderHistory() {
        return getAllHistory().then(records => {
            const container = $("historyList");
            container.replaceChildren();

            if (records.length === 0) {
                const empty = document.createElement("p");
                empty.className = "empty-state";
                empty.textContent = "No saved calculations yet.";
                container.appendChild(empty);
                return;
            }

            records.forEach(record => {
                const item = document.createElement("article");
                item.className = "history-item";

                const title = document.createElement("h3");
                title.textContent = `Expected total: ${formatNumber(record.total)}`;

                const date = document.createElement("p");
                date.textContent = `Saved: ${new Date(record.date).toLocaleString()}`;

                const values = document.createElement("p");
                const symbol = OPERATION_SYMBOLS[record.operation] || "?";

                values.textContent =
                    `Values: ${(record.values || []).map(formatNumber).join(` ${symbol} `)}`;

                item.append(title, date, values);

                if (record.percentage !== null && record.percentage !== undefined) {
                    const percent = document.createElement("p");
                    percent.textContent =
                        `${formatNumber(record.percentage)}% answer: ${formatNumber(record.percentageAnswer)}`;
                    item.appendChild(percent);
                }

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "btn btn-light";
                deleteButton.textContent = "Delete";
                deleteButton.dataset.deleteId = String(record.id);

                item.appendChild(deleteButton);
                container.appendChild(item);
            });
        });
    }

    async function exportHistory() {
        const records = await getAllHistory();

        const backup = {
            app: "Equal Percent",
            version: 1,
            exportedAt: new Date().toISOString(),
            records
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download =
            `equal-percent-backup-${new Date().toISOString().slice(0, 10)}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        notify("History backup exported.", "success");
    }

    /* =========================================
       EVENT HANDLERS
       ========================================= */

    function bindEvents() {
        $("addValueBtn").addEventListener("click", addValueInput);

        $("calculateBtn").addEventListener("click", () => {
            safely(() => calculateTotal({ notify: true }));
        });

        $("clearDataBtn").addEventListener("click", () => {
            clearMainData();
        });

        $("valuesContainer").addEventListener("input", refreshTotalSilently);

        $("valuesContainer").addEventListener("change", refreshTotalSilently);

        $("operation").addEventListener("change", refreshTotalSilently);

        $("calculatePercentageBtn").addEventListener("click", () => {
            safely(calculatePercentage);
        });

        $("percentage").addEventListener("input", () => {
            updatePercentageDisplay();
        });

        $("clearPercentageBtn").addEventListener("click", clearPercentage);

        $("copyPercentageBtn").addEventListener("click", () => {
            copyPercentageAnswer().catch(error => {
                console.error(error);
                notify(error.message || "Could not copy the answer.", "error");
            });
        });

        $("convertLengthBtn").addEventListener("click", () => {
            safely(convertLength);
        });

        ["lengthValue", "lengthFrom", "lengthTo"].forEach(id => {
            $(id).addEventListener("change", () => safely(convertLength));
        });

        $("calculateDimensionsBtn").addEventListener("click", () => {
            safely(calculateDimensions);
        });

        ["dimensionLength", "dimensionWidth", "dimensionHeight", "dimensionUnit"]
            .forEach(id => {
                $(id).addEventListener("change", () => safely(calculateDimensions));
            });

        $("saveCalculationBtn").addEventListener("click", () => {
            saveCurrentCalculation().catch(error => {
                console.error(error);
                notify(error.message || "Could not save calculation.", "error");
            });
        });

        $("exportHistoryBtn").addEventListener("click", () => {
            exportHistory().catch(error => {
                console.error(error);
                notify(error.message || "Could not export history.", "error");
            });
        });

        $("clearHistoryBtn").addEventListener("click", () => {
            if (window.confirm("Delete all saved history on this device?")) {
                clearAllHistory().catch(error => {
                    console.error(error);
                    notify(error.message || "Could not clear history.", "error");
                });
            }
        });

        $("historyList").addEventListener("click", event => {
            const button = event.target.closest("[data-delete-id]");

            if (!button) return;

            const id = Number(button.dataset.deleteId);

            if (!Number.isInteger(id)) {
                notify("Invalid history record.", "error");
                return;
            }

            if (window.confirm("Delete this saved calculation?")) {
                deleteHistoryRecord(id).catch(error => {
                    console.error(error);
                    notify(error.message || "Could not delete history record.", "error");
                });
            }
        });

        window.addEventListener("error", event => {
            console.error("Application error:", event.error || event.message);
            notify("An application error occurred. Check the browser console.", "error");
        });

        window.addEventListener("unhandledrejection", event => {
            console.error("Unhandled application error:", event.reason);
            notify("An unexpected operation failed. Please try again.", "error");
        });
    }

    /* =========================================
       INITIALIZE
       ========================================= */

    async function init() {
        bindEvents();

        renderEmptyCalculation();

        // Set initial measurement examples.
        safely(convertLength, { silent: true });
        safely(calculateDimensions, { silent: true });

        try {
            await openDatabase();
            await renderHistory();
        } catch (error) {
            console.error("History initialization failed:", error);

            $("historyList").textContent =
                "Saved history is unavailable in this browser. The calculator can still be used.";
        }
    }

    return { init };
})();

document.addEventListener("DOMContentLoaded", EqualPercent.init);
