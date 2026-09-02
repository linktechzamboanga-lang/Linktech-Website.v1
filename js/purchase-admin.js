const PURCHASE_API_URL =
    "https://script.google.com/macros/s/AKfycbz0h8I56PglGhib3u9X6EjL84hEtPdpk33fuM3mFIJ3NtVAA6kj0iW-omKiv3k465iP/exec";

const ADMIN_EMAIL =
    "linktechzamboanga@gmail.com";


const DOWNLOAD_PAGE =
    "download.html";


const SESSION_KEY =
    "linktech_purchase_admin_session";


const state = {

    loggedIn: false,

    adminEmail: "",

    pendingPurchases: [],

    selectedPurchase: null,

    verificationPurchase: null,

    loading: false

};


/*
 * Confirmation callback.
 */

let confirmCallback = null;


/*
 * Toast timer.
 */

let toastTimer = null;


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {

    return document.getElementById(id);

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


function initialize() {

    bindEvents();

    restoreSession();

}


/* =========================================================
   EVENT BINDING
========================================================= */

function bindEvents() {


    /* ================================================
       LOGIN
    ================================================= */

    $("loginForm")
        .addEventListener(
            "submit",
            handleLogin
        );


    $("togglePassword")
        .addEventListener(
            "click",
            togglePassword
        );


    $("loginBackButton")
        .addEventListener(
            "click",
            returnToDownload
        );


    /* ================================================
       LOGOUT
    ================================================= */

    $("logoutButton")
        .addEventListener(
            "click",
            logout
        );


    $("sidebarDownloadButton")
        .addEventListener(
            "click",
            returnToDownload
        );


    /* ================================================
       MOBILE MENU
    ================================================= */

    $("mobileMenuButton")
        .addEventListener(
            "click",
            toggleSidebar
        );


    /* ================================================
       NAVIGATION
    ================================================= */

    document
        .querySelectorAll(".nav-item")
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        showSection(
                            button.dataset.section
                        );

                    }
                );

            }
        );


    /* ================================================
       REFRESH
    ================================================= */

    $("dashboardRefreshButton")
        .addEventListener(
            "click",
            loadPendingPurchases
        );


    $("pendingRefreshButton")
        .addEventListener(
            "click",
            loadPendingPurchases
        );


    $("viewPendingButton")
        .addEventListener(
            "click",
            function() {

                showSection(
                    "pendingSection"
                );

            }
        );


    /* ================================================
       SEARCH
    ================================================= */

    $("purchaseSearch")
        .addEventListener(
            "input",
            renderPendingPurchases
        );


    $("productFilter")
        .addEventListener(
            "change",
            renderPendingPurchases
        );


    /* ================================================
       VERIFICATION
    ================================================= */

    $("verificationForm")
        .addEventListener(
            "submit",
            handleVerification
        );


    $("verificationApproveButton")
        .addEventListener(
            "click",
            function() {

                if (
                    state.verificationPurchase
                ) {

                    requestApproval(
                        state.verificationPurchase
                    );

                }

            }
        );


    $("verificationRejectButton")
        .addEventListener(
            "click",
            function() {

                if (
                    state.verificationPurchase
                ) {

                    requestRejection(
                        state.verificationPurchase
                    );

                }

            }
        );


    /* ================================================
       PURCHASE MODAL
    ================================================= */

    $("closeModalButton")
        .addEventListener(
            "click",
            closePurchaseModal
        );


    $("modalOverlay")
        .addEventListener(
            "click",
            closePurchaseModal
        );


    $("modalApproveButton")
        .addEventListener(
            "click",
            function() {

                if (
                    state.selectedPurchase
                ) {

                    requestApproval(
                        state.selectedPurchase
                    );

                }

            }
        );


    $("modalRejectButton")
        .addEventListener(
            "click",
            function() {

                if (
                    state.selectedPurchase
                ) {

                    requestRejection(
                        state.selectedPurchase
                    );

                }

            }
        );


    /* ================================================
       CONFIRM MODAL
    ================================================= */

    $("cancelConfirmButton")
        .addEventListener(
            "click",
            closeConfirmModal
        );


    $("confirmActionButton")
        .addEventListener(
            "click",
            executeConfirmation
        );


    /* ================================================
       ESC KEY
    ================================================= */

    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape"
            ) {

                closePurchaseModal();

                closeConfirmModal();

                closeSidebar();

            }

        }
    );

}


