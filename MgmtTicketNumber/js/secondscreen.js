
/* ==========================================
   LINKTECH TICKET NUMBER
   CUSTOMER DISPLAY
========================================== */

LT.display = {
  roomId: INITIAL_DISPLAY_ID || "",
  timer: null,
  clockTimer: null,
  soundEnabled: false,
  firstLoad: true,
  lastEventId: "",
  lastCalledTicket: "",
  audioContext: null
};

/* ---------- DISPLAY INITIALIZATION ---------- */

LT.startCustomerDisplay = async function() {
  if (!LT.display.roomId) return;

  LT.hide("authView");
  LT.hide("workspace");
  LT.show("displayView");

  const exitButton = LT.el("exitDisplayBtn");
  if (exitButton) {
    exitButton.addEventListener("click", function() {
      window.location.href = window.location.href.split("?")[0];
    });
  }

  const soundButton = LT.el("soundBtn");
  const fullButton = LT.el("fullscreenBtn");

  if (soundButton) {
    soundButton.addEventListener("click", LT.toggleDisplaySound);
  }

  if (fullButton) {
    fullButton.addEventListener("click", LT.toggleFullscreen);
  }

  LT.updateDisplayClock();
  LT.display.clockTimer = setInterval(
    LT.updateDisplayClock,
    1000
  );

  await LT.refreshCustomerDisplay();

  LT.display.timer = setInterval(function() {
    if (navigator.onLine) {
      LT.refreshCustomerDisplay();
    }
  }, 3000);
};

/* ---------- CLOCK ---------- */

LT.updateDisplayClock = function() {
  const clock = LT.el("displayClock");
  if (!clock) return;

  clock.textContent = new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "medium"
  });
};

/* ---------- SOUND ENABLE ---------- */

LT.toggleDisplaySound = function() {
  LT.display.soundEnabled = !LT.display.soundEnabled;

  const button = LT.el("soundBtn");

  if (LT.display.soundEnabled) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (AudioContextClass) {
        LT.display.audioContext =
          LT.display.audioContext || new AudioContextClass();

        if (LT.display.audioContext.state === "suspended") {
          LT.display.audioContext.resume();
        }
      }
    } catch (error) {
      console.warn("Audio initialization unavailable.", error);
    }

    if (button) button.textContent = "Sound Enabled";

    LT.message(
      "Voice announcements and alarm are enabled on this display.",
      "success"
    );

  } else {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (button) button.textContent = "Enable Voice and Alarm";

    LT.message("Voice announcements are disabled.", "success");
  }
};

/* ---------- ALARM SOUND ---------- */

LT.playDisplayAlarm = function() {
  if (!LT.display.soundEnabled) return;

  const context = LT.display.audioContext;

  if (!context) return;

  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.18,
      context.currentTime + 0.03
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.35
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.36);

  } catch (error) {
    console.warn("Alarm playback failed.", error);
  }
};

/* ---------- VOICE ANNOUNCEMENT ---------- */

LT.speakTicket = function(ticketNo, tellerNo) {
  if (!LT.display.soundEnabled) return;

  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported.");
    return;
  }

  const number = Number(ticketNo);
  const teller = Number(tellerNo);

  const spokenNumber = String(number)
    .split("")
    .join(" ");

  const message =
    "Number " + spokenNumber +
    ", please go to Teller " + teller + ".";

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(message);

  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
};

/* ---------- ANNOUNCE ONLY NEW EVENTS ---------- */

LT.processDisplayEvents = function(events) {
  if (!Array.isArray(events) || !events.length) return;

  const newest = events[0];

  if (!newest || !newest.id) return;

  /*
   * On the first load, remember the newest existing event.
   * Do not announce an old ticket when the display opens.
   */
  if (LT.display.firstLoad) {
    LT.display.lastEventId = newest.id;
    LT.display.firstLoad = false;
    return;
  }

  if (newest.id === LT.display.lastEventId) return;

  LT.display.lastEventId = newest.id;

  if (String(newest.type).toUpperCase() === "CALL") {
    const ticketNo = newest.ticketNo;
    const tellerNo = newest.tellerNo;

    if (ticketNo && tellerNo) {
      LT.display.lastCalledTicket = String(ticketNo);

      LT.playDisplayAlarm();

      setTimeout(function() {
        LT.speakTicket(ticketNo, tellerNo);
      }, 450);
    }
  }
};

