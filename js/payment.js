const API_URL =
    "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";


/* =========================================================
   PRODUCT CONFIGURATION
========================================================= */

const PRODUCT_NAME =
    "Computer Inventory Pro";


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


/* =========================================================
   FORM CHECK
========================================================= */

if (!paymentForm) {

    console.error(
        "Payment form #paymentForm was not found."
    );

}


/* =========================================================
   PAYMENT SUBMISSION
========================================================= */

if (paymentForm) {

    paymentForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            /* =============================================
               GET INPUTS
            ============================================= */

            const nameInput =
                document.getElementById(
                    "customerName"
                );


            const emailInput =
                document.getElementById(
                    "customerEmail"
                );


            const referenceInput =
                document.getElementById(
                    "gcashReference"
                );


            if (
                !nameInput ||
                !emailInput ||
                !referenceInput
            ) {

                showStatus(
                    "Payment form fields are missing.",
                    "error"
                );

                return;

            }


            const name =
                nameInput.value
                    .trim();


            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();


            const reference =
                referenceInput.value
                    .trim();


            /* =============================================
               VALIDATION
            ============================================= */

            if (!name) {

                showStatus(
                    "Please enter your full name.",
                    "error"
                );

                nameInput.focus();

                return;

            }


            if (!email) {

                showStatus(
                    "Please enter your email address.",
                    "error"
                );

                emailInput.focus();

                return;

            }


            if (
                !isValidEmail(email)
            ) {

                showStatus(
                    "Please enter a valid email address.",
                    "error"
                );

                emailInput.focus();

                return;

            }


            if (!reference) {

                showStatus(
                    "Please enter your GCash reference number.",
                    "error"
                );

                referenceInput.focus();

                return;

            }


            if (
                reference.length < 6
            ) {

                showStatus(
                    "GCash reference number must contain at least 6 characters.",
                    "error"
                );

                referenceInput.focus();

                return;

            }


            /* =============================================
               CHECK API
            ============================================= */

            if (
                API_URL ===
                "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
            ) {

                showStatus(

                    "Payment system is not configured yet. " +
                    "Please contact the administrator.",

                    "error"

                );

                console.error(
                    "API_URL has not been configured."
                );

                return;

            }


            /* =============================================
               SUBMIT BUTTON
            ============================================= */

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

                "Submitting your payment details..." +
                "<br><br>" +
                "Please wait.",

                "success"

            );


            /* =============================================
               URL ENCODED DATA
            ============================================= */

            const formData =
                new URLSearchParams();


            formData.append(
                "action",
                "submitProPurchase"
            );


            formData.append(
                "product",
                PRODUCT_NAME
            );


            formData.append(
                "amount",
                PRODUCT_AMOUNT
            );


            formData.append(
                "currency",
                PRODUCT_CURRENCY
            );


            formData.append(
                "name",
                name
            );


            formData.append(
                "email",
                email
            );


            formData.append(
                "gcashReference",
                reference
            );


            /* =============================================
               SEND TO GOOGLE APPS SCRIPT
            ============================================= */

            try {

                const response =
                    await fetch(
                        API_URL,
                        {

                            method:
                                "POST",

                            /*
                             * IMPORTANT:
                             *
                             * Do NOT use application/json.
                             *
                             * Google Apps Script reads
                             * these values through e.parameter.
                             */

                            headers: {

                                "Content-Type":
                                    "application/x-www-form-urlencoded;charset=UTF-8"

                            },

                            body:
                                formData.toString()

                        }
                    );


                /* =========================================
                   HTTP CHECK
                ========================================= */

                if (!response.ok) {

                    throw new Error(
                        "Server returned HTTP " +
                        response.status
                    );

                }


                /* =========================================
                   READ RESPONSE
                ========================================= */

                const data =
                    await response.json();


                console.log(
                    "Payment API response:",
                    data
                );


                /* =========================================
                   SUCCESS
                ========================================= */

                if (
                    data.success === true
                ) {

                    const resultData =
                        data.data ||
                        {};


                    const purchaseId =
                        resultData.purchaseId ||
                        data.purchaseId ||
                        "";


                    const status =
                        resultData.status ||
                        data.status ||
                        "PENDING";


                    showStatus(

                        "Payment details submitted successfully.",

                        "success"

                    );


                    showPurchaseResult(
                        purchaseId,
                        status
                    );


                    /*
                     * Disable form after successful
                     * submission.
                     */

                    paymentForm
                        .querySelectorAll(
                            "input, button"
                        )
                        .forEach(
                            function(element) {

                                element.disabled =
                                    true;

                            }
                        );


                    return;

                }


                /* =========================================
                   SERVER ERROR
                ========================================= */

                showStatus(

                    data.message ||
                    "Unable to submit payment details.",

                    "error"

                );

            }

            catch (error) {

                console.error(
                    "Payment submission error:",
                    error
                );


                showStatus(

                    "Unable to connect to the payment server." +
                    "<br><br>" +
                    "Please check your internet connection " +
                    "and try again.",

                    "error"

                );

            }

            finally {

                /*
                 * Restore button only if payment
                 * was not successfully submitted.
                 */

                if (
                    submitButton &&
                    !paymentForm.querySelector(
                        "input:disabled"
                    )
                ) {

                    submitButton.disabled =
                        false;

                    submitButton.innerText =
                        "Submit Payment for Verification";

                }

            }

        }
    );

}


