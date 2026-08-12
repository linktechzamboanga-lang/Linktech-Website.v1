// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 1/4
// GOOGLE LOGIN + SESSION
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
"https://script.google.com/macros/s/AKfycbypDj8XZSTJvbTKugm6muqJRALIGv08HoYhXdhmJ2Ajw2eKFy3D_XH90DykQA1Kaqtr/exec";


// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;

let isAdmin = false;

let googleInitialized = false;


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


        currentUser =
            JSON.parse(saved);


        if(
            !currentUser ||
            !currentUser.email
        ){

            localStorage.removeItem(
                "linktechUser"
            );

            currentUser = null;

            return;

        }


        console.log(
            "Restored LinkTech user."
        );


        showUser();

        checkAdmin();

    }
    catch(error){

        console.error(
            "Session restore error:",
            error
        );


        localStorage.removeItem(
            "linktechUser"
        );


        currentUser = null;

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


    googleInitialized = true;


    console.log(
        "Google Identity Services initialized."
    );


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
            "googleLoginButton not found."
        );

        return;

    }


    button.innerHTML = "";


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
        "block";

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

        console.error(
            "Google credential missing."
        );


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


    fetch(
        API_URL,
        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body:
                JSON.stringify({

                    action:
                        "googleLogin",

                    token:
                        token

                })

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

    })

    .then(function(result){

        console.log(
            "Google login result:",
            result
        );


        if(!result.success){

            alert(
                result.message ||
                "Google login failed."
            );

            return;

        }


        currentUser =
            result.data;


        if(
            !currentUser ||
            !currentUser.email
        ){

            throw new Error(
                "Invalid user data returned by server."
            );

        }


        localStorage.setItem(

            "linktechUser",

            JSON.stringify(
                currentUser
            )

        );


        showUser();

        checkAdmin();


        console.log(
            "Google login successful."
        );

    })

    .catch(function(error){

        console.error(
            "Google login error:",
            error
        );


        alert(
            "Unable to connect to LinkTech login service."
        );

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


    const userName =
        document.getElementById(
            "userName"
        );


    if(userName){

        userName.textContent =
            currentUser.name || "";

    }


    const userEmail =
        document.getElementById(
            "userEmail"
        );


    if(userEmail){

        userEmail.textContent =
            currentUser.email || "";

    }


    const userImage =
        document.getElementById(
            "userImage"
        );


    if(
        userImage &&
        currentUser.picture
    ){

        userImage.src =
            currentUser.picture;

    }


    const inputName =
        document.getElementById(
            "name"
        );


    if(inputName){

        inputName.value =
            currentUser.name || "";

    }


    const inputEmail =
        document.getElementById(
            "email"
        );


    if(inputEmail){

        inputEmail.value =
            currentUser.email || "";

    }

}


// ==========================================
// ADMIN CHECK
// IMPORTANT:
// ADMIN EMAIL IS NOT STORED IN HOME.JS
// Code.gs returns isAdmin.
// ==========================================

function checkAdmin(){

    isAdmin = false;


    if(!currentUser){

        return;

    }


    isAdmin =
        currentUser.isAdmin === true;


    if(isAdmin){

        console.log(
            "Administrator access granted."
        );


        const adminPanel =
            document.getElementById(
                "adminPanel"
            );


        if(adminPanel){

            adminPanel.style.display =
                "block";

        }


        const timelineAdmin =
            document.getElementById(
                "timelineAdmin"
            );


        if(timelineAdmin){

            timelineAdmin.style.display =
                "block";

        }


        loadAdminData();

    }
    else{

        console.log(
            "Customer access."
        );


        const adminPanel =
            document.getElementById(
                "adminPanel"
            );


        if(adminPanel){

            adminPanel.style.display =
                "none";

        }


        const timelineAdmin =
            document.getElementById(
                "timelineAdmin"
            );


        if(timelineAdmin){

            timelineAdmin.style.display =
                "none";

        }

    }

}


// ==========================================
// ADMIN ACCESS REQUIREMENT
// ==========================================

function requireAdmin(){

    if(!currentUser){

        alert(
            "Please login first."
        );

        return false;

    }


    if(currentUser.isAdmin !== true){

        alert(
            "Administrator access required."
        );

        return false;

    }


    return true;

}


// ==========================================
// LOGOUT
// ==========================================

function logoutUser(){

    localStorage.removeItem(
        "linktechUser"
    );


    currentUser = null;

    isAdmin = false;


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
// CUSTOMER CONCERNS + STATUS MANAGEMENT
// ==========================================


// ==========================================
// CONCERN STATUS
// ==========================================

const CONCERN_STATUS = {

    PENDING:
        "Pending",

    PROCESSING:
        "Processing",

    COMPLETED:
        "Completed",

    ABORTED:
        "Aborted"

};


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

            return status;

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
// ESCAPE HTML
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
// SUBMIT CONCERN
// ==========================================

function submitConcern(){

    if(!currentUser){

        alert(
            "Please login with Google first."
        );

        return;

    }


    const address =
        document.getElementById(
            "address"
        )?.value.trim() || "";


    const contact =
        document.getElementById(
            "contact"
        )?.value.trim() || "";


    const category =
        document.getElementById(
            "category"
        )?.value.trim() || "";


    const problem =
        document.getElementById(
            "problem"
        )?.value.trim() || "";


    if(!problem){

        alert(
            "Please describe your IT concern."
        );

        return;

    }


    fetch(
        API_URL,
        {

            method:
                "POST",

            body:
                JSON.stringify({

                    action:
                        "submitConcern",

                    email:
                        currentUser.email,

                    name:
                        currentUser.name || "",

                    address:
                        address,

                    contact:
                        contact,

                    category:
                        category,

                    problem:
                        problem

                })

        }
    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            alert(
                result.message ||
                "Unable to submit concern."
            );

            return;

        }


        alert(
            result.message ||
            "Concern submitted successfully."
        );


        loadMyRequests();

    })

    .catch(function(error){

        console.error(
            "Submit concern error:",
            error
        );


        alert(
            "Unable to connect to LinkTech."
        );

    });

}


