"use strict";

/* =========================================
   EQUAL PERCENT — LINKTECH
   ========================================= */

const $ = (id) => document.getElementById(id);

const DB_NAME = "EqualPercentDB";
const DB_VERSION = 1;
const STORE_NAME = "calculations";

let db = null;
let nextValueId = 3;
let lastMainCalculation = null;
let lastAmountPercentage = null;
let lastConversion = null;
let lastSpeedConversion = null;
let lastDimensions = null;

const numberFormat = new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 8
});

function formatNumber(value) {
    if (!Number.isFinite(value)) return "Invalid result";
    return numberFormat.format(Number(value.toPrecision(12)));
}

function readNumber(id, label) {
    const input = $(id);
    if (!input || input.value.trim() === "") {
        throw new Error(`Please enter ${label}.`);
    }

    const value = Number(input.value);
    if (!Number.isFinite(value)) {
        throw new Error(`Please enter a valid number for ${label}.`);
    }

    return value;
}

function getMainValues() {
    const inputs = [
        ...document.querySelectorAll("#valuesContainer .calc-value")
    ];

    if (inputs.length < 2) {
        throw new Error("Please provide at least two values.");
    }

    const values = inputs.map((input, index) => {
        if (input.value.trim() === "") {
            throw new Error(`Please enter Value ${index + 1}.`);
        }

        const value = Number(input.value);
        if (!Number.isFinite(value)) {
            throw new Error(`Value ${index + 1} is not valid.`);
        }

        return value;
    });

    return values;
}

function showMessage(message) {
    const box = $("notification");
    if (!box) {
        alert(message);
        return;
    }

    box.textContent = message;
    box.classList.add("show");
    box.setAttribute("role", "status");

    clearTimeout(showMessage.timer);
    showMessage.timer = setTimeout(() => {
        box.classList.remove("show");
    }, 3500);
}

function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
}

