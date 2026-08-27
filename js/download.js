/* =========================================================
   LINKTECH DOWNLOAD SYSTEM
   Computer Inventory Pro - GCash Purchase Verification
========================================================= */


/* =========================================================
   SOFTWARE SEARCH
========================================================= */

function searchSoftware() {

    const input =
        document
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


/* =========================================================
   DOWNLOAD FILE DATABASE
========================================================= */

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


    /* =====================================================
       COMPUTER INVENTORY PRO
    ===================================================== */

    "Computer Inventory System pro":
        "https://drive.usercontent.google.com/download?id=1p4WuiaeAAk_loBjPOhlu01oYak2_g0uv&export=download&authuser=0",


    /* =====================================================
       COMPUTER INVENTORY FREE
    ===================================================== */

    "Computer Inventory System":
        "https://drive.usercontent.google.com/download?id=1plWIfqdrBW5bzl99uI-H3q27XNhmF00h&export=download&authuser=0"

};


/* =========================================================
   CONFIGURATION
========================================================= */


/*
 * Google Apps Script Web App URL.
 *
 * Replace this with the /exec URL of your
 * deployed Code.gs Web App.
 */

const PURCHASE_API_URL =
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";


/*
 * Product name MUST MATCH Code.gs
 */

const PRO_PRODUCT_NAME =
    "Computer Inventory System pro";


/*
 * Product price
 */

const PRO_PRICE =
    "₱150.00";


/* =========================================================
   PRO PURCHASE MODAL
========================================================= */

function openProPurchase() {

    let modal =
        document.getElementById(
            "proPurchaseModal"
        );


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

                        Professional Computer Inventory
                        Management System.

                    </p>


                    <div class="pro-price">

                        ${PRO_PRICE}

                    </div>


                    <div class="pro-notice">

                        <strong>
                            Purchase required
                        </strong>

                        <br><br>

                        Pay ₱150.00 through GCash.
                        Your payment will be manually
                        verified before the Pro APK
                        download is unlocked.

                    </div>


                    <button
                        type="button"
                        class="pro-pay-btn"
                        id="proPayButton">

                        Proceed to GCash Purchase

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


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeProPurchase"
            )
            .addEventListener(
                "click",
                closeProPurchase
            );


        document
            .getElementById(
                "proCancelButton"
            )
            .addEventListener(
                "click",
                closeProPurchase
            );


        document
            .getElementById(
                "proPayButton"
            )
            .addEventListener(
                "click",
                proceedToPurchase
            );

    }


    modal.style.display =
        "flex";

}


/* =========================================================
   CLOSE PRO PURCHASE MODAL
========================================================= */

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


/* =========================================================
   PROCEED TO PURCHASE PAGE
========================================================= */

function proceedToPurchase() {

    const paymentPage =
        "https://lintechzamboanga.solutions/computer-inventory-pro-payment.html";


    window.location.href =
        paymentPage;

}


/* =========================================================
   PRO DOWNLOAD VERIFICATION MODAL
========================================================= */

