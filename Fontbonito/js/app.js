
"use strict";

/* =========================================
   FONT BONITO - LINKTECH
========================================= */

const inputText = document.getElementById("inputText");
const caseStyle = document.getElementById("caseStyle");
const fontFamily = document.getElementById("fontFamily");
const fontSize = document.getElementById("fontSize");
const fontColor = document.getElementById("fontColor");

const preview = document.getElementById("preview");
const charCount = document.getElementById("charCount");
const outputCount = document.getElementById("outputCount");
const colorHex = document.getElementById("colorHex");
const statusMessage = document.getElementById("statusMessage");
const storageNote = document.getElementById("storageNote");

const pasteBtn = document.getElementById("pasteBtn");
const saveBtn = document.getElementById("saveBtn");
const clearBtn = document.getElementById("clearBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");
const selectBtn = document.getElementById("selectBtn");
const colorPresets = document.getElementById("colorPresets");

const MAX_CHARACTERS = 1000;
const DATABASE_NAME = "FontBonitoDB";
const DATABASE_VERSION = 1;
const STORE_NAME = "drafts";

let db = null;
let saveTimer = null;
let messageTimer = null;

const DEFAULTS = {
  caseStyle: "original",
  fontFamily: "Arial, sans-serif",
  fontSize: "16",
  fontColor: "#1677d2"
};

/* =========================================
   INDEXEDDB
========================================= */

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }

    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: "id"
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
      reject(request.error || new Error("Database unavailable."));
    };
  });
}

function saveDraft() {
  if (!db) {
    return Promise.reject(new Error("Database unavailable."));
  }

  const record = {
    id: "current-draft",
    text: inputText.value.slice(0, MAX_CHARACTERS),
    caseStyle: caseStyle.value,
    fontFamily: fontFamily.value,
    fontSize: fontSize.value,
    fontColor: fontColor.value,
    updatedAt: Date.now()
  };

  return new Promise((resolve, reject) => {
    let transaction;

    try {
      transaction = db.transaction(STORE_NAME, "readwrite");

      transaction.objectStore(STORE_NAME).put(record);

      transaction.oncomplete = () => resolve(record);

      transaction.onerror = () => {
        reject(transaction.error || new Error("Save failed."));
      };

      transaction.onabort = () => {
        reject(transaction.error || new Error("Save cancelled."));
      };
    } catch (error) {
      reject(error);
    }
  });
}

function loadDraft() {
  if (!db) {
    return Promise.reject(new Error("Database unavailable."));
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction
      .objectStore(STORE_NAME)
      .get("current-draft");

    request.onsuccess = () => resolve(request.result || null);

    request.onerror = () => {
      reject(request.error || new Error("Load failed."));
    };
  });
}

/* =========================================
   TEXT CASE FORMATTING
========================================= */

function toTitleCase(text) {
  return text.toLowerCase().replace(
    /(^|[\s\-–—])([^\s\-–—])/gu,
    (match, separator, character) =>
      separator + character.toUpperCase()
  );
}

function toSentenceCase(text) {
  const lower = text.toLowerCase();

  let result = "";
  let capitalizeNext = true;

  for (const character of lower) {
    if (capitalizeNext && /\p{L}/u.test(character)) {
      result += character.toUpperCase();
      capitalizeNext = false;
    } else {
      result += character;
    }

    if (/[.!?]/u.test(character)) {
      capitalizeNext = true;
    }
  }

  return result;
}

function toAlternatingCase(text) {
  let index = 0;

  return [...text].map(character => {
    if (!/\p{L}/u.test(character)) {
      return character;
    }

    const result = index % 2 === 0
      ? character.toLowerCase()
      : character.toUpperCase();

    index++;
    return result;
  }).join("");
}

function formatText(text, style) {
  switch (style) {
    case "upper":
      return text.toUpperCase();

    case "lower":
      return text.toLowerCase();

    case "title":
      return toTitleCase(text);

    case "sentence":
      return toSentenceCase(text);

    case "alternating":
      return toAlternatingCase(text);

    case "original":
    default:
      return text;
  }
}

