"use strict";

/* ID Maker Mo — reusable layouts, employee records and batch printing */

const $ = id => document.getElementById(id);
const canvas = $("idCanvas");
const ctx = canvas.getContext("2d");
const DB_NAME = "LinkTechIDMakerMoV2";
const STORE = "workspace";

let db;
let currentSide = "front";
let orientation = "landscape";
let selectedId = null;
let drag = null;
let zoom = 1;
let toastTimer;
let images = new Map();
let activeEmployeeId = "";
let batchSelection = new Set();
let editingEmployeeId = null;

let state = {
  id: "workspace",
  layoutName: "Company Employee ID",
  orientation: "landscape",
  front: makeSide(),
  back: makeSide(),
  layouts: [],
  employees: []
};

function makeSide() {
  return {
    backgroundColor: "#ffffff",
    backgroundImage: null,
    bgZoom: 1,
    bgX: 0,
    bgY: 0,
    template: "minimal",
    elements: []
  };
}
function uid() {
  return "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
function finite(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
function color(v, fallback = "#163b70") {
  return typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}
function notify(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}
function sideData(side = currentSide) {
  return state[side];
}
function employeeById(id) {
  return state.employees.find(e => e.id === id);
}
function currentEmployee() {
  return employeeById($("previewEmployee").value) || state.employees[0] || null;
}
function canvasWidth() { return canvas.width; }
function canvasHeight() { return canvas.height; }

function normalizeElement(raw) {
  const e = raw || {};
  const types = ["text", "rect", "circle", "line", "image"];
  if (!types.includes(e.type)) return null;
  return {
    id: typeof e.id === "string" ? e.id : uid(),
    type: e.type,
    x: finite(e.x, 50),
    y: finite(e.y, 50),
    w: Math.max(1, finite(e.w, 150)),
    h: Math.max(1, finite(e.h, 50)),
    text: String(e.text || ""),
    bindField: String(e.bindField || ""),
    imageData: typeof e.imageData === "string" ? e.imageData : null,
    color: color(e.color),
    stroke: color(e.stroke),
    strokeWidth: clamp(finite(e.strokeWidth), 0, 30),
    font: String(e.font || "Arial"),
    fontSize: clamp(finite(e.fontSize, 30), 4, 180),
    weight: String(e.weight || "700"),
    underline: !!e.underline,
    align: ["left", "center", "right"].includes(e.align) ? e.align : "left",
    radius: clamp(finite(e.radius), 0, 200),
    opacity: clamp(finite(e.opacity, 1), .1, 1),
    cropZoom: clamp(finite(e.cropZoom, 1), 1, 4),
    cropX: finite(e.cropX),
    cropY: finite(e.cropY)
  };
}
function normalizeSide(raw) {
  const s = raw || {};
  return {
    backgroundColor: color(s.backgroundColor, "#ffffff"),
    backgroundImage: typeof s.backgroundImage === "string" ? s.backgroundImage : null,
    bgZoom: clamp(finite(s.bgZoom, 1), 1, 5),
    bgX: finite(s.bgX),
    bgY: finite(s.bgY),
    template: String(s.template || "minimal"),
    elements: Array.isArray(s.elements) ? s.elements.map(normalizeElement).filter(Boolean) : []
  };
}
function normalizeEmployee(raw) {
  return {
    id: String(raw.id || uid()),
    name: String(raw.name || "").trim(),
    birthday: String(raw.birthday || ""),
    idNumber: String(raw.idNumber || "").trim(),
    position: String(raw.position || ""),
    department: String(raw.department || ""),
    role: String(raw.role || "Employee"),
    allowRepeatName: !!raw.allowRepeatName,
    signatureData: typeof raw.signatureData === "string" ? raw.signatureData : null,
    printed: !!raw.printed,
    printedAt: raw.printedAt || null
  };
}
function normalizeState(raw) {
  const s = raw || {};
  return {
    id: "workspace",
    layoutName: String(s.layoutName || "Company Employee ID"),
    orientation: s.orientation === "portrait" ? "portrait" : "landscape",
    front: normalizeSide(s.front),
    back: normalizeSide(s.back),
    layouts: Array.isArray(s.layouts) ? s.layouts : [],
    employees: Array.isArray(s.employees) ? s.employees.map(normalizeEmployee) : []
  };
}

/* IndexedDB */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function storeRequest(mode, action) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let req;
    try {
      req = action(tx.objectStore(STORE));
    } catch (error) {
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error || req?.error);
    tx.onabort = () => reject(tx.error || new Error("Storage transaction aborted"));
  });
}
function serializableState() {
  return JSON.parse(JSON.stringify(state));
}
async function saveWorkspace(silent = false) {
  state.layoutName = $("layoutName").value.trim() || "Company Employee ID";
  try {
    await storeRequest("readwrite", store => store.put({
      id: "workspace",
      data: serializableState(),
      savedAt: new Date().toISOString()
    }));
    if (!silent) notify("Workspace saved: layout and employee records.");
  } catch (err) {
    console.error(err);
    notify("Could not save. Export all data as a backup.");
  }
}
$("saveBtn").addEventListener("click", () => saveWorkspace());

/* Images are kept as data URLs so project backups remain portable. */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}
function loadImage(data) {
  return new Promise((resolve, reject) => {
    if (!data) return resolve(null);
    if (images.has(data)) return resolve(images.get(data));
    const img = new Image();
    img.onload = () => { images.set(data, img); resolve(img); };
    img.onerror = () => reject(new Error("Image could not be loaded."));
    img.src = data;
  });
}
async function loadAllImages() {
  const list = [];
  for (const side of ["front", "back"]) {
    if (state[side].backgroundImage) list.push(state[side].backgroundImage);
    state[side].elements.forEach(e => {
      if (e.imageData) list.push(e.imageData);
    });
  }
  state.employees.forEach(e => {
    if (e.signatureData) list.push(e.signatureData);
  });
  await Promise.all([...new Set(list)].map(src => loadImage(src).catch(() => null)));
}

