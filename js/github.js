
/* ==========================================
   LINKTECH GITHUB LIVE PORTFOLIO
========================================== */

(() => {
  "use strict";

  const USERNAME = "linktechzamboanga-lang";

  const API = "https://api.github.com";

  const CONTRIBUTIONS_API =
    "https://github-contributions-api.jogruber.de/v4/" +
    USERNAME + "?y=all";

  const numberFormat = n =>
    Number(n || 0).toLocaleString("en-US");

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  const languageIcons = {
    "JavaScript": "javascript",
    "TypeScript": "typescript",
    "HTML": "html5",
    "CSS": "css3",
    "Python": "python",
    "PHP": "php",
    "Java": "java",
    "C": "c",
    "C++": "cplusplus",
    "C#": "csharp",
    "Ruby": "ruby",
    "Go": "go",
    "Rust": "rust",
    "Swift": "swift",
    "Kotlin": "kotlin",
    "Dart": "dart",
    "Shell": "bash",
    "PowerShell": "powershell",
    "Vue": "vuejs",
    "Jupyter Notebook": "jupyter",
    "Dockerfile": "docker",
    "SCSS": "sass",
    "Less": "less",
    "R": "r",
    "Lua": "lua",
    "Perl": "perl",
    "Objective-C": "objectivec",
    "Assembly": "c",
    "Makefile": "cmake"
  };

  const languageLabels = {
    "Jupyter Notebook": "Jupyter",
    "HTML": "HTML5",
    "CSS": "CSS3",
    "Shell": "Shell"
  };

  async function fetchJSON(url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error(
        "Request failed: " + response.status
      );
    }

    return response.json();
  }

  /* ==================================
     LOAD GITHUB PROFILE
  ================================== */

  async function loadProfile() {

    const user = await fetchJSON(
      `${API}/users/${USERNAME}`
    );

    const avatar = document.getElementById("ghAvatar");

    if (avatar) {
      avatar.src = user.avatar_url;
    }

    setText(
      "ghName",
      user.name || user.login
    );

    setText(
      "ghUsername",
      "@" + user.login
    );

    setText(
      "ghBio",
      user.bio || "Developer at LinkTech"
    );

    setText(
      "ghFollowers",
      numberFormat(user.followers)
    );

    const profileLink =
      document.getElementById("ghUsername");

    if (profileLink) {
      profileLink.href = user.html_url;
    }

    return user;
  }

  /* ==================================
     LOAD CONTRIBUTIONS
  ================================== */

  async function loadContributions() {

    const data = await fetchJSON(
      CONTRIBUTIONS_API
    );

    const today = new Date();

    const year = today.getFullYear();

    const currentYear = String(year);

    const contributions =
      data.contributions || [];

    const totals = data.total || {};

    // Current year total

    const yearTotal =
      Number(totals[currentYear] || 0);

    setText(
      "ghThisYear",
      numberFormat(yearTotal)
    );

    // Last 365 days

    const cutoff = new Date(today);

    cutoff.setHours(0, 0, 0, 0);

    cutoff.setDate(cutoff.getDate() - 364);

    const last365 = contributions.filter(day => {
      return new Date(day.date + "T00:00:00") >= cutoff
        && new Date(day.date + "T00:00:00") <= today;
    });

    const last365Total = last365.reduce(
      (sum, day) => sum + Number(day.count || 0),
      0
    );

    setText(
      "ghLast365",
      numberFormat(last365Total)
    );

    // All-time total

    const allTime = Object.values(totals).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );

    setText(
      "ghAllTime",
      numberFormat(allTime)
    );

    // Calendar summary

    const activeDays = last365.filter(
      day => Number(day.count) > 0
    ).length;

    setText(
      "ghCalendarTotal",
      numberFormat(last365Total) + " contributions"
    );

    setText(
      "ghActiveDays",
      numberFormat(activeDays) + " active days"
    );

    setText(
      "ghCalendarYear",
      "Last 365 days"
    );

    renderCalendar(last365);
  }

  /* ==================================
     RENDER CONTRIBUTION CALENDAR
  ================================== */

  function renderCalendar(days) {

    const container =
      document.getElementById("ghCalendar");

    if (!container) return;

    container.replaceChildren();

    days.forEach(day => {

      const cell = document.createElement("div");

      const count = Number(day.count || 0);

      let level = 0;

      if (count >= 1) level = 1;
      if (count >= 3) level = 2;
      if (count >= 6) level = 3;
      if (count >= 10) level = 4;

      cell.className = "gh-day level-" + level;

      cell.title =
        `${day.date}: ${count} contributions`;

      container.appendChild(cell);
    });
  }

  /* ==================================
     LOAD PUBLIC REPOSITORIES
  ================================== */

  async function loadRepositories() {

    const repos = await fetchJSON(
      `${API}/users/${USERNAME}/repos?type=owner&sort=updated&per_page=100`
    );

    // Exclude forks for original project statistics

    const originalRepos = repos.filter(
      repo => !repo.fork
    );

    const stars = originalRepos.reduce(
      (sum, repo) => sum + repo.stargazers_count,
      0
    );

    setText(
      "ghRepos",
      numberFormat(originalRepos.length)
    );

    setText(
      "ghStars",
      numberFormat(stars)
    );

    // Count primary languages per repository

    const languageCounts = {};

    originalRepos.forEach(repo => {

      if (!repo.language) return;

      languageCounts[repo.language] =
        (languageCounts[repo.language] || 0) + 1;

    });

    renderLanguages(languageCounts);

    // Latest projects

    renderRepositories(
      originalRepos.slice(0, 6)
    );
  }

  /* ==================================
     LANGUAGE ICONS
  ================================== */

  function renderLanguages(languages) {

    const container =
      document.getElementById("ghLanguages");

    if (!container) return;

    container.replaceChildren();

    const entries = Object.entries(languages)
      .sort((a, b) => b[1] - a[1]);

    if (!entries.length) {
      container.textContent =
        "No public programming languages found.";
      return;
    }

    entries.forEach(([language, count]) => {

      const slug = languageIcons[language];

      const card = document.createElement("div");

      card.className = "gh-language-card";

      const icon = document.createElement("img");

      icon.alt = language;

      if (slug) {
        icon.src =
          `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${slug}/${slug}-original.svg`;

        icon.onerror = () => {
          icon.style.display = "none";
        };
      } else {
        icon.style.display = "none";
      }

      const details = document.createElement("div");

      const name = document.createElement("strong");

      name.textContent =
        languageLabels[language] || language;

      const countLabel = document.createElement("small");

      countLabel.textContent =
        `${count} ${count === 1 ? "repository" : "repositories"}`;

      details.append(name, countLabel);

      card.append(icon, details);

      container.appendChild(card);
    });
  }

  /* ==================================
     LATEST PROJECTS
  ================================== */

  function renderRepositories(repos) {

    const container =
      document.getElementById("ghRepositories");

    if (!container) return;

    container.replaceChildren();

    if (!repos.length) {
      container.textContent =
        "No public projects available.";
      return;
    }

    repos.forEach(repo => {

      const card = document.createElement("article");

      card.className = "gh-repo-card";

      const heading = document.createElement("h4");

      const link = document.createElement("a");

      link.href = repo.html_url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = repo.name;

      heading.appendChild(link);

      const description = document.createElement("p");

      description.textContent =
        repo.description || "LinkTech development project.";

      const metadata = document.createElement("div");

      metadata.className = "gh-repo-meta";

      const language = repo.language || "Other";

      const updated = new Date(repo.updated_at)
        .toLocaleDateString();

      metadata.textContent =
        `💻 ${language}  ⭐ ${numberFormat(repo.stargazers_count)}  📅 ${updated}`;

      card.append(
        heading,
        description,
        metadata
      );

      container.appendChild(card);
    });
  }

  /* ==================================
     INITIALIZE
  ================================== */

  async function initializeGitHub() {

    setText(
      "ghStatus",
      "Connecting to GitHub..."
    );

    const results = await Promise.allSettled([
      loadProfile(),
      loadContributions(),
      loadRepositories()
    ]);

    const failed = results.filter(
      result => result.status === "rejected"
    );

    setText(
      "ghStatus",
      failed.length
        ? "Some GitHub information could not be loaded. Please refresh later."
        : "✓ GitHub information successfully loaded."
    );

    setText(
      "ghUpdated",
      "Updated: " + new Date().toLocaleString()
    );

    if (failed.length) {
      console.error(
        "GitHub portfolio errors:",
        results.filter(r => r.status === "rejected")
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeGitHub,
      { once: true }
    );
  } else {
    initializeGitHub();
  }

})();