// ==========================================
// LOAD CUSTOMER REQUESTS
// ==========================================

function loadMyRequests(){

    if(!currentUser){

        return;

    }


    fetch(

        API_URL +
        "?action=getMyRequests" +
        "&email=" +
        encodeURIComponent(
            currentUser.email
        )

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const requests =
            Array.isArray(result.data)
                ? result.data
                : [];


        renderMyRequests(
            requests
        );

    })

    .catch(function(error){

        console.error(
            "Load customer requests error:",
            error
        );

    });

}


// ==========================================
// RENDER CUSTOMER REQUESTS
// ==========================================

function renderMyRequests(requests){

    const box =
        document.getElementById(
            "myRequests"
        );


    if(!box){

        return;

    }


    if(!requests.length){

        box.innerHTML =
            "<p>No customer concerns found.</p>";

        return;

    }


    let html = "";


    requests.forEach(
        function(item){

            const status =
                normalizeConcernStatus(
                    item.status
                );


            html += `

                <div class="customer-request">

                    <div class="customer-request-header">

                        <strong>
                            ${escapeHTML(
                                item.category ||
                                "IT Concern"
                            )}
                        </strong>

                        <span class="${getStatusClass(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>

                    <p>
                        <strong>Reference ID:</strong>
                        ${escapeHTML(item.id)}
                    </p>

                    <p>
                        <strong>Problem:</strong>
                    </p>

                    <div>
                        ${escapeHTML(item.problem)}
                    </div>

                    <p>
                        <strong>Date:</strong>
                        ${escapeHTML(item.date)}
                    </p>

                </div>

            `;

        }
    );


    box.innerHTML =
        html;

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
        )

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP " +
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


        const summary =
            result.data &&
            result.data.summary
                ? result.data.summary
                : {};


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

    })

    .catch(function(error){

        console.error(
            "Admin dashboard error:",
            error
        );

    });

}


