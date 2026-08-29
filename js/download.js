/* =========================================================
   LINKTECH DOWNLOAD SYSTEM
   COMPUTER INVENTORY / SOFTWARE DOWNLOAD
   SYNCHRONIZED WITH GOOGLE APPS SCRIPT PURCHASE SYSTEM
========================================================= */


/* =========================================================
   GOOGLE APPS SCRIPT WEB APP URL
========================================================= */

/*
 * IMPORTANT:
 *
 * Replace this with your deployed Code.gs Web App /exec URL.
 *
 * Example:
 *
 * https://script.google.com/macros/s/XXXXXXXXXXXX/exec
 */

const API_URL =
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";


/* =========================================================
   PAYMENT PAGE
========================================================= */

/*
 * Paid applications are sent to the payment page.
 *
 * Do NOT put the Pro APK Google Drive URL here.
 */

const PAYMENT_PAGE =
    "https://computer-inventory-pro-payment.html";


/* =========================================================
   FREE DOWNLOAD FILES
========================================================= */

/*
 * ONLY FREE APPLICATIONS belong here.
 *
 * Paid APK URLs MUST NOT be placed here.
 */

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


    /*
     * IMPORTANT:
     *
     * Computer Inventory System pro
     * is intentionally NOT included here.
     *
     * It is a PAID application.
     *
     * The APK URL remains protected
     * inside Code.gs.
     */

    "Computer Inventory System":
        "https://drive.usercontent.google.com/download?id=1plWIfqdrBW5bzl99uI-H3q27XNhmF00h&export=download&authuser=0"

};


/* =========================================================
   PRODUCT TYPE CONFIGURATION
========================================================= */

/*
 * Free applications can download immediately.
 *
 * Paid applications redirect to PAYMENT_PAGE.
 *
 * This structure allows you to add more paid APK
 * applications later without exposing their APK URLs.
 */

const paidProducts = {

    "Computer Inventory System pro": {

        paymentPage:
            PAYMENT_PAGE,

        amount:
            150,

        currency:
            "PHP"

    }

};


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const searchInput =
    document.getElementById(
        "searchInput"
    );


const softwareList =
    document.getElementById(
        "softwareList"
    );


/* =========================================================
   CUSTOMER ACCOUNT ELEMENTS
========================================================= */

const accountArea =
    document.getElementById(
        "accountArea"
    );


const accountEmail =
    document.getElementById(
        "accountEmail"
    );


/* =========================================================
   GOOGLE ACCOUNT STORAGE KEY
========================================================= */

const GOOGLE_EMAIL_KEY =
    "linktech_google_email";


/* =========================================================
   PURCHASE STORAGE KEYS
========================================================= */

const PURCHASE_ID_KEY =
    "linktech_purchase_id";


const PURCHASE_EMAIL_KEY =
    "linktech_purchase_email";


/* =========================================================
   SEARCH SOFTWARE
========================================================= */

function searchSoftware() {

    const input =
        document
            .getElementById(
                "searchInput"
            );


    if (!input) {

        return;

    }


    const searchText =
        input.value
            .toLowerCase()
            .trim();


    const cards =
        document.querySelectorAll(
            ".software-grid .card"
        );


    cards.forEach(
        function(card) {

            const text =
                card.innerText
                    .toLowerCase();


            if (
                !searchText ||
                text.includes(
                    searchText
                )
            ) {

                card.style.display =
                    "";

            }

            else {

                card.style.display =
                    "none";

            }

        }
    );

}


/* =========================================================
   FREE DOWNLOAD
========================================================= */

function downloadFreeSoftware(
    fileKey,
    button
) {

    const url =
        downloadFiles[fileKey];


    if (!url) {

        showDownloadMessage(
            "Download file is not configured for this application.",
            "error"
        );

        console.error(
            "Missing download URL:",
            fileKey
        );

        restoreDownloadButton(
            button
        );

        return;

    }


    /*
     * Show loading state.
     */

    setDownloadLoading(
        button,
        "Preparing Download..."
    );


    /*
     * Give the browser a short moment
     * to display the loading state.
     */

    setTimeout(
        function() {

            try {

                /*
                 * Open the free download.
                 *
                 * The actual download behavior
                 * is controlled by the target server.
                 */

                window.location.href =
                    url;


            }

            catch (error) {

                console.error(
                    "Download error:",
                    error
                );


                showDownloadMessage(
                    "Unable to start the download. Please try again.",
                    "error"
                );


                restoreDownloadButton(
                    button
                );

            }

        },
        300
    );

}