function openProVerification() {

    let modal =
        document.getElementById(
            "proVerificationModal"
        );


    if (!modal) {

        modal =
            document.createElement("div");


        modal.id =
            "proVerificationModal";


        modal.innerHTML = `

            <div class="pro-purchase-overlay">

                <div class="pro-purchase-box">

                    <button
                        type="button"
                        class="pro-close"
                        id="closeProVerification">

                        ×

                    </button>


                    <div class="pro-icon">

                        🔐

                    </div>


                    <h2>

                        Download Pro APK

                    </h2>


                    <p>

                        Enter the Purchase ID
                        and email address you
                        used when submitting
                        your GCash payment.

                    </p>


                    <div
                        class="form-group"
                        style="text-align:left;">

                        <label>

                            Purchase ID

                        </label>


                        <input
                            type="text"
                            id="proPurchaseId"
                            placeholder="Example: PRO-123456789-1234"
                            autocomplete="off">

                    </div>


                    <div
                        class="form-group"
                        style="text-align:left;">

                        <label>

                            Email Address

                        </label>


                        <input
                            type="email"
                            id="proPurchaseEmail"
                            placeholder="Enter your payment email"
                            autocomplete="email">

                    </div>


                    <button
                        type="button"
                        class="pro-pay-btn"
                        id="verifyProButton">

                        Check Payment Status

                    </button>


                    <button
                        type="button"
                        class="pro-cancel-btn"
                        id="cancelProVerification">

                        Cancel

                    </button>


                    <div
                        id="proVerificationStatus"
                        style="
                            margin-top:15px;
                            padding:12px;
                            border-radius:8px;
                            display:none;
                        ">

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        document
            .getElementById(
                "closeProVerification"
            )
            .addEventListener(
                "click",
                closeProVerification
            );


        document
            .getElementById(
                "cancelProVerification"
            )
            .addEventListener(
                "click",
                closeProVerification
            );


        document
            .getElementById(
                "verifyProButton"
            )
            .addEventListener(
                "click",
                verifyProPurchase
            );

    }


    modal.style.display =
        "flex";

}


/* =========================================================
   CLOSE VERIFICATION
========================================================= */

function closeProVerification() {

    const modal =
        document.getElementById(
            "proVerificationModal"
        );


    if (modal) {

        modal.style.display =
            "none";

    }

}


/* =========================================================
   VERIFY PRO PURCHASE
========================================================= */

function verifyProPurchase() {

    const purchaseId =
        document
            .getElementById(
                "proPurchaseId"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "proPurchaseEmail"
            )
            .value
            .trim()
            .toLowerCase();


    const statusBox =
        document.getElementById(
            "proVerificationStatus"
        );


    const verifyButton =
        document.getElementById(
            "verifyProButton"
        );


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!purchaseId) {

        showVerificationStatus(
            "Please enter your Purchase ID.",
            "error"
        );

        return;

    }


    if (!email) {

        showVerificationStatus(
            "Please enter your email address.",
            "error"
        );

        return;

    }


    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email)
    ) {

        showVerificationStatus(
            "Please enter a valid email address.",
            "error"
        );

        return;

    }


    /* =====================================================
       LOADING
    ===================================================== */

    verifyButton.disabled =
        true;


    verifyButton.innerText =
        "Checking Payment...";


    showVerificationStatus(
        "Checking your payment status...",
        "loading"
    );


    /* =====================================================
       API URL
    ===================================================== */

    const url =
        PURCHASE_API_URL +
        "?action=checkProPurchase" +
        "&purchaseId=" +
        encodeURIComponent(
            purchaseId
        ) +
        "&email=" +
        encodeURIComponent(
            email
        );


    /* =====================================================
       REQUEST
    ===================================================== */

    fetch(url)

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Server returned an error."
                );

            }


            return response.json();

        })


        .then(data => {


            /* =================================================
               PURCHASE NOT FOUND
            ================================================= */

            if (!data.success) {

                showVerificationStatus(

                    data.message ||
                    "Purchase not found.",

                    "error"

                );


                return;

            }


            const purchase =
                data.data;


            const status =
                String(
                    purchase.status ||
                    ""
                )
                .toUpperCase();


            /* =================================================
               PAID
            ================================================= */

            if (
                status === "PAID" &&
                purchase.downloadAvailable === true
            ) {

                showVerificationStatus(

                    "Payment verified successfully!<br><br>" +
                    "<strong>Your Pro APK is ready.</strong>",

                    "success"

                );


                setTimeout(() => {

                    downloadProAPK();

                }, 1200);


                return;

            }


            /* =================================================
               PENDING
            ================================================= */

            if (
                status === "PENDING"
            ) {

                showVerificationStatus(

                    "<strong>Payment is still pending.</strong><br><br>" +
                    "Your GCash payment has not yet been approved. " +
                    "Please wait for verification.",

                    "loading"

                );


                return;

            }


            /* =================================================
               REJECTED
            ================================================= */

            if (
                status === "REJECTED"
            ) {

                showVerificationStatus(

                    "<strong>Payment rejected.</strong><br><br>" +
                    "Please contact LinkTech if you believe this is an error.",

                    "error"

                );


                return;

            }


            /* =================================================
               UNKNOWN
            ================================================= */

            showVerificationStatus(

                "Current payment status: " +
                status,

                "error"

            );

        })


        .catch(error => {

            console.error(
                error
            );


            showVerificationStatus(

                "Unable to connect to the payment verification server.<br><br>" +
                "Please check your internet connection and try again.",

                "error"

            );

        })


        .finally(() => {

            verifyButton.disabled =
                false;


            verifyButton.innerText =
                "Check Payment Status";

        });

}


/* =========================================================
   VERIFICATION STATUS DISPLAY
========================================================= */

function showVerificationStatus(
    message,
    type
) {

    const box =
        document.getElementById(
            "proVerificationStatus"
        );


    if (!box) {

        return;

    }


    box.style.display =
        "block";


    box.innerHTML =
        message;


    if (
        type === "success"
    ) {

        box.style.background =
            "#e9f9ef";

        box.style.border =
            "1px solid #83d89d";

        box.style.color =
            "#146c2e";

    }


    else if (
        type === "error"
    ) {

        box.style.background =
            "#fff0f0";

        box.style.border =
            "1px solid #e4aaaa";

        box.style.color =
            "#a30000";

    }


    else {

        box.style.background =
            "#eef6ff";

        box.style.border =
            "1px solid #b8d8f5";

        box.style.color =
            "#0759a5";

    }

}


/* =========================================================
   DOWNLOAD PRO APK
========================================================= */

function downloadProAPK() {

    const file =
        downloadFiles[
            PRO_PRODUCT_NAME
        ];


    if (!file) {

        alert(
            "Pro APK download link is not available."
        );

        return;

    }


    window.location.href =
        file;

}


/* =========================================================
   NORMAL DOWNLOAD
========================================================= */

function startNormalDownload(
    button,
    file
) {

    const text =
        button.querySelector(
            ".btn-text"
        );


    if (!text) {

        return;

    }


    button.classList.add(
        "downloading"
    );


    text.innerText =
        "Preparing Download...";


    const downloadLink =
        document.createElement(
            "a"
        );


    downloadLink.href =
        file;


    downloadLink.download =
        "";


    downloadLink.style.display =
        "none";


    document.body.appendChild(
        downloadLink
    );


    downloadLink.click();


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


    setTimeout(() => {

        button.classList.remove(
            "success"
        );


        text.innerText =
            "Download";

    }, 5000);

}


/* =========================================================
   DOWNLOAD BUTTON SYSTEM
========================================================= */

document
    .querySelectorAll(
        ".download-btn"
    )
    .forEach(button => {


        button.addEventListener(
            "click",
            function(event) {

                event.preventDefault();


                const file =
                    this.getAttribute(
                        "data-file"
                    );


                if (!file) {

                    alert(
                        "Download file is not available."
                    );

                    return;

                }


                /* =============================================
                   PRO PRODUCT
                ============================================= */

                if (
                    file ===
                    PRO_PRODUCT_NAME
                ) {

                    openProVerification();

                    return;

                }


                /* =============================================
                   NORMAL FREE DOWNLOAD
                ============================================= */

                startNormalDownload(
                    this,
                    downloadFiles[file]
                );

            }
        );

    });
