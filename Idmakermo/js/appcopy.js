
"use strict";

/* =========================================
   ID MAKER MO — LINKTECH
   Canvas editor + IndexedDB + PNG + print
========================================= */

const $ = (id) => document.getElementById(id);

const canvas = $("idCanvas");
const ctx = canvas.getContext("2d");

const DB_NAME = "LinkTechIDMakerMo";
const DB_VERSION = 1;
const STORE_NAME = "records";

const BASE_WIDTH = 1012;
const MM_PER_INCH = 25.4;
const CSS_DPI = 96;

let db;
let currentSide = "front";
let selectedId = null;
let dragState = null;
let nextElementId = 1;
let currentRecordId = null;
let searchTimer = null;

const project = {
  name: "",
  dimensions: { width: 85.6, height: 53.98 },
  front: {
    background: "#ffffff",
    backgroundImage: null,
    elements: []
  },
  back: {
    background: "#ffffff",
    backgroundImage: null,
    elements: []
  }
};

const imageCache = new Map();

function makeId() {
  return "el_" + Date.now().toString(36) + "_" + nextElementId++;
}

function currentDesign() {
  return project[currentSide];
}

function selectedElement() {
  return currentDesign().elements.find(
    (element) => element.id === selectedId
  ) || null;
}

function setStatus(message, error = false) {
  const status = $("appStatus");
  status.textContent = message;
  status.style.color = error ? "#b42332" : "#35658f";
  status.style.background = error ? "#fff2f3" : "#eef8ff";
  status.style.borderColor = error ? "#f1c7cc" : "#d4ecff";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

/* ---------- IndexedDB ---------- */

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, {
          keyPath: "id"
        });

        store.createIndex("updatedAt", "updatedAt", {
          unique: false
        });
      }
    };

    request.onsuccess = () => {
      db = request.result;

      db.onversionchange = () => {
        db.close();
      };

      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

function databaseRequest(mode, action) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database is not ready."));
      return;
    }

    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let request;

    try {
      request = action(store);
    } catch (error) {
      reject(error);
      return;
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.onabort = () => {
      reject(transaction.error || new Error("Database transaction aborted."));
    };
  });
}

async function saveToDatabase(record) {
  return databaseRequest("readwrite", (store) => store.put(record));
}

async function getAllRecords() {
  return databaseRequest("readonly", (store) => store.getAll());
}

async function getRecord(id) {
  return databaseRequest("readonly", (store) => store.get(id));
}

async function deleteRecord(id) {
  return databaseRequest("readwrite", (store) => store.delete(id));
}

/* ---------- Image loading ---------- */

function loadImage(src) {
  if (!src) return Promise.resolve(null);

  if (imageCache.has(src)) {
    const cached = imageCache.get(src);
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }

    if (cached.complete && cached.naturalWidth === 0) {
      imageCache.delete(src);
    } else {
      return new Promise((resolve, reject) => {
        cached.addEventListener("load", () => resolve(cached), {
          once: true
        });
        cached.addEventListener("error", () => reject(
          new Error("Image could not be loaded.")
        ), { once: true });
      });
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    imageCache.set(src, img);

    img.onload = () => resolve(img);
    img.onerror = () => {
      imageCache.delete(src);
      reject(new Error("Image could not be loaded."));
    };

    img.src = src;
  });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please select an image file."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/* ---------- Canvas dimensions ---------- */

function getCardPixels() {
  const widthMM = project.dimensions.width;
  const heightMM = project.dimensions.height;

  const width = BASE_WIDTH;
  const height = Math.max(
    120,
    Math.round(width * heightMM / widthMM)
  );

  return { width, height };
}

function mmScale() {
  return canvas.width / project.dimensions.width;
}

function mmToPx(value) {
  return value * mmScale();
}

function pxToMM(value) {
  return value / mmScale();
}

function setDimensions(width, height) {
  width = Number(width);
  height = Number(height);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 30 || width > 300 ||
    height < 20 || height > 300
  ) {
    setStatus("Use card dimensions between 30–300 mm wide and 20–300 mm high.", true);
    return false;
  }

  project.dimensions = { width, height };

  const pixels = getCardPixels();
  canvas.width = pixels.width;
  canvas.height = pixels.height;

  $("canvasDimensions").textContent =
    `${width.toFixed(2)} × ${height.toFixed(2)} mm`;

  render();
  return true;
}

