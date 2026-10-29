
"use strict";

(() => {
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = "linktech_cheque_layouts_v1";

  const defaultElements = () => [
    { id: "date", name: "Date", text: "", x: 119, y: 7, w: 40, fs: 12, color: "#172b4d", font: "Arial, sans-serif", bold: false, align: "right" },
    { id: "payee", name: "Payee", text: "", x: 9, y: 25, w: 105, fs: 12, color: "#172b4d", font: "Arial, sans-serif", bold: false, align: "left" },
    { id: "amountWords", name: "Amount in words", text: "", x: 9, y: 36, w: 145, fs: 11, color: "#172b4d", font: "Arial, sans-serif", bold: false, align: "left" },
    { id: "amount", name: "Numeric amount", text: "", x: 120, y: 22, w: 36, fs: 12, color: "#172b4d", font: "Arial, sans-serif", bold: true, align: "right" },
    { id: "memo", name: "Memo / reference", text: "", x: 9, y: 57, w: 90, fs: 9, color: "#172b4d", font: "Arial, sans-serif", bold: false, align: "left" },
    { id: "signature", name: "Signature", text: "Authorized Signature", x: 116, y: 56, w: 40, fs: 9, color: "#172b4d", font: "Arial, sans-serif", bold: false, align: "center" }
  ];

  let state = {
    width: 165,
    height: 70,
    currency: "PHP",
    customCurrency: "",
    amount: "12345.67",
    payee: "",
    date: new Date().toISOString().slice(0, 10),
    dateFormat: "DMY",
    memo: "",
    words: "",
    showRulers: true,
    showGrid: false,
    paperSize: "a4",
    orientation: "portrait",
    copies: 1,
    offsetX: 0,
    offsetY: 0,
    printGuides: false,
    elements: defaultElements()
  };

  let selectedId = "date";
  let nextTextId = 1;
  let toastTimer;
  let printMode = "normal";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function notify(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function wordsUnderThousand(n) {
    const ones = [
      "Zero", "One", "Two", "Three", "Four", "Five",
      "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
      "Twelve", "Thirteen", "Fourteen", "Fifteen",
      "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const tens = [
      "", "", "Twenty", "Thirty", "Forty", "Fifty",
      "Sixty", "Seventy", "Eighty", "Ninety"
    ];

    let result = [];
    if (n >= 100) {
      result.push(ones[Math.floor(n / 100)], "Hundred");
      n %= 100;
    }
    if (n >= 20) {
      result.push(tens[Math.floor(n / 10)]);
      if (n % 10) result.push(ones[n % 10]);
    } else if (n > 0 || result.length === 0) {
      result.push(ones[n]);
    }
    return result.join(" ");
  }

  function integerToWords(n) {
    if (n === 0) return "Zero";
    const scales = [
      "", "Thousand", "Million", "Billion", "Trillion"
    ];
    const parts = [];
    let scale = 0;

    while (n > 0 && scale < scales.length) {
      const group = n % 1000;
      if (group) {
        let part = wordsUnderThousand(group);
        if (scales[scale]) part += " " + scales[scale];
        parts.unshift(part);
      }
      n = Math.floor(n / 1000);
      scale++;
    }

    if (n > 0) return "Amount exceeds supported range";
    return parts.join(" ");
  }

  function currencyNames() {
    const names = {
      PHP: { major: "Peso", minor: "Centavo" },
      USD: { major: "Dollar", minor: "Cent" },
      custom: {
        major: ($("customCurrency").value.trim() || "Unit"),
        minor: "Cent"
      }
    };
    return names[state.currency] || names.PHP;
  }

  function amountToWords(value) {
    if (value === "" || value === null || value === undefined) return "";
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0 || number > 999999999999.99) {
      return "Enter a valid amount up to 999,999,999,999.99";
    }

    const totalCents = Math.round((number + Number.EPSILON) * 100);
    const whole = Math.floor(totalCents / 100);
    const cents = totalCents % 100;
    const names = currencyNames();

    const majorWord = whole === 1 ? names.major : names.major + "s";
    const minorWord = cents === 1 ? names.minor : names.minor + "s";

    let result = integerToWords(whole) + " " + majorWord;
    if (cents > 0) {
      result += " and " + integerToWords(cents) + " " + minorWord;
    }
    return result + " Only";
  }

  function formatDate(value, format) {
    if (!value) return "";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;

    const [, year, month, day] = match;
    if (format === "MDY") return `${month}/${day}/${year}`;
    if (format === "YMD") return `${year}/${month}/${day}`;
    return `${day}/${month}/${year}`;
  }

  function moneyText() {
    const n = Number(state.amount);
    if (state.amount === "" || !Number.isFinite(n) || n < 0) return "";
    const symbol = state.currency === "PHP" ? "₱"
      : state.currency === "USD" ? "$"
      : (state.customCurrency || "").trim();
    return `${symbol}${n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function updateDynamicTexts() {
    const dateEl = state.elements.find(e => e.id === "date");
    const payeeEl = state.elements.find(e => e.id === "payee");
    const wordsEl = state.elements.find(e => e.id === "amountWords");
    const amountEl = state.elements.find(e => e.id === "amount");
    const memoEl = state.elements.find(e => e.id === "memo");

    if (dateEl) dateEl.text = formatDate(state.date, state.dateFormat);
    if (payeeEl) payeeEl.text = state.payee || "PAY TO THE ORDER OF";
    if (wordsEl) wordsEl.text = state.words || "";
    if (amountEl) amountEl.text = moneyText();
    if (memoEl) memoEl.text = state.memo ? "Memo: " + state.memo : "";
  }

  function selectedElement() {
    return state.elements.find(e => e.id === selectedId);
  }

  function syncDimensions() {
    $("chequeWidth").value = state.width;
    $("chequeHeight").value = state.height;
    $("presetSize").value = `${state.width}x${state.height}`;
    if (![ "165x70", "170x80", "180x85", "200x90" ].includes($("presetSize").value)) {
      $("presetSize").value = "custom";
    }
    $("widthDisplay").textContent = `${state.width} mm`;
    $("heightDisplay").textContent = `${state.height} mm`;

    const cheque = $("cheque");
    cheque.style.width = `${state.width}mm`;
    cheque.style.height = `${state.height}mm`;

    const rulerLeft = $("leftRuler");
    rulerLeft.style.height = `${state.height}mm`;
    $("topRuler").style.width = `${state.width}mm`;
    rulerLeft.hidden = !state.showRulers;
    $("topRuler").hidden = !state.showRulers;
    $("showGrid").checked = state.showGrid;
    $("showRulers").checked = state.showRulers;

    cheque.classList.toggle("grid-visible", state.showGrid);
    cheque.style.backgroundImage = state.showGrid
      ? "linear-gradient(#dceafa80 1px,transparent 1px),linear-gradient(90deg,#dceafa80 1px,transparent 1px)"
      : "linear-gradient(145deg,#fff 0%,#fbfdff 100%)";
    if (state.showGrid) cheque.style.backgroundSize = "5mm 5mm";
    else cheque.style.backgroundSize = "auto";

    renderRulers();
  }

  function renderRulers() {
    const top = $("topRuler");
    const left = $("leftRuler");
    top.replaceChildren();
    left.replaceChildren();

    for (let mm = 0; mm <= state.width; mm += 10) {
      const label = document.createElement("span");
      label.textContent = mm;
      label.style.left = `${mm}mm`;
      top.append(label);
    }
    for (let mm = 0; mm <= state.height; mm += 10) {
      const label = document.createElement("span");
      label.textContent = mm;
      label.style.top = `${mm}mm`;
      left.append(label);
    }
  }

  function populateElementSelect() {
    const select = $("elementSelect");
    select.replaceChildren();
    state.elements.forEach(el => {
      const option = document.createElement("option");
      option.value = el.id;
      option.textContent = el.name;
      select.append(option);
    });
    select.value = selectedId;
  }

  function renderElements() {
    updateDynamicTexts();
    const layer = $("elementsLayer");
    layer.replaceChildren();

    state.elements.forEach(el => {
      const node = document.createElement("div");
      node.className = "cheque-element" + (el.id === selectedId ? " selected" : "");
      node.dataset.id = el.id;
      node.textContent = el.text;
      node.style.left = `${el.x}mm`;
      node.style.top = `${el.y}mm`;
      node.style.width = `${Math.max(5, el.w)}mm`;
      node.style.fontSize = `${el.fs}px`;
      node.style.color = el.color;
      node.style.fontFamily = el.font;
      node.style.fontWeight = el.bold ? "700" : "400";
      node.style.textAlign = el.align;
      node.setAttribute("aria-label", el.name + ". Select and drag to move.");

      const handle = document.createElement("span");
      handle.className = "resize-handle";
      handle.setAttribute("aria-label", "Resize element width");
      node.append(handle);

      node.addEventListener("pointerdown", startPointerAction);
      node.addEventListener("click", event => {
        event.stopPropagation();
        if (selectedId !== el.id) {
          selectedId = el.id;
          populateElementSelect();
          renderElements();
          syncSelectedFields();
        }
      });
      layer.append(node);
    });

    $("selectedDisplay").textContent = selectedElement()?.name || "None";
  }

  function syncSelectedFields() {
    const el = selectedElement();
    if (!el) return;

    $("elementSelect").value = el.id;
    $("elementText").value = el.text;
    $("elementX").value = el.x;
    $("elementY").value = el.y;
    $("elementFontSize").value = el.fs;
    $("elementWidth").value = el.w;
    $("elementColor").value = el.color;
    $("elementFont").value = el.font;
    $("elementBold").checked = el.bold;
    $("elementAlign").value = el.align;
    $("selectedDisplay").textContent = el.name;
  }

  function clampElement(el) {
    el.x = Math.max(0, Math.min(Number(el.x) || 0, Math.max(0, state.width - 5)));
    el.y = Math.max(0, Math.min(Number(el.y) || 0, Math.max(0, state.height - 3)));
    el.w = Math.max(5, Math.min(Number(el.w) || 5, state.width - el.x));
    el.fs = Math.max(5, Math.min(72, Number(el.fs) || 12));
  }

  function startPointerAction(event) {
    if (event.button !== undefined && event.button !== 0) return;
    const node = event.currentTarget;
    const id = node.dataset.id;
    const el = state.elements.find(item => item.id === id);
    if (!el) return;

    selectedId = id;
    populateElementSelect();
    syncSelectedFields();
    renderElements();

    const isResize = event.target.classList.contains("resize-handle");
    const startX = event.clientX;
    const startY = event.clientY;
    const startPosX = el.x;
    const startPosY = el.y;
    const startWidth = el.w;
    const pxPerMm = $("cheque").getBoundingClientRect().width / state.width;

    event.preventDefault();

    function move(moveEvent) {
      const dx = (moveEvent.clientX - startX) / pxPerMm;
      const dy = (moveEvent.clientY - startY) / pxPerMm;

      if (isResize) {
        el.w = Math.max(5, Math.min(state.width - el.x, startWidth + dx));
      } else {
        el.x = Math.max(0, Math.min(state.width - 5, startPosX + dx));
        el.y = Math.max(0, Math.min(state.height - 3, startPosY + dy));
        el.w = Math.min(el.w, state.width - el.x);
      }
      renderElements();
      syncSelectedFields();
    }

    function end() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      syncSelectedFields();
    }

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  function applyElementChanges() {
    const el = selectedElement();
    if (!el) return;

    el.text = $("elementText").value;
    el.x = Number($("elementX").value);
    el.y = Number($("elementY").value);
    el.fs = Number($("elementFontSize").value);
    el.w = Number($("elementWidth").value);
    el.color = $("elementColor").value;
    el.font = $("elementFont").value;
    el.bold = $("elementBold").checked;
    el.align = $("elementAlign").value;
    clampElement(el);

    // Dynamic fields are controlled by the corresponding information inputs.
    if (el.id === "date") el.text = formatDate(state.date, state.dateFormat);
    if (el.id === "payee") el.text = state.payee || "PAY TO THE ORDER OF";
    if (el.id === "amount") el.text = moneyText();
    if (el.id === "amountWords") el.text = state.words;
    if (el.id === "memo") el.text = state.memo ? "Memo: " + state.memo : "";

    renderElements();
    syncSelectedFields();
    notify("Element updated.");
  }

  function bindInput(id, key, transform = value => value) {
    $(id).addEventListener("input", event => {
      state[key] = transform(event.target.value);
      if (key === "width" || key === "height") {
        state[key] = Math.max(key === "width" ? 60 : 30,
          Math.min(key === "width" ? 350 : 180, state[key] || 0));
        syncDimensions();
      }
      renderElements();
      if (key === "words") {
        const wordsEl = state.elements.find(e => e.id === "amountWords");
        if (wordsEl && selectedId === "amountWords") syncSelectedFields();
      }
    });
  }

  function refreshWords(force = true) {
    const result = amountToWords(state.amount);
    if (force) state.words = result;
    $("amountWordsInput").value = state.words;
    renderElements();
  }

  function readFormToState() {
    state.width = Number($("chequeWidth").value) || 165;
    state.height = Number($("chequeHeight").value) || 70;
    state.currency = $("currency").value;
    state.customCurrency = $("customCurrency").value;
    state.amount = $("amount").value;
    state.payee = $("payee").value;
    state.date = $("chequeDate").value;
    state.dateFormat = $("dateFormat").value;
    state.memo = $("memo").value;
    state.showRulers = $("showRulers").checked;
    state.showGrid = $("showGrid").checked;
    state.paperSize = $("paperSize").value;
    state.orientation = $("orientation").value;
    state.copies = Number($("copies").value) || 1;
    state.offsetX = Number($("offsetX").value) || 0;
    state.offsetY = Number($("offsetY").value) || 0;
    state.printGuides = $("printGuides").checked;
  }

  function syncFormFromState() {
    $("chequeWidth").value = state.width;
    $("chequeHeight").value = state.height;
    $("currency").value = state.currency;
    $("customCurrency").value = state.customCurrency || "";
    $("customCurrencyWrap").hidden = state.currency !== "custom";
    $("amount").value = state.amount;
    $("payee").value = state.payee;
    $("chequeDate").value = state.date;
    $("dateFormat").value = state.dateFormat;
    $("memo").value = state.memo;
    $("amountWordsInput").value = state.words;
    $("showRulers").checked = state.showRulers;
    $("showGrid").checked = state.showGrid;
    $("paperSize").value = state.paperSize;
    $("orientation").value = state.orientation;
    $("copies").value = String(state.copies);
    $("offsetX").value = state.offsetX;
    $("offsetY").value = state.offsetY;
    $("printGuides").checked = state.printGuides;
    syncDimensions();
    populateElementSelect();
    renderElements();
    syncSelectedFields();
  }

  function makeSnapshot() {
    readFormToState();
    return {
      app: "LinkTech Cheque Generator",
      version: 1,
      exportedAt: new Date().toISOString(),
      state: clone(state)
    };
  }

  function normalizeImported(data) {
    const source = data?.state || data;
    if (!source || typeof source !== "object") throw new Error("Invalid layout file.");

    const clean = clone(state);
    const allowed = [
      "width", "height", "currency", "customCurrency", "amount",
      "payee", "date", "dateFormat", "memo", "words", "showRulers",
      "showGrid", "paperSize", "orientation", "copies", "offsetX",
      "offsetY", "printGuides"
    ];
    allowed.forEach(key => {
      if (source[key] !== undefined) clean[key] = source[key];
    });

    clean.width = Math.max(60, Math.min(350, Number(clean.width) || 165));
    clean.height = Math.max(30, Math.min(180, Number(clean.height) || 70));
    clean.copies = [1, 2, 3, 4, 6].includes(Number(clean.copies)) ? Number(clean.copies) : 1;
    clean.dateFormat = ["DMY", "MDY", "YMD"].includes(clean.dateFormat) ? clean.dateFormat : "DMY";
    clean.currency = ["PHP", "USD", "custom"].includes(clean.currency) ? clean.currency : "PHP";

    if (!Array.isArray(source.elements)) throw new Error("This file does not contain cheque elements.");
    if (source.elements.length > 100) throw new Error("Too many elements in the layout.");

    clean.elements = source.elements.map((item, i) => {
      if (!item || typeof item !== "object") throw new Error("Invalid cheque element.");
      const el = {
        id: String(item.id || `text-${i}`).slice(0, 80),
        name: String(item.name || `Text ${i + 1}`).slice(0, 100),
        text: String(item.text ?? "").slice(0, 2000),
        x: Number(item.x) || 0,
        y: Number(item.y) || 0,
        w: Number(item.w) || 20,
        fs: Number(item.fs) || 12,
        color: /^#[0-9a-f]{6}$/i.test(item.color) ? item.color : "#172b4d",
        font: ["Arial, sans-serif", "Georgia, serif", "'Times New Roman', serif", "Verdana, sans-serif", "'Courier New', monospace"].includes(item.font) ? item.font : "Arial, sans-serif",
        bold: Boolean(item.bold),
        align: ["left", "center", "right"].includes(item.align) ? item.align : "left"
      };
      clampElementFor(el, clean.width, clean.height);
      return el;
    });

    if (!clean.elements.length) throw new Error("No elements found in the layout.");
    return clean;
  }

  function clampElementFor(el, width, height) {
    el.x = Math.max(0, Math.min(width - 5, el.x));
    el.y = Math.max(0, Math.min(height - 3, el.y));
    el.w = Math.max(5, Math.min(width - el.x, el.w));
    el.fs = Math.max(5, Math.min(72, el.fs));
  }

  function saveLayout() {
    const name = prompt("Enter a name for this cheque layout:", "My Cheque Layout");
    if (!name || !name.trim()) return;

    try {
      const snapshot = makeSnapshot();
      const layouts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const layout = {
        id: "layout-" + Date.now(),
        name: name.trim().slice(0, 100),
        savedAt: new Date().toISOString(),
        snapshot
      };
      layouts.unshift(layout);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts.slice(0, 50)));
      renderSavedLayouts();
      notify("Layout saved in this browser.");
    } catch (error) {
      notify("Could not save. Browser storage may be full.");
    }
  }

  function renderSavedLayouts() {
    const container = $("savedLayouts");
    container.replaceChildren();

    let layouts;
    try {
      layouts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      layouts = [];
    }

    if (!layouts.length) {
      const p = document.createElement("p");
      p.className = "hint";
      p.textContent = "No saved layouts yet. Save your first layout above.";
      container.append(p);
      return;
    }

    layouts.forEach(item => {
      const card = document.createElement("div");
      card.className = "saved-card";

      const title = document.createElement("strong");
      title.textContent = item.name;
      const meta = document.createElement("p");
      const savedDate = new Date(item.savedAt);
      meta.textContent = `${item.snapshot.state.width} × ${item.snapshot.state.height} mm · ${
        Number.isNaN(savedDate.getTime()) ? "" : savedDate.toLocaleString()
      }`;

      const actions = document.createElement("div");
      actions.className = "button-row";

      const load = document.createElement("button");
      load.className = "btn btn-primary";
      load.textContent = "Load";
      load.addEventListener("click", () => {
        try {
          state = normalizeImported(item.snapshot);
          selectedId = state.elements[0]?.id || "date";
          syncFormFromState();
          notify("Layout loaded.");
        } catch (error) {
          notify(error.message || "Unable to load layout.");
        }
      });

      const remove = document.createElement("button");
      remove.className = "btn btn-danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        const updated = layouts.filter(x => x.id !== item.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        renderSavedLayouts();
        notify("Saved layout deleted.");
      });

      actions.append(load, remove);
      card.append(title, meta, actions);
      container.append(card);
    });
  }

  function exportLayout() {
    const name = prompt("Name this exported layout:", "LinkTech-Cheque-Layout");
    if (name === null) return;
    const data = makeSnapshot();
    data.layoutName = name.trim() || "LinkTech-Cheque-Layout";

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (data.layoutName.replace(/[^a-z0-9_-]+/gi, "-") || "cheque-layout") + ".json";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Layout exported as JSON.");
  }

  function importLayoutFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        state = normalizeImported(data);
        selectedId = state.elements[0]?.id || "date";
        syncFormFromState();
        notify("Layout imported successfully.");
      } catch (error) {
        notify(error.message || "Import failed. Check the JSON file.");
      }
      $("importFile").value = "";
    };
    reader.onerror = () => notify("Unable to read that file.");
    reader.readAsText(file);
  }

  function duplicateElement() {
    const original = selectedElement();
    if (!original) return;
    const copy = clone(original);
    copy.id = "text-" + nextTextId++;
    copy.name = original.name + " Copy";
    copy.x = Math.min(state.width - 5, original.x + 3);
    copy.y = Math.min(state.height - 3, original.y + 3);
    state.elements.push(copy);
    selectedId = copy.id;
    populateElementSelect();
    renderElements();
    syncSelectedFields();
    notify("Element duplicated.");
  }

  function addText() {
    const el = {
      id: "text-" + nextTextId++,
      name: "Custom Text",
      text: "Enter text",
      x: 10, y: 10, w: 45, fs: 12,
      color: "#172b4d", font: "Arial, sans-serif",
      bold: false, align: "left"
    };
    state.elements.push(el);
    selectedId = el.id;
    populateElementSelect();
    renderElements();
    syncSelectedFields();
    notify("Text element added.");
  }

  function deleteElement() {
    const el = selectedElement();
    if (!el) return;
    if (["date", "payee", "amount", "amountWords"].includes(el.id)) {
      if (!confirm(`Delete the standard ${el.name} field? You can restore it by resetting the layout.`)) return;
    }
    state.elements = state.elements.filter(item => item.id !== selectedId);
    selectedId = state.elements[0]?.id || "";
    populateElementSelect();
    renderElements();
    syncSelectedFields();
    notify("Element deleted.");
  }

  function centerSelected() {
    const el = selectedElement();
    if (!el) return;
    el.x = Math.max(0, (state.width - el.w) / 2);
    el.y = Math.max(0, (state.height - 5) / 2);
    renderElements();
    syncSelectedFields();
  }

  function resetLayout() {
    if (!confirm("Reset the current cheque layout? Unsaved changes will be lost.")) return;
    state = {
      width: 165, height: 70, currency: "PHP", customCurrency: "",
      amount: "12345.67", payee: "", date: new Date().toISOString().slice(0, 10),
      dateFormat: "DMY", memo: "", words: amountToWords("12345.67"),
      showRulers: true, showGrid: false, paperSize: "a4",
      orientation: "portrait", copies: 1, offsetX: 0, offsetY: 0,
      printGuides: false, elements: defaultElements()
    };
    selectedId = "date";
    syncFormFromState();
    notify("Default layout restored.");
  }

  function buildPrintCheque() {
    const cheque = document.createElement("div");
    cheque.className = "cheque print-cheque";
    cheque.style.width = `${state.width}mm`;
    cheque.style.height = `${state.height}mm`;

    const border = document.createElement("div");
    border.className = "cheque-border";
    cheque.append(border);

    if (state.printGuides) cheque.classList.add("print-guide");

    const watermark = document.createElement("div");
    watermark.className = "cheque-watermark";
    watermark.textContent = "CHEQUE LAYOUT SAMPLE";
    cheque.append(watermark);

    state.elements.forEach(el => {
      const node = document.createElement("div");
      node.className = "cheque-element";
      node.textContent = el.text;
      node.style.left = `${el.x + state.offsetX}mm`;
      node.style.top = `${el.y + state.offsetY}mm`;
      node.style.width = `${Math.max(5, el.w)}mm`;
      node.style.fontSize = `${el.fs}px`;
      node.style.color = el.color;
      node.style.fontFamily = el.font;
      node.style.fontWeight = el.bold ? "700" : "400";
      node.style.textAlign = el.align;
      node.style.cursor = "default";
      cheque.append(node);
    });
    return cheque;
  }

  function paperDimensions() {
    const sizes = {
      a4: [210, 297],
      letter: [215.9, 279.4],
      legal: [215.9, 355.6],
      custom: [210, 297]
    };
    let [w, h] = sizes[state.paperSize] || sizes.a4;
    if (state.orientation === "landscape") [w, h] = [h, w];
    return { w, h };
  }

  function printCheque(mode = "normal") {
    readFormToState();
    updateDynamicTexts();
    printMode = mode;

    const existing = $("printRoot");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "printRoot";
    root.style.display = "none";

    const page = paperDimensions();
    const margin = 5;
    const gap = 2;
    const usableW = page.w - margin * 2;
    const usableH = page.h - margin * 2;
    const cols = Math.max(1, Math.floor((usableW + gap) / (state.width + gap)));
    const rows = Math.max(1, Math.floor((usableH + gap) / (state.height + gap)));
    const perPage = cols * rows;
    const copies = mode === "test" ? 1 : Math.max(1, Math.min(6, state.copies));
    const totalPages = Math.ceil(copies / perPage);

    const printStyle = document.createElement("style");
    printStyle.id = "dynamicPrintStyle";
    printStyle.textContent = `
      @page { size: ${page.w}mm ${page.h}mm; margin: ${margin}mm; }
      @media print {
        #printRoot { display:block !important; }
        .print-sheet {
          width:${usableW}mm; height:${usableH}mm;
          display:grid; grid-template-columns:repeat(${cols},${state.width}mm);
          grid-auto-rows:${state.height}mm;
          gap:${gap}mm; overflow:hidden;
          page-break-after:always; break-after:page;
        }
        .print-sheet:last-child { page-break-after:auto; break-after:auto; }
      }
    `;
    document.head.append(printStyle);

    let index = 0;
    for (let p = 0; p < totalPages; p++) {
      const sheet = document.createElement("div");
      sheet.className = "print-sheet";
      const count = Math.min(perPage, copies - index);
      for (let i = 0; i < count; i++) {
        sheet.append(buildPrintCheque());
        index++;
      }
      root.append(sheet);
    }
    document.body.append(root);

    const cleanup = () => {
      root.remove();
      printStyle.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(() => {
      if (root.isConnected) cleanup();
    }, 60000);
  }

  function wireEvents() {
    $("saveBtn").addEventListener("click", saveLayout);
    $("exportBtn").addEventListener("click", exportLayout);
    $("importBtn").addEventListener("click", () => $("importFile").click());
    $("importFile").addEventListener("change", e => importLayoutFile(e.target.files[0]));
    $("resetBtn").addEventListener("click", resetLayout);
    $("printBtn").addEventListener("click", () => printCheque("normal"));
    $("testPrintBtn").addEventListener("click", () => printCheque("test"));

    $("helpBtn").addEventListener("click", () => {
      $("instructions").scrollIntoView({ behavior: "smooth", block: "center" });
      $("instructions").animate(
        [{ outline: "2px solid #0785ff" }, { outline: "0 solid transparent" }],
        { duration: 900 }
      );
    });

    $("chequeWidth").addEventListener("change", () => {
      readFormToState();
      state.width = Math.max(60, Math.min(350, state.width));
      state.elements.forEach(el => clampElement(el));
      syncDimensions(); renderElements(); syncSelectedFields();
    });
    $("chequeHeight").addEventListener("change", () => {
      readFormToState();
      state.height = Math.max(30, Math.min(180, state.height));
      state.elements.forEach(el => clampElement(el));
      syncDimensions(); renderElements(); syncSelectedFields();
    });

    $("presetSize").addEventListener("change", () => {
      if ($("presetSize").value === "custom") return;
      const [w, h] = $("presetSize").value.split("x").map(Number);
      state.width = w; state.height = h;
      state.elements.forEach(el => clampElement(el));
      syncFormFromState();
    });

    ["currency", "customCurrency"].forEach(id => {
      $(id).addEventListener("input", () => {
        state.currency = $("currency").value;
        state.customCurrency = $("customCurrency").value;
        $("customCurrencyWrap").hidden = state.currency !== "custom";
        refreshWords();
      });
    });

    $("amount").addEventListener("input", () => {
      state.amount = $("amount").value;
      state.words = amountToWords(state.amount);
      $("amountWordsInput").value = state.words;
      renderElements();
      if (selectedId === "amountWords") syncSelectedFields();
    });

    $("amountWordsInput").addEventListener("input", () => {
      state.words = $("amountWordsInput").value;
      const el = state.elements.find(e => e.id === "amountWords");
      if (el) el.text = state.words;
      renderElements();
      if (selectedId === "amountWords") syncSelectedFields();
    });

    $("payee").addEventListener("input", () => {
      state.payee = $("payee").value;
      renderElements();
    });
    $("chequeDate").addEventListener("change", () => {
      state.date = $("chequeDate").value;
      renderElements();
    });
    $("dateFormat").addEventListener("change", () => {
      state.dateFormat = $("dateFormat").value;
      renderElements();
    });
    $("memo").addEventListener("input", () => {
      state.memo = $("memo").value;
      renderElements();
    });

    ["showRulers", "showGrid"].forEach(id => {
      $(id).addEventListener("change", () => {
        state.showRulers = $("showRulers").checked;
        state.showGrid = $("showGrid").checked;
        syncDimensions();
      });
    });

    ["paperSize", "orientation", "copies", "offsetX", "offsetY", "printGuides"].forEach(id => {
      $(id).addEventListener("change", readFormToState);
    });

    $("elementSelect").addEventListener("change", () => {
      selectedId = $("elementSelect").value;
      renderElements();
      syncSelectedFields();
    });
    $("applyElementBtn").addEventListener("click", applyElementChanges);
    $("duplicateBtn").addEventListener("click", duplicateElement);
    $("addTextBtn").addEventListener("click", addText);
    $("deleteElementBtn").addEventListener("click", deleteElement);
    $("centerElementBtn").addEventListener("click", centerSelected);
    $("fitViewBtn").addEventListener("click", () => {
      $("cheque").scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      notify("Preview positioned in view.");
    });

    $("cheque").addEventListener("click", event => {
      if (event.target.closest(".cheque-element")) return;
      document.querySelectorAll(".cheque-element.selected").forEach(node => node.classList.remove("selected"));
    });

    window.addEventListener("beforeunload", () => {
      // Saved layouts persist in localStorage; unsaved edits are not automatically saved.
    });
  }

  function init() {
    state.words = amountToWords(state.amount);
    syncFormFromState();
    wireEvents();
    renderSavedLayouts();
    notify("Cheque Generator is ready.");
  }

  init();
})();
