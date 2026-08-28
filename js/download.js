const API_URL =
    "https://script.google.com/macros/s/AKfycbz0h8I56PglGhib3u9X6EjL84hEtPdpk33fuM3mFIJ3NtVAA6kj0iW-omKiv3k465iP/exec";


/* =========================================================
   FREE DOWNLOAD FILES
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


    "Computer Inventory System":
        "https://drive.usercontent.google.com/download?id=1plWIfqdrBW5bzl99uI-H3q27XNhmF00h&export=download&authuser=0"

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const purchaseIdInput =
    document.getElementById(
        "purchaseIdInput"
    );


const purchaseEmailInput =
    document.getElementById(
        "purchaseEmailInput"
    );


const checkPurchaseButton =
    document.getElementById(
        "checkPurchaseButton"
    );


const purchaseStatus =
    document.getElementById(
        "purchaseStatus"
    );


const downloadArea =
    document.getElementById(
        "downloadArea"
    );


const proDownloadButton =
    document.getElementById(
        "proDownloadButton"
    );


const approvedProduct =
    document.getElementById(
        "approvedProduct"
    );


const customerAccount =
    document.getElementById(
        "customerAccount"
    );


const customerEmailDisplay =
    document.getElementById(
        "customerEmailDisplay"
    );


const adminEmailInput =
    document.getElementById(
        "adminEmail"
    );


const loadPendingButton =
    document.getElementById(
        "loadPendingButton"
    );


const adminStatus =
    document.getElementById(
        "adminStatus"
    );


const pendingPurchases =
    document.getElementById(
        "pendingPurchases"
    );


/* =========================================================
   DOWNLOAD FREE SOFTWARE
========================================================= */

