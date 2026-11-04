
"use strict";

GS.Backup = (() => {

  const state = () => GS.state;

  function download(content, filename, type) {

    const blob = new Blob([content], { type });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportJSON() {

    const backup = {
      application: "LinkTech Game Scorer",
      version: 2,
      exportedAt: new Date().toISOString(),
      data: state()
    };

    download(
      JSON.stringify(backup, null, 2),
      "LinkTech-Game-Scorer-Backup.json",
      "application/json"
    );

    GS.notify("Tournament backup exported.", "success");
  }

  async function importJSON(file) {

    if (!file) return;

    try {

      const text = await file.text();
      const backup = JSON.parse(text);

      const data = backup.data || backup;

      if (
        !data.setup ||
        !Array.isArray(data.teams) ||
        !Array.isArray(data.matches)
      ) {
        throw new Error("Invalid backup");
      }

      if (!confirm(
        "Import this tournament? Your current tournament will be replaced."
      )) {
        return;
      }

      state().setup = data.setup;
      state().teams = data.teams;
      state().matches = data.matches;
      state().champion = data.champion || null;
      state().activeMatch = data.activeMatch || null;
      state().scoreHistory = data.scoreHistory || [];

      await GS.save();

      GS.fillSetup();
      GS.render();

      GS.notify("Tournament successfully restored.", "success");

    } catch (error) {

      GS.notify(
        "Import failed. Check that you selected a valid backup.",
        "error"
      );

    }
  }

  function exportCSV() {

    const rows = [
      [
        "Round",
        "Team A",
        "Score A",
        "Team B",
        "Score B",
        "Status",
        "Winner"
      ]
    ];

    state().matches.forEach(m => {

      rows.push([
        m.round,
        GS.Bracket.getTeamName(m.a),
        m.scoreA,
        GS.Bracket.getTeamName(m.b),
        m.scoreB,
        m.status,
        m.winner ? GS.Bracket.getTeamName(m.winner) : ""
      ]);

    });

    const csv = rows.map(row =>
      row.map(value =>
        `"${String(value ?? "").replace(/"/g, '""')}"`
      ).join(",")
    ).join("\r\n");

    download(
      "\uFEFF" + csv,
      "LinkTech-Tournament-Results.csv",
      "text/csv;charset=utf-8"
    );

    GS.notify("Results exported to CSV.", "success");
  }

  return {
    exportJSON,
    importJSON,
    exportCSV
  };

})();
