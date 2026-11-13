
/* ==========================================
   LINKTECH TICKET NUMBER
   ROOM AND TELLER MANAGEMENT
========================================== */

/* ---------- ROOM HELPERS ---------- */

LT.currentRoomId = function() {
  return LT.state.room
    ? LT.state.room.roomId
    : localStorage.getItem(LT_ROOM_KEY) || "";
};

LT.saveRoom = function(room) {
  if (!room || !room.roomId) return;

  LT.state.room = room;
  localStorage.setItem(LT_ROOM_KEY, room.roomId);
};

LT.renderRoom = function(room) {
  if (!room) {
    LT.state.room = null;
    LT.state.isOwner = false;
    LT.hide("roomPanel");
    return;
  }

  LT.saveRoom(room);

  const name = LT.el("roomTitle");
  const code = LT.el("roomCode");

  if (name) name.textContent = room.roomName || "Queue Room";
  if (code) code.textContent = room.joinCode || "------";

  LT.state.isOwner =
    !!LT.state.user &&
    String(room.ownerEmail || "").toLowerCase() ===
    String(LT.state.user.email || "").toLowerCase();

  const ownerBadge = LT.el("ownerBadge");
  if (ownerBadge) {
    ownerBadge.classList.toggle("lt-hidden", !LT.state.isOwner);
    ownerBadge.classList.toggle("hidden", !LT.state.isOwner);
  }

  const ownerControls = LT.el("ownerControls");
  if (ownerControls) {
    ownerControls.classList.toggle("lt-hidden", !LT.state.isOwner);
    ownerControls.classList.toggle("hidden", !LT.state.isOwner);
  }

  LT.show("roomPanel");
};

/* ---------- DISPLAY LINK ---------- */

LT.getDisplayUrl = function() {
  const roomId = LT.currentRoomId();
  if (!roomId) return "";

  const base = window.location.href.split("?")[0].split("#")[0];

  return base + "?display=" + encodeURIComponent(roomId);
};

async function openCustomerDisplay() {
  const url = LT.getDisplayUrl();

  if (!url) {
    LT.message("Create or join a queue room first.", "error");
    return;
  }

  window.open(url, "_blank");
}

async function copyCustomerDisplay() {
  const url = LT.getDisplayUrl();

  if (!url) {
    LT.message("No active room is selected.", "error");
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    LT.message("Customer display link copied.", "success");
  } catch (error) {
    const temporary = document.createElement("textarea");
    temporary.value = url;
    document.body.appendChild(temporary);
    temporary.select();

    try {
      document.execCommand("copy");
      LT.message("Customer display link copied.", "success");
    } catch (copyError) {
      LT.message("Copy failed. You can copy this link manually: " + url, "error");
    }

    temporary.remove();
  }
}

/* ---------- CREATE ROOM ---------- */

async function createQueueRoom() {
  LT.clearMessage();

  const button = LT.el("createRoomBtn");
  const input = LT.el("roomName");
  const roomName = input ? input.value.trim() : "";

  if (!roomName) {
    LT.message("Enter a name for your queue room.", "error");
    return;
  }

  LT.setLoading(button, true, "Creating room...");

  try {
    const result = await LT.api("createRoom", {
      token: LT.state.token,
      roomName: roomName
    });

    const room = result.room || result;

    if (!room.roomId) {
      throw new Error("The server did not return a room ID.");
    }

    LT.renderRoom(room);
    LT.message("Queue room created successfully.", "success");

    if (input) input.value = "";

    await LT.refreshRoom(room.roomId);

  } catch (error) {
    LT.message(error.message, "error");
  } finally {
    LT.setLoading(button, false);
  }
}

/* ---------- JOIN ROOM ---------- */

async function joinQueueRoom() {
  LT.clearMessage();

  const button = LT.el("joinRoomBtn");
  const input = LT.el("joinCode");
  const joinCode = input ? input.value.trim().toUpperCase() : "";

  if (!joinCode) {
    LT.message("Enter the room invitation code.", "error");
    return;
  }

  LT.setLoading(button, true, "Joining room...");

  try {
    const result = await LT.api("joinRoom", {
      token: LT.state.token,
      joinCode: joinCode
    });

    const room = result.room || result;

    if (!room.roomId) {
      throw new Error("The server did not return the room details.");
    }

    LT.renderRoom(room);
    LT.message("You joined the queue room.", "success");

    if (input) input.value = "";

    await LT.refreshRoom(room.roomId);

  } catch (error) {
    LT.message(error.message, "error");
  } finally {
    LT.setLoading(button, false);
  }
}