/* =========================================================
   SHOW PURCHASE RESULT
========================================================= */

function showPurchaseResult(
    purchaseId,
    status
) {

    let result =
        document.getElementById(
            "purchaseResult"
        );


    /*
     * Create result box if HTML doesn't
     * contain one.
     */

    if (!result) {

        result =
            document.createElement(
                "div"
            );


        result.id =
            "purchaseResult";


        result.style.marginTop =
            "20px";


        result.style.padding =
            "18px";


        result.style.borderRadius =
            "12px";


        result.style.background =
            "#e9f9ef";


        result.style.border =
            "1px solid #83d89d";


        result.style.color =
            "#146c2e";


        result.style.lineHeight =
            "1.6";


        paymentForm.parentNode.appendChild(
            result
        );

    }


    result.innerHTML = `

        <h3 style="
            margin-top:0;
            color:#146c2e;
        ">

            ✓ Payment Submitted

        </h3>


        <p>

            Your GCash payment details
            have been submitted successfully.

        </p>


        <p>

            <strong>
                Purchase ID:
            </strong>

            <br>

            <span style="
                display:inline-block;
                margin-top:5px;
                padding:8px 10px;
                background:#ffffff;
                border:1px solid #b7d8c0;
                border-radius:7px;
                font-weight:bold;
                word-break:break-all;
            ">

                ${
                    escapeHtml(
                        purchaseId ||
                        "Not provided"
                    )
                }

            </span>

        </p>


        <p>

            <strong>
                Status:
            </strong>

            <span>

                ${
                    escapeHtml(
                        status ||
                        "PENDING"
                    )
                }

            </span>

        </p>


        <p>

            Please save your
            <strong>Purchase ID</strong>.

            You will need it to check your
            payment status.

        </p>


        <p>

            Your Pro APK remains locked
            until your GCash payment has
            been verified by LinkTech.

        </p>


        <button
            type="button"
            id="returnDownloadButton"
            style="
                width:100%;
                padding:13px;
                border:0;
                border-radius:9px;
                background:#0070e0;
                color:white;
                font-size:15px;
                font-weight:bold;
                cursor:pointer;
            ">

            Return to Download Page

        </button>

    `;


    result.style.display =
        "block";


    /* =====================================================
       RETURN BUTTON
    ===================================================== */

    const returnButton =
        document.getElementById(
            "returnDownloadButton"
        );


    if (returnButton) {

        returnButton.addEventListener(
            "click",
            function() {

                window.location.href =
                    "download.html";

            }
        );

    }


    /* =====================================================
       SAVE PURCHASE INFORMATION
    ===================================================== */

    if (purchaseId) {

        try {

            localStorage.setItem(
                "linktech_purchase_id",
                purchaseId
            );


            localStorage.setItem(
                "linktech_purchase_email",
                document
                    .getElementById(
                        "customerEmail"
                    )
                    .value
                    .trim()
                    .toLowerCase()
            );

        }

        catch (error) {

            console.warn(
                "Unable to save purchase information.",
                error
            );

        }

    }

}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
) {

    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return pattern.test(
        email
    );

}


/* =========================================================
   HTML ESCAPE
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
        "status " + type;


    setTimeout(
        function() {

            statusBox.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "nearest"

            });

        },
        100
    );

}


/* =========================================================
   LOAD SAVED PURCHASE
========================================================= */

function loadSavedPurchase() {

    try {

        const savedEmail =
            localStorage.getItem(
                "linktech_purchase_email"
            );


        if (savedEmail) {

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
            "Unable to load saved purchase.",
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

        loadSavedPurchase();

    }
);
