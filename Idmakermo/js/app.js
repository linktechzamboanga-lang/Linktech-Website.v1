"use strict";

/* ==========================================
   LINKTECH ID MAKER MO
   Main Application
========================================== */

const $ = (id) => document.getElementById(id);

const canvas = $("idCanvas");
const ctx = canvas.getContext("2d");

const CANVAS = {
  portrait: { width: 638, height: 1012 },
  landscape: { width: 1012, height: 638 }
};

const DB_NAME = "LinkTechIDMakerMoV2";
const DB_STORE = "workspace";

let db;
let currentSide = "front";
let orientation = "portrait";
let selectedId = null;
let zoom = 1;
let drag = null;
let designLocked = false;
let editingEmployeeId = null;
let batchSelection = new Set();
let toastTimer;

let state = {
  front: makeSide(),
  back: makeSide(),
  layouts: [],
  employees: []
};

function makeSide() {
  return {
    background: "#ffffff",
    backgroundImage: "",
    elements: []
  };
}

function uid() {
  return "id_" + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function currentSideData() {
  return state[currentSide];
}

function selectedElement() {
  return currentSideData().elements.find(
    item => item.id === selectedId
  );
}

function notify(message, duration = 2600) {
  const toast = $("toast");
  if (!toast) return;

  toast.textContent = message;
  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.textContent = "";
  }, duration);
}

/* ==========================================
   INDEXEDDB
========================================== */

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(DB_STORE)) {
        database.createObjectStore(DB_STORE);
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => reject(request.error);
  });
}

function dbGet(key) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE, "readonly")
      .objectStore(DB_STORE)
      .get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbSet(key, value) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, "readwrite");

    transaction.objectStore(DB_STORE).put(value, key);

    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function normalizeElement(element) {
  return {
    id: element.id || uid(),
    type: element.type || "text",
    x: finite(element.x, 40),
    y: finite(element.y, 40),
    w: Math.max(1, finite(element.w, 150)),
    h: Math.max(1, finite(element.h, 50)),
    text: String(element.text || ""),
    bindField: element.bindField || "",
    color: element.color || "#087cf0",
    stroke: element.stroke || "#172338",
    strokeWidth: Math.max(0, finite(element.strokeWidth, 0)),
    radius: Math.max(0, finite(element.radius, 0)),
    opacity: clamp(finite(element.opacity, 1), 0, 1),
    rotation: finite(element.rotation, 0),
    font: element.font || "Arial",
    fontSize: Math.max(1, finite(element.fontSize, 28)),
    align: element.align || "left",
    weight: String(element.weight || "400"),
    underline: Boolean(element.underline),
    imageData: element.imageData || "",
    cropZoom: Math.max(0.1, finite(element.cropZoom, 1))
  };
}

function normalizeSide(side) {
  side = side || {};

  return {
    background: side.background || "#ffffff",
    backgroundImage: side.backgroundImage || "",
    elements: Array.isArray(side.elements)
      ? side.elements.map(normalizeElement)
      : []
  };
}

function normalizeState(data) {
  data = data || {};

  return {
    front: normalizeSide(data.front),
    back: normalizeSide(data.back),
    layouts: Array.isArray(data.layouts) ? data.layouts : [],
    employees: Array.isArray(data.employees)
      ? data.employees.map(employee => ({
          ...employee,
          id: employee.id || uid(),
          name: String(employee.name || ""),
          birthday: employee.birthday || "",
          employeeId: employee.employeeId || employee.idNumber || "",
          position: employee.position || "",
          department: employee.department || "",
          role: employee.role || "",
          photoData: employee.photoData || "",
          signatureData: employee.signatureData || "",
          printed: Boolean(employee.printed)
        }))
      : []
  };
}

async function saveWorkspace() {
  try {
    await dbSet("main", state);
    notify("Workspace saved successfully.");
  } catch (error) {
    console.error(error);
    notify("Unable to save workspace.");
  }
}

/* ==========================================
   IMAGE HELPERS
========================================== */

function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    if (!source) return resolve(null);

    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(
      new Error("Unable to load image.")
    );

    image.src = source;
  });
}

const imageCache = new Map();

async function getImage(source) {
  if (!source) return null;

  if (imageCache.has(source)) {
    return imageCache.get(source);
  }

  try {
    const image = await loadImage(source);
    imageCache.set(source, image);
    return image;
  } catch (error) {
    console.warn(error);
    return null;
  }
}

/* ==========================================
   EMPLOYEE DATA
========================================== */

function getEmployeeById(id) {
  return state.employees.find(employee => employee.id === id);
}

function getPreviewEmployee() {
  const id = $("previewEmployee").value;

  return getEmployeeById(id) || {
    name: "Juan Dela Cruz",
    birthday: "1995-01-01",
    employeeId: "EMP-0001",
    position: "Position",
    department: "Department",
    role: "Employee",
    photoData: "",
    signatureData: ""
  };
}

function employeeValue(employee, field) {
  if (!employee || !field) return "";

  const fields = {
    name: employee.name,
    birthday: employee.birthday,
    id: employee.employeeId,
    position: employee.position,
    department: employee.department,
    role: employee.role
  };

  return fields[field] ?? "";
}

/* ==========================================
   CANVAS RENDERING
========================================== */