function applyPreset() {
  const preset = $("cardPreset").value;
  $("customDimensions").classList.toggle(
    "hidden",
    preset !== "custom"
  );

  if (preset === "cr80") {
    $("cardWidth").value = "85.6";
    $("cardHeight").value = "53.98";
    setDimensions(85.6, 53.98);
  } else if (preset === "portrait") {
    $("cardWidth").value = "53.98";
    $("cardHeight").value = "85.6";
    setDimensions(53.98, 85.6);
  } else {
    setDimensions($("cardWidth").value, $("cardHeight").value);
  }
}

/* ---------- Canvas rendering ---------- */

function roundedRectPath(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

async function render() {
  const design = currentDesign();
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = design.background || "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (design.backgroundImage) {
    try {
      const background = await loadImage(design.backgroundImage);
      ctx.drawImage(background, 0, 0, width, height);
    } catch (error) {
      console.warn(error);
    }
  }

  for (const element of design.elements) {
    await drawElement(element);
  }

  $("activeSideLabel").textContent = currentSide.toUpperCase();
  $("backgroundColor").value = design.background || "#ffffff";

  updateSelectionEditor();
}

async function drawElement(element) {
  const scale = mmScale();
  const x = element.x * scale;
  const y = element.y * scale;
  const width = (element.width || 0) * scale;
  const height = (element.height || 0) * scale;

  ctx.save();

  if (element.type === "text") {
    const size = Math.max(1, (element.fontSize || 12) * CSS_DPI / 72 * scale / (CSS_DPI / 96));
    ctx.font = `${element.fontWeight || "normal"} ${size}px "${element.fontFamily || "Arial"}"`;
    ctx.textBaseline = "top";
    ctx.textAlign = element.align || "left";
    ctx.fillStyle = element.color || "#172554";

    const lines = String(element.text || "").split("\n");
    const lineHeight = size * 1.25;
    const textX = x;

    lines.forEach((line, index) => {
      ctx.fillText(line, textX, y + index * lineHeight);
    });

    if (element.id === selectedId) {
      const measured = Math.max(
        8,
        ...lines.map((line) => ctx.measureText(line).width)
      );

      const boxWidth = element.width
        ? element.width * scale
        : measured + 4;

      const boxHeight = element.height
        ? element.height * scale
        : lines.length * lineHeight;

      drawSelectionBox(x, y, boxWidth, boxHeight);
    }
  }

  if (element.type === "image") {
    try {
      const img = await loadImage(element.src);

      if (element.circle) {
        ctx.beginPath();
        ctx.ellipse(
          x + width / 2,
          y + height / 2,
          width / 2,
          height / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.clip();
      }

      // Cover-crop to preserve the image's natural proportions.
      const ratio = Math.max(
        width / img.naturalWidth,
        height / img.naturalHeight
      );

      const cropWidth = width / ratio;
      const cropHeight = height / ratio;
      const cropX = (img.naturalWidth - cropWidth) / 2;
      const cropY = (img.naturalHeight - cropHeight) / 2;

      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        x, y, width, height
      );

      ctx.restore();
      ctx.save();

      if (element.id === selectedId) {
        drawSelectionBox(x, y, width, height);
      }
    } catch (error) {
      ctx.fillStyle = "#ffe8e8";
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = "#a12232";
      ctx.font = "14px Arial";
      ctx.fillText("Image unavailable", x + 4, y + 4);
    }
  }

  ctx.restore();
}

function drawSelectionBox(x, y, width, height) {
  ctx.save();
  ctx.strokeStyle = "#0785ff";
  ctx.lineWidth = Math.max(1.5, canvas.width / 500);
  ctx.setLineDash([7, 5]);
  ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
  ctx.setLineDash([]);
  ctx.restore();
}

/* ---------- Elements ---------- */

function addText() {
  const element = {
    id: makeId(),
    type: "text",
    text: "Your text here",
    x: 5,
    y: 5,
    width: 35,
    height: 6,
    fontSize: 12,
    fontFamily: "Arial",
    fontWeight: "bold",
    color: "#172554",
    align: "left"
  };

  currentDesign().elements.push(element);
  selectedId = element.id;
  render();
}

