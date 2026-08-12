// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// UPDATED VERSION
// PART 1/4
// GOOGLE LOGIN + SESSION + ADMIN AUTH
// ==========================================


// ==========================================
// GOOGLE CLIENT ID
// ==========================================

const GOOGLE_CLIENT_ID =
"495855477306-9rdg89fh3g5mtolu8th08ltojor8lkkr.apps.googleusercontent.com";


// ==========================================
// GOOGLE APPS SCRIPT API
// ==========================================

const API_URL =
"https://script.google.com/macros/s/AKfycbwTMkv0ch-JeM7cePjY-Qb0mWnG8nlKE2SbjJ_9L5aCsAbKSZaoWuHaoLlA0KCk4mhP/exec";


// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;

let isAdmin = false;

let googleInitialized = false;


// ==========================================
// ADMIN STATUS
// IMPORTANT:
// NO ADMIN EMAIL IS STORED HERE.
// Code.gs decides whether the user is admin.
// ==========================================


// ==========================================
// STATUS DEFINITIONS
// ==========================================

const CONCERN_STATUS = {

    PENDING: "Pending",

    PROCESSING: "Processing",

    COMPLETED: "Completed",

    ABORTED: "Aborted"

};


// ==========================================
// START SYSTEM
// ==========================================

window.addEventListener(
    "load",
    function(){

        console.log(
            "LinkTech Home.js loaded."
        );


        restoreSession();

        initializeGoogle();

        loadTimeline();

    }
);


// ==========================================
// RESTORE SESSION
// ==========================================

function restoreSession(){

    try{

        const saved =
            localStorage.getItem(
                "linktechUser"
            );


        if(!saved){

            console.log(
                "No saved LinkTech session."
            );

            return;

        }


        const user =
            JSON.parse(saved);


        if(
            !user ||
            !user.email
        ){

            localStorage.removeItem(
                "linktechUser"
            );

            return;

        }


        currentUser =
            user;


        isAdmin =
            currentUser.isAdmin === true;


        console.log(
            "Session restored:",
            currentUser.email
        );


        showUser();


        applyAdminAccess();

    }

    catch(error){

        console.error(
            "Session restore error:",
            error
        );


        localStorage.removeItem(
            "linktechUser"
        );


        currentUser =
            null;

        isAdmin =
            false;

    }

}


// ==========================================
// INITIALIZE GOOGLE SIGN-IN
// ==========================================

function initializeGoogle(){

    console.log(
        "Initializing Google Sign-In..."
    );


    if(
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
    ){

        console.log(
            "Google Identity Services not ready."
        );


        setTimeout(
            initializeGoogle,
            500
        );


        return;

    }


    if(googleInitialized){

        return;

    }


    google.accounts.id.initialize({

        client_id:
            GOOGLE_CLIENT_ID,

        callback:
            handleGoogleLogin,

        auto_select:
            false,

        cancel_on_tap_outside:
            true

    });


    googleInitialized =
        true;


    renderGoogleButton();

}


// ==========================================
// RENDER GOOGLE BUTTON
// ==========================================

function renderGoogleButton(){

    const button =
        document.getElementById(
            "googleLoginButton"
        );


    if(!button){

        console.warn(
            "googleLoginButton was not found."
        );

        return;

    }


    button.innerHTML =
        "";


    google.accounts.id.renderButton(

        button,

        {

            theme:
                "outline",

            size:
                "large",

            width:
                300,

            text:
                "signin_with",

            shape:
                "rectangular"

        }

    );


    button.style.display =
        "flex";


    button.style.visibility =
        "visible";


    console.log(
        "Google Sign-In button rendered."
    );

}


// ==========================================
// GOOGLE LOGIN RESPONSE
// ==========================================

function handleGoogleLogin(response){

    console.log(
        "Google login response received."
    );


    if(
        !response ||
        !response.credential
    ){

        alert(
            "Google login failed. No credential received."
        );

        return;

    }


    verifyGoogle(
        response.credential
    );

}


// ==========================================
// VERIFY GOOGLE ACCOUNT
// ==========================================

