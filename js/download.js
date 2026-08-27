/* =========================
   SOFTWARE SEARCH
========================= */

function searchSoftware() {

    const input = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const cards =
        document.querySelectorAll(".card");

    cards.forEach(card => {

        const titleElement =
            card.querySelector("h3");

        const descriptionElement =
            card.querySelector("p");

        const title =
            titleElement
                ? titleElement.textContent.toLowerCase()
                : "";

        const description =
            descriptionElement
                ? descriptionElement.textContent.toLowerCase()
                : "";

        if (
            title.includes(input) ||
            description.includes(input)
        ) {
            card.style.display = "";
        } else {
            card.style.display = "none";
        }

    });

}


/* =========================
   DOWNLOAD FILE DATABASE
========================= */

const downloadFiles = {

    linktech2026:
        "https://drive.usercontent.google.com/download?id=1SsUikiB9N8Nw0qADAVar7rxqRYt_OG0K&export=download&authuser=0",

    Winrar:
        "https://www.win-rar.com/fileadmin/winrar-versions/winrar/winrar-x64-722.exe",

    Chrome:
        "https://dl.google.com/chrome/install/latest/chrome_installer.exe",

    VLC:
        "https://get.videolan.org/vlc/3.0.23/win64/vlc-3.0.23-win64.exe",

    "Epson L120 Resetter":
        "https://ozamiz.deped.gov.ph/resetter/l120-resetcracked.zip",

    "Epson L3150 Resetter":
        "https://ozamiz.deped.gov.ph/resetter/Epson%20L3150%20Resetter.zip",

    "Epson L1210 / L3210 / L3250 Series Resetter":
        "https://ozamiz.deped.gov.ph/resetter/EPSON_L1210_L3210_L3250_L3251_L3260_L5290.zip",

    AnyDesk:
        "https://download.anydesk.com/AnyDesk.exe",

    /* =========================
       COMPUTER INVENTORY PRO
    ========================= */

    "Computer Inventory System pro":
        "https://drive.usercontent.google.com/download?id=1p4WuiaeAAk_loBjPOhlu01oYak2_g0uv&export=download&authuser=0",

    /* =========================
       COMPUTER INVENTORY FREE
    ========================= */

    "Computer Inventory System":
        "https://drive.usercontent.google.com/download?id=1plWIfqdrBW5bzl99uI-H3q27XNhmF00h&export=download&authuser=0"

};


/* =========================
   PRO PRODUCT IDENTIFIER
========================= */

const PRO_PRODUCT_NAME =
    "Computer Inventory System pro";

const PRO_PRICE =
    "₱150.00";


/* =========================
   OPEN PURCHASE WINDOW
========================= */

function openProPurchase() {

    let modal =
        document.getElementById("proPurchaseModal");

    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "proPurchaseModal";

        modal.innerHTML = `

            <div class="pro-purchase-overlay">

                <div class="pro-purchase-box">

                    <button
                        type="button"
                        class="pro-close"
                        id="closeProPurchase">
                        ×
                    </button>

                    <div class="pro-icon">
                        ⭐
                    </div>

                    <h2>
                        Computer Inventory Pro
                    </h2>

                    <p class="pro-description">
                        This is a paid version of
                        Computer Inventory System.
                    </p>

                    <div class="pro-price">
                        ${PRO_PRICE}
                    </div>

                    <p class="pro-notice">
                        Purchase is required before
                        downloading the Pro APK.
                    </p>

                    <button
                        type="button"
                        class="pro-pay-btn"
                        id="proPayButton">

                        Proceed to Purchase

                    </button>

                    <button
                        type="button"
                        class="pro-cancel-btn"
                        id="proCancelButton">

                        Cancel

                    </button>

                </div>

            </div>

        `;

        document.body.appendChild(modal);

        document
            .getElementById("closeProPurchase")
            .addEventListener(
                "click",
                closeProPurchase
            );

        document
            .getElementById("proCancelButton")
            .addEventListener(
                "click",
                closeProPurchase
            );

        document
            .getElementById("proPayButton")
            .addEventListener(
                "click",
                proceedToPurchase
            );

    }

    modal.style.display =
        "flex";

}


/* =========================
   CLOSE PURCHASE WINDOW
========================= */

function closeProPurchase() {

    const modal =
        document.getElementById(
            "proPurchaseModal"
        );

    if (modal) {

        modal.style.display =
            "none";

    }

}


/* =========================
   PROCEED TO PAYMENT
========================= */

function proceedToPurchase() {

    /*
     * IMPORTANT:
     *
     * Replace this URL with your
     * actual payment page.
     *
     * Example:
     *
     * https://yourwebsite.com/
     * computer-inventory-pro-payment
     */

    const paymentPage =
        "https://lintechzamboanga.solutions/computer-inventory-pro-payment";

    window.location.href =
        paymentPage;

}


/* =========================
   DOWNLOAD NORMAL FILE
========================= */

function startNormalDownload(
    button,
    file
) {

    const text =
        button.querySelector(".btn-text");

    if (!text) {
        return;
    }


    /* =========================
       START LOADING
    ========================= */

    button.classList.add(
        "downloading"
    );

    text.innerText =
        "Preparing Download...";


    /* =========================
       CREATE DOWNLOAD LINK
    ========================= */

    const downloadLink =
        document.createElement("a");

    downloadLink.href =
        file;

    downloadLink.download =
        "";

    downloadLink.style.display =
        "none";

    document.body.appendChild(
        downloadLink
    );


    /* =========================
       START DOWNLOAD
    ========================= */

    downloadLink.click();


    /* =========================
       REMOVE LINK
    ========================= */

    setTimeout(() => {

        if (
            document.body.contains(
                downloadLink
            )
        ) {

            document.body.removeChild(
                downloadLink
            );

        }

    }, 1000);


    /* =========================
       SUCCESS
    ========================= */

    setTimeout(() => {

        button.classList.remove(
            "downloading"
        );

        button.classList.add(
            "success"
        );

        text.innerText =
            "Download Started";

    }, 1500);


    /* =========================
       RESET BUTTON
    ========================= */

    setTimeout(() => {

        button.classList.remove(
            "success"
        );

        text.innerText =
            "Download";

    }, 5000);

}


/* =========================
   DOWNLOAD BUTTON SYSTEM
========================= */

const downloadButtons =
    document.querySelectorAll(
        ".download-btn"
    );


downloadButtons.forEach(button => {

    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            const file =
                this.getAttribute(
                    "data-file"
                );

            /* =========================
               VALIDATE FILE
            ========================= */

            if (!file) {

                alert(
                    "Download file is not available."
                );

                return;

            }


            /* =========================
               CHECK PRO DOWNLOAD
            ========================= */

            if (
                file === PRO_PRODUCT_NAME
            ) {

                openProPurchase();

                return;

            }


            /* =========================
               NORMAL DOWNLOAD
            ========================= */

            startNormalDownload(
                this,
                file
            );

        }
    );

});