/* =========================================================
   SESSION
========================================================= */

function createSession(email) {

    const session = {

        email: email,

        loggedAt:
            Date.now()

    };


    sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(session)
    );

}


function restoreSession() {

    try {

        const saved =
            sessionStorage.getItem(
                SESSION_KEY
            );


        if (!saved) {

            showLogin();

            return;

        }


        const session =
            JSON.parse(saved);


        if (
            !session ||
            session.email !== ADMIN_EMAIL
        ) {

            clearSession();

            showLogin();

            return;

        }


        state.loggedIn = true;

        state.adminEmail =
            session.email;


        showAdmin();

        loadPendingPurchases();

        testAPI();

    }

    catch (error) {

        clearSession();

        showLogin();

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(event) {

    event.preventDefault();


    const email =
        $("adminEmail")
            .value
            .trim()
            .toLowerCase();


    const password =
        $("adminPassword")
            .value;


    clearMessage(
        $("loginMessage")
    );


    if (!email) {

        showMessage(
            $("loginMessage"),
            "Please enter the administrator email.",
            "error"
        );

        return;

    }


    if (
        email !==
        ADMIN_EMAIL.toLowerCase()
    ) {

        showMessage(
            $("loginMessage"),
            "Unauthorized administrator email.",
            "error"
        );

        return;

    }


    if (!password) {

        showMessage(
            $("loginMessage"),
            "Please enter the administrator password.",
            "error"
        );

        return;

    }


    /*
     * CLIENT-SIDE PASSWORD CHECK
     *
     * This works only against ADMIN_PASSWORD above.
     */

    if (
        password !==
        ADMIN_PASSWORD
    ) {

        showMessage(
            $("loginMessage"),
            "Incorrect administrator password.",
            "error"
        );

        $("adminPassword").value = "";

        return;

    }


    setLoginLoading(true);


    /*
     * Verify that the existing Code.gs deployment
     * is reachable before allowing the admin interface
     * to open.
     */

    try {

        const result =
            await apiRequest(
                "test"
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Purchase API verification failed."
            );

        }


        state.loggedIn = true;

        state.adminEmail =
            ADMIN_EMAIL;


        createSession(
            ADMIN_EMAIL
        );


        $("adminPassword").value = "";


        showAdmin();


        showToast(
            "Administrator login successful.",
            "success"
        );


        loadPendingPurchases();

    }

    catch (error) {

        showMessage(
            $("loginMessage"),
            "Unable to connect to Purchase API. " +
            getErrorMessage(error),
            "error"
        );

    }

    finally {

        setLoginLoading(false);

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    state.loggedIn = false;

    state.adminEmail = "";

    state.pendingPurchases = [];

    state.selectedPurchase = null;

    state.verificationPurchase = null;


    clearSession();


    showToast(
        "Administrator logged out.",
        "success"
    );


    /*
     * Small delay lets the user see the logout message.
     */

    setTimeout(
        returnToDownload,
        350
    );

}


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearSession() {

    try {

        sessionStorage.removeItem(
            SESSION_KEY
        );

    }

    catch (error) {

        console.warn(
            "Session cleanup failed.",
            error
        );

    }

}


/* =========================================================
   RETURN TO DOWNLOAD PAGE
========================================================= */

function returnToDownload() {

    window.location.href =
        DOWNLOAD_PAGE;

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

    $("loginScreen")
        .classList
        .remove("hidden");


    $("adminScreen")
        .classList
        .add("hidden");

}


/* =========================================================
   SHOW ADMIN
========================================================= */

function showAdmin() {

    $("loginScreen")
        .classList
        .add("hidden");


    $("adminScreen")
        .classList
        .remove("hidden");


    $("loggedAdminEmail")
        .textContent =
        state.adminEmail;

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function togglePassword() {

    const input =
        $("adminPassword");


    const button =
        $("togglePassword");


    if (
        input.type ===
        "password"
    ) {

        input.type =
            "text";

        button.textContent =
            "Hide";

        button.setAttribute(
            "aria-label",
            "Hide password"
        );

    }

    else {

        input.type =
            "password";

        button.textContent =
            "Show";

        button.setAttribute(
            "aria-label",
            "Show password"
        );

    }

}


/* =========================================================
   LOGIN LOADING
========================================================= */

function setLoginLoading(loading) {

    $("loginButton")
        .disabled =
        loading;


    $("loginButtonText")
        .textContent =
        loading
            ? "Verifying..."
            : "Sign In";


    $("loginSpinner")
        .classList
        .toggle(
            "hidden",
            !loading
        );

}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(sectionId) {

    if (!state.loggedIn) {

        showLogin();

        return;

    }


    document
        .querySelectorAll(".content-section")
        .forEach(
            function(section) {

                section.classList.remove(
                    "active"
                );

            }
        );


    const section =
        $(sectionId);


    if (section) {

        section.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(
            function(button) {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    sectionId
                );

            }
        );


    closeSidebar();

}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {

    $("sidebar")
        .classList
        .toggle("open");

}


function closeSidebar() {

    $("sidebar")
        .classList
        .remove("open");

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    action,
    parameters = {}
) {

    if (
        !PURCHASE_API_URL ||
        PURCHASE_API_URL.includes(
            "YOUR_GOOGLE_APPS_SCRIPT"
        )
    ) {

        throw new Error(
            "Google Apps Script Web App URL has not been configured."
        );

    }


    const query =
        new URLSearchParams();


    query.append(
        "action",
        action
    );


    /*
     * Existing Code.gs expects adminEmail
     * for administrator actions.
     */

    if (
        action ===
            "getPendingPurchases" ||
        action ===
            "approveProPurchase" ||
        action ===
            "rejectProPurchase"
    ) {

        query.append(
            "adminEmail",
            state.adminEmail ||
            ADMIN_EMAIL
        );

    }


    Object.keys(parameters)
        .forEach(
            function(key) {

                const value =
                    parameters[key];


                if (
                    value !== undefined &&
                    value !== null
                ) {

                    query.append(
                        key,
                        String(value)
                    );

                }

            }
        );


    const response =
        await fetch(
            PURCHASE_API_URL +
            "?" +
            query.toString(),
            {

                method: "GET",

                cache: "no-store",

                redirect: "follow"

            }
        );


    if (!response.ok) {

        throw new Error(
            "HTTP error " +
            response.status
        );

    }


    const text =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(text);

    }

    catch (error) {

        throw new Error(
            "The Purchase API returned an invalid response."
        );

    }


    if (
        data &&
        data.success === false
    ) {

        throw new Error(
            data.message ||
            "Purchase API request failed."
        );

    }


    return data;

}


/* =========================================================
   TEST API
========================================================= */

async function testAPI() {

    $("apiStat")
        .textContent =
        "Checking";


    try {

        const result =
            await apiRequest(
                "test"
            );


        if (
            result &&
            result.success === true
        ) {

            $("apiStat")
                .textContent =
                "Online";

        }

        else {

            $("apiStat")
                .textContent =
                "Error";

        }

    }

    catch (error) {

        console.error(
            "API test failed:",
            error
        );


        $("apiStat")
            .textContent =
            "Offline";

    }

}


/* =========================================================
   LOAD PENDING PURCHASES
========================================================= */

async function loadPendingPurchases() {

    if (!state.loggedIn) {

        return;

    }


    setRefreshLoading(
        true
    );


    renderLoading(
        $("pendingPurchaseList"),
        "Loading pending purchases..."
    );


    renderLoading(
        $("dashboardPendingList"),
        "Loading purchases..."
    );


    try {

        const result =
            await apiRequest(
                "getPendingPurchases"
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Unable to load purchases."
            );

        }


        state.pendingPurchases =
            Array.isArray(result.data)
                ? result.data
                : [];


        updateStatistics();

        populateProductFilter();

        renderPendingPurchases();

        renderDashboardPending();


    }

    catch (error) {

        console.error(
            "Pending purchase error:",
            error
        );


        renderError(
            $("pendingPurchaseList"),
            getErrorMessage(error)
        );


        renderError(
            $("dashboardPendingList"),
            getErrorMessage(error)
        );


        $("pendingSummary")
            .textContent =
            "Unable to load purchases.";

    }

    finally {

        setRefreshLoading(
            false
        );

    }

}


/* =========================================================
   REFRESH BUTTON STATE
========================================================= */

function setRefreshLoading(
    loading
) {

    $("dashboardRefreshButton")
        .disabled =
        loading;


    $("pendingRefreshButton")
        .disabled =
        loading;


    $("dashboardRefreshButton")
        .textContent =
        loading
            ? "↻ Loading..."
            : "↻ Refresh";


    $("pendingRefreshButton")
        .textContent =
        loading
            ? "↻ Loading..."
            : "↻ Refresh";

}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStatistics() {

    const pendingCount =
        state.pendingPurchases.length;


    $("pendingStat")
        .textContent =
        pendingCount;


    $("sidebarPendingCount")
        .textContent =
        pendingCount;


    /*
     * Existing getPendingPurchases only returns PENDING.
     *
     * Therefore PAID and REJECTED totals cannot be
     * accurately calculated from this endpoint.
     *
     * Do not invent those values.
     */

    $("paidStat")
        .textContent =
        "—";


    $("rejectedStat")
        .textContent =
        "—";


    $("pendingSummary")
        .textContent =
        pendingCount === 1
            ? "1 purchase waiting for verification."
            : pendingCount +
              " purchases waiting for verification.";

}


/* =========================================================
   PRODUCT FILTER
========================================================= */

function populateProductFilter() {

    const select =
        $("productFilter");


    const currentValue =
        select.value;


    const products =
        [];


    state.pendingPurchases
        .forEach(
            function(purchase) {

                const product =
                    cleanText(
                        purchase.product
                    );


                if (
                    product &&
                    !products.includes(product)
                ) {

                    products.push(
                        product
                    );

                }

            }
        );


    products.sort();


    select.innerHTML =
        '<option value="">All Products</option>';


    products.forEach(
        function(product) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                product;


            option.textContent =
                product;


            select.appendChild(
                option
            );

        }
    );


    if (
        products.includes(
            currentValue
        )
    ) {

        select.value =
            currentValue;

    }

}


