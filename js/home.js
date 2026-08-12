// ==========================================
// GOOGLE CLIENT ID
// ==========================================

const GOOGLE_CLIENT_ID =
"495855477306-9rdg89fh3g5mtolu8th08ltojor8lkkr.apps.googleusercontent.com";


// ==========================================
// GOOGLE APPS SCRIPT API URL
// ==========================================

const API_URL =
"https://script.google.com/macros/s/AKfycbxe_2rUAXSNE-GMnRoFNeRUUpLMfTvfECiIT8ExuStCUniKZed0a1VCS1Xz88OS5R6R/exec";


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
            "Restored user:",
            currentUser.email
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
// INITIALIZE GOOGLE IDENTITY SERVICES
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
            "Google Identity Services not ready. Retrying..."
        );

        setTimeout(
            initializeGoogle,
            500
        );

        return;

    }


    if(googleInitialized){

        console.log(
            "Google Sign-In already initialized."
        );

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


    const button =
        document.getElementById(
            "googleLoginButton"
        );


    if(!button){

        console.error(
            "googleLoginButton element was not found."
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
// GOOGLE LOGIN CALLBACK
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
// VERIFY GOOGLE LOGIN THROUGH CODE.GS
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

    .then(function(data){

        console.log(
            "Google login API response:",
            data
        );


        if(!data.success){

            alert(
                data.message ||
                "Login failed."
            );

            return;

        }


        currentUser =
            data.data;


        localStorage.setItem(

            "linktechUser",

            JSON.stringify(
                currentUser
            )

        );


        showUser();

        checkAdmin();


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
            currentUser.name ||
            "";

    }


    const userEmail =
        document.getElementById(
            "userEmail"
        );


    if(userEmail){

        userEmail.textContent =
            currentUser.email ||
            "";

    }


    const userImage =
        document.getElementById(
            "userImage"
        );


    if(userImage){

        userImage.src =
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
// ADMIN CHECK
// USE SERVER isAdmin VALUE
// ==========================================

function checkAdmin(){

    isAdmin = false;


    if(!currentUser){

        return;

    }


    const userEmail =
        String(
            currentUser.email ||
            ""
        )
        .trim()
        .toLowerCase();


    // Code.gs is the authority
    if(currentUser.isAdmin === true){

        isAdmin = true;

        console.log(
            "ADMIN ACCESS GRANTED:",
            userEmail
        );

        showAdminInterface();

        return;

    }


    // Fallback check
    if(
        userEmail ===
        "linktechzamboanga@gmail.com"
    ){

        isAdmin = true;

        showAdminInterface();

        return;

    }


    console.log(
        "Regular customer:",
        userEmail
    );


    hideAdminInterface();

}


// ==========================================
// SHOW ADMIN INTERFACE
// ==========================================

function showAdminInterface(){

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


    if(
        typeof loadAdminData ===
        "function"
    ){

        loadAdminData();

    }

}


// ==========================================
// HIDE ADMIN INTERFACE
// ==========================================

function hideAdminInterface(){

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
// CUSTOMER CONCERNS + REQUESTS + COMMENTS
// ==========================================


// ==========================================
// API JSON HELPER
// ==========================================

function apiPost(data){

    return fetch(

        API_URL,

        {

            method:
                "POST",

            headers:{

                "Content-Type":
                    "text/plain;charset=utf-8"

            },

            body:
                JSON.stringify(data)

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
// SUBMIT CUSTOMER CONCERN
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
        );


    const contact =
        document.getElementById(
            "contact"
        );


    const category =
        document.getElementById(
            "category"
        );


    const problem =
        document.getElementById(
            "problem"
        );


    const name =
        currentUser.name ||
        "";


    const email =
        currentUser.email ||
        "";


    const addressValue =
        address ?
        address.value.trim() :
        "";


    const contactValue =
        contact ?
        contact.value.trim() :
        "";


    const categoryValue =
        category ?
        category.value.trim() :
        "";


    const problemValue =
        problem ?
        problem.value.trim() :
        "";


    if(!problemValue){

        alert(
            "Please enter your IT concern."
        );

        return;

    }


    const button =
        document.getElementById(
            "submitConcernButton"
        );


    if(button){

        button.disabled =
            true;

        button.textContent =
            "Submitting...";

    }


    apiPost({

        action:
            "submitConcern",

        name:
            name,

        email:
            email,

        address:
            addressValue,

        contact:
            contactValue,

        category:
            categoryValue,

        problem:
            problemValue

    })

    .then(function(result){

        console.log(
            "Submit concern response:",
            result
        );


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


        if(problem){

            problem.value =
                "";

        }


        loadMyRequests();

    })

    .catch(function(error){

        console.error(
            "Submit concern error:",
            error
        );

        alert(
            "Unable to connect to LinkTech service."
        );

    })

    .finally(function(){

        if(button){

            button.disabled =
                false;

            button.textContent =
                "Submit Concern";

        }

    });

}


// ==========================================
// LOAD MY REQUESTS
// ==========================================

function loadMyRequests(){

    if(!currentUser){

        return;

    }


    apiGet(

        "getMyRequests",

        {

            email:
                currentUser.email

        }

    )

    .then(function(result){

        console.log(
            "My requests:",
            result
        );


        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const requests =
            Array.isArray(
                result.data
            )
            ?
            result.data
            :
            [];


        renderMyRequests(
            requests
        );

    })

    .catch(function(error){

        console.error(
            "Load requests error:",
            error
        );

    });

}


// ==========================================
// RENDER CUSTOMER REQUESTS
// ==========================================

function renderMyRequests(requests){

    const container =
        document.getElementById(
            "myRequests"
        );


    if(!container){

        return;

    }


    if(requests.length === 0){

        container.innerHTML =
            "<p>No requests found.</p>";

        return;

    }


    let html = "";


    requests.forEach(function(item){

        const status =
            normalizeConcernStatus(
                item.status
            );


        html += `

            <div class="customer-request">

                <div class="request-header">

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
                    ${escapeHTML(item.id || "")}
                </p>

                <p>
                    <strong>Problem:</strong>
                </p>

                <div class="problem-description">
                    ${escapeHTML(item.problem || "")}
                </div>

                <p>
                    <strong>Date:</strong>
                    ${escapeHTML(item.date || "")}
                </p>

            </div>

        `;

    });


    container.innerHTML =
        html;

}


// ==========================================
// SUBMIT COMMENT
// ==========================================

function submitComment(){

    if(!currentUser){

        alert(
            "Please login with Google first."
        );

        return;

    }


    const commentInput =
        document.getElementById(
            "comment"
        );


    if(!commentInput){

        alert(
            "Comment field not found."
        );

        return;

    }


    const comment =
        commentInput.value.trim();


    if(!comment){

        alert(
            "Please enter a comment."
        );

        return;

    }


    apiPost({

        action:
            "submitComment",

        email:
            currentUser.email,

        comment:
            comment

    })

    .then(function(result){

        alert(
            result.message ||
            "Comment operation completed."
        );


        if(result.success){

            commentInput.value =
                "";

            loadComments();

        }

    })

    .catch(function(error){

        console.error(
            "Submit comment error:",
            error
        );

        alert(
            "Unable to submit comment."
        );

    });

}


// ==========================================
// LOAD COMMENTS
// ==========================================

function loadComments(){

    apiGet(
        "getComments"
    )

    .then(function(result){

        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const comments =
            Array.isArray(
                result.data
            )
            ?
            result.data
            :
            [];


        renderComments(
            comments
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

    const container =
        document.getElementById(
            "commentList"
        );


    if(!container){

        return;

    }


    if(comments.length === 0){

        container.innerHTML =
            "<p>No comments yet.</p>";

        return;

    }


    let html = "";


    comments.forEach(function(item){

        html += `

            <div class="comment-item">

                <strong>
                    ${escapeHTML(
                        item.email ||
                        "User"
                    )}
                </strong>

                <p>
                    ${escapeHTML(
                        item.comment ||
                        ""
                    )}
                </p>

                <small>
                    ${escapeHTML(
                        item.date ||
                        ""
                    )}
                </small>

            </div>

        `;

    });


    container.innerHTML =
        html;

}


// ==========================================
// GENERIC GET REQUEST
// ==========================================

function apiGet(action, params){

    let url =
        API_URL +
        "?action=" +
        encodeURIComponent(action);


    if(params){

        Object.keys(params)
        .forEach(function(key){

            url +=
                "&" +
                encodeURIComponent(key) +
                "=" +
                encodeURIComponent(
                    params[key]
                );

        });

    }


    return fetch(url)

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
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 3/4
// TIMELINE + POSTS
// ==========================================


// ==========================================
// LOAD TIMELINE
// ==========================================

function loadTimeline(){

    apiGet(
        "getTimeline"
    )

    .then(function(result){

        console.log(
            "Timeline response:",
            result
        );


        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const posts =
            Array.isArray(
                result.data
            )
            ?
            result.data
            :
            [];


        renderTimeline(
            posts
        );

    })

    .catch(function(error){

        console.error(
            "Timeline loading error:",
            error
        );

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

        console.warn(
            "Timeline container not found."
        );

        return;

    }


    if(posts.length === 0){

        container.innerHTML =
            "<p>No timeline posts yet.</p>";

        return;

    }


    let html = "";


    posts.forEach(function(post){

        const image =
            post.image ||
            "";


        html += `

            <article class="timeline-post">

                ${
                    image
                    ?
                    `
                    <div class="timeline-image">

                        <img
                            src="${escapeHTML(image)}"
                            alt="${escapeHTML(post.title || "Timeline image")}"
                            loading="lazy"
                        >

                    </div>
                    `
                    :
                    ""
                }


                <div class="timeline-content">

                    <h3>
                        ${escapeHTML(
                            post.title ||
                            ""
                        )}
                    </h3>


                    <p>
                        ${escapeHTML(
                            post.caption ||
                            ""
                        )}
                    </p>


                    <small>
                        ${escapeHTML(
                            post.date ||
                            ""
                        )}
                    </small>


                    ${
                        isAdmin
                        ?
                        `
                        <div class="timeline-admin-actions">

                            <button
                                type="button"
                                onclick="editTimelinePost('${escapeHTML(post.id)}')"
                            >
                                Edit
                            </button>


                            <button
                                type="button"
                                onclick="deleteTimelinePost('${escapeHTML(post.id)}')"
                            >
                                Delete
                            </button>

                        </div>
                        `
                        :
                        ""
                    }

                </div>

            </article>

        `;

    });


    container.innerHTML =
        html;

}


// ==========================================
// CREATE TIMELINE POST
// ==========================================

function createPost(){

    if(!requireAdmin()){

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
        titleInput ?
        titleInput.value.trim() :
        "";


    const caption =
        captionInput ?
        captionInput.value.trim() :
        "";


    const image =
        imageInput ?
        imageInput.value.trim() :
        "";


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


    apiPost({

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

            if(titleInput){

                titleInput.value =
                    "";

            }


            if(captionInput){

                captionInput.value =
                    "";

            }


            if(imageInput){

                imageInput.value =
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


    apiPost({

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
            "Edit post error:",
            error
        );

        alert(
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


    apiPost({

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
            "Delete post error:",
            error
        );

        alert(
            "Unable to delete timeline post."
        );

    });

}


// ==========================================
// INITIAL TIMELINE LOAD
// ==========================================

window.addEventListener(
    "load",
    function(){

        loadTimeline();

        loadComments();

        if(currentUser){

            loadMyRequests();

        }

    }
);

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 4/4
// ADMIN DASHBOARD + STATUS + REPORTS
// ==========================================


// ==========================================
// CONCERN STATUS DEFINITIONS
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
// REQUIRE ADMIN
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
// LOAD ALL ADMIN DATA
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


    apiGet(

        "getAdminData",

        {

            email:
                currentUser.email

        }

    )

    .then(function(result){

        console.log(
            "Admin dashboard:",
            result
        );


        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const summary =
            result.data &&
            result.data.summary
            ?
            result.data.summary
            :
            {};


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
            "Dashboard error:",
            error
        );

    });

}


// ==========================================
// SET ELEMENT TEXT
// ==========================================

function setText(id,value){

    const element =
        document.getElementById(
            id
        );


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

        console.warn(
            "adminConcerns element not found."
        );

        return;

    }


    box.innerHTML =
        "<p>Loading customer concerns...</p>";


    const filter =
        document.getElementById(
            "reportType"
        );


    const type =
        filter
        ?
        filter.value
        :
        "all";


    apiGet(

        "getAdminData",

        {

            email:
                currentUser.email,

            filter:
                type

        }

    )

    .then(function(result){

        console.log(
            "Admin concerns:",
            result
        );


        if(!result.success){

            box.innerHTML =
                `<p>${escapeHTML(
                    result.message ||
                    "Unable to load concerns."
                )}</p>`;

            return;

        }


        let data =
            result.data &&
            Array.isArray(
                result.data.requests
            )
            ?
            result.data.requests
            :
            [];


        if(type !== "all"){

            data =
                data.filter(
                    function(item){

                        return normalizeConcernStatus(
                            item.status
                        ).toLowerCase()
                        ===
                        type.toLowerCase();

                    }
                );

        }


        if(data.length === 0){

            box.innerHTML =
                "<p>No customer concerns found.</p>";

            return;

        }


        let html = "";


        data.forEach(function(item){

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


                    <div class="admin-request-info">

                        <p>
                            <strong>
                                Concern ID:
                            </strong>

                            ${id}
                        </p>


                        <p>
                            <strong>
                                Email:
                            </strong>

                            ${escapeHTML(
                                item.email || ""
                            )}
                        </p>


                        <p>
                            <strong>
                                Contact:
                            </strong>

                            ${escapeHTML(
                                item.contact || ""
                            )}
                        </p>


                        <p>
                            <strong>
                                Address:
                            </strong>

                            ${escapeHTML(
                                item.address || ""
                            )}
                        </p>


                        <p>
                            <strong>
                                Category:
                            </strong>

                            ${escapeHTML(
                                item.category || ""
                            )}
                        </p>


                        <p>
                            <strong>
                                Problem:
                            </strong>
                        </p>


                        <div class="problem-description">

                            ${escapeHTML(
                                item.problem || ""
                            )}

                        </div>


                        <p>
                            <strong>
                                Date:
                            </strong>

                            ${escapeHTML(
                                item.date || ""
                            )}
                        </p>

                    </div>


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

        });


        box.innerHTML =
            html;

    })

    .catch(function(error){

        console.error(
            "Load admin concerns error:",
            error
        );


        box.innerHTML =
            `<p>
                Unable to connect to the LinkTech API.
            </p>`;

    });

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


    if(
        !confirm(
            "Change concern status to " +
            newStatus +
            "?"
        )
    ){

        return;

    }


    apiPost({

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
            "Update status:",
            result
        );


        alert(
            result.message ||
            "Status update completed."
        );


        if(result.success){

            loadAdminDashboard();

            loadAdminConcerns();

            loadMyRequests();

        }

    })

    .catch(function(error){

        console.error(
            "Update concern error:",
            error
        );


        alert(
            "Connection error while updating concern."
        );

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
            "width=900,height=700"
        );


    if(!printWindow){

        alert(
            "Please allow pop-ups to print the report."
        );

        return;

    }


    printWindow.document.write(`

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


    apiGet(

        "getAdminData",

        {

            email:
                currentUser.email

        }

    )

    .then(function(result){

        if(!result.success){

            alert(
                result.message ||
                "Unable to generate report."
            );

            return;

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
// FINAL STARTUP
// ==========================================

window.addEventListener(
    "load",
    function(){

        console.log(
            "LinkTech Home.js startup complete."
        );


        setTimeout(
            function(){

                loadTimeline();

                loadComments();

                if(currentUser){

                    loadMyRequests();

                }

                if(isAdmin){

                    loadAdminData();

                }

            },
            500
        );

    }
);
