
"use strict";

GS.Scoring = (() => {

  let timerInterval = null;
  let seconds = 0;

  const state = () => GS.state;

  function active() {
    return state().matches.find(
      m => m.id === state().activeMatch
    );
  }

  function snapshot(match) {
    return {
      scoreA: match.scoreA,
      scoreB: match.scoreB,
      setsA: match.setsA,
      setsB: match.setsB,
      period: match.period,
      status: match.status
    };
  }

  function pushHistory(match) {
    match.history ||= [];

    match.history.push(snapshot(match));

    if (match.history.length > 100) {
      match.history.shift();
    }
  }

  function score(side, delta) {
    const m = active();

    if (!m) {
      GS.notify("Select a match first.", "warning");
      return;
    }

    if (m.status === "Final") {
      GS.notify("This match is already final.", "warning");
      return;
    }

    pushHistory(m);

    const key = side === "A" ? "scoreA" : "scoreB";

    const next = Math.max(
      0,
      Number(m[key]) + Number(delta)
    );

    const max = Number(state().setup.maxScore) || 0;

    if (max && next > max) {
      m.history.pop();
      GS.notify("Maximum score reached.", "warning");
      return;
    }

    m[key] = next;

    if (m.status === "Scheduled") {
      m.status = "Live";
    }

    GS.save();
    GS.renderScorer();
  }

  function undo() {
    const m = active();

    if (!m || !m.history?.length) {
      GS.notify("No score history available.", "warning");
      return;
    }

    const previous = m.history.pop();

    Object.assign(m, previous);

    GS.save();
    GS.renderScorer();

    GS.notify("Last score operation undone.", "success");
  }

  function reset() {
    const m = active();

    if (!m) return;

    if (!confirm("Reset the current match score?")) return;

    pushHistory(m);

    m.scoreA = 0;
    m.scoreB = 0;
    m.setsA = 0;
    m.setsB = 0;
    m.winner = null;
    m.loser = null;
    m.status = "Scheduled";
    m.period = 1;

    GS.save();
    GS.render();

    GS.notify("Match score reset.", "success");
  }

  function nextPeriod() {
    const m = active();

    if (!m) return;

    pushHistory(m);

    m.period = (m.period || 1) + 1;

    GS.save();
    GS.renderScorer();

    GS.notify("Period / set advanced.", "success");
  }

  function setStatus(value) {
    const m = active();

    if (!m) return;

    if (m.status === "Final" && value !== "Final") {
      if (!confirm("Reopen this completed match?")) {
        GS.renderScorer();
        return;
      }

      m.winner = null;
      m.loser = null;
    }

    m.status = value;

    GS.save();
    GS.render();
  }

  function saveResult() {
    const m = active();

    if (!m) {
      GS.notify("Select a match first.", "warning");
      return;
    }

    if (m.status === "Final" && m.winner) {
      GS.notify("This result is already saved.", "info");
      return;
    }

    if (m.scoreA === m.scoreB) {
      GS.notify(
        "A tied match needs a tie-break before a winner can advance.",
        "warning"
      );
      return;
    }

    if (!confirm("Confirm and finalize this match result?")) {
      return;
    }

    const success = GS.Bracket.complete(m);

    if (success) {
      GS.save();
      GS.render();

      GS.notify(
        "Match finalized. Tournament results updated.",
        "success"
      );
    }
  }

  function startTimer() {
    if (timerInterval) return;

    timerInterval = setInterval(() => {
      seconds++;

      const display = GS.$("timerDisplay");

      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;

      display.textContent =
        String(min).padStart(2, "0") +
        ":" +
        String(sec).padStart(2, "0");
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetTimer() {
    pauseTimer();

    seconds = 0;

    GS.$("timerDisplay").textContent = "00:00";
  }

  return {
    active,
    score,
    undo,
    reset,
    nextPeriod,
    setStatus,
    saveResult,
    startTimer,
    pauseTimer,
    resetTimer
  };

})();
