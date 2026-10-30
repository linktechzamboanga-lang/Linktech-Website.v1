import { FFmpeg } from
  "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js";

import { toBlobURL } from
  "https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js";

// =====================================================
// LINKTECH VIDEO TO MUSIC CONVERTER
// =====================================================

const $ = id => document.getElementById(id);

const videoInput = $("videoInput");
const dropArea = $("dropArea");
const videoPreview = $("videoPreview");
const fileInfo = $("fileInfo");
const engineStatus = $("engineStatus");
const convertBtn = $("convertBtn");
const progressArea = $("progressArea");
const resultPanel = $("resultPanel");
const audioPreview = $("audioPreview");
const downloadBtn = $("downloadBtn");

let selectedFile = null;
let ffmpeg = null;
let engineLoaded = false;
let isConverting = false;
let videoURL = null;
let audioURL = null;
let outputBlob = null;
let toastTimer = null;

// =====================================================
// NOTIFICATIONS
// =====================================================

function notify(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// =====================================================
// FILE UTILITIES
// =====================================================

function formatSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unknown";

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "Unknown duration";

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function getExtension(filename) {
  const ext = filename.split(".").pop().toLowerCase();

  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "mp4";
}

function safeName(filename) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60) || "converted_audio";
}

// =====================================================
// FILE UPLOAD
// =====================================================

videoInput.addEventListener("change", event => {
  const file = event.target.files[0];

  if (file) loadVideo(file);
});

function loadVideo(file) {
  if (isConverting) {
    notify("Please wait until conversion finishes.");
    return;
  }

  if (!file) return;

  if (file.size === 0) {
    notify("This video file is empty.");
    return;
  }

  const valid =
    file.type.startsWith("video/") ||
    /\.(mp4|mov|webm|avi|mkv|m4v|mpeg|mpg|3gp)$/i.test(file.name);

  if (!valid) {
    notify("Please select a supported video file.");
    return;
  }

  clearResults();

  selectedFile = file;

  if (videoURL) URL.revokeObjectURL(videoURL);

  videoURL = URL.createObjectURL(file);

  videoPreview.src = videoURL;
  videoPreview.classList.remove("hidden");

  $("fileName").textContent = file.name;
  $("fileMeta").textContent =
    formatSize(file.size) + " • Reading video information...";

  fileInfo.classList.remove("hidden");

  $("startTime").value = 0;
  $("endTime").value = "";

  $("trimInfo").textContent =
    "Full video audio will be extracted.";

  videoPreview.onloadedmetadata = () => {
    const duration = videoPreview.duration;

    $("fileMeta").textContent =
      `${formatSize(file.size)} • ${formatDuration(duration)} • ` +
      `${videoPreview.videoWidth} × ${videoPreview.videoHeight}`;

    updateTrimInfo();
  };

  videoPreview.onerror = () => {
    notify("Video preview is unavailable. FFmpeg may still support the file.");
  };

  notify("Video successfully selected.");
}

function removeVideo() {
  if (isConverting) return;

  selectedFile = null;

  videoInput.value = "";

  videoPreview.pause();
  videoPreview.removeAttribute("src");
  videoPreview.load();
  videoPreview.classList.add("hidden");

  fileInfo.classList.add("hidden");

  if (videoURL) {
    URL.revokeObjectURL(videoURL);
    videoURL = null;
  }

  clearResults();

  $("endTime").value = "";
  $("startTime").value = 0;

  updateTrimInfo();

  notify("Video removed.");
}

$("removeVideo").addEventListener("click", removeVideo);

// =====================================================
// DRAG AND DROP
// =====================================================