/* =========================================================
   PAID APPLICATION
========================================================= */

function purchaseSoftware(
    fileKey,
    button
) {

    const product =
        paidProducts[fileKey];


    if (!product) {

        console.error(
            "Paid product configuration not found:",
            fileKey
        );


        showDownloadMessage(
            "Purchase information is not configured for this application.",
            "error"
        );


        restoreDownloadButton(
            button
        );


        return;

    }


    /*
     * Show loading.
     */

    setDownloadLoading(
        button,
        "Opening Purchase..."
    );


    /*
     * Save the selected product locally.
     *
     * This is useful when the customer
     * returns from the payment page.
     */

    try {

        localStorage.setItem(
            "linktech_selected_product",
            fileKey
        );

        localStorage.setItem(
            "linktech_selected_amount",
            String(
                product.amount
            )
        );

    }

    catch (error) {

        console.warn(
            "Unable to save selected product.",
            error
        );

    }


    /*
     * Open payment page.
     */

    setTimeout(
        function() {

            window.location.href =
                product.paymentPage;

        },
        250
    );

}


/* =========================================================
   DOWNLOAD BUTTON HANDLER
========================================================= */

function handleDownloadButton(
    button
) {

    if (!button) {

        return;

    }


    const fileKey =
        button.getAttribute(
            "data-file"
        );


    const type =
        (
            button.getAttribute(
                "data-type"
            ) ||
            ""
        )
        .toLowerCase()
        .trim();


    const isPro =
        button.getAttribute(
            "data-pro"
        ) === "true";


    if (!fileKey) {

        console.error(
            "Download button has no data-file attribute."
        );

        return;

    }


    /*
     * =====================================================
     * SECURITY CHECK
     * =====================================================
     *
     * Any button marked as PRO is always treated
     * as a paid product.
     *
     * It can NEVER use downloadFiles.
     */

    if (isPro) {

        purchaseSoftware(
            fileKey,
            button
        );

        return;

    }


    /*
     * =====================================================
     * PURCHASE TYPE
     * =====================================================
     */

    if (
        type === "purchase"
    ) {

        purchaseSoftware(
            fileKey,
            button
        );

        return;

    }


    /*
     * =====================================================
     * FREE TYPE
     * =====================================================
     */

    if (
        type === "free"
    ) {

        downloadFreeSoftware(
            fileKey,
            button
        );

        return;

    }


    /*
     * =====================================================
     * FALLBACK
     * =====================================================
     *
     * If data-type is missing, only allow
     * the download if the file exists in
     * downloadFiles.
     */

    if (
        Object.prototype.hasOwnProperty.call(
            downloadFiles,
            fileKey
        )
    ) {

        downloadFreeSoftware(
            fileKey,
            button
        );

        return;

    }


    /*
     * Unknown application.
     */

    showDownloadMessage(
        "This application is not configured for download.",
        "error"
    );


    console.error(
        "Unknown download type:",
        fileKey
    );

}


/* =========================================================
   INITIALIZE DOWNLOAD BUTTONS
========================================================= */

function initializeDownloadButtons() {

    const buttons =
        document.querySelectorAll(
            ".download-btn"
        );


    buttons.forEach(
        function(button) {

            /*
             * Remove inline handlers if any future
             * version accidentally contains one.
             */

            button.addEventListener(
                "click",
                function(event) {

                    event.preventDefault();

                    handleDownloadButton(
                        button
                    );

                }
            );

        }
    );

}


/* =========================================================
   BUTTON LOADING STATE
========================================================= */

function setDownloadLoading(
    button,
    text
) {

    if (!button) {

        return;

    }


    button.disabled =
        true;


    const textElement =
        button.querySelector(
            ".btn-text"
        );


    if (textElement) {

        textElement.innerText =
            text;

    }


    const loader =
        button.querySelector(
            ".loader"
        );


    if (loader) {

        loader.style.display =
            "inline-block";

    }

}


/* =========================================================
   RESTORE DOWNLOAD BUTTON
========================================================= */

