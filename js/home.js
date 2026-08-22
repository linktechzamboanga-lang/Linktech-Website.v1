const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyHfhjtP1ziN6UrHpnk1c5E01DfhI_TB-mAf0lc5MfrJI1vO6Qm2apHdtekrEtJSvSf/exec";


// ==========================================
// GOOGLE CLIENT ID
// ==========================================

const GOOGLE_CLIENT_ID =
    "495855477306-9rdg89fh3g5mtolu8th08ltojor8lkkr.apps.googleusercontent.com";


// ==========================================
// GLOBAL USER
// ==========================================

let currentUser = null;


// ==========================================
// GOOGLE ID TOKEN
// ==========================================
//
// IMPORTANT:
//
// This is kept only in memory.
// It is NOT saved in localStorage.
//

let googleIdToken = null;


// ==========================================
// ADMIN STATE
// ==========================================

let isAdminUser = false;


// ==========================================
// API REQUEST
// ==========================================

async function apiRequest(payload) {

    if (
        !GOOGLE_SCRIPT_URL ||
        GOOGLE_SCRIPT_URL.includes(
            "YOUR_GOOGLE_APPS_SCRIPT"
        )
    ) {

        throw new Error(
            "Google Apps Script URL has not been configured."
        );

    }


    if (
        !payload ||
        typeof payload !== "object"
    ) {

        throw new Error(
            "Invalid API request."
        );

    }


    const response =
        await fetch(
            GOOGLE_SCRIPT_URL,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    if (!response.ok) {

        throw new Error(
            "API request failed. HTTP " +
            response.status
        );

    }


    const text =
        await response.text();


    let result;


    try {

        result =
            JSON.parse(text);

    }

    catch (error) {

        console.error(
            "Invalid JSON response:",
            text
        );

        throw new Error(
            "Server returned an invalid response."
        );

    }


    if (
        !result ||
        result.success !== true
    ) {

        throw new Error(

            result &&
            result.message

                ? result.message

                : "API request failed."

        );

    }


    return result;

}



// ==========================================
// SAVE USER SESSION
// ==========================================

function saveUserSession(user) {

    if (
        !user ||
        !user.email
    ) {

        return;

    }


    currentUser = {

        name:
            user.name || "",

        email:
            user.email || "",

        picture:
            user.picture || "",

        isAdmin:
            user.isAdmin === true

    };


    isAdminUser =
        currentUser.isAdmin;


    localStorage.setItem(

        "linktechUser",

        JSON.stringify(
            currentUser
        )

    );

}



// ==========================================
// LOAD USER SESSION
// ==========================================

function loadUserSession() {

    try {

        const saved =
            localStorage.getItem(
                "linktechUser"
            );


        if (!saved) {

            return null;

        }


        const user =
            JSON.parse(saved);


        if (
            !user ||
            !user.email
        ) {

            return null;

        }


        currentUser =
            user;


        isAdminUser =
            user.isAdmin === true;


        return user;

    }

    catch (error) {

        console.error(
            "Session load error:",
            error
        );

        return null;

    }

}



// ==========================================
// CLEAR USER SESSION
// ==========================================

function clearUserSession() {

    currentUser =
        null;


    googleIdToken =
        null;


    isAdminUser =
        false;


    localStorage.removeItem(
        "linktechUser"
    );

}



// ==========================================
// GET CURRENT EMAIL
// ==========================================

function getCurrentEmail() {

    return currentUser &&
           currentUser.email

        ? currentUser.email

        : "";

}



// ==========================================
// GOOGLE LOGIN
// ==========================================

async function loginWithGoogleToken(
    token
) {

    try {

        if (!token) {

            throw new Error(
                "Google token is missing."
            );

        }


        // ==================================
        // SAVE TOKEN IN MEMORY
        // ==================================

        googleIdToken =
            token;


        // ==================================
        // SEND TOKEN TO APPS SCRIPT
        // ==================================

        const result =
            await apiRequest({

                action:
                    "googleLogin",

                token:
                    token

            });


        if (
            !result.data
        ) {

            throw new Error(
                "Invalid login response."
            );

        }


        // ==================================
        // SAVE USER
        // ==================================

        saveUserSession(
            result.data
        );


        // ==================================
        // UPDATE UI
        // ==================================

        updateLoginUI();


        fillCustomerInformation();


        // ==================================
        // LOAD DATA
        // ==================================

        await loadInitialData();


        // ==================================
        // OPEN ADMIN DASHBOARD
        // ==================================

        if (
            currentUser &&
            currentUser.isAdmin === true
        ) {

            setTimeout(
                function() {

                    openAdminPanel();

                },
                300
            );

        }


        return result.data;

    }

    catch (error) {

        console.error(
            "Google login error:",
            error
        );


        googleIdToken =
            null;


        showMessage(
            error.message,
            "error"
        );


        throw error;

    }

}



// ==========================================
// GOOGLE CREDENTIAL CALLBACK
// ==========================================

function handleGoogleCredential(
    response
) {

    if (
        !response ||
        !response.credential
    ) {

        showMessage(
            "Google login failed. No Google credential received.",
            "error"
        );

        return;

    }


    loginWithGoogleToken(
        response.credential
    )
    .catch(
        function(error) {

            console.error(
                "Credential login error:",
                error
            );

        }
    );

}



// ==========================================
// INITIALIZE GOOGLE LOGIN
// ==========================================

function initializeGoogleLogin() {

    if (
        typeof google ===
        "undefined"
    ) {

        console.warn(
            "Google Identity Services has not loaded yet."
        );

        return;

    }


    if (
        !google.accounts ||
        !google.accounts.id
    ) {

        console.warn(
            "Google Identity Services unavailable."
        );

        return;

    }


    google.accounts.id.initialize({

        client_id:
            GOOGLE_CLIENT_ID,

        callback:
            handleGoogleCredential,

        auto_select:
            false,

        cancel_on_tap_outside:
            true

    });


    const button =
        document.getElementById(
            "googleLoginButton"
        );


    if (button) {

        google.accounts.id.renderButton(

            button,

            {

                theme:
                    "outline",

                size:
                    "large",

                type:
                    "standard",

                text:
                    "signin_with",

                shape:
                    "rectangular",

                width:
                    280

            }

        );

    }

}



// ==========================================
// CHECK USER
// ==========================================
//
// IMPORTANT:
//
// Code.gs now requires a Google ID token.
//
// Therefore this function MUST send:
//
// action = checkUser
// token  = googleIdToken
//
// It must NOT send only the email.
//

async function checkCurrentUser() {

    if (!googleIdToken) {

        console.warn(
            "No Google ID token available for user verification."
        );

        return null;

    }


    try {

        const result =
            await apiRequest({

                action:
                    "checkUser",

                token:
                    googleIdToken

            });


        if (
            result.data
        ) {

            currentUser = {

                name:
                    result.data.name || "",

                email:
                    result.data.email || "",

                picture:
                    result.data.picture || "",

                isAdmin:
                    result.data.isAdmin === true

            };


            isAdminUser =
                currentUser.isAdmin;


            localStorage.setItem(

                "linktechUser",

                JSON.stringify(
                    currentUser
                )

            );


            updateLoginUI();


            fillCustomerInformation();

        }


        return result.data;

    }

    catch (error) {

        console.error(
            "checkUser error:",
            error
        );


        return null;

    }

}



// ==========================================
// LOGOUT
// ==========================================

function logoutUser() {

    clearUserSession();


    // Google logout
    try {

        if (
            typeof google !==
            "undefined" &&
            google.accounts &&
            google.accounts.id
        ) {

            google.accounts.id.disableAutoSelect();

        }

    }

    catch (error) {

        console.warn(
            "Google logout warning:",
            error
        );

    }


    updateLoginUI();


    showMessage(
        "You have been signed out.",
        "success"
    );


    const requestContainer =
        document.getElementById(
            "requestList"
        );


    if (requestContainer) {

        requestContainer.innerHTML =
            "";

    }


    closeAdminPanel();

}



// ==========================================
// UPDATE LOGIN UI
// ==========================================

function updateLoginUI() {

    const loginSection =
        document.getElementById(
            "loginSection"
        );


    const userSection =
        document.getElementById(
            "userSection"
        );


    const userName =
        document.getElementById(
            "userName"
        );


    const userEmail =
        document.getElementById(
            "userEmail"
        );


    const userPicture =
        document.getElementById(
            "userPicture"
        );


    if (
        currentUser &&
        currentUser.email
    ) {

        if (loginSection) {

            loginSection.style.display =
                "none";

        }


        if (userSection) {

            userSection.style.display =
                "";

        }


        if (userName) {

            userName.textContent =
                currentUser.name || "";

        }


        if (userEmail) {

            userEmail.textContent =
                currentUser.email || "";

        }


        if (userPicture) {

            userPicture.src =
                currentUser.picture || "";

        }

    }

    else {

        if (loginSection) {

            loginSection.style.display =
                "";

        }


        if (userSection) {

            userSection.style.display =
                "none";

        }

    }


    updateAdminUI();

}



// ==========================================
// ADMIN UI
// ==========================================

function updateAdminUI() {

    const adminElements =
        document.querySelectorAll(
            ".admin-only"
        );


    adminElements.forEach(
        function(element) {

            element.style.display =
                isAdminUser
                    ? ""
                    : "none";

        }
    );

}



// ==========================================
// INITIAL LOAD
// ==========================================

async function loadInitialData() {

    try {

        // ==================================
        // Verify user only when token exists
        // ==================================

        if (googleIdToken) {

            await checkCurrentUser();

        }


        // ==================================
        // Load customer data
        // ==================================

        if (
            currentUser &&
            currentUser.email
        ) {

            await Promise.all([

                loadMyRequests(),

                loadTimeline()

            ]);

        }

        else {

            await loadTimeline();

        }

    }

    catch (error) {

        console.error(
            "Initial data error:",
            error
        );

    }

}



// ==========================================
// MESSAGE HELPER
// ==========================================

function showMessage(
    message,
    type = "success"
) {

    const box =
        document.getElementById(
            "messageBox"
        );


    if (!box) {

        alert(message);

        return;

    }


    box.textContent =
        message;


    box.className =
        "message-box " +
        type;


    box.style.display =
        "block";


    setTimeout(
        function() {

            box.style.display =
                "none";

        },

        5000

    );

}



// ==========================================
// DOM READY
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    async function() {

        loadUserSession();


        updateLoginUI();


        fillCustomerInformation();


        try {

            initializeGoogleLogin();

        }

        catch (error) {

            console.error(
                "Google initialization error:",
                error
            );

        }


        await loadInitialData();

    }

);

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS - PART 2/4
// CUSTOMER CONCERNS + REQUESTS
// ==========================================