["dragenter", "dragover"].forEach(type => {
  dropArea.addEventListener(type, event => {
    event.preventDefault();
    dropArea.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach(type => {
  dropArea.addEventListener(type, event => {
    event.preventDefault();
    dropArea.classList.remove("dragover");
  });
});

dropArea.addEventListener("drop", event => {
  const file = event.dataTransfer.files[0];

  if (file) {
    loadVideo(file);
  }
});

// =====================================================
// TRIM SETTINGS
// =====================================================

function updateTrimInfo() {
  if (!selectedFile) {
    $("trimInfo").textContent =
      "Upload a video to set the audio duration.";
    return;
  }

  const start = Number($("startTime").value) || 0;
  const endInput = $("endTime").value;

  const videoDuration = videoPreview.duration;

  const end = endInput === ""
    ? videoDuration
    : Number(endInput);

  if (
    !Number.isFinite(videoDuration) ||
    start < 0 ||
    end <= start ||
    end > videoDuration
  ) {
    $("trimInfo").textContent =
      "Check your start and end times.";
    return;
  }

  $("trimInfo").textContent =
    `Selected audio duration: ${formatDuration(end - start)}`;
}

$("startTime").addEventListener("input", updateTrimInfo);
$("endTime").addEventListener("input", updateTrimInfo);

// =====================================================
// VOLUME CONTROL
// =====================================================

$("volume").addEventListener("input", () => {
  $("volumeValue").textContent = $("volume").value + "%";
});

// =====================================================
// FFmpeg ENGINE
// =====================================================

async function loadEngine() {
  if (engineLoaded) return;

  engineStatus.className = "engine-status loading";
  engineStatus.textContent = "Loading FFmpeg conversion engine...";

  notify("Loading conversion engine. Please wait.");

  try {
    ffmpeg = new FFmpeg();

    ffmpeg.on("progress", ({ progress }) => {
      if (!isConverting) return;

      if (Number.isFinite(progress)) {
        const percent = Math.max(
          0,
          Math.min(99, Math.round(progress * 100))
        );

        updateProgress(
          percent,
          "Converting audio...",
          "FFmpeg is processing your video."
        );
      }
    });

    const baseURL =
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";

    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      "text/javascript"
    );

    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      "application/wasm"
    );

    await ffmpeg.load({
      coreURL,
      wasmURL
    });

    engineLoaded = true;

    engineStatus.className = "engine-status ready";
    engineStatus.textContent =
      "FFmpeg conversion engine is ready.";

  } catch (error) {
    engineStatus.className = "engine-status error";
    engineStatus.textContent =
      "Unable to load conversion engine.";

    throw new Error(
      "Could not load FFmpeg. Check your internet connection and try again."
    );
  }
}

// =====================================================
// PROGRESS DISPLAY
// =====================================================

function updateProgress(percent, label, detail) {
  $("progressBar").style.width = percent + "%";
  $("progressPercent").textContent = percent + "%";
  $("progressLabel").textContent = label;
  $("progressDetail").textContent = detail;
}

// =====================================================
// AUDIO FILTERS
// =====================================================

function buildAudioFilters(duration) {
  const filters = [];

  const volume = Number($("volume").value) / 100;

  filters.push(`volume=${volume}`);

  const fadeDuration = Number($("fadeDuration").value);

  if (!Number.isFinite(fadeDuration) || fadeDuration <= 0) {
    throw new Error("Enter a valid fade duration.");
  }

  if (fadeDuration > duration / 2) {
    throw new Error(
      "Fade duration is too long for the selected audio."
    );
  }

  if ($("fadeIn").checked) {
    filters.push(`afade=t=in:st=0:d=${fadeDuration}`);
  }

  if ($("fadeOut").checked) {
    const fadeStart = duration - fadeDuration;

    filters.push(
      `afade=t=out:st=${fadeStart}:d=${fadeDuration}`
    );
  }

  return filters.join(",");
}

// =====================================================
// AUDIO CONVERSION
// =====================================================

async function convertVideo() {
  if (isConverting) return;

  if (!selectedFile) {
    notify("Please upload a video first.");
    return;
  }

  const duration = videoPreview.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    notify("Unable to read video duration.");
    return;
  }

  const start = Number($("startTime").value) || 0;

  const end = $("endTime").value === ""
    ? duration
    : Number($("endTime").value);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end <= start ||
    end > duration
  ) {
    notify("Please enter valid trimming times.");
    return;
  }

  const selectedDuration = end - start;

  const format = $("format").value;
  const quality = $("quality").value;
  const channels = $("channels").value;

  let filters;

  try {
    filters = buildAudioFilters(selectedDuration);
  } catch (error) {
    notify(error.message);
    return;
  }

  isConverting = true;
  convertBtn.disabled = true;
  convertBtn.textContent = "Preparing Conversion...";

  resultPanel.classList.add("hidden");
  progressArea.classList.remove("hidden");

  updateProgress(
    0,
    "Initializing...",
    "Preparing video and audio settings."
  );

  try {
    await loadEngine();

    updateProgress(
      2,
      "Reading video...",
      "Loading video into the conversion engine."
    );

    const inputName =
      "input_video." + getExtension(selectedFile.name);

    const outputName = "output_audio." + format;

    await ffmpeg.writeFile(
      inputName,
      new Uint8Array(await selectedFile.arrayBuffer())
    );

    updateProgress(
      5,
      "Preparing audio...",
      "Setting up conversion parameters."
    );

    const args = [
      "-ss", String(start),
      "-i", inputName,
      "-t", String(selectedDuration),
      "-map", "0:a:0",
      "-vn",
      "-af", filters,
      "-ar", "44100",
      "-ac", channels
    ];

    if (format === "mp3") {
      args.push(
        "-c:a", "libmp3lame",
        "-b:a", quality
      );
    }

    if (format === "wav") {
      args.push(
        "-c:a", "pcm_s16le"
      );
    }

    if (format === "m4a") {
      args.push(
        "-c:a", "aac",
        "-b:a", quality,
        "-movflags", "+faststart"
      );
    }

    args.push(
      "-y",
      outputName
    );

    updateProgress(
      8,
      "Converting...",
      "Please wait while FFmpeg extracts your audio."
    );

    const exitCode = await ffmpeg.exec(args);

    if (exitCode !== 0) {
      throw new Error(
        "Conversion failed. The video may not contain an audio track or may use an unsupported codec."
      );
    }

    updateProgress(
      95,
      "Preparing download...",
      "Creating your audio file."
    );

    const data = await ffmpeg.readFile(outputName);

    if (!data || data.length === 0) {
      throw new Error("The converted audio file is empty.");
    }

    const mimeTypes = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      m4a: "audio/mp4"
    };

    outputBlob = new Blob(
      [data],
      { type: mimeTypes[format] }
    );

    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }

    audioURL = URL.createObjectURL(outputBlob);

    audioPreview.src = audioURL;

    const filename =
      safeName(selectedFile.name) + "." + format;

    downloadBtn.href = audioURL;
    downloadBtn.download = filename;

    $("resultInfo").textContent =
      `${filename} • ${formatSize(outputBlob.size)} • ` +
      `${formatDuration(selectedDuration)} • ${channels === "2" ? "Stereo" : "Mono"}`;

    updateProgress(
      100,
      "Conversion completed!",
      "Your audio file is ready."
    );

    resultPanel.classList.remove("hidden");

    resultPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    notify("Audio successfully converted!");

    // Remove temporary FFmpeg files.
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn("Temporary file cleanup:", cleanupError);
    }

  } catch (error) {
    console.error("Conversion error:", error);

    notify(
      error.message || "Something went wrong during conversion."
    );

    updateProgress(
      0,
      "Conversion failed",
      error.message || "Please check the video and try again."
    );

  } finally {
    isConverting = false;
    convertBtn.disabled = false;
    convertBtn.textContent = "🎵 Convert Video to Music";
  }
}

