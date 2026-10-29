
"use strict";

/* ID Maker Mo — LinkTech
   Local-first canvas editor. No external libraries required. */

const $ = id => document.getElementById(id);
const canvas = $("idCanvas");
const ctx = canvas.getContext("2d");
const DB_NAME = "LinkTechIDMakerMo";
const DB_VERSION = 1;
const STORE = "projects";

let db;
let currentSide = "front";
let orientation = "landscape";
let zoom = 1;
let selectedId = null;
let dragState = null;
let toastTimer;
let project = makeProject();
let images = new Map();

const W = () => canvas.width;
const H = () => canvas.height;

function uid() {
  return "obj_" + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function makeSide() {
  return {
    backgroundColor: "#ffffff",
    backgroundImage: null,
    bgX: 0, bgY: 0, bgZoom: 1,
    template: "minimal",
    elements: []
  };
}

function makeProject() {
  return {
    id: uid(),
    name: "My ID Design",
    orientation: "landscape",
    updatedAt: new Date().toISOString(),
    front: makeSide(),
    back: makeSide()
  };
}

function sideData() {
  return project[currentSide];
}

function notify(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is unavailable in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbRequest(mode, callback) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error("Database is not ready."));
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result;

    try {
      result = callback(store);
    } catch (error) {
      reject(error);
      return;
    }

    tx.oncomplete = () => resolve(result?.result);
    tx.onerror = () => reject(tx.error || result?.error);
    tx.onabort = () => reject(tx.error || new Error("Database operation aborted."));
  });
}

async function saveProject(silent = false) {
  project.name = $("projectName").value.trim() || "Untitled ID";
  project.updatedAt = new Date().toISOString();

  try {
    await dbRequest("readwrite", store => store.put(projectCopy(project)));
    await renderSavedProjects();
    if (!silent) notify("Project saved in this browser.");
  } catch (error) {
    console.error(error);
    notify("Could not save. Export a JSON backup instead.");
  }
}

function projectCopy(source) {
  return JSON.parse(JSON.stringify(source));
}

async function renderSavedProjects() {
  const list = $("savedProjects");
  list.replaceChildren();

  if (!db) {
    list.innerHTML = '<p class="hint">Local database is unavailable.</p>';
    return;
  }

  try {
    const all = await dbRequest("readonly", store => store.getAll());
    const records = (all || []).sort((a, b) =>
      String(b.updatedAt).localeCompare(String(a.updatedAt))
    );

    if (!records.length) {
      list.innerHTML = '<p class="hint">No saved projects yet.</p>';
      return;
    }

    records.forEach(record => {
      const item = document.createElement("div");
      item.className = "saved-item";

      const info = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = record.name || "Untitled ID";
      const date = document.createElement("small");
      date.textContent = record.updatedAt
        ? new Date(record.updatedAt).toLocaleString()
        : "Saved project";
      info.append(name, date);

      const actions = document.createElement("div");
      actions.className = "button-row";

      const open = document.createElement("button");
      open.className = "btn";
      open.textContent = "Open";
      open.addEventListener("click", async () => {
        project = normalizeProject(record);
        currentSide = "front";
        selectedId = null;
        updateUI();
        await loadProjectImages();
        render();
        notify("Project opened.");
      });

      const remove = document.createElement("button");
      remove.className = "btn danger";
      remove.textContent = "Delete";
      remove.addEventListener("click", async () => {
        if (!confirm(`Delete "${record.name || "Untitled ID"}"?`)) return;
        await dbRequest("readwrite", store => store.delete(record.id));
        await renderSavedProjects();
        notify("Saved project deleted.");
      });

      actions.append(open, remove);
      item.append(info, actions);
      list.append(item);
    });
  } catch (error) {
    console.error(error);
    list.innerHTML = '<p class="hint">Could not read saved projects.</p>';
  }
}

function normalizeProject(raw) {
  const fresh = makeProject();
  if (!raw || typeof raw !== "object") return fresh;

  fresh.id = typeof raw.id === "string" ? raw.id : uid();
  fresh.name = typeof raw.name === "string" ? raw.name : "My ID Design";
  fresh.updatedAt = raw.updatedAt || new Date().toISOString();
  fresh.orientation = raw.orientation === "portrait" ? "portrait" : "landscape";

  ["front", "back"].forEach(side => {
    const input = raw[side] || {};
    fresh[side] = {
      ...makeSide(),
      backgroundColor: validColor(input.backgroundColor, "#ffffff"),
      backgroundImage: typeof input.backgroundImage === "string"
        ? input.backgroundImage : null,
      bgX: finite(input.bgX, 0),
      bgY: finite(input.bgY, 0),
      bgZoom: clamp(finite(input.bgZoom, 1), 1, 5),
      template: typeof input.template === "string" ? input.template : "minimal",
      elements: Array.isArray(input.elements)
        ? input.elements.map(normalizeElement).filter(Boolean)
        : []
    };
  });
  return fresh;
}