// ==========================================
// SET TEXT HELPER
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

        return;

    }


    box.innerHTML =
        "<p>Loading customer concerns...</p>";


    const reportType =
        document.getElementById(
            "reportType"
        );


    const filter =
        reportType
            ? reportType.value
            : "all";


    fetch(

        API_URL +
        "?action=getAdminData" +
        "&email=" +
        encodeURIComponent(
            currentUser.email
        ) +
        "&filter=" +
        encodeURIComponent(
            filter
        )

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        return response.json();

    })

    .then(function(result){

        console.log(
            "Admin data:",
            result
        );


        if(!result.success){

            box.innerHTML =
                `<p>
                    ${escapeHTML(
                        result.message ||
                        "Unable to load concerns."
                    )}
                </p>`;

            return;

        }


        const requests =
            result.data &&
            Array.isArray(
                result.data.requests
            )
                ? result.data.requests
                : [];


        if(!requests.length){

            box.innerHTML =
                "<p>No customer concerns found.</p>";

            return;

        }


        renderAdminConcerns(
            requests
        );

    })

    .catch(function(error){

        console.error(
            "Admin concerns error:",
            error
        );


        box.innerHTML =
            `<p>
                Unable to connect to LinkTech API.
            </p>`;

    });

}


// ==========================================
// RENDER ADMIN CONCERNS
// ==========================================

function renderAdminConcerns(data){

    const box =
        document.getElementById(
            "adminConcerns"
        );


    if(!box){

        return;

    }


    let html = "";


    data.forEach(
        function(item){

            const status =
                normalizeConcernStatus(
                    item.status
                );


            const id =
                escapeHTML(
                    item.id || ""
                );


            html += `

                <div class="admin-request">

                    <div class="admin-request-header">

                        <h3>
                            ${escapeHTML(
                                item.name ||
                                "Unknown Customer"
                            )}
                        </h3>

                        <span class="${getStatusClass(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>


                    <p>
                        <strong>Concern ID:</strong>
                        ${id}
                    </p>


                    <p>
                        <strong>Email:</strong>
                        ${escapeHTML(
                            item.email || ""
                        )}
                    </p>


                    <p>
                        <strong>Contact:</strong>
                        ${escapeHTML(
                            item.contact || ""
                        )}
                    </p>


                    <p>
                        <strong>Address:</strong>
                        ${escapeHTML(
                            item.address || ""
                        )}
                    </p>


                    <p>
                        <strong>Category:</strong>
                        ${escapeHTML(
                            item.category || ""
                        )}
                    </p>


                    <p>
                        <strong>Problem:</strong>
                    </p>


                    <div class="problem-description">
                        ${escapeHTML(
                            item.problem || ""
                        )}
                    </div>


                    <p>
                        <strong>Date:</strong>
                        ${escapeHTML(
                            item.date || ""
                        )}
                    </p>


                    <div class="admin-request-actions">

                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                'Pending'
                            )"
                        >
                            Pending
                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                'Processing'
                            )"
                        >
                            Processing
                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                'Completed'
                            )"
                        >
                            Completed
                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                'Aborted'
                            )"
                        >
                            Aborted
                        </button>

                    </div>

                </div>

            `;

        }
    );


    box.innerHTML =
        html;

}


// ==========================================
// UPDATE CUSTOMER CONCERN STATUS
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


    if(
        !confirm(
            "Change concern status to " +
            newStatus +
            "?"
        )
    ){

        return;

    }


    fetch(

        API_URL,
        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body:
                JSON.stringify({

                    action:
                        "updateConcernStatus",

                    email:
                        currentUser.email,

                    id:
                        id,

                    status:
                        newStatus

                })

        }

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        return response.json();

    })

    .then(function(result){

        console.log(
            "Status update:",
            result
        );


        if(!result.success){

            alert(
                result.message ||
                "Status update failed."
            );

            return;

        }


        alert(
            result.message ||
            "Concern status updated successfully."
        );


        loadAdminDashboard();

        loadAdminConcerns();

    })

    .catch(function(error){

        console.error(
            "Update concern error:",
            error
        );


        alert(
            "Unable to update concern status."
        );

    });

}


// ==========================================
// REFRESH ADMIN
// ==========================================

function refreshAdminData(){

    if(!requireAdmin()){

        return;

    }


    loadAdminData();

}


// ==========================================
// REPORT FILTER CHANGE
// ==========================================