function verifyGoogle(token){

    if(!token){

        alert(
            "Google token is missing."
        );

        return;

    }


    console.log(
        "Verifying Google account..."
    );


    postAPI({

        action:
            "googleLogin",

        token:
            token

    })

    .then(function(data){

        console.log(
            "Google login response:",
            data
        );


        if(!data.success){

            throw new Error(
                data.message ||
                "Google login failed."
            );

        }


        currentUser =
            data.data;


        if(
            !currentUser ||
            !currentUser.email
        ){

            throw new Error(
                "Invalid user information returned by server."
            );

        }


        /*
         * IMPORTANT:
         *
         * isAdmin comes from Code.gs.
         * No admin email is exposed here.
         */

        isAdmin =
            currentUser.isAdmin === true;


        localStorage.setItem(

            "linktechUser",

            JSON.stringify(
                currentUser
            )

        );


        showUser();

        applyAdminAccess();


        loadTimeline();


        if(isAdmin){

            loadAdminData();

        }


        console.log(
            "Login successful:",
            currentUser.email
        );

    })

    .catch(function(error){

        console.error(
            "Google login error:",
            error
        );


        alert(
            error.message ||
            "Unable to connect to LinkTech login service."
        );

    });

}


// ==========================================
// GENERIC POST API
// IMPORTANT
// Sends URL-encoded parameters so Apps Script
// can read e.parameter correctly.
// ==========================================

function postAPI(data){

    const params =
        new URLSearchParams();


    Object.keys(data || {})
        .forEach(function(key){

            params.append(
                key,
                data[key] === undefined ||
                data[key] === null
                    ? ""
                    : String(data[key])
            );

        });


    return fetch(

        API_URL,

        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8"

            },

            body:
                params.toString()

        }

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP error: " +
                response.status
            );

        }


        return response.json();

    });

}


// ==========================================
// SHOW USER
// ==========================================

function showUser(){

    if(!currentUser){

        return;

    }


    const login =
        document.getElementById(
            "googleLoginButton"
        );


    if(login){

        login.style.display =
            "none";

    }


    const profile =
        document.getElementById(
            "userProfile"
        );


    if(profile){

        profile.style.display =
            "block";

    }


    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if(dashboard){

        dashboard.style.display =
            "block";

    }


    const name =
        document.getElementById(
            "userName"
        );


    if(name){

        name.textContent =
            currentUser.name ||
            "";

    }


    const email =
        document.getElementById(
            "userEmail"
        );


    if(email){

        email.textContent =
            currentUser.email ||
            "";

    }


    const image =
        document.getElementById(
            "userImage"
        );


    if(image){

        image.src =
            currentUser.picture ||
            "";

    }


    const inputName =
        document.getElementById(
            "name"
        );


    if(inputName){

        inputName.value =
            currentUser.name ||
            "";

    }


    const inputEmail =
        document.getElementById(
            "email"
        );


    if(inputEmail){

        inputEmail.value =
            currentUser.email ||
            "";

    }

}


// ==========================================
// APPLY ADMIN ACCESS
// ==========================================

function applyAdminAccess(){

    const adminPanel =
        document.getElementById(
            "adminPanel"
        );


    const timelineAdmin =
        document.getElementById(
            "timelineAdmin"
        );


    if(isAdmin){

        console.log(
            "ADMIN ACCESS GRANTED."
        );


        if(adminPanel){

            adminPanel.style.display =
                "block";

        }


        if(timelineAdmin){

            timelineAdmin.style.display =
                "block";

        }


        loadAdminData();

    }

    else{

        console.log(
            "Regular customer account."
        );


        if(adminPanel){

            adminPanel.style.display =
                "none";

        }


        if(timelineAdmin){

            timelineAdmin.style.display =
                "none";

        }

    }

}


// ==========================================
// ADMIN ACCESS CHECK
// ==========================================

function requireAdmin(){

    if(!currentUser){

        alert(
            "Please login first."
        );

        return false;

    }


    if(!isAdmin){

        alert(
            "Admin access required."
        );

        return false;

    }


    return true;

}


// ==========================================
// LOGOUT
// ==========================================