// ==========================================
// SUBMIT CUSTOMER CONCERN
// ==========================================

async function submitCustomerConcern() {

    // ======================================
    // LOGIN REQUIRED
    // ======================================

    if (
        !currentUser ||
        !currentUser.email
    ) {

        showMessage(
            "Please sign in with Google first.",
            "error"
        );

        return;

    }


    // ======================================
    // GET FORM ELEMENTS
    // ======================================

    const nameInput =
        document.getElementById(
            "name"
        );


    const addressInput =
        document.getElementById(
            "address"
        );


    const contactInput =
        document.getElementById(
            "contact"
        );


    const categoryInput =
        document.getElementById(
            "category"
        );


    const problemInput =
        document.getElementById(
            "problem"
        );


    // ======================================
    // READ VALUES
    // ======================================

    const name =
        nameInput
            ? nameInput.value.trim()
            : "";


    const address =
        addressInput
            ? addressInput.value.trim()
            : "";


    const contact =
        contactInput
            ? contactInput.value.trim()
            : "";


    const category =
        categoryInput
            ? categoryInput.value.trim()
            : "";


    const problem =
        problemInput
            ? problemInput.value.trim()
            : "";


    // ======================================
    // CLIENT VALIDATION
    // ======================================

    if (!name) {

        showMessage(
            "Full name is required.",
            "error"
        );

        return;

    }


    if (!address) {

        showMessage(
            "Complete address is required.",
            "error"
        );

        return;

    }


    if (!contact) {

        showMessage(
            "Contact number is required.",
            "error"
        );

        return;

    }


    if (!category) {

        showMessage(
            "Please select a concern category.",
            "error"
        );

        return;

    }


    if (!problem) {

        showMessage(
            "Please describe your concern.",
            "error"
        );

        return;

    }


    // ======================================
    // DISABLE SUBMIT BUTTON
    // ======================================

    const submitButton =
        document.getElementById(
            "submitConcernButton"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.dataset.originalText =
            submitButton.textContent;

        submitButton.textContent =
            "Submitting...";

    }


    try {

        // ==================================
        // SEND REQUEST
        // ==================================

        const result =
            await apiRequest({

                action:
                    "submitConcern",

                email:
                    currentUser.email,

                name:
                    name,

                address:
                    address,

                contact:
                    contact,

                category:
                    category,

                problem:
                    problem

            });


        // ==================================
        // SUCCESS
        // ==================================

        showMessage(

            result.message ||
            "Concern submitted successfully.",

            "success"

        );


        // ==================================
        // CLEAR FORM
        // ==================================

        if (addressInput) {

            addressInput.value =
                "";

        }


        if (contactInput) {

            contactInput.value =
                "";

        }


        if (categoryInput) {

            categoryInput.value =
                "";

        }


        if (problemInput) {

            problemInput.value =
                "";

        }


        // ==================================
        // REFRESH REQUESTS
        // ==================================

        await loadMyRequests();

    }

    catch (error) {

        console.error(
            "Submit concern error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                submitButton.dataset.originalText ||
                "Submit Concern";

        }

    }

}



