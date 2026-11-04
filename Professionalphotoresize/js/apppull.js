(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const state = {
    photos: [],
    activeId: null,
    pageCanvases: [],
    printStyle: null,
    layoutSignature: ""
  };

  const presets = {
    "2x2": [2, 2],
    "1x1": [1, 1],
    "3x3": [3, 3],
    passport: [35 / 25.4, 45 / 25.4]
  };

  const paperSizes = {
    a4: [8.2677, 11.6929],
    letter: [8.5, 11],
    legal: [8.5, 14],
    a3: [11.6929, 16.5354],
    photo4x6: [4, 6],
    photo5x7: [5, 7],
    photo8x10: [8, 10]
  };

  const DEFAULT_EDIT = {
    cropX: 0,
    cropY: 0,
    cropW: 100,
    cropH: 100,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    opacity: 100,
    removeBg: false,
    bgColor: "#ffffff",
    bgTolerance: 35,
    rotation: 0
  };

  const uid = () =>
    "p" + Date.now().toString(36) +
    Math.random().toString(36).slice(2, 7);

  const clamp = (v, min, max) =>
    Math.max(min, Math.min(max, Number(v) || 0));

  const round = (n, d = 1) =>
    Number(n).toFixed(d).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1");

  const active = () =>
    state.photos.find(p => p.id === state.activeId) || null;

  const selectedPhotos = () =>
    state.photos.filter(p => p.selected);

  function imageFromURL(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ==========================================
  // PHOTO DIMENSIONS
  // ==========================================

  function dimensionsInches() {
    const preset = $("presetSize").value;

    if (preset === "custom") {
      return [
        clamp($("customW").value, .1, 12),
        clamp($("customH").value, .1, 16)
      ];
    }

    return presets[preset] || [2, 2];
  }

  function targetPixels(size = dimensionsInches()) {
    const dpi = clamp($("dpi").value, 72, 600);

    return [
      Math.max(1, Math.round(size[0] * dpi)),
      Math.max(1, Math.round(size[1] * dpi))
    ];
  }

  function syncSizeUI() {
    $("customSizeFields").classList.toggle(
      "hidden",
      $("presetSize").value !== "custom"
    );

    const [w, h] = dimensionsInches();
    const [pw, ph] = targetPixels();

    $("printDimensions").textContent =
      `${round(w, 2)} × ${round(h, 2)} in`;

    $("pixelDimensions").textContent =
      `${pw} × ${ph} px`;
  }

  function syncPhotoSelect() {
    const select = $("photoSelect");
    select.innerHTML = "";

    if (!state.photos.length) {
      select.add(new Option("Upload a photo first", ""));
      return;
    }

    state.photos.forEach(p => {
      select.add(new Option(p.name, p.id));
    });

    select.value = state.activeId || "";
  }

  // ==========================================
  // EDITING
  // ==========================================

  function currentEdit() {
    return {
      cropX: clamp($("cropX").value, 0, 99),
      cropY: clamp($("cropY").value, 0, 99),
      cropW: clamp($("cropW").value, 1, 100),
      cropH: clamp($("cropH").value, 1, 100),

      brightness: clamp($("brightness").value, 0, 200),
      contrast: clamp($("contrast").value, 0, 200),
      saturation: clamp($("saturation").value, 0, 200),
      opacity: clamp($("opacity").value, 0, 100),

      removeBg: $("removeBg").checked,
      bgColor: $("bgColor").value,
      bgTolerance: clamp($("bgTolerance").value, 0, 150),

      rotation: Number($("rotateBtn").dataset.rotation || 0)
    };
  }

  function updateOutputs() {
    ["brightness", "contrast", "saturation", "opacity"].forEach(id => {
      $(id + "Out").textContent = $(id).value + "%";
    });

    $("toleranceOut").textContent = $("bgTolerance").value;

    syncSizeUI();
  }

  function hexRGB(hex) {
    const v = hex.replace("#", "");

    return [
      parseInt(v.slice(0, 2), 16),
      parseInt(v.slice(2, 4), 16),
      parseInt(v.slice(4, 6), 16)
    ];
  }

  async function makeProcessedCanvas(photo, edit, targetW, targetH) {
    const img = await imageFromURL(photo.original);

    let sx = img.naturalWidth * edit.cropX / 100;
    let sy = img.naturalHeight * edit.cropY / 100;

    let sw = img.naturalWidth * edit.cropW / 100;
    let sh = img.naturalHeight * edit.cropH / 100;

    sw = Math.min(sw, img.naturalWidth - sx);
    sh = Math.min(sh, img.naturalHeight - sy);

    if (sw < 1 || sh < 1) {
      sx = 0;
      sy = 0;
      sw = img.naturalWidth;
      sh = img.naturalHeight;
    }

    const rotated = edit.rotation % 180 !== 0;

    const canvas = document.createElement("canvas");

    canvas.width = rotated ? targetH : targetW;
    canvas.height = rotated ? targetW : targetH;

    const ctx = canvas.getContext("2d", {
      willReadFrequently: true
    });

    ctx.save();

    ctx.translate(canvas.width / 2, canvas.height / 2);

    ctx.rotate(edit.rotation * Math.PI / 180);

    ctx.filter =
      `brightness(${edit.brightness}%) ` +
      `contrast(${edit.contrast}%) ` +
      `saturate(${edit.saturation}%)`;

    ctx.globalAlpha = edit.opacity / 100;

    ctx.drawImage(
      img,
      sx, sy, sw, sh,
      -targetW / 2,
      -targetH / 2,
      targetW,
      targetH
    );

    ctx.restore();

    ctx.filter = "none";
    ctx.globalAlpha = 1;

    if (edit.removeBg) {
      const data = ctx.getImageData(
        0, 0, canvas.width, canvas.height
      );

      const pixels = data.data;
      const target = hexRGB(edit.bgColor);
      const tolerance = edit.bgTolerance ** 2 * 3;

      for (let i = 0; i < pixels.length; i += 4) {
        const dr = pixels[i] - target[0];
        const dg = pixels[i + 1] - target[1];
        const db = pixels[i + 2] - target[2];

        if (
          dr * dr + dg * dg + db * db <= tolerance
        ) {
          pixels[i + 3] = 0;
        }
      }

      ctx.putImageData(data, 0, 0);
    }

    return canvas;
  }

  async function renderEditor() {
    const p = active();

    if (!p) return;

    try {
      const [w, h] = targetPixels();

      const canvas = await makeProcessedCanvas(
        p,
        currentEdit(),
        w,
        h
      );

      const view = $("editorCanvas");

      view.width = canvas.width;
      view.height = canvas.height;

      const ctx = view.getContext("2d");

      ctx.clearRect(0, 0, view.width, view.height);
      ctx.drawImage(canvas, 0, 0);

      $("outputDimensions").textContent =
        `${canvas.width} × ${canvas.height} px`;

    } catch (error) {
      console.error(error);

      alert("Could not process this image. Please try another photo.");
    }
  }

  async function loadPhoto(id) {
    const p = state.photos.find(x => x.id === id);

    if (!p) return;

    state.activeId = p.id;

    syncPhotoSelect();
    renderQueue();

    const image = $("cropperImage");

    image.onload = () => syncCropFrame();
    image.src = p.original;

    $("emptyState").classList.add("hidden");
    $("editorCanvas").classList.remove("hidden");

    $("cropX").value = p.edit.cropX;
    $("cropY").value = p.edit.cropY;
    $("cropW").value = p.edit.cropW;
    $("cropH").value = p.edit.cropH;

    $("brightness").value = p.edit.brightness;
    $("contrast").value = p.edit.contrast;
    $("saturation").value = p.edit.saturation;
    $("opacity").value = p.edit.opacity;

    $("removeBg").checked = p.edit.removeBg;
    $("bgColor").value = p.edit.bgColor;
    $("bgTolerance").value = p.edit.bgTolerance;

    $("rotateBtn").dataset.rotation = p.edit.rotation;

    updateOutputs();
    syncCropFrame();

    await renderEditor();
  }

  function saveEditToActive() {
    const p = active();

    if (!p) return;

    p.edit = currentEdit();

    // An older processed version must not be used
    // after changing the editing settings.
    p.processed = null;

    renderQueue();
  }

  async function applyEdits() {
    const p = active();

    if (!p) {
      alert("Upload a photo first.");
      return;
    }

    saveEditToActive();

    try {
      const [w, h] = targetPixels();

      const canvas = await makeProcessedCanvas(
        p,
        p.edit,
        w,
        h
      );

      p.processed = canvas.toDataURL("image/png");
      p.width = canvas.width;
      p.height = canvas.height;
      p.size = dimensionsInches();

      renderQueue();

      await buildLayout();

      $("layoutSummary").textContent =
        `Edits applied to ${p.name}. ` +
        `Output: ${canvas.width} × ${canvas.height} px.`;

    } catch (error) {
      console.error(error);
      alert("Unable to apply edits.");
    }
  }

  // ==========================================
  // PHOTO SELECTION AND QUEUE
  // ==========================================

  function updateSelectionSummary() {
    const count = selectedPhotos().length;

    const summary = $("layoutSummary");

    if (!state.pageCanvases.length) {
      summary.textContent =
        `${count} photo(s) selected. Build print preview to continue.`;
    }
  }

  function renderQueue() {
    const root = $("photoQueue");

    root.innerHTML = "";

    if (!state.photos.length) {
      root.innerHTML =
        '<p class="muted">No photos uploaded yet.</p>';
      return;
    }

    state.photos.forEach(p => {
      const card = document.createElement("article");

      card.className =
        "queue-card" +
        (p.id === state.activeId ? " active" : "");

      const selectLabel = document.createElement("label");
      selectLabel.className = "check-row";

      const checkbox = document.createElement("input");

      checkbox.type = "checkbox";
      checkbox.checked = !!p.selected;

      checkbox.addEventListener("change", () => {
        p.selected = checkbox.checked;

        invalidateLayout();
        renderQueue();
        updateSelectionSummary();
      });

      selectLabel.append(
        checkbox,
        document.createTextNode(" Select for printing")
      );

      const img = document.createElement("img");

      img.className = "queue-thumb";
      img.alt = p.name;
      img.src = p.processed || p.original;

      const name = document.createElement("div");

      name.className = "queue-name";
      name.textContent = p.name;

      const detail = document.createElement("div");

      detail.className = "queue-detail";

      detail.textContent = p.processed
        ? `${p.width} × ${p.height} px · edited`
        : "Original image";

      const copyLabel = document.createElement("label");

      copyLabel.className = "field";
      copyLabel.textContent = "Copies";

      const copyInput = document.createElement("input");

      copyInput.type = "number";
      copyInput.min = "1";
      copyInput.max = "200";
      copyInput.value = String(
        clamp(p.copies ?? $("copies").value, 1, 200)
      );

      copyInput.addEventListener("change", () => {
        p.copies = Math.floor(
          clamp(copyInput.value, 1, 200)
        );

        copyInput.value = p.copies;

        invalidateLayout();
      });

      copyLabel.append(copyInput);

      const actions = document.createElement("div");

      actions.className = "queue-actions";

      const edit = document.createElement("button");

      edit.className = "btn btn-light";
      edit.textContent = "Edit";
      edit.type = "button";

      edit.addEventListener("click", () => loadPhoto(p.id));

      const del = document.createElement("button");

      del.className = "btn btn-danger-soft";
      del.textContent = "Remove";
      del.type = "button";

      del.addEventListener("click", () => removePhoto(p.id));

      actions.append(edit, del);

      card.append(
        selectLabel,
        img,
        name,
        detail,
        copyLabel,
        actions
      );

      root.append(card);
    });
  }

  function invalidateLayout() {
    state.pageCanvases = [];
    state.layoutSignature = "";

    $("printPreview").innerHTML = `
      <div class="empty-state compact">
        <div class="empty-picture">▤</div>
        <strong>Print preview needs rebuilding</strong>
        <span>Build the layout again to update your selected photos.</span>
      </div>
    `;
  }

  async function addFiles(files) {
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;

      try {
        const src = await readFile(file);

        state.photos.push({
          id: uid(),
          name: file.name,
          original: src,
          processed: null,
          width: 0,
          height: 0,
          size: dimensionsInches(),
          selected: true,
          copies: Number($("copies").value) || 12,
          edit: { ...DEFAULT_EDIT }
        });

      } catch (error) {
        console.error(error);
      }
    }

    if (state.photos.length) {
      state.activeId = state.photos[state.photos.length - 1].id;

      await loadPhoto(state.activeId);
    }

    invalidateLayout();
    syncPhotoSelect();
    renderQueue();
    updateSelectionSummary();
  }

  function removePhoto(id) {
    state.photos = state.photos.filter(p => p.id !== id);

    if (state.activeId === id) {
      state.activeId = state.photos[0]?.id || null;
    }

    invalidateLayout();

    syncPhotoSelect();
    renderQueue();

    if (state.activeId) {
      loadPhoto(state.activeId);
    } else {
      $("editorCanvas").classList.add("hidden");
      $("emptyState").classList.remove("hidden");

      $("cropperImage").removeAttribute("src");

      $("outputDimensions").textContent = "—";
      $("pixelDimensions").textContent = "—";

      $("cropperWrap").classList.add("hidden");
    }

    updateSelectionSummary();
  }

  // ==========================================
  // PRINT PAPER SETTINGS
  // ==========================================

  function getPaperInches() {
    if ($("paperSize").value === "custom") {
      return [
        clamp($("paperW").value, 2, 24),
        clamp($("paperH").value, 2, 36)
      ];
    }

    return paperSizes[$("paperSize").value] || paperSizes.a4;
  }

  function getPhotoSize(p) {
    const size = Array.isArray(p.size)
      ? p.size
      : dimensionsInches();

    return [
      clamp(size[0], .1, 12),
      clamp(size[1], .1, 16)
    ];
  }

  function getPhotoForPrint(p) {
    return p.processed || p.original;
  }

  // Always regenerate the image using the latest edit settings.
  async function refreshProcessedPhoto(p) {
    const edit = p.id === state.activeId
      ? currentEdit()
      : p.edit;

    p.edit = { ...edit };

    const size = p.id === state.activeId
      ? dimensionsInches()
      : getPhotoSize(p);

    const [w, h] = targetPixels(size);

    const canvas = await makeProcessedCanvas(
      p,
      edit,
      w,
      h
    );

    p.processed = canvas.toDataURL("image/png");
    p.width = canvas.width;
    p.height = canvas.height;
    p.size = size;

    return p;
  }

  // ==========================================
  // BUILD PRINT LAYOUT
  // ==========================================

  async function buildLayout() {
    const photos = selectedPhotos();

    if (!photos.length) {
      invalidateLayout();

      $("layoutSummary").textContent =
        "Please select at least one photo for printing.";

      alert("Select at least one photo first.");

      return;
    }

    try {
      // Save the active photo's latest editing settings.
      if (active()) {
        saveEditToActive();
      }

      // Regenerate all selected photos before printing.
      for (const p of photos) {
        await refreshProcessedPhoto(p);
      }

      const [paperW, paperH] = getPaperInches();

      const margin =
        clamp($("margin").value, 0, 30) / 25.4;

      const gap =
        clamp($("gap").value, 0, 30) / 25.4;

      const requestedColumns = Math.floor(
        clamp($("columns").value, 1, 12)
      );

      const fit = $("fitMode").value === "fit";

      const dpi = 150;

      const entries = [];

      for (const p of photos) {
        const copies = Math.floor(
          clamp(p.copies ?? $("copies").value, 1, 200)
        );

        const [w, h] = getPhotoSize(p);

        const src = await imageFromURL(getPhotoForPrint(p));

        for (let i = 0; i < copies; i++) {
          entries.push({
            photo: p,
            image: src,
            width: w,
            height: h
          });
        }
      }

      const maxPhotoW = Math.max(
        ...entries.map(item => item.width)
      );

      const maxPhotoH = Math.max(
        ...entries.map(item => item.height)
      );

      const availableW = paperW - margin * 2;
      const availableH = paperH - margin * 2;

      if (
        availableW <= 0 ||
        availableH <= 0 ||
        maxPhotoW > availableW ||
        maxPhotoH > availableH
      ) {
        throw new Error(
          "The selected photo size is larger than the printable paper area."
        );
      }

      const maxColumns = Math.max(
        1,
        Math.floor(
          (availableW + gap) / (maxPhotoW + gap)
        )
      );

      const columns = Math.min(
        requestedColumns,
        maxColumns
      );

      const cellW = maxPhotoW;
      const cellH = maxPhotoH;

      const rowsFit = Math.max(
        1,
        Math.floor(
          (availableH + gap) / (cellH + gap)
        )
      );

      const perPage = columns * rowsFit;

      const totalPages = fit
        ? 1
        : Math.ceil(entries.length / perPage);

      const pageCanvases = [];

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {

        const startIndex = fit
          ? 0
          : pageIndex * perPage;

        const endIndex = fit
          ? entries.length
          : Math.min(
              startIndex + perPage,
              entries.length
            );

        const pageEntries = entries.slice(
          startIndex,
          endIndex
        );

        const rows = Math.ceil(
          pageEntries.length / columns
        );

        let scale = 1;

        if (fit) {
          const requiredW =
            columns * cellW +
            Math.max(0, columns - 1) * gap;

          const requiredH =
            rows * cellH +
            Math.max(0, rows - 1) * gap;

          scale = Math.min(
            1,
            availableW / requiredW,
            availableH / requiredH
          );
        }

        const canvas = document.createElement("canvas");

        canvas.width = Math.round(paperW * dpi);
        canvas.height = Math.round(paperH * dpi);

        const ctx = canvas.getContext("2d");

        // White paper background.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        const scaledCellW = cellW * scale * dpi;
        const scaledCellH = cellH * scale * dpi;
        const scaledGap = gap * scale * dpi;

        const usedW =
          columns * scaledCellW +
          Math.max(0, columns - 1) * scaledGap;

        const usedH =
          rows * scaledCellH +
          Math.max(0, rows - 1) * scaledGap;

        const startX =
          Math.max(
            margin * dpi,
            (canvas.width - usedW) / 2
          );

        const startY = fit
          ? Math.max(
              margin * dpi,
              (canvas.height - usedH) / 2
            )
          : margin * dpi;

        pageEntries.forEach((entry, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);

          const x =
            startX + col * (scaledCellW + scaledGap);

          const y =
            startY + row * (scaledCellH + scaledGap);

          const photoW = entry.width * scale * dpi;
          const photoH = entry.height * scale * dpi;

          // Center photos of different dimensions
          // inside the common layout cell.
          const photoX =
            x + (scaledCellW - photoW) / 2;

          const photoY =
            y + (scaledCellH - photoH) / 2;

          ctx.drawImage(
            entry.image,
            photoX,
            photoY,
            photoW,
            photoH
          );
        });

        pageCanvases.push({
          canvas,
          widthIn: paperW,
          heightIn: paperH,
          count: pageEntries.length,
          page: pageIndex + 1
        });
      }

      state.pageCanvases = pageCanvases;

      // ======================================
      // RENDER PRINT PREVIEW
      // ======================================

      const preview = $("printPreview");

      preview.innerHTML = "";

      pageCanvases.forEach(item => {
        const box = document.createElement("div");

        box.className = "print-page-thumb";

        const ratio = item.widthIn / item.heightIn;

        box.style.width =
          `min(100%,${Math.round(270 * ratio)}px)`;

        box.style.aspectRatio =
          `${item.widthIn}/${item.heightIn}`;

        const thumb = document.createElement("canvas");

        thumb.width = item.canvas.width;
        thumb.height = item.canvas.height;

        thumb.getContext("2d").drawImage(
          item.canvas,
          0,
          0
        );

        box.append(thumb);
        preview.append(box);
      });

      const totalCopies = entries.length;

      $("layoutSummary").textContent =
        `${photos.length} selected photo(s) · ` +
        `${totalCopies} total copies · ` +
        `${columns} columns · ` +
        `${totalPages} page(s) · ` +
        `Paper ${round(paperW, 2)} × ${round(paperH, 2)} in.`;

      state.layoutSignature = Date.now().toString();

      renderQueue();

    } catch (error) {
      console.error(error);

      invalidateLayout();

      $("layoutSummary").textContent = error.message;

      alert(error.message);
    }
  }

  // ==========================================
  // CLEAN PRINT SYSTEM
  // ==========================================

  function preparePrint() {
    if (!state.pageCanvases.length) {
      alert("Build the print preview first.");
      return;
    }

    const root = $("printRoot");

    root.innerHTML = "";

    state.pageCanvases.forEach((item, index) => {
      const page = document.createElement("div");

      page.className = "print-sheet";

      page.style.width = `${item.widthIn}in`;
      page.style.height = `${item.heightIn}in`;

      const canvas = document.createElement("canvas");

      canvas.width = item.canvas.width;
      canvas.height = item.canvas.height;

      canvas.getContext("2d").drawImage(
        item.canvas,
        0,
        0
      );

      page.append(canvas);
      root.append(page);
    });

    // Override website styles only while printing.
    if (state.printStyle) {
      state.printStyle.remove();
    }

    const style = document.createElement("style");

    style.id = "linktechCleanPrintStyle";

    style.textContent = `
      @media print {

        @page {
          size: auto;
          margin: 0;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: auto !important;
          height: auto !important;
          min-height: 0 !important;
          background: #ffffff !important;
          overflow: visible !important;
        }

        body * {
          visibility: hidden !important;
        }

        #printRoot,
        #printRoot * {
          visibility: visible !important;
        }

        #printRoot {
          display: block !important;
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: auto !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }

        .print-sheet {
          display: block !important;
          position: relative !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: #ffffff !important;
          box-shadow: none !important;
          page-break-after: always !important;
          break-after: page !important;
        }

        .print-sheet:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }

        .print-sheet canvas {
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
      }
    `;

    document.head.append(style);

    state.printStyle = style;

    // Browser print dialog.
    window.print();
  }

  // ==========================================
  // EXPORT SINGLE PHOTO
  // ==========================================

  async function exportSingle() {
    const p = active();

    if (!p) {
      alert("Upload a photo first.");
      return;
    }

    try {
      await refreshProcessedPhoto(p);

      const format = prompt(
        "Export format: enter PNG or JPG",
        "PNG"
      );

      if (!format) return;

      const type = format.toLowerCase().startsWith("j")
        ? "image/jpeg"
        : "image/png";

      const img = await imageFromURL(p.processed);

      const canvas = document.createElement("canvas");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (type === "image/jpeg") {
        ctx.fillStyle = "#ffffff";

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      ctx.drawImage(img, 0, 0);

      const a = document.createElement("a");

      a.href = canvas.toDataURL(type, .95);

      a.download =
        (p.name.replace(/\.[^.]+$/, "") || "photo") +
        (type === "image/png" ? ".png" : ".jpg");

      a.click();

    } catch (error) {
      console.error(error);
      alert("Unable to export this photo.");
    }
  }

  // ==========================================
  // PROJECT EXPORT
  // ==========================================

  function exportProject() {
    const payload = {
      app: "LinkTech Professional Photo Resize",
      version: 2,

      photos: state.photos,

      activeId: state.activeId,

      settings: {
        presetSize: $("presetSize").value,
        dpi: $("dpi").value,

        customW: $("customW").value,
        customH: $("customH").value,

        paperSize: $("paperSize").value,
        paperW: $("paperW").value,
        paperH: $("paperH").value,

        copies: $("copies").value,
        columns: $("columns").value,
        gap: $("gap").value,
        margin: $("margin").value,

        fitMode: $("fitMode").value
      }
    };

    const blob = new Blob(
      [JSON.stringify(payload)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "professional-photo-resize-project.json";

    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ==========================================
  // PROJECT IMPORT
  // ==========================================

  async function importProject(file) {
    try {
      const data = JSON.parse(await file.text());

      if (!Array.isArray(data.photos)) {
        throw new Error("Invalid project file");
      }

      state.photos = data.photos
        .filter(p => p && p.original && p.id)
        .map(p => ({
          ...p,

          selected: p.selected !== false,

          copies: clamp(
            p.copies ?? 1,
            1,
            200
          ),

          size: Array.isArray(p.size)
            ? p.size
            : [2, 2],

          edit: {
            ...DEFAULT_EDIT,
            ...(p.edit || {})
          }
        }));

      state.activeId = state.photos.some(
        p => p.id === data.activeId
      )
        ? data.activeId
        : state.photos[0]?.id || null;

      const settings = data.settings || {};

      Object.entries(settings).forEach(([key, value]) => {
        const element = $(key);

        if (element) {
          element.value = value;
        }
      });

      syncSizeUI();
      syncPhotoSelect();
      renderQueue();

      invalidateLayout();

      if (state.activeId) {
        await loadPhoto(state.activeId);
      }

      alert("Project imported successfully.");

    } catch (error) {
      console.error(error);

      alert(
        "Unable to import this project. " +
        "Please select a valid project JSON file."
      );
    }
  }

  // ==========================================
  // RESET FUNCTIONS
  // ==========================================

  function resetCrop() {
    ["cropX", "cropY"].forEach(id => {
      $(id).value = 0;
    });

    ["cropW", "cropH"].forEach(id => {
      $(id).value = 100;
    });

    saveEditToActive();
    syncCropFrame();
    renderEditor();
  }

  function resetAdjust() {
    ["brightness", "contrast", "saturation"].forEach(id => {
      $(id).value = 100;
    });

    $("opacity").value = 100;

    saveEditToActive();
    renderEditor();
    updateOutputs();
  }

  // ==========================================
  // CROP FRAME
  // ==========================================

  let cropGesture = null;

  function syncCropFrame() {
    const p = active();

    const img = $("cropperImage");
    const frame = $("cropFrame");

    if (!p || !img.naturalWidth) {
      $("cropperWrap").classList.add("hidden");
      return;
    }

    $("cropperWrap").classList.remove("hidden");

    const edit = currentEdit();

    frame.style.left = edit.cropX + "%";
    frame.style.top = edit.cropY + "%";

    frame.style.width =
      Math.min(edit.cropW, 100 - edit.cropX) + "%";

    frame.style.height =
      Math.min(edit.cropH, 100 - edit.cropY) + "%";
  }

  function updateCropFromGesture(ev) {
    if (!cropGesture) return;

    const stage = $("cropperStage");

    const rect = stage.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const dx =
      (ev.clientX - cropGesture.startX) /
      rect.width * 100;

    const dy =
      (ev.clientY - cropGesture.startY) /
      rect.height * 100;

    let { x, y, w, h } = cropGesture.start;

    const min = Math.max(
      2,
      Math.min(8, Math.min(w, h) * .08)
    );

    const mode = cropGesture.mode;

    if (mode === "move") {
      x = clamp(
        cropGesture.start.x + dx,
        0,
        100 - w
      );

      y = clamp(
        cropGesture.start.y + dy,
        0,
        100 - h
      );

    } else {

      if (mode.includes("w")) {
        const nx = clamp(
          cropGesture.start.x + dx,
          0,
          cropGesture.start.x +
          cropGesture.start.w - min
        );

        w =
          cropGesture.start.x +
          cropGesture.start.w - nx;

        x = nx;
      }

      if (mode.includes("e")) {
        w = clamp(
          cropGesture.start.w + dx,
          min,
          100 - x
        );
      }

      if (mode.includes("n")) {
        const ny = clamp(
          cropGesture.start.y + dy,
          0,
          cropGesture.start.y +
          cropGesture.start.h - min
        );

        h =
          cropGesture.start.y +
          cropGesture.start.h - ny;

        y = ny;
      }

      if (mode.includes("s")) {
        h = clamp(
          cropGesture.start.h + dy,
          min,
          100 - y
        );
      }

      x = clamp(x, 0, 99);
      y = clamp(y, 0, 99);

      w = clamp(w, min, 100 - x);
      h = clamp(h, min, 100 - y);
    }

    $("cropX").value = round(x, 2);
    $("cropY").value = round(y, 2);

    $("cropW").value = round(w, 2);
    $("cropH").value = round(h, 2);

    syncCropFrame();

    if (active()) {
      active().edit = currentEdit();
      active().processed = null;
    }

    invalidateLayout();

    renderEditor();
  }

  function beginCropGesture(ev) {
    const handle = ev.target.closest("[data-handle]");

    const frame = $("cropFrame");

    if (!frame || frame.classList.contains("hidden")) {
      return;
    }

    ev.preventDefault();

    const edit = currentEdit();

    cropGesture = {
      startX: ev.clientX,
      startY: ev.clientY,

      start: {
        x: edit.cropX,
        y: edit.cropY,
        w: edit.cropW,
        h: edit.cropH
      },

      mode: handle
        ? handle.dataset.handle
        : "move"
    };

    try {
      ev.target.setPointerCapture(ev.pointerId);
    } catch (_) {}
  }

  // ==========================================
  // SELECT ALL / PRINT ALL
  // ==========================================

  function printAllPhotosOnce() {
    if (!state.photos.length) {
      alert("Upload photos first.");
      return;
    }

    state.photos.forEach(p => {
      p.selected = true;
      p.copies = 1;
    });

    renderQueue();

    buildLayout();
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  $("photoInput").addEventListener("change", async e => {
    await addFiles([...e.target.files]);

    // Allow choosing the same file again.
    e.target.value = "";
  });

  $("photoSelect").addEventListener("change", e => {
    loadPhoto(e.target.value);
  });

  // Editing controls.
  [
    "cropX",
    "cropY",
    "cropW",
    "cropH",
    "brightness",
    "contrast",
    "saturation",
    "opacity",
    "bgColor",
    "bgTolerance",
    "removeBg"
  ].forEach(id => {
    $(id).addEventListener("input", () => {
      if (active()) {
        active().edit = currentEdit();
        active().processed = null;
      }

      updateOutputs();
      syncCropFrame();
      invalidateLayout();
      renderEditor();
    });

    $(id).addEventListener("change", () => {
      saveEditToActive();
    });
  });

  // Size settings.
  [
    "presetSize",
    "customW",
    "customH",
    "dpi"
  ].forEach(id => {
    $(id).addEventListener("change", () => {
      if (active()) {
        active().processed = null;
      }

      syncSizeUI();
      invalidateLayout();
      renderEditor();
    });
  });

  $("rotateBtn").addEventListener("click", () => {
    const rotation = (
      Number($("rotateBtn").dataset.rotation || 0) + 90
    ) % 360;

    $("rotateBtn").dataset.rotation = rotation;

    saveEditToActive();
    invalidateLayout();
    renderEditor();
  });

  $("resetCropBtn").addEventListener("click", resetCrop);

  $("resetAdjustBtn").addEventListener("click", resetAdjust);

  $("sampleBgBtn").addEventListener("click", async () => {
    const p = active();

    if (!p) {
      alert("Upload a photo first.");
      return;
    }

    try {
      const img = await imageFromURL(p.original);

      const canvas = document.createElement("canvas");

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d", {
        willReadFrequently: true
      });

      ctx.drawImage(img, 0, 0);

      const pixel = ctx.getImageData(
        Math.floor(canvas.width / 2),
        Math.floor(canvas.height / 2),
        1,
        1
      ).data;

      $("bgColor").value =
        "#" +
        [pixel[0], pixel[1], pixel[2]]
          .map(v => v.toString(16).padStart(2, "0"))
          .join("");

      saveEditToActive();
      renderEditor();

    } catch (error) {
      console.error(error);
      alert("Unable to sample the image color.");
    }
  });

  // Photo actions.
  $("applyBtn").addEventListener("click", applyEdits);

  $("downloadImageBtn").addEventListener("click", exportSingle);

  // Layout actions.
  $("buildLayoutBtn").addEventListener("click", buildLayout);

  $("addAllBtn").addEventListener("click", printAllPhotosOnce);

  $("printBtn").addEventListener("click", preparePrint);

  // Paper settings.
  $("paperSize").addEventListener("change", () => {
    $("customPaperFields").classList.toggle(
      "hidden",
      $("paperSize").value !== "custom"
    );

    invalidateLayout();
  });

  [
    "paperW",
    "paperH",
    "copies",
    "columns",
    "gap",
    "margin",
    "fitMode"
  ].forEach(id => {
    $(id).addEventListener("change", invalidateLayout);
  });

  // Project management.
  $("exportProjectBtn").addEventListener(
    "click",
    exportProject
  );

  $("importProjectInput").addEventListener("change", async e => {
    const file = e.target.files[0];

    if (file) {
      await importProject(file);
    }

    e.target.value = "";
  });

  $("clearAllBtn").addEventListener("click", () => {
    if (!state.photos.length) return;

    if (!confirm("Clear all photos and reset the project?")) {
      return;
    }

    state.photos = [];
    state.activeId = null;
    state.pageCanvases = [];

    invalidateLayout();

    syncPhotoSelect();
    renderQueue();

    $("editorCanvas").classList.add("hidden");
    $("emptyState").classList.remove("hidden");

    $("cropperImage").removeAttribute("src");
    $("cropperWrap").classList.add("hidden");

    $("outputDimensions").textContent = "—";
    $("pixelDimensions").textContent = "—";

    $("layoutSummary").textContent =
      "Upload a photo, select photos, and build a print layout.";
  });

  // Crop pointer events.
  $("cropperStage").addEventListener(
    "pointerdown",
    beginCropGesture
  );

  $("cropperStage").addEventListener(
    "pointermove",
    ev => {
      if (cropGesture) {
        updateCropFromGesture(ev);
      }
    }
  );

  function endCropGesture() {
    cropGesture = null;
  }

  $("cropperStage").addEventListener(
    "pointerup",
    endCropGesture
  );

  $("cropperStage").addEventListener(
    "pointercancel",
    endCropGesture
  );

  $("cropperStage").addEventListener(
    "lostpointercapture",
    endCropGesture
  );

  // ==========================================
  // PRINT CLEANUP
  // ==========================================

  window.addEventListener("afterprint", () => {
    // Keep the print root hidden after printing.
    const root = $("printRoot");

    root.innerHTML = "";

    if (state.printStyle) {
      state.printStyle.remove();
      state.printStyle = null;
    }
  });

  // ==========================================
  // INITIALIZE APPLICATION
  // ==========================================

  function initialize() {
    syncSizeUI();

    syncPhotoSelect();

    renderQueue();

    $("customPaperFields").classList.toggle(
      "hidden",
      $("paperSize").value !== "custom"
    );

    $("layoutSummary").textContent =
      "Upload photos, select the photos you want, and build a print layout.";

    $("printRoot").innerHTML = "";
  }

  initialize();

})();