function logoutUser(){

    console.log(
        "Logging out..."
    );


    localStorage.removeItem(
        "linktechUser"
    );


    currentUser =
        null;


    isAdmin =
        false;


    if(
        window.google &&
        google.accounts &&
        google.accounts.id
    ){

        google.accounts.id.disableAutoSelect();

    }


    location.reload();

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 2/4
// ADMIN DASHBOARD + FILTERS + STATUS
// ==========================================


// ==========================================
// NORMALIZE STATUS
// ==========================================

function normalizeConcernStatus(status){

    if(!status){

        return CONCERN_STATUS.PENDING;

    }


    const value =
        String(status)
        .trim()
        .toLowerCase();


    switch(value){

        case "pending":

            return CONCERN_STATUS.PENDING;


        case "processing":

            return CONCERN_STATUS.PROCESSING;


        case "completed":

        case "complete":

        case "done":

            return CONCERN_STATUS.COMPLETED;


        case "aborted":

        case "abort":

        case "cancelled":

        case "canceled":

            return CONCERN_STATUS.ABORTED;


        default:

            return CONCERN_STATUS.PENDING;

    }

}


// ==========================================
// STATUS CSS CLASS
// ==========================================

function getStatusClass(status){

    switch(
        normalizeConcernStatus(status)
    ){

        case CONCERN_STATUS.PENDING:

            return "status-pending";


        case CONCERN_STATUS.PROCESSING:

            return "status-processing";


        case CONCERN_STATUS.COMPLETED:

            return "status-completed";


        case CONCERN_STATUS.ABORTED:

            return "status-aborted";


        default:

            return "status-unknown";

    }

}


// ==========================================
// SAFE HTML
// ==========================================

function escapeHTML(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(value)

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


// ==========================================
// LOAD ADMIN DATA
// ==========================================

function loadAdminData(){

    if(!requireAdmin()){

        return;

    }


    loadAdminDashboard();

    loadAdminConcerns();

}


// ==========================================
// LOAD ADMIN DASHBOARD
// ==========================================

function loadAdminDashboard(){

    if(!requireAdmin()){

        return;

    }


    fetch(

        API_URL +
        "?action=getAdminData" +
        "&email=" +
        encodeURIComponent(
            currentUser.email
        ) +
        "&filter=all"

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP error: " +
                response.status
            );

        }


        return response.json();

    })

    .then(function(result){

        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const data =
            result.data || {};


        const summary =
            data.summary || {};


        setText(
            "totalConcerns",
            summary.totalRequests || 0
        );


        setText(
            "pending",
            summary.pending || 0
        );


        setText(
            "processing",
            summary.processing || 0
        );


        setText(
            "completed",
            summary.completed || 0
        );


        setText(
            "aborted",
            summary.aborted || 0
        );


        setText(
            "newConcerns",
            summary.newConcerns || 0
        );

    })

    .catch(function(error){

        console.error(
            "Admin dashboard error:",
            error
        );

    });

}


// ==========================================
// SET ELEMENT TEXT
// ==========================================

function setText(id,value){

    const element =
        document.getElementById(id);


    if(element){

        element.textContent =
            value;

    }

}


// ==========================================
// GET ADMIN FILTER VALUES
// ==========================================

function getAdminFilters(){

    const periodElement =
        document.getElementById(
            "reportType"
        );


    const statusElement =
        document.getElementById(
            "statusFilter"
        );


    const categoryElement =
        document.getElementById(
            "categoryFilter"
        );


    return {

        period:
            periodElement
                ? periodElement.value
                : "all",

        status:
            statusElement
                ? statusElement.value
                : "all",

        category:
            categoryElement
                ? categoryElement.value
                : "all"

    };

}


// ==========================================
// FILTER DATE
// ==========================================

function matchesPeriod(dateValue,period){

    if(
        period === "all" ||
        !period
    ){

        return true;

    }


    const date =
        new Date(dateValue);


    if(
        isNaN(
            date.getTime()
        )
    ){

        return false;

    }


    const now =
        new Date();


    if(period === "new"){

        /*
         * New = Pending concerns.
         * Actual status is handled separately.
         */

        return true;

    }


    if(period === "week"){

        const start =
            new Date(now);

        start.setDate(
            now.getDate() - 7
        );

        return date >= start;

    }


    if(period === "month"){

        return (
            date.getMonth() ===
            now.getMonth()
        ) &&
        (
            date.getFullYear() ===
            now.getFullYear()
        );

    }


    if(period === "lastMonth"){

        const firstThisMonth =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );


        const firstLastMonth =
            new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1
            );


        return (
            date >= firstLastMonth &&
            date < firstThisMonth
        );

    }


    return true;

}


