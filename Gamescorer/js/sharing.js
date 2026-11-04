
"use strict";

GS.Sharing = (() => {

  const state = () => GS.state;

  function getTeam(id) {
    return state().teams.find(t => t.id === id);
  }

  function loadImage(src) {
    return new Promise(resolve => {
      if (!src) return resolve(null);

      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  async function createPoster(match) {

    const canvas = document.createElement("canvas");

    canvas.width = 1200;
    canvas.height = 630;

    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);

    gradient.addColorStop(0, "#092342");
    gradient.addColorStop(1, "#087cf0");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 30px Inter, Arial";

    ctx.fillText("LINKTECH GAME SCORER", 70, 65);

    ctx.fillStyle = "#cceaff";
    ctx.font = "600 25px Inter, Arial";

    ctx.fillText(
      state().setup.name.slice(0, 55),
      70,
      112
    );

    ctx.textAlign = "center";
    ctx.font = "700 23px Inter, Arial";
    ctx.fillStyle = "#ffffff";

    ctx.fillText(
      `${state().setup.sport} · ${match.round}`,
      600,
      180
    );

    const a = getTeam(match.a);
    const b = getTeam(match.b);

    const imgA = await loadImage(a?.logo);
    const imgB = await loadImage(b?.logo);

    async function drawLogo(img, x, y) {
      if (!img) {
        ctx.fillStyle = "#ffffff30";
        roundedRect(ctx, x - 55, y - 55, 110, 110, 20);
        ctx.fill();
        return;
      }

      ctx.save();

      roundedRect(ctx, x - 55, y - 55, 110, 110, 20);
      ctx.clip();

      ctx.drawImage(img, x - 55, y - 55, 110, 110);

      ctx.restore();
    }

    await drawLogo(imgA, 280, 300);
    await drawLogo(imgB, 920, 300);

    ctx.fillStyle = "#ffffff";
    ctx.font = "800 30px Inter, Arial";

    ctx.fillText(a?.name || "Team A", 280, 405);
    ctx.fillText(b?.name || "Team B", 920, 405);

    ctx.font = "900 105px Inter, Arial";

    ctx.fillText(
      `${match.scoreA} : ${match.scoreB}`,
      600,
      325
    );

    ctx.fillStyle = "#bfe5ff";
    ctx.font = "700 23px Inter, Arial";

    ctx.fillText(match.status.toUpperCase(), 600, 470);

    ctx.font = "500 18px Inter, Arial";

    ctx.fillText(
      "© 2026 LinkTech Freelance IT Specialist Zamboanga",
      600,
      570
    );

    return new Promise(resolve => {
      canvas.toBlob(resolve, "image/png");
    });
  }

  async function shareScore() {

    const match = GS.Scoring.active();

    if (!match) {
      GS.notify("Select a match first.", "warning");
      return;
    }

    try {

      const blob = await createPoster(match);

      if (!blob) throw new Error("Image creation failed");

      const file = new File(
        [blob],
        "LinkTech-Game-Score.png",
        { type: "image/png" }
      );

      const caption =
        `${state().setup.name}\n` +
        `${state().setup.sport} · ${match.round}\n` +
        `${getTeam(match.a)?.name || "Team A"} ` +
        `${match.scoreA} - ${match.scoreB} ` +
        `${getTeam(match.b)?.name || "Team B"}\n` +
        `Status: ${match.status}`;

      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {

        await navigator.share({
          title: state().setup.name,
          text: caption,
          files: [file]
        });

      } else {

        downloadBlob(blob, "LinkTech-Game-Score.png");

        await copyText(caption);

        GS.notify(
          "Score poster downloaded. You can upload it to Facebook or Instagram.",
          "success"
        );
      }

    } catch (error) {

      GS.notify(
        "Could not share the image. Try downloading the result instead.",
        "warning"
      );

    }
  }

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = name;

    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn("Clipboard unavailable");
    }
  }

  async function shareSchedule() {

    const text = [
      state().setup.name,
      `Sport: ${state().setup.sport}`,
      `Venue: ${state().setup.venue}`,
      "",
      ...state().matches.map(m =>
        `${m.round}: ${getTeam(m.a)?.name || "TBD"} vs ${getTeam(m.b)?.name || "TBD"}`
      )
    ].join("\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: state().setup.name,
          text
        });
        return;
      } catch (e) {}
    }

    await copyText(text);

    GS.notify(
      "Schedule copied. Paste it into your social media post.",
      "success"
    );
  }

  return {
    shareScore,
    shareSchedule,
    createPoster
  };

})();
