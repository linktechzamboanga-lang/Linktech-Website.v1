const API_URL =
    "https://script.google.com/macros/s/AKfycbz0h8I56PglGhib3u9X6EjL84hEtPdpk33fuM3mFIJ3NtVAA6kj0iW-omKiv3k465iP/exec";


const PRODUCT_NAME =
    "Computer Inventory System pro";


const PRODUCT_AMOUNT =
    150;


const PRODUCT_CURRENCY =
    "PHP";


/* =========================================================
   ELEMENTS
========================================================= */

const paymentForm =
    document.getElementById(
        "paymentForm"
    );


const statusBox =
    document.getElementById(
        "status"
    );


const purchaseResult =
    document.getElementById(
        "purchaseResult"
    );


const purchaseIdBox =
    document.getElementById(
        "purchaseId"
    );


const purchaseStatusBox =
    document.getElementById(
        "purchaseStatus"
    );


const returnDownloadButton =
    document.getElementById(
        "returnDownloadButton"
    );


/* =========================================================
   API CHECK
========================================================= */

function apiConfigured() {

    return (

        API_URL &&

        API_URL !==
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"

    );

}


/* =========================================================
   PAYMENT FORM
========================================================= */

if (paymentForm) {

    paymentForm.addEventListener(
        "submit",
        submitPayment
    );

}


async function submitPayment(
    event
) {

    event.preventDefault();


    const name =
        document
            .getElementById(
                "customerName"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "customerEmail"
            )
            .value
            .trim()
            .toLowerCase();


    const reference =
        document
            .getElementById(
                "gcashReference"
            )
            .value
            .trim();


    /* =====================================================
       VALIDATION
    ====================================================== */

    if (!name) {

        showStatus(
            "Please enter your full name.",
            "error"
        );

        return;

    }


    if (
        !email ||
        !isValidEmail(email)
    ) {

        showStatus(
            "Please enter a valid email address.",
            "error"
        );

        return;

    }


    if (
        !reference ||
        reference.length < 6
    ) {

        showStatus(
            "Please enter a valid GCash reference number.",
            "error"
        );

        return;

    }


    if (!apiConfigured()) {

        showStatus(
            "The payment system has not been configured yet.",
            "error"
        );

        return;

    }


    const submitButton =
        paymentForm.querySelector(
            ".submit-btn"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.innerText =
            "Submitting Payment...";

    }


    showStatus(
        "Submitting your payment details...",
        "success"
    );


    try {

        /* =================================================
           IMPORTANT

           Use URLSearchParams.

           Code.gs reads:
           e.parameter.action
           e.parameter.name
           e.parameter.email
           etc.

        ================================================== */

        const params =
            new URLSearchParams();


        params.append(
            "action",
            "submitProPurchase"
        );


        params.append(
            "product",
            PRODUCT_NAME
        );


        params.append(
            "amount",
            PRODUCT_AMOUNT
        );


        params.append(
            "currency",
            PRODUCT_CURRENCY
        );


        params.append(
            "name",
            name
        );


        params.append(
            "email",
            email
        );


        params.append(
            "gcashReference",
            reference
        );


        /* =================================================
           SEND REQUEST
        ================================================== */

        const response =
            await fetch(
                API_URL,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/x-www-form-urlencoded;charset=UTF-8"

                    },

                    body:
                        params.toString()

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


        console.log(
            "Payment response:",
            data
        );


        /* =================================================
           API SUCCESS
        ================================================== */

        if (
            data.success === true
        ) {

            const purchase =
                data.data || {};


            const purchaseId =
                purchase.purchaseId ||
                "";


            const status =
                purchase.status ||
                "PENDING";


            showStatus(
                "✓ Payment details submitted successfully.",
                "success"
            );


            showPurchaseResult(
                purchaseId,
                status,
                email
            );


            /* =============================================
               SAVE PURCHASE
            ============================================= */

            try {

                localStorage.setItem(
                    "linktech_purchase_id",
                    purchaseId
                );


                localStorage.setItem(
                    "linktech_purchase_email",
                    email
                );

            }

            catch (storageError) {

                console.warn(
                    storageError
                );

            }


            /* =============================================
               LOCK FORM
            ============================================= */

            paymentForm
                .querySelectorAll(
                    "input, button"
                )
                .forEach(
                    element => {

                        element.disabled =
                            true;

                    }
                );


            return;

        }


        /* =================================================
           API ERROR
        ================================================== */

        showStatus(

            data.message ||
            "Unable to submit payment.",

            "error"

        );

    }

    catch (error) {

        console.error(
            "Payment error:",
            error
        );


        showStatus(

            "Unable to connect to the payment server." +
            "<br><br>" +
            "Please check your internet connection and try again.",

            "error"

        );

    }

    finally {

        if (
            submitButton
        ) {

            submitButton.disabled =
                false;

            submitButton.innerText =
                "Submit Payment for Verification";

        }

    }

}


/* =========================================================
   SHOW PURCHASE RESULT
========================================================= */

function showPurchaseResult(
    purchaseId,
    status,
    email
) {

    if (!purchaseResult) {

        return;

    }


    purchaseIdBox.textContent =
        purchaseId ||
        "Not available";


    purchaseStatusBox.textContent =
        status ||
        "PENDING";


    purchaseResult.style.display =
        "block";


    if (email) {

        purchaseResult.dataset.email =
            email;

    }


    purchaseResult.scrollIntoView({

        behavior:
            "smooth",

        block:
            "center"

    });

}


/* =========================================================
   RETURN TO DOWNLOAD PAGE
========================================================= */

if (returnDownloadButton) {

    returnDownloadButton.addEventListener(
        "click",
        function() {

            window.location.href =
                "download.html";

        }
    );

}


/* =========================================================
   STATUS
========================================================= */

function showStatus(
    message,
    type
) {

    if (!statusBox) {

        return;

    }


    statusBox.innerHTML =
        message;


    statusBox.className =
        "status " +
        type;


    statusBox.scrollIntoView({

        behavior:
            "smooth",

        block:
            "nearest"

    });

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
   LOAD SAVED EMAIL
========================================================= */

function loadSavedInformation() {

    try {

        const savedEmail =
            localStorage.getItem(
                "linktech_purchase_email"
            );


        if (
            savedEmail
        ) {

            const emailInput =
                document.getElementById(
                    "customerEmail"
                );


            if (
                emailInput &&
                !emailInput.value
            ) {

                emailInput.value =
                    savedEmail;

            }

        }

    }

    catch (error) {

        console.warn(
            "Unable to load saved information.",
            error
        );

    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadSavedInformation();

    }
);