/* ---------- REFRESH DISPLAY DATA ---------- */

LT.refreshCustomerDisplay = async function() {
  if (!LT.display.roomId || !navigator.onLine) return;

  try {
    const data = await LT.api("getDisplayData", {
      roomId: LT.display.roomId
    });

    if (!data) return;

    const connection = LT.el("connectionStatus");

    if (connection) {
      connection.textContent = "Connected";
      connection.classList.remove("offline");
    }

    LT.renderCustomerDisplay(data);
    LT.processDisplayEvents(data.events || []);

  } catch (error) {
    const connection = LT.el("connectionStatus");

    if (connection) {
      connection.textContent = "Server connection unavailable";
      connection.classList.add("offline");
    }

    console.warn("Customer display refresh failed:", error);
  }
};

/* ---------- RENDER CUSTOMER DISPLAY ---------- */

LT.renderCustomerDisplay = function(data) {
  const room = data.room || {};
  const current = data.current || data.latestCalled || null;

  const roomName = LT.el("displayRoomName");

  if (roomName) {
    roomName.textContent = room.roomName || "Customer Queue Display";
  }

  const number = LT.el("bigNumber");
  const teller = LT.el("bigTeller");
  const status = LT.el("displayStatus");

  if (current) {
    const ticketNo = String(current.number).padStart(3, "0");

    if (number && number.textContent !== ticketNo) {
      number.textContent = ticketNo;

      const card = number.closest(".lt-display-number-card");

      if (card) {
        card.classList.remove("lt-display-pop");
        void card.offsetWidth;
        card.classList.add("lt-display-pop");
      }
    }

    if (teller) {
      teller.textContent = current.tellerNo || "--";
    }

    if (status) {
      status.textContent = "Now Serving";
    }

  } else {
    if (number) number.textContent = "---";
    if (teller) teller.textContent = "--";
    if (status) status.textContent = "Waiting for the first call";
  }

  LT.renderDisplayTellers(data.tellers || []);
  LT.renderDisplayWaiting(data.waiting || []);
};

/* ---------- RENDER TELLER POSITIONS ---------- */

LT.renderDisplayTellers = function(tellers) {
  const container = LT.el("displayTellers");
  if (!container) return;

  container.replaceChildren();

  const sorted = [...tellers].sort(function(a, b) {
    return Number(a.tellerNo) - Number(b.tellerNo);
  });

  for (let position = 1; position <= 10; position++) {
    const teller = sorted.find(function(item) {
      return Number(item.tellerNo) === position;
    });

    const row = document.createElement("div");
    row.className = "lt-display-teller" +
      (teller && teller.status === "Available" ? " available" : "");

    const left = document.createElement("strong");
    left.textContent = "Teller " + position;

    const right = document.createElement("span");

    if (!teller) {
      right.textContent = "Not registered";
    } else if (teller.status === "Available") {
      right.textContent = "Available";
    } else {
      right.textContent = "Unavailable";
    }

    row.append(left, right);
    container.appendChild(row);
  }
};

/* ---------- RENDER WAITING TICKETS ---------- */

LT.renderDisplayWaiting = function(tickets) {
  const container = LT.el("displayWaiting");
  if (!container) return;

  container.replaceChildren();

  if (!tickets.length) {
    const empty = document.createElement("div");
    empty.className = "lt-display-empty";
    empty.textContent = "No customers are waiting.";
    container.appendChild(empty);
    return;
  }

  tickets.slice(0, 12).forEach(function(ticket) {
    const row = document.createElement("div");
    row.className = "lt-display-waiting-item";

    const label = document.createElement("span");
    label.textContent = "Waiting";

    const number = document.createElement("strong");
    number.className = "lt-waiting-number";
    number.textContent = String(ticket.number).padStart(3, "0");

    row.append(label, number);
    container.appendChild(row);
  });
};

/* ---------- FULL SCREEN ---------- */

LT.toggleFullscreen = async function() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    LT.message(
      "Full-screen mode is not available in this browser.",
      "error"
    );
  }
};

/* ---------- START DISPLAY ---------- */

document.addEventListener("DOMContentLoaded", function() {
  if (INITIAL_DISPLAY_ID) {
    LT.startCustomerDisplay();
  }
});