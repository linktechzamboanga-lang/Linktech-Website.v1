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
        