function resizeCanvas() {
  const dimensions = CANVAS[orientation];

  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  $("dimensionLabel").textContent =
    orientation === "portrait"
      ? "Portrait: 638 × 1012"
      : "Landscape: 1012 × 638";

  renderCanvas();
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(
    radius,
    width / 2,
    height / 2
  );

  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

function drawImageCover(image, x, y, width, height, zoomValue = 1) {
  const scale = Math.max(
    width / image.width,
    height / image.height
  ) * zoomValue;

  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  const dx = x + (width - drawWidth) / 2;
  const dy = y + (height - drawHeight) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();

  ctx.drawImage(image, dx, dy, drawWidth, drawHeight);
  ctx.restore();
}

function drawText(element, text) {
  const fontSize = element.fontSize || 28;

  ctx.font = `${element.weight || "400"} ${fontSize}px "${element.font || "Arial"}"`;
  ctx.textAlign = element.align || "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = element.color || "#172338";

  let x = element.x;

  if (element.align === "center") {
    x += element.w / 2;
  } else if (element.align === "right") {
    x += element.w;
  }

  const lines = String(text || "").split("\n");
  const lineHeight = fontSize * 1.25;

  lines.forEach((line, index) => {
    const y = element.y + fontSize / 2 + index * lineHeight;

    ctx.fillText(line, x, y, element.w);

    if (element.underline) {
      const width = ctx.measureText(line).width;
      let startX = x;

      if (element.align === "center") startX -= width / 2;
      if (element.align === "right") startX -= width;

      ctx.beginPath();
      ctx.moveTo(startX, y + fontSize * .35);
      ctx.lineTo(startX + width, y + fontSize * .35);
      ctx.strokeStyle = element.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

async function drawElement(element, employee) {
  ctx.save();

  ctx.globalAlpha = element.opacity;

  const centerX = element.x + element.w / 2;
  const centerY = element.y + element.h / 2;

  ctx.translate(centerX, centerY);
  ctx.rotate(element.rotation * Math.PI / 180);
  ctx.translate(-centerX, -centerY);

  ctx.fillStyle = element.color;
  ctx.strokeStyle = element.stroke;
  ctx.lineWidth = element.strokeWidth;

  const x = element.x;
  const y = element.y;
  const w = element.w;
  const h = element.h;

  if (element.type === "rect") {
    roundedRect(x, y, w, h, element.radius);

    if (element.color !== "transparent") ctx.fill();
    if (element.strokeWidth > 0) ctx.stroke();
  }

  else if (element.type === "circle") {
    ctx.beginPath();
    ctx.ellipse(
      x + w / 2,
      y + h / 2,
      w / 2,
      h / 2,
      0,
      0,
      Math.PI * 2
    );

    if (element.color !== "transparent") ctx.fill();
    if (element.strokeWidth > 0) ctx.stroke();
  }

  else if (
    element.type === "triangle" ||
    element.type === "invertedTriangle"
  ) {
    ctx.beginPath();

    if (element.type === "triangle") {
      ctx.moveTo(x + w / 2, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w / 2, y + h);
    }

    ctx.closePath();
    ctx.fill();

    if (element.strokeWidth > 0) ctx.stroke();
  }

  else if (element.type === "polygon") {
    ctx.beginPath();

    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h * .35);
    ctx.lineTo(x + w * .8, y + h);
    ctx.lineTo(x + w * .2, y + h);
    ctx.lineTo(x, y + h * .35);
    ctx.closePath();

    ctx.fill();

    if (element.strokeWidth > 0) ctx.stroke();
  }

  else if (element.type === "line") {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.strokeStyle = element.color;
    ctx.lineWidth = Math.max(1, element.strokeWidth || 2);
    ctx.stroke();
  }

  else if (element.type === "text") {
    let value = element.text;

    if (element.bindField) {
      if (
        element.bindField === "photoData" ||
        element.bindField === "signatureData"
      ) {
        value = "";
      } else {
        value = employeeValue(employee, element.bindField);
      }
    }

    drawText(element, value);
  }

  else if (
    element.type === "image" ||
    element.type === "photo" ||
    element.type === "signature"
  ) {
    let source = element.imageData;

    if (element.bindField === "photoData") {
      source = employee.photoData;
    }

    if (element.bindField === "signatureData") {
      source = employee.signatureData;
    }

    const image = await getImage(source);

    ctx.fillStyle = "#f0f5fa";
    ctx.fillRect(x, y, w, h);

    if (image) {
      drawImageCover(image, x, y, w, h, element.cropZoom);
    }

    if (element.strokeWidth > 0) {
      ctx.strokeStyle = element.stroke;
      ctx.lineWidth = element.strokeWidth;
      ctx.strokeRect(x, y, w, h);
    }
  }

  ctx.restore();
}

let renderSequence = 0;

async function renderCanvas() {
  const sequence = ++renderSequence;

  const side = currentSideData();
  const employee = getPreviewEmployee();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = side.background || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (side.backgroundImage) {
    const image = await getImage(side.backgroundImage);

    if (sequence !== renderSequence) return;

    if (image) {
      drawImageCover(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  }

  for (const element of side.elements) {
    if (sequence !== renderSequence) return;
    await drawElement(element, employee);
  }

  if (sequence !== renderSequence) return;

  if (selectedId) {
    const element = selectedElement();

    if (element) {
      ctx.save();

      ctx.strokeStyle = "#087cf0";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);

      ctx.strokeRect(
        element.x,
        element.y,
        element.w,
        element.h
      );

      ctx.setLineDash([]);

      ctx.fillStyle = "#087cf0";

      const handleSize = 12;
      ctx.fillRect(
        element.x + element.w - handleSize / 2,
        element.y + element.h - handleSize / 2,
        handleSize,
        handleSize
      );

      ctx.restore();
    }
  }
}

/* ==========================================
   DESIGN LOCK
========================================== */

function setDesignLocked(locked) {
  designLocked = Boolean(locked);

  $("designModeBtn").textContent = designLocked
    ? "Unlock Design"
    : "Lock Design";

  $("designStatus").textContent = designLocked
    ? "Design Locked"
    : "Design Unlocked";

  $("designStatus").classList.toggle("locked", designLocked);
  $("designStatus").classList.toggle("unlocked", !designLocked);

  const designControls = [
    "addTextBtn",
    "addRectBtn",
    "addCircleBtn",
    "addLineBtn",
    "addTriangleBtn",
    "addInvertedTriangleBtn",
    "addPolygonBtn",
    "addPhotoBtn",
    "addSignatureBtn",
    "addImageBtn",
    "backgroundColor",
    "uploadBackgroundBtn",
    "objX",
    "objY",
    "objW",
    "objH",
    "objRotation",
    "bringFrontBtn",
    "sendBackBtn",
    "duplicateBtn",
    "deleteBtn"
  ];

  designControls.forEach(id => {
    const element = $(id);
    if (element) element.disabled = designLocked;
  });

  renderCanvas();
}

$("designModeBtn").addEventListener("click", () => {
  setDesignLocked(!designLocked);
});

/* ==========================================
   OBJECT SELECTION AND PROPERTIES
========================================== */

function updatePropertyPanel() {
  const element = selectedElement();

  $("selectionInfo").textContent = element
    ? `${element.type} selected`
    : "No object selected";

  const fields = [
    "objText",
    "bindField",
    "objX",
    "objY",
    "objW",
    "objH",
    "objColor",
    "objStroke",
    "objStrokeWidth",
    "objRadius",
    "objOpacity",
    "objRotation",
    "objFont",
    "objFontSize",
    "objAlign",
    "objWeight",
    "objUnderline",
    "cropZoom"
  ];

  fields.forEach(id => {
    $(id).disabled = !element;
  });

  if (!element) {
    $("objText").value = "";
    $("bindField").value = "";
    return;
  }

  $("objText").value = element.text;
  $("bindField").value = element.bindField;
  $("objX").value = element.x;
  $("objY").value = element.y;
  $("objW").value = element.w;
  $("objH").value = element.h;
  $("objColor").value = safeColor(element.color);
  $("objStroke").value = safeColor(element.stroke);
  $("objStrokeWidth").value = element.strokeWidth;
  $("objRadius").value = element.radius;
  $("objOpacity").value = element.opacity;
  $("objRotation").value = element.rotation;
  $("objFont").value = element.font;
  $("objFontSize").value = element.fontSize;
  $("objAlign").value = element.align;
  $("objWeight").value = element.weight;
  $("objUnderline").checked = element.underline;
  $("cropZoom").value = element.cropZoom;

  const contentLocked = designLocked &&
    !["text", "photo", "signature", "image"].includes(element.type);

  $("objText").disabled = !element || contentLocked;
  $("bindField").disabled = !element || contentLocked;

  renderCanvas();
}

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#087cf0";
}

function updateSelectedProperty(property, value) {
  const element = selectedElement();
  if (!element) return;

  if (
    designLocked &&
    !["text", "bindField"].includes(property)
  ) {
    return;
  }

  element[property] = value;
  renderCanvas();
}

const propertyMap = {
  objText: ["text", value => value],
  bindField: ["bindField", value => value],
  objX: ["x", value => finite(value)],
  objY: ["y", value => finite(value)],
  objW: ["w", value => Math.max(1, finite(value, 1))],
  objH: ["h", value => Math.max(1, finite(value, 1))],
  objColor: ["color", value => value],
  objStroke: ["stroke", value => value],
  objStrokeWidth: ["strokeWidth", value => Math.max(0, finite(value))],
  objRadius: ["radius", value => Math.max(0, finite(value))],
  objOpacity: ["opacity", value => clamp(finite(value), 0, 1)],
  objRotation: ["rotation", value => finite(value)],
  objFont: ["font", value => value],
  objFontSize: ["fontSize", value => Math.max(1, finite(value, 1))],
  objAlign: ["align", value => value],
  objWeight: ["weight", value => value],
  objUnderline: ["underline", value => Boolean(value)],
  cropZoom: ["cropZoom", value => Math.max(.1, finite(value, 1))]
};

Object.entries(propertyMap).forEach(([id, config]) => {
  const [property, convert] = config;

  $(id).addEventListener("input", event => {
    updateSelectedProperty(property, convert(event.target.value));
  });

  $(id).addEventListener("change", event => {
    updateSelectedProperty(property, convert(event.target.value));
  });
});

/* ==========================================
   ADD OBJECTS
========================================== */

function addElement(type) {
  if (designLocked) {
    notify("Unlock the design before adding elements.");
    return;
  }

  const element = normalizeElement({
    id: uid(),
    type,
    x: 50,
    y: 70,
    w: type === "line" ? 200 : 180,
    h: type === "line" ? 0 : 70,
    text: type === "text" ? "New Text" : "",
    color: type === "text" ? "#172338" : "#087cf0",
    stroke: "#172338",
    strokeWidth: type === "line" ? 3 : 1,
    fontSize: 30
  });

  if (type === "photo" || type === "signature" || type === "image") {
    element.w = 180;
    element.h = 210;
    element.color = "#eaf1f8";
  }

  if (type === "circle") {
    element.w = 120;
    element.h = 120;
  }

  currentSideData().elements.push(element);

  selectedId = element.id;
  updatePropertyPanel();
  renderCanvas();
}

const addButtons = {
  addTextBtn: "text",
  addRectBtn: "rect",
  addCircleBtn: "circle",
  addLineBtn: "line",
  addTriangleBtn: "triangle",
  addInvertedTriangleBtn: "invertedTriangle",
  addPolygonBtn: "polygon",
  addPhotoBtn: "photo",
  addSignatureBtn: "signature",
  addImageBtn: "image"
};

Object.entries(addButtons).forEach(([id, type]) => {
  $(id).addEventListener("click", () => {
    if (type === "image") {
      $("imageInput").click();
    } else {
      addElement(type);
    }
  });
});

/* ==========================================
   CANVAS POINTER SUPPORT
========================================== */

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) *
      (canvas.width / rect.width),
    y: (event.clientY - rect.top) *
      (canvas.height / rect.height)
  };
}

function hitTest(point, element) {
  return (
    point.x >= element.x &&
    point.x <= element.x + element.w &&
    point.y >= element.y &&
    point.y <= element.y + element.h
  );
}

canvas.addEventListener("pointerdown", event => {
  const point = canvasPoint(event);
  const elements = currentSideData().elements;

  let found = null;

  for (let i = elements.length - 1; i >= 0; i--) {
    if (hitTest(point, elements[i])) {
      found = elements[i];
      break;
    }
  }

  selectedId = found ? found.id : null;

  if (found && !designLocked) {
    drag = {
      id: found.id,
      startX: point.x,
      startY: point.y,
      originalX: found.x,
      originalY: found.y,
      resizing: (
        point.x > found.x + found.w - 20 &&
        point.y > found.y + found.h - 20
      )
    };

    canvas.setPointerCapture(event.pointerId);
  } else {
    drag = null;
  }

  updatePropertyPanel();
});

canvas.addEventListener("pointermove", event => {
  if (!drag || designLocked) return;

  const element = selectedElement();
  if (!element || element.id !== drag.id) return;

  const point = canvasPoint(event);

  const dx = point.x - drag.startX;
  const dy = point.y - drag.startY;

  if (drag.resizing) {
    element.w = Math.max(15, element.w + dx);
    element.h = Math.max(15, element.h + dy);

    drag.startX = point.x;
    drag.startY = point.y;
  } else {
    element.x = drag.originalX + dx;
    element.y = drag.originalY + dy;
  }

  $("objX").value = Math.round(element.x);
  $("objY").value = Math.round(element.y);
  $("objW").value = Math.round(element.w);
  $("objH").value = Math.round(element.h);

  renderCanvas();
});

canvas.addEventListener("pointerup", () => {
  drag = null;
});

canvas.addEventListener("pointercancel", () => {
  drag = null;
});

/* ==========================================
   OBJECT ACTIONS
========================================== */

$("duplicateBtn").addEventListener("click", () => {
  if (designLocked) return;

  const element = selectedElement();
  if (!element) return;

  const copy = normalizeElement({
    ...element,
    id: uid(),
    x: element.x + 15,
    y: element.y + 15
  });

  currentSideData().elements.push(copy);
  selectedId = copy.id;

  updatePropertyPanel();
});

$("deleteBtn").addEventListener("click", () => {
  if (designLocked) return;

  currentSideData().elements =
    currentSideData().elements.filter(
      element => element.id !== selectedId
    );

  selectedId = null;
  updatePropertyPanel();
});

$("bringFrontBtn").addEventListener("click", () => {
  if (designLocked) return;

  const elements = currentSideData().elements;
  const index = elements.findIndex(item => item.id === selectedId);

  if (index < 0) return;

  const [item] = elements.splice(index, 1);
  elements.push(item);

  renderCanvas();
});

$("sendBackBtn").addEventListener("click", () => {
  if (designLocked) return;

  const elements = currentSideData().elements;
  const index = elements.findIndex(item => item.id === selectedId);

  if (index < 0) return;

  const [item] = elements.splice(index, 1);
  elements.unshift(item);

  renderCanvas();
});

/* ==========================================
   IMAGE UPLOADS
========================================== */

$("imageInput").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const imageData = await readFile(file);

    addElement("image");

    const element = selectedElement();
    element.imageData = imageData;

    imageCache.delete(imageData);

    await renderCanvas();
    notify("Image added.");
  } catch (error) {
    console.error(error);
    notify("Unable to upload image.");
  }

  event.target.value = "";
});

