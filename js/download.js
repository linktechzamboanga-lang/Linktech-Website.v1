function searchSoftware(){

    let input = document
    .getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();


    let cards = document.querySelectorAll(".card");


    cards.forEach(card=>{


        let title = card
        .querySelector("h3")
        .textContent
        .toLowerCase();


        let description = card
        .querySelector("p")
        .textContent
        .toLowerCase();



        if(
            title.includes(input) ||
            description.includes(input)
        ){

            card.style.display="";

        }
        else{

            card.style.display="none";

        }


    });


}



/* =========================
   DOWNLOAD BUTTON SYSTEM
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

Epson L120 Resetter:
"https://ozamiz.deped.gov.ph/resetter/l120-resetcracked.zip",


Epson L3150 Resetter:
"https://ozamiz.deped.gov.ph/resetter/Epson%20L3150%20Resetter.zip",

Epson L1210 / L3210 / L3250 Series Resetter:
"https://ozamiz.deped.gov.ph/resetter/EPSON_L1210_L3210_L3250_L3251_L3260_L5290.zip",


AnyDesk:
"https://download.anydesk.com/AnyDesk.exe"
};

const downloadButtons =
document.querySelectorAll(".download-btn");


downloadButtons.forEach(button => {

    button.addEventListener("click", function () {

        const fileKey =
            this.getAttribute("data-file");

        const file =
            downloadFiles[fileKey];

        if (!file) {

            alert("Download file not found.");

            return;

        }


        const text =
            this.querySelector(".btn-text");


        this.classList.add("downloading");

        text.innerText =
            "Preparing Download...";


        const downloadLink =
            document.createElement("a");


        downloadLink.href = file;

        downloadLink.download = "";

        downloadLink.style.display = "none";


        document.body.appendChild(
            downloadLink
        );


        downloadLink.click();


        setTimeout(() => {

            document.body.removeChild(
                downloadLink
            );

        }, 1000);


        setTimeout(() => {

            this.classList.remove(
                "downloading"
            );

            this.classList.add(
                "success"
            );

            text.innerText =
                "Download Started";

        }, 1500);


        setTimeout(() => {

            this.classList.remove(
                "success"
            );

            text.innerText =
                "Download";

        }, 5000);

    });

});