/* =========================================================
   FILTER PURCHASES
========================================================= */

function getFilteredPurchases() {

    const search =
        $("purchaseSearch")
            .value
            .trim()
            .toLowerCase();


    const product =
        $("productFilter")
            .value;


    return state.pendingPurchases
        .filter(
            function(purchase) {

                const matchesProduct =
                    !product ||
                    cleanText(
                        purchase.product
                    ) === product;


                if (!matchesProduct) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                const combined =
                    [

                        purchase.purchaseId,

                        purchase.name,

                        purchase.email,

                        purchase.product,

                        purchase.gcashReference

                    ]
                    .join(" ")
                    .toLowerCase();


                return combined.includes(
                    search
                );

            }
        );

}


/* =========================================================
   RENDER PENDING PURCHASES
========================================================= */

function renderPendingPurchases() {

    const container =
        $("pendingPurchaseList");


    const purchases =
        getFilteredPurchases();


    if (!purchases.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <strong>
                    No pending purchases found
                </strong>

                <span>
                    There are no purchases matching your search.
                </span>

            </div>

        `;


        return;

    }


    container.innerHTML =
        purchases
            .map(
                createPurchaseCard
            )
            .join("");

}


/* =========================================================
   CREATE PURCHASE CARD
========================================================= */

function createPurchaseCard(
    purchase
) {

    const id =
        escapeHtml(
            purchase.purchaseId
        );


    const name =
        escapeHtml(
            purchase.name
        );


    const email =
        escapeHtml(
            purchase.email
        );


    const product =
        escapeHtml(
            purchase.product
        );


    const reference =
        escapeHtml(
            purchase.gcashReference
        );


    const amount =
        formatMoney(
            purchase.amount,
            purchase.currency
        );


    const date =
        formatDate(
            purchase.date
        );


    return `

        <article class="purchase-card">

            <div class="purchase-main">

                <strong>
                    ${id}
                </strong>

                <span>
                    ${date}
                </span>

            </div>


            <div class="purchase-info">

                <strong>
                    ${name}
                </strong>

                <span>
                    ${email}
                </span>

            </div>


            <div class="purchase-info">

                <strong>
                    ${product}
                </strong>

                <span>
                    ${amount}
                    · Ref: ${reference}
                </span>

            </div>


            <div class="purchase-actions">

                <button
                    type="button"
                    class="small-button small-view"
                    data-action="view"
                    data-id="${id}">

                    View

                </button>


                <button
                    type="button"
                    class="small-button small-approve"
                    data-action="approve"
                    data-id="${id}">

                    Approve

                </button>


                <button
                    type="button"
                    class="small-button small-reject"
                    data-action="reject"
                    data-id="${id}">

                    Reject

                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   CARD EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {

            return;

        }


        const action =
            button.dataset.action;


        const id =
            button.dataset.id;


        const purchase =
            state.pendingPurchases
                .find(
                    function(item) {

                        return String(
                            item.purchaseId
                        ) === String(id);

                    }
                );


        if (!purchase) {

            showToast(
                "Purchase record is no longer available.",
                "error"
            );

            return;

        }


        if (
            action ===
            "view"
        ) {

            openPurchaseModal(
                purchase
            );

        }


        else if (
            action ===
            "approve"
        ) {

            requestApproval(
                purchase
            );

        }


        else if (
            action ===
            "reject"
        ) {

            requestRejection(
                purchase
            );

        }

    }
);