$("uploadBackgroundBtn").addEventListener("click", () => {
  if (!designLocked) $("backgroundInput").click();
});

$("backgroundInput").addEventListener("change", async event => {
  if (designLocked) return;

  const file = event.target.files[0];
  if (!file) return;

  try {
    currentSideData().backgroundImage = await readFile(file);
    renderCanvas();
    notify("Background image updated.");
  } catch (error) {
    notify("Unable to upload background.");
  }

  event.target.value = "";
});

$("backgroundColor").addEventListener("input", event => {
  if (designLocked) return;

  currentSideData().background = event.target.value;
  renderCanvas();
});

/* ==========================================
   ORIENTATION AND SIDE
========================================== */

document.querySelectorAll("[data-orientation]").forEach(button => {
  button.addEventListener("click", () => {
    if (designLocked) {
      notify("Unlock the design to change orientation.");
      return;
    }

    orientation = button.dataset.orientation;

    document.querySelectorAll("[data-orientation]")
      .forEach(item => item.classList.toggle(
        "active",
        item === button
      ));

    resizeCanvas();
  });
});

document.querySelectorAll("[data-side]").forEach(button => {
  button.addEventListener("click", () => {
    currentSide = button.dataset.side;
    selectedId = null;

    document.querySelectorAll("[data-side]")
      .forEach(item => item.classList.toggle(
        "active",
        item === button
      ));

    $("sideTitle").textContent =
      currentSide === "front" ? "Front Side" : "Back Side";

    $("backgroundColor").value =
      currentSideData().background || "#ffffff";

    updatePropertyPanel();
    renderCanvas();
  });
});

