
"use strict";

GS.Bracket = (() => {

  const state = () => GS.state;

  function createMatch(a, b, round, type = "main", stage = 1) {
    return {
      id: crypto.randomUUID(),
      a: a || null,
      b: b || null,
      scoreA: 0,
      scoreB: 0,
      setsA: 0,
      setsB: 0,
      status: "Scheduled",
      round,
      type,
      stage,
      date: "",
      venue: "",
      winner: null,
      loser: null,
      period: 1,
      history: []
    };
  }

  function makeRoundRobin(ids) {
    const matches = [];
    let round = 1;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        matches.push(
          createMatch(
            ids[i],
            ids[j],
            "Round " + round++,
            "roundrobin"
          )
        );
      }
    }

    return matches;
  }

  function generate() {
    const s = state();

    if (s.teams.length < 2) {
      GS.notify("Register at least two teams.", "warning");
      return;
    }

    if (!confirm("Generate a new bracket? Existing matches will be replaced.")) {
      return;
    }

    s.matches = [];
    s.champion = null;

    const ids = s.teams.map(t => t.id);
    const format = s.setup.tournamentFormat;

    if (format === "roundrobin") {
      s.matches = makeRoundRobin(ids);
    } else {
      let size = 1;

      while (size < ids.length) size *= 2;

      const padded = [...ids];

      while (padded.length < size) padded.push(null);

      let current = [];

      for (let i = 0; i < size; i += 2) {
        current.push(
          createMatch(
            padded[i],
            padded[i + 1],
            "Winners Round 1",
            "main",
            1
          )
        );
      }

      s.matches.push(...current);

      let stage = 2;
      let count = current.length;

      while (count > 1) {
        count = Math.ceil(count / 2);

        for (let i = 0; i < count; i++) {
          s.matches.push(
            createMatch(
              null,
              null,
              "Winners Round " + stage,
              "main",
              stage
            )
          );
        }

        stage++;
      }

      if (format === "double") {
        const firstRound = s.matches.filter(
          m => m.type === "main" && m.stage === 1
        );

        const eligible = firstRound.length;

        let losersCount = Math.floor(eligible / 2);
        let loserStage = 1;

        while (losersCount >= 1) {
          for (let i = 0; i < losersCount; i++) {
            s.matches.push(
              createMatch(
                null,
                null,
                "Losers Round " + loserStage,
                "losers",
                loserStage
              )
            );
          }

          if (losersCount === 1) break;

          losersCount = Math.floor(losersCount / 2);
          loserStage++;
        }

        s.matches.push(
          createMatch(null, null, "Grand Final", "final", 99)
        );
      }

      advanceByes();
    }

    s.activeMatch = s.matches.find(
      m => m.a && m.b
    )?.id || null;

    GS.save();
    GS.render();
    GS.showTab("bracket");

    GS.notify("Tournament schedule generated successfully.", "success");
  }

  function findNext(type, stage) {
    return state().matches.find(m =>
      m.type === type &&
      m.stage === stage &&
      (!m.a || !m.b)
    );
  }

  function advanceByes() {
    const s = state();

    s.matches
      .filter(m => m.type === "main" && m.stage === 1)
      .forEach(m => {
        if (m.a && !m.b) {
          m.winner = m.a;
          m.status = "Final";
        } else if (!m.a && m.b) {
          m.winner = m.b;
          m.status = "Final";
        }
      });

    routeWinners();
  }

  function routeWinners() {
    const s = state();

    const matches = s.matches
      .filter(m => m.type === "main" && m.winner)
      .sort((a, b) => a.stage - b.stage);

    matches.forEach(m => {
      const next = findNext("main", m.stage + 1);

      if (!next) return;

      if (!next.a) {
        next.a = m.winner;
      } else if (!next.b && next.a !== m.winner) {
        next.b = m.winner;
      }
    });
  }

  function routeLoser(match) {
    const s = state();

    if (s.setup.tournamentFormat !== "double") return;
    if (!match.loser) return;

    const next = s.matches.find(m =>
      m.type === "losers" &&
      m.stage === 1 &&
      (!m.a || !m.b)
    );

    if (next) {
      if (!next.a) next.a = match.loser;
      else if (!next.b) next.b = match.loser;
    }
  }

  function complete(match) {
    const s = state();

    if (!match.a || !match.b) {
      GS.notify("Both teams must be assigned.", "warning");
      return false;
    }

    if (match.scoreA === match.scoreB) {
      GS.notify("A tied result needs a tie-break before advancing.", "warning");
      return false;
    }

    match.winner =
      match.scoreA > match.scoreB ? match.a : match.b;

    match.loser =
      match.winner === match.a ? match.b : match.a;

    match.status = "Final";

    if (match.type === "main") {
      routeWinners();
    }

    if (match.type === "losers") {
      const next = findNext("losers", match.stage + 1);

      if (next) {
        if (!next.a) next.a = match.winner;
        else if (!next.b) next.b = match.winner;
      }
    }

    if (match.type === "final") {
      s.champion = match.winner;
    }

    // Single-elimination champion.
    if (s.setup.tournamentFormat === "single") {
      const later = s.matches.some(m =>
        m.type === "main" &&
        m.stage > match.stage
      );

      if (!later) s.champion = match.winner;
    }

    // Round-robin has no automatic knockout champion.
    GS.save();

    return true;
  }

  function getTeamName(id) {
    return state().teams.find(t => t.id === id)?.name || "TBD";
  }

  function addMatch(a, b, round, date, venue) {
    const m = createMatch(a, b, round);

    m.date = date || "";
    m.venue = venue || "";

    state().matches.push(m);

    GS.save();
    GS.render();

    GS.notify("Match added successfully.", "success");
  }

  return {
    generate,
    complete,
    createMatch,
    addMatch,
    getTeamName,
    routeWinners
  };

})();
