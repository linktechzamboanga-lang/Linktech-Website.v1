
/* ==========================================
   LINKTECH TICKET NUMBER
   ADMIN USER MANAGEMENT
========================================== */

LT.loadAdminUsers = async function() {
  if (!LT.state.isAdmin) return;

  const container = LT.el("userList");
  if (!container) return;

  container.textContent = "Loading users...";

  try {
    const result = await LT.api("adminUsers", {
      token: LT.state.token
    });

    const users = Array.isArray(result)
      ? result
      : (result.users || []);

    container.replaceChildren();

    if (!users.length) {
      const empty = document.createElement("div");
      empty.className = "lt-empty";
      empty.textContent = "No registered users found.";
      container.appendChild(empty);
      return;
    }

    users.forEach(function(user) {
      const card = document.createElement("div");
      card.className = "lt-ticket-item";

      const info = document.createElement("div");
      info.className = "lt-ticket-main";

      const username = document.createElement("strong");
      username.className = "lt-ticket-no";
      username.style.fontSize = "14px";
      username.textContent = user.username || "Unnamed user";

      const email = document.createElement("span");
      email.className = "lt-ticket-meta";
      email.textContent = user.email || "";

      const status = document.createElement("span");
      status.className = "lt-status " +
        String(user.status || "Pending").toLowerCase();
      status.textContent = user.status || "Pending";

      info.append(username, email, status);
      card.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "lt-ticket-actions";

      if (user.status !== "Approved") {
        const approve = document.createElement("button");
        approve.type = "button";
        approve.textContent = "Approve";

        approve.addEventListener("click", function() {
          performAdminUserAction(user.email, "Approve");
        });

        actions.appendChild(approve);
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";
      remove.style.color = "#bd3c49";

      remove.addEventListener("click", function() {
        performAdminUserAction(user.email, "Delete");
      });

      actions.appendChild(remove);
      card.appendChild(actions);

      container.appendChild(card);
    });

  } catch (error) {
    container.textContent = "Unable to load users: " + error.message;
  }
};

/* ---------- ADMIN USER ACTION ---------- */

async function performAdminUserAction(email, action) {
  if (!LT.state.isAdmin) {
    LT.message("Administrator permission is required.", "error");
    return;
  }

  if (!email) return;

  const confirmed = confirm(
    action + " account " + email + "?"
  );

  if (!confirmed) return;

  try {
    await LT.api("adminUserAction", {
      token: LT.state.token,
      email: email,
      action: action
    });

    LT.message(
      "Account " + action.toLowerCase() + " completed.",
      "success"
    );

    await LT.loadAdminUsers();

  } catch (error) {
    LT.message(error.message, "error");
  }
}

/* ---------- REFRESH ADMIN USERS ---------- */

document.addEventListener("DOMContentLoaded", function() {
  const refresh = LT.el("refreshUsersBtn");

  if (refresh) {
    refresh.addEventListener("click", LT.loadAdminUsers);
  }
});