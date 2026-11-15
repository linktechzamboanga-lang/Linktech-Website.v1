/* =====================================
   LINKTECH TOOLS AUTO SCROLL
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    const toolsButton = document.getElementById("openToolsBtn");

    if (!toolsButton) return;

    toolsButton.addEventListener("click", function () {

        // Automatically find tools section
        const toolsSection = document.querySelector(".tools-grid");

        if (!toolsSection) {
            console.warn("LinkTech tools section not found.");
            return;
        }

        // Smooth scroll to tools
        toolsSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        // Temporary highlight
        toolsSection.classList.add("tools-highlight");

        setTimeout(function () {
            toolsSection.classList.remove("tools-highlight");
        }, 1800);

    });

});