/* ==========================================
   ZOOM
========================================== */

function updateZoom() {
  canvas.style.width = `${canvas.width * zoom}px`;
  canvas.style.maxWidth = "100%";
  $("zoomLabel").textContent = `${Math.round(zoom * 100)}%`;
}

$("zoomInBtn").addEventListener("click", () => {
  zoom = clamp(zoom + .1, .3, 2);
  updateZoom();
});

$("zoomOutBtn").addEventListener("click", () => {
  zoom = clamp(zoom - .1, .3, 2);
  updateZoom();
});

$("zoomResetBtn").addEventListener("click", () => {
  zoom = 1;
  updateZoom();
});

/* ==========================================
   CROP CONTROLS
========================================== */

$("resetCropBtn").addEventListener("click", () => {
  updateSelectedProperty("cropZoom", 1);
  $("cropZoom").value = 1;
});

$("fitImageBtn").addEventListener("click", () => {
  const element = selectedElement();

  if (!element) return;

  element.cropZoom = 1;
  $("cropZoom").value = 1;
  renderCanvas();
});

/* ==========================================
   TEMPLATE PRESETS
========================================== */

function applyTemplate(type) {
  if (designLocked) {
    notify("Unlock the design before changing templates.");
    return;
  }

  const side = currentSideData();
  side.elements = [];

  if (type === "professional") {
    side.background = "#ffffff";

    side.elements.push(
      normalizeElement({
        id: uid(),
        type: "rect",
        x: 0,
        y: 0,
        w: canvas.width,
        h: 170,
        color: "#087cf0",
        strokeWidth: 0
      }),
      normalizeElement({
        id: uid(),
        type: "photo",
        x: 225,
        y: 210,
        w: 190,
        h: 220,
        bindField: "photoData",
        color: "#edf4fb",
        stroke: "#087cf0",
        strokeWidth: 4
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 40,
        y: 480,
        w: canvas.width - 80,
        h: 55,
        text: "EMPLOYEE NAME",
        bindField: "name",
        align: "center",
        fontSize: 36,
        weight: "800"
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 40,
        y: 550,
        w: canvas.width - 80,
        h: 40,
        text: "Position",
        bindField: "position",
        align: "center",
        fontSize: 24
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 40,
        y: 610,
        w: canvas.width - 80,
        h: 35,
        text: "Employee ID",
        bindField: "id",
        align: "center",
        fontSize: 20
      })
    );
  }

  else if (type === "modern") {
    side.background = "#071a36";

    side.elements.push(
      normalizeElement({
        id: uid(),
        type: "rect",
        x: 0,
        y: 0,
        w: canvas.width,
        h: 230,
        color: "#087cf0",
        strokeWidth: 0
      }),
      normalizeElement({
        id: uid(),
        type: "circle",
        x: canvas.width - 220,
        y: 70,
        w: 260,
        h: 260,
        color: "#35b9ff",
        opacity: .25,
        strokeWidth: 0
      }),
      normalizeElement({
        id: uid(),
        type: "photo",
        x: 220,
        y: 260,
        w: 200,
        h: 230,
        bindField: "photoData",
        color: "#ffffff",
        stroke: "#35b9ff",
        strokeWidth: 4
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 35,
        y: 550,
        w: canvas.width - 70,
        h: 60,
        text: "EMPLOYEE NAME",
        bindField: "name",
        color: "#ffffff",
        align: "center",
        fontSize: 36,
        weight: "800"
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 35,
        y: 620,
        w: canvas.width - 70,
        h: 45,
        text: "Position",
        bindField: "position",
        color: "#35b9ff",
        align: "center",
        fontSize: 24
      })
    );
  }

  else if (type === "minimal") {
    side.background = "#ffffff";

    side.elements.push(
      normalizeElement({
        id: uid(),
        type: "photo",
        x: 220,
        y: 100,
        w: 200,
        h: 230,
        bindField: "photoData"
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 35,
        y: 390,
        w: canvas.width - 70,
        h: 60,
        text: "EMPLOYEE NAME",
        bindField: "name",
        align: "center",
        fontSize: 36,
        weight: "700"
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 35,
        y: 460,
        w: canvas.width - 70,
        h: 45,
        text: "Position",
        bindField: "position",
        align: "center",
        fontSize: 23
      })
    );
  }

  else if (type === "corporate") {
    side.background = "#f5f8fc";

    side.elements.push(
      normalizeElement({
        id: uid(),
        type: "rect",
        x: 0,
        y: 0,
        w: canvas.width,
        h: 130,
        color: "#172338",
        strokeWidth: 0
      }),
      normalizeElement({
        id: uid(),
        type: "rect",
        x: 0,
        y: 130,
        w: 18,
        h: canvas.height - 130,
        color: "#087cf0",
        strokeWidth: 0
      }),
      normalizeElement({
        id: uid(),
        type: "photo",
        x: 225,
        y: 190,
        w: 190,
        h: 220,
        bindField: "photoData",
        stroke: "#087cf0",
        strokeWidth: 3
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 40,
        y: 460,
        w: canvas.width - 80,
        h: 55,
        text: "EMPLOYEE NAME",
        bindField: "name",
        align: "center",
        fontSize: 34,
        weight: "800"
      }),
      normalizeElement({
        id: uid(),
        type: "text",
        x: 40,
        y: 525,
        w: canvas.width - 80,
        h: 40,
        text: "Department",
        bindField: "department",
        align: "center",
        fontSize: 22
      })
    );
  }

  selectedId = null;
  updatePropertyPanel();
  renderCanvas();

  notify(`${type} template applied to ${currentSide}.`);
}