function filterAdminReport(){

    if(!requireAdmin()){

        return;

    }


    loadAdminConcerns();

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 3/4
// COMMENTS + TIMELINE
// ==========================================


// ==========================================
// SUBMIT COMMENT
// ==========================================

function submitComment(){

    if(!currentUser){

        alert(
            "Please login first."
        );

        return;

    }


    const field =
        document.getElementById(
            "ccomment"
        );


    if(!field){

        return;

    }


    const comment =
        field.value.trim();


    if(!comment){

        alert(
            "Please enter your comment."
        );

        return;

    }


    fetch(

        API_URL,
        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body:
                JSON.stringify({

                    action:
                        "submitComment",

                    email:
                        currentUser.email,

                    comment:
                        comment

                })

        }

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            alert(
                result.message ||
                "Unable to post comment."
            );

            return;

        }


        field.value = "";


        alert(
            result.message ||
            "Comment posted."
        );


        loadComments();

    })

    .catch(function(error){

        console.error(
            "Comment error:",
            error
        );


        alert(
            "Unable to connect to LinkTech."
        );

    });

}


// ==========================================
// LOAD COMMENTS
// ==========================================

function loadComments(){

    fetch(

        API_URL +
        "?action=getComments"

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        renderComments(
            Array.isArray(result.data)
                ? result.data
                : []
        );

    })

    .catch(function(error){

        console.error(
            "Load comments error:",
            error
        );

    });

}


// ==========================================
// RENDER COMMENTS
// ==========================================

function renderComments(comments){

    const box =
        document.getElementById(
            "commentList"
        );


    if(!box){

        return;

    }


    if(!comments.length){

        box.innerHTML =
            "<p>No comments yet.</p>";

        return;

    }


    let html = "";


    comments.forEach(
        function(item){

            html += `

                <div class="comment-item">

                    <strong>
                        ${escapeHTML(
                            item.email || ""
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            item.comment || ""
                        )}
                    </p>

                    <small>
                        ${escapeHTML(
                            item.date || ""
                        )}
                    </small>

                </div>

            `;

        }
    );


    box.innerHTML =
        html;

}


// ==========================================
// LOAD TIMELINE
// ==========================================

function loadTimeline(){

    fetch(

        API_URL +
        "?action=getTimeline"

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        return response.json();

    })

    .then(function(result){

        console.log(
            "Timeline:",
            result
        );


        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const posts =
            Array.isArray(result.data)
                ? result.data
                : [];


        renderTimeline(
            posts
        );

    })

    .catch(function(error){

        console.error(
            "Timeline error:",
            error
        );

    });

}


// ==========================================
// RENDER TIMELINE
// ==========================================

function renderTimeline(posts){

    const box =
        document.getElementById(
            "timeline"
        );


    if(!box){

        return;

    }


    if(!posts.length){

        box.innerHTML =
            "<p>No timeline posts yet.</p>";

        return;

    }


    let html = "";


    posts.forEach(
        function(post){

            const image =
                post.image
                    ? `
                        <img
                            src="${escapeHTML(
                                post.image
                            )}"
                            alt="${escapeHTML(
                                post.title
                            )}"
                            loading="lazy"
                        >
                    `
                    : "";


            let adminButtons = "";


            if(
                currentUser &&
                currentUser.isAdmin === true
            ){

                adminButtons = `

                    <div class="timeline-admin-actions">

                        <button
                            type="button"
                            onclick="editTimelinePost(
                                '${escapeHTML(post.id)}'
                            )"
                        >
                            Edit
                        </button>


                        <button
                            type="button"
                            onclick="deleteTimelinePost(
                                '${escapeHTML(post.id)}'
                            )"
                        >
                            Delete
                        </button>

                    </div>

                `;

            }


            html += `

                <article class="timeline-post">

                    ${image}

                    <h2>
                        ${escapeHTML(
                            post.title || ""
                        )}
                    </h2>


                    <p>
                        ${escapeHTML(
                            post.caption || ""
                        )}
                    </p>


                    <small>
                        ${escapeHTML(
                            post.date || ""
                        )}
                    </small>


                    ${adminButtons}

                </article>

            `;

        }
    );


    box.innerHTML =
        html;

}


// ==========================================
// INITIAL LOAD
// ==========================================