// ==========================================
// LOAD ADMIN CONCERNS
// ==========================================

function loadAdminConcerns(){

    if(!requireAdmin()){

        return;

    }


    const box =
        document.getElementById(
            "adminConcerns"
        );


    if(!box){

        console.warn(
            "adminConcerns element not found."
        );

        return;

    }


    box.innerHTML =
        "<p>Loading customer concerns...</p>";


    const filters =
        getAdminFilters();


    fetch(

        API_URL +
        "?action=getAdminData" +
        "&email=" +
        encodeURIComponent(
            currentUser.email
        ) +
        "&filter=" +
        encodeURIComponent(
            filters.period
        )

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP error: " +
                response.status
            );

        }


        return response.json();

    })

    .then(function(result){

        console.log(
            "ADMIN DATA:",
            result
        );


        if(!result.success){

            box.innerHTML =
                `<p class="error-message">
                    ${escapeHTML(
                        result.message ||
                        "Unable to load concerns."
                    )}
                </p>`;

            return;

        }


        let data = [];


        if(
            result.data &&
            Array.isArray(
                result.data.requests
            )
        ){

            data =
                result.data.requests;

        }


        /*
         * CLIENT-SIDE STATUS FILTER
         */

        if(
            filters.status &&
            filters.status !== "all"
        ){

            data =
                data.filter(
                    function(item){

                        return normalizeConcernStatus(
                            item.status
                        ).toLowerCase()
                        ===
                        filters.status.toLowerCase();

                    }
                );

        }


        /*
         * CLIENT-SIDE CATEGORY FILTER
         */

        if(
            filters.category &&
            filters.category !== "all"
        ){

            data =
                data.filter(
                    function(item){

                        return String(
                            item.category || ""
                        )
                        .toLowerCase()
                        ===
                        String(
                            filters.category
                        )
                        .toLowerCase();

                    }
                );

        }


        /*
         * NEW CONCERNS
         *
         * New = Pending.
         */

        if(
            filters.period === "new"
        ){

            data =
                data.filter(
                    function(item){

                        return normalizeConcernStatus(
                            item.status
                        ) ===
                        CONCERN_STATUS.PENDING;

                    }
                );

        }


        /*
         * LOCAL DATE FILTER
         *
         * Needed for lastMonth because
         * Code.gs may not implement it yet.
         */

        if(
            filters.period === "lastMonth"
        ){

            data =
                data.filter(
                    function(item){

                        return matchesPeriod(
                            item.date,
                            "lastMonth"
                        );

                    }
                );

        }


        renderAdminConcernTable(
            data
        );

    })

    .catch(function(error){

        console.error(
            "Admin concern loading error:",
            error
        );


        box.innerHTML =
            `<p class="error-message">
                Unable to connect to the LinkTech API.
            </p>`;

    });

}


// ==========================================
// REFRESH ADMIN DATA
// ==========================================

function refreshAdminData(){

    if(!requireAdmin()){

        return;

    }


    loadAdminData();

}


// ==========================================
// FILTER CHANGE
// ==========================================