async function addImage(src) {
  try {
    const img = await loadImage(src);

    const cardWidth = project.dimensions.width;
    const cardHeight = project.dimensions.height;

    const maxWidth = Math.min(25, cardWidth * 0.35);
    const maxHeight = Math.min(30, cardHeight * 0.55);
    const aspect = img.naturalWidth / img.naturalHeight;

    let width = maxWidth;
    let height = width / aspect;

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspect;
    }

    const element = {
      id: makeId(),
      type: "image",
      src,
      x: Math.max(0, (cardWidth - width) / 2),
      y: Math.max(0, (cardHeight - height) / 2),
      width,
      height,
      circle: false
    };

    currentDesign().elements.push(element);
    selectedId = element.id;
    await render();
  } catch (error) {
    setStatus(error.message, true);
  }
}

function updateSelectionEditor() {
  const element = selectedElement();
  const isSelected = Boolean(element);

  $("emptySelection").classList.toggle("hidden", isSelected);
  $("elementEditor").classList.toggle("hidden", !isSelected);

  if (!element) {
    return;
  }

  const isText = element.type === "text";

  $("elementText").value = isText ? element.text : "";
  $("elementText").disabled = !isText;
  $("textProperties").classList.toggle("hidden", !isText);
  $("imageProperties").classList.toggle("hidden", isText);

  $("elementX").value = Number(element.x.toFixed(2));
  $("elementY").value = Number(element.y.toFixed(2));

  if (isText) {
    $("fontSize").value = element.fontSize || 12;
    $("fontFamily").value = element.fontFamily || "Arial";
    $("textColor").value = element.color || "#172554";
    $("fontWeight").value = element.fontWeight || "normal";
  } else {
    $("imageWidth").value = Number(element.width.toFixed(2));
    $("imageHeight").value = Number(element.height.toFixed(2));
    $("imageCircle").checked = Boolean(element.circle);
  }
}

function updateSelectedElement() {
  const element = selectedElement();
  if (!element) return;

  const isText = element.type === "text";

  element.x = Number($("elementX").value) || 0;
  element.y = Number($("elementY").value) || 0;

  if (isText) {
    element.text = $("elementText").value;
    element.fontSize = Math.max(
      3, Math.min(100, Number($("fontSize").value) || 12)
    );
    element.fontFamily = $("fontFamily").value;
    element.color = $("textColor").value;
    element.fontWeight = $("fontWeight").value;
  } else {
    element.width = Math.max(
      2, Math.min(300, Number($("imageWidth").value) || 10)
    );
    element.height = Math.max(
      2, Math.min(300, Number($("imageHeight").value) || 10)
    );
    element.circle = $("imageCircle").checked;
  }

  render();
}

function deleteSelectedElement() {
  if (!selectedId) return;

  currentDesign().elements = currentDesign().elements.filter(
    (element) => element.id !== selectedId
  );

  selectedId = null;
  render();
}

function duplicateSelectedElement() {
  const element = selectedElement();
  if (!element) return;

  const copy = JSON.parse(JSON.stringify(element));
  copy.id = makeId();
  copy.x += 3;
  copy.y += 3;

  currentDesign().elements.push(copy);
  selectedId = copy.id;
  render();
}

/* ---------- Mouse and touch dragging ---------- */

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height
  };
}

function elementBounds(element) {
  const scale = mmScale();

  if (element.type === "image") {
    return {
      x: element.x * scale,
      y: element.y * scale,
      width: element.width * scale,
      height: element.height * scale
    };
  }

  ctx.save();
  const size = (element.fontSize || 12) * CSS_DPI / 72 * scale / (CSS_DPI / 96);
  ctx.font = `${element.fontWeight || "normal"} ${size}px "${element.fontFamily || "Arial"}"`;

  const lines = String(element.text || "").split("\n");
  const width = Math.max(8, ...lines.map((line) => ctx.measureText(line).width));
  const height = lines.length * size * 1.25;
  ctx.restore();

  return {
    x: element.x * scale,
    y: element.y * scale,
    width: (element.width ? element.width * scale : width + 4),
    height: (element.height ? element.height * scale : height)
  };
}

