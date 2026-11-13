/* ==========================================
   LINKTECH TICKET NUMBER - LOGIN
   GitHub Pages frontend / Worker API client
========================================== */
const LT_SESSION_KEY = "LT_TICKET_SESSION";
const LT_ROOM_KEY = "LT_TICKET_ROOM";
window.LT = window.LT || {};

LT.state = {
  token: localStorage.getItem(LT_SESSION_KEY) || "",
  user: null,
  room: null,
  appData: null,
  isAdmin: false,
  isOwner: false
};

LT.el = id => document.getElementById(id);
LT.show = id => {
  const el = LT.el(id);
  if (el) { el.classList.remove("hidden", "lt-hidden"); }
};
LT.hide = id => {
  const el = LT.el(id);
  if (el) { el.classList.add("hidden", "lt-hidden"); }
};
LT.message = function(message, type) {
  const authVisible = LT.el("authView") && !LT.el("authView").classList.contains("hidden");
  const box = authVisible ? LT.el("authMessage") : LT.el("appMessage");
  if (!box) { alert(message); return; }
  box.textContent = message;
  box.className = "message" + (type ? " " + type : "");
  box.classList.remove("hidden", "lt-hidden");
};
LT.clearMessage = function() {
  [LT.el("authMessage"), LT.el("appMessage")].forEach(box => {
    if (box) { box.textContent = ""; box.classList.add("hidden"); }
  });
};
LT.setLoading = function(button, loading, label) {
  if (!button) return;
  if (loading) {
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
    button.disabled = true;
    button.textContent = label || "Please wait...";
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || button.textContent;
  }
};
LT.saveSession = function(token) {
  LT.state.token = token || "";
  if (token) localStorage.setItem(LT_SESSION_KEY, token);
  else localStorage.removeItem(LT_SESSION_KEY);
};
LT.clearSession = function() {
  LT.saveSession("");
  LT.state.user = null; LT.state.room = null; LT.state.appData = null;
  LT.state.isAdmin = false; LT.state.isOwner = false;
  localStorage.removeItem(LT_ROOM_KEY);
};
LT.showWorkspace = function() {
  LT.hide("authView"); LT.show("workspace"); LT.show("logoutBtn");
  const user = LT.state.user || {};
  const account = LT.el("accountName");
  if (account) account.textContent = user.username || user.email || "User";
};
LT.showLogin = function() {
  LT.hide("workspace"); LT.hide("displayView"); LT.show("authView");
  LT.hide("logoutBtn");
};

async function handleLogin(event) {
  event.preventDefault(); LT.clearMessage();
  const form = LT.el("loginForm");
  const button = form && form.querySelector('button[type="submit"]');
  const identity = LT.el("identity");
  const password = LT.el("password");
  if (!identity || !password || !identity.value.trim() || !password.value) {
    LT.message("Enter your email or username and password.", "error"); return;
  }
  LT.setLoading(button, true, "Signing in...");
  try {
    const result = await LT.api("login", {
      identity: identity.value.trim(),
      password: password.value
    });
    if (!result || !result.token) throw new Error("The server did not return a valid session.");
    LT.saveSession(result.token);
    LT.state.user = result.user || result.profile || {};
    password.value = "";
    await LT.loadDashboard();
    LT.message("Login successful.", "success");
  } catch (error) {
    LT.message(error.message || "Unable to sign in.", "error");
  } finally { LT.setLoading(button, false); }
}

async function handleSignup(event) {
  event.preventDefault(); LT.clearMessage();
  const form = LT.el("signupForm");
  const button = form && form.querySelector('button[type="submit"]');
  const email = (LT.el("newEmail")?.value || "").trim().toLowerCase();
  const username = (LT.el("newUsername")?.value || "").trim();
  const password = LT.el("newPassword")?.value || "";
  if (!email || !email.includes("@")) { LT.message("Enter a valid email address.", "error"); return; }
  if (username.length < 3) { LT.message("Username must contain at least 3 characters.", "error"); return; }
  if (password.length < 8) { LT.message("Password must contain at least 8 characters.", "error"); return; }
  LT.setLoading(button, true, "Creating account...");
  try {
    const result = await LT.api("signup", { email, username, password });
    const message = typeof result === "string" ? result : (result.message || "Registration submitted. Wait for administrator approval.");
    form.reset(); LT.hide("signupForm"); LT.show("loginForm");
    setActiveAuthTab("login"); LT.message(message, "success");
  } catch (error) { LT.message(error.message || "Registration failed.", "error"); }
  finally { LT.setLoading(button, false); }
}

function setActiveAuthTab(tab) {
  const login = tab === "login";
  if (login) { LT.show("loginForm"); LT.hide("signupForm"); }
  else { LT.hide("loginForm"); LT.show("signupForm"); }
  document.querySelectorAll(".auth-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  LT.clearMessage();
}

LT.loadDashboard = async function() {
  if (!LT.state.token) { LT.showLogin(); return; }
  try {
    const savedRoom = localStorage.getItem(LT_ROOM_KEY) || "";
    const data = await LT.api("getAppData", { token: LT.state.token, roomId: savedRoom });
    LT.state.appData = data || {};
    LT.state.user = data.user || LT.state.user;
    LT.state.isAdmin = !!(data.user && data.user.role === "Admin");
    LT.showWorkspace();
    if (typeof LT.renderDashboard === "function") LT.renderDashboard(data);
    if (savedRoom && typeof LT.refreshRoom === "function") await LT.refreshRoom(savedRoom);
    if (LT.state.isAdmin && typeof LT.loadAdminUsers === "function") await LT.loadAdminUsers();
  } catch (error) {
    LT.clearSession(); LT.showLogin();
    LT.message(error.message || "Your session expired. Please sign in again.", "error");
  }
};

async function handleLogout() {
  const token = LT.state.token;
  try { if (token) await LT.api("logout", { token }); } catch (_) {}
  LT.clearSession(); LT.showLogin(); LT.message("You have signed out.", "success");
}

document.addEventListener("DOMContentLoaded", function() {
  const loginForm = LT.el("loginForm");
  const signupForm = LT.el("signupForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  if (signupForm) signupForm.addEventListener("submit", handleSignup);
  const logout = LT.el("logoutBtn");
  if (logout) logout.addEventListener("click", handleLogout);
  document.querySelectorAll(".auth-tab").forEach(button => {
    button.addEventListener("click", () => setActiveAuthTab(button.dataset.tab));
  });
  if (INITIAL_DISPLAY_ID || INITIAL_KIOSK_ID) return;
  if (LT.state.token) LT.loadDashboard(); else LT.showLogin();
});