function downloadSoftware(
    softwareName
) {

    const url =
        downloadFiles[
            softwareName
        ];


    if (!url) {

        alert(
            "Download link is not available."
        );

        return;

    }


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   API URL CHECK
========================================================= */

function apiConfigured() {

    return (

        API_URL &&

        API_URL !==
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"

    );

}


/* =========================================================
   STATUS
========================================================= */

function showPurchaseStatus(
    message,
    type
) {

    if (!purchaseStatus) {

        return;

    }


    purchaseStatus.innerHTML =
        escapeHtml(
            message
        );


    purchaseStatus.className =
        "status " +
        type;

}


/* =========================================================
   ADMIN STATUS
========================================================= */

function showAdminStatus(
    message,
    type
) {

    if (!adminStatus) {

        return;

    }


    adminStatus.innerHTML =
        escapeHtml(
            message
        );


    adminStatus.className =
        "status " +
        type;

}


/* =========================================================
   CHECK PURCHASE
========================================================= */

if (checkPurchaseButton) {

    checkPurchaseButton.addEventListener(
        "click",
        checkPurchase
    );

}


async function checkPurchase() {

    const purchaseId =
        purchaseIdInput
            .value
            .trim();


    const email =
        purchaseEmailInput
            .value
            .trim()
            .toLowerCase();


    if (!purchaseId) {

        showPurchaseStatus(
            "Please enter your Purchase ID.",
            "error"
        );

        return;

    }


    if (!isValidEmail(email)) {

        showPurchaseStatus(
            "Please enter a valid purchase email.",
            "error"
        );

        return;

    }


    if (!apiConfigured()) {

        showPurchaseStatus(
            "The payment API is not configured.",
            "error"
        );

        return;

    }


    checkPurchaseButton.disabled =
        true;


    checkPurchaseButton.innerText =
        "Checking...";


    downloadArea.style.display =
        "none";


    showPurchaseStatus(
        "Checking your payment...",
        "success"
    );


    try {

        const params =
            new URLSearchParams();


        params.append(
            "action",
            "checkProPurchase"
        );


        params.append(
            "purchaseId",
            purchaseId
        );


        params.append(
            "email",
            email
        );


        const response =
            await fetch(
                API_URL +
                "?" +
                params.toString()
            );


        if (!response.ok) {

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        const data =
            await response.json();


        console.log(
            "Purchase status:",
            data
        );


        if (
            data.success !== true
        ) {

            showPurchaseStatus(
                data.message ||
                "Purchase not found.",
                "error"
            );

            return;

        }


        const purchase =
            data.data;


        if (!purchase) {

            showPurchaseStatus(
                "Invalid purchase response.",
                "error"
            );

            return;

        }


        savePurchase(
            purchase
        );


        updateCustomerEmail(
            purchase.email
        );


        const status =
            String(
                purchase.status ||
                "PENDING"
            )
            .toUpperCase();


        if (
            status ===
            "PAID"
        ) {

            showPurchaseStatus(
                "✓ Payment confirmed. Your Pro APK is ready.",
                "success"
            );


            approvedProduct.textContent =
                purchase.product;


            proDownloadButton.href =
                API_URL +
                "?action=downloadPro" +
                "&purchaseId=" +
                encodeURIComponent(
                    purchase.purchaseId
                ) +
                "&email=" +
                encodeURIComponent(
                    purchase.email
                );


            downloadArea.style.display =
                "block";


        }

        else if (
            status ===
            "REJECTED"
        ) {

            showPurchaseStatus(
                "Your payment was rejected. Please contact LinkTech if you believe this is an error.",
                "error"
            );

        }

        else {

            showPurchaseStatus(
                "Payment is still PENDING. Please wait until LinkTech verifies your GCash payment.",
                "success"
            );

        }

    }

    catch (error) {

        console.error(
            "Purchase check error:",
            error
        );


        showPurchaseStatus(
            "Unable to connect to the payment server. Please try again.",
            "error"
        );

    }

    finally {

        checkPurchaseButton.disabled =
            false;

        checkPurchaseButton.innerText =
            "Check Payment Status";

    }

}


/* =========================================================
   SAVE PURCHASE
========================================================= */

function savePurchase(
    purchase
) {

    try {

        if (
            purchase.purchaseId
        ) {

            localStorage.setItem(
                "linktech_purchase_id",
                purchase.purchaseId
            );

        }


        if (
            purchase.email
        ) {

            localStorage.setItem(
                "linktech_purchase_email",
                purchase.email
            );

        }

    }

    catch (error) {

        console.warn(
            "Unable to save purchase.",
            error
        );

    }

}


/* =========================================================
   LOAD SAVED PURCHASE
========================================================= */

function loadSavedPurchase() {

    try {

        const savedId =
            localStorage.getItem(
                "linktech_purchase_id"
            );


        const savedEmail =
            localStorage.getItem(
                "linktech_purchase_email"
            );


        if (
            savedId &&
            purchaseIdInput
        ) {

            purchaseIdInput.value =
                savedId;

        }


        if (
            savedEmail &&
            purchaseEmailInput
        ) {

            purchaseEmailInput.value =
                savedEmail;

            updateCustomerEmail(
                savedEmail
            );

        }

    }

    catch (error) {

        console.warn(
            "Unable to load saved purchase.",
            error
        );

    }

}


/* =========================================================
   DISPLAY CUSTOMER EMAIL
========================================================= */

function updateCustomerEmail(
    email
) {

    if (
        !email ||
        !customerEmailDisplay ||
        !customerAccount
    ) {

        return;

    }


    customerEmailDisplay.textContent =
        email;


    customerAccount.style.display =
        "block";

}


/* =========================================================
   LOAD PENDING PURCHASES
========================================================= */

if (loadPendingButton) {

    loadPendingButton.addEventListener(
        "click",
        loadPending
    );

}


async function loadPending() {

    const email =
        adminEmailInput
            .value
            .trim()
            .toLowerCase();


    if (!isValidEmail(email)) {

        showAdminStatus(
            "Enter the administrator email.",
            "error"
        );

        return;

    }


    if (!apiConfigured()) {

        showAdminStatus(
            "The payment API is not configured.",
            "error"
        );

        return;

    }


    loadPendingButton.disabled =
        true;


    loadPendingButton.innerText =
        "Loading...";


    showAdminStatus(
        "Loading pending purchases...",
        "success"
    );


    try {

        const params =
            new URLSearchParams();


        params.append(
            "action",
            "getPendingPurchases"
        );


        params.append(
            "adminEmail",
            email
        );


        const response =
            await fetch(
                API_URL +
                "?" +
                params.toString()
            );


        const data =
            await response.json();


        if (
            data.success !== true
        ) {

            showAdminStatus(
                data.message ||
                "Unable to load purchases.",
                "error"
            );

            return;

        }


        renderPendingPurchases(
            data.data || [],
            email
        );


        showAdminStatus(
            "Pending purchases loaded.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );


        showAdminStatus(
            "Unable to connect to the payment server.",
            "error"
        );

    }

    finally {

        loadPendingButton.disabled =
            false;

        loadPendingButton.innerText =
            "Load Pending Purchases";

    }

}


/* =========================================================
   DISPLAY PENDING PURCHASES
========================================================= */

function renderPendingPurchases(
    purchases,
    adminEmail
) {

    if (!pendingPurchases) {

        return;

    }


    pendingPurchases.innerHTML =
        "";


    if (
        !purchases.length
    ) {

        pendingPurchases.innerHTML = `

            <div class="empty-purchases">

                No pending purchases.

            </div>

        `;

        return;

    }


    purchases.forEach(
        function(purchase) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "pending-card";


            card.innerHTML = `

                <h3>
                    ${escapeHtml(
                        purchase.product
                    )}
                </h3>


                <p>

                    <strong>
                        Purchase ID:
                    </strong>

                    ${escapeHtml(
                        purchase.purchaseId
                    )}

                </p>


                <p>

                    <strong>
                        Customer:
                    </strong>

                    ${escapeHtml(
                        purchase.name
                    )}

                </p>


                <p>

                    <strong>
                        Email:
                    </strong>

                    ${escapeHtml(
                        purchase.email
                    )}

                </p>


                <p>

                    <strong>
                        Amount:
                    </strong>

                    ₱${escapeHtml(
                        purchase.amount
                    )}

                </p>


                <p>

                    <strong>
                        GCash Reference:
                    </strong>

                    <span class="reference">
                        ${escapeHtml(
                            purchase.gcashReference
                        )}
                    </span>

                </p>


                <p>

                    <strong>
                        Status:
                    </strong>

                    <span class="pending-label">
                        PENDING
                    </span>

                </p>


                <div class="admin-actions">

                    <button
                        class="approve-btn"
                        data-id="${escapeHtml(
                            purchase.purchaseId
                        )}">

                        ✓ Confirm Payment

                    </button>


                    <button
                        class="reject-btn"
                        data-id="${escapeHtml(
                            purchase.purchaseId
                        )}">

                        ✕ Reject

                    </button>

                </div>

            `;


            pendingPurchases.appendChild(
                card
            );

        }
    );


    pendingPurchases
        .querySelectorAll(
            ".approve-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        approvePurchase(
                            this.dataset.id,
                            adminEmail
                        );

                    }
                );

            }
        );


    pendingPurchases
        .querySelectorAll(
            ".reject-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    function() {

                        rejectPurchase(
                            this.dataset.id,
                            adminEmail
                        );

                    }
                );

            }
        );

}