canvas.addEventListener("pointerdown", (event) => {
  const point = pointerPosition(event);
  const elements = currentDesign().elements;

  selectedId = null;

  // Search in reverse drawing order so the topmost item wins.
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    const bounds = elementBounds(element);

    if (
      point.x >= bounds.x - 4 &&
      point.x <= bounds.x + bounds.width + 4 &&
      point.y >= bounds.y - 4 &&
      point.y <= bounds.y + bounds.height + 4
    ) {
      selectedId = element.id;
      dragState = {
        pointerId: event.pointerId,
        startX: point.x,
        startY: point.y,
        originalX: element.x,
        originalY: element.y
      };
      canvas.setPointerCapture(event.pointerId);
      break;
    }
  }

  render();
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragState || dragState.pointerId !== event.pointerId) return;

  const element = selectedElement();
  if (!element) return;

  const point = pointerPosition(event);

  element.x = Math.max(
    0,
    Math.min(
      project.dimensions.width - 1,
      dragState.originalX + pxToMM(point.x - dragState.startX)
    )
  );

  element.y = Math.max(
    0,
    Math.min(
      project.dimensions.height - 1,
      dragState.originalY + pxToMM(point.y - dragState.startY)
    )
  );

  render();
});

function stopDragging(event) {
  if (dragState && event.pointerId === dragState.pointerId) {
    dragState = null;
  }
}

canvas.addEventListener("pointerup", stopDragging);
canvas.addEventListener("pointercancel", stopDragging);

$("deselectElement").addEventListener("click", () => {
  selectedId = null;
  render();
});

/* ---------- Save and load projects ---------- */

function createRecord() {
  const now = new Date().toISOString();

  return {
    id: currentRecordId || crypto.randomUUID(),
    name: $("projectName").value.trim() || "Untitled ID",
    dimensions: { ...project.dimensions },
    front: structuredClone(project.front),
    back: structuredClone(project.back),
    createdAt: now,
    updatedAt: now
  };
}

async function saveProject() {
  try {
    const record = createRecord();

    if (currentRecordId) {
      const existing = await getRecord(currentRecordId);
      if (existing) record.createdAt = existing.createdAt;
    }

    await saveToDatabase(record);
    currentRecordId = record.id;
    project.name = record.name;

    await refreshRecords();
    setStatus(`Saved "${record.name}" successfully on this device.`);
  } catch (error) {
    console.error(error);
    setStatus(
      "Could not save. Browser storage may be full or unavailable. Export your work and check storage permissions.",
      true
    );
  }
}

async function loadProject(id) {
  try {
    const record = await getRecord(id);
    if (!record) {
      setStatus("That saved record could not be found.", true);
      return;
    }

    currentRecordId = record.id;
    project.name = record.name;
    project.dimensions = { ...record.dimensions };
    project.front = structuredClone(record.front);
    project.back = structuredClone(record.back);

    $("projectName").value = record.name;
    $("cardPreset").value = "custom";
    $("customDimensions").classList.remove("hidden");
    $("cardWidth").value = project.dimensions.width;
    $("cardHeight").value = project.dimensions.height;

    setDimensions(project.dimensions.width, project.dimensions.height);
    selectedId = null;

    await render();
    setStatus(`Opened "${record.name}".`);
    $("preview-panel");
  } catch (error) {
    console.error(error);
    setStatus("Could not open the selected record.", true);
  }
}

function newProject() {
  if (!confirm("Start a new ID project? Save your current changes first.")) {
    return;
  }

  currentRecordId = null;
  selectedId = null;
  project.name = "";
  project.dimensions = { width: 85.6, height: 53.98 };

  project.front = {
    background: "#ffffff",
    backgroundImage: null,
    elements: []
  };

  project.back = {
    background: "#ffffff",
    backgroundImage: null,
    elements: []
  };

  $("projectName").value = "";
  $("cardPreset").value = "cr80";
  $("backgroundImage").value = "";
  $("cardWidth").value = "85.6";
  $("cardHeight").value = "53.98";
  $("customDimensions").classList.add("hidden");

  setDimensions(85.6, 53.98);
  setStatus("New project created.");
}

async function removeProject(id) {
  const record = await getRecord(id);
  if (!record) return;

  if (!confirm(`Permanently delete "${record.name}" from this browser?`)) {
    return;
  }

  try {
    await deleteRecord(id);

    if (currentRecordId === id) {
      currentRecordId = null;
    }

    await refreshRecords();
    setStatus("Record deleted.");
  } catch (error) {
    setStatus("Could not delete the record.", true);
  }
}