/* Canvas and backgrounds */
function setOrientation(next) {
  if (!["landscape", "portrait"].includes(next) || next === orientation) return;
  const oldW = canvasWidth(), oldH = canvasHeight();
  orientation = next;
  state.orientation = next;
  canvas.width = next === "landscape" ? 856 : 540;
  canvas.height = next === "landscape" ? 540 : 856;

  for (const side of ["front", "back"]) {
    state[side].elements.forEach(e => {
      e.x *= canvasWidth() / oldW;
      e.y *= canvasHeight() / oldH;
      e.w *= canvasWidth() / oldW;
      e.h *= canvasHeight() / oldH;
      if (e.type === "text") e.fontSize *= Math.min(canvasWidth() / oldW, canvasHeight() / oldH);
    });
    state[side].bgX *= canvasWidth() / oldW;
    state[side].bgY *= canvasHeight() / oldH;
  }
  selectedId = null;
  updateUI();
  render();
}
document.querySelectorAll("[data-orientation]").forEach(b =>
  b.addEventListener("click", () => setOrientation(b.dataset.orientation))
);

function drawTemplate(s) {
  const presets = {
    blue: ["#092f78", "#168ef4", "#8be9ff"],
    purple: ["#32106b", "#8e42e9", "#f4a7ff"],
    green: ["#043c44", "#09a889", "#a7f3c6"],
    sunset: ["#f04b68", "#ff9e51", "#ffd56e"],
    dark: ["#080d1b", "#26364f", "#0b1220"],
    minimal: ["#ffffff", "#f4f8fd", "#eaf3fc"]
  };
  const colors = presets[s.template] || presets.minimal;
  const g = ctx.createLinearGradient(0, 0, canvasWidth(), canvasHeight());
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvasWidth(), canvasHeight());

  ctx.save();
  if (s.template === "minimal") {
    ctx.fillStyle = "#168cf5";
    ctx.fillRect(0, 0, canvasWidth() * .025, canvasHeight());
    ctx.fillRect(0, canvasHeight() * .94, canvasWidth(), canvasHeight() * .06);
  } else {
    ctx.globalAlpha = .18;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight() * .7);
    ctx.bezierCurveTo(canvasWidth() * .3, canvasHeight() * .4,
      canvasWidth() * .5, canvasHeight() * 1.1,
      canvasWidth(), canvasHeight() * .55);
    ctx.lineTo(canvasWidth(), canvasHeight());
    ctx.lineTo(0, canvasHeight());
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = .12;
    ctx.beginPath();
    ctx.arc(canvasWidth() * .95, 0, canvasHeight() * .45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
function drawBackground(s) {
  ctx.fillStyle = s.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, canvasWidth(), canvasHeight());
  drawTemplate(s);

  if (s.backgroundImage) {
    const img = images.get(s.backgroundImage);
    if (img) {
      const scale = Math.max(canvasWidth() / img.width, canvasHeight() / img.height) * (s.bgZoom || 1);
      const iw = img.width * scale, ih = img.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvasWidth(), canvasHeight());
      ctx.clip();
      ctx.drawImage(img,
        (canvasWidth() - iw) / 2 + s.bgX,
        (canvasHeight() - ih) / 2 + s.bgY, iw, ih);
      ctx.restore();
    }
  }
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
function resolveText(e, employee) {
  let text = e.text || "";
  const values = {
    name: employee?.name || "",
    birthday: employee?.birthday || "",
    idNumber: employee?.idNumber || "",
    position: employee?.position || "",
    department: employee?.department || "",
    role: employee?.role || ""
  };
  if (e.bindField && values[e.bindField] !== undefined) text = values[e.bindField];
  return text.replace(/\{\{(name|birthday|idNumber|position|department|role)\}\}/g,
    (_, key) => values[key] || "");
}
function drawImageCover(img, x, y, w, h, zoomFactor = 1, cropX = 0, cropY = 0) {
  const scale = Math.max(w / img.width, h / img.height) * zoomFactor;
  const iw = img.width * scale, ih = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2 + cropX, y + (h - ih) / 2 + cropY, iw, ih);
  ctx.restore();
}
function drawElement(e, employee) {
  ctx.save();
  ctx.globalAlpha = e.opacity ?? 1;

  if (e.type === "text") {
    ctx.fillStyle = e.color;
    ctx.font = `${e.weight || "700"} ${e.fontSize || 30}px "${e.font || "Arial"}"`;
    ctx.textBaseline = "top";
    ctx.textAlign = e.align || "left";
    const text = resolveText(e, employee);
    const startX = e.align === "center" ? e.x + e.w / 2 :
      e.align === "right" ? e.x + e.w : e.x;
    const lines = String(text).split("\n");
    const lineHeight = (e.fontSize || 30) * 1.2;
    lines.forEach((line, i) => {
      ctx.fillText(line, startX, e.y + i * lineHeight, Math.max(1, e.w));
      if (e.underline) {
        const metrics = ctx.measureText(line);
        let underlineX = startX;
        if (e.align === "center") underlineX -= metrics.width / 2;
        if (e.align === "right") underlineX -= metrics.width;
        ctx.beginPath();
        ctx.moveTo(underlineX, e.y + i * lineHeight + e.fontSize + 2);
        ctx.lineTo(underlineX + metrics.width, e.y + i * lineHeight + e.fontSize + 2);
        ctx.strokeStyle = e.color;
        ctx.lineWidth = Math.max(1, e.fontSize / 18);
        ctx.stroke();
      }
    });
  } else if (e.type === "rect") {
    roundedRect(e.x, e.y, e.w, e.h, e.radius);
    ctx.fillStyle = e.color;
    ctx.fill();
    if (e.strokeWidth) {
      ctx.strokeStyle = e.stroke;
      ctx.lineWidth = e.strokeWidth;
      ctx.stroke();
    }
  } else if (e.type === "circle") {
    ctx.beginPath();
    ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();
    if (e.strokeWidth) {
      ctx.strokeStyle = e.stroke;
      ctx.lineWidth = e.strokeWidth;
      ctx.stroke();
    }
  } else if (e.type === "line") {
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.x + e.w, e.y + e.h);
    ctx.strokeStyle = e.strokeWidth ? e.stroke : e.color;
    ctx.lineWidth = Math.max(1, e.strokeWidth || 2);
    ctx.stroke();
  } else if (e.type === "image") {
    // Signature fields draw the selected employee's individual signature.
    const data = e.bindField === "signatureData" ? employee?.signatureData : e.imageData;
    const img = data ? images.get(data) : null;
    if (img) {
      if (e.bindField === "signatureData") {
        // Preserve transparent PNG pixels; fit the signature inside its box.
        const scale = Math.min(e.w / img.width, e.h / img.height) * (e.cropZoom || 1);
        const iw = img.width * scale, ih = img.height * scale;
        ctx.save();
        ctx.beginPath();
        ctx.rect(e.x, e.y, e.w, e.h);
        ctx.clip();
        ctx.drawImage(img, e.x + (e.w - iw) / 2 + e.cropX,
          e.y + (e.h - ih) / 2 + e.cropY, iw, ih);
        ctx.restore();
      } else {
        drawImageCover(img, e.x, e.y, e.w, e.h, e.cropZoom, e.cropX, e.cropY);
      }
    } else {
      ctx.fillStyle = "#e8f3ff";
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.fillStyle = "#426789";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(e.bindField === "signatureData" ? "Employee signature" : "Image",
        e.x + e.w / 2, e.y + e.h / 2);
    }
    if (e.strokeWidth) {
      ctx.strokeStyle = e.stroke;
      ctx.lineWidth = e.strokeWidth;
      ctx.strokeRect(e.x, e.y, e.w, e.h);
    }
  }
  ctx.restore();
}
function renderForEmployee(employee, side = currentSide, selection = true) {
  ctx.clearRect(0, 0, canvasWidth(), canvasHeight());
  drawBackground(sideData(side));
  sideData(side).elements.forEach(e => drawElement(e, employee));
  if (selection) {
    const e = sideData(side).elements.find(x => x.id === selectedId);
    if (e && side === currentSide) drawSelection(e);
  }
}
function render() {
  renderForEmployee(currentEmployee(), currentSide, true);
}