document.querySelectorAll("[data-template]").forEach(button => {
  button.addEventListener("click", () => {
    applyTemplate(button.dataset.template);
  });
});

/* ==========================================
   SAVED LAYOUTS
========================================== */

function refreshLayoutSelect() {
  const select = $("layoutSelect");
  select.innerHTML = '<option value="">Select saved template</option>';

  state.layouts.forEach(layout => {
    const option = document.createElement("option");
    option.value = layout.id;
    option.textContent = layout.name;
    select.appendChild(option);
  });
}

$("saveLayoutBtn").addEventListener("click", async () => {
  const name = $("layoutName").value.trim();

  if (!name) {
    notify("Enter a template name first.");
    return;
  }

  const existing = state.layouts.find(
    item => item.name.toLowerCase() === name.toLowerCase()
  );

  const layout = {
    id: existing ? existing.id : uid(),
    name,
    orientation,
    front: structuredClone(state.front),
    back: structuredClone(state.back),
    updatedAt: new Date().toISOString()
  };

  if (existing) {
    Object.assign(existing, layout);
  } else {
    state.layouts.push(layout);
  }

  await saveWorkspace();
  refreshLayoutSelect();
  $("layoutSelect").value = layout.id;

  setDesignLocked(true);
  notify("Template saved and design locked.");
});

$("loadLayoutBtn").addEventListener("click", async () => {
  const layout = state.layouts.find(
    item => item.id === $("layoutSelect").value
  );

  if (!layout) {
    notify("Select a saved template.");
    return;
  }

  state.front = normalizeSide(layout.front);
  state.back = normalizeSide(layout.back);
  orientation = layout.orientation || "portrait";

  document.querySelectorAll("[data-orientation]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.orientation === orientation
    );
  });

  $("layoutName").value = layout.name;

  selectedId = null;
  resizeCanvas();
  setDesignLocked(true);
  updatePropertyPanel();

  await saveWorkspace();
  notify("Template loaded and locked.");
});

$("deleteLayoutBtn").addEventListener("click", async () => {
  const id = $("layoutSelect").value;

  if (!id) {
    notify("Select a template to delete.");
    return;
  }

  if (!confirm("Delete this saved template?")) return;

  state.layouts = state.layouts.filter(item => item.id !== id);

  await saveWorkspace();
  refreshLayoutSelect();

  notify("Template deleted.");
});

/* ==========================================
   EMPLOYEE FORM
========================================== */

function clearEmployeeForm() {
  $("employeeForm").reset();
  editingEmployeeId = null;
  $("editingEmployeeId").value = "";
  $("addEmployeeBtn").textContent = "Add Employee";
}

$("clearEmployeeFormBtn").addEventListener(
  "click",
  clearEmployeeForm
);

$("employeeForm").addEventListener("submit", async event => {
  event.preventDefault();

  const name = $("empName").value.trim();

  if (!name) {
    notify("Employee name is required.");
    return;
  }

  const existing = editingEmployeeId
    ? getEmployeeById(editingEmployeeId)
    : null;

  const allowRepeat = $("allowRepeatName").checked;

  const duplicate = state.employees.some(employee =>
    employee.name.toLowerCase() === name.toLowerCase() &&
    employee.id !== editingEmployeeId
  );

  if (duplicate && !allowRepeat) {
    notify("This employee name already exists.");
    return;
  }

  try {
    const photoFile = $("empPhoto").files[0];
    const signatureFile = $("empSignature").files[0];

    const photoData = photoFile
      ? await readFile(photoFile)
      : (existing?.photoData || "");

    const signatureData = signatureFile
      ? await readFile(signatureFile)
      : (existing?.signatureData || "");

    const employee = {
      id: existing ? existing.id : uid(),
      name,
      birthday: $("empBirthday").value,
      employeeId: $("empId").value.trim(),
      position: $("empPosition").value.trim(),
      department: $("empDepartment").value.trim(),
      role: $("empRole").value.trim(),
      photoData,
      signatureData,
      printed: existing ? existing.printed : false,
      createdAt: existing
        ? existing.createdAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existing) {
      Object.assign(existing, employee);
      notify("Employee record updated.");
    } else {
      state.employees.push(employee);
      notify("Employee added successfully.");
    }

    await saveWorkspace();
    clearEmployeeForm();
    refreshEmployeeViews();
  } catch (error) {
    console.error(error);
    notify("Unable to save employee information.");
  }
});

function editEmployee(id) {
  const employee = getEmployeeById(id);
  if (!employee) return;

  editingEmployeeId = id;

  $("editingEmployeeId").value = id;
  $("empName").value = employee.name;
  $("empBirthday").value = employee.birthday;
  $("empId").value = employee.employeeId;
  $("empPosition").value = employee.position;
  $("empDepartment").value = employee.department;
  $("empRole").value = employee.role;

  $("empPhoto").value = "";
  $("empSignature").value = "";

  $("addEmployeeBtn").textContent = "Update Employee";

  document.querySelector('[data-tab="employees"]').click();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteEmployee(id) {
  const employee = getEmployeeById(id);
  if (!employee) return;

  if (!confirm(`Delete ${employee.name}?`)) return;

  state.employees = state.employees.filter(
    item => item.id !== id
  );

  batchSelection.delete(id);

  await saveWorkspace();
  refreshEmployeeViews();

  notify("Employee deleted.");
}

/* ==========================================
   EMPLOYEE TABLE AND SEARCH
========================================== */

function refreshEmployeeViews() {
  const query = $("employeeSearch").value.trim().toLowerCase();

  const employees = state.employees.filter(employee => {
    const content = [
      employee.name,
      employee.employeeId,
      employee.position,
      employee.department
    ].join(" ").toLowerCase();

    return content.includes(query);
  });

  $("employeeCount").textContent =
    `${state.employees.length} Employees`;

  const rows = $("employeeRows");
  rows.innerHTML = "";

  if (!employees.length) {
    rows.innerHTML = `
      <tr>
        <td colspan="5" class="empty-cell">
          No employee records found.
        </td>
      </tr>
    `;
  }

  employees.forEach(employee => {
    const tr = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = employee.name;

    const idCell = document.createElement("td");
    idCell.textContent = employee.employeeId || "—";

    const positionCell = document.createElement("td");
    positionCell.textContent = employee.position || "—";

    const departmentCell = document.createElement("td");
    departmentCell.textContent = employee.department || "—";

    const actionsCell = document.createElement("td");

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => editEmployee(employee.id));

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.classList.add("danger-text");
    deleteButton.addEventListener(
      "click",
      () => deleteEmployee(employee.id)
    );

    actionsCell.append(editButton, deleteButton);

    tr.append(
      nameCell,
      idCell,
      positionCell,
      departmentCell,
      actionsCell
    );

    rows.appendChild(tr);
  });

  refreshPreviewEmployee();
  refreshBatchList();
}

