
"use strict";

window.GS = window.GS || {};

GS.$ = id => document.getElementById(id);

GS.state = null;

GS.notify = function(message, type = "success") {

  const box = GS.$("notification");

  GS.$("notificationMessage").textContent = message;

  box.className = "notification " + type;

  GS.$("notificationIcon").textContent =
    type === "error" ? "!" :
    type === "warning" ? "⚠" :
    type === "info" ? "i" : "✓";

  clearTimeout(GS.notificationTimer);

  GS.notificationTimer = setTimeout(() => {
    box.classList.add("hidden");
  }, 5000);
};

GS.save = async function() {

  try {
    await GS.DB.save(GS.state);
  } catch (error) {
    console.error(error);
    GS.notify("Could not save tournament data.", "error");
  }

};

GS.showTab = function(name) {

  document.querySelectorAll(".tab").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.tab === name
    );
  });

  document.querySelectorAll(".tab-panel").forEach(panel => {
    panel.classList.toggle(
      "active",
      panel.id === "panel-" + name
    );
  });

  if (name === "scorer") GS.renderScorer();
};

GS.fileToData = function(file) {

  return new Promise((resolve, reject) => {

    if (!file) return resolve("");

    if (!file.type.startsWith("image/")) {
      return reject(new Error("Invalid image"));
    }

    if (file.size > 3 * 1024 * 1024) {
      return reject(new Error("Logo must be 3 MB or smaller"));
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

};

/* ========================================
   TOURNAMENT SETTINGS
======================================== */

GS.fillSetup = function() {

  const s = GS.state.setup;

  GS.$("tournamentName").value = s.name || "";
  GS.$("sportSelect").value = s.sport || "Basketball";
  GS.$("formatSelect").value = s.format || "points";
  GS.$("tournamentDate").value = s.date || "";
  GS.$("tournamentVenue").value = s.venue || "";
  GS.$("tournamentOrganizer").value = s.organizer || "";
  GS.$("matchDuration").value = s.duration || "";

  GS.$("tournamentFormat").value =
    s.tournamentFormat || "single";

  GS.$("targetScore").value = s.targetScore ?? 21;
  GS.$("bestOf").value = s.bestOf || 1;
  GS.$("winBy").value = s.winBy ?? 2;
  GS.$("maxScore").value = s.maxScore || "";

};

function setupSportOptions() {

  const select = GS.$("sportSelect");

  select.innerHTML = GS.Sports.names()
    .map(name =>
      `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`
    )
    .join("");

}

function applySportPreset() {

  const sport = GS.$("sportSelect").value;

  const rule = GS.Sports.get(sport);

  GS.$("formatSelect").value = rule.format;
  GS.$("targetScore").value = rule.target;
  GS.$("bestOf").value = rule.bestOf;
  GS.$("winBy").value = rule.winBy;

}

async function saveTournament(event) {

  event.preventDefault();

  const s = GS.state.setup;

  s.name = GS.$("tournamentName").value.trim();
  s.sport = GS.$("sportSelect").value;
  s.format = GS.$("formatSelect").value;
  s.date = GS.$("tournamentDate").value;
  s.venue = GS.$("tournamentVenue").value.trim();
  s.organizer = GS.$("tournamentOrganizer").value.trim();
  s.duration = GS.$("matchDuration").value.trim();

  s.tournamentFormat = GS.$("tournamentFormat").value;

  s.targetScore = Number(GS.$("targetScore").value) || 0;
  s.bestOf = Number(GS.$("bestOf").value) || 1;
  s.winBy = Number(GS.$("winBy").value) || 1;
  s.maxScore = Number(GS.$("maxScore").value) || 0;

  if (!s.name) {
    GS.notify("Enter a tournament name.", "warning");
    return;
  }

  if (s.bestOf % 2 === 0) {
    GS.notify("Best of must be an odd number.", "warning");
    return;
  }

  await GS.save();

  GS.render();

  GS.notify("Tournament settings saved.", "success");

}

/* ========================================
   TEAM MANAGEMENT
======================================== */

async function addTeam(event) {

  event.preventDefault();

  const name = GS.$("teamName").value.trim();

  if (!name) {
    GS.notify("Enter a team name.", "warning");
    return;
  }

  if (GS.state.teams.some(t =>
    t.name.toLowerCase() === name.toLowerCase()
  )) {
    GS.notify("A team with this name already exists.", "warning");
    return;
  }

  try {

    const logo = await GS.fileToData(
      GS.$("teamLogo").files[0]
    );

    const members = GS.$("teamMembers").value
      .split(/\r?\n/)
      .map(name => name.trim())
      .filter(Boolean);

    const team = {
      id: crypto.randomUUID(),
      name,
      captain: GS.$("teamCaptain").value.trim(),
      logo,
      color: GS.$("teamColor").value,
      members,
      createdAt: new Date().toISOString()
    };

    GS.state.teams.push(team);

    await GS.save();

    GS.$("teamForm").reset();
    GS.$("teamColor").value = "#087cf0";

    GS.render();

    GS.notify("Team successfully registered.", "success");

  } catch (error) {

    GS.notify(error.message || "Could not add team.", "error");

  }

}

GS.renderTeams = function() {

  const teams = GS.state.teams;

  GS.$("teamCount").textContent =
    teams.length + " registered teams";

  GS.$("teamList").innerHTML = teams.map(t => `

    <article class="team-card">

      <div class="team-logo"
        style="border:2px solid ${escapeHTML(t.color || "#087cf0")}">

        ${t.logo
          ? `<img src="${t.logo}" alt="${escapeHTML(t.name)} logo">`
          : escapeHTML(t.name.charAt(0).toUpperCase())
        }

      </div>

      <div class="team-details">

        <h3>${escapeHTML(t.name)}</h3>

        <p>Captain: ${escapeHTML(t.captain || "Not assigned")}</p>

        <p>Players: ${t.members.length}</p>

        <p>${t.members.map(escapeHTML).join(", ")}</p>

        <div class="team-actions">

          <button data-edit-team="${t.id}">Edit</button>

          <button data-share-team="${t.id}">Share</button>

          <button class="delete"
            data-delete-team="${t.id}">Delete</button>

        </div>

      </div>

    </article>

  `).join("") || `
    <div class="empty-state">
      No teams registered.
    </div>
  `;

};

function editTeam(id) {

  const team = GS.state.teams.find(t => t.id === id);

  if (!team) return;

  GS.$("editTeamId").value = team.id;
  GS.$("editTeamName").value = team.name;
  GS.$("editTeamCaptain").value = team.captain || "";
  GS.$("editTeamMembers").value = team.members.join("\n");

  GS.$("editTeamLogo").value = "";

  GS.$("teamModal").classList.remove("hidden");

}

async function updateTeam(event) {

  event.preventDefault();

  const id = GS.$("editTeamId").value;

  const team = GS.state.teams.find(t => t.id === id);

  if (!team) return;

  const name = GS.$("editTeamName").value.trim();

  if (!name) return;

  const duplicate = GS.state.teams.some(t =>
    t.id !== id &&
    t.name.toLowerCase() === name.toLowerCase()
  );

  if (duplicate) {
    GS.notify("Another team already uses this name.", "warning");
    return;
  }

  try {

    const file = GS.$("editTeamLogo").files[0];

    if (file) {
      team.logo = await GS.fileToData(file);
    }

    team.name = name;

    team.captain =
      GS.$("editTeamCaptain").value.trim();

    team.members =
      GS.$("editTeamMembers").value
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(Boolean);

    await GS.save();

    GS.$("teamModal").classList.add("hidden");

    GS.render();

    GS.notify("Team updated.", "success");

  } catch (error) {

    GS.notify(error.message || "Team update failed.", "error");

  }

}

function deleteTeam(id) {

  const team = GS.state.teams.find(t => t.id === id);

  if (!team) return;

  const used = GS.state.matches.some(m =>
    m.a === id || m.b === id
  );

  if (used) {
    GS.notify(
      "This team is already assigned to matches. Remove or reset its matches first.",
      "warning"
    );
    return;
  }

  if (!confirm(`Delete ${team.name}?`)) return;

  GS.state.teams = GS.state.teams.filter(t => t.id !== id);

  GS.save();
  GS.render();

  GS.notify("Team deleted.", "success");

}

/* ========================================
   BRACKET DISPLAY
======================================== */

GS.renderBracket = function() {

  const matches = GS.state.matches;

  const groups = {};

  matches.forEach(m => {
    (groups[m.round] ||= []).push(m);
  });

  GS.$("bracketView").innerHTML = matches.length
    ? `<div class="rounds">
        ${Object.entries(groups).map(([round, list]) => `

          <div class="round-column">

            <h3>${escapeHTML(round)}</h3>

            ${list.map(m => {

              const a = GS.state.teams.find(t => t.id === m.a);
              const b = GS.state.teams.find(t => t.id === m.b);

              return `

                <article class="match-card ${m.status === "Live" ? "live" : ""}">

                  <div class="match-top">
                    <span>${escapeHTML(m.type || "MATCH")}</span>
                    <span>${escapeHTML(m.status)}</span>
                  </div>

                  <div class="match-side ${m.winner === m.a && m.winner ? "winner" : ""}">
                    <span>${escapeHTML(a?.name || "TBD")}</span>
                    <b>${m.a ? m.scoreA : "–"}</b>
                  </div>

                  <div class="match-side ${m.winner === m.b && m.winner ? "winner" : ""}">
                    <span>${escapeHTML(b?.name || "TBD")}</span>
                    <b>${m.b ? m.scoreB : "–"}</b>
                  </div>

                  <div class="match-top">
                    <span>${escapeHTML(m.date || "Date not set")}</span>
                    <span>${escapeHTML(m.venue || "")}</span>
                  </div>

                  <button class="btn btn-light"
                    data-open-match="${m.id}"
                    ${!m.a || !m.b || m.status === "Final" ? "disabled" : ""}>
                    Open Scorer
                  </button>

                </article>

              `;

            }).join("")}

          </div>

        `).join("")}
      </div>`
    : `<div class="empty-state">
        No schedule available. Generate a bracket first.
       </div>`;

  const champion = GS.state.champion;

  if (champion) {

    const team = GS.state.teams.find(t => t.id === champion);

    GS.$("championBanner").textContent =
      "🏆 TOURNAMENT CHAMPION: " + (team?.name || "Champion");

    GS.$("championBanner").classList.remove("hidden");

  } else {

    GS.$("championBanner").classList.add("hidden");

  }

};

/* ========================================
   LIVE SCORER
======================================== */

GS.renderScorer = function() {

  const matches = GS.state.matches.filter(m => m.a && m.b);

  GS.$("matchSelect").innerHTML = matches.map(m => `

    <option value="${m.id}">
      ${escapeHTML(m.round)}:
      ${escapeHTML(GS.Bracket.getTeamName(m.a))}
      vs
      ${escapeHTML(GS.Bracket.getTeamName(m.b))}
    </option>

  `).join("") || `<option value="">No available matches</option>`;

  if (!matches.some(m => m.id === GS.state.activeMatch)) {
    GS.state.activeMatch = matches[0]?.id || null;
  }

  GS.$("matchSelect").value = GS.state.activeMatch || "";

  const match = GS.Scoring.active();

  if (!match) {

    GS.$("scoreNameA").textContent = "Team A";
    GS.$("scoreNameB").textContent = "Team B";
    GS.$("scoreLogoA").textContent = "A";
    GS.$("scoreLogoB").textContent = "B";
    GS.$("scoreA").textContent = "0";
    GS.$("scoreB").textContent = "0";
    GS.$("scoreRound").textContent = "Select a match";

    return;
  }

  const a = GS.state.teams.find(t => t.id === match.a);
  const b = GS.state.teams.find(t => t.id === match.b);

  GS.$("scoreNameA").textContent = a?.name || "Team A";
  GS.$("scoreNameB").textContent = b?.name || "Team B";

  GS.$("scoreLogoA").innerHTML = a?.logo
    ? `<img src="${a.logo}" alt="">`
    : "A";

  GS.$("scoreLogoB").innerHTML = b?.logo
    ? `<img src="${b.logo}" alt="">`
    : "B";

  GS.$("scoreA").textContent = match.scoreA;
  GS.$("scoreB").textContent = match.scoreB;

  GS.$("setsA").textContent = match.setsA || 0;
  GS.$("setsB").textContent = match.setsB || 0;

  GS.$("scoreSport").textContent =
    GS.state.setup.sport.toUpperCase();

  GS.$("scoreRound").textContent = match.round;

  GS.$("matchStatus").value = match.status;

  GS.$("periodNumber").textContent = match.period || 1;

  const rule = GS.Sports.get(GS.state.setup.sport);

  GS.$("periodLabel").textContent =
    rule.period.toUpperCase();

  GS.$("liveIndicator").classList.toggle(
    "paused",
    match.status === "Paused"
  );

  let winner = "Pending";

  if (match.winner) {
    winner = GS.Bracket.getTeamName(match.winner);
  }

  GS.$("currentWinner").textContent = winner;

};

function selectMatch(event) {

  GS.state.activeMatch = event.target.value;

  GS.save();
  GS.renderScorer();

}

function handleScoreClick(event) {

  const button = event.target.closest("[data-side]");

  if (!button) return;

  GS.Scoring.score(
    button.dataset.side,
    Number(button.dataset.delta)
  );

}

/* ========================================
   RESULTS
======================================== */

GS.renderResults = function() {

  const completed = GS.state.matches.filter(
    m => m.status === "Final"
  );

  GS.$("resultsList").innerHTML = completed.map(m => `

    <article class="result-card">

      <div>
        <strong>${escapeHTML(m.round)}</strong>
        <br>
        <span>
          ${escapeHTML(GS.Bracket.getTeamName(m.a))}
          vs
          ${escapeHTML(GS.Bracket.getTeamName(m.b))}
        </span>
        <br>
        <span>Winner: ${escapeHTML(
          GS.Bracket.getTeamName(m.winner)
        )}</span>
      </div>

      <div class="result-score">
        ${m.scoreA} - ${m.scoreB}
      </div>

    </article>

  `).join("") || `
    <div class="empty-state">
      No completed matches yet.
    </div>
  `;

  const champion = GS.state.teams.find(
    t => t.id === GS.state.champion
  );

  GS.$("finalChampion").innerHTML = champion
    ? `<h2>🏆 ${escapeHTML(champion.name)}</h2>`
    : "No champion determined yet.";

};

/* ========================================
   DASHBOARD
======================================== */

GS.renderDashboard = function() {

  const s = GS.state;

  const players = s.teams.reduce(
    (total, team) => total + team.members.length,
    0
  );

  const completed = s.matches.filter(
    m => m.status === "Final"
  ).length;

  GS.$("statTeams").textContent = s.teams.length;
  GS.$("statPlayers").textContent = players;
  GS.$("statMatches").textContent = s.matches.length;
  GS.$("statCompleted").textContent = completed;

  GS.$("dashboardTournament").innerHTML = `

    <h2>${escapeHTML(s.setup.name)}</h2>

    <div class="dashboard-info">
      <span>Sport: <strong>${escapeHTML(s.setup.sport)}</strong></span>
      <span>Format: <strong>${escapeHTML(s.setup.tournamentFormat)}</strong></span>
      <span>Venue: <strong>${escapeHTML(s.setup.venue || "Not set")}</strong></span>
      <span>Date: <strong>${escapeHTML(s.setup.date || "Not set")}</strong></span>
    </div>

  `;

  const recent = [...s.matches]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  GS.$("recentMatches").innerHTML = recent.map(m => `

    <div class="result-card">

      <div>
        <strong>${escapeHTML(m.round)}</strong>
        <br>
        <span>
          ${escapeHTML(GS.Bracket.getTeamName(m.a))}
          vs
          ${escapeHTML(GS.Bracket.getTeamName(m.b))}
        </span>
      </div>

      <span>${escapeHTML(m.status)}</span>

    </div>

  `).join("") || `<div class="empty-state">No matches yet.</div>`;

  const champion = s.teams.find(t => t.id === s.champion);

  GS.$("dashboardChampion").textContent = champion
    ? "🏆 " + champion.name
    : "Champion pending";

};

/* ========================================
   MATCH MANAGEMENT
======================================== */

function populateMatchTeams() {

  const options = GS.state.teams.map(t =>
    `<option value="${t.id}">${escapeHTML(t.name)}</option>`
  ).join("");

  GS.$("matchTeamA").innerHTML = options;
  GS.$("matchTeamB").innerHTML = options;

}

function openMatchModal() {

  if (GS.state.teams.length < 2) {
    GS.notify("Register at least two teams first.", "warning");
    return;
  }

  populateMatchTeams();

  GS.$("matchModal").classList.remove("hidden");

}

function saveManualMatch(event) {

  event.preventDefault();

  const a = GS.$("matchTeamA").value;
  const b = GS.$("matchTeamB").value;

  if (!a || !b || a === b) {
    GS.notify("Select two different teams.", "warning");
    return;
  }

  const round = GS.$("matchRound").value.trim();

  if (!round) return;

  GS.Bracket.addMatch(
    a,
    b,
    round,
    GS.$("matchDate").value,
    GS.$("matchVenue").value.trim()
  );

  GS.$("matchModal").classList.add("hidden");
  GS.$("matchForm").reset();

}

/* ========================================
   SPORT GUIDE
======================================== */

function renderSportGuide() {

  GS.$("sportGuide").innerHTML =
    GS.Sports.names().map(name => {

      const rule = GS.Sports.get(name);

      return `

        <div class="sport-guide-item">

          <strong>${escapeHTML(name)}</strong>

          <span>${escapeHTML(rule.description)}</span>

        </div>

      `;

    }).join("");

}

/* ========================================
   UTILITIES
======================================== */

function escapeHTML(value) {

  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

}

GS.render = function() {

  GS.renderTeams();
  GS.renderBracket();
  GS.renderScorer();
  GS.renderResults();
  GS.renderDashboard();

};

/* ========================================
   EVENT LISTENERS
======================================== */

function bindEvents() {

  document.querySelectorAll(".tab").forEach(button => {

    button.addEventListener("click", () => {
      GS.showTab(button.dataset.tab);
    });

  });

  GS.$("notification").classList.add("hidden");

  GS.$("closeNotification").addEventListener("click", () => {
    GS.$("notification").classList.add("hidden");
  });

  GS.$("tournamentForm").addEventListener(
    "submit",
    saveTournament
  );

  GS.$("sportSelect").addEventListener(
    "change",
    applySportPreset
  );

  GS.$("teamForm").addEventListener(
    "submit",
    addTeam
  );

  GS.$("editTeamForm").addEventListener(
    "submit",
    updateTeam
  );

  GS.$("teamList").addEventListener("click", event => {

    const edit = event.target.dataset.editTeam;
    const remove = event.target.dataset.deleteTeam;
    const share = event.target.dataset.shareTeam;

    if (edit) editTeam(edit);

    if (remove) deleteTeam(remove);

    if (share) {

      const t = GS.state.teams.find(x => x.id === share);

      if (t) {
        navigator.clipboard?.writeText(
          `${t.name}\nCaptain: ${t.captain}\nPlayers: ${t.members.join(", ")}`
        );

        GS.notify("Team information copied.", "success");
      }

    }

  });

  GS.$("generateBracketBtn").addEventListener(
    "click",
    GS.Bracket.generate
  );

  GS.$("regenerateBtn").addEventListener(
    "click",
    GS.Bracket.generate
  );

  GS.$("addMatchBtn").addEventListener(
    "click",
    openMatchModal
  );

  GS.$("closeMatchModal").addEventListener("click", () => {
    GS.$("matchModal").classList.add("hidden");
  });

  GS.$("closeTeamModal").addEventListener("click", () => {
    GS.$("teamModal").classList.add("hidden");
  });

  GS.$("matchForm").addEventListener(
    "submit",
    saveManualMatch
  );

  GS.$("closeInfoModal").addEventListener("click", () => {
    GS.$("infoModal").classList.add("hidden");
  });

  GS.$("infoOkBtn").addEventListener("click", () => {
    GS.$("infoModal").classList.add("hidden");
  });

  GS.$("bracketView").addEventListener("click", event => {

    const id = event.target.dataset.openMatch;

    if (!id) return;

    GS.state.activeMatch = id;

    GS.save();

    GS.showTab("scorer");

    GS.renderScorer();

  });

  GS.$("matchSelect").addEventListener(
    "change",
    selectMatch
  );

  GS.$("matchStatus").addEventListener("change", event => {
    GS.Scoring.setStatus(event.target.value);
  });

  GS.$("scoreboard").addEventListener(
    "click",
    handleScoreClick
  );

  GS.$("undoScoreBtn").addEventListener(
    "click",
    GS.Scoring.undo
  );

  GS.$("resetScoreBtn").addEventListener(
    "click",
    GS.Scoring.reset
  );

  GS.$("nextPeriodBtn").addEventListener(
    "click",
    GS.Scoring.nextPeriod
  );

  GS.$("saveResultBtn").addEventListener(
    "click",
    GS.Scoring.saveResult
  );

  GS.$("timerStartBtn").addEventListener(
    "click",
    GS.Scoring.startTimer
  );

  GS.$("timerPauseBtn").addEventListener(
    "click",
    GS.Scoring.pauseTimer
  );

  GS.$("timerResetBtn").addEventListener(
    "click",
    GS.Scoring.resetTimer
  );

  GS.$("fullscreenBtn").addEventListener("click", async () => {

    const el = GS.$("scoreboard");

    try {

      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }

    } catch (error) {

      GS.notify(
        "Full-screen mode is not supported by this browser.",
        "warning"
      );

    }

  });

  GS.$("exportBtn").addEventListener(
    "click",
    GS.Backup.exportJSON
  );

  GS.$("importFile").addEventListener("change", event => {

    GS.Backup.importJSON(event.target.files[0]);

    event.target.value = "";

  });

  GS.$("exportCSVBtn").addEventListener(
    "click",
    GS.Backup.exportCSV
  );

  GS.$("shareScheduleBtn").addEventListener(
    "click",
    GS.Sharing.shareSchedule
  );

  GS.$("shareScoreBtn").addEventListener(
    "click",
    GS.Sharing.shareScore
  );

  GS.$("printBracketBtn").addEventListener(
    "click",
    () => window.print()
  );

  GS.$("helpBtn").addEventListener("click", () => {

    GS.showTab("instructions");

  });

  GS.$("dashboardNewBtn").addEventListener("click", () => {

    if (confirm("Create a new tournament? This replaces the current tournament.")) {

      GS.state = structuredClone(GS.DB.defaults);

      GS.save();
      GS.fillSetup();
      GS.render();

      GS.showTab("setup");

      GS.notify("New tournament created.", "success");

    }

  });

  GS.$("clearTournamentBtn").addEventListener("click", async () => {

    if (!confirm("Delete all tournament data from this browser?")) {
      return;
    }

    GS.state = structuredClone(GS.DB.defaults);

    await GS.save();

    GS.fillSetup();
    GS.render();

    GS.notify("Tournament data cleared.", "success");

  });

}

/* ========================================
   APPLICATION STARTUP
======================================== */

async function initializeApp() {

  try {

    await GS.DB.open();

    GS.state = await GS.DB.load();

    setupSportOptions();

    GS.fillSetup();

    renderSportGuide();

    bindEvents();

    GS.render();

    GS.notify(
      "Game Scorer is ready. Create your tournament to begin.",
      "info"
    );

  } catch (error) {

    console.error(error);

    alert(
      "Game Scorer could not initialize its database. " +
      "Please open this application in a supported browser."
    );

  }

}

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);