function applyConcernFilters(){

    if(!requireAdmin()){

        return;

    }


    loadAdminConcerns();

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 3/4
// ADMIN CONCERN TABLE + STATUS UPDATE
// ==========================================


// ==========================================
// RENDER ADMIN CONCERN TABLE
// ==========================================

function renderAdminConcernTable(data){

    const box =
        document.getElementById(
            "adminConcerns"
        );


    if(!box){

        return;

    }


    if(
        !Array.isArray(data) ||
        data.length === 0
    ){

        box.innerHTML =

            `<div class="no-concerns">

                <p>
                    No customer concerns found.
                </p>

            </div>`;

        return;

    }


    let html = `

        <div class="admin-table-wrapper">

            <table class="admin-concern-table">

                <thead>

                    <tr>

                        <th class="col-id">
                            Concern ID
                        </th>

                        <th class="col-customer">
                            Customer
                        </th>

                        <th>
                            Email
                        </th>

                        <th class="col-category">
                            Category
                        </th>

                        <th class="col-problem">
                            Problem
                        </th>

                        <th class="col-date">
                            Date
                        </th>

                        <th class="col-status">
                            Status
                        </th>

                        <th class="col-action">
                            Action
                        </th>

                    </tr>

                </thead>

                <tbody>
    `;


    data.forEach(function(item){

        const status =
            normalizeConcernStatus(
                item.status
            );


        const statusClass =
            getStatusClass(
                status
            );


        /*
         * New concern indicator
         */

        const isNew =
            status ===
            CONCERN_STATUS.PENDING;


        html += `

            <tr>

                <td class="col-id">

                    ${escapeHTML(
                        item.id || ""
                    )}

                    ${
                        isNew

                        ?

                        `<span class="new-concern">
                            NEW
                        </span>`

                        :

                        ""
                    }

                </td>


                <td class="col-customer">

                    <strong>
                        ${escapeHTML(
                            item.name ||
                            "Unknown"
                        )}
                    </strong>

                </td>


                <td>

                    ${escapeHTML(
                        item.email ||
                        ""
                    )}

                </td>


                <td class="col-category">

                    ${escapeHTML(
                        item.category ||
                        "General"
                    )}

                </td>


                <td class="problem-cell">

                    ${escapeHTML(
                        item.problem ||
                        ""
                    )}

                </td>


                <td class="col-date">

                    ${formatDate(
                        item.date
                    )}

                </td>


                <td class="col-status">

                    <span class="${statusClass}">
                        ${escapeHTML(status)}
                    </span>

                </td>


                <td class="col-action">

                    <div class="admin-action-buttons">

                        <button
                            type="button"
                            class="pending-btn"
                            onclick="updateConcern(
                                '${escapeJS(item.id)}',
                                'Pending'
                            )"
                        >
                            Pending
                        </button>


                        <button
                            type="button"
                            class="processing-btn"
                            onclick="updateConcern(
                                '${escapeJS(item.id)}',
                                'Processing'
                            )"
                        >
                            Processing
                        </button>


                        <button
                            type="button"
                            class="completed-btn"
                            onclick="updateConcern(
                                '${escapeJS(item.id)}',
                                'Completed'
                            )"
                        >
                            Completed
                        </button>


                        <button
                            type="button"
                            class="aborted-btn"
                            onclick="updateConcern(
                                '${escapeJS(item.id)}',
                                'Aborted'
                            )"
                        >
                            Aborted
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });


    html += `

                </tbody>

            </table>

        </div>

    `;


    box.innerHTML =
        html;

}


// ==========================================
// ESCAPE JAVASCRIPT STRING
// ==========================================

function escapeJS(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return String(value)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        )

        .replace(
            /"/g,
            '\\"'
        )

        .replace(
            /\r?\n/g,
            "\\n"
        );

}


// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(value){

    if(!value){

        return "";

    }


    const date =
        new Date(value);


    if(
        isNaN(
            date.getTime()
        )
    ){

        return escapeHTML(
            value
        );

    }


    return date.toLocaleString(
        undefined,
        {

            year:"numeric",

            month:"short",

            day:"numeric",

            hour:"numeric",

            minute:"2-digit"

        }
    );

}


// ==========================================
// UPDATE CONCERN STATUS
// ==========================================

function updateConcern(id,status){

    if(!requireAdmin()){

        return;

    }


    if(!id){

        alert(
            "Concern ID is missing."
        );

        return;

    }


    const newStatus =
        normalizeConcernStatus(
            status
        );


    const confirmed =
        confirm(

            "Change this concern status to " +
            newStatus +
            "?"

        );


    if(!confirmed){

        return;

    }


    postAPI({

        action:
            "updateConcernStatus",

        email:
            currentUser.email,

        id:
            id,

        status:
            newStatus

    })

    .then(function(result){

        console.log(
            "Status update:",
            result
        );


        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to update concern."
            );

        }


        alert(

            result.message ||
            "Concern status updated successfully."

        );


        /*
         * Refresh dashboard statistics
         */

        loadAdminDashboard();


        /*
         * Refresh concern table
         */

        loadAdminConcerns();

    })

    .catch(function(error){

        console.error(
            "Update concern error:",
            error
        );


        alert(
            error.message ||
            "Unable to update concern status."
        );

    });

}


// ==========================================
// REPORT FILTER EVENT HELPERS
// ==========================================

function filterAdminConcerns(){

    loadAdminConcerns();

}


// ==========================================
// PRINT REPORT
// ==========================================

function printReport(){

    if(!requireAdmin()){

        return;

    }


    const container =
        document.getElementById(
            "adminConcerns"
        );


    if(!container){

        alert(
            "Admin concern list not found."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "",
            "width=1200,height=800"
        );


    if(!printWindow){

        alert(
            "Please allow pop-ups to print the report."
        );

        return;

    }


    printWindow.document.write(`

        <!DOCTYPE html>

        <html>

        <head>

            <title>
                LinkTech Customer Concern Report
            </title>

            <style>

                body{
                    font-family:Arial,sans-serif;
                    padding:25px;
                    color:#111;
                }

                table{
                    width:100%;
                    border-collapse:collapse;
                }

                th,
                td{
                    border:1px solid #ccc;
                    padding:8px;
                    text-align:left;
                    vertical-align:top;
                }

                th{
                    background:#eee;
                }

                button{
                    display:none !important;
                }

                .new-concern{
                    display:none;
                }

            </style>

        </head>

        <body>

            <h2>
                LinkTech Customer Concern Report
            </h2>

            <p>
                Generated:
                ${new Date().toLocaleString()}
            </p>

            ${container.innerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();

    printWindow.focus();

    printWindow.print();

}


// ==========================================
// DOWNLOAD CSV
// ==========================================

function csvEscape(value){

    if(
        value === null ||
        value === undefined
    ){

        return "";

    }


    return '"' +
        String(value)
            .replace(
                /"/g,
                '""'
            ) +
        '"';

}


function downloadCSV(){

    if(!requireAdmin()){

        return;

    }


    fetch(

        API_URL +
        "?action=getAdminData" +
        "&email=" +
        encodeURIComponent(
            currentUser.email
        ) +
        "&filter=all"

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to generate report."
            );

        }


        const requests =
            result.data &&
            Array.isArray(
                result.data.requests
            )

            ?

            result.data.requests

            :

            [];


        const rows = [

            [

                "Concern ID",

                "Name",

                "Email",

                "Address",

                "Contact",

                "Category",

                "Problem",

                "Status",

                "Date"

            ]

        ];


        requests.forEach(
            function(item){

                rows.push([

                    item.id || "",

                    item.name || "",

                    item.email || "",

                    item.address || "",

                    item.contact || "",

                    item.category || "",

                    item.problem || "",

                    normalizeConcernStatus(
                        item.status
                    ),

                    item.date || ""

                ]);

            }
        );


        const csv =
            rows

                .map(function(row){

                    return row

                        .map(
                            csvEscape
                        )

                        .join(",");

                })

                .join("\r\n");


        const blob =
            new Blob(

                [csv],

                {
                    type:
                    "text/csv;charset=utf-8;"
                }

            );


        const url =
            URL.createObjectURL(
                blob
            );


        const a =
            document.createElement(
                "a"
            );


        a.href =
            url;


        a.download =
            "LinkTech_Customer_Concern_Report.csv";


        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);


        URL.revokeObjectURL(
            url
        );

    })

    .catch(function(error){

        console.error(
            "CSV error:",
            error
        );


        alert(
            error.message ||
            "Unable to download CSV report."
        );

    });

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 4/4
// TIMELINE + VIEW + ADMIN MANAGEMENT
// ==========================================


// ==========================================
// TIMELINE DATA CACHE
// ==========================================

let timelinePosts = [];


// ==========================================
// LOAD TIMELINE
// ==========================================

function loadTimeline(){

    const container =
        document.getElementById(
            "timeline"
        );


    if(!container){

        console.warn(
            "Timeline container not found."
        );

        return;

    }


    container.innerHTML =
        `<div class="timeline-loading">
            Loading timeline...
        </div>`;


    fetch(

        API_URL +
        "?action=getTimeline"

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP error: " +
                response.status
            );

        }


        return response.json();

    })

    .then(function(result){

        console.log(
            "Timeline API:",
            result
        );


        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to load timeline."
            );

        }


        timelinePosts =
            Array.isArray(
                result.data
            )

            ?

            result.data

            :

            [];


        renderTimeline(
            timelinePosts
        );

    })

    .catch(function(error){

        console.error(
            "Timeline loading error:",
            error
        );


        container.innerHTML =

            `<div class="timeline-empty">

                Unable to load timeline.

            </div>`;

    });

}