$("employeeSearch").addEventListener(
  "input",
  refreshEmployeeViews
);

function refreshPreviewEmployee() {
  const select = $("previewEmployee");
  const selected = select.value;

  select.innerHTML = '<option value="">Sample Employee</option>';

  state.employees.forEach(employee => {
    const option = document.createElement("option");
    option.value = employee.id;
    option.textContent = employee.name;
    select.appendChild(option);
  });

  if (state.employees.some(item => item.id === selected)) {
    select.value = selected;
  }

  renderCanvas();
}

$("previewEmployee").addEventListener("change", renderCanvas);

/* ==========================================
   BATCH EMPLOYEE SELECTION
========================================== */

function getBatchEmployees() {
  const query = $("batchSearch").value.trim().toLowerCase();
  const status = $("printStatus").value;

  return state.employees.filter(employee => {
    const content = [
      employee.name,
      employee.employeeId,
      employee.position
    ].join(" ").toLowerCase();

    if (!content.includes(query)) return false;

    if (status === "printed" && !employee.printed) return false;
    if (status === "unprinted" && employee.printed) return false;

    return true;
  });
}

function refreshBatchList() {
  const list = $("batchRows");
  list.innerHTML = "";

  const employees = getBatchEmployees();

  if (!employees.length) {
    list.innerHTML = '<p class="empty-cell">No matching employees.</p>';
  }

  employees.forEach(employee => {
    const item = document.createElement("label");
    item.className = "batch-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = batchSelection.has(employee.id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        batchSelection.add(employee.id);
      } else {
        batchSelection.delete(employee.id);
      }

      updateBatchSummary();
    });

    const info = document.createElement("div");
    info.className = "batch-item-info";

    const name = document.createElement("strong");
    name.textContent = employee.name;

    const details = document.createElement("span");
    details.textContent =
      `${employee.employeeId || "No ID"} · ${employee.position || "No position"}`;

    info.append(name, details);

    const status = document.createElement("span");
    status.className = employee.printed
      ? "print-status"
      : "print-status unprinted";

    status.textContent = employee.printed ? "Printed" : "Unprinted";

    item.append(checkbox, info, status);
    list.appendChild(item);
  });

  updateBatchSummary();
}

function updateBatchSummary() {
  const count = batchSelection.size;

  $("batchSummary").textContent =
    `${count} selected`;

  $("printBatchBtn").disabled = count === 0;
}

$("batchSearch").addEventListener("input", refreshBatchList);
$("printStatus").addEventListener("change", refreshBatchList);

$("selectAllBatchBtn").addEventListener("click", () => {
  getBatchEmployees().forEach(employee => {
    batchSelection.add(employee.id);
  });

  refreshBatchList();
});

$("clearBatchBtn").addEventListener("click", () => {
  batchSelection.clear();
  refreshBatchList();
});

$("markUnprintedBtn").addEventListener("click", async () => {
  if (!batchSelection.size) {
    notify("Select employees first.");
    return;
  }

  state.employees.forEach(employee => {
    if (batchSelection.has(employee.id)) {
      employee.printed = false;
    }
  });

  await saveWorkspace();
  refreshBatchList();

  notify("Selected employees marked as unprinted.");
});

/* ==========================================
   FRONT / BACK VALIDATION
========================================== */

function sideIsComplete(side) {
  if (!side || !Array.isArray(side.elements)) return false;

  return side.elements.some(element => {
    if (
      element.type === "text" &&
      !element.text.trim() &&
      !element.bindField
    ) {
      return false;
    }

    return true;
  });
}

function validatePrint() {
  const printSide = $("printSide").value;

  if (!state.employees.length) {
    return "Add at least one employee before printing.";
  }

  if (!batchSelection.size) {
    return "Select at least one employee.";
  }

  if (
    (printSide === "front" || printSide === "both") &&
    !sideIsComplete(state.front)
  ) {
    return "Front side is incomplete. Add at least one design element.";
  }

  if (
    (printSide === "back" || printSide === "both") &&
    !sideIsComplete(state.back)
  ) {
    return "Back side is incomplete. Add at least one design element.";
  }

  const cardW = finite($("cardW").value);
  const cardH = finite($("cardH").value);

  if (cardW <= 0 || cardH <= 0) {
    return "Enter valid card dimensions.";
  }

  const margin = finite($("printMargin").value);
  const gap = finite($("printGap").value);

  if (margin < 0 || gap < 0) {
    return "Margin and gap cannot be negative.";
  }

  return "";
}

/* ==========================================
   PRINT DIMENSIONS
========================================== */

function getPaperDimensions() {
  const size = $("paperSize").value;

  let width;
  let height;

  if (size === "a4") {
    width = 210;
    height = 297;
  } else if (size === "letter") {
    width = 215.9;
    height = 279.4;
  } else if (size === "legal") {
    width = 215.9;
    height = 355.6;
  } else {
    width = finite($("paperW").value, 210);
    height = finite($("paperH").value, 297);
  }

  if ($("paperOrientation").value === "landscape") {
    [width, height] = [height, width];
  }

  return { width, height };
}

function makePrintCanvas(side, employee) {
  return new Promise(resolve => {
    const output = document.createElement("canvas");

    const dimensions = CANVAS[orientation];

    output.width = dimensions.width;
    output.height = dimensions.height;

    const outputContext = output.getContext("2d");

    outputContext.fillStyle = side.background || "#ffffff";
    outputContext.fillRect(0, 0, output.width, output.height);

    async function draw() {
      if (side.backgroundImage) {
        const bg = await getImage(side.backgroundImage);

        if (bg) {
          const scale = Math.max(
            output.width / bg.width,
            output.height / bg.height
          );

          const width = bg.width * scale;
          const height = bg.height * scale;

          outputContext.drawImage(
            bg,
            (output.width - width) / 2,
            (output.height - height) / 2,
            width,
            height
          );
        }
      }

      const oldCanvas = canvas;
      const oldCtx = ctx;

      for (const element of side.elements) {
        await drawPrintElement(
          outputContext,
          element,
          employee
        );
      }

      resolve(output.toDataURL("image/png"));
    }

    draw().catch(error => {
      console.error(error);
      resolve(output.toDataURL("image/png"));
    });
  });
}

