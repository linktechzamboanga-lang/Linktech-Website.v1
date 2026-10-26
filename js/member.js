
"use strict";

const CONFIG = {
  GOOGLE_CLIENT_ID: "495855477306-9rdg89fh3g5mtolu8th08ltojor8lkkr.apps.googleusercontent.com",
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby1C6QbwfSFSL76AgwbBLV-CtuAkhxj1nfaNRHkIbjPJz9mesFBSFqg_zfSuDmP6ChT/exec"
};

const $ = id => document.getElementById(id);

let credential = "";
let signedInUser = null;
let isAdmin = false;

const dialog = $("joinDialog");
const form = $("membershipForm");
const submitButton = $("submitApplication");
const formMessage = $("formMessage");

function setMessage(text, type = "") {
  formMessage.textContent = text;
  formMessage.className = "form-message " + type;
}

function isConfigured() {
  return CONFIG.GOOGLE_CLIENT_ID.endsWith(
    ".apps.googleusercontent.com"
  ) && CONFIG.APPS_SCRIPT_URL.startsWith(
    "https://script.google.com/macros/s/"
  );
}

function openJoinDialog() {
  dialog.showModal();

  if (!isConfigured()) {
    $("googleButtonContainer").textContent =
      "Configure the Google Client ID and Apps Script URL first.";
    return;
  }

  renderGoogleButton();
}

$("openJoin").addEventListener("click", openJoinDialog);
$("openJoinBottom").addEventListener("click", openJoinDialog);

$("closeJoin").addEventListener("click", () => dialog.close());

dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});