// ==========================================
// RENDER TIMELINE
// ==========================================

function renderTimeline(posts){

    const container =
        document.getElementById(
            "timeline"
        );


    if(!container){

        return;

    }


    if(
        !Array.isArray(posts) ||
        posts.length === 0
    ){

        container.innerHTML =

            `<div class="timeline-empty">

                No timeline posts available.

            </div>`;

        return;

    }


    let html =
        "";


    posts.forEach(
        function(post){

            const id =
                escapeJS(
                    post.id || ""
                );


            const title =
                escapeHTML(
                    post.title ||
                    "Untitled"
                );


            const caption =
                escapeHTML(
                    post.caption ||
                    ""
                );


            const image =
                escapeHTML(
                    post.image ||
                    ""
                );


            const date =
                formatDate(
                    post.date
                );


            html += `

                <article
                    class="timeline-post"
                >

                    ${
                        image

                        ?

                        `<img
                            src="${image}"
                            alt="${title}"
                            loading="lazy"
                            onerror="this.style.display='none';"
                        >`

                        :

                        ""
                    }


                    <h3>
                        ${title}
                    </h3>


                    <p>
                        ${caption}
                    </p>


                    <p class="timeline-date">

                        ${date}

                    </p>


                    <button
                        type="button"
                        class="timeline-view-btn"
                        onclick="viewTimelinePost(
                            '${id}'
                        )"
                    >
                        View
                    </button>


                    ${
                        isAdmin

                        ?

                        `

                        <div
                            class="timeline-admin-actions"
                        >

                            <button
                                type="button"
                                onclick="editTimelinePost(
                                    '${id}'
                                )"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                onclick="deleteTimelinePost(
                                    '${id}'
                                )"
                            >
                                Delete
                            </button>

                        </div>

                        `

                        :

                        ""

                    }

                </article>

            `;

        }
    );


    container.innerHTML =
        html;

}