/* =========================================
   COLOR PRESETS
========================================= */

function updateColorSelection() {
  const selectedColor = fontColor.value.toUpperCase();

  colorHex.textContent = selectedColor;

  document.querySelectorAll(".color-swatch").forEach(button => {
    const isSelected =
      button.dataset.color.toUpperCase() === selectedColor;

    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

colorPresets.addEventListener("click", event => {
  const button = event.target.closest(".color-swatch");

  if (!button) return;

  const selectedColor = button.dataset.color;

  if (!/^#[0-9a-f]{6}$/i.test(selectedColor)) return;

  fontColor.value = selectedColor;

  updatePreview();

  showMessage(`Font color changed to ${selectedColor.toUpperCase()}.`);
});

/* =========================================
   LIVE PREVIEW
========================================= */

function updatePreview() {
  const originalText = inputText.value.slice(0, MAX_CHARACTERS);
  const formattedText = formatText(originalText, caseStyle.value);

  charCount.textContent =
    `${originalText.length} / ${MAX_CHARACTERS} characters`;

  outputCount.textContent =
    `${formattedText.length} characters`;

  preview.textContent = formattedText ||
    "Your formatted text will appear here...";

  preview.classList.toggle("empty-preview", !formattedText);

  preview.style.fontFamily = fontFamily.value;
  preview.style.fontSize = `${fontSize.value}px`;
  preview.style.color = fontColor.value;

  updateColorSelection();
  scheduleAutoSave();
}

/* =========================================
   AUTO-SAVE
========================================= */

function scheduleAutoSave() {
  clearTimeout(saveTimer);

  if (!db) return;

  storageNote.textContent = "Saving your latest changes...";

  saveTimer = setTimeout(async () => {
    try {
      await saveDraft();

      storageNote.textContent =
        "✓ Draft and formatting saved on this device.";
    } catch (error) {
      console.error("Auto-save failed:", error);

      storageNote.textContent =
        "Unable to save locally. Try Save Text again.";
    }
  }, 500);
}

/* =========================================
   STATUS MESSAGE
========================================= */

function showMessage(message, isError = false) {
  clearTimeout(messageTimer);

  statusMessage.textContent = message;
  statusMessage.style.color = isError
    ? "#c0392b"
    : "#1677a9";

  messageTimer = setTimeout(() => {
    statusMessage.textContent = "";
  }, 4000);
}

/* =========================================
   COPY ALL FORMATTED TEXT
========================================= */

async function copyFormattedText() {
  const text = formatText(inputText.value, caseStyle.value);

  if (!text.trim()) {
    showMessage("Please enter text before copying.", true);
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const temporary = document.createElement("textarea");

      temporary.value = text;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.left = "-9999px";

      document.body.appendChild(temporary);
      temporary.select();

      const copied = document.execCommand("copy");
      temporary.remove();

      if (!copied) {
        throw new Error("Clipboard copy failed.");
      }
    }

    showMessage("✓ All formatted text copied successfully!");
  } catch (error) {
    console.error("Copy failed:", error);

    showMessage(
      "Copy blocked. Select the output and copy manually.",
      true
    );

    selectOutput();
  }
}

/* =========================================
   PASTE FROM CLIPBOARD
========================================= */

async function pasteFromClipboard() {
  try {
    if (!navigator.clipboard?.readText) {
      throw new Error("Clipboard reading is unavailable.");
    }

    const text = await navigator.clipboard.readText();

    if (!text) {
      showMessage("Your clipboard is empty.", true);
      return;
    }

    inputText.value = text.slice(0, MAX_CHARACTERS);

    updatePreview();

    if (text.length > MAX_CHARACTERS) {
      showMessage("Text limited to the first 1,000 characters.");
    } else {
      showMessage("✓ Text pasted successfully.");
    }
  } catch (error) {
    console.error("Paste failed:", error);

    showMessage(
      "Clipboard access blocked. Paste directly into the text box.",
      true
    );

    inputText.focus();
  }
}

/* =========================================
   SELECT OUTPUT
========================================= */

function selectOutput() {
  if (!inputText.value.trim()) {
    showMessage("There is no output to select.", true);
    return;
  }

  const selection = window.getSelection();
  const range = document.createRange();

  range.selectNodeContents(preview);
  selection.removeAllRanges();
  selection.addRange(range);

  showMessage("Output selected. Use your device's Copy command.");
}

/* =========================================
   MANUAL SAVE
========================================= */

async function saveCurrentText() {
  if (!db) {
    showMessage("Local database is unavailable.", true);
    return;
  }

  clearTimeout(saveTimer);

  try {
    await saveDraft();

    storageNote.textContent =
      "✓ Draft and formatting saved on this device.";

    showMessage("✓ Your text and settings have been saved.");
  } catch (error) {
    console.error("Manual save failed:", error);

    showMessage("Unable to save your draft.", true);
  }
}

/* =========================================
   CLEAR TEXT
========================================= */

async function clearText() {
  inputText.value = "";

  updatePreview();
  clearTimeout(saveTimer);

  if (db) {
    try {
      await saveDraft();
      showMessage("Text cleared and empty draft saved.");
    } catch (error) {
      showMessage("Text cleared, but saving failed.", true);
    }
  } else {
    showMessage("Text cleared.");
  }
}

/* =========================================
   RESET FORMATTING
========================================= */

function resetFormatting() {
  caseStyle.value = DEFAULTS.caseStyle;
  fontFamily.value = DEFAULTS.fontFamily;
  fontSize.value = DEFAULTS.fontSize;
  fontColor.value = DEFAULTS.fontColor;

  updatePreview();
  showMessage("✓ Formatting reset to default settings.");
}

/* =========================================
   RESTORE SAVED DRAFT
========================================= */

async function restoreDraft() {
  try {
    await openDatabase();

    storageNote.textContent = "Local database ready.";

    const draft = await loadDraft();

    if (draft) {
      inputText.value = String(draft.text || "")
        .slice(0, MAX_CHARACTERS);

      const validCases = [
        "original",
        "upper",
        "lower",
        "title",
        "sentence",
        "alternating"
      ];

      if (validCases.includes(draft.caseStyle)) {
        caseStyle.value = draft.caseStyle;
      }

      const validFonts = Array.from(fontFamily.options)
        .map(option => option.value);

      if (validFonts.includes(draft.fontFamily)) {
        fontFamily.value = draft.fontFamily;
      }

      const validSizes = Array.from(fontSize.options)
        .map(option => option.value);

      if (validSizes.includes(String(draft.fontSize))) {
        fontSize.value = String(draft.fontSize);
      }

      if (/^#[0-9a-f]{6}$/i.test(draft.fontColor || "")) {
        fontColor.value = draft.fontColor;
      }
    }

    updatePreview();

    storageNote.textContent = draft
      ? "✓ Your previous draft and formatting were restored."
      : "✓ Ready. Your draft will save locally as you work.";

  } catch (error) {
    console.error("Database initialization failed:", error);

    db = null;

    storageNote.textContent =
      "Local storage unavailable. Text formatting still works.";

    updatePreview();
  }
}

/* =========================================
   EVENT LISTENERS
========================================= */

inputText.addEventListener("input", () => {
  if (inputText.value.length > MAX_CHARACTERS) {
    inputText.value = inputText.value.slice(0, MAX_CHARACTERS);
  }

  updatePreview();
});

caseStyle.addEventListener("change", updatePreview);
fontFamily.addEventListener("change", updatePreview);
fontSize.addEventListener("change", updatePreview);
fontColor.addEventListener("input", updatePreview);

pasteBtn.addEventListener("click", pasteFromClipboard);
saveBtn.addEventListener("click", saveCurrentText);
clearBtn.addEventListener("click", clearText);
resetBtn.addEventListener("click", resetFormatting);
copyBtn.addEventListener("click", copyFormattedText);
selectBtn.addEventListener("click", selectOutput);

/* START APP */

restoreDraft();