function setHTML(id, value) {
    const element = $(id);
    if (element) element.innerHTML = value;
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function getOperationName(operation) {
    return {
        add: "Addition",
        subtract: "Subtraction",
        multiply: "Multiplication",
        divide: "Division"
    }[operation] || operation;
}

function getOperationSymbol(operation) {
    return {
        add: "+",
        subtract: "−",
        multiply: "×",
        divide: "÷"
    }[operation] || operation;
}

/* =========================================
   1. MAIN NUMBER CALCULATOR
   ========================================= */

function calculateValues(values, operation) {
    let result = values[0];

    for (let i = 1; i < values.length; i++) {
        const value = values[i];

        switch (operation) {
            case "add":
                result += value;
                break;

            case "subtract":
                result -= value;
                break;

            case "multiply":
                result *= value;
                break;

            case "divide":
                if (value === 0) {
                    throw new Error("Cannot divide by zero.");
                }
                result /= value;
                break;

            default:
                throw new Error("Please select a valid operation.");
        }
    }

    if (!Number.isFinite(result)) {
        throw new Error("The result is too large or invalid.");
    }

    return result;
}

function calculateMain() {
    const values = getMainValues();
    const operation = $("operation").value;
    const result = calculateValues(values, operation);
    const symbol = getOperationSymbol(operation);

    const expression = values.map(formatNumber).join(` ${symbol} `);

    lastMainCalculation = {
        type: "Number Calculator",
        values,
        operation,
        result,
        expression,
        date: new Date().toISOString()
    };

    setText("totalResult", formatNumber(result));
    setText(
        "calculationDetails",
        `${expression} = ${formatNumber(result)}`
    );

    updateAveragePercentage(false);
    return lastMainCalculation;
}

function clearMainCalculator() {
    const inputs = [
        ...document.querySelectorAll("#valuesContainer .calc-value")
    ];

    inputs.forEach(input => {
        if (input.id === "value1" || input.id === "value2") {
            input.value = "";
        } else {
            input.closest(".value-row")?.remove();
        }
    });

    nextValueId = 3;
    $("operation").value = "add";

    lastMainCalculation = null;

    setText("totalResult", "Enter your values.");
    setText("calculationDetails", "");

    updateAveragePercentage(false);
    showMessage("Calculator values cleared.");
}

function addValueField() {
    const container = $("valuesContainer");
    const currentInputs = container.querySelectorAll(".calc-value");

    if (currentInputs.length >= 100) {
        showMessage("You can enter up to 100 values.");
        return;
    }

    const id = `value${nextValueId++}`;
    const row = document.createElement("div");
    row.className = "value-row";

    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = `Value ${currentInputs.length + 1}`;

    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.className = "calc-value";
    input.id = id;
    input.placeholder = "Enter value";
    input.setAttribute("aria-label", label.textContent);

    row.append(label, input);
    container.appendChild(row);

    input.focus();
}

/* =========================================
   2. AVERAGE PERCENTAGE
   =========================================

   Example:
   85 + 95 + 75 + 86 + 73 + 90 = 504
   Count = 6
   Average = 504 / 6 = 84%

   This average is meaningful as a percentage
   when the entered values are scores out of 100.
   ========================================= */

function updateAveragePercentage(showErrors = true) {
    let values;

    try {
        values = getMainValues();
    } catch (error) {
        setText("percentageValues", "Enter values in the Number Calculator.");
        setText("percentageTotal", "—");
        setText("percentageUsed", "—");
        setText("percentageAnswer", "—");
        setText(
            "percentageFormula",
            "Average = sum of values ÷ number of values"
        );

        if (showErrors) showMessage(error.message);
        return null;
    }

    const sum = values.reduce((total, value) => total + value, 0);
    const average = sum / values.length;

    if (!Number.isFinite(sum) || !Number.isFinite(average)) {
        if (showErrors) showMessage("The average could not be calculated.");
        return null;
    }

    setText(
        "percentageValues",
        values.map(formatNumber).join(" + ")
    );
    setText("percentageTotal", formatNumber(sum));
    setText("percentageUsed", String(values.length));
    setText("percentageAnswer", `${formatNumber(average)}%`);

    setText(
        "percentageFormula",
        `Average = ${formatNumber(sum)} ÷ ${values.length} = ${formatNumber(average)}%`
    );

    return {
        type: "Average Percentage",
        values,
        sum,
        count: values.length,
        result: average,
        formula: `${formatNumber(sum)} ÷ ${values.length} = ${formatNumber(average)}%`,
        date: new Date().toISOString()
    };
}

function clearAverageDisplay() {
    setText("percentageValues", "Enter values in the Number Calculator.");
    setText("percentageTotal", "—");
    setText("percentageUsed", "—");
    setText("percentageAnswer", "—");
    setText(
        "percentageFormula",
        "Average = sum of values ÷ number of values"
    );
}

/* =========================================
   3. PERCENTAGE OF AN AMOUNT
   =========================================

   Example:
   Amount = 2500
   Percentage = 3
   Result = 2500 * 3 / 100 = 75

   Enter 0.3 to calculate 0.3%, or 3 to
   calculate 3%. These are different values.
   ========================================= */

function calculateAmountPercentage() {
    const amount = readNumber("amountBase", "an amount");
    const percentage = readNumber("amountPercent", "a percentage");

    const result = amount * percentage / 100;

    if (!Number.isFinite(result)) {
        throw new Error("The percentage result is invalid.");
    }

    lastAmountPercentage = {
        type: "Percentage of an Amount",
        amount,
        percentage,
        result,
        formula: `${formatNumber(amount)} × ${formatNumber(percentage)} ÷ 100 = ${formatNumber(result)}`,
        date: new Date().toISOString()
    };

    setText(
        "amountPercentageAnswer",
        `${formatNumber(percentage)}% of ${formatNumber(amount)} = ${formatNumber(result)}`
    );

    setText(
        "amountPercentageFormula",
        `Formula: ${formatNumber(amount)} × ${formatNumber(percentage)}% = ${formatNumber(result)}`
    );

    return lastAmountPercentage;
}

function clearAmountPercentage() {
    $("amountBase").value = "";
    $("amountPercent").value = "";

    lastAmountPercentage = null;

    setText("amountPercentageAnswer", "Enter an amount and percentage.");
    setText("amountPercentageFormula", "");
}

/* =========================================
   4. TIME AND DISTANCE CONVERTER
   ========================================= */

const conversionRules = {
    "hours-minutes": {
        label: "hours to minutes",
        from: "hours",
        to: "minutes",
        factor: 60,
        formula: "hours × 60"
    },
    "minutes-hours": {
        label: "minutes to hours",
        from: "minutes",
        to: "hours",
        factor: 1 / 60,
        formula: "minutes ÷ 60"
    },
    "minutes-seconds": {
        label: "minutes to seconds",
        from: "minutes",
        to: "seconds",
        factor: 60,
        formula: "minutes × 60"
    },
    "seconds-minutes": {
        label: "seconds to minutes",
        from: "seconds",
        to: "minutes",
        factor: 1 / 60,
        formula: "seconds ÷ 60"
    },
    "km-m": {
        label: "kilometres to metres",
        from: "km",
        to: "m",
        factor: 1000,
        formula: "kilometres × 1,000"
    },
    "m-km": {
        label: "metres to kilometres",
        from: "m",
        to: "km",
        factor: 1 / 1000,
        formula: "metres ÷ 1,000"
    },
    "miles-km": {
        label: "miles to kilometres",
        from: "miles",
        to: "km",
        factor: 1.609344,
        formula: "miles × 1.609344"
    },
    "km-miles": {
        label: "kilometres to miles",
        from: "km",
        to: "miles",
        factor: 1 / 1.609344,
        formula: "kilometres ÷ 1.609344"
    }
};

function convertValue() {
    const value = readNumber("conversionValue", "a value to convert");
    const type = $("conversionType").value;
    const rule = conversionRules[type];

    if (!rule) {
        throw new Error("Please select a valid conversion.");
    }

    const result = value * rule.factor;

    if (!Number.isFinite(result)) {
        throw new Error("The conversion result is invalid.");
    }

    lastConversion = {
        type: "Time and Distance Conversion",
        conversion: rule.label,
        input: value,
        from: rule.from,
        result,
        to: rule.to,
        formula: `${formatNumber(value)} ${rule.from} → ${formatNumber(result)} ${rule.to}`,
        date: new Date().toISOString()
    };

    setText(
        "conversionAnswer",
        `${formatNumber(value)} ${rule.from} = ${formatNumber(result)} ${rule.to}`
    );

    setText(
        "conversionFormula",
        `Formula: ${rule.formula} = ${formatNumber(result)} ${rule.to}`
    );

    return lastConversion;
}

function clearConversion() {
    $("conversionValue").value = "";
    lastConversion = null;

    setText("conversionAnswer", "Enter a value to convert.");
    setText("conversionFormula", "");
}

/* =========================================
   5. SPEED CONVERTER
   ========================================= */

const speedRules = {
    "kmh-ms": {
        label: "km/h to m/s",
        from: "km/h",
        to: "m/s",
        factor: 1 / 3.6,
        formula: "km/h ÷ 3.6"
    },
    "ms-kmh": {
        label: "m/s to km/h",
        from: "m/s",
        to: "km/h",
        factor: 3.6,
        formula: "m/s × 3.6"
    },
    "mph-kmh": {
        label: "mph to km/h",
        from: "mph",
        to: "km/h",
        factor: 1.609344,
        formula: "mph × 1.609344"
    },
    "kmh-mph": {
        label: "km/h to mph",
        from: "km/h",
        to: "mph",
        factor: 1 / 1.609344,
        formula: "km/h ÷ 1.609344"
    }
};

function convertSpeed() {
    const value = readNumber("speedValue", "a speed");
    const type = $("speedType").value;
    const rule = speedRules[type];

    if (!rule) {
        throw new Error("Please select a valid speed conversion.");
    }

    const result = value * rule.factor;

    if (!Number.isFinite(result)) {
        throw new Error("The speed result is invalid.");
    }

    lastSpeedConversion = {
        type: "Speed Conversion",
        conversion: rule.label,
        input: value,
        from: rule.from,
        result,
        to: rule.to,
        formula: `${formatNumber(value)} ${rule.from} → ${formatNumber(result)} ${rule.to}`,
        date: new Date().toISOString()
    };

    setText(
        "speedAnswer",
        `${formatNumber(value)} ${rule.from} = ${formatNumber(result)} ${rule.to}`
    );

    setText(
        "speedFormula",
        `Formula: ${rule.formula} = ${formatNumber(result)} ${rule.to}`
    );

    return lastSpeedConversion;
}

function clearSpeed() {
    $("speedValue").value = "";
    lastSpeedConversion = null;

    setText("speedAnswer", "Enter a speed to convert.");
    setText("speedFormula", "");
}

/* =========================================
   6. AREA, PERIMETER AND VOLUME
   ========================================= */

function updateDimensionFields() {
    const isVolume = $("dimensionType").value === "volume";
    $("heightGroup").hidden = !isVolume;
}

function calculateDimensions() {
    const type = $("dimensionType").value;
    const length = readNumber("dimensionLength", "the length");
    const width = readNumber("dimensionWidth", "the width");

    if (length < 0 || width < 0) {
        throw new Error("Dimensions cannot be negative.");
    }

    let result;
    let unit;
    let formula;

    if (type === "area") {
        result = length * width;
        unit = "square units";
        formula = `${formatNumber(length)} × ${formatNumber(width)}`;
    } else if (type === "perimeter") {
        result = 2 * (length + width);
        unit = "units";
        formula = `2 × (${formatNumber(length)} + ${formatNumber(width)})`;
    } else if (type === "volume") {
        const height = readNumber("dimensionHeight", "the height");

        if (height < 0) {
            throw new Error("Height cannot be negative.");
        }

        result = length * width * height;
        unit = "cubic units";
        formula = `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(height)}`;
    } else {
        throw new Error("Please select a valid dimension calculation.");
    }

    if (!Number.isFinite(result)) {
        throw new Error("The dimensions result is invalid.");
    }

    const labels = {
        area: "Rectangle Area",
        perimeter: "Rectangle Perimeter",
        volume: "Box Volume"
    };

    lastDimensions = {
        type: labels[type],
        length,
        width,
        ...(type === "volume"
            ? { height: Number($("dimensionHeight").value) }
            : {}),
        result,
        unit,
        formula: `${formula} = ${formatNumber(result)} ${unit}`,
        date: new Date().toISOString()
    };

    setText(
        "dimensionsAnswer",
        `${labels[type]}: ${formatNumber(result)} ${unit}`
    );

    setText(
        "dimensionsFormula",
        `Formula: ${lastDimensions.formula}`
    );

    return lastDimensions;
}

function clearDimensions() {
    $("dimensionLength").value = "";
    $("dimensionWidth").value = "";
    $("dimensionHeight").value = "";

    lastDimensions = null;

    setText("dimensionsAnswer", "Enter dimensions.");
    setText("dimensionsFormula", "");
}

/* =========================================
   7. INDEXEDDB LOCAL HISTORY
   ========================================= */

function openDatabase() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) {
            reject(new Error("IndexedDB is not supported by this browser."));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const database = event.target.result;

            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, {
                    keyPath: "id",
                    autoIncrement: true
                });

                store.createIndex("date", "date", { unique: false });
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
            reject(request.error || new Error("Could not open local history."));
        };
    });
}

