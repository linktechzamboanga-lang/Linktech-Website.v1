const API_URL =
"https://script.google.com/macros/s/AKfycbz0h8I56PglGhib3u9X6EjL84hEtPdpk33fuM3mFIJ3NtVAA6kj0iW-omKiv3k465iP/exec";

/* =========================================================
ADMIN CONFIGURATION
========================================================= */

const ADMIN_EMAIL =
"linktechzamboanga@gmail.com";

/* =========================================================
STORAGE
========================================================= */

const ADMIN_EMAIL_STORAGE =
"linktech_purchase_admin_email";

const ADMIN_LOGIN_STORAGE =
"linktech_purchase_admin_logged_in";

/* =========================================================
STATUS VALUES
========================================================= */

const STATUS_PENDING =
"PENDING";

const STATUS_PAID =
"PAID";

const STATUS_REJECTED =
"REJECTED";

/* =========================================================
ELEMENTS
========================================================= */

let loginSection;

let adminSection;

let adminLoginForm;

let adminEmailInput;

let loginStatus;

let adminStatus;

let loggedAdminEmail;

let refreshButton;

let logoutButton;

let purchaseList;

let pendingCount;

let displayedCount;

let lastUpdated;

/* =========================================================
INITIALIZATION
========================================================= */

document.addEventListener(
"DOMContentLoaded",
function () {

    initializeElements();

    initializeAdmin();

}

);

/* =========================================================
INITIALIZE ELEMENTS
========================================================= */

function initializeElements() {

loginSection =
    document.getElementById(
        "loginSection"
    );


adminSection =
    document.getElementById(
        "adminSection"
    );


adminLoginForm =
    document.getElementById(
        "adminLoginForm"
    );


adminEmailInput =
    document.getElementById(
        "adminEmail"
    );


loginStatus =
    document.getElementById(
        "loginStatus"
    );


adminStatus =
    document.getElementById(
        "adminStatus"
    );


loggedAdminEmail =
    document.getElementById(
        "loggedAdminEmail"
    );


refreshButton =
    document.getElementById(
        "refreshButton"
    );


logoutButton =
    document.getElementById(
        "logoutButton"
    );


purchaseList =
    document.getElementById(
        "purchaseList"
    );


pendingCount =
    document.getElementById(
        "pendingCount"
    );


displayedCount =
    document.getElementById(
        "displayedCount"
    );


lastUpdated =
    document.getElementById(
        "lastUpdated"
    );

}

/* =========================================================
INITIALIZE ADMIN
========================================================= */

function initializeAdmin() {

/*
 * Check API URL.
 */

if (
    API_URL ===
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
) {

    console.warn(
        "API_URL has not been configured."
    );

}


/*
 * Check local administrator session.
 */

try {

    const savedLoggedIn =
        localStorage.getItem(
            ADMIN_LOGIN_STORAGE
        );


    const savedEmail =
        localStorage.getItem(
            ADMIN_EMAIL_STORAGE
        );


    if (
        savedLoggedIn === "true" &&
        savedEmail
    ) {

        if (
            savedEmail
                .toLowerCase() ===
            ADMIN_EMAIL
                .toLowerCase()
        ) {

            showAdminDashboard(
                savedEmail
            );


            loadPendingPurchases();

            return;

        }


        clearAdminSession();

    }

}

catch (error) {

    console.warn(
        "Unable to read administrator session.",
        error
    );

}


showLogin();

}

/* =========================================================
LOGIN
========================================================= */

if (adminLoginForm) {

adminLoginForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const email =
            adminEmailInput
                ? adminEmailInput.value
                    .trim()
                    .toLowerCase()
                : "";


        if (!email) {

            showLoginStatus(
                "Please enter the administrator email.",
                "error"
            );

            return;

        }


        if (
            !isValidEmail(email)
        ) {

            showLoginStatus(
                "Please enter a valid email address.",
                "error"
            );

            return;

        }


        /*
         * First client-side administrator check.
         */

        if (
            email !==
            ADMIN_EMAIL.toLowerCase()
        ) {

            showLoginStatus(
                "Unauthorized administrator email.",
                "error"
            );

            return;

        }


        /*
         * Save local session.
         */

        try {

            localStorage.setItem(
                ADMIN_EMAIL_STORAGE,
                email
            );


            localStorage.setItem(
                ADMIN_LOGIN_STORAGE,
                "true"
            );

        }

        catch (error) {

            console.warn(
                "Unable to save administrator session.",
                error
            );

        }


        showLoginStatus(
            "Administrator verified. Loading purchases...",
            "success"
        );


        showAdminDashboard(
            email
        );


        loadPendingPurchases();

    }
);

}