/* Select, move, and resize objects with mouse or touch. */
function handlePoints(e) {
  return [
    { id:"nw",x:e.x,y:e.y }, { id:"n",x:e.x+e.w/2,y:e.y },
    { id:"ne",x:e.x+e.w,y:e.y }, { id:"e",x:e.x+e.w,y:e.y+e.h/2 },
    { id:"se",x:e.x+e.w,y:e.y+e.h }, { id:"s",x:e.x+e.w/2,y:e.y+e.h },
    { id:"sw",x:e.x,y:e.y+e.h }, { id:"w",x:e.x,y:e.y+e.h/2 }
  ];
}
function drawSelection(e) {
  ctx.save();
  ctx.strokeStyle = "#087cf0";
  ctx.lineWidth = Math.max(1.5, canvasWidth() / 500);
  ctx.setLineDash([6,4]);
  ctx.strokeRect(e.x,e.y,e.w,e.h);
  ctx.setLineDash([]);
  const r = Math.max(5, canvasWidth() / 95);
  handlePoints(e).forEach(p => {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#087cf0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(p.x-r,p.y-r,r*2,r*2);
    ctx.fill(); ctx.stroke();
  });
  ctx.restore();
}
function pointFromEvent(event) {
  const r = canvas.getBoundingClientRect();
  return { x:(event.clientX-r.left)*canvasWidth()/r.width,
    y:(event.clientY-r.top)*canvasHeight()/r.height };
}
function findHandle(p,e) {
  const tol = Math.max(10, canvasWidth()/45);
  return handlePoints(e).find(h => Math.abs(h.x-p.x)<=tol && Math.abs(h.y-p.y)<=tol)?.id || null;
}
function hit(e,p) {
  return p.x >= e.x && p.x <= e.x+e.w && p.y >= e.y && p.y <= e.y+e.h;
}
canvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  const p = pointFromEvent(event);
  const old = selectedElement();
  const handle = old ? findHandle(p,old) : null;
  if (handle) {
    drag = { mode:"resize",handle,start:p,original:{...old} };
  } else {
    const list = sideData().elements;
    let found = null;
    for (let i=list.length-1;i>=0;i--) if (hit(list[i],p)) { found=list[i];break; }
    if (found) {
      selectedId = found.id;
      drag = { mode:"move",start:p,original:{...found} };
    } else {
      selectedId = null; drag = null;
    }
  }
  try { canvas.setPointerCapture(event.pointerId); } catch {}
  updateProperties(); render();
});
canvas.addEventListener("pointermove", event => {
  if (!drag) return;
  const e = selectedElement();
  if (!e) return;
  const p = pointFromEvent(event), dx=p.x-drag.start.x, dy=p.y-drag.start.y;
  if (drag.mode === "move") {
    e.x = drag.original.x + dx;
    e.y = drag.original.y + dy;
  } else {
    resizeElement(e,drag.original,drag.handle,dx,dy);
  }
  render();
  updateGeometryFields();
});
canvas.addEventListener("pointerup", () => {
  if (!drag) return;
  drag = null;
  updateProperties();
  render();
});
canvas.addEventListener("pointercancel", () => { drag=null; render(); });

