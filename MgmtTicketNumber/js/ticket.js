
/* ==========================================
   LINKTECH TICKET NUMBER
   TICKET GENERATION AND QUEUE CONTROLS
========================================== */

LT.lastPrintedTickets = [];

/* ---------- NUMBER FORMATTING ---------- */

LT.formatTicketNumber = function(number, format) {
  const value = Number(number);

  if (!Number.isFinite(value)) return "000";

  if (format === "1") return String(value);
  if (format === "01") return String(value).padStart(2, "0");

  return String(value).padStart(3, "0");
};

/* ---------- OWNER CHECK ---------- */

LT.requireOwner = function() {
  if (!LT.state.isOwner) {
    LT.message(
      "Only the Queue Owner can perform this operation.",
      "error"
    );
    return false;
  }

  if (!navigator.onLine) {
    LT.message("Reconnect to the internet before continuing.", "error");
    return false;
  }

  return true;
};

/* ---------- GENERATE TICKET BATCH ---------- */

async function generateTicketBatch() {
  LT.clearMessage();

  if (!LT.requireOwner()) return;

  const button = LT.el("generateBatchBtn");
  const countInput = LT.el("batchCount");
  const count = Number(countInput ? countInput.value : 0);

  if (!Number.isInteger(count) || count < 1 || count > 500) {
    LT.message(
      "Enter a valid ticket quantity from 1 to 500.",
      "error"
    );
    return;
  }

  const confirmed = confirm(
    "Generate " + count + " new tickets for this queue room?"
  );

  if (!confirmed) return;

  LT.setLoading(button, true, "Generating tickets...");

  try {
    const result = await LT.api("issueTicketBatch", {
      token: LT.state.token,
      roomId: LT.currentRoomId(),
      count: count
    });

    const created = result.created || result.count || count;

    LT.message(
      created + " tickets generated successfully.",
      "success"
    );

    await LT.refreshRoom(LT.currentRoomId());

    // Automatically load the generated batch for owner printing.
    if (result.batchId) {
      await loadPrintableTickets(result.batchId);
    }

  } catch (error) {
    LT.message(error.message, "error");
  } finally {
    LT.setLoading(button, false);
  }
}

/* ---------- PAUSE / RESUME QUEUE ---------- */

async function toggleQueuePause() {
  LT.clearMessage();

  if (!LT.requireOwner()) return;

  const room = LT.state.room;

  if (!room) {
    LT.message("No queue room is selected.", "error");
    return;
  }

  const currentlyPaused =
    room.paused === true ||
    String(room.paused).toLowerCase() === "true";

  const nextPaused = !currentlyPaused;

  const button = LT.el("pauseQueueBtn");
  LT.setLoading(button, true, "Updating...");

  try {
    await LT.api("setQueuePaused", {
      token: LT.state.token,
      roomId: room.roomId,
      paused: nextPaused
    });

    LT.message(
      nextPaused ? "Queue paused." : "Queue resumed.",
      "success"
    );

    await LT.refreshRoom(room.roomId);

    if (button) {
      button.textContent = nextPaused ? "Resume Queue" : "Pause Queue";
    }

  } catch (error) {
    LT.message(error.message, "error");
  } finally {
    LT.setLoading(button, false);
  }
}

/* ---------- DAILY QUEUE RESET ---------- */

async function resetDailyQueue() {
  LT.clearMessage();

  if (!LT.requireOwner()) return;

  const room = LT.state.room;

  if (!room) {
    LT.message("No queue room is selected.", "error");
    return;
  }

  const confirmed = confirm(
    "Reset this queue now?\n\n" +
    "The current tickets will be archived and the next batch will start again at 001."
  );

  if (!confirmed) return;

  const button = LT.el("resetQueueBtn");
  LT.setLoading(button, true, "Resetting...");

  try {
    await LT.api("resetDailyQueue", {
      token: LT.state.token,
      roomId: room.roomId
    });

    LT.message(
      "Queue reset successfully. Previous tickets have been archived.",
      "success"
    );

    await LT.refreshRoom(room.roomId);

  } catch (error) {
    LT.message(error.message, "error");
  } finally {
    LT.setLoading(button, false);
  }
}