/* =========================================================
SHOW LOGIN
========================================================= */

function showLogin() {

if (loginSection) {

    loginSection.style.display =
        "block";

}


if (adminSection) {

    adminSection.style.display =
        "none";

}

}

/* =========================================================
SHOW ADMIN DASHBOARD
========================================================= */

function showAdminDashboard(
email
) {

if (loginSection) {

    loginSection.style.display =
        "none";

}


if (adminSection) {

    adminSection.style.display =
        "block";

}


if (loggedAdminEmail) {

    loggedAdminEmail.textContent =
        email;

}

}

/* =========================================================
LOGOUT
========================================================= */

if (logoutButton) {

logoutButton.addEventListener(
    "click",
    function () {

        clearAdminSession();

        showLogin();


        if (adminEmailInput) {

            adminEmailInput.value =
                "";

        }


        showLoginStatus(
            "You have been logged out.",
            "success"
        );

    }
);

}

/* =========================================================
CLEAR ADMIN SESSION
========================================================= */

function clearAdminSession() {

try {

    localStorage.removeItem(
        ADMIN_EMAIL_STORAGE
    );


    localStorage.removeItem(
        ADMIN_LOGIN_STORAGE
    );

}

catch (error) {

    console.warn(
        "Unable to clear administrator session.",
        error
    );

}

}

/* =========================================================
REFRESH
========================================================= */

if (refreshButton) {

refreshButton.addEventListener(
    "click",
    function () {

        loadPendingPurchases();

    }
);

}

/* =========================================================
LOAD PENDING PURCHASES
========================================================= */

async function loadPendingPurchases() {

const adminEmail =
    getLoggedAdminEmail();


if (!adminEmail) {

    showLogin();

    showLoginStatus(
        "Please sign in as administrator.",
        "error"
    );

    return;

}


if (
    API_URL ===
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
) {

    showAdminStatus(
        "Google Apps Script API URL is not configured.",
        "error"
    );

    return;

}


setRefreshLoading(
    true
);


showAdminStatus(
    "Loading pending purchases...",
    "success"
);


try {


    /*
     * Code.gs:
     *
     * case "getPendingPurchases":
     *     return getPendingPurchases(e);
     */

    const url =
        API_URL +
        "?action=getPendingPurchases" +
        "&adminEmail=" +
        encodeURIComponent(
            adminEmail
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
            "Server returned HTTP " +
            response.status
        );

    }


    const data =
        await response.json();


    console.log(
        "Pending purchases:",
        data
    );


    if (
        data.success === true
    ) {

        const purchases =
            Array.isArray(
                data.data
            )
                ? data.data
                : [];


        renderPurchases(
            purchases
        );


        updateStatistics(
            purchases
        );


        updateLastUpdated();


        if (
            purchases.length === 0
        ) {

            showAdminStatus(
                "No pending purchases found.",
                "success"
            );

        }

        else {

            showAdminStatus(

                purchases.length +
                " pending purchase" +
                (
                    purchases.length === 1
                        ? ""
                        : "s"
                ) +
                " found.",

                "success"

            );

        }


        return;

    }


    showAdminStatus(
        data.message ||
        "Unable to load purchases.",
        "error"
    );

}

catch (error) {

    console.error(
        "Load purchases error:",
        error
    );


    showAdminStatus(

        "Unable to connect to Google Apps Script. " +
        "Please check the Web App URL and deployment.",

        "error"

    );

}

finally {

    setRefreshLoading(
        false
    );

}

}

/* =========================================================
RENDER PURCHASES
========================================================= */