function restoreDownloadButton(
    button
) {

    if (!button) {

        return;

    }


    button.disabled =
        false;


    const textElement =
        button.querySelector(
            ".btn-text"
        );


    if (textElement) {

        const type =
            (
                button.getAttribute(
                    "data-type"
                ) ||
                ""
            )
            .toLowerCase();


        if (
            type === "purchase" ||
            button.getAttribute(
                "data-pro"
            ) === "true"
        ) {

            textElement.innerText =
                "Purchase";

        }

        else {

            textElement.innerText =
                "Free Download";

        }

    }


    const loader =
        button.querySelector(
            ".loader"
        );


    if (loader) {

        loader.style.display =
            "none";

    }

}


/* =========================================================
   DOWNLOAD MESSAGE
========================================================= */

function showDownloadMessage(
    message,
    type
) {

    /*
     * Use existing status/message element
     * if one exists.
     */

    let box =
        document.getElementById(
            "downloadStatus"
        );


    /*
     * Create one only when necessary.
     */

    if (!box) {

        box =
            document.createElement(
                "div"
            );


        box.id =
            "downloadStatus";


        box.style.position =
            "fixed";

        box.style.left =
            "50%";

        box.style.bottom =
            "25px";

        box.style.transform =
            "translateX(-50%)";

        box.style.zIndex =
            "9999";

        box.style.maxWidth =
            "90%";

        box.style.padding =
            "14px 18px";

        box.style.borderRadius =
            "10px";

        box.style.fontFamily =
            "Poppins, Arial, sans-serif";

        box.style.fontSize =
            "14px";

        box.style.textAlign =
            "center";

        box.style.boxShadow =
            "0 8px 25px rgba(0,0,0,.18)";


        document.body.appendChild(
            box
        );

    }


    box.innerText =
        message;


    if (
        type === "error"
    ) {

        box.style.background =
            "#fff0f0";

        box.style.color =
            "#a30000";

        box.style.border =
            "1px solid #e4aaaa";

    }

    else {

        box.style.background =
            "#e9f9ef";

        box.style.color =
            "#146c2e";

        box.style.border =
            "1px solid #83d89d";

    }


    box.style.display =
        "block";


    setTimeout(
        function() {

            if (box) {

                box.style.display =
                    "none";

            }

        },
        5000
    );

}


/* =========================================================
   SAVE GOOGLE EMAIL
========================================================= */

function saveGoogleEmail(
    email
) {

    if (!email) {

        return;

    }


    const cleanEmail =
        String(email)
            .trim()
            .toLowerCase();


    if (!isValidEmail(cleanEmail)) {

        return;

    }


    try {

        localStorage.setItem(
            GOOGLE_EMAIL_KEY,
            cleanEmail
        );

        localStorage.setItem(
            PURCHASE_EMAIL_KEY,
            cleanEmail
        );

    }

    catch (error) {

        console.warn(
            "Unable to save Google account email.",
            error
        );

    }


    displayAccountEmail(
        cleanEmail
    );

}


/* =========================================================
   DISPLAY ACCOUNT EMAIL
========================================================= */

function displayAccountEmail(
    email
) {

    if (
        !accountArea ||
        !accountEmail
    ) {

        return;

    }


    if (!email) {

        accountArea.style.display =
            "none";

        accountEmail.innerText =
            "";

        return;

    }


    accountEmail.innerText =
        "Signed in: " + email;


    accountArea.style.display =
        "block";

}


/* =========================================================
   LOAD SAVED ACCOUNT
========================================================= */

function loadSavedAccount() {

    try {

        const savedEmail =
            localStorage.getItem(
                GOOGLE_EMAIL_KEY
            );


        if (
            savedEmail &&
            isValidEmail(savedEmail)
        ) {

            displayAccountEmail(
                savedEmail
            );

        }

    }

    catch (error) {

        console.warn(
            "Unable to load saved account.",
            error
        );

    }

}


/* =========================================================
   GOOGLE IDENTITY RESPONSE
========================================================= */

/*
 * This function can be used by Google Identity Services
 * if you later add a Google Sign-In button.
 *
 * It does NOT automatically trust the Google email
 * for payment authorization.
 *
 * Payment authorization remains controlled by Code.gs.
 */