function normalizeElement(e) {
  if (!e || typeof e !== "object") return null;
  const allowed = ["text", "rect", "circle", "line", "image"];
  if (!allowed.includes(e.type)) return null;

  return {
    id: typeof e.id === "string" ? e.id : uid(),
    type: e.type,
    x: finite(e.x, 40),
    y: finite(e.y, 40),
    w: Math.max(1, finite(e.w, 150)),
    h: Math.max(1, finite(e.h, 60)),
    text: typeof e.text === "string" ? e.text : "",
    color: validColor(e.color, "#163b70"),
    stroke: validColor(e.stroke, "#163b70"),
    strokeWidth: clamp(finite(e.strokeWidth, 0), 0, 30),
    font: typeof e.font === "string" ? e.font : "Arial",
    fontSize: clamp(finite(e.fontSize, 30), 4, 180),
    weight: String(e.weight || "700"),
    align: ["left", "center", "right"].includes(e.align) ? e.align : "left",
    radius: clamp(finite(e.radius, 0), 0, 200),
    opacity: clamp(finite(e.opacity, 1), 0.1, 1),
    imageData: typeof e.imageData === "string" ? e.imageData : null,
    cropZoom: clamp(finite(e.cropZoom, 1), 1, 4),
    cropX: finite(e.cropX, 0),
    cropY: finite(e.cropY, 0)
  };
}

