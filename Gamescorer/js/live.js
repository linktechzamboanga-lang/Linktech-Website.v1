
"use strict";

/* ==========================================
   LINKTECH GAME SCORER
   Screen Sharing Module
   GitHub Pages Compatible
========================================== */

(() => {
  const $ = (id) => document.getElementById(id);

  let screenStream = null;
  let wakeLock = null;

  const state = {
    capturing: false
  };

  // ------------------------------------------
  // Notifications
  // ------------------------------------------

  function notify(message) {
    if (window.GS && typeof GS.notify === "function") {
      GS.notify(message);
    } else {
      console.log("[LinkTech Live]", message);
    }
  }

  // ------------------------------------------
  // Create interface automatically
  // ------------------------------------------

  function createInterface() {
    if ($("linktechScreenShare")) return;

    const panel = document.createElement("section");

    panel.id = "linktechScreenShare";

    panel.style.cssText = `
      max-width:850px;
      margin:24px auto;
      padding:20px;
      background:#ffffff;
      color:#172338;
      border:1px solid #dce8f5;
      border-radius:16px;
      box-shadow:0 5px 20px rgba(15,23,42,.06);
      font-family:Arial,sans-serif;
    `;

    panel.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        flex-wrap:wrap;
      ">
        <div>
          <h2 style="
            margin:0;
            font-size:21px;
            color:#087cf0;
          ">
            LinkTech Live Screen Share
          </h2>

          <p style="
            margin:6px 0 0;
            font-size:13px;
            color:#64748b;
          ">
            Share your live scoreboard through a supported
            broadcasting platform.
          </p>
        </div>

        <span id="ltLiveBadge" style="
          padding:7px 12px;
          border-radius:30px;
          background:#e2e8f0;
          color:#475569;
          font-size:12px;
          font-weight:bold;
        ">
          NOT SHARING
        </span>
      </div>

      <div style="
        margin-top:16px;
        padding:12px;
        background:#f1f7ff;
        border-radius:12px;
        font-size:13px;
        line-height:1.6;
        color:#334155;
      ">
        <strong>Important:</strong>
        This feature previews a captured screen locally.
        It does not automatically broadcast to Facebook
        or Instagram.
      </div>

      <div style="
        margin-top:16px;
        display:flex;
        gap:10px;
        flex-wrap:wrap;
      ">
        <button id="ltStartScreenShare" type="button"
          style="
            border:0;
            border-radius:10px;
            padding:12px 18px;
            background:#087cf0;
            color:white;
            font-weight:bold;
            cursor:pointer;
          ">
          Start Screen Capture
        </button>

        <button id="ltStopScreenShare" type="button"
          disabled
          style="
            border:0;
            border-radius:10px;
            padding:12px 18px;
            background:#e2e8f0;
            color:#64748b;
            font-weight:bold;
            cursor:pointer;
          ">
          Stop Capture
        </button>
      </div>

      <div id="ltLiveStatus" role="status"
        aria-live="polite"
        style="
          margin-top:14px;
          font-size:13px;
          color:#64748b;
        ">
        Ready to share your screen.
      </div>

      <div id="ltPreviewContainer" style="
        display:none;
        margin-top:16px;
        overflow:hidden;
        background:#050816;
        border-radius:12px;
      ">
        <video id="ltScreenPreview"
          autoplay
          muted
          playsinline
          style="
            display:block;
            width:100%;
            height:auto;
            max-height:450px;
            object-fit:contain;
          ">
        </video>
      </div>

      <div style="
        margin-top:16px;
        padding:14px;
        border:1px solid #e2e8f0;
        border-radius:12px;
      ">
        <strong style="font-size:14px">
          How to broadcast
        </strong>

        <ol style="
          margin:10px 0 0;
          padding-left:20px;
          color:#64748b;
          font-size:13px;
          line-height:1.8;
        ">
          <li>Open your supported broadcasting platform.</li>
          <li>Choose its screen-sharing or screen-capture option.</li>
          <li>Select your LinkTech scoreboard screen or browser tab.</li>
          <li>Start the broadcast on that platform.</li>
          <li>Return to LinkTech and control the game.</li>
        </ol>
      </div>
    `;

    const scoreboard = $("scoreboard");

    if (scoreboard && scoreboard.parentNode) {
      scoreboard.parentNode.insertBefore(
        panel,
        scoreboard.nextSibling
      );
    } else {
      document.body.appendChild(panel);
    }

    $("ltStartScreenShare").addEventListener(
      "click",
      startScreenCapture
    );

    $("ltStopScreenShare").addEventListener(
      "click",
      stopScreenCapture
    );
  }

  // ------------------------------------------
  // Browser compatibility
  // ------------------------------------------

  function isSupported() {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getDisplayMedia
    );
  }

  // ------------------------------------------
  // Screen wake lock
  // ------------------------------------------

  async function requestWakeLock() {
    if (!("wakeLock" in navigator)) return;

    try {
      wakeLock = await navigator.wakeLock.request("screen");

      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    } catch (error) {
      console.warn("Wake Lock unavailable:", error);
    }
  }

  async function releaseWakeLock() {
    if (!wakeLock) return;

    try {
      await wakeLock.release();
    } catch (error) {
      console.warn(error);
    }

    wakeLock = null;
  }

  // ------------------------------------------
  // Status display
  // ------------------------------------------

  function updateStatus(message, active = false) {
    const status = $("ltLiveStatus");
    const badge = $("ltLiveBadge");

    if (status) {
      status.textContent = message;
    }

    if (badge) {
      badge.textContent = active
        ? "SCREEN CAPTURING"
        : "NOT SHARING";

      badge.style.background = active
        ? "#fee2e2"
        : "#e2e8f0";

      badge.style.color = active
        ? "#dc2626"
        : "#475569";
    }

    const startButton = $("ltStartScreenShare");
    const stopButton = $("ltStopScreenShare");

    if (startButton) {
      startButton.disabled = active;
      startButton.style.opacity = active ? ".5" : "1";
    }

    if (stopButton) {
      stopButton.disabled = !active;
      stopButton.style.opacity = active ? "1" : ".5";
    }
  }

  // ------------------------------------------
  // Start screen capture
  // ------------------------------------------

  async function startScreenCapture() {
    if (state.capturing) return;

    if (!isSupported()) {
      updateStatus(
        "Screen capture is not supported by this browser. " +
        "Use your broadcasting platform's own screen-sharing feature."
      );

      notify("Browser screen capture is unavailable.");
      return;
    }

    if (!window.isSecureContext) {
      updateStatus(
        "Secure HTTPS connection required for screen capture."
      );
      return;
    }

    try {
      // Must be triggered by the user's button click.
      screenStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: 30
          },
          audio: false
        });

      const video = $("ltScreenPreview");

      video.srcObject = screenStream;

      await video.play();

      state.capturing = true;

      $("ltPreviewContainer").style.display = "block";

      updateStatus(
        "Screen capture is active. This is a local preview, " +
        "not a Facebook broadcast.",
        true
      );

      await requestWakeLock();

      const videoTrack = screenStream.getVideoTracks()[0];

      if (videoTrack) {
        videoTrack.addEventListener(
          "ended",
          stopScreenCapture
        );
      }

      notify("Screen capture started.");

    } catch (error) {
      console.error("Screen capture error:", error);

      if (error.name === "NotAllowedError") {
        updateStatus(
          "Screen sharing was cancelled or permission was denied."
        );
      } else if (error.name === "NotSupportedError") {
        updateStatus(
          "This device or browser does not support screen capture."
        );
      } else {
        updateStatus(
          "Unable to start screen capture: " + error.message
        );
      }

      stopScreenCapture(false);
    }
  }

  // ------------------------------------------
  // Stop screen capture
  // ------------------------------------------

  async function stopScreenCapture(showMessage = true) {
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        track.stop();
      });
    }

    screenStream = null;
    state.capturing = false;

    const video = $("ltScreenPreview");

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    const preview = $("ltPreviewContainer");

    if (preview) {
      preview.style.display = "none";
    }

    await releaseWakeLock();

    updateStatus("Screen capture stopped.", false);

    if (showMessage) {
      notify("Screen capture stopped.");
    }
  }

  // ------------------------------------------
  // Restore wake lock when returning
  // ------------------------------------------

  document.addEventListener("visibilitychange", async () => {
    if (
      state.capturing &&
      document.visibilityState === "visible" &&
      !wakeLock
    ) {
      await requestWakeLock();
    }
  });

  // ------------------------------------------
  // Public API
  // ------------------------------------------

  window.LinkTechLive = {
    start: startScreenCapture,
    stop: stopScreenCapture,

    isCapturing: () => state.capturing,

    isSupported: isSupported
  };

  // ------------------------------------------
  // Initialize
  // ------------------------------------------

  function initialize() {
    createInterface();

    if (!isSupported()) {
      updateStatus(
        "This browser does not provide screen capture. " +
        "Use the platform's built-in sharing feature."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize
    );
  } else {
    initialize();
  }

})();
