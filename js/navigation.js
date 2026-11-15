
const sideTrigger = document.getElementById("ltSideTrigger");
const sidePanel = document.getElementById("ltSidePanel");
const sideClose = document.getElementById("ltSideClose");
const sideOverlay = document.getElementById("ltSideOverlay");

function openLinkTechPanel() {
    sidePanel.classList.add("active");
    sideTrigger.classList.add("active");
    sideOverlay.classList.add("active");
    document.body.classList.add("lt-panel-open");

    sideTrigger.setAttribute("aria-expanded", "true");
    sideTrigger.innerHTML = "❮";
}

function closeLinkTechPanel() {
    sidePanel.classList.remove("active");
    sideTrigger.classList.remove("active");
    sideOverlay.classList.remove("active");
    document.body.classList.remove("lt-panel-open");

    sideTrigger.setAttribute("aria-expanded", "false");
    sideTrigger.innerHTML = "❯";
}

sideTrigger.addEventListener("click", () => {
    if (sidePanel.classList.contains("active")) {
        closeLinkTechPanel();
    } else {
        openLinkTechPanel();
    }
});

sideClose.addEventListener("click", closeLinkTechPanel);
sideOverlay.addEventListener("click", closeLinkTechPanel);

sidePanel.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeLinkTechPanel);
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeLinkTechPanel();
    }
});
