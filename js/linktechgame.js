
/* ============================================
   LINKTECH GAME + PWA INSTALLATION
   SINGLE CLICK / SINGLE TOUCH
   NO FLOATING / NO DRAGGING
============================================ */

(() => {
  "use strict";

  const button = document.getElementById("ltInstallButton");
  if (!button) return;

  // Prevent duplicate initialization
  if (button.dataset.ltInitialized === "true") return;
  button.dataset.ltInitialized = "true";

  let deferredPrompt = null;
  let gameOpen = false;
  let currentWord = "";
  let installUnlocked = false;

  const QUESTIONS = [
    "LINKTECH",
    "COMPUTER",
    "KEYBOARD",
    "MONITOR",
    "PRINTER",
    "NETWORK",
    "ROUTER",
    "SERVER",
    "FIREWALL",
    "ETHERNET",
    "MOTHERBOARD",
    "PROCESSOR",
    "SOFTWARE",
    "HARDWARE",
    "DATABASE",
    "INTERNET",
    "BLUETOOTH",
    "WEBSITE",
    "LAPTOP",
    "PASSWORD",
    "SECURITY",
    "GRAPHICS",
    "MEMORY",
    "STORAGE",
    "WIRELESS",
    "FIRMWARE",
    "TECHNOLOGY",
    "PROGRAMMING"
  ];

  // =========================================
  // INSTALLATION DETECTION
  // =========================================

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    button.style.display = "none";
    closeGame();
  });

  // =========================================
  // CREATE GAME OVERLAY
  // =========================================

  const overlay = document.createElement("div");
  overlay.id = "ltGameOverlay";

  overlay.innerHTML = `
    <div id="ltGameCard"
         role="dialog"
         aria-modal="true"
         aria-labelledby="ltGameTitle">

      <div class="lt-game-header">

        <h2 class="lt-game-title" id="ltGameTitle">
          LinkTech Game
        </h2>

        <button type="button"
                class="lt-game-close"
                id="ltGameClose"
                aria-label="Close game">
          ×
        </button>

      </div>

      <div class="lt-game-subtitle">
        Decode the binary code and discover the technology word!
      </div>

      <div id="ltGameContent"></div>

    </div>
  `;

  document.body.appendChild(overlay);

  const content = overlay.querySelector("#ltGameContent");

  // =========================================
  // QUESTION MANAGEMENT
  // =========================================

  function getAskedQuestions() {
    try {
      return JSON.parse(
        sessionStorage.getItem("ltGameAsked") || "[]"
      );
    } catch (error) {
      return [];
    }
  }

  function selectQuestion() {
    const asked = getAskedQuestions();

    const available = QUESTIONS.filter(
      word => !asked.includes(word)
    );

    if (!available.length) {
      return null;
    }

    const selected =
      available[Math.floor(Math.random() * available.length)];

    asked.push(selected);

    sessionStorage.setItem(
      "ltGameAsked",
      JSON.stringify(asked)
    );

    return selected;
  }

  // =========================================
  // BINARY CONVERSION
  // =========================================

  function toBinary(word) {
    return word
      .split("")
      .map(char =>
        char.charCodeAt(0).toString(2).padStart(8, "0")
      )
      .join(" ");
  }

  // =========================================
  // OPEN GAME
  // =========================================

  function openGame() {
    if (gameOpen) return;

    gameOpen = true;
    overlay.classList.add("lt-show");

    currentWord = selectQuestion();

    if (!currentWord) {
      content.innerHTML = `
        <div class="lt-game-success">

          <div class="lt-game-trophy">🏆</div>

          <h2>All Challenges Completed!</h2>

          <p>
            You have completed every LinkTech binary challenge
            in this browser session.
          </p>

          <button type="button"
                  class="lt-game-submit"
                  id="ltPlayAgain">
            PLAY AGAIN
          </button>

        </div>
      `;

      content.querySelector("#ltPlayAgain")
        .addEventListener("click", resetQuestions);

      return;
    }

    showQuestion();
  }

  // =========================================
  // RESET QUESTIONS
  // =========================================

  function resetQuestions() {
    sessionStorage.removeItem("ltGameAsked");
    currentWord = selectQuestion();
    showQuestion();
  }

  // =========================================
  // DISPLAY QUESTION
  // =========================================

  function showQuestion() {
    content.innerHTML = `
      <label class="lt-game-label" for="ltGameAnswer">
        Decode this binary word:
      </label>

      <div class="lt-binary-box">
        ${toBinary(currentWord)}
      </div>

      <input
        id="ltGameAnswer"
        class="lt-game-input"
        type="text"
        placeholder="TYPE YOUR ANSWER"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        maxlength="30"
      >

      <button type="button"
              class="lt-game-submit"
              id="ltGameSubmit">
        CHECK ANSWER
      </button>

      <div class="lt-game-message"
           id="ltGameMessage"
           aria-live="polite"></div>

      <div class="lt-game-status">
        LinkTech Binary Challenge
      </div>
    `;

    const input = content.querySelector("#ltGameAnswer");
    const submit = content.querySelector("#ltGameSubmit");

    submit.addEventListener("click", checkAnswer);

    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        checkAnswer();
      }
    });

    input.focus();
  }

  // =========================================
  // CHECK ANSWER
  // =========================================

  function checkAnswer() {
    const input = content.querySelector("#ltGameAnswer");
    const message = content.querySelector("#ltGameMessage");

    if (!input || !message) return;

    const answer = input.value.trim().toUpperCase();

    if (!answer) {
      message.style.color = "#d97706";
      message.textContent = "Please enter your answer.";
      input.focus();
      return;
    }

    if (answer === currentWord) {
      installUnlocked = true;
      showSuccess();
    } else {
      message.style.color = "#dc3545";
      message.textContent = "Incorrect! Try again.";

      input.value = "";
      input.focus();
    }
  }

  // =========================================
  // WIN SCREEN
  // =========================================

  function showSuccess() {
    content.innerHTML = `
      <div class="lt-game-success">

        <div class="lt-game-trophy">🏆</div>

        <h2>Congratulations!</h2>

        <p>
          You successfully decoded
          <strong>${currentWord}</strong>.
        </p>

        <p>
          You have unlocked LinkTech installation!
        </p>

        <button type="button"
                class="lt-game-submit"
                id="ltInstallNow">
          INSTALL LINKTECH
        </button>

        <button type="button"
                class="lt-game-secondary"
                id="ltContinue">
          CONTINUE
        </button>

      </div>
    `;

    content.querySelector("#ltInstallNow")
      .addEventListener("click", installApp);

    content.querySelector("#ltContinue")
      .addEventListener("click", closeGame);
  }

  // =========================================
  // INSTALL APPLICATION
  // =========================================

  async function installApp() {
    if (!installUnlocked) return;

    const installButton =
      content.querySelector("#ltInstallNow");

    if (installButton) {
      installButton.disabled = true;
      installButton.textContent = "OPENING INSTALLATION...";
    }

    if (deferredPrompt) {
      const promptEvent = deferredPrompt;
      deferredPrompt = null;

      try {
        await promptEvent.prompt();

        const result = await promptEvent.userChoice;

        if (result.outcome === "accepted") {
          content.innerHTML = `
            <div class="lt-game-success">

              <div class="lt-game-trophy">🎉</div>

              <h2>Installation Accepted!</h2>

              <p>
                Follow your browser's instructions
                to complete LinkTech installation.
              </p>

              <button type="button"
                      class="lt-game-submit"
                      id="ltFinish">
                CLOSE
              </button>

            </div>
          `;

          content.querySelector("#ltFinish")
            .addEventListener("click", closeGame);

        } else {
          showManualInstall();
        }

      } catch (error) {
        console.error("LinkTech installation error:", error);
        showManualInstall();
      }

    } else {
      showManualInstall();
    }
  }

  // =========================================
  // MANUAL INSTALLATION
  // =========================================

  function showManualInstall() {
    content.innerHTML = `
      <div class="lt-game-success">

        <div class="lt-game-trophy">📲</div>

        <h2>You Unlocked LinkTech!</h2>

        <p>
          Your browser does not currently provide
          an automatic installation prompt.
        </p>

        <div class="lt-manual-instructions">

          <p>
            <strong>Android:</strong>
            Open Chrome menu ⋮ and select
            Install app or Add to Home screen.
          </p>

          <p>
            <strong>Computer:</strong>
            Open Chrome or Edge and select
            Install LinkTech from the browser menu.
          </p>

          <p>
            <strong>iPhone/iPad:</strong>
            Open Safari Share and select
            Add to Home Screen.
          </p>

        </div>

        <button type="button"
                class="lt-game-submit"
                id="ltCloseManual">
          CLOSE
        </button>

      </div>
    `;

    content.querySelector("#ltCloseManual")
      .addEventListener("click", closeGame);
  }

  // =========================================
  // CLOSE GAME
  // =========================================

  function closeGame() {
    overlay.classList.remove("lt-show");
    gameOpen = false;
  }

  overlay.querySelector("#ltGameClose")
    .addEventListener("click", closeGame);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) {
      closeGame();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && gameOpen) {
      closeGame();
    }
  });

  // =========================================
  // SINGLE CLICK / SINGLE TOUCH
  // =========================================

  button.type = "button";
  button.style.position = "relative";
  button.style.transform = "none";
  button.style.animation = "none";

  button.addEventListener("click", event => {
    event.preventDefault();
    openGame();
  });

})();
