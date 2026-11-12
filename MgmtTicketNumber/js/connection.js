/* Replace this with your deployed Cloudflare Worker URL. */
const LT_API_URL = "https://script.google.com/macros/s/AKfycbwTeenIzBZgYhfuObfNdMd-N7rcU_4x9RyIq2ARso8ebp6lk3Ik1zwD-RGDog4vsvN9jw/exec";

LT.connection = {
  online: navigator.onLine,
  reconnecting: false,
  dashboardTimer: null
};

LT.api = async function(action, data = {}) {
  if (!navigator.onLine) throw new Error("No internet connection. Please reconnect.");
  if (!LT_API_URL || LT_API_URL.includes("YOUR-WORKER-NAME")) {
    throw new Error("Configure LT_API_URL in js/connection.js with your Cloudflare Worker URL.");
  }
  let response;
  try {
    response = await fetch(LT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ action, data }),
      cache: "no-store",
      redirect: "follow"
    });
  } catch (error) {
    throw new Error("Cannot reach the LinkTech API. Check the Cloudflare Worker URL and deployment.");
  }
  if (!response.ok) throw new Error("API request failed with HTTP " + response.status + ".");
  let result;
  try { result = await response.json(); }
  catch (_) { throw new Error("The API returned an invalid response. Check your Apps Script deployment and Worker configuration."); }
  if (!result || result.ok === false) {
    throw new Error((result && (result.message || result.error)) || "The server rejected the request.");
  }
  return result.data !== undefined ? result.data : result;
};

LT.updateConnectionUI = function() {
  const status = LT.el("connectionStatus");
  if (status) {
    status.textContent = navigator.onLine ? "Connected" : "Internet Disconnected";
    status.classList.toggle("offline", !navigator.onLine);
  }
};

window.addEventListener("offline", function() {
  LT.connection.online = false;
  LT.updateConnectionUI();
  if (LT.el("appMessage")) LT.message("Internet disconnected. Ticket actions are temporarily unavailable.", "error");
});

window.addEventListener("online", async function() {
  LT.connection.online = true;
  LT.connection.reconnecting = true;
  LT.updateConnectionUI();
  try {
    const roomId = LT.currentRoomId && LT.currentRoomId();
    if (LT.state.token && roomId) {
      await LT.api("setTellerStatus", { token: LT.state.token, roomId, status: "Unavailable" });
      await LT.refreshRoom(roomId);
    }
    LT.message("Connection restored. Queue synchronized. Select Available when ready.", "success");
  } catch (error) {
    LT.message("Connection restored, but synchronization failed: " + error.message, "error");
  } finally {
    LT.connection.reconnecting = false;
    LT.updateConnectionUI();
  }
});

document.addEventListener("DOMContentLoaded", function() {
  LT.updateConnectionUI();
  if (INITIAL_DISPLAY_ID) return;
  if (LT.connection.dashboardTimer) clearInterval(LT.connection.dashboardTimer);
  LT.connection.dashboardTimer = setInterval(function() {
    const roomId = LT.currentRoomId && LT.currentRoomId();
    if (navigator.onLine && LT.state.token && roomId && !LT.connection.reconnecting) {
      LT.refreshRoom(roomId);
    }
  }, 10000);
});