function handleGoogleCredentialResponse(
    response
) {

    if (
        !response ||
        !response.credential
    ) {

        return;

    }


    /*
     * Decode the JWT payload.
     *
     * This is only for displaying the account email.
     *
     * Do NOT use this client-side decoded email
     * as proof of authentication.
     */

    try {

        const parts =
            response.credential.split(".");


        if (
            parts.length !== 3
        ) {

            return;

        }


        const payload =
            JSON.parse(
                atob(
                    parts[1]
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );


        const email =
            payload.email ||
            "";


        if (email) {

            saveGoogleEmail(
                email
            );

        }

    }

    catch (error) {

        console.warn(
            "Unable to read Google account information.",
            error
        );

    }

}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            String(email)
        );

}


/* =========================================================
   PURCHASE INFORMATION
========================================================= */

function getSavedPurchaseInformation() {

    let purchaseId =
        "";


    let email =
        "";


    try {

        purchaseId =
            localStorage.getItem(
                PURCHASE_ID_KEY
            ) ||
            "";


        email =
            localStorage.getItem(
                PURCHASE_EMAIL_KEY
            ) ||
            "";

    }

    catch (error) {

        console.warn(
            "Unable to read purchase information.",
            error
        );

    }


    return {

        purchaseId:
            purchaseId,

        email:
            email

    };

}


/* =========================================================
   CHECK PURCHASE STATUS
========================================================= */

/*
 * This function does NOT automatically download the APK.
 *
 * It only asks Code.gs for the current status.
 *
 * Code.gs remains responsible for determining whether
 * the purchase is PAID.
 */

async function checkPurchaseStatus(
    purchaseId,
    email
) {

    if (
        !purchaseId ||
        !email
    ) {

        return null;

    }


    if (
        API_URL ===
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
    ) {

        console.warn(
            "API_URL is not configured."
        );

        return null;

    }


    try {

        const url =
            API_URL +
            "?action=checkProPurchase" +
            "&purchaseId=" +
            encodeURIComponent(
                purchaseId
            ) +
            "&email=" +
            encodeURIComponent(
                email
            );


        const response =
            await fetch(
                url,
                {

                    method:
                        "GET",

                    cache:
                        "no-store"

                }
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        return data;

    }

    catch (error) {

        console.error(
            "Purchase status check failed:",
            error
        );


        return null;

    }

}


/* =========================================================
   CHECK SAVED PURCHASE
========================================================= */

/*
 * Used when the customer returns to the
 * download page after submitting payment.
 *
 * It DOES NOT expose the APK URL.
 */

async function checkSavedPurchase() {

    const purchase =
        getSavedPurchaseInformation();


    if (
        !purchase.purchaseId ||
        !purchase.email
    ) {

        return;

    }


    const result =
        await checkPurchaseStatus(
            purchase.purchaseId,
            purchase.email
        );


    if (!result) {

        return;

    }


    if (
        result.success &&
        result.data
    ) {

        const status =
            String(
                result.data.status ||
                ""
            )
            .toUpperCase();


        /*
         * Payment has been approved.
         *
         * The actual download must still be
         * requested through the protected
         * Code.gs endpoint.
         */

        if (
            status === "PAID"
        ) {

            showDownloadMessage(

                "Payment approved. Your Pro application is ready to download.",

                "success"

            );

        }

        else if (
            status === "PENDING"
        ) {

            showDownloadMessage(

                "Your payment is still pending verification.",

                "success"

            );

        }

        else if (
            status === "REJECTED"
        ) {

            showDownloadMessage(

                "Your payment was not approved. Please contact LinkTech.",

                "error"

            );

        }

    }

}


/* =========================================================
   START
========================================================= */

function initializeDownloadPage() {

    /*
     * Load remembered Google email.
     */

    loadSavedAccount();


    /*
     * Initialize buttons.
     */

    initializeDownloadButtons();


    /*
     * Check previous purchase status.
     */

    checkSavedPurchase();

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeDownloadPage();

    }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

/*
 * Keep searchSoftware globally available because
 * your HTML currently uses:
 *
 * onkeyup="searchSoftware()"
 *
 * and:
 *
 * onclick="searchSoftware()"
 */

window.searchSoftware =
    searchSoftware;


/*
 * Make Google credential callback globally available
 * if Google Identity Services uses it.
 */

window.handleGoogleCredentialResponse =
    handleGoogleCredentialResponse;