function getStore(mode = "readonly") {
    if (!db) throw new Error("Local history is not ready.");

    return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function getAllHistory() {
    return new Promise((resolve, reject) => {
        let request;

        try {
            request = getStore().getAll();
        } catch (error) {
            reject(error);
            return;
        }

        request.onsuccess = () => {
            const records = request.result || [];
            records.sort((a, b) => new Date(b.date) - new Date(a.date));
            resolve(records);
        };

        request.onerror = () => reject(request.error);
    });
}

function addHistoryRecord(record) {
    return new Promise((resolve, reject) => {
        let request;

        try {
            request = getStore("readwrite").add(record);
        } catch (error) {
            reject(error);
            return;
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function removeHistoryRecord(id) {
    return new Promise((resolve, reject) => {
        let request;

        try {
            request = getStore("readwrite").delete(Number(id));
        } catch (error) {
            reject(error);
            return;
        }

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function removeAllHistory() {
    return new Promise((resolve, reject) => {
        let request;

        try {
            request = getStore("readwrite").clear();
        } catch (error) {
            reject(error);
            return;
        }

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

function getCurrentSnapshot() {
    const records = [];

    try {
        const values = getMainValues();
        const operation = $("operation").value;
        const result = calculateValues(values, operation);

        records.push({
            type: "Number Calculator",
            values,
            operation,
            result,
            formula: values.map(formatNumber).join(
                ` ${getOperationSymbol(operation)} `
            ) + ` = ${formatNumber(result)}`,
            date: new Date().toISOString()
        });

        const average = values.reduce((sum, value) => sum + value, 0) / values.length;

        records.push({
            type: "Average Percentage",
            values,
            sum: values.reduce((sum, value) => sum + value, 0),
            count: values.length,
            result: average,
            formula: `Average = ${formatNumber(average)}%`,
            date: new Date().toISOString()
        });
    } catch (_) {
        // Main calculator has not been completed.
    }

    if (lastAmountPercentage) records.push(lastAmountPercentage);
    if (lastConversion) records.push(lastConversion);
    if (lastSpeedConversion) records.push(lastSpeedConversion);
    if (lastDimensions) records.push(lastDimensions);

    return records;
}

async function saveCurrentCalculation() {
    const records = getCurrentSnapshot();

    if (records.length === 0) {
        throw new Error("Complete a calculation before saving.");
    }

    for (const record of records) {
        await addHistoryRecord(record);
    }

    await renderHistory();

    setText("historyStatus", `${records.length} calculation result(s) saved locally.`);
    showMessage("Calculation saved to local history.");
}

function makeHistoryDescription(record) {
    if (record.formula) return record.formula;

    if (record.result !== undefined) {
        return `Result: ${formatNumber(record.result)}`;
    }

    return "Saved calculation";
}

async function renderHistory() {
    const container = $("historyList");
    const records = await getAllHistory();

    container.replaceChildren();

    if (records.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No saved calculations yet.";
        container.appendChild(empty);
        return;
    }

    records.forEach(record => {
        const card = document.createElement("div");
        card.className = "history-item";

        const title = document.createElement("h3");
        title.textContent = record.type || "Calculation";

        const details = document.createElement("p");
        details.textContent = makeHistoryDescription(record);

        const date = document.createElement("small");
        date.textContent = record.date
            ? new Date(record.date).toLocaleString()
            : "Date unavailable";

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn";
        removeButton.textContent = "Delete";
        removeButton.addEventListener("click", async () => {
            if (!confirm("Delete this saved calculation?")) return;

            try {
                await removeHistoryRecord(record.id);
                await renderHistory();
                showMessage("History record deleted.");
            } catch (error) {
                showMessage(error.message || "Could not delete record.");
            }
        });

        card.append(title, details, date, removeButton);
        container.appendChild(card);
    });
}

/* =========================================
   8. EXPORT JSON BACKUP
   ========================================= */

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function exportHistoryJSON() {
    const records = await getAllHistory();

    const backup = {
        app: "Equal Percent Calculator",
        version: "2.0",
        exportedAt: new Date().toISOString(),
        storage: "IndexedDB local browser storage",
        calculations: records
    };

    const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
    );

    const date = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `equal-percent-backup-${date}.json`);

    showMessage("JSON backup exported.");
}

/* =========================================
   9. PDF / PRINT REPORT
   =========================================

   Uses the browser print dialog. On Android,
   select "Save as PDF" if that option is offered.
   ========================================= */

function formatDateForReport(date) {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime())
        ? "Date unavailable"
        : parsed.toLocaleString();
}

async function exportHistoryPDF() {
    const records = await getAllHistory();

    if (records.length === 0) {
        throw new Error("There is no saved history to export.");
    }

    const rows = records.map(record => `
        <tr>
            <td>${escapeHTML(record.type || "Calculation")}</td>
            <td>${escapeHTML(makeHistoryDescription(record))}</td>
            <td>${escapeHTML(formatDateForReport(record.date))}</td>
        </tr>
    `).join("");

    const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Equal Percent Calculation Report</title>
<style>
    body {
        font-family: Arial, sans-serif;
        color: #111827;
        margin: 24px;
        line-height: 1.5;
    }
    h1 { margin-bottom: 4px; }
    .subtitle { color: #475569; margin-top: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td {
        border: 1px solid #cbd5e1;
        padding: 9px;
        text-align: left;
        vertical-align: top;
        overflow-wrap: anywhere;
    }
    th { background: #eaf2ff; }
    footer { margin-top: 28px; font-size: 12px; color: #475569; }
    @media print {
        body { margin: 12mm; }
        tr { break-inside: avoid; }
        thead { display: table-header-group; }
    }
</style>
</head>
<body>
    <h1>Equal Percent Calculator</h1>
    <p class="subtitle">LinkTech Freelance IT Specialist Zamboanga</p>
    <p>Exported: ${escapeHTML(new Date().toLocaleString())}</p>
    <p>Total saved records: ${records.length}</p>
    <table>
        <thead>
            <tr><th>Category</th><th>Calculation / Result</th><th>Date</th></tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
    <footer>
        This report contains locally saved calculation history.
        <br>© 2026 LinkTech Freelance IT Specialist Zamboanga
    </footer>
    <script>
        window.addEventListener("load", () => {
            setTimeout(() => window.print(), 400);
        });
    <\/script>
</body>
</html>`;

    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
        throw new Error("The report window was blocked. Allow pop-ups and try again.");
    }

    reportWindow.document.open();
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();

    showMessage("Print report opened. Choose Save as PDF in the print options.");
}

async function clearHistory() {
    if (!confirm("Delete all saved calculation history from this browser?")) {
        return;
    }

    await removeAllHistory();
    await renderHistory();

    setText("historyStatus", "All local history has been cleared.");
    showMessage("Saved history cleared.");
}

/* =========================================
   10. ERROR HANDLING
   ========================================= */

function safely(action) {
    try {
        action();
    } catch (error) {
        showMessage(error.message || "An error occurred.");
    }
}

async function safelyAsync(action) {
    try {
        await action();
    } catch (error) {
        showMessage(error.message || "An error occurred.");
    }
}

/* =========================================
   11. CONNECT BUTTONS AND INPUTS
   ========================================= */

function bindEvents() {
    $("addValueBtn").addEventListener("click", addValueField);

    $("calculateBtn").addEventListener("click", () => {
        safely(calculateMain);
    });

    $("clearDataBtn").addEventListener("click", clearMainCalculator);

    $("calculatePercentageBtn").addEventListener("click", () => {
        safely(() => updateAveragePercentage(true));
    });

    $("clearPercentageBtn").addEventListener("click", clearAverageDisplay);

    $("calculateAmountPercentageBtn").addEventListener("click", () => {
        safely(calculateAmountPercentage);
    });

    $("clearAmountPercentageBtn").addEventListener("click", clearAmountPercentage);

    $("convertValueBtn").addEventListener("click", () => {
        safely(convertValue);
    });

    $("clearConversionBtn").addEventListener("click", clearConversion);

    $("convertSpeedBtn").addEventListener("click", () => {
        safely(convertSpeed);
    });

    $("clearSpeedBtn").addEventListener("click", clearSpeed);

    $("dimensionType").addEventListener("change", updateDimensionFields);

    $("calculateDimensionsBtn").addEventListener("click", () => {
        safely(calculateDimensions);
    });

    $("clearDimensionsBtn").addEventListener("click", clearDimensions);

    $("saveCalculationBtn").addEventListener("click", () => {
        safelyAsync(saveCurrentCalculation);
    });

    $("exportHistoryBtn").addEventListener("click", () => {
        safelyAsync(exportHistoryJSON);
    });

    $("exportPdfBtn").addEventListener("click", () => {
        safelyAsync(exportHistoryPDF);
    });

    $("clearHistoryBtn").addEventListener("click", () => {
        safelyAsync(clearHistory);
    });

    // Update the average automatically as the user types.
    $("valuesContainer").addEventListener("input", () => {
        lastMainCalculation = null;
        updateAveragePercentage(false);
    });

    $("operation").addEventListener("change", () => {
        lastMainCalculation = null;
        setText("totalResult", "Press Calculate to update the result.");
        setText("calculationDetails", "");
    });

    // Allow Enter to calculate in number and percentage fields.
    $("valuesContainer").addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            safely(calculateMain);
        }
    });

    $("amountBase").addEventListener("keydown", event => {
        if (event.key === "Enter") safely(calculateAmountPercentage);
    });

    $("amountPercent").addEventListener("keydown", event => {
        if (event.key === "Enter") safely(calculateAmountPercentage);
    });
}

/* =========================================
   12. START APP
   ========================================= */

async function initializeApp() {
    bindEvents();
    updateDimensionFields();
    updateAveragePercentage(false);

    try {
        await openDatabase();
        await renderHistory();
        setText("historyStatus", "Local history is ready.");
    } catch (error) {
        setText(
            "historyStatus",
            "Local history is unavailable. Check browser storage settings."
        );
        showMessage(error.message || "Could not initialize local history.");
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}