// ==========================================
// LOAD CUSTOMER REQUESTS
// ==========================================

async function loadMyRequests() {

    if (
        !currentUser ||
        !currentUser.email
    ) {

        return [];

    }


    try {

        const result =
            await apiRequest({

                action:
                    "getMyRequests",

                email:
                    currentUser.email

            });


        const requests =
            Array.isArray(
                result.data
            )

                ? result.data

                : [];


        renderMyRequests(
            requests
        );


        return requests;

    }

    catch (error) {

        console.error(
            "Load requests error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );


        return [];

    }

}



// ==========================================
// RENDER CUSTOMER REQUESTS
// ==========================================

function renderMyRequests(
    requests
) {

    const container =
        document.getElementById(
            "requestList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !requests ||
        requests.length === 0
    ) {

        container.innerHTML =

            '<div class="empty-state">' +

            'No concerns submitted yet.' +

            '</div>';

        return;

    }


    requests.forEach(
        function(request) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "request-card";


            const statusClass =
                String(
                    request.status || ""
                )
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );


            const dateText =
                formatDate(
                    request.date
                );


            card.innerHTML =

                '<div class="request-header">' +

                    '<h3>' +

                        escapeHTML(
                            request.category
                        ) +

                    '</h3>' +

                    '<span class="status ' +

                        escapeHTML(
                            statusClass
                        ) +

                    '">' +

                        escapeHTML(
                            request.status
                        ) +

                    '</span>' +

                '</div>' +


                '<div class="request-body">' +

                    '<p><strong>Reference ID:</strong> ' +

                        escapeHTML(
                            request.id
                        ) +

                    '</p>' +

                    '<p><strong>Problem:</strong><br>' +

                        escapeHTML(
                            request.problem
                        ) +

                    '</p>' +

                    '<p><strong>Address:</strong> ' +

                        escapeHTML(
                            request.address
                        ) +

                    '</p>' +

                    '<p><strong>Contact:</strong> ' +

                        escapeHTML(
                            request.contact
                        ) +

                    '</p>' +

                    '<p><strong>Date:</strong> ' +

                        escapeHTML(
                            dateText
                        ) +

                    '</p>' +

                '</div>';


            container.appendChild(
                card
            );

        }
    );

}