function resizeElement(e,o,handle,dx,dy) {
  let l=o.x,t=o.y,r=o.x+o.w,b=o.y+o.h;
  if (handle.includes("w")) l += dx;
  if (handle.includes("e")) r += dx;
  if (handle.includes("n")) t += dy;
  if (handle.includes("s")) b += dy;
  if (r-l<8) { if(handle.includes("w")) l=r-8; else r=l+8; }
  if (b-t<8) { if(handle.includes("n")) t=b-8; else b=t+8; }
  e.x=l;e.y=t;e.w=r-l;e.h=b-t;
  if (e.type==="text") {
    const factor=Math.min(e.w/Math.max(1,o.w),e.h/Math.max(1,o.h));
    e.fontSize=clamp(o.fontSize*factor,4,180);
  }
}
function selectedElement() {
  return sideData().elements.find(e=>e.id===selectedId)||null;
}

/* Object creation and property editing */
function addElement(type, extra={}) {
  const w=canvasWidth(),h=canvasHeight();
  const e=normalizeElement({
    id:uid(),type,x:w*.12,y:h*.14,w:type==="text"?w*.72:w*.22,
    h:type==="text"?45:h*.2,text:type==="text"?"EDIT TEXT":"",color:"#163b70",
    stroke:"#163b70",strokeWidth:type==="rect"||type==="circle"?2:0,
    font:"Arial",fontSize:30,weight:"700",underline:false,align:"left",
    radius:8,opacity:1,cropZoom:1,cropX:0,cropY:0,...extra
  });
  sideData().elements.push(e);
  selectedId=e.id;
  updateProperties();render();
}
$("addTextBtn").addEventListener("click",()=>addElement("text"));
$("addRectBtn").addEventListener("click",()=>addElement("rect"));
$("addCircleBtn").addEventListener("click",()=>addElement("circle"));
$("addLineBtn").addEventListener("click",()=>addElement("line"));
$("addPhotoBtn").addEventListener("click",()=>{$("imageInput").dataset.mode="photo";$("imageInput").click();});
$("addSignatureBtn").addEventListener("click",()=>addElement("image",{
  bindField:"signatureData",imageData:null,x:canvasWidth()*.45,y:canvasHeight()*.68,w:canvasWidth()*.24,h:canvasHeight()*.12
}));

function bindProp(id,prop,convert=v=>v,condition=()=>true) {
  const el=$(id);
  el.addEventListener("input",()=>{
    const e=selectedElement();if(!e||!condition(e))return;
    e[prop]=convert(el.value,e);
    render();
  });
  el.addEventListener("change",updateProperties);
}
bindProp("objText","text",v=>v,e=>e.type==="text");
bindProp("bindField","bindField",v=>v,e=>e.type==="text"||e.type==="image");
bindProp("objX","x",v=>finite(v));
bindProp("objY","y",v=>finite(v));
bindProp("objW","w",v=>Math.max(1,finite(v,1)));
bindProp("objH","h",v=>Math.max(1,finite(v,1)));
bindProp("objColor","color",v=>color(v));
bindProp("objStroke","stroke",v=>color(v));
bindProp("objFont","font",v=>v,e=>e.type==="text");
bindProp("objFontSize","fontSize",v=>clamp(finite(v,30),4,180),e=>e.type==="text");
bindProp("objAlign","align",v=>v,e=>e.type==="text");
bindProp("objWeight","weight",v=>v,e=>e.type==="text");
bindProp("objUnderline","underline",v=>v==="true",e=>e.type==="text");
bindProp("objStrokeWidth","strokeWidth",v=>clamp(finite(v),0,30));
bindProp("objRadius","radius",v=>clamp(finite(v),0,200));
bindProp("objOpacity","opacity",v=>clamp(finite(v,1),.1,1));
$("objOpacity").addEventListener("input",()=>{$("opacityLabel").textContent=Math.round(+$("objOpacity").value*100)+"%";});
$("cropZoom").addEventListener("input",()=>{
  const e=selectedElement();if(!e||e.type!=="image")return;
  e.cropZoom=clamp(finite($("cropZoom").value,1),1,4);
  $("cropZoomLabel").textContent=e.cropZoom.toFixed(2)+"×";
  render();
});
$("resetCropBtn").addEventListener("click",()=>{
  const e=selectedElement();if(!e||e.type!=="image")return;
  e.cropZoom=1;e.cropX=0;e.cropY=0;updateProperties();render();
});
$("fitImageBtn").addEventListener("click",()=>{
  const e=selectedElement();if(!e||e.type!=="image")return;
  e.cropZoom=1;e.cropX=0;e.cropY=0;updateProperties();render();
});
function updateGeometryFields() {
  const e=selectedElement();if(!e)return;
  $("objX").value=Math.round(e.x);$("objY").value=Math.round(e.y);
  $("objW").value=Math.round(e.w);$("objH").value=Math.round(e.h);
  $("objFontSize").value=Math.round(e.fontSize);
}
function updateProperties() {
  const e=selectedElement();
  $("emptySelection").classList.toggle("hidden",!!e);
  $("properties").classList.toggle("hidden",!e);
  $("imageControls").classList.toggle("hidden",!e||e.type!=="image");
  $("selectionInfo").textContent=e?`Selected ${e.type}: drag to move; use handles to resize.`:"Select an object to edit.";
  if(!e)return;
  $("objText").value=e.text||"";
  $("bindField").value=e.bindField||"";
  $("objX").value=Math.round(e.x);$("objY").value=Math.round(e.y);
  $("objW").value=Math.round(e.w);$("objH").value=Math.round(e.h);
  $("objColor").value=e.color;$("objStroke").value=e.stroke;
  $("objFont").value=e.font;$("objFontSize").value=Math.round(e.fontSize);
  $("objAlign").value=e.align;$("objWeight").value=e.weight;
  $("objUnderline").value=String(!!e.underline);
  $("objStrokeWidth").value=e.strokeWidth;$("objRadius").value=e.radius;
  $("objOpacity").value=e.opacity;$("opacityLabel").textContent=Math.round(e.opacity*100)+"%";
  $("cropZoom").value=e.cropZoom;$("cropZoomLabel").textContent=e.cropZoom.toFixed(2)+"×";
}
$("duplicateBtn").addEventListener("click",()=>{
  const e=selectedElement();if(!e)return notify("Select an object first.");
  const copy={...e,id:uid(),x:e.x+18,y:e.y+18};
  const index=sideData().elements.findIndex(x=>x.id===e.id);
  sideData().elements.splice(index+1,0,copy);selectedId=copy.id;
  updateProperties();render();notify("Object duplicated.");
});
$("deleteBtn").addEventListener("click",()=>{
  if(!selectedId)return notify("Select an object first.");
  sideData().elements=sideData().elements.filter(e=>e.id!==selectedId);
  selectedId=null;updateProperties();render();
});
$("bringFrontBtn").addEventListener("click",()=>{
  const e=selectedElement();if(!e)return;
  sideData().elements=sideData().elements.filter(x=>x.id!==e.id);
  sideData().elements.push(e);render();
});
$("sendBackBtn").addEventListener("click",()=>{
  const e=selectedElement();if(!e)return;
  sideData().elements=sideData().elements.filter(x=>x.id!==e.id);
  sideData().elements.unshift(e);render();
});