// ==========================================
// VIEW TIMELINE POST
// ==========================================

function viewTimelinePost(id){

    const post =
        timelinePosts.find(
            function(item){

                return String(
                    item.id
                ) ===
                String(id);

            }
        );


    if(!post){

        alert(
            "Timeline post not found."
        );

        return;

    }


    /*
     * Look for an existing modal.
     */

    let modal =
        document.getElementById(
            "timelineModal"
        );


    /*
     * If the HTML does not already
     * contain a modal, create one.
     */

    if(!modal){

        modal =
            document.createElement(
                "div"
            );


        modal.id =
            "timelineModal";


        modal.className =
            "timeline-modal";


        document.body.appendChild(
            modal
        );

    }


    const image =
        post.image
        ?

        `<img
            src="${escapeHTML(
                post.image
            )}"
            alt="${escapeHTML(
                post.title ||
                ""
            )}"
        >`

        :

        "";


    modal.innerHTML = `

        <div
            class="timeline-modal-content"
        >

            <button
                type="button"
                class="timeline-modal-close"
                onclick="closeTimelineModal()"
            >
                ×
            </button>


            ${image}


            <h2>
                ${escapeHTML(
                    post.title ||
                    "Untitled"
                )}
            </h2>


            <p>
                ${escapeHTML(
                    post.caption ||
                    ""
                )}
            </p>


            <p class="timeline-date">

                Posted:
                ${formatDate(
                    post.date
                )}

            </p>


            <p>

                Posted by:
                ${escapeHTML(
                    post.postedBy ||
                    ""
                )}

            </p>

        </div>

    `;


    modal.classList.add(
        "show"
    );


    /*
     * Close when clicking outside
     */

    modal.onclick =
        function(event){

            if(
                event.target ===
                modal
            ){

                closeTimelineModal();

            }

        };

}


// ==========================================
// CLOSE TIMELINE MODAL
// ==========================================