// ==========================================
// DATE FORMATTER
// ==========================================

function formatDate(
    value
) {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString(
        "en-PH",
        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }
    );

}



// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value === null ||
        value === undefined

            ? ""

            : String(value);


    return div.innerHTML;

}



// ==========================================
// AUTO-FILL CUSTOMER INFORMATION
// ==========================================

function fillCustomerInformation() {

    if (
        !currentUser
    ) {

        return;

    }


    const nameInput =
        document.getElementById(
            "name"
        );


    const emailInput =
        document.getElementById(
            "email"
        );


    if (nameInput) {

        nameInput.value =
            currentUser.name || "";

    }


    if (emailInput) {

        emailInput.value =
            currentUser.email || "";

    }

}



// ==========================================
// WATCH LOGIN STATE
// ==========================================

function refreshCustomerUI() {

    fillCustomerInformation();

    updateLoginUI();

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS - PART 3/4
// TIMELINE + COMMENTS
// ==========================================


// ==========================================
// LOAD TIMELINE
// ==========================================

async function loadTimeline() {

    try {

        const result =
            await apiRequest({

                action:
                    "getTimeline"

            });


        const posts =
            Array.isArray(
                result.data
            )

                ? result.data

                : [];


        renderTimeline(
            posts
        );


        return posts;

    }

    catch (error) {

        console.error(
            "Load timeline error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );


        return [];

    }

}



// ==========================================
// RENDER TIMELINE
// ==========================================

function renderTimeline(
    posts
) {

    const container =
        document.getElementById(
            "timelineList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !posts ||
        posts.length === 0
    ) {

        container.innerHTML =

            '<div class="empty-state">' +

            'No timeline posts available.' +

            '</div>';

        return;

    }


    posts.forEach(
        function(post) {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "timeline-post";


            const imageHTML =
                post.image

                    ?

                    '<img src="' +

                    escapeAttribute(
                        post.image
                    ) +

                    '" alt="' +

                    escapeAttribute(
                        post.title
                    ) +

                    '" class="timeline-image" ' +

                    'onerror="this.style.display=\'none\'">'

                    : "";


            article.innerHTML =

                imageHTML +

                '<div class="timeline-content">' +

                    '<h2>' +

                        escapeHTML(
                            post.title
                        ) +

                    '</h2>' +

                    '<p>' +

                        escapeHTML(
                            post.caption
                        ) +

                    '</p>' +

                    '<div class="timeline-meta">' +

                        '<span>' +

                            escapeHTML(
                                post.postedBy
                            ) +

                        '</span>' +

                        '<span>' +

                            escapeHTML(
                                formatDate(
                                    post.date
                                )
                            ) +

                        '</span>' +

                    '</div>' +

                    '<button type="button" ' +

                        'class="comment-toggle" ' +

                        'data-post-id="' +

                        escapeAttribute(
                            post.id
                        ) +

                    '">' +

                        'Show Comments' +

                    '</button>' +

                    '<div class="comment-section" ' +

                        'id="comments-' +

                        escapeAttribute(
                            post.id
                        ) +

                        '" ' +

                        'style="display:none;">' +

                    '</div>' +

                '</div>';


            container.appendChild(
                article
            );

        }
    );


    // ======================================
    // COMMENT BUTTONS
    // ======================================

    container
        .querySelectorAll(
            ".comment-toggle"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        toggleComments(
                            button.dataset.postId,
                            button
                        );

                    }
                );

            }
        );

}