async function drawPrintElement(context, element, employee) {
  context.save();

  context.globalAlpha = element.opacity;

  const centerX = element.x + element.w / 2;
  const centerY = element.y + element.h / 2;

  context.translate(centerX, centerY);
  context.rotate(element.rotation * Math.PI / 180);
  context.translate(-centerX, -centerY);

  const x = element.x;
  const y = element.y;
  const w = element.w;
  const h = element.h;

  context.fillStyle = element.color;
  context.strokeStyle = element.stroke;
  context.lineWidth = element.strokeWidth;

  if (element.type === "rect") {
    const radius = Math.min(element.radius, w / 2, h / 2);

    context.beginPath();
    context.roundRect(x, y, w, h, radius);
    context.fill();

    if (element.strokeWidth > 0) context.stroke();
  }

  else if (element.type === "circle") {
    context.beginPath();
    context.ellipse(
      x + w / 2,
      y + h / 2,
      w / 2,
      h / 2,
      0,
      0,
      Math.PI * 2
    );
    context.fill();

    if (element.strokeWidth > 0) context.stroke();
  }

  else if (
    element.type === "triangle" ||
    element.type === "invertedTriangle"
  ) {
    context.beginPath();

    if (element.type === "triangle") {
      context.moveTo(x + w / 2, y);
      context.lineTo(x + w, y + h);
      context.lineTo(x, y + h);
    } else {
      context.moveTo(x, y);
      context.lineTo(x + w, y);
      context.lineTo(x + w / 2, y + h);
    }

    context.closePath();
    context.fill();

    if (element.strokeWidth > 0) context.stroke();
  }

  else if (element.type === "polygon") {
    context.beginPath();
    context.moveTo(x + w / 2, y);
    context.lineTo(x + w, y + h * .35);
    context.lineTo(x + w * .8, y + h);
    context.lineTo(x + w * .2, y + h);
    context.lineTo(x, y + h * .35);
    context.closePath();
    context.fill();

    if (element.strokeWidth > 0) context.stroke();
  }

  else if (element.type === "line") {
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + w, y + h);
    context.strokeStyle = element.color;
    context.lineWidth = Math.max(1, element.strokeWidth);
    context.stroke();
  }

  else if (element.type === "text") {
    const text = element.bindField
      ? employeeValue(employee, element.bindField)
      : element.text;

    const size = element.fontSize || 28;

    context.font =
      `${element.weight} ${size}px "${element.font}"`;

    context.textAlign = element.align;
    context.textBaseline = "middle";
    context.fillStyle = element.color;

    let textX = x;

    if (element.align === "center") textX += w / 2;
    if (element.align === "right") textX += w;

    String(text || "").split("\n").forEach((line, index) => {
      context.fillText(
        line,
        textX,
        y + size / 2 + index * size * 1.25,
        w
      );
    });
  }

  else if (
    ["image", "photo", "signature"].includes(element.type)
  ) {
    let source = element.imageData;

    if (element.bindField === "photoData") {
      source = employee.photoData;
    }

    if (element.bindField === "signatureData") {
      source = employee.signatureData;
    }

    const image = await getImage(source);

    if (image) {
      const scale = Math.max(w / image.width, h / image.height) *
        element.cropZoom;

      const width = image.width * scale;
      const height = image.height * scale;

      context.save();
      context.beginPath();
      context.rect(x, y, w, h);
      context.clip();

      context.drawImage(
        image,
        x + (w - width) / 2,
        y + (h - height) / 2,
        width,
        height
      );

      context.restore();
    } else {
      context.fillStyle = "#edf2f7";
      context.fillRect(x, y, w, h);
    }

    if (element.strokeWidth > 0) {
      context.strokeStyle = element.stroke;
      context.lineWidth = element.strokeWidth;
      context.strokeRect(x, y, w, h);
    }
  }

  context.restore();
}

/* ==========================================
   PRINT PAGE GENERATION
========================================== */

async function buildPrintPages() {
  const selectedEmployees = state.employees.filter(
    employee => batchSelection.has(employee.id)
  );

  const printSide = $("printSide").value;
  const paper = getPaperDimensions();

  const cardW = finite($("cardW").value, 54);
  const cardH = finite($("cardH").value, 86);
  const margin = finite($("printMargin").value, 8);
  const gap = finite($("printGap").value, 4);

  const availableW = paper.width - margin * 2;
  const availableH = paper.height - margin * 2;

  const columns = Math.floor(
    (availableW + gap) / (cardW + gap)
  );

  const rows = Math.floor(
    (availableH + gap) / (cardH + gap)
  );

  const perPage = columns * rows;

  if (perPage < 1) {
    throw new Error(
      "Card size is too large for the selected paper."
    );
  }

  const sides = printSide === "both"
    ? ["front", "back"]
    : [printSide];

  const pages = [];

  for (const sideName of sides) {
    const side = state[sideName];

    for (
      let start = 0;
      start < selectedEmployees.length;
      start += perPage
    ) {
      const group = selectedEmployees.slice(
        start,
        start + perPage
      );

      const cards = [];

      for (const employee of group) {
        cards.push({
          employeeId: employee.id,
          name: employee.name,
          image: await makePrintCanvas(side, employee)
        });
      }

      pages.push({
        side: sideName,
        paper,
        cardW,
        cardH,
        margin,
        gap,
        columns,
        rows,
        cards
      });
    }
  }

  return pages;
}