function finite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}
function validColor(value, fallback) {
  return typeof value === "string" &&
    /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function updateUI() {
  $("projectName").value = project.name;
  $("sideTitle").textContent = currentSide === "front" ? "Front side" : "Back side";

  document.querySelectorAll("[data-side]").forEach(button => {
    button.classList.toggle("active", button.dataset.side === currentSide);
  });
  document.querySelectorAll("[data-orientation]").forEach(button => {
    button.classList.toggle("active", button.dataset.orientation === orientation);
  });
  $("dimensionLabel").textContent =
    `${orientation === "landscape" ? "Landscape" : "Portrait"} · ${W()} × ${H()} design units`;
  $("backgroundColor").value = sideData().backgroundColor;
  updateProperties();
  updateCanvasSize();
}

function updateCanvasSize() {
  const frame = $("canvasFrame");
  frame.style.width = `${W() * zoom}px`;
  frame.style.height = `${H() * zoom}px`;
  $("zoomLabel").textContent = `${Math.round(zoom * 100)}%`;
}

function setOrientation(next) {
  if (!["portrait", "landscape"].includes(next) || next === orientation) return;

  const oldW = W(), oldH = H();
  orientation = next;
  project.orientation = next;

  canvas.width = next === "landscape" ? 856 : 540;
  canvas.height = next === "landscape" ? 540 : 856;

  for (const side of ["front", "back"]) {
    sideOfProject(side).elements.forEach(e => {
      e.x = e.x / oldW * W();
      e.y = e.y / oldH * H();
      e.w = e.w / oldW * W();
      e.h = e.h / oldH * H();
      if (e.type === "text") {
        e.fontSize *= Math.min(W() / oldW, H() / oldH);
      }
    });
    const s = sideOfProject(side);
    s.bgX = s.bgX / oldW * W();
    s.bgY = s.bgY / oldH * H();
  }

  selectedId = null;
  updateUI();
  render();
}

function sideOfProject(side) {
  return project[side];
}

function addElement(type, extras = {}) {
  const w = W(), h = H();
  const e = normalizeElement({
    id: uid(), type,
    x: w * 0.15, y: h * 0.15,
    w: type === "text" ? w * 0.7 : w * 0.22,
    h: type === "text" ? 45 : h * 0.2,
    text: type === "text" ? "EDIT YOUR TEXT" : "",
    color: type === "circle" ? "#24a8ed" : "#163b70",
    stroke: "#163b70",
    strokeWidth: type === "rect" || type === "circle" ? 2 : 0,
    font: "Arial", fontSize: 30, weight: "700",
    align: "left", radius: 10, opacity: 1,
    cropZoom: 1, cropX: 0, cropY: 0,
    ...extras
  });
  sideData().elements.push(e);
  selectedId = e.id;
  render();
  updateProperties();
}

function selectedElement() {
  return sideData().elements.find(e => e.id === selectedId) || null;
}

function loadImage(data) {
  return new Promise((resolve, reject) => {
    if (!data) return resolve(null);
    if (images.has(data)) return resolve(images.get(data));

    const img = new Image();
    img.onload = () => {
      images.set(data, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error("This image could not be loaded."));
    img.src = data;
  });
}

async function loadProjectImages() {
  const dataItems = [];
  for (const side of ["front", "back"]) {
    const s = project[side];
    if (s.backgroundImage) dataItems.push(s.backgroundImage);
    s.elements.forEach(e => {
      if (e.type === "image" && e.imageData) dataItems.push(e.imageData);
    });
  }
  await Promise.all(dataItems.map(data => loadImage(data).catch(() => null)));
}

function drawBackground(s) {
  ctx.save();
  ctx.fillStyle = s.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, W(), H());

  const template = s.template || "minimal";
  const gradient = (colors, angle = 0) => {
    let g;
    if (angle === 0) g = ctx.createLinearGradient(0, 0, W(), H());
    else g = ctx.createLinearGradient(0, H(), W(), 0);
    colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
    return g;
  };

  const presets = {
    blue: ["#092f78", "#168ef4", "#8be9ff"],
    purple: ["#32106b", "#8e42e9", "#f4a7ff"],
    green: ["#043c44", "#09a889", "#a7f3c6"],
    sunset: ["#f04b68", "#ff9e51", "#ffd56e"],
    dark: ["#080d1b", "#26364f", "#0b1220"],
    minimal: ["#ffffff", "#f4f8fd", "#eaf3fc"],
    red: ["#6d061a", "#e72743", "#ff9c9c"],
    gold: ["#3c2a0b", "#c79b38", "#fff0a6"]
  };

  if (presets[template]) {
    ctx.fillStyle = gradient(presets[template]);
    ctx.fillRect(0, 0, W(), H());
    drawDecorations(template);
  }

  if (s.backgroundImage) {
    const img = images.get(s.backgroundImage);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W(), H());
      ctx.clip();

      const base = Math.max(W() / img.width, H() / img.height);
      const scale = base * (s.bgZoom || 1);
      const iw = img.width * scale, ih = img.height * scale;
      const x = (W() - iw) / 2 + (s.bgX || 0);
      const y = (H() - ih) / 2 + (s.bgY || 0);
      ctx.drawImage(img, x, y, iw, ih);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawDecorations(template) {
  ctx.save();
  ctx.globalAlpha = 0.18;

  if (template === "minimal") {
    ctx.fillStyle = "#3d9ce9";
    ctx.fillRect(0, 0, W() * 0.025, H());
    ctx.fillRect(0, H() * 0.92, W(), H() * 0.08);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, H() * 0.72);
    ctx.bezierCurveTo(W() * 0.28, H() * 0.48, W() * 0.48, H() * 1.1, W(), H() * 0.55);
    ctx.lineTo(W(), H());
    ctx.lineTo(0, H());
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.13;
    ctx.beginPath();
    ctx.arc(W() * 0.94, H() * 0.02, H() * 0.48, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundedRect(x, y, w, h, r) {
  r = Math.min(r || 0, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawImageCover(img, x, y, w, h, zoomFactor = 1, cropX = 0, cropY = 0) {
  const base = Math.max(w / img.width, h / img.height);
  const scale = base * zoomFactor;
  const iw = img.width * scale, ih = img.height * scale;
  const dx = x + (w - iw) / 2 + cropX;
  const dy = y + (h - ih) / 2 + cropY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, iw, ih);
  ctx.restore();
}

function drawElement(e) {
  ctx.save();
  ctx.globalAlpha = e.opacity ?? 1;

  if (e.type === "text") {
    ctx.fillStyle = e.color;
    ctx.font = `${e.weight || "700"} ${e.fontSize || 30}px "${e.font || "Arial"}"`;
    ctx.textBaseline = "top";
    ctx.textAlign = e.align || "left";

    const lines = String(e.text || "").split("\n");
    const lineHeight = (e.fontSize || 30) * 1.2;
    const startX = e.align === "center" ? e.x + e.w / 2 :
      e.align === "right" ? e.x + e.w : e.x;

    lines.forEach((line, i) => {
      ctx.fillText(line, startX, e.y + i * lineHeight, Math.max(1, e.w));
    });
  }

  if (e.type === "rect") {
    roundedRect(e.x, e.y, e.w, e.h, e.radius || 0);
    ctx.fillStyle = e.color;
    ctx.fill();
    if (e.strokeWidth > 0) {
      ctx.lineWidth = e.strokeWidth;
      ctx.strokeStyle = e.stroke;
      ctx.stroke();
    }
  }

  if (e.type === "circle") {
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2,
      Math.abs(e.w / 2), Math.abs(e.h / 2), 0, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();
    if (e.strokeWidth > 0) {
      ctx.lineWidth = e.strokeWidth;
      ctx.strokeStyle = e.stroke;
      ctx.stroke();
    }
  }

  if (e.type === "line") {
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.w, e.y + e.h);
    ctx.strokeStyle = e.strokeWidth > 0 ? e.stroke : e.color;
    ctx.lineWidth = Math.max(1, e.strokeWidth || 2);
    ctx.stroke();
  }

  if (e.type === "image") {
    const img = e.imageData ? images.get(e.imageData) : null;
    if (img) {
      drawImageCover(img, e.x, e.y, e.w, e.h,
        e.cropZoom || 1, e.cropX || 0, e.cropY || 0);
    } else {
      ctx.fillStyle = "#e8f3ff";
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = "#416a93";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Image unavailable", e.x + e.w / 2, e.y + e.h / 2);
    }

    if (e.radius > 0) {
      // The image remains rectangular; radius is used for shape elements.
    }
    if (e.strokeWidth > 0) {
      ctx.strokeStyle = e.stroke;
      ctx.lineWidth = e.strokeWidth;
      ctx.strokeRect(e.x, e.y, e.w, e.h);
    }
  }

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, W(), H());
  drawBackground(sideData());

  sideData().elements.forEach(drawElement);

  const selected = selectedElement();
  if (selected) drawSelection(selected);
}

function drawSelection(e) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#087cf0";
  ctx.lineWidth = Math.max(1.5, W() / 500);
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.setLineDash([]);

  const r = Math.max(5, W() / 95);
  const handles = handlePositions(e);
  handles.forEach(p => {
    ctx.beginPath();
    ctx.rect(p.x - r, p.y - r, r * 2, r * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#087cf0";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  ctx.restore();
}

function handlePositions(e) {
  return [
    { id: "nw", x: e.x, y: e.y },
    { id: "n", x: e.x + e.w / 2, y: e.y },
    { id: "ne", x: e.x + e.w, y: e.y },
    { id: "e", x: e.x + e.w, y: e.y + e.h / 2 },
    { id: "se", x: e.x + e.w, y: e.y + e.h },
    { id: "s", x: e.x + e.w / 2, y: e.y + e.h },
    { id: "sw", x: e.x, y: e.y + e.h },
    { id: "w", x: e.x, y: e.y + e.h / 2 }
  ];
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * W() / rect.width,
    y: (event.clientY - rect.top) * H() / rect.height
  };
}

function hitHandle(point, e) {
  const tolerance = Math.max(10, W() / 45);
  const handles = handlePositions(e);
  for (const h of handles) {
    if (Math.abs(point.x - h.x) <= tolerance &&
        Math.abs(point.y - h.y) <= tolerance) return h.id;
  }
  return null;
}

function hitElement(point, e) {
  if (e.type === "line") {
    const x1 = e.x, y1 = e.y, x2 = e.x + e.w, y2 = e.y + e.h;
    const dx = x2 - x1, dy = y2 - y1;
    const length2 = dx * dx + dy * dy || 1;
    const t = clamp(((point.x - x1) * dx + (point.y - y1) * dy) / length2, 0, 1);
    const nearX = x1 + t * dx, nearY = y1 + t * dy;
    return Math.hypot(point.x - nearX, point.y - nearY) < 12;
  }

  return point.x >= Math.min(e.x, e.x + e.w) &&
    point.x <= Math.max(e.x, e.x + e.w) &&
    point.y >= Math.min(e.y, e.y + e.h) &&
    point.y <= Math.max(e.y, e.y + e.h);
}

canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  const point = canvasPoint(event);
  const selected = selectedElement();
  let handle = selected ? hitHandle(point, selected) : null;

  if (handle) {
    dragState = {
      mode: "resize", handle, start: point,
      original: { ...selected }
    };
  } else {
    let hit = null;
    const elements = sideData().elements;
    for (let i = elements.length - 1; i >= 0; i--) {
      if (hitElement(point, elements[i])) {
        hit = elements[i];
        break;
      }
    }

    if (hit) {
      selectedId = hit.id;
      dragState = {
        mode: "move", start: point,
        original: { ...hit },
        imageCrop: hit.type === "image" && hit.cropZoom > 1
      };
    } else {
      selectedId = null;
      dragState = null;
    }
  }

  try { canvas.setPointerCapture(event.pointerId); } catch {}
  updateProperties();
  render();
});

canvas.addEventListener("pointermove", event => {
  if (!dragState) return;
  const point = canvasPoint(event);
  const dx = point.x - dragState.start.x;
  const dy = point.y - dragState.start.y;
  const e = selectedElement();
  if (!e) return;

  if (dragState.mode === "move") {
    if (dragState.imageCrop) {
      e.cropX = clamp(dragState.original.cropX + dx, -e.w * 2, e.w * 2);
      e.cropY = clamp(dragState.original.cropY + dy, -e.h * 2, e.h * 2);
    } else {
      e.x = dragState.original.x + dx;
      e.y = dragState.original.y + dy;
    }
  } else {
    resizeElement(e, dragState.original, dragState.handle, dx, dy);
  }

  render();
  updatePropertyValuesOnly();
});

canvas.addEventListener("pointerup", () => {
  if (dragState) {
    dragState = null;
    updateProperties();
    render();
  }
});
canvas.addEventListener("pointercancel", () => {
  dragState = null;
  render();
});

function resizeElement(e, o, handle, dx, dy) {
  let left = o.x, top = o.y, right = o.x + o.w, bottom = o.y + o.h;
  if (handle.includes("w")) left += dx;
  if (handle.includes("e")) right += dx;
  if (handle.includes("n")) top += dy;
  if (handle.includes("s")) bottom += dy;

  const minSize = 8;
  if (right - left < minSize) {
    if (handle.includes("w")) left = right - minSize;
    else right = left + minSize;
  }
  if (bottom - top < minSize) {
    if (handle.includes("n")) top = bottom - minSize;
    else bottom = top + minSize;
  }

  e.x = left;
  e.y = top;
  e.w = right - left;
  e.h = bottom - top;

  // Dragging text's corner handles also adjusts its font size.
  if (e.type === "text") {
    const factor = Math.min(e.w / Math.max(1, o.w), e.h / Math.max(1, o.h));
    if (factor > 0 && Number.isFinite(factor)) {
      e.fontSize = clamp(o.fontSize * factor, 4, 180);
    }
  }
}

function updateProperties() {
  const e = selectedElement();
  $("emptySelection").classList.toggle("hidden", !!e);
  $("properties").classList.toggle("hidden", !e);
  $("selectionInfo").textContent = e
    ? `Selected: ${e.type} · drag to move, handles to resize`
    : "Select an object on the card to edit it.";

  if (!e) {
    $("imageControls").classList.add("hidden");
    return;
  }

  $("objText").value = e.text || "";
  $("objX").value = Math.round(e.x);
  $("objY").value = Math.round(e.y);
  $("objW").value = Math.round(e.w);
  $("objH").value = Math.round(e.h);
  $("objColor").value = validColor(e.color, "#163b70");
  $("objStroke").value = validColor(e.stroke, "#163b70");
  $("objFont").value = e.font || "Arial";
  $("objFontSize").value = Math.round(e.fontSize || 30);
  $("objAlign").value = e.align || "left";
  $("objWeight").value = String(e.weight || "700");
  $("objStrokeWidth").value = e.strokeWidth || 0;
  $("objRadius").value = e.radius || 0;
  $("objOpacity").value = e.opacity ?? 1;
  $("opacityLabel").textContent = `${Math.round((e.opacity ?? 1) * 100)}%`;

  const isImage = e.type === "image";
  $("imageControls").classList.toggle("hidden", !isImage);
  if (isImage) {
    $("cropZoom").value = e.cropZoom || 1;
    $("cropZoomLabel").textContent = `${(e.cropZoom || 1).toFixed(2)}×`;
  }
}

function updatePropertyValuesOnly() {
  const e = selectedElement();
  if (!e) return;
  $("objX").value = Math.round(e.x);
  $("objY").value = Math.round(e.y);
  $("objW").value = Math.round(e.w);
  $("objH").value = Math.round(e.h);
  $("objFontSize").value = Math.round(e.fontSize || 30);
}

function bindProperty(id, property, convert = v => v, condition = () => true) {
  const el = $(id);
  const update = () => {
    const e = selectedElement();
    if (!e || !condition(e)) return;
    e[property] = convert(el.value, e);
    render();
  };
  el.addEventListener("input", update);
  el.addEventListener("change", () => {
    update();
    updateProperties();
  });
}

bindProperty("objText", "text", v => v, e => e.type === "text");
bindProperty("objX", "x", v => finite(v, 0));
bindProperty("objY", "y", v => finite(v, 0));
bindProperty("objW", "w", v => Math.max(1, finite(v, 1)));
bindProperty("objH", "h", v => Math.max(1, finite(v, 1)));
bindProperty("objColor", "color", v => validColor(v, "#163b70"));
bindProperty("objStroke", "stroke", v => validColor(v, "#163b70"));
bindProperty("objFont", "font", v => v, e => e.type === "text");
bindProperty("objFontSize", "fontSize", v => clamp(finite(v, 30), 4, 180), e => e.type === "text");
bindProperty("objAlign", "align", v => v, e => e.type === "text");
bindProperty("objWeight", "weight", v => v, e => e.type === "text");
bindProperty("objStrokeWidth", "strokeWidth", v => clamp(finite(v, 0), 0, 30));
bindProperty("objRadius", "radius", v => clamp(finite(v, 0), 0, 200));
bindProperty("objOpacity", "opacity", v => clamp(finite(v, 1), 0.1, 1));

$("objOpacity").addEventListener("input", () => {
  $("opacityLabel").textContent = `${Math.round(Number($("objOpacity").value) * 100)}%`;
});

$("cropZoom").addEventListener("input", () => {
  const e = selectedElement();
  if (!e || e.type !== "image") return;
  e.cropZoom = clamp(finite($("cropZoom").value, 1), 1, 4);
  $("cropZoomLabel").textContent = `${e.cropZoom.toFixed(2)}×`;
  render();
});

function setCropFit(mode) {
  const e = selectedElement();
  if (!e || e.type !== "image") return;
  e.cropZoom = mode === "fit" ? 1 : Math.max(1, e.cropZoom || 1);
  e.cropX = 0;
  e.cropY = 0;
  updateProperties();
  render();
}

$("fitImageBtn").addEventListener("click", () => setCropFit("fit"));
$("fillImageBtn").addEventListener("click", () => setCropFit("fill"));
$("resetCropBtn").addEventListener("click", () => {
  const e = selectedElement();
  if (!e || e.type !== "image") return;
  e.cropZoom = 1; e.cropX = 0; e.cropY = 0;
  updateProperties(); render();
});

$("addTextBtn").addEventListener("click", () => addElement("text"));
$("addRectBtn").addEventListener("click", () => addElement("rect"));
$("addCircleBtn").addEventListener("click", () => addElement("circle"));
$("addLineBtn").addEventListener("click", () => addElement("line"));

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read this file."));
    reader.readAsDataURL(file);
  });
}