function renderPurchases(
purchases
) {

if (!purchaseList) {

    return;

}


if (
    !Array.isArray(purchases) ||
    purchases.length === 0
) {

    purchaseList.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ✓
            </div>

            <h3>
                No Pending Purchases
            </h3>

            <p>
                There are currently no pending
                customer payments.
            </p>

        </div>

    `;

    return;

}


purchaseList.innerHTML =
    "";


purchases.forEach(
    function (purchase) {

        const card =
            createPurchaseCard(
                purchase
            );


        purchaseList.appendChild(
            card
        );

    }
);

}

/* =========================================================
CREATE PURCHASE CARD
========================================================= */

function createPurchaseCard(
purchase
) {

const card =
    document.createElement(
        "article"
    );


card.className =
    "purchase-card";


const purchaseId =
    clean(
        purchase.purchaseId
    );


const date =
    formatDate(
        purchase.date
    );


const name =
    clean(
        purchase.name
    );


const email =
    clean(
        purchase.email
    );


const product =
    clean(
        purchase.product
    );


const amount =
    formatAmount(
        purchase.amount,
        purchase.currency
    );


const reference =
    clean(
        purchase.gcashReference
    );


const status =
    clean(
        purchase.status
    )
    .toUpperCase();


card.innerHTML = `

    <div class="purchase-card-header">

        <div>

            <span class="purchase-label">
                Purchase ID
            </span>

            <strong class="purchase-id">
                ${escapeHtml(purchaseId)}
            </strong>

        </div>


        <span class="
            status-badge
            ${getStatusClass(status)}
        ">

            ${escapeHtml(
                status ||
                STATUS_PENDING
            )}

        </span>

    </div>



    <div class="purchase-details">


        <div class="detail-row">

            <span class="detail-label">
                Date
            </span>

            <span class="detail-value">
                ${escapeHtml(date)}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Customer
            </span>

            <span class="detail-value">
                ${escapeHtml(name)}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Email
            </span>

            <span class="detail-value">
                ${escapeHtml(email)}
            </span>

        </div>


        <div class="detail-row">

            <span class="detail-label">
                Product
            </span>

            <span class="detail-value">
                ${escapeHtml(product)}
            </span>

        </div>


        <div class="detail-row amount-row">

            <span class="detail-label">
                Amount
            </span>

            <strong class="detail-value">
                ${escapeHtml(amount)}
            </strong>

        </div>


        <div class="detail-row reference-row">

            <span class="detail-label">
                GCash Reference
            </span>

            <strong class="reference-number">
                ${escapeHtml(reference)}
            </strong>

        </div>


    </div>



    <div class="verification-box">

        <strong>
            ⚠ Verify GCash payment
        </strong>

        <p>

            Check your actual GCash account
            and confirm that the payment was
            really received before approving.

        </p>

    </div>



    <div class="purchase-actions">

        <button
            type="button"
            class="approve-btn">

            ✓ Approve Payment

        </button>


        <button
            type="button"
            class="reject-btn">

            ✕ Reject

        </button>

    </div>

`;


/*
 * APPROVE
 */

const approveButton =
    card.querySelector(
        ".approve-btn"
    );


if (approveButton) {

    approveButton.addEventListener(
        "click",
        function () {

            approvePurchase(
                purchaseId,
                approveButton,
                card
            );

        }
    );

}


/*
 * REJECT
 */

const rejectButton =
    card.querySelector(
        ".reject-btn"
    );


if (rejectButton) {

    rejectButton.addEventListener(
        "click",
        function () {

            rejectPurchase(
                purchaseId,
                rejectButton,
                card
            );

        }
    );

}


return card;

}

/* =========================================================
APPROVE PURCHASE
========================================================= */

async function approvePurchase(
purchaseId,
button,
card
) {

if (!purchaseId) {

    showAdminStatus(
        "Purchase ID is missing.",
        "error"
    );

    return;

}


const confirmed =
    window.confirm(

        "Confirm payment approval?\n\n" +

        "Purchase ID:\n" +
        purchaseId +

        "\n\n" +

        "Only approve this purchase if you " +
        "have confirmed that the payment was " +
        "actually received in your GCash account."

    );


if (!confirmed) {

    return;

}


const adminEmail =
    getLoggedAdminEmail();


if (!adminEmail) {

    showLogin();

    return;

}


if (
    API_URL ===
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
) {

    showAdminStatus(
        "Google Apps Script API URL is not configured.",
        "error"
    );

    return;

}


setCardButtonsDisabled(
    card,
    true
);


if (button) {

    button.innerText =
        "Approving...";

}


showAdminStatus(
    "Approving purchase...",
    "success"
);


try {


    /*
     * Code.gs:
     *
     * case "approveProPurchase":
     *     return approveProPurchase(e);
     */

    const url =
        API_URL +
        "?action=approveProPurchase" +
        "&purchaseId=" +
        encodeURIComponent(
            purchaseId
        ) +
        "&adminEmail=" +
        encodeURIComponent(
            adminEmail
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
            "Server returned HTTP " +
            response.status
        );

    }


    const data =
        await response.json();


    console.log(
        "Approve response:",
        data
    );


    if (
        data.success === true
    ) {

        showAdminStatus(

            "Purchase approved successfully. " +
            "The customer approval email has been processed.",

            "success"

        );


        if (card) {

            card.remove();

        }


        refreshStatisticsAfterRemoval();

        showEmptyIfNecessary();


        return;

    }


    showAdminStatus(
        data.message ||
        "Unable to approve purchase.",
        "error"
    );


    setCardButtonsDisabled(
        card,
        false
    );


    if (button) {

        button.innerText =
            "✓ Approve Payment";

    }

}

catch (error) {

    console.error(
        "Approve purchase error:",
        error
    );


    showAdminStatus(

        "Unable to approve the purchase. " +
        "Please check your connection and try again.",

        "error"

    );


    setCardButtonsDisabled(
        card,
        false
    );


    if (button) {

        button.innerText =
            "✓ Approve Payment";

    }

}

}

/* =========================================================
REJECT PURCHASE
========================================================= */

async function rejectPurchase(
purchaseId,
button,
card
) {

if (!purchaseId) {

    showAdminStatus(
        "Purchase ID is missing.",
        "error"
    );

    return;

}


const confirmed =
    window.confirm(

        "Reject this purchase?\n\n" +

        "Purchase ID:\n" +
        purchaseId +

        "\n\n" +

        "The customer will NOT receive " +
        "Pro download authorization."

    );


if (!confirmed) {

    return;

}


const adminEmail =
    getLoggedAdminEmail();


if (!adminEmail) {

    showLogin();

    return;

}


if (
    API_URL ===
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
) {

    showAdminStatus(
        "Google Apps Script API URL is not configured.",
        "error"
    );

    return;

}


setCardButtonsDisabled(
    card,
    true
);


if (button) {

    button.innerText =
        "Rejecting...";

}


showAdminStatus(
    "Rejecting purchase...",
    "success"
);


try {


    /*
     * Code.gs:
     *
     * case "rejectProPurchase":
     *     return rejectProPurchase(e);
     */

    const url =
        API_URL +
        "?action=rejectProPurchase" +
        "&purchaseId=" +
        encodeURIComponent(
            purchaseId
        ) +
        "&adminEmail=" +
        encodeURIComponent(
            adminEmail
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
            "Server returned HTTP " +
            response.status
        );

    }


    const data =
        await response.json();


    console.log(
        "Reject response:",
        data
    );


    if (
        data.success === true
    ) {

        showAdminStatus(
            "Purchase rejected successfully.",
            "success"
        );


        if (card) {

            card.remove();

        }


        refreshStatisticsAfterRemoval();

        showEmptyIfNecessary();


        return;

    }


    showAdminStatus(
        data.message ||
        "Unable to reject purchase.",
        "error"
    );


    setCardButtonsDisabled(
        card,
        false
    );


    if (button) {

        button.innerText =
            "✕ Reject";

    }

}

catch (error) {

    console.error(
        "Reject purchase error:",
        error
    );


    showAdminStatus(

        "Unable to reject the purchase. " +
        "Please check your connection and try again.",

        "error"

    );


    setCardButtonsDisabled(
        card,
        false
    );


    if (button) {

        button.innerText =
            "✕ Reject";

    }

}

}

/* =========================================================
GET LOGGED ADMIN EMAIL
========================================================= */

function getLoggedAdminEmail() {

try {

    const email =
        localStorage.getItem(
            ADMIN_EMAIL_STORAGE
        );


    if (
        email &&
        email.toLowerCase() ===
        ADMIN_EMAIL.toLowerCase()
    ) {

        return email
            .trim()
            .toLowerCase();

    }

}

catch (error) {

    console.warn(
        "Unable to read admin email.",
        error
    );

}


return "";

}

/* =========================================================
UPDATE STATISTICS
========================================================= */

function updateStatistics(
purchases
) {

const count =
    Array.isArray(purchases)
        ? purchases.length
        : 0;


if (pendingCount) {

    pendingCount.textContent =
        count;

}


if (displayedCount) {

    displayedCount.textContent =
        count;

}

}

/* =========================================================
STATISTICS AFTER REMOVAL
========================================================= */

function refreshStatisticsAfterRemoval() {

const cards =
    purchaseList
        ? purchaseList.querySelectorAll(
            ".purchase-card"
        )
        : [];


const count =
    cards.length;


if (pendingCount) {

    pendingCount.textContent =
        count;

}


if (displayedCount) {

    displayedCount.textContent =
        count;

}

}

/* =========================================================
EMPTY STATE
========================================================= */

function showEmptyIfNecessary() {

if (!purchaseList) {

    return;

}


const cards =
    purchaseList.querySelectorAll(
        ".purchase-card"
    );


if (
    cards.length === 0
) {

    purchaseList.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ✓
            </div>

            <h3>
                No Pending Purchases
            </h3>

            <p>
                All pending purchases have
                been processed.
            </p>

        </div>

    `;

}

}