async function refreshRecords() {
  const allRecords = await getAllRecords();
  const query = $("recordSearch").value.trim().toLowerCase();

  const records = allRecords
    .filter((record) => record.name.toLowerCase().includes(query))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  $("recordCount").textContent =
    `${allRecords.length} record${allRecords.length === 1 ? "" : "s"}`;

  if (!records.length) {
    $("recordsList").innerHTML =
      '<div class="empty-records">No matching records found.</div>';
    return;
  }

  $("recordsList").innerHTML = records.map((record) => `
    <article class="record-card">
      <div class="record-info">
        <strong>${escapeHTML(record.name)}</strong>
        <small>
          ${Number(record.dimensions.width).toFixed(2)} ×
          ${Number(record.dimensions.height).toFixed(2)} mm ·
          Updated ${escapeHTML(new Date(record.updatedAt).toLocaleString())}
        </small>
      </div>
      <div class="record-actions">
        <button type="button" data-open="${escapeHTML(record.id)}">Open</button>
        <button type="button" data-copy="${escapeHTML(record.id)}">Duplicate</button>
        <button type="button" class="record-delete"
          data-delete="${escapeHTML(record.id)}">Delete</button>
      </div>
    </article>
  `).join("");
}

async function duplicateProject(id) {
  try {
    const original = await getRecord(id);
    if (!original) return;

    const copy = structuredClone(original);
    copy.id = crypto.randomUUID();
    copy.name = `${original.name} (Copy)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;

    await saveToDatabase(copy);
    await refreshRecords();
    setStatus(`Created a copy of "${original.name}".`);
  } catch (error) {
    setStatus("Could not duplicate this record.", true);
  }
}

$("recordsList").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.open) {
    await loadProject(button.dataset.open);
  } else if (button.dataset.copy) {
    await duplicateProject(button.dataset.copy);
  } else if (button.dataset.delete) {
    await removeProject(button.dataset.delete);
  }
});

/* ---------- PNG export ---------- */

async function makeExportBlob(side) {
  const oldSide = currentSide;
  const oldSelection = selectedId;

  currentSide = side;
  selectedId = null;

  try {
    await render();

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) throw new Error("Could not create PNG image.");
    return blob;
  } finally {
    currentSide = oldSide;
    selectedId = oldSelection;
    await render();
  }
}

async function exportPNG(side) {
  try {
    const blob = await makeExportBlob(side);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const name = ($("projectName").value.trim() || "id-card")
      .replace(/[^\w-]+/g, "-");

    link.href = url;
    link.download = `${name}-${side}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setStatus(`${side === "front" ? "Front" : "Back"} PNG exported.`);
  } catch (error) {
    console.error(error);
    setStatus("PNG export failed. Try a smaller image or a different browser.", true);
  }
}

/* ---------- Printing ---------- */