function closeTimelineModal(){

    const modal =
        document.getElementById(
            "timelineModal"
        );


    if(modal){

        modal.classList.remove(
            "show"
        );

    }

}


// ==========================================
// CREATE TIMELINE POST
// ==========================================

function createPost(){

    if(!requireAdmin()){

        return;

    }


    const titleElement =
        document.getElementById(
            "postTitle"
        );


    const captionElement =
        document.getElementById(
            "postCaption"
        );


    const imageElement =
        document.getElementById(
            "postImage"
        );


    const title =
        titleElement
            ? titleElement.value.trim()
            : "";


    const caption =
        captionElement
            ? captionElement.value.trim()
            : "";


    const image =
        imageElement
            ? imageElement.value.trim()
            : "";


    if(!title){

        alert(
            "Please enter a post title."
        );

        return;

    }


    if(!caption){

        alert(
            "Please enter a post caption."
        );

        return;

    }


    postAPI({

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

    })

    .then(function(result){

        alert(
            result.message ||
            "Post operation completed."
        );


        if(result.success){

            if(titleElement){

                titleElement.value =
                    "";

            }


            if(captionElement){

                captionElement.value =
                    "";

            }


            if(imageElement){

                imageElement.value =
                    "";

            }


            loadTimeline();

        }

    })

    .catch(function(error){

        console.error(
            "Create post error:",
            error
        );


        alert(
            error.message ||
            "Unable to create timeline post."
        );

    });

}


// ==========================================
// EDIT TIMELINE POST
// ==========================================

function editTimelinePost(id){

    if(!requireAdmin()){

        return;

    }


    const post =
        timelinePosts.find(
            function(item){

                return String(
                    item.id
                ) ===
                String(id);

            }
        );


    if(!post){

        alert(
            "Timeline post not found."
        );

        return;

    }


    const title =
        prompt(
            "Enter new title:",
            post.title || ""
        );


    if(title === null){

        return;

    }


    const caption =
        prompt(
            "Enter new caption:",
            post.caption || ""
        );


    if(caption === null){

        return;

    }


    const image =
        prompt(
            "Enter image URL:",
            post.image || ""
        );


    if(image === null){

        return;

    }


    postAPI({

        action:
            "updatePost",

        email:
            currentUser.email,

        id:
            id,

        title:
            title.trim(),

        caption:
            caption.trim(),

        image:
            image.trim()

    })

    .then(function(result){

        alert(
            result.message ||
            "Post updated."
        );


        if(result.success){

            loadTimeline();

        }

    })

    .catch(function(error){

        console.error(
            "Edit timeline error:",
            error
        );


        alert(
            error.message ||
            "Unable to update timeline post."
        );

    });

}


// ==========================================
// DELETE TIMELINE POST
// ==========================================

function deleteTimelinePost(id){

    if(!requireAdmin()){

        return;

    }


    const confirmed =
        confirm(
            "Delete this timeline post?"
        );


    if(!confirmed){

        return;

    }


    postAPI({

        action:
            "deletePost",

        email:
            currentUser.email,

        id:
            id

    })

    .then(function(result){

        alert(
            result.message ||
            "Post deleted."
        );


        if(result.success){

            loadTimeline();

        }

    })

    .catch(function(error){

        console.error(
            "Delete timeline error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete timeline post."
        );

    });

}


// ==========================================
// CLOSE MODAL WITH ESC KEY
// ==========================================

document.addEventListener(
    "keydown",
    function(event){

        if(
            event.key ===
            "Escape"
        ){

            closeTimelineModal();

        }

    }
);


// ==========================================
// FILTER EVENT AUTO-CONNECTION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        const reportType =
            document.getElementById(
                "reportType"
            );


        const statusFilter =
            document.getElementById(
                "statusFilter"
            );


        const categoryFilter =
            document.getElementById(
                "categoryFilter"
            );


        if(reportType){

            reportType.addEventListener(
                "change",
                applyConcernFilters
            );

        }


        if(statusFilter){

            statusFilter.addEventListener(
                "change",
                applyConcernFilters
            );

        }


        if(categoryFilter){

            categoryFilter.addEventListener(
                "change",
                applyConcernFilters
            );

        }

    }
);