/* =========================================================
   DASHBOARD LIST
========================================================= */

function renderDashboardPending() {

    const container =
        $("dashboardPendingList");


    const purchases =
        state.pendingPurchases
            .slice(
                0,
                5
            );


    if (!purchases.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    ✓
                </div>

                <strong>
                    No pending purchases
                </strong>

                <span>
                    Your verification queue is clear.
                </span>

            </div>

        `;


        return;

    }


    container.innerHTML =
        purchases
            .map(
                createPurchaseCard
            )
            .join("");

}


/* =========================================================
   PURCHASE MODAL
========================================================= */

function openPurchaseModal(
    purchase
) {

    state.selectedPurchase =
        purchase;


    const modalBody =
        $("modalBody");


    modalBody.innerHTML = `

        <div class="modal-purchase-grid">


            <div class="modal-detail">

                <span>
                    Purchase ID
                </span>

                <strong>
                    ${escapeHtml(purchase.purchaseId)}
                </strong>

            </div>


            <div class="modal-detail">

                <span>
                    Status
                </span>

                <strong>
                    ${escapeHtml(purchase.status)}
                </strong>

            </div>


            <div class="modal-detail">

                <span>
                    Customer Name
                </span>

                <strong>
                    ${escapeHtml(purchase.name)}
                </strong>

            </div>


            <div class="modal-detail">

                <span>
                    Customer Email
                </span>

                <strong>
                    ${escapeHtml(purchase.email)}
                </strong>

            </div>


            <div class="modal-detail full">

                <span>
                    Product
                </span>

                <strong>
                    ${escapeHtml(purchase.product)}
                </strong>

            </div>


            <div class="modal-detail">

                <span>
                    Amount
                </span>

                <strong>
                    ${escapeHtml(
                        formatMoney(
                            purchase.amount,
                            purchase.currency
                        )
                    )}
                </strong>

            </div>


            <div class="modal-detail">

                <span>
                    Date
                </span>

                <strong>
                    ${escapeHtml(
                        formatDate(
                            purchase.date
                        )
                    )}
                </strong>

            </div>


            <div class="modal-detail full">

                <span>
                    GCash Reference Number
                </span>

                <strong>
                    ${escapeHtml(
                        purchase.gcashReference
                    )}
                </strong>

            </div>

        </div>

    `;


    $("purchaseModal")
        .classList
        .remove("hidden");


    $("purchaseModal")
        .setAttribute(
            "aria-hidden",
            "false"
        );

}


function closePurchaseModal() {

    $("purchaseModal")
        .classList
        .add("hidden");


    $("purchaseModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );


    state.selectedPurchase =
        null;

}


/* =========================================================
   APPROVAL
========================================================= */

function requestApproval(
    purchase
) {

    if (!purchase) {

        return;

    }


    openConfirmModal({

        type: "approve",

        title:
            "Approve Payment?",

        message:
            "You are about to mark Purchase ID " +
            purchase.purchaseId +
            " as PAID. The customer will receive the approval email and the Pro download will become available.",

        buttonText:
            "Approve Payment",

        callback:
            function() {

                approvePurchase(
                    purchase
                );

            }

    });

}


/* =========================================================
   APPROVE PURCHASE
========================================================= */

async function approvePurchase(
    purchase
) {

    closeConfirmModal();

    closePurchaseModal();


    showToast(
        "Approving payment...",
        "warning"
    );


    try {

        const result =
            await apiRequest(
                "approveProPurchase",
                {

                    purchaseId:
                        purchase.purchaseId,

                    adminEmail:
                        state.adminEmail

                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Approval failed."
            );

        }


        showToast(
            "Payment approved successfully.",
            "success"
        );


        await loadPendingPurchases();


        /*
         * If verification page contains the same
         * purchase, refresh its status.
         */

        if (
            state.verificationPurchase &&
            state.verificationPurchase.purchaseId ===
            purchase.purchaseId
        ) {

            state.verificationPurchase =
                null;


            $("verificationResult")
                .classList
                .add("hidden");

        }

    }

    catch (error) {

        console.error(
            "Approval error:",
            error
        );


        showToast(
            "Approval failed: " +
            getErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   REJECTION
========================================================= */

function requestRejection(
    purchase
) {

    if (!purchase) {

        return;

    }


    openConfirmModal({

        type: "reject",

        title:
            "Reject Payment?",

        message:
            "You are about to mark Purchase ID " +
            purchase.purchaseId +
            " as REJECTED. The customer will receive a rejection notification.",

        buttonText:
            "Reject Payment",

        callback:
            function() {

                rejectPurchase(
                    purchase
                );

            }

    });

}


/* =========================================================
   REJECT PURCHASE
========================================================= */

async function rejectPurchase(
    purchase
) {

    closeConfirmModal();

    closePurchaseModal();


    showToast(
        "Rejecting payment...",
        "warning"
    );


    try {

        const result =
            await apiRequest(
                "rejectProPurchase",
                {

                    purchaseId:
                        purchase.purchaseId,

                    adminEmail:
                        state.adminEmail

                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Rejection failed."
            );

        }


        showToast(
            "Purchase rejected successfully.",
            "success"
        );


        await loadPendingPurchases();


        if (
            state.verificationPurchase &&
            state.verificationPurchase.purchaseId ===
            purchase.purchaseId
        ) {

            state.verificationPurchase =
                null;


            $("verificationResult")
                .classList
                .add("hidden");

        }

    }

    catch (error) {

        console.error(
            "Rejection error:",
            error
        );


        showToast(
            "Rejection failed: " +
            getErrorMessage(error),
            "error"
        );

    }

}


/* =========================================================
   VERIFICATION FORM
========================================================= */

async function handleVerification(
    event
) {

    event.preventDefault();


    const purchaseId =
        $("verificationPurchaseId")
            .value
            .trim();


    const email =
        $("verificationEmail")
            .value
            .trim()
            .toLowerCase();


    clearMessage(
        $("verificationMessage")
    );


    $("verificationResult")
        .classList
        .add("hidden");


    if (!purchaseId) {

        showMessage(
            $("verificationMessage"),
            "Purchase ID is required.",
            "error"
        );

        return;

    }


    if (!email) {

        showMessage(
            $("verificationMessage"),
            "Customer email is required.",
            "error"
        );

        return;

    }


    setVerificationLoading(
        true
    );


    try {

        const result =
            await apiRequest(
                "checkProPurchase",
                {

                    purchaseId:
                        purchaseId,

                    email:
                        email

                }
            );


        if (
            !result ||
            result.success !== true ||
            !result.data
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Purchase could not be verified."
            );

        }


        state.verificationPurchase =
            result.data;


        renderVerificationResult(
            result.data
        );


        showToast(
            "Purchase record found.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Verification error:",
            error
        );


        showMessage(
            $("verificationMessage"),
            getErrorMessage(error),
            "error"
        );

    }

    finally {

        setVerificationLoading(
            false
        );

    }

}


/* =========================================================
   VERIFICATION RESULT
========================================================= */

function renderVerificationResult(
    purchase
) {

    $("verificationResult")
        .classList
        .remove("hidden");


    $("detailPurchaseId")
        .textContent =
        purchase.purchaseId ||
        "—";


    $("detailDate")
        .textContent =
        formatDate(
            purchase.date
        );


    $("detailName")
        .textContent =
        purchase.name ||
        "—";


    $("detailEmail")
        .textContent =
        purchase.email ||
        "—";


    $("detailProduct")
        .textContent =
        purchase.product ||
        "—";


    $("detailAmount")
        .textContent =
        formatMoney(
            purchase.amount,
            purchase.currency
        );


    $("detailCurrency")
        .textContent =
        purchase.currency ||
        "—";


    $("detailDownload")
        .textContent =
        purchase.downloadAvailable
            ? "AVAILABLE"
            : "NOT AVAILABLE";


    setStatusBadge(
        $("verificationStatus"),
        purchase.status
    );


    const paid =
        String(
            purchase.status || ""
        )
        .toUpperCase() ===
        "PAID";


    $("verificationApproveButton")
        .disabled =
        paid;


    $("verificationRejectButton")
        .disabled =
        paid;

}


/* =========================================================
   VERIFICATION LOADING
========================================================= */

function setVerificationLoading(
    loading
) {

    $("verificationButton")
        .disabled =
        loading;


    $("verificationButton")
        .textContent =
        loading
            ? "Checking..."
            : "Check Purchase";

}


/* =========================================================
   CONFIRMATION MODAL
========================================================= */

function openConfirmModal(
    options
) {

    confirmCallback =
        options.callback;


    $("confirmTitle")
        .textContent =
        options.title;


    $("confirmMessage")
        .textContent =
        options.message;


    $("confirmActionButton")
        .textContent =
        options.buttonText;


    if (
        options.type ===
        "reject"
    ) {

        $("confirmActionButton")
            .className =
            "reject-button";


        $("confirmIcon")
            .textContent =
            "×";

    }

    else {

        $("confirmActionButton")
            .className =
            "approve-button";


        $("confirmIcon")
            .textContent =
            "✓";

    }


    $("confirmModal")
        .classList
        .remove("hidden");


    $("confirmModal")
        .setAttribute(
            "aria-hidden",
            "false"
        );

}


function executeConfirmation() {

    if (
        typeof confirmCallback ===
        "function"
    ) {

        const callback =
            confirmCallback;


        confirmCallback =
            null;


        callback();

    }

}


function closeConfirmModal() {

    $("confirmModal")
        .classList
        .add("hidden");


    $("confirmModal")
        .setAttribute(
            "aria-hidden",
            "true"
        );


    confirmCallback =
        null;

}


/* =========================================================
   STATUS BADGE
========================================================= */

function setStatusBadge(
    element,
    status
) {

    const normalized =
        String(
            status || ""
        )
        .toUpperCase();


    element.className =
        "status-badge";


    if (
        normalized ===
        "PENDING"
    ) {

        element.classList.add(
            "status-pending"
        );

    }

    else if (
        normalized ===
        "PAID"
    ) {

        element.classList.add(
            "status-paid"
        );

    }

    else if (
        normalized ===
        "REJECTED"
    ) {

        element.classList.add(
            "status-rejected"
        );

    }

    else {

        element.classList.add(
            "status-unknown"
        );

    }


    element.textContent =
        normalized ||
        "UNKNOWN";

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    element,
    message,
    type
) {

    element.textContent =
        message;


    element.className =
        "message " +
        type;


}


function clearMessage(
    element
) {

    element.textContent =
        "";


    element.className =
        "message hidden";

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        $("toast");


    $("toastMessage")
        .textContent =
        message;


    $("toastIcon")
        .textContent =
        type === "error"
            ? "!"
            : type === "warning"
                ? "!"
                : "✓";


    toast.className =
        "toast show " +
        type;


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            function() {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   LOADING
========================================================= */

function renderLoading(
    container,
    message
) {

    container.innerHTML = `

        <div class="loading-state">

            <span class="spinner">
            </span>

            ${escapeHtml(message)}

        </div>

    `;

}


/* =========================================================
   ERROR
========================================================= */

function renderError(
    container,
    message
) {

    container.innerHTML = `

        <div class="error-state">

            <div class="empty-icon">
                !
            </div>

            <strong>
                Unable to load data
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>

    `;

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (
        !value
    ) {

        return "—";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        undefined,
        {

            year: "numeric",

            month: "short",

            day: "numeric",

            hour: "numeric",

            minute: "2-digit"

        }
    );

}


/* =========================================================
   MONEY FORMAT
========================================================= */

function formatMoney(
    amount,
    currency
) {

    if (
        amount === null ||
        amount === undefined ||
        amount === ""
    ) {

        return "—";

    }


    const numeric =
        Number(amount);


    if (
        Number.isNaN(
            numeric
        )
    ) {

        return (
            String(currency || "") +
            " " +
            String(amount)
        );

    }


    const normalizedCurrency =
        String(
            currency || "PHP"
        )
        .toUpperCase();


    if (
        normalizedCurrency ===
        "PHP"
    ) {

        return (
            "₱" +
            numeric.toFixed(2)
        );

    }


    return (
        normalizedCurrency +
        " " +
        numeric.toFixed(2)
    );

}


/* =========================================================
   CLEAN TEXT
========================================================= */

function cleanText(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .trim();

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value === null ||
        value === undefined
            ? ""
            : value
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
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
    error
) {

    if (
        !error
    ) {

        return "Unknown error.";

    }


    if (
        error.message
    ) {

        return error.message;

    }


    return String(error);

}


/* =========================================================
   PAGE-CLOSE / NAVIGATION PROTECTION
========================================================= */


/*
 * We intentionally DO NOT use beforeunload to redirect.
 *
 * Browsers do not reliably permit JavaScript to force a
 * redirect when a tab/window is closed.
 *
 * Instead:
 *
 * 1. sessionStorage disappears when the tab is closed.
 * 2. Opening purchase-admin.html again requires login.
 * 3. The explicit Logout button returns to download.html.
 *
 * This is the reliable browser behavior.
 */


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    function() {

        /*
         * No automatic logout is performed here.
         *
         * Switching apps or tabs on Android can trigger
         * visibilitychange and should NOT unexpectedly
         * destroy the administrator session.
         */

    }
);


/* =========================================================
   PREVENT ACCIDENTAL FORM SUBMISSION
========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter" &&
            event.target.tagName === "INPUT"
        ) {

            /*
             * Normal form submission is allowed.
             */

        }

    }
);