function initializeHomeData(){

    loadTimeline();

    loadComments();


    if(currentUser){

        loadMyRequests();

    }


    if(
        currentUser &&
        currentUser.isAdmin === true
    ){

        loadAdminData();

    }

}


// ==========================================
// OPTIONAL DOM READY INITIALIZATION
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    function(){

        setTimeout(
            initializeHomeData,
            500
        );

    }
);

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 4/4
// TIMELINE ADMIN + REPORTS
// ==========================================


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
            "Please enter a caption."
        );

        return;

    }


    fetch(

        API_URL,
        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body:
                JSON.stringify({

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

        }

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        alert(
            result.message ||
            "Post operation completed."
        );


        if(result.success){

            if(titleElement){

                titleElement.value = "";

            }


            if(captionElement){

                captionElement.value = "";

            }


            if(imageElement){

                imageElement.value = "";

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
            "Unable to create timeline post."
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


    if(!id){

        return;

    }


    if(
        !confirm(
            "Delete this timeline post?"
        )
    ){

        return;

    }


    fetch(

        API_URL,
        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body:
                JSON.stringify({

                    action:
                        "deletePost",

                    email:
                        currentUser.email,

                    id:
                        id

                })

        }

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        alert(
            result.message ||
            "Operation completed."
        );


        if(result.success){

            loadTimeline();

        }

    })

    .catch(function(error){

        console.error(
            "Delete post error:",
            error
        );


        alert(
            "Unable to delete timeline post."
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


    if(!id){

        return;

    }


    const title =
        prompt(
            "Enter new title:"
        );


    if(title === null){

        return;

    }


    const caption =
        prompt(
            "Enter new caption:"
        );


    if(caption === null){

        return;

    }


    fetch(

        API_URL,
        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body:
                JSON.stringify({

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
                        ""

                })

        }

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        alert(
            result.message ||
            "Operation completed."
        );


        if(result.success){

            loadTimeline();

        }

    })

    .catch(function(error){

        console.error(
            "Edit post error:",
            error
        );


        alert(
            "Unable to update timeline post."
        );

    });

}


// ==========================================
// PRINT ADMIN REPORT
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
            "width=900,height=700"
        );


    if(!printWindow){

        alert(
            "Please allow pop-ups."
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
                    padding:30px;
                }

                .admin-request{
                    border:1px solid #ccc;
                    padding:15px;
                    margin-bottom:15px;
                    page-break-inside:avoid;
                }

                button{
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
// CSV ESCAPE
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


// ==========================================
// DOWNLOAD CSV
// ==========================================

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
        )

    )

    .then(function(response){

        if(!response.ok){

            throw new Error(
                "HTTP " +
                response.status
            );

        }


        return response.json();

    })

    .then(function(result){

        if(!result.success){

            alert(
                result.message ||
                "Unable to generate report."
            );

            return;

        }


        // IMPORTANT:
        // Code.gs returns:
        //
        // data.summary
        // data.requests

        const requests =
            result.data &&
            Array.isArray(
                result.data.requests
            )
                ? result.data.requests
                : [];


        const rows = [

            [
                "Concern ID",
                "Name",
                "Email",
                "Contact",
                "Address",
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

                    item.contact || "",

                    item.address || "",

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

                .map(
                    function(row){

                        return row
                            .map(csvEscape)
                            .join(",");

                    }
                )

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


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "LinkTech_Customer_Concern_Report.csv";


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );


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
            "Unable to download CSV report."
        );

    });

}


// ==========================================
// CHECK LOGIN STATUS
// ==========================================

function isLoggedIn(){

    return !!(
        currentUser &&
        currentUser.email
    );

}


// ==========================================
// GET CURRENT USER EMAIL
// ==========================================

function getCurrentUserEmail(){

    if(!currentUser){

        return "";

    }


    return currentUser.email || "";

}


// ==========================================
// SAFE API ERROR LOGGER
// ==========================================

function logAPIError(
    operation,
    error
){

    console.error(
        "LinkTech API error:",
        operation,
        error
    );

}


// ==========================================
// FINAL INITIALIZATION
// ==========================================

console.log(
    "LinkTech Home.js Parts 1-4 loaded."
);