async function addUploadedImage(file, asLogo = false) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    notify("Please select an image file.");
    return;
  }

  try {
    const data = await readFile(file);
    const img = await loadImage(data);
    if (!img) throw new Error("Image could not be loaded.");

    const targetW = asLogo ? W() * 0.16 : W() * 0.22;
    const ratio = img.width / img.height;
    const targetH = targetW / ratio;

    addElement("image", {
      x: W() * 0.12, y: H() * 0.16,
      w: targetW, h: Math.max(35, targetH),
      imageData: data,
      cropZoom: 1, cropX: 0, cropY: 0,
      strokeWidth: 0
    });
    notify(asLogo ? "Logo added. Select and resize it." : "Photo added. Select it to crop or resize.");
  } catch (error) {
    console.error(error);
    notify("Image upload failed.");
  }
}

$("addPhotoBtn").addEventListener("click", () => $("photoInput").click());
$("addLogoBtn").addEventListener("click", () => $("photoInput").click());
$("photoInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (file) await addUploadedImage(file);
  event.target.value = "";
});

$("backgroundInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const data = await readFile(file);
    await loadImage(data);
    sideData().backgroundImage = data;
    sideData().bgZoom = 1;
    sideData().bgX = 0;
    sideData().bgY = 0;
    render();
    notify("Background image added.");
  } catch {
    notify("Could not load the background image.");
  }
  event.target.value = "";
});