/* ---------- LOAD PRINTABLE TICKETS ---------- */

async function loadPrintableTickets(batchId) {
  if (!LT.requireOwner()) return;

  try {
    const result = await LT.api("getPrintableTickets", {
      token: LT.state.token,
      roomId: LT.currentRoomId(),
      batchId: batchId || ""
    });

    const tickets = Array.isArray(result)
      ? result
      : (result.tickets || []);

    if (!tickets.length) {
      LT.message("No printable tickets were found.", "error");
      return;
    }

    LT.lastPrintedTickets = tickets;
    renderPrintableTickets(tickets);

  } catch (error) {
    LT.message(error.message, "error");
  }
}

/* ---------- BUILD PRINT PREVIEW ---------- */

function renderPrintableTickets(tickets) {
  const root = LT.el("printTickets");

  if (!root) {
    LT.message("The print ticket container is missing.", "error");
    return;
  }

  root.replaceChildren();

  const formatSelect = LT.el("numberFormat");
  const format = formatSelect ? formatSelect.value : "001";

  tickets.forEach(function(ticket) {
    const article = document.createElement("article");
    article.className = "lt-print-ticket";

    const brand = document.createElement("div");
    brand.className = "lt-print-brand";
    brand.textContent = "LINKTECH";

    const subtitle = document.createElement("div");
    subtitle.className = "lt-print-subtitle";
    subtitle.textContent = "CUSTOMER QUEUE TICKET";

    const line1 = document.createElement("div");
    line1.className = "lt-print-line";

    const label = document.createElement("div");
    label.className = "lt-print-label";
    label.textContent = "YOUR QUEUE NUMBER";

    const number = document.createElement("div");
    number.className = "lt-print-number";
    number.textContent = LT.formatTicketNumber(ticket.number, format);

    const instruction = document.createElement("div");
    instruction.className = "lt-print-instruction";
    instruction.textContent = "PLEASE WAIT FOR YOUR NUMBER";

    const line2 = document.createElement("div");
    line2.className = "lt-print-line";

    const date = document.createElement("div");
    date.className = "lt-print-date";
    date.textContent = "Keep this ticket until served.";

    const footer = document.createElement("div");
    footer.className = "lt-print-footer";
    footer.textContent = "Thank you for waiting!";

    article.append(
      brand,
      subtitle,
      line1,
      label,
      number,
      instruction,
      line2,
      date,
      footer
    );

    root.appendChild(article);
  });

  LT.message(
    tickets.length + " tickets are ready for printing.",
    "success"
  );
}

/* ---------- PRINT TICKETS ---------- */

function printTicketBatch() {
  if (!LT.requireOwner()) return;

  if (!LT.lastPrintedTickets.length) {
    LT.message(
      "Generate a ticket batch or load a batch before printing.",
      "error"
    );
    return;
  }

  renderPrintableTickets(LT.lastPrintedTickets);

  // Browser print dialog. The user selects the connected printer.
  window.print();
}

/* ---------- EVENT LISTENERS ---------- */

document.addEventListener("DOMContentLoaded", function() {
  const generate = LT.el("generateBatchBtn");
  const pause = LT.el("pauseQueueBtn");
  const reset = LT.el("resetQueueBtn");

  if (generate) {
    generate.addEventListener("click", generateTicketBatch);
  }

  if (pause) {
    pause.addEventListener("click", toggleQueuePause);
  }

  if (reset) {
    reset.addEventListener("click", resetDailyQueue);
  }

  const printButton = LT.el("printBatchBtn");

  if (printButton) {
    printButton.addEventListener("click", printTicketBatch);
  }
});