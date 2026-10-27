"use strict";

/* =========================================================
   SOFTWARE DOWNLOAD LINKS
========================================================= */

const downloadFiles = {
    linktech2026:
        "https://github.com/linktechzamboanga-lang/Linktech-Website.v1/releases/download/v1.0.0.0/LinkTech2026.apk",

    TxtToolHub:
        "https://github.com/linktechzamboanga-lang/Linktech-Website.v1/releases/download/v1.1/TextToolHub.apk",

    ImageToolHub:
        "https://imagestools-hub.vercel.app/",

    AssistantNote:
        "https://github.com/linktechzamboanga-lang/Linktech-Website.v1/releases/download/v1/Assistant-Note-1.0.apk",

    PersonalFinance:
        "https://github.com/linktechzamboanga-lang/Linktech-Website.v1/releases/download/v1.0.0/Personal-Finance-1.0.apk",

    ResetterL120:
        "https://github.com/linktechzamboanga-lang/Linktech-Website.v1/releases/download/resetter1/L120.RESETTER.rar",

    "Computer Inventory System pro":
        "https://github.com/linktechzamboanga-lang/Linktech-Website.v1/releases/download/v1.0/Computer-Inventory-System-Pro-1.0.apk"
};


/* =========================================================
   SEARCH SOFTWARE
========================================================= */

function searchSoftware() {
    const input = document.getElementById("searchInput");

    if (!input) return;

    const searchText = input.value.toLowerCase().trim();

    document.querySelectorAll(".software-grid .card").forEach(function (card) {
        card.style.display =
            (!searchText || card.innerText.toLowerCase().includes(searchText))
                ? ""
                : "none";
    });
}


/* =========================================================
   FIND DOWNLOAD URL
========================================================= */

function resolveDownloadUrl(fileKey) {
    if (!fileKey) return "";

    if (Object.prototype.hasOwnProperty.call(downloadFiles, fileKey)) {
        return downloadFiles[fileKey];
    }

    const normalized = String(fileKey)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    const matchingKey = Object.keys(downloadFiles).find(function (key) {
        return key.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized;
    });

    return matchingKey ? downloadFiles[matchingKey] : "";
}


/* =========================================================
   GET SOFTWARE TITLE
========================================================= */

function getSoftwareTitle(button) {
    const card = button ? button.closest(".card") : null;

    if (card) {
        const heading = card.querySelector(
            "h1, h2, h3, h4, .card-title, .software-title"
        );

        if (heading && heading.innerText.trim()) {
            return heading.innerText.trim();
        }
    }

    return (button && button.getAttribute("data-file"))
        || "LinkTech software";
}


/* =========================================================
   FREE DOWNLOAD
========================================================= */

function downloadFreeSoftware(fileKey, button) {
    const url = resolveDownloadUrl(fileKey);

    if (!url) {
        showDownloadMessage(
            "This download link is not configured yet. Please contact LinkTech.",
            "error"
        );

        console.error("Missing download URL:", fileKey);
        restoreDownloadButton(button);
        return;
    }

    setDownloadLoading(button, "Preparing Download...");

    window.setTimeout(function () {
        try {
            /*
             * The target server controls whether the link
             * downloads a file or opens a web application.
             */
            window.location.href = url;
        } catch (error) {
            console.error("Download error:", error);

            showDownloadMessage(
                "Unable to open this link. Please try again.",
                "error"
            );

            restoreDownloadButton(button);
        }
    }, 200);
}


/* =========================================================
   OLD PURCHASE FUNCTION — NOW FREE
   Retained for compatibility with existing HTML.
========================================================= */

function purchaseSoftware(fileKey, button) {
    downloadFreeSoftware(fileKey, button);
}


/* =========================================================
   DOWNLOAD BUTTON HANDLER
========================================================= */

function handleDownloadButton(button) {
    if (!button) return;

    const fileKey = button.getAttribute("data-file");

    if (!fileKey) {
        showDownloadMessage(
            "This download button is missing its data-file value.",
            "error"
        );

        console.error(
            "Download button has no data-file attribute."
        );

        return;
    }

    /*
     * data-type="purchase" and data-pro="true"
     * no longer trigger a purchase workflow.
     */
    downloadFreeSoftware(fileKey, button);
}


/* =========================================================
   INITIALIZE DOWNLOAD BUTTONS
========================================================= */

function initializeDownloadButtons() {
    document.querySelectorAll(".download-btn").forEach(function (button) {
        if (button.dataset.linktechDownloadReady === "true") return;

        button.dataset.linktechDownloadReady = "true";

        button.addEventListener("click", function (event) {
            event.preventDefault();
            handleDownloadButton(button);
        });

        const textElement = button.querySelector(".btn-text");

        if (textElement) {
            textElement.textContent = "Free Download";
        }
    });
}