$("backgroundColor").addEventListener("input", event => {
  sideData().backgroundColor = event.target.value;
  sideData().template = "minimal";
  render();
});

$("removeBackgroundBtn").addEventListener("click", () => {
  sideData().backgroundImage = null;
  sideData().bgX = 0; sideData().bgY = 0; sideData().bgZoom = 1;
  render();
  notify("Background image removed.");
});

$("fitBackgroundBtn").addEventListener("click", () => {
  sideData().bgX = 0; sideData().bgY = 0; sideData().bgZoom = 1;
  render();
  notify("Background image fitted to the card.");
});

document.querySelectorAll("[data-template]").forEach(button => {
  button.addEventListener("click", () => {
    sideData().template = button.dataset.template;
    sideData().backgroundImage = null;
    sideData().bgZoom = 1;
    sideData().bgX = 0;
    sideData().bgY = 0;
    document.querySelectorAll("[data-template]").forEach(b =>
      b.classList.toggle("active", b === button)
    );
    render();
    notify("Background template applied. Your objects were kept.");
  });
});

document.querySelectorAll("[data-orientation]").forEach(button => {
  button.addEventListener("click", () => setOrientation(button.dataset.orientation));
});

document.querySelectorAll("[data-side]").forEach(button => {
  button.addEventListener("click", () => {
    currentSide = button.dataset.side;
    selectedId = null;
    updateUI();
    render();
  });
});