// ==========================================
// ESCAPE ATTRIBUTE
// ==========================================

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
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



// ==========================================
// TOGGLE COMMENTS
// ==========================================

async function toggleComments(
    postId,
    button
) {

    const container =
        document.getElementById(
            "comments-" +
            postId
        );


    if (!container) {

        return;

    }


    if (
        container.style.display ===
        "block"
    ) {

        container.style.display =
            "none";


        button.textContent =
            "Show Comments";


        return;

    }


    container.style.display =
        "block";


    button.textContent =
        "Hide Comments";


    await loadComments(
        postId
    );

}



// ==========================================
// LOAD COMMENTS
// ==========================================

async function loadComments(
    postId
) {

    const container =
        document.getElementById(
            "comments-" +
            postId
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "<p>Loading comments...</p>";


    try {

        const result =
            await apiRequest({

                action:
                    "getComments",

                postId:
                    postId

            });


        const comments =
            Array.isArray(
                result.data
            )

                ? result.data

                : [];


        renderComments(
            postId,
            comments
        );

    }

    catch (error) {

        console.error(
            "Load comments error:",
            error
        );


        container.innerHTML =

            "<p>" +

            escapeHTML(
                error.message
            ) +

            "</p>";

    }

}



// ==========================================
// RENDER COMMENTS
// ==========================================

function renderComments(
    postId,
    comments
) {

    const container =
        document.getElementById(
            "comments-" +
            postId
        );


    if (!container) {

        return;

    }


    let html =
        "";


    if (
        comments.length === 0
    ) {

        html +=

            '<p class="no-comments">' +

            'No comments yet.' +

            '</p>';

    }


    comments.forEach(
        function(comment) {

            html +=

                '<div class="comment-item">' +

                    '<strong>' +

                        escapeHTML(
                            comment.name ||
                            comment.email ||
                            "User"
                        ) +

                    '</strong>' +

                    '<p>' +

                        escapeHTML(
                            comment.comment ||
                            comment.text ||
                            ""
                        ) +

                    '</p>' +

                    '<small>' +

                        escapeHTML(
                            formatDate(
                                comment.date
                            )
                        ) +

                    '</small>' +

                '</div>';

        }
    );


    // ======================================
    // COMMENT FORM
    // ======================================

    if (
        currentUser &&
        currentUser.email
    ) {

        html +=

            '<div class="comment-form">' +

                '<textarea ' +

                    'id="comment-input-' +

                    escapeAttribute(
                        postId
                    ) +

                    '" ' +

                    'placeholder="Write a comment..." ' +

                    'maxlength="1000"></textarea>' +

                '<button type="button" ' +

                    'onclick="submitPostComment(\'' +

                    escapeAttribute(
                        postId
                    ) +

                    '\')">' +

                    'Post Comment' +

                '</button>' +

            '</div>';

    }

    else {

        html +=

            '<p>Please sign in with Google to comment.</p>';

    }


    container.innerHTML =
        html;

}



// ==========================================
// SUBMIT COMMENT
// ==========================================

async function submitPostComment(
    postId
) {

    if (
        !currentUser ||
        !currentUser.email
    ) {

        showMessage(
            "Please sign in with Google first.",
            "error"
        );

        return;

    }


    const input =
        document.getElementById(
            "comment-input-" +
            postId
        );


    if (!input) {

        return;

    }


    const comment =
        input.value.trim();


    if (!comment) {

        showMessage(
            "Please enter a comment.",
            "error"
        );

        return;

    }


    if (
        comment.length > 1000
    ) {

        showMessage(
            "Comment must not exceed 1000 characters.",
            "error"
        );

        return;

    }


    try {

        await apiRequest({

            action:
                "submitComment",

            email:
                currentUser.email,

            name:
                currentUser.name || "",

            postId:
                postId,

            comment:
                comment

        });


        input.value =
            "";


        showMessage(
            "Comment posted successfully.",
            "success"
        );


        await loadComments(
            postId
        );

    }

    catch (error) {

        console.error(
            "Submit comment error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}



// ==========================================
// REFRESH TIMELINE
// ==========================================

async function refreshTimeline() {

    await loadTimeline();

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS - PART 4/4
// ADMIN DASHBOARD + STATUS + POST MANAGEMENT
// ==========================================


// ==========================================
// LOAD ADMIN DATA
// ==========================================

async function loadAdminData(
    filter = "all"
) {

    if (
        !currentUser ||
        !currentUser.email
    ) {

        showMessage(
            "Please sign in first.",
            "error"
        );

        return null;

    }


    if (!isAdminUser) {

        showMessage(
            "Administrator access required.",
            "error"
        );

        return null;

    }


    try {

        const result =
            await apiRequest({

                action:
                    "getAdminData",

                email:
                    currentUser.email,

                filter:
                    filter

            });


        const data =
            result.data || {};


        renderAdminSummary(
            data.summary
        );


        renderAdminRequests(
            data.requests || []
        );


        return data;

    }

    catch (error) {

        console.error(
            "Admin data error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );


        return null;

    }

}



// ==========================================
// RENDER ADMIN SUMMARY
// ==========================================

function renderAdminSummary(
    summary
) {

    if (!summary) {

        return;

    }


    setText(
        "totalRequests",
        summary.totalRequests
    );


    setText(
        "pendingCount",
        summary.pending
    );


    setText(
        "processingCount",
        summary.processing
    );


    setText(
        "completedCount",
        summary.completed
    );


    setText(
        "abortedCount",
        summary.aborted
    );

}



// ==========================================
// SET TEXT HELPER
// ==========================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value === undefined ||
            value === null

                ? "0"

                : String(value);

    }

}



// ==========================================
// RENDER ADMIN REQUESTS
// ==========================================

function renderAdminRequests(
    requests
) {

    const container =
        document.getElementById(
            "adminRequestList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        !requests ||
        requests.length === 0
    ) {

        container.innerHTML =

            '<div class="empty-state">' +

            'No customer concerns found.' +

            '</div>';

        return;

    }


    requests.forEach(
        function(request) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "admin-request-card";


            card.innerHTML =

                '<div class="admin-request-header">' +

                    '<div>' +

                        '<h3>' +

                            escapeHTML(
                                request.name
                            ) +

                        '</h3>' +

                        '<small>' +

                            escapeHTML(
                                request.email
                            ) +

                        '</small>' +

                    '</div>' +

                    '<span class="status">' +

                        escapeHTML(
                            request.status
                        ) +

                    '</span>' +

                '</div>' +


                '<div class="admin-request-body">' +

                    '<p><strong>Reference ID:</strong><br>' +

                        escapeHTML(
                            request.id
                        ) +

                    '</p>' +

                    '<p><strong>Category:</strong> ' +

                        escapeHTML(
                            request.category
                        ) +

                    '</p>' +

                    '<p><strong>Contact:</strong> ' +

                        escapeHTML(
                            request.contact
                        ) +

                    '</p>' +

                    '<p><strong>Address:</strong> ' +

                        escapeHTML(
                            request.address
                        ) +

                    '</p>' +

                    '<p><strong>Problem:</strong><br>' +

                        escapeHTML(
                            request.problem
                        ) +

                    '</p>' +

                    '<p><strong>Date:</strong> ' +

                        escapeHTML(
                            formatDate(
                                request.date
                            )
                        ) +

                    '</p>' +

                '</div>' +


                '<div class="admin-status-controls">' +

                    '<select class="status-select" ' +

                        'data-id="' +

                        escapeAttribute(
                            request.id
                        ) +

                    '">' +

                        createStatusOption(
                            "Pending",
                            request.status
                        ) +

                        createStatusOption(
                            "Processing",
                            request.status
                        ) +

                        createStatusOption(
                            "Completed",
                            request.status
                        ) +

                        createStatusOption(
                            "Aborted",
                            request.status
                        ) +

                    '</select>' +

                    '<button type="button" ' +

                        'class="update-status-button" ' +

                        'data-id="' +

                        escapeAttribute(
                            request.id
                        ) +

                    '">' +

                        'Update Status' +

                    '</button>' +

                '</div>';


            container.appendChild(
                card
            );

        }
    );


    // ======================================
    // STATUS BUTTONS
    // ======================================

    container
        .querySelectorAll(
            ".update-status-button"
        )
        .forEach(
            function(button) {

                button.addEventListener(

                    "click",

                    async function() {

                        const id =
                            button.dataset.id;


                        const select =
                            container.querySelector(

                                '.status-select[data-id="' +

                                CSS.escape(
                                    id
                                ) +

                                '"]'

                            );


                        if (!select) {

                            return;

                        }


                        await updateConcernStatusFromUI(

                            id,

                            select.value,

                            button

                        );

                    }

                );

            }
        );

}



// ==========================================
// STATUS OPTION
// ==========================================

function createStatusOption(
    value,
    current
) {

    return (

        '<option value="' +

        escapeAttribute(
            value
        ) +

        '"' +

        (

            value === current

                ? " selected"

                : ""

        ) +

        ">" +

        escapeHTML(
            value
        ) +

        "</option>"

    );

}



// ==========================================
// UPDATE CONCERN STATUS
// ==========================================

async function updateConcernStatusFromUI(
    id,
    status,
    button
) {

    if (!isAdminUser) {

        showMessage(
            "Administrator access required.",
            "error"
        );

        return;

    }


    if (
        !id ||
        !status
    ) {

        return;

    }


    if (button) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Updating...";

    }


    try {

        const result =
            await apiRequest({

                action:
                    "updateConcernStatus",

                email:
                    currentUser.email,

                id:
                    id,

                status:
                    status

            });


        showMessage(

            result.message ||
            "Status updated successfully.",

            "success"

        );


        await loadAdminData(
            "all"
        );


        if (
            currentUser &&
            currentUser.email
        ) {

            await loadMyRequests();

        }

    }

    catch (error) {

        console.error(
            "Update status error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.textContent =
                button.dataset.originalText ||
                "Update Status";

        }

    }

}



// ==========================================
// ADMIN FILTER
// ==========================================

async function applyAdminFilter(
    filter
) {

    if (!filter) {

        filter =
            "all";

    }


    await loadAdminData(
        filter
    );

}



// ==========================================
// CREATE TIMELINE POST
// ==========================================

async function adminCreatePost() {

    if (!isAdminUser) {

        showMessage(
            "Administrator access required.",
            "error"
        );

        return;

    }


    const titleInput =
        document.getElementById(
            "postTitle"
        );


    const captionInput =
        document.getElementById(
            "postCaption"
        );


    const imageInput =
        document.getElementById(
            "postImage"
        );


    const title =
        titleInput
            ? titleInput.value.trim()
            : "";


    const caption =
        captionInput
            ? captionInput.value.trim()
            : "";


    const image =
        imageInput
            ? imageInput.value.trim()
            : "";


    if (!title) {

        showMessage(
            "Post title required.",
            "error"
        );

        return;

    }


    try {

        await apiRequest({

            action:
                "createPost",

            email:
                currentUser.email,

            title:
                title,

            caption:
                caption,

            image:
                image

        });


        showMessage(
            "Timeline post created successfully.",
            "success"
        );


        if (titleInput) {

            titleInput.value =
                "";

        }


        if (captionInput) {

            captionInput.value =
                "";

        }


        if (imageInput) {

            imageInput.value =
                "";

        }


        await loadTimeline();

    }

    catch (error) {

        console.error(
            "Create post error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}



// ==========================================
// UPDATE TIMELINE POST
// ==========================================

async function adminUpdatePost(
    id,
    title,
    caption,
    image
) {

    if (!isAdminUser) {

        showMessage(
            "Administrator access required.",
            "error"
        );

        return;

    }


    if (!id) {

        showMessage(
            "Post ID required.",
            "error"
        );

        return;

    }


    try {

        const result =
            await apiRequest({

                action:
                    "updatePost",

                email:
                    currentUser.email,

                id:
                    id,

                title:
                    title || "",

                caption:
                    caption || "",

                image:
                    image || ""

            });


        showMessage(

            result.message ||
            "Timeline post updated.",

            "success"

        );


        await loadTimeline();

    }

    catch (error) {

        console.error(
            "Update post error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}



// ==========================================
// DELETE TIMELINE POST
// ==========================================

async function adminDeletePost(
    id
) {

    if (!isAdminUser) {

        showMessage(
            "Administrator access required.",
            "error"
        );

        return;

    }


    if (!id) {

        showMessage(
            "Post ID required.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete this timeline post?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const result =
            await apiRequest({

                action:
                    "deletePost",

                email:
                    currentUser.email,

                id:
                    id

            });


        showMessage(

            result.message ||
            "Timeline post deleted.",

            "success"

        );


        await loadTimeline();

    }

    catch (error) {

        console.error(
            "Delete post error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}



// ==========================================
// LOAD ADMIN PANEL
// ==========================================

async function openAdminPanel() {

    if (
        !currentUser ||
        !currentUser.email
    ) {

        showMessage(
            "Please sign in first.",
            "error"
        );

        return;

    }


    if (!isAdminUser) {

        showMessage(
            "Administrator access required.",
            "error"
        );

        return;

    }


    const panel =
        document.getElementById(
            "adminPanel"
        );


    if (panel) {

        panel.style.display =
            "block";

    }


    await loadAdminData(
        "all"
    );

}



// ==========================================
// CLOSE ADMIN PANEL
// ==========================================

function closeAdminPanel() {

    const panel =
        document.getElementById(
            "adminPanel"
        );


    if (panel) {

        panel.style.display =
            "none";

    }

}



// ==========================================
// REFRESH EVERYTHING
// ==========================================

async function refreshAllData() {

    try {

        await loadTimeline();


        if (
            currentUser &&
            currentUser.email
        ) {

            await loadMyRequests();

        }


        if (
            isAdminUser
        ) {

            await loadAdminData(
                "all"
            );

        }


        showMessage(
            "Data refreshed successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Refresh error:",
            error
        );


        showMessage(
            error.message,
            "error"
        );

    }

}



// ==========================================
// GLOBAL FUNCTIONS
// ==========================================
//
// These make functions available to HTML
// onclick="" handlers.
//

window.loginWithGoogleToken =
    loginWithGoogleToken;

window.handleGoogleCredential =
    handleGoogleCredential;

window.logoutUser =
    logoutUser;

window.submitCustomerConcern =
    submitCustomerConcern;

window.loadMyRequests =
    loadMyRequests;

window.loadTimeline =
    loadTimeline;

window.submitPostComment =
    submitPostComment;

window.loadComments =
    loadComments;

window.loadAdminData =
    loadAdminData;

window.applyAdminFilter =
    applyAdminFilter;

window.updateConcernStatusFromUI =
    updateConcernStatusFromUI;

window.adminCreatePost =
    adminCreatePost;

window.adminUpdatePost =
    adminUpdatePost;

window.adminDeletePost =
    adminDeletePost;

window.openAdminPanel =
    openAdminPanel;

window.closeAdminPanel =
    closeAdminPanel;

window.refreshAllData =
    refreshAllData;