/* ---------- REFRESH ROOM ---------- */

LT.refreshRoom = async function(roomId) {
  if (!roomId || !LT.state.token) return;

  try {
    const data = await LT.api("getAppData", {
      token: LT.state.token,
      roomId: roomId
    });

    LT.state.appData = data || {};

    if (data.room) {
      LT.renderRoom(data.room);
    }

    LT.renderDashboard(data);

  } catch (error) {
    LT.message(error.message, "error");
  }
};

/* ---------- DASHBOARD DISPLAY ---------- */

LT.renderDashboard = function(data) {
  if (!data) return;

  const user = data.user || LT.state.user || {};
  LT.state.user = user;
  LT.state.isAdmin = user.role === "Admin";

  const account = LT.el("accountName");
  if (account) {
    account.textContent = user.username || user.email || "Teller";
  }

  if (data.room) {
    LT.renderRoom(data.room);
  } else if (!data.roomId) {
    LT.hide("roomPanel");
  }

  const stats = data.stats || {};

  const total = LT.el("statTotal");
  const waiting = LT.el("statWaiting");
  const called = LT.el("statCalled");
  const completed = LT.el("statCompleted");

  if (total) total.textContent = stats.total || 0;
  if (waiting) waiting.textContent = stats.waiting || 0;
  if (called) called.textContent = stats.called || 0;
  if (completed) completed.textContent = stats.completed || 0;

  const queueStatus = LT.el("queueStatus");

  if (queueStatus && data.room) {
    const paused = data.room.paused === true ||
      String(data.room.paused).toLowerCase() === "true";

    queueStatus.textContent = paused ? "Queue Paused" : "Queue Active";
    queueStatus.className =
      "lt-queue-state" + (paused ? " paused" : "");
  }

  LT.renderTellerCards(data.tellers || []);
  LT.renderTicketList(data.tickets || []);

  const adminPanel = LT.el("adminPanel");
  if (adminPanel) {
    adminPanel.classList.toggle("lt-hidden", !LT.state.isAdmin);
    adminPanel.classList.toggle("hidden", !LT.state.isAdmin);
  }
};

/* ---------- TELLER CARDS ---------- */

LT.renderTellerCards = function(tellers) {
  const container = LT.el("tellerCards");
  if (!container) return;

  container.replaceChildren();

  const myEmail = String(
    LT.state.user && LT.state.user.email || ""
  ).toLowerCase();

  const sorted = [...tellers].sort(function(a, b) {
    return Number(a.tellerNo) - Number(b.tellerNo);
  });

  for (let number = 1; number <= 10; number++) {
    const teller = sorted.find(function(item) {
      return Number(item.tellerNo) === number;
    });

    const card = document.createElement("div");
    const isAvailable = teller && teller.status === "Available";
    const isMe = teller &&
      String(teller.email || "").toLowerCase() === myEmail;

    card.className = "lt-teller-card" +
      (isAvailable ? " available" : "") +
      (teller && !isAvailable ? " busy" : "");

    const numberElement = document.createElement("strong");
    numberElement.className = "lt-teller-number";
    numberElement.textContent = number;

    const nameElement = document.createElement("span");
    nameElement.className = "lt-teller-name";
    nameElement.textContent = teller
      ? teller.displayName || "Registered teller"
      : "Not registered";

    const statusElement = document.createElement("span");
    statusElement.className = "lt-teller-status";
    statusElement.textContent = teller
      ? teller.status || "Unavailable"
      : "Open position";

    card.append(numberElement, nameElement, statusElement);

    if (isMe) {
      const callButton = document.createElement("button");
      callButton.type = "button";
      callButton.className = "lt-btn full";
      callButton.style.marginTop = "10px";
      callButton.style.padding = "8px 5px";
      callButton.style.fontSize = "10px";
      callButton.textContent = isAvailable
        ? "Call Next"
        : "Set Available";

      callButton.addEventListener("click", function() {
        handleTellerAvailable(callButton, teller);
      });

      card.appendChild(callButton);
    }

    container.appendChild(card);
  }
};

/* ---------- REGISTER TELLER ---------- */