$("duplicateBtn").addEventListener("click", () => {
  const e = selectedElement();
  if (!e) return notify("Select an object first.");
  const copy = { ...e, id: uid(), x: e.x + 18, y: e.y + 18 };
  const index = sideData().elements.findIndex(item => item.id === e.id);
  sideData().elements.splice(index + 1, 0, copy);
  selectedId = copy.id;
  render(); updateProperties();
  notify("Object duplicated.");
});

$("deleteBtn").addEventListener("click", () => {
  if (!selectedId) return notify("Select an object first.");
  sideData().elements = sideData().elements.filter(e => e.id !== selectedId);
  selectedId = null;
  render(); updateProperties();
  notify("Object deleted.");
});

$("bringFrontBtn").addEventListener("click", () => {
  const e = selectedElement();
  if (!e) return;
  sideData().elements = sideData().elements.filter(item => item.id !== e.id);
  sideData().elements.push(e);
  render();
});

$("sendBackBtn").addEventListener("click", () => {
  const e = selectedElement();
  if (!e) return;
  sideData().elements = sideData().elements.filter(item => item.id !== e.id);
  sideData().elements.unshift(e);
  render();
});

$("newBtn").addEventListener("click", () => {
  if (!confirm("Create a new ID project? Save your current work first if needed.")) return;
  project = makeProject();
  orientation = "landscape";
  currentSide = "front";
  selectedId = null;
  canvas.width = 856; canvas.height = 540;
  zoom = 1;
  updateUI(); render();
  notify("New ID project created.");
});

