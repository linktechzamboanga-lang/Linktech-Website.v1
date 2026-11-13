/* ==========================================
   LINKTECH CUSTOMER SELF-SERVICE KIOSK
   Public kiosk page: ?kiosk=ROOM_ID
========================================== */
(function () {
  const serviceLabels = {
    PAYMENT: "Payment",
    DEPOSIT: "Deposit",
    WITHDRAWAL: "Withdrawal",
    RELEASING: "Releasing",
    COMPLAINT: "Complaint",
    OTHER: "Other concern"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function setMessage(message, type) {
    const el = document.getElementById("kioskMessage");
    if (!el) return;
    el.textContent = message;
    el.className = "kiosk-message" + (type ? " " + type : "");
  }


  async function issue(category, button) {
    if (!INITIAL_KIOSK_ID) return;
    if (!navigator.onLine) {
      setMessage("Internet connection is unavailable. Please ask the staff for assistance.", "error");
      return;
    }
    const printWindow = window.open("about:blank", "_blank", "width=420,height=650");
    if (!printWindow) {
      setMessage("Please allow pop-ups for this website so your ticket can print.", "error");
      return;
    }
    printWindow.document.write("<title>Preparing ticket...</title><p style='font-family:Arial;padding:20px'>Preparing your ticket. Please wait...</p>");
    button.disabled = true;
    document.querySelectorAll(".kiosk-service").forEach(el => { el.disabled = true; });
    setMessage("Issuing your " + serviceLabels[category] + " ticket...", "busy");
    try {
      const ticket = await LT.api("createCustomerTicket", {
        roomId: INITIAL_KIOSK_ID,
        category: category
      });
      const popupHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LinkTech Ticket ${escapeHtml(ticket.number)}</title><style>@page{size:58mm auto;margin:2mm}*{box-sizing:border-box}html,body{margin:0;padding:0;width:54mm;font-family:Arial,sans-serif;color:#111}.ticket{width:54mm;padding:2mm 1mm;text-align:center}.brand{font-size:12pt;font-weight:900;letter-spacing:1px}.sub{font-size:7pt;margin-top:1mm}.rule{border-top:1px dashed #555;margin:3mm 0}.label{font-size:8pt;font-weight:700}.number{font-size:29pt;line-height:1.1;font-weight:900;margin:2mm 0}.purpose{font-size:10pt;font-weight:800;margin:2mm 0}.wait{font-size:8pt;font-weight:700}.small{font-size:7pt;margin-top:3mm;line-height:1.4}</style></head><body><main class="ticket"><div class="brand">LINKTECH</div><div class="sub">CUSTOMER QUEUE TICKET</div><div class="rule"></div><div class="label">YOUR QUEUE NUMBER</div><div class="number">${escapeHtml(ticket.number)}</div><div class="purpose">${escapeHtml(ticket.purpose)}</div><div class="wait">PLEASE WAIT FOR YOUR NUMBER</div><div class="rule"></div><div class="small">${escapeHtml(ticket.roomName || "Service Counter")}<br>Keep this ticket until served.<br>Thank you!</div></main><script>window.onload=function(){setTimeout(function(){window.print()},350)};window.onafterprint=function(){window.close()};<\/script></body></html>`;
      printWindow.document.open();
      printWindow.document.write(popupHtml);
      printWindow.document.close();
      setMessage("Your ticket is " + ticket.number + ". Please take your printed ticket.", "success");
    } catch (error) {
      printWindow.close();
      setMessage(error.message || "Unable to issue your ticket. Please ask the staff.", "error");
    } finally {
      button.disabled = false;
      document.querySelectorAll(".kiosk-service").forEach(el => { el.disabled = false; });
    }
  }

  async function loadKiosk() {
    if (!INITIAL_KIOSK_ID) return;
    LT.hide("authView");
    LT.hide("workspace");
    LT.hide("displayView");
    LT.show("kioskView");
    const roomName = document.getElementById("kioskRoomName");
    if (roomName) roomName.textContent = "Service Counter";
    try {
      // Public display data validates the room ID and returns its public name.
      const data = await LT.api("getDisplayData", { roomId: INITIAL_KIOSK_ID });
      if (roomName && data.room) roomName.textContent = data.room.roomName;
    } catch (error) {
      setMessage(error.message || "This kiosk room could not be loaded.", "error");
      document.querySelectorAll(".kiosk-service").forEach(el => { el.disabled = true; });
    }
    document.querySelectorAll(".kiosk-service").forEach(button => {
      button.addEventListener("click", () => issue(button.dataset.category, button));
    });
    const back = document.getElementById("kioskBackBtn");
    if (back) back.addEventListener("click", () => setMessage("Please choose your transaction purpose."));
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (INITIAL_KIOSK_ID) loadKiosk();
    const open = document.getElementById("openKioskBtn");
    const copy = document.getElementById("copyKioskBtn");
    function kioskUrl() {
      const roomId = LT.currentRoomId && LT.currentRoomId();
      if (!roomId) throw new Error("Create or join a room first.");
      const url = new URL(window.location.href);
      url.search = "?kiosk=" + encodeURIComponent(roomId);
      url.hash = "";
      return url.toString();
    }
    if (open) open.addEventListener("click", function () {
      try { window.open(kioskUrl(), "_blank", "noopener"); }
      catch (error) { LT.message(error.message, "error"); }
    });
    if (copy) copy.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(kioskUrl());
        LT.message("Customer kiosk link copied. Open it on the entrance computer.", "success");
      } catch (error) { LT.message("Unable to copy the kiosk link. Please copy the page URL manually.", "error"); }
    });
  });
})();