async function printCards() {
  let printWindow;

  try {
    const frontBlob = await makeExportBlob("front");
    const backBlob = await makeExportBlob("back");

    const frontURL = URL.createObjectURL(frontBlob);
    const backURL = URL.createObjectURL(backBlob);

    printWindow = window.open("", "_blank");

    if (!printWindow) {
      URL.revokeObjectURL(frontURL);
      URL.revokeObjectURL(backURL);
      setStatus("Printing window blocked. Allow pop-ups for this site and try again.", true);
      return;
    }

    const width = project.dimensions.width;
    const height = project.dimensions.height;

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>ID Maker Mo - Print</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111;
            font-family: Arial, sans-serif;
          }
          .print-page {
            width: 100%;
            min-height: 270mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding-top: 20mm;
            page-break-after: always;
            break-after: page;
          }
          .print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .label {
            margin-bottom: 8mm;
            font-size: 10pt;
          }
          img {
            display: block;
            width: ${width}mm;
            height: ${height}mm;
            max-width: 100%;
            object-fit: fill;
          }
          .instructions {
            margin-top: 10mm;
            max-width: 150mm;
            font-size: 9pt;
            line-height: 1.5;
          }
          @media screen {
            body { padding: 20px; background: #eef5fb; }
            .print-page {
              min-height: 0;
              padding: 20px;
              margin: 0 auto 20px;
              background: white;
              box-shadow: 0 2px 15px #ccd8e5;
            }
          }
        </style>
      </head>
      <body>
        <section class="print-page">
          <div class="label">FRONT SIDE — ${escapeHTML($("projectName").value || "ID Card")}</div>
          <img id="frontImage" src="${frontURL}" alt="Front of ID card">
          <p class="instructions">
            Select Actual Size / 100% scale in the print dialog.
            Disable Fit to Page if your printer offers that option.
          </p>
        </section>
        <section class="print-page">
          <div class="label">BACK SIDE — ${escapeHTML($("projectName").value || "ID Card")}</div>
          <img id="backImage" src="${backURL}" alt="Back of ID card">
          <p class="instructions">
            This is a two-page layout. For double-sided printing, verify the
            printer's duplex and flip-edge settings before printing on ID stock.
          </p>
        </section>
        <script>
          const images = Array.from(document.images);
          Promise.all(images.map(img => img.decode())).then(() => {
            setTimeout(() => window.print(), 300);
          }).catch(() => {
            document.body.insertAdjacentHTML(
              "afterbegin",
              "<p>One or more images failed to load. Please close and retry.</p>"
            );
          });
          window.addEventListener("afterprint", () => {
            URL.revokeObjectURL("${frontURL}");
            URL.revokeObjectURL("${backURL}");
          });
        <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();

    setStatus("Print preview opened. Confirm your paper size and scale before printing.");
  } catch (error) {
    console.error(error);
    if (printWindow && !printWindow.closed) printWindow.close();
    setStatus("Could not prepare print pages.", true);
  }
}

/* ---------- Event handlers ---------- */

$("addText").addEventListener("click", addText);

$("photoUpload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const dataURL = await fileToDataURL(file);
    await addImage(dataURL);
    setStatus("Image added. Drag it into position.");
  } catch (error) {
    setStatus(error.message, true);
  }

  event.target.value = "";
});

$("backgroundImage").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    currentDesign().backgroundImage = await fileToDataURL(file);
    await render();
    setStatus("Background image applied to the current side.");
  } catch (error) {
    setStatus(error.message, true);
  }

  event.target.value = "";
});

$("backgroundColor").addEventListener("input", (event) => {
  currentDesign().background = event.target.value;
  render();
});

document.querySelectorAll(".side-btn").forEach((button) => {
  button.addEventListener("click", () => {
    currentSide = button.dataset.side;
    selectedId = null;

    document.querySelectorAll(".side-btn").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    render();
  });
});

[
  "elementText", "elementX", "elementY", "fontSize",
  "fontFamily", "textColor", "fontWeight",
  "imageWidth", "imageHeight", "imageCircle"
].forEach((id) => {
  $(id).addEventListener("input", updateSelectedElement);
  $(id).addEventListener("change", updateSelectedElement);
});

$("cardPreset").addEventListener("change", applyPreset);

$("cardWidth").addEventListener("change", () => {
  if ($("cardPreset").value === "custom") {
    setDimensions($("cardWidth").value, $("cardHeight").value);
  }
});

$("cardHeight").addEventListener("change", () => {
  if ($("cardPreset").value === "custom") {
    setDimensions($("cardWidth").value, $("cardHeight").value);
  }
});

$("duplicateElement").addEventListener("click", duplicateSelectedElement);
$("deleteElement").addEventListener("click", deleteSelectedElement);
$("saveProject").addEventListener("click", saveProject);
$("newProject").addEventListener("click", newProject);
$("exportFront").addEventListener("click", () => exportPNG("front"));
$("exportBack").addEventListener("click", () => exportPNG("back"));
$("printCard").addEventListener("click", printCards);

$("recordSearch").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    refreshRecords().catch(console.error);
  }, 150);
});

/* ---------- Startup ---------- */

async function initializeApp() {
  const pixels = getCardPixels();
  canvas.width = pixels.width;
  canvas.height = pixels.height;

  try {
    await openDatabase();
    await refreshRecords();
    setStatus("Ready. Design your card, then save your ID record.");
  } catch (error) {
    console.error(error);
    setStatus(
      "Local database unavailable. Open this app through HTTPS or localhost and check browser storage settings.",
      true
    );
  }

  await render();
}

initializeApp();