$("saveBtn").addEventListener("click", () => saveProject());

$("zoomInBtn").addEventListener("click", () => {
  zoom = clamp(zoom + 0.1, 0.2, 2);
  updateCanvasSize();
});
$("zoomOutBtn").addEventListener("click", () => {
  zoom = clamp(zoom - 0.1, 0.2, 2);
  updateCanvasSize();
});
$("fitViewBtn").addEventListener("click", () => {
  const scroll = document.querySelector(".canvas-scroll");
  const available = Math.max(100, scroll.clientWidth - 50);
  zoom = clamp(available / W(), 0.2, 1.5);
  updateCanvasSize();
});

/* Export a rendered side as a PNG. */
function canvasToBlob(sourceCanvas) {
  return new Promise((resolve, reject) => {
    sourceCanvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNG export failed.")), "image/png");
  });
}

async function renderSideToBlob(sideName) {
  const oldSide = currentSide;
  const oldSelected = selectedId;
  currentSide = sideName;
  selectedId = null;
  render();

  try {
    return await canvasToBlob(canvas);
  } finally {
    currentSide = oldSide;
    selectedId = oldSelected;
    render();
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function safeFilename(value) {
  return String(value || "id-design")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "id-design";
}

$("exportPngBtn").addEventListener("click", async () => {
  try {
    const blob = await renderSideToBlob(currentSide);
    downloadBlob(blob, `${safeFilename(project.name)}-${currentSide}.png`);
    notify("PNG exported.");
  } catch (error) {
    console.error(error); notify("Could not export PNG.");
  }
});

$("exportBothBtn").addEventListener("click", async () => {
  try {
    for (const side of ["front", "back"]) {
      const blob = await renderSideToBlob(side);
      downloadBlob(blob, `${safeFilename(project.name)}-${side}.png`);
    }
    notify("Front and back PNGs exported.");
  } catch (error) {
    console.error(error); notify("Export failed.");
  }
});

$("exportJsonBtn").addEventListener("click", () => {
  project.name = $("projectName").value.trim() || "My ID Design";
  project.updatedAt = new Date().toISOString();
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${safeFilename(project.name)}-backup.json`);
  notify("JSON backup downloaded.");
});

$("importJsonInput").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !parsed.front || !parsed.back) {
      throw new Error("This file is not an ID Maker Mo project.");
    }

    project = normalizeProject(parsed);
    orientation = project.orientation;
    currentSide = "front";
    selectedId = null;
    canvas.width = orientation === "landscape" ? 856 : 540;
    canvas.height = orientation === "landscape" ? 540 : 856;

    await loadProjectImages();
    updateUI(); render();
    notify("Project backup imported. Save it to keep it in this browser.");
  } catch (error) {
    console.error(error);
    notify("Import failed. Please choose a valid ID Maker Mo JSON backup.");
  }
  event.target.value = "";
});

/* Printing: make a sheet of the selected side. */
function getPrintSettings() {
  const paper = $("paperSize").value;
  const presets = {
    a4: [210, 297],
    letter: [215.9, 279.4],
    legal: [215.9, 355.6]
  };
  const [defaultW, defaultH] = presets[paper] || [210, 297];
  const paperW = paper === "custom" ? finite($("paperW").value, 210) : defaultW;
  const paperH = paper === "custom" ? finite($("paperH").value, 297) : defaultH;
  const cardW = Math.max(20, finite($("cardW").value, 85.6));
  const cardH = Math.max(20, finite($("cardH").value, 54));
  const margin = clamp(finite($("printMargin").value, 5), 0, 50);
  const gap = clamp(finite($("printGap").value, 3), 0, 30);
  const copies = clamp(Math.floor(finite($("copies").value, 1)), 1, 500);

  const columns = Math.max(0, Math.floor((paperW - margin * 2 + gap) / (cardW + gap)));
  const rows = Math.max(0, Math.floor((paperH - margin * 2 + gap) / (cardH + gap)));
  return { paperW, paperH, cardW, cardH, margin, gap, copies, columns, rows };
}

function updatePrintSummary() {
  const s = getPrintSettings();
  const perPage = s.columns * s.rows;
  const pages = perPage ? Math.ceil(s.copies / perPage) : 0;
  $("printSummary").textContent = perPage
    ? `${s.columns} columns × ${s.rows} rows = ${perPage} IDs per page. ${s.copies} copies need ${pages} page(s).`
    : "ID size is too large for this paper size. Reduce ID size or margins.";
}

["paperSize", "paperW", "paperH", "cardW", "cardH", "printMargin", "printGap", "copies"]
  .forEach(id => $(id).addEventListener("input", updatePrintSummary));

$("paperSize").addEventListener("change", () => {
  $("customPaperFields").classList.toggle("hidden", $("paperSize").value !== "custom");
  updatePrintSummary();
});

$("printBtn").addEventListener("click", async () => {
  const s = getPrintSettings();
  const perPage = s.columns * s.rows;
  if (!perPage) return notify("The ID does not fit on the selected paper size.");

  try {
    const blob = await renderSideToBlob(currentSide);
    const dataUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    const popup = window.open("", "_blank");
    if (!popup) {
      notify("Allow pop-ups for this site to print.");
      return;
    }

    const totalPages = Math.ceil(s.copies / perPage);
    const pages = [];
    let remaining = s.copies;

    for (let page = 0; page < totalPages; page++) {
      const count = Math.min(perPage, remaining);
      remaining -= count;

      let cards = "";
      for (let i = 0; i < count; i++) {
        cards += `<img class="id-card" src="${dataUrl}" alt="ID card">`;
      }

      pages.push(`
        <section class="sheet">
          <div class="grid">${cards}</div>
        </section>
      `);
    }

    popup.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>ID Maker Mo Print</title>
<style>
@page { size: ${s.paperW}mm ${s.paperH}mm; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
.sheet {
  width: ${s.paperW}mm; height: ${s.paperH}mm; overflow: hidden;
  padding: ${s.margin}mm; break-after: page; page-break-after: always;
}
.sheet:last-child { break-after: auto; page-break-after: auto; }
.grid {
  display: grid;
  grid-template-columns: repeat(${s.columns}, ${s.cardW}mm);
  grid-auto-rows: ${s.cardH}mm;
  gap: ${s.gap}mm;
  align-content: start;
}
.id-card {
  display: block; width: ${s.cardW}mm; height: ${s.cardH}mm;
  object-fit: fill; border: 0; margin: 0;
}
@media screen {
  body { background: #e7edf5; padding: 15px; }
  .sheet { background: white; margin: 0 auto 15px; box-shadow: 0 3px 16px #0002; }
}
</style></head><body>
${pages.join("")}
<script>
window.onload = () => setTimeout(() => window.print(), 500);
<\/script>
</body></html>`);
    popup.document.close();
  } catch (error) {
    console.error(error);
    notify("Could not prepare the print sheet.");
  }
});

/* Background and project setup */
async function initialize() {
  try {
    db = await openDB();
    await renderSavedProjects();
  } catch (error) {
    console.error(error);
    notify("Local storage is unavailable. You can still export a JSON backup.");
  }

  updateUI();
  render();
  updatePrintSummary();
  $("customPaperFields").classList.toggle("hidden", $("paperSize").value !== "custom");
  $("fitViewBtn").click();
}

window.addEventListener("beforeunload", () => {
  // Browser storage is persistent; this event intentionally does not block closing.
});

initialize();