async function registerTeller() {
  LT.clearMessage();

  const button = LT.el("registerTellerBtn");
  const nameInput = LT.el("tellerName");
  const numberInput = LT.el("tellerNo");

  const displayName = nameInput ? nameInput.value.trim() : "";
  const tellerNo = Number(numberInput ? numberInput.value : 0);

  if (!displayName) {
    LT.message("Enter the teller display name.", "error");
    return;
  }

  if (!Number.isInteger(tellerNo) || tellerNo < 1 || tellerNo > 10) {
    LT.message("Select a teller position from 1 to 10.", "error");
    return;
  }

  const roomId = LT.currentRoomId();

  if (!roomId) {
    LT.message("Create or join a queue room first.", "error");
    return;
  }

  LT.setLoading(button, true, "Registering...");

  try {
    await LT.api("registerTeller", {
      token: LT.state.token,
      roomId: roomId,
      displayName: displayName,
      tellerNo: tellerNo
    });

    LT.message(
      "Teller position " + tellerNo + " registered and available. Select Call Next when ready.",
      "success"
    );

    await LT.refreshRoom(roomId);

  } catch (error) {
    LT.message(error.message, "error");
  } finally {
    LT.setLoading(button, false);
  }
}

/* ---------- AVAILABLE / UNAVAILABLE ---------- */

async function handleTellerAvailable(button, teller) {
  if (!navigator.onLine) {
    LT.message(
      "You are offline. Reconnect before calling a customer.",
      "error"
    );
    return;
  }

  const roomId = LT.currentRoomId();

  if (!roomId || !teller) {
    LT.message("Register as a teller before calling customers.", "error");
    return;
  }

  LT.setLoading(button, true, "Updating...");

  try {
    if (teller.status !== "Available") {
      await LT.api("setTellerStatus", {
        token: LT.state.token,
        roomId: roomId,
        status: "Available"
      });
    }

    const result = await LT.api("callNext", {
      token: LT.state.token,
      roomId: roomId
    });

    if (result && result.ticket) {
      LT.message(
        "Now calling ticket " +
        result.ticket.number +
        " at Teller " +
        teller.tellerNo + ".",
        "success"
      );
    } else {
      LT.message(
        "You are available. There are no waiting tickets.",
        "success"
      );
    }

    await LT.refreshRoom(roomId);

  } catch (error) {
    LT.message(error.message, "error");
  } finally {
    LT.setLoading(button, false);
  }
}

/* ---------- TICKET LIST ---------- */

LT.renderTicketList = function(tickets) {
  const container = LT.el("ticketList");
  if (!container) return;

  container.replaceChildren();

  if (!tickets.length) {
    const empty = document.createElement("div");
    empty.className = "lt-empty";
    empty.textContent = "No tickets have been issued yet.";
    container.appendChild(empty);
    return;
  }

  tickets.slice(0, 30).forEach(function(ticket) {
    const item = document.createElement("div");
    item.className = "lt-ticket-item";

    const main = document.createElement("div");
    main.className = "lt-ticket-main";

    const number = document.createElement("strong");
    number.className = "lt-ticket-no";
    number.textContent = String(ticket.number || "");

    const meta = document.createElement("span");
    meta.className = "lt-ticket-meta";

    const tellerText = ticket.tellerNo
      ? "Teller " + ticket.tellerNo
      : "Not yet assigned";

    meta.textContent = (ticket.category ? String(ticket.category).replace(/_/g, " ") + " • " : "") + tellerText;

    main.append(number, meta);

    const status = document.createElement("span");
    status.className = "lt-status " +
      String(ticket.status || "waiting").toLowerCase();

    status.textContent = ticket.status || "Waiting";

    item.append(main, status);
    container.appendChild(item);
  });
};

/* ---------- BUTTON EVENTS ---------- */

document.addEventListener("DOMContentLoaded", function() {
  const createButton = LT.el("createRoomBtn");
  const joinButton = LT.el("joinRoomBtn");
  const registerButton = LT.el("registerTellerBtn");
  const displayButton = LT.el("openDisplayBtn");
  const copyButton = LT.el("copyDisplayBtn");

  if (createButton) {
    createButton.addEventListener("click", createQueueRoom);
  }

  if (joinButton) {
    joinButton.addEventListener("click", joinQueueRoom);
  }

  if (registerButton) {
    registerButton.addEventListener("click", registerTeller);
  }

  if (displayButton) {
    displayButton.addEventListener("click", openCustomerDisplay);
  }

  if (copyButton) {
    copyButton.addEventListener("click", copyCustomerDisplay);
  }
});