/* =========================================================
   APPROVE PURCHASE
========================================================= */

async function approvePurchase(
    purchaseId,
    adminEmail
) {

    if (
        !confirm(
            "Have you verified that this GCash payment was actually received?"
        )
    ) {

        return;

    }


    try {

        const params =
            new URLSearchParams();


        params.append(
            "action",
            "approveProPurchase"
        );


        params.append(
            "purchaseId",
            purchaseId
        );


        params.append(
            "adminEmail",
            adminEmail
        );


        showAdminStatus(
            "Confirming payment...",
            "success"
        );


        const response =
            await fetch(
                API_URL +
                "?" +
                params.toString()
            );


        const data =
            await response.json();


        if (
            data.success !== true
        ) {

            showAdminStatus(
                data.message ||
                "Unable to approve payment.",
                "error"
            );

            return;

        }


        showAdminStatus(
            "✓ Payment approved. Customer can now download the Pro APK.",
            "success"
        );


        loadPending();

    }

    catch (error) {

        console.error(
            error
        );


        showAdminStatus(
            "Unable to approve payment.",
            "error"
        );

    }

}


/* =========================================================
   REJECT PURCHASE
========================================================= */

async function rejectPurchase(
    purchaseId,
    adminEmail
) {

    if (
        !confirm(
            "Are you sure you want to reject this purchase?"
        )
    ) {

        return;

    }


    try {

        const params =
            new URLSearchParams();


        params.append(
            "action",
            "rejectProPurchase"
        );


        params.append(
            "purchaseId",
            purchaseId
        );


        params.append(
            "adminEmail",
            adminEmail
        );


        showAdminStatus(
            "Rejecting purchase...",
            "success"
        );


        const response =
            await fetch(
                API_URL +
                "?" +
                params.toString()
            );


        const data =
            await response.json();


        if (
            data.success !== true
        ) {

            showAdminStatus(
                data.message ||
                "Unable to reject purchase.",
                "error"
            );

            return;

        }


        showAdminStatus(
            "Purchase rejected.",
            "success"
        );


        loadPending();

    }

    catch (error) {

        console.error(
            error
        );


        showAdminStatus(
            "Unable to reject purchase.",
            "error"
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
        .test(email);

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadSavedPurchase();

    }
);