function renderGoogleButton() {
  if (!window.google?.accounts?.id) {
    $("googleButtonContainer").textContent =
      "Google sign-in is loading. Please wait.";
    setTimeout(() => {
      if (dialog.open) renderGoogleButton();
    }, 800);
    return;
  }

  google.accounts.id.initialize({
    client_id: CONFIG.GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  $("googleButtonContainer").replaceChildren();

  google.accounts.id.renderButton(
    $("googleButtonContainer"),
    {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 280
    }
  );
}

/* Decode the Google ID token for display only.
   The server independently verifies the token. */
function decodeToken(token) {
  try {
    const part = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const raw = atob(
      part.padEnd(part.length + (4 - part.length % 4) % 4, "=")
    );

    return JSON.parse(
      decodeURIComponent(
        Array.from(raw, c =>
          "%" + c.charCodeAt(0).toString(16).padStart(2, "0")
        ).join("")
      )
    );
  } catch {
    return null;
  }
}

function handleGoogleCredential(response) {
  credential = response.credential || "";

  const profile = decodeToken(credential);

  if (!profile?.email) {
    setMessage("Google sign-in failed. Please try again.", "error");
    return;
  }

  signedInUser = {
    name: profile.name || "Google Member",
    email: profile.email,
    picture: profile.picture || ""
  };

  const box = $("signedInProfile");
  box.hidden = false;
  box.style.display = "flex";
  box.replaceChildren();

  if (signedInUser.picture) {
    const img = document.createElement("img");
    img.src = signedInUser.picture;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    box.appendChild(img);
  }

  const info = document.createElement("div");
  const name = document.createElement("strong");
  const email = document.createElement("div");

  name.textContent = signedInUser.name;
  email.textContent = signedInUser.email;
  info.append(name, email);
  box.appendChild(info);

  submitButton.disabled = false;
  setMessage(
    "Signed in. Complete the form and accept all terms.",
    "success"
  );

  loadAdminApplications();
}

/* JSONP communication with Apps Script.
   For production use, consider a same-origin API or backend proxy:
   query-string requests can expose application data in URLs/logs. */
function apiRequest(params) {
  return new Promise((resolve, reject) => {
    if (!isConfigured()) {
      reject(new Error("Google and Apps Script configuration is missing."));
      return;
    }

    const callbackName =
      "linkTechCallback_" + Math.random().toString(36).slice(2);

    const script = document.createElement("script");
    const url = new URL(CONFIG.APPS_SCRIPT_URL);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    url.searchParams.set("callback", callbackName);

    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
      delete window[callbackName];
      script.remove();
      clearTimeout(timeout);
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Server timed out. Check the deployment URL."));
    }, 25000);

    window[callbackName] = result => {
      cleanup();

      if (result?.ok) resolve(result);
      else reject(new Error(result?.error || "Server request failed."));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not connect to the membership server."));
    };

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function signedInRequest(action, extra = {}) {
  return apiRequest({
    action,
    token: credential,
    ...extra
  });
}

/* Submit an application */
form.addEventListener("submit", async event => {
  event.preventDefault();

  if (!credential || !signedInUser) {
    setMessage("Sign in with Google before submitting.", "error");
    return;
  }

  if (
    !$("cityConfirm").checked ||
    !$("termsConfirm").checked ||
    !$("copyrightConfirm").checked
  ) {
    setMessage(
      "Confirm your residence and accept all required terms.",
      "error"
    );
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";
  setMessage("Submitting your application...");

  try {
    const result = await signedInRequest("apply", {
      city: "Zamboanga City",
      position: $("position").value,
      skills: $("skills").value.trim(),
      motivation: $("motivation").value.trim(),
      cityConfirmed: "true",
      termsAccepted: "true",
      copyrightAccepted: "true"
    });

    setMessage(
      result.message || "Application submitted for review.",
      "success"
    );

    form.reset();
    $("city").value = "Zamboanga City";

    await loadMembers();
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    submitButton.disabled = !credential;
    submitButton.textContent = "Submit Membership Application";
  }
});

/* Load public approved members */
function safePhoto(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function renderMembers(members) {
  const grid = $("membersGrid");
  grid.replaceChildren();

  if (!members.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent =
      "No approved members are listed yet.";
    grid.appendChild(empty);
    return;
  }

  members.forEach(member => {
    const card = document.createElement("article");
    card.className = "member-card";

    const avatar = document.createElement("img");
    avatar.className = "member-avatar";
    avatar.alt = "";
    avatar.referrerPolicy = "no-referrer";
    avatar.src = safePhoto(member.photoUrl) ||
      "images/LinkTech-logo.png";

    avatar.onerror = () => {
      avatar.onerror = null;
      avatar.src = "images/LinkTech-logo.png";
    };

    const info = document.createElement("div");
    info.className = "member-info";

    const name = document.createElement("h3");
    name.textContent = member.name || "LinkTech Member";

    const role = document.createElement("div");
    role.className = "member-role";
    role.textContent = member.position || "Community Contributor";

    const verified = document.createElement("span");
    verified.className = "verified-pill";
    verified.textContent = "✓ LinkTech Verified Member";

    info.append(name, role, verified);
    card.append(avatar, info);
    grid.appendChild(card);
  });
}

async function loadMembers() {
  $("directoryStatus").textContent = "Loading approved members...";

  try {
    const result = await apiRequest({ action: "members" });
    const members = result.members || [];

    renderMembers(members);
    $("directoryStatus").textContent =
      `${members.length} approved member(s).`;
  } catch (error) {
    $("directoryStatus").textContent =
      "Membership server is not connected. Check your configuration.";
    renderMembers([]);
  }
}

$("refreshMembers").addEventListener("click", loadMembers);

/* Admin review panel */
async function loadAdminApplications() {
  if (!credential) return;

  try {
    const result = await signedInRequest("adminList");
    isAdmin = true;
    $("adminReview").hidden = false;

    renderApplications(result.applications || []);

    $("adminStatus").textContent =
      `${(result.applications || []).length} pending application(s).`;
  } catch {
    isAdmin = false;
    $("adminReview").hidden = true;
  }
}

function renderApplications(applications) {
  const root = $("adminApplications");
  root.replaceChildren();

  if (!applications.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No pending applications.";
    root.appendChild(empty);
    return;
  }

  applications.forEach(app => {
    const card = document.createElement("article");
    card.className = "admin-app";

    const title = document.createElement("h3");
    title.textContent =
      `${app.name || "Applicant"} — ${app.position || "No position"}`;

    const email = document.createElement("p");
    email.textContent = `${app.email || ""} · ${app.city || ""}`;

    const skills = document.createElement("p");
    skills.textContent = "Skills: " + (app.skills || "Not provided");

    const motivation = document.createElement("p");
    motivation.textContent =
      "Motivation: " + (app.motivation || "Not provided");

    const actions = document.createElement("div");
    actions.className = "admin-actions";

    [
      ["APPROVED", "Approve", "approve"],
      ["REJECTED", "Reject", "reject"]
    ].forEach(([status, label, className]) => {
      const button = document.createElement("button");
      button.className = `primary ${className}`;
      button.textContent = label;
      button.addEventListener("click", () => {
        decideApplication(app.memberId, status);
      });
      actions.appendChild(button);
    });

    card.append(title, email, skills, motivation, actions);
    root.appendChild(card);
  });
}

async function decideApplication(memberId, status) {
  if (!isAdmin) return;

  if (
    status === "APPROVED" &&
    !confirm("Approve this member and list their public profile?")
  ) {
    return;
  }

  const adminNote = status === "REJECTED"
    ? (prompt("Optional private rejection note:") || "")
    : "";

  try {
    await signedInRequest("decide", {
      memberId,
      status,
      adminNote
    });

    $("adminStatus").textContent =
      `Application ${status.toLowerCase()}.`;

    await loadAdminApplications();
    await loadMembers();
  } catch (error) {
    $("adminStatus").textContent = error.message;
  }
}

$("refreshAdmin").addEventListener("click", loadAdminApplications);

loadMembers();
