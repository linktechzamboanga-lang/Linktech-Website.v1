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
   
    "computer inventory pro":
   "https://drive.usercontent.google.com/download?id=1p4WuiaeAAk_loBjPOhlu01oYak2_g0uv&export=download&authuser=0",


    "computer inventory":
   "https://drive.usercontent.google.com/download?id=1plWIfqdrBW5bzl99uI-H3q27XNhmF00h&export=download&authuser=0"

};


/* =========================
   DOWNLOAD BUTTON SYSTEM
========================= */

const downloadButtons =
    document.querySelectorAll(".download-btn");


downloadButtons.forEach(button => {

    button.addEventListener("click", function () {

        /* =========================
           GET FILE KEY
        ========================= */

        const fileKey =
            this.getAttribute("data-file");


        /* =========================
           FIND DOWNLOAD URL
        ========================= */

        const file =
            downloadFiles[fileKey];


        if (!file) {

            console.error(
                "Download file not found:",
                fileKey
            );

            alert(
                "Download file not found."
            );

            return;

        }


        /* =========================
           BUTTON ELEMENT
        ========================= */

        const text =
            this.querySelector(".btn-text");


        /* =========================
           PREVENT DOUBLE CLICK
        ========================= */

        if (
            this.classList.contains(
                "downloading"
            )
        ) {

            return;

        }


        /* =========================
           START LOADING
        ========================= */

        this.classList.add(
            "downloading"
        );


        if (text) {

            text.innerText =
                "Preparing Download...";

        }


        /* =========================
           CREATE HIDDEN LINK
        ========================= */

        const downloadLink =
            document.createElement("a");


        downloadLink.href = file;

        downloadLink.download = "";

        downloadLink.style.display = "none";


        document.body.appendChild(
            downloadLink
        );


        /* =========================
           START DOWNLOAD
        ========================= */

        downloadLink.click();


        /* =========================
           REMOVE TEMPORARY LINK
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
           DOWNLOAD STARTED
        ========================= */

        setTimeout(() => {

            this.classList.remove(
                "downloading"
            );


            this.classList.add(
                "success"
            );


            if (text) {

                text.innerText =
                    "Download Started";

            }

        }, 1500);


        /* =========================
           RESET BUTTON
        ========================= */

        setTimeout(() => {

            this.classList.remove(
                "success"
            );


            if (text) {

                text.innerText =
                    "Download";

            }

        }, 5000);

    });

});