/* =========================================================
   BUTTON LOADING STATE
========================================================= */

function setDownloadLoading(button, text) {
    if (!button) return;

    button.disabled = true;

    const textElement = button.querySelector(".btn-text");

    if (textElement) {
        textElement.textContent = text;
    }

    const loader = button.querySelector(".loader");

    if (loader) {
        loader.style.display = "inline-block";
    }
}


/* =========================================================
   RESTORE DOWNLOAD BUTTON
========================================================= */

function restoreDownloadButton(button) {
    if (!button) return;

    button.disabled = false;

    const textElement = button.querySelector(".btn-text");

    if (textElement) {
        textElement.textContent = "Free Download";
    }

    const loader = button.querySelector(".loader");

    if (loader) {
        loader.style.display = "none";
    }
}


/* =========================================================
   DOWNLOAD STATUS MESSAGE
========================================================= */

function showDownloadMessage(message, type) {
    let box = document.getElementById("downloadStatus");

    if (!box) {
        box = document.createElement("div");
        box.id = "downloadStatus";

        Object.assign(box.style, {
            position: "fixed",
            left: "50%",
            bottom: "25px",
            transform: "translateX(-50%)",
            zIndex: "9999",
            maxWidth: "90%",
            padding: "14px 18px",
            borderRadius: "10px",
            fontFamily: "Poppins, Arial, sans-serif",
            fontSize: "14px",
            textAlign: "center",
            boxShadow: "0 8px 25px rgba(0,0,0,.25)"
        });

        document.body.appendChild(box);
    }

    box.textContent = message;

    if (type === "error") {
        box.style.background = "#fff0f0";
        box.style.color = "#a30000";
        box.style.border = "1px solid #e4aaaa";
    } else {
        box.style.background = "#e9f9ef";
        box.style.color = "#146c2e";
        box.style.border = "1px solid #83d89d";
    }

    box.style.display = "block";

    window.clearTimeout(box._hideTimer);

    box._hideTimer = window.setTimeout(function () {
        box.style.display = "none";
    }, 5000);
}


/* =========================================================
   SHARING FUNCTIONS
========================================================= */

function getShareUrl(fileKey) {
    /*
     * Share the actual configured software/file link.
     * If the key is unknown, share the current page.
     */
    return resolveDownloadUrl(fileKey)
        || window.location.href.split("#")[0];
}


function getShareText(title) {
    return "Check out " + title
        + " on LinkTech Freelance IT Specialist Zamboanga.";
}


/* =========================================================
   COPY SHARE LINK
========================================================= */

async function copyShareLink(title, fileKey) {
    const shareUrl = getShareUrl(fileKey);

    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareUrl);
        } else {
            const temp = document.createElement("textarea");

            temp.value = shareUrl;
            temp.setAttribute("readonly", "");
            temp.style.position = "fixed";
            temp.style.opacity = "0";

            document.body.appendChild(temp);
            temp.select();

            const copied = document.execCommand("copy");
            temp.remove();

            if (!copied) {
                throw new Error("Copy failed");
            }
        }

        showDownloadMessage(
            "Link copied. You can now paste it into Instagram or any chat.",
            "success"
        );
    } catch (error) {
        window.prompt(
            "Copy this LinkTech software link:",
            shareUrl
        );
    }
}


/* =========================================================
   SHARE SOFTWARE
   Facebook: share link
   Instagram: copy link and open Instagram
   Google: Gmail compose window
   More: native share menu when available
========================================================= */

function shareSoftware(platform, title, fileKey) {
    const url = getShareUrl(fileKey);
    const text = getShareText(title);
    const encodedUrl = encodeURIComponent(url);

    if (platform === "facebook") {
        window.open(
            "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl,
            "_blank",
            "noopener,noreferrer"
        );

        return;
    }

    if (platform === "instagram") {
        copyShareLink(title, fileKey).then(function () {
            window.open(
                "https://www.instagram.com/",
                "_blank",
                "noopener,noreferrer"
            );
        });

        return;
    }

    if (platform === "google") {
        const subject = encodeURIComponent(
            "LinkTech software: " + title
        );

        const body = encodeURIComponent(
            text + "\n\n" + url
        );

        window.open(
            "https://mail.google.com/mail/?view=cm&fs=1&su="
                + subject + "&body=" + body,
            "_blank",
            "noopener,noreferrer"
        );

        return;
    }

    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).catch(function (error) {
            if (error && error.name !== "AbortError") {
                copyShareLink(title, fileKey);
            }
        });
    } else {
        copyShareLink(title, fileKey);
    }
}