/* =========================================================
DISABLE / ENABLE CARD BUTTONS
========================================================= */

function setCardButtonsDisabled(
card,
disabled
) {

if (!card) {

    return;

}


card
    .querySelectorAll(
        "button"
    )
    .forEach(
        function (button) {

            button.disabled =
                disabled;

        }
    );

}

/* =========================================================
REFRESH LOADING
========================================================= */

function setRefreshLoading(
loading
) {

if (!refreshButton) {

    return;

}


if (loading) {

    refreshButton.disabled =
        true;

    refreshButton.innerText =
        "⏳ Loading...";

}

else {

    refreshButton.disabled =
        false;

    refreshButton.innerText =
        "🔄 Refresh Purchases";

}

}

/* =========================================================
LAST UPDATED
========================================================= */

function updateLastUpdated() {

if (!lastUpdated) {

    return;

}


const now =
    new Date();


lastUpdated.textContent =
    "Last updated: " +
    now.toLocaleString();

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


adminStatus.textContent =
    message;


adminStatus.className =
    "status " +
    type;

}

/* =========================================================
LOGIN STATUS
========================================================= */

function showLoginStatus(
message,
type
) {

if (!loginStatus) {

    return;

}


loginStatus.textContent =
    message;


loginStatus.className =
    "status " +
    type;

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
CLEAN
========================================================= */

function clean(
value
) {

if (
    value === null ||
    value === undefined
) {

    return "";

}


return String(
    value
)
.trim();

}

/* =========================================================
FORMAT AMOUNT
========================================================= */

function formatAmount(
amount,
currency
) {

const numericAmount =
    Number(amount);


if (
    !Number.isNaN(
        numericAmount
    )
) {

    if (
        String(currency)
            .toUpperCase() ===
        "PHP"
    ) {

        return (
            "₱" +
            numericAmount.toFixed(2)
        );

    }


    return (

        String(
            currency || ""
        ) +
        " " +
        numericAmount.toFixed(2)

    );

}


return clean(
    amount
);

}

/* =========================================================
FORMAT DATE
========================================================= */

function formatDate(
value
) {

if (!value) {

    return "";

}


const date =
    new Date(
        value
    );


if (
    !Number.isNaN(
        date.getTime()
    )
) {

    return date.toLocaleString();

}


return String(
    value
);

}

/* =========================================================
STATUS CLASS
========================================================= */

function getStatusClass(
status
) {

switch (
    String(status)
        .toUpperCase()
) {

    case STATUS_PAID:

        return "paid";


    case STATUS_REJECTED:

        return "rejected";


    case STATUS_PENDING:

    default:

        return "pending";

}

}

/* =========================================================
SAFE HTML ESCAPE
========================================================= */

function escapeHtml(
value
) {

return String(
    value || ""
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