/* Image upload and background templates */
$("imageInput").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try {
    const data=await readFile(file);await loadImage(data);
    addElement("image",{imageData:data,bindField:"",w:canvasWidth()*.22,h:canvasHeight()*.22});
    notify("Image added. Select it to resize or crop.");
  } catch(err){console.error(err);notify("Image upload failed.");}
  event.target.value="";
});
$("backgroundInput").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try {
    const data=await readFile(file);await loadImage(data);
    sideData().backgroundImage=data;sideData().bgZoom=1;sideData().bgX=0;sideData().bgY=0;
    render();notify("Background image applied.");
  }catch(err){console.error(err);notify("Background image could not be loaded.");}
  event.target.value="";
});
$("backgroundColor").addEventListener("input",event=>{
  sideData().backgroundColor=event.target.value;render();
});
document.querySelectorAll("[data-template]").forEach(button=>{
  button.addEventListener("click",()=>{
    sideData().template=button.dataset.template;
    sideData().backgroundImage=null;sideData().bgX=0;sideData().bgY=0;sideData().bgZoom=1;
    document.querySelectorAll("[data-template]").forEach(b=>b.classList.toggle("active",b===button));
    render();notify("Background updated; layout elements were kept.");
  });
});
document.querySelectorAll("[data-side]").forEach(button=>{
  button.addEventListener("click",()=>{
    currentSide=button.dataset.side;selectedId=null;updateUI();render();
  });
});
$("zoomInBtn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.2,2);updateCanvasSize();});
$("zoomOutBtn").addEventListener("click",()=>{zoom=clamp(zoom-.1,.2,2);updateCanvasSize();});
$("fitViewBtn").addEventListener("click",()=>{
  zoom=clamp((document.querySelector(".canvas-scroll").clientWidth-40)/canvasWidth(),.2,1.5);
  updateCanvasSize();
});
function updateCanvasSize(){
  $("canvasFrame").style.width=canvasWidth()*zoom+"px";
  $("canvasFrame").style.height=canvasHeight()*zoom+"px";
  $("zoomLabel").textContent=Math.round(zoom*100)+"%";
}

/* Employee form. Signature upload is added as an optional field. */
const signatureLabel=document.createElement("label");
signatureLabel.textContent="Employee signature (optional transparent PNG)";
signatureLabel.className="signature-upload-label";
const signatureInput=document.createElement("input");
signatureInput.type="file";signatureInput.accept="image/*";signatureInput.id="empSignature";
signatureLabel.append(signatureInput);
$("allowRepeatName").closest(".check-label").before(signatureLabel);

async function readEmployeeSignature() {
  const file=$("empSignature").files?.[0];
  return file ? await readFile(file) : null;
}
function clearEmployeeForm() {
  ["empName","empBirthday","empId","empPosition","empDepartment"].forEach(id=>$(id).value="");
  $("empRole").value="Employee";$("allowRepeatName").checked=false;$("empSignature").value="";
  editingEmployeeId=null;$("addEmployeeBtn").textContent="Add employee";
}
$("clearEmployeeFormBtn").addEventListener("click",clearEmployeeForm);

$("addEmployeeBtn").addEventListener("click",async()=>{
  const name=$("empName").value.trim(), idNumber=$("empId").value.trim();
  if(!name||!idNumber)return notify("Full name and unique ID number are required.");

  const allowRepeatName=$("allowRepeatName").checked;
  const role=$("empRole").value;
  if(allowRepeatName&&!["President","General Manager","Manager","Other"].includes(role)) {
    return notify("The repeated-name exception is intended for verified management/shared-name cases.");
  }

  const duplicateId=state.employees.find(e=>e.idNumber.toLowerCase()===idNumber.toLowerCase()&&e.id!==editingEmployeeId);
  if(duplicateId)return notify("Duplicate ID number. Each employee must have a unique ID number.");

  const duplicateName=state.employees.find(e=>e.name.toLowerCase()===name.toLowerCase()&&e.id!==editingEmployeeId);
  if(duplicateName&&!allowRepeatName) {
    return notify("This name already exists. Verify the record or enable the authorized repeat-name exception.");
  }

  try {
    const existing=employeeById(editingEmployeeId);
    const signature=await readEmployeeSignature();
    const employee=normalizeEmployee({
      id:editingEmployeeId||uid(),name,birthday:$("empBirthday").value,idNumber,
      position:$("empPosition").value.trim(),department:$("empDepartment").value.trim(),
      role,allowRepeatName,
      signatureData:signature||existing?.signatureData||null,
      printed:existing?.printed||false,printedAt:existing?.printedAt||null
    });
    if(signature)await loadImage(signature);

    if(existing) {
      state.employees=state.employees.map(e=>e.id===existing.id?employee:e);
    } else {
      state.employees.push(employee);
    }
    clearEmployeeForm();
    refreshEmployeeViews();
    await saveWorkspace(true);
    notify(existing?"Employee updated.":"Employee added.");
  }catch(err){console.error(err);notify("Could not save employee.");}
});

function editEmployee(id) {
  const e=employeeById(id);if(!e)return;
  editingEmployeeId=e.id;
  $("empName").value=e.name;$("empBirthday").value=e.birthday;
  $("empId").value=e.idNumber;$("empPosition").value=e.position;
  $("empDepartment").value=e.department;$("empRole").value=e.role;
  $("allowRepeatName").checked=e.allowRepeatName;$("empSignature").value="";
  $("addEmployeeBtn").textContent="Update employee";
  switchTab("employees");
  window.scrollTo({top:0,behavior:"smooth"});
}
function statusBadge(e) {
  return `<span class="status ${e.printed?"printed":"unprinted"}">${e.printed?"Printed":"Unprinted"}</span>`;
}
function escapeHTML(s) {
  return String(s??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function refreshEmployeeViews() {
  renderEmployeeRows();
  renderBatchRows();
  renderPreviewOptions();
  renderSavedLayouts();
  $("employeeCount").textContent=`${state.employees.length} employee record(s)`;
  render();
}
function renderEmployeeRows() {
  const tbody=$("employeeRows");tbody.replaceChildren();
  state.employees.forEach(e=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${escapeHTML(e.name)}</td>
      <td>${escapeHTML(e.birthday||"—")}</td>
      <td>${escapeHTML(e.idNumber)}</td>
      <td>${escapeHTML(e.position)}<br><small>${escapeHTML(e.department)}</small></td>
      <td>${statusBadge(e)}</td>
      <td><div class="button-row">
        <button class="btn" data-edit="${e.id}">Edit</button>
        <button class="btn" data-toggle="${e.id}">${e.printed?"Mark unprinted":"Mark printed"}</button>
        <button class="btn danger" data-remove="${e.id}">Delete</button>
      </div></td>`;
    tbody.append(tr);
  });
  tbody.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editEmployee(b.dataset.edit)));
  tbody.querySelectorAll("[data-toggle]").forEach(b=>b.addEventListener("click",async()=>{
    const e=employeeById(b.dataset.toggle);if(!e)return;
    e.printed=!e.printed;e.printedAt=e.printed?new Date().toISOString():null;
    await saveWorkspace(true);refreshEmployeeViews();
    notify(e.printed?"Marked as printed.":"Marked unprinted for reprinting.");
  }));
  tbody.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",async()=>{
    const e=employeeById(b.dataset.remove);if(!e)return;
    if(!confirm(`Delete employee "${e.name}"?`))return;
    state.employees=state.employees.filter(x=>x.id!==e.id);
    batchSelection.delete(e.id);
    await saveWorkspace(true);refreshEmployeeViews();notify("Employee record deleted.");
  }));
}
function renderPreviewOptions() {
  const select=$("previewEmployee"),old=select.value;
  select.replaceChildren();
  const none=document.createElement("option");none.value="";none.textContent="Sample / no employee";
  select.append(none);
  state.employees.forEach(e=>{
    const opt=document.createElement("option");opt.value=e.id;
    opt.textContent=`${e.name} (${e.idNumber})`;select.append(opt);
  });
  if(state.employees.some(e=>e.id===old))select.value=old;
}
$("previewEmployee").addEventListener("change",render);

/* Saved layouts store the design only, never employee records. */
function layoutSnapshot() {
  return {
    id:uid(),name:$("layoutName").value.trim()||"Company ID layout",
    orientation,front:JSON.parse(JSON.stringify(state.front)),
    back:JSON.parse(JSON.stringify(state.back)),
    savedAt:new Date().toISOString()
  };
}
async function saveLayout() {
  const name=$("layoutName").value.trim()||"Company ID layout";
  const existing=state.layouts.find(l=>l.name.toLowerCase()===name.toLowerCase());
  const snapshot=layoutSnapshot();
  if(existing) {
    if(!confirm(`A layout named "${name}" already exists. Replace its design?`))return;
    snapshot.id=existing.id;
    state.layouts=state.layouts.map(l=>l.id===existing.id?snapshot:l);
  } else state.layouts.push(snapshot);
  await saveWorkspace(true);
  renderSavedLayouts();
  notify("Reusable layout saved. Employee records remain separate.");
}
$("saveLayoutBtn").addEventListener("click",saveLayout);
function renderSavedLayouts() {
  const list=$("savedLayouts"),select=$("layoutSelect");
  list.replaceChildren();select.replaceChildren();
  const placeholder=document.createElement("option");
  placeholder.value="";placeholder.textContent="Choose a saved layout";
  select.append(placeholder);
  state.layouts.forEach(l=>{
    const opt=document.createElement("option");opt.value=l.id;opt.textContent=l.name;select.append(opt);
    const row=document.createElement("div");row.className="saved-item";
    const info=document.createElement("div");
    const strong=document.createElement("strong");strong.textContent=l.name;
    const small=document.createElement("small");small.textContent=new Date(l.savedAt||Date.now()).toLocaleString();
    info.append(strong,small);
    const del=document.createElement("button");del.className="btn danger";del.textContent="Delete";
    del.addEventListener("click",async()=>{
      if(!confirm(`Delete saved layout "${l.name}"?`))return;
      state.layouts=state.layouts.filter(x=>x.id!==l.id);
      await saveWorkspace(true);renderSavedLayouts();
    });
    row.append(info,del);list.append(row);
  });
}
$("loadLayoutBtn").addEventListener("click",async()=>{
  const l=state.layouts.find(x=>x.id===$("layoutSelect").value);
  if(!l)return notify("Choose a saved layout first.");
  if(!confirm("Load this design and replace the current front/back layout? Employee records will remain unchanged."))return;
  orientation=l.orientation==="portrait"?"portrait":"landscape";
  state.orientation=orientation;state.layoutName=l.name;
  state.front=normalizeSide(l.front);state.back=normalizeSide(l.back);
  canvas.width=orientation==="landscape"?856:540;
  canvas.height=orientation==="landscape"?540:856;
  selectedId=null;
  await loadAllImages();updateUI();render();notify("Layout loaded. Employee records were preserved.");
});

/* Tabs */
function switchTab(tab) {
  document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
  $("designTab").classList.toggle("hidden",tab!=="design");
  $("employeesTab").classList.toggle("hidden",tab!=="employees");
  $("batchTab").classList.toggle("hidden",tab!=="batch");
  if(tab==="batch")renderBatchRows();
}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));

/* Batch selection, search and status filters */
function filteredEmployees() {
  const q=$("batchSearch").value.trim().toLowerCase();
  const status=$("printStatus").value;
  return state.employees.filter(e=>{
    const match=!q||[e.name,e.idNumber,e.position,e.department,e.role].join(" ").toLowerCase().includes(q);
    const statusMatch=status==="all"||(status==="printed"&&e.printed)||(status==="unprinted"&&!e.printed);
    return match&&statusMatch;
  });
}
function renderBatchRows() {
  const tbody=$("batchRows");tbody.replaceChildren();
  filteredEmployees().forEach(e=>{
    const tr=document.createElement("tr");
    const td=document.createElement("td"),check=document.createElement("input");
    check.type="checkbox";check.checked=batchSelection.has(e.id);
    check.addEventListener("change",()=>{
      if(check.checked)batchSelection.add(e.id);else batchSelection.delete(e.id);
      updateBatchSummary();
    });
    td.append(check);
    const name=document.createElement("td");name.textContent=e.name;
    const id=document.createElement("td");id.textContent=e.idNumber;
    const status=document.createElement("td");status.innerHTML=statusBadge(e);
    tr.append(td,name,id,status);tbody.append(tr);
  });
  updateBatchSummary();
}
function updateBatchSummary() {
  const chosen=state.employees.filter(e=>batchSelection.has(e.id));
  $("batchSummary").textContent=`${chosen.length} selected · ${chosen.filter(e=>!e.printed).length} unprinted · ${chosen.filter(e=>e.printed).length} already printed.`;
}
$("batchSearch").addEventListener("input",renderBatchRows);
$("printStatus").addEventListener("change",renderBatchRows);
$("selectAllBatchBtn").addEventListener("click",()=>{
  filteredEmployees().forEach(e=>batchSelection.add(e.id));renderBatchRows();
});
$("clearBatchBtn").addEventListener("click",()=>{batchSelection.clear();renderBatchRows();});
$("markUnprintedBtn").addEventListener("click",async()=>{
  const chosen=state.employees.filter(e=>batchSelection.has(e.id));
  if(!chosen.length)return notify("Select employee records first.");
  chosen.forEach(e=>{e.printed=false;e.printedAt=null;});
  await saveWorkspace(true);refreshEmployeeViews();notify("Selected records marked unprinted.");
});

/* Backup includes layouts and all employee data/signatures. */
function downloadBlob(blob,filename) {
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2500);
}
function filename(s) {
  return String(s||"id-maker-mo").replace(/[^a-z0-9_-]+/gi,"-").replace(/^-+|-+$/g,"")||"id-maker-mo";
}
function exportWorkspace() {
  const blob=new Blob([JSON.stringify(serializableState(),null,2)],{type:"application/json"});
  downloadBlob(blob,filename(state.layoutName)+"-workspace-backup.json");
}
$("exportWorkspaceBtn").addEventListener("click",exportWorkspace);
$("importWorkspaceInput").addEventListener("change",async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try {
    const parsed=JSON.parse(await file.text());
    if(!parsed.front||!parsed.back||!Array.isArray(parsed.employees))throw new Error("Invalid workspace backup");
    if(!confirm("Import this workspace? It replaces the current layout, saved layouts and employee register."))return;
    state=normalizeState(parsed);orientation=state.orientation;currentSide="front";selectedId=null;batchSelection.clear();
    canvas.width=orientation==="landscape"?856:540;canvas.height=orientation==="landscape"?540:856;
    await loadAllImages();updateUI();refreshEmployeeViews();await saveWorkspace(true);
    notify("Workspace, layouts and employee records imported.");
  }catch(err){console.error(err);notify("Import failed. Choose a valid ID Maker Mo workspace backup.");}
  finally{event.target.value="";}
});
$("newLayoutBtn").addEventListener("click",()=>{
  if(!confirm("Start a new blank design? Existing employee records will be kept."))return;
  state.front=makeSide();state.back=makeSide();
  state.layoutName="New Company ID Layout";
  orientation="landscape";state.orientation=orientation;
  canvas.width=856;canvas.height=540;currentSide="front";selectedId=null;
  updateUI();render();notify("New blank layout created. Employee records were kept.");
});

/* Batch printing: one rendered image per employee, same reusable design. */
function printSettings() {
  let paperW=210,paperH=297;
  const preset=$("paperSize").value;
  if(preset==="letter"){paperW=215.9;paperH=279.4;}
  if(preset==="legal"){paperW=215.9;paperH=355.6;}
  if(preset==="custom"){paperW=finite($("paperW").value,210);paperH=finite($("paperH").value,297);}
  if($("paperOrientation").value==="landscape")[paperW,paperH]=[paperH,paperW];
  const cardW=Math.max(20,finite($("cardW").value,85.6));
  const cardH=Math.max(20,finite($("cardH").value,54));
  const margin=clamp(finite($("printMargin").value,5),0,50);
  const gap=clamp(finite($("printGap").value,3),0,30);
  const columns=Math.floor((paperW-margin*2+gap)/(cardW+gap));
  const rows=Math.floor((paperH-margin*2+gap)/(cardH+gap));
  return {paperW,paperH,cardW,cardH,margin,gap,columns,rows};
}
async function cardDataURL(employee,side) {
  const oldSide=currentSide,oldSelected=selectedId;
  currentSide=side;selectedId=null;
  renderForEmployee(employee,side,false);
  const url=canvas.toDataURL("image/png");
  currentSide=oldSide;selectedId=oldSelected;render();
  return url;
}
$("printBatchBtn").addEventListener("click",async()=>{
  const people=state.employees.filter(e=>batchSelection.has(e.id));
  if(!people.length)return notify("Select at least one employee.");
  const side=$("printSide").value;
  const settings=printSettings();
  const perPage=settings.columns*settings.rows;
  if(perPage<1)return notify("The ID size does not fit this paper. Reduce the ID dimensions or margins.");

  const popup=window.open("","_blank");
  if(!popup)return notify("Allow pop-ups for this website to print.");
  popup.document.write("<!doctype html><html><head><title>Preparing ID sheet</title></head><body>Preparing employee ID cards…</body></html>");
  popup.document.close();

  try {
    const cards=[];
    for(const employee of people) {
      cards.push({id:employee.id,name:employee.name,url:await cardDataURL(employee,side)});
    }
    const pages=[];
    for(let i=0;i<cards.length;i+=perPage) {
      const subset=cards.slice(i,i+perPage);
      pages.push(`<section class="sheet"><div class="grid">${subset.map(c=>
        `<div class="card"><img src="${c.url}" alt="ID for ${escapeHTML(c.name)}"><small>${escapeHTML(c.name)}</small></div>`
      ).join("")}</div></section>`);
    }

    const ids=JSON.stringify(people.map(e=>e.id));
    popup.document.open();
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>ID Maker Mo - ${escapeHTML(side)} print</title>
<style>
@page{size:${settings.paperW}mm ${settings.paperH}mm;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:Arial,sans-serif}
.sheet{width:${settings.paperW}mm;height:${settings.paperH}mm;padding:${settings.margin}mm;overflow:hidden;break-after:page;page-break-after:always}
.sheet:last-child{break-after:auto;page-break-after:auto}
.grid{display:grid;grid-template-columns:repeat(${settings.columns},${settings.cardW}mm);grid-auto-rows:${settings.cardH}mm;gap:${settings.gap}mm;align-content:start}
.card{width:${settings.cardW}mm;height:${settings.cardH}mm;position:relative;overflow:hidden}
.card img{display:block;width:100%;height:100%;object-fit:fill}
.card small{position:absolute;left:0;bottom:0;background:#fff9;font-size:1px;color:transparent}
@media screen{body{background:#e8edf5}.sheet{background:white;margin:12px auto;box-shadow:0 2px 15px #0002}}
</style></head><body>${pages.join("")}
<script>
const employeeIds=${ids};
window.addEventListener("afterprint",()=> {
  try { window.opener.postMessage({type:"idmakermo-print-finished",ids:employeeIds},location.origin); } catch(e) {}
});
window.onload=()=>setTimeout(()=>window.print(),500);
<\/script></body></html>`);
    popup.document.close();
    notify("Print preview opened. Check the sheet before printing.");
  } catch(err) {
    console.error(err);
    popup.close();
    notify("Could not prepare the batch print.");
  }
});

/* Mark as printed after the print dialog closes. You can still mark records unprinted. */
window.addEventListener("message",async event=>{
  if(event.origin!==location.origin||event.data?.type!=="idmakermo-print-finished")return;
  const ids=Array.isArray(event.data.ids)?event.data.ids:[];
  ids.forEach(id=>{
    const e=employeeById(id);
    if(e){e.printed=true;e.printedAt=new Date().toISOString();}
  });
  await saveWorkspace(true);
  refreshEmployeeViews();
  notify("Print dialog closed. Selected records marked printed; verify the physical output.");
});

function updateUI() {
  $("layoutName").value=state.layoutName;
  $("dimensionLabel").textContent=`${orientation} · ${canvasWidth()} × ${canvasHeight()} design units`;
  $("sideTitle").textContent=currentSide==="front"?"Front side":"Back side";
  $("backgroundColor").value=sideData().backgroundColor;
  document.querySelectorAll("[data-side]").forEach(b=>b.classList.toggle("active",b.dataset.side===currentSide));
  document.querySelectorAll("[data-orientation]").forEach(b=>b.classList.toggle("active",b.dataset.orientation===orientation));
  updateCanvasSize();updateProperties();renderSavedLayouts();renderPreviewOptions();
}
$("layoutName").addEventListener("input",()=>{state.layoutName=$("layoutName").value;});

async function initialize() {
  try {
    db=await openDB();
    const record=await storeRequest("readonly",store=>store.get("workspace"));
    if(record?.data) {
      state=normalizeState(record.data);
      orientation=state.orientation;
      canvas.width=orientation==="landscape"?856:540;
      canvas.height=orientation==="landscape"?540:856;
    }
  } catch(err) {
    console.error(err);
    notify("Browser storage is unavailable. Export backups regularly.");
  }
  await loadAllImages();
  updateUI();
  refreshEmployeeViews();
  render();
  $("fitViewBtn").click();
}
initialize();