/* =========================================================
   CREATE SHARE TOOLBAR FOR EACH SOFTWARE CARD
========================================================= */

function createShareToolbar(button) {
    const card = button.closest(".card");

    if (!card || card.querySelector(".linktech-share-toolbar")) {
        return;
    }

    const title = getSoftwareTitle(button);
    const fileKey = button.getAttribute("data-file") || "";

    const toolbar = document.createElement("div");

    toolbar.className = "linktech-share-toolbar";
    toolbar.setAttribute("aria-label", "Share this software");

    Object.assign(toolbar.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "7px",
        alignItems: "center",
        marginTop: "10px"
    });

    const label = document.createElement("span");

    label.textContent = "Share:";

    Object.assign(label.style, {
        fontSize: "12px",
        opacity: ".8",
        marginRight: "2px"
    });

    toolbar.appendChild(label);

    const shareOptions = [
        { key: "facebook", text: "Facebook" },
        { key: "instagram", text: "Instagram" },
        { key: "google", text: "Google" },
        { key: "native", text: "More" }
    ];

    shareOptions.forEach(function (item) {
        const shareButton = document.createElement("button");

        shareButton.type = "button";
        shareButton.className = "linktech-share-btn";
        shareButton.textContent = item.text;

        shareButton.setAttribute(
            "aria-label",
            "Share " + title + " via " + item.text
        );

        Object.assign(shareButton.style, {
            cursor: "pointer",
            border: "1px solid rgba(0, 220, 255, .35)",
            borderRadius: "7px",
            padding: "6px 9px",
            background: "rgba(0, 220, 255, .08)",
            color: "inherit",
            font: "inherit",
            fontSize: "12px"
        });

        shareButton.addEventListener("click", function () {
            shareSoftware(item.key, title, fileKey);
        });

        toolbar.appendChild(shareButton);
    });

    button.insertAdjacentElement("afterend", toolbar);
}


/* =========================================================
   INITIALIZE SHARING
========================================================= */

function initializeSharing() {
    document.querySelectorAll(".download-btn").forEach(
        createShareToolbar
    );
}


/* =========================================================
   LINKTECH PROMOTIONAL ADVERTISEMENT
   This is a LinkTech promotion, not a paid ad network unit.
========================================================= */

function initializePromotionalAds() {
    if (document.querySelector(".linktech-promo-ad")) return;

    const grid = document.querySelector(".software-grid");

    if (!grid) return;

    const promo = document.createElement("aside");

    promo.className = "linktech-promo-ad";

    promo.setAttribute(
        "aria-label",
        "LinkTech services advertisement"
    );

    Object.assign(promo.style, {
        boxSizing: "border-box",
        width: "100%",
        margin: "22px 0",
        padding: "18px",
        border: "1px solid rgba(0, 220, 255, .35)",
        borderRadius: "14px",
        background: "linear-gradient(135deg, rgba(0, 220, 255, .10), rgba(125, 65, 255, .12))",
        color: "inherit",
        textAlign: "center"
    });

    const heading = document.createElement("h3");

    heading.textContent = "Need IT Support? Choose LinkTech";
    heading.style.margin = "0 0 8px";

    const description = document.createElement("p");

    description.textContent =
        "Computer and laptop repair, upgrades, software installation, CCTV installation, and technical support in Zamboanga.";

    Object.assign(description.style, {
        margin: "0 auto 12px",
        maxWidth: "760px",
        lineHeight: "1.6"
    });

    const link = document.createElement("a");

    link.href = "https://lintechzamboanga.solutions/";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Visit LinkTech Website";

    Object.assign(link.style, {
        display: "inline-block",
        padding: "9px 14px",
        borderRadius: "8px",
        border: "1px solid rgba(0, 220, 255, .5)",
        color: "inherit",
        textDecoration: "none",
        fontWeight: "600"
    });

    promo.append(heading, description, link);

    const cards = grid.querySelectorAll(".card");

    if (cards.length >= 3) {
        cards[2].insertAdjacentElement("afterend", promo);
    } else {
        grid.appendChild(promo);
    }
}


/* =========================================================
   INITIALIZE DOWNLOAD PAGE
========================================================= */

function initializeDownloadPage() {
    initializeDownloadButtons();
    initializeSharing();
    initializePromotionalAds();
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeDownloadPage
);


/* =========================================================
   GLOBAL FUNCTIONS
   Preserve compatibility with existing HTML.
========================================================= */

window.searchSoftware = searchSoftware;
window.downloadFreeSoftware = downloadFreeSoftware;
window.purchaseSoftware = purchaseSoftware;
window.handleDownloadButton = handleDownloadButton;
window.shareSoftware = shareSoftware;