// =====================================================
// CLEAR CONVERTED RESULTS
// =====================================================

function clearResults() {
  if (audioURL) {
    URL.revokeObjectURL(audioURL);
    audioURL = null;
  }

  outputBlob = null;

  audioPreview.pause();
  audioPreview.removeAttribute("src");
  audioPreview.load();

  downloadBtn.removeAttribute("href");
  downloadBtn.removeAttribute("download");

  resultPanel.classList.add("hidden");
  progressArea.classList.add("hidden");
}

// =====================================================
// RESET APPLICATION
// =====================================================

function resetApp() {
  if (isConverting) {
    notify("Please wait until conversion finishes.");
    return;
  }

  removeVideo();

  $("format").value = "mp3";
  $("quality").value = "192k";
  $("channels").value = "2";
  $("volume").value = "100";
  $("volumeValue").textContent = "100%";

  $("fadeIn").checked = false;
  $("fadeOut").checked = false;
  $("fadeDuration").value = "2";

  $("startTime").value = "0";
  $("endTime").value = "";

  notify("Application has been reset.");
}

// =====================================================
// BUTTON EVENTS
// =====================================================

convertBtn.addEventListener("click", convertVideo);
$("resetBtn").addEventListener("click", resetApp);

// =====================================================
// INITIALIZATION
// =====================================================

engineStatus.className = "engine-status";
engineStatus.textContent =
  "FFmpeg engine will load when you start your first conversion.";