/* ==========================================
   PRINT PREVIEW WINDOW
========================================== */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function openPrintWindow(pages) {
  const popup = window.open("", "_blank");

  if (!popup) {
    throw new Error(
      "The print window was blocked. Allow pop-ups and try again."
    );
  }

  const pageHTML = pages.map(page => {
    const contentWidth = page.paper.width;
    const contentHeight = page.paper.height;

    const cardsHTML = page.cards.map(card => `
      <div class="id-card">
        <img src="${card.image}" alt="${escapeHTML(card.name)}">
      </div>
    `).join("");

    return `
      <section class="sheet">
        <div class="sheet-heading">
          ${page.side.toUpperCase()} SIDE
        </div>

        <div class="sheet-grid"
          style="
            width:${contentWidth}mm;
            height:${contentHeight}mm;
            padding:${page.margin}mm;
            grid-template-columns:repeat(${page.columns}, ${page.cardW}mm);
            grid-auto-rows:${page.cardH}mm;
            gap:${page.gap}mm;
          ">
          ${cardsHTML}
        </div>
      </section>
    `;
  }).join("");

  const firstPage = pages[0];

  popup.document.open();

  popup.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <title>LinkTech ID Maker Mo - Print Preview</title>

      <style>
        * { box-sizing:border-box; }

        body {
          margin:0;
          padding:20px;
          background:#e8edf4;
          color:#172338;
          font-family:Arial,sans-serif;
        }

        .print-toolbar {
          position:sticky;
          top:0;
          z-index:5;
          display:flex;
          justify-content:center;
          gap:10px;
          padding:12px;
          margin-bottom:20px;
          background:#fff;
          border-radius:10px;
        }

        button {
          padding:11px 20px;
          border:0;
          border-radius:7px;
          background:#087cf0;
          color:#fff;
          font-weight:bold;
          cursor:pointer;
        }

        button.close {
          background:#64748b;
        }

        .sheet {
          margin:0 auto 25px;
          padding:10px;
          background:#fff;
          width:max-content;
          max-width:100%;
          box-shadow:0 5px 25px rgba(0,0,0,.12);
          overflow:auto;
        }

        .sheet-heading {
          padding:5px;
          text-align:center;
          font-size:10px;
          font-weight:bold;
          color:#64748b;
        }

        .sheet-grid {
          display:grid;
          align-content:start;
          justify-content:start;
          background:#fff;
        }

        .id-card {
          width:100%;
          height:100%;
          overflow:hidden;
        }

        .id-card img {
          display:block;
          width:100%;
          height:100%;
          object-fit:fill;
        }

        @page {
          size:${firstPage.paper.width}mm ${firstPage.paper.height}mm;
          margin:0;
        }

        @media print {
          body {
            padding:0;
            background:#fff;
          }

          .print-toolbar {
            display:none !important;
          }

          .sheet {
            margin:0;
            padding:0;
            box-shadow:none;
            page-break-after:always;
            break-after:page;
          }

          .sheet:last-child {
            page-break-after:auto;
            break-after:auto;
          }

          .sheet-heading {
            display:none;
          }
        }
      </style>
    </head>

    <body>

      <div class="print-toolbar">
        <button onclick="window.print()">Print Cards</button>
        <button class="close" onclick="window.close()">Close Preview</button>
      </div>

      ${pageHTML}

    </body>
    </html>
  `);

  popup.document.close();
  popup.focus();

  return popup;
}

$("printBatchBtn").addEventListener("click", async () => {
  const validation = validatePrint();

  $("printValidation").textContent = validation;

  if (validation) {
    notify(validation);
    return;
  }

  $("printBatchBtn").disabled = true;
  $("printBatchBtn").textContent = "Preparing Preview...";

  try {
    const pages = await buildPrintPages();

    openPrintWindow(pages);

    /*
      Important:
      Opening a preview does not prove that physical printing
      was completed. Employees remain marked unprinted until
      the user confirms the print operation.
    */

    const confirmed = confirm(
      "The print preview has opened. Did you complete printing?"
    );

    if (confirmed) {
      state.employees.forEach(employee => {
        if (batchSelection.has(employee.id)) {
          employee.printed = true;
        }
      });

      await saveWorkspace();
      refreshEmployeeViews();

      notify("Selected records marked as printed.");
    } else {
      notify("Print status was not changed.");
    }

  } catch (error) {
    console.error(error);
    $("printValidation").textContent = error.message;
    notify(error.message);
  } finally {
    $("printBatchBtn").disabled = false;
    $("printBatchBtn").textContent = "Preview and Print";
    updateBatchSummary();
  }
});

/* ==========================================
   PAPER SIZE CONTROLS
========================================== */

$("paperSize").addEventListener("change", () => {
  const custom = $("paperSize").value === "custom";

  $("paperW").disabled = !custom;
  $("paperH").disabled = !custom;
});

$("paperOrientation").addEventListener(
  "change",
  () => notify("Paper orientation updated.")
);

/* ==========================================
   JSON BACKUP / RESTORE
========================================== */

$("exportWorkspaceBtn").addEventListener("click", () => {
  const backup = {
    app: "LinkTech ID Maker Mo",
    version: 2,
    exportedAt: new Date().toISOString(),
    workspace: state
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download =
    `LinkTech-ID-Maker-Backup-${Date.now()}.json`;

  anchor.click();

  URL.revokeObjectURL(url);

  notify("Workspace backup exported.");
});

$("importWorkspaceInput").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const content = await file.text();
    const backup = JSON.parse(content);

    const imported = backup.workspace || backup;

    if (
      !imported ||
      typeof imported !== "object" ||
      !Array.isArray(imported.employees)
    ) {
      throw new Error("Invalid LinkTech backup file.");
    }

    if (!confirm(
      "Restore this backup? Your current workspace will be replaced."
    )) {
      event.target.value = "";
      return;
    }

    state = normalizeState(imported);

    selectedId = null;
    batchSelection.clear();

    await saveWorkspace();

    refreshLayoutSelect();
    refreshEmployeeViews();
    resizeCanvas();
    updatePropertyPanel();

    notify("Backup restored successfully.");
  } catch (error) {
    console.error(error);
    notify("Unable to restore backup: " + error.message);
  }

  event.target.value = "";
});

/* ==========================================
   NEW DESIGN
========================================== */

$("newLayoutBtn").addEventListener("click", async () => {
  if (!confirm(
    "Create a new blank ID design? Save your current template first if needed."
  )) {
    return;
  }

  state.front = makeSide();
  state.back = makeSide();

  orientation = "portrait";
  currentSide = "front";
  selectedId = null;

  $("layoutName").value = "";

  document.querySelectorAll("[data-side]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.side === "front"
    );
  });

  document.querySelectorAll("[data-orientation]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.orientation === "portrait"
    );
  });

  $("sideTitle").textContent = "Front Side";
  $("backgroundColor").value = "#ffffff";

  resizeCanvas();
  setDesignLocked(false);
  updatePropertyPanel();

  await saveWorkspace();

  notify("New blank design created.");
});

/* ==========================================
   MAIN SAVE BUTTON
========================================== */

$("saveBtn").addEventListener("click", async () => {
  await saveWorkspace();
});

/* ==========================================
   TAB NAVIGATION
========================================== */

document.querySelectorAll("[data-tab]").forEach(button => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;

    document.querySelectorAll(".tab-btn").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    document.querySelectorAll(".tab-panel").forEach(panel => {
      panel.classList.remove("active");
    });

    const target = $(tab + "Tab");

    if (target) {
      target.classList.add("active");
    }

    if (tab === "design") {
      renderCanvas();
    }

    if (tab === "employees") {
      refreshEmployeeViews();
    }

    if (tab === "batch") {
      refreshBatchList();
    }
  });
});

/* ==========================================
   INITIALIZATION
========================================== */

async function initializeApp() {
  try {
    await openDB();

    const saved = await dbGet("main");

    if (saved) {
      state = normalizeState(saved);
    }

    refreshLayoutSelect();
    refreshEmployeeViews();

    $("paperW").disabled = true;
    $("paperH").disabled = true;

    resizeCanvas();
    updateZoom();
    updatePropertyPanel();

    setDesignLocked(false);

    notify("LinkTech ID Maker Mo is ready.");
  } catch (error) {
    console.error(error);

    notify(
      "Storage initialization failed. Check browser storage permissions."
    );
  }
}

initializeApp();