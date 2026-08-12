// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 1/4
// GOOGLE LOGIN + SESSION + NAVIGATION
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
"https://script.google.com/macros/s/AKfycbxzvfGPnBsZje_wElmPfXTitSs3Id5zU8h73yK9e_gXn-z8eHa4e8ye9jfOPLY6K5PS/exec";



// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;

let isAdmin = false;

let googleInitialized = false;


// ==========================================
// PAGE LOAD
// ==========================================

window.addEventListener("load", function(){

    console.log(
        "LinkTech home.js loaded."
    );

    restoreSession();

    waitForGoogle();

});


// ==========================================
// WAIT FOR GOOGLE IDENTITY SERVICES
// ==========================================

function waitForGoogle(){

    if(
        window.google &&
        google.accounts &&
        google.accounts.id
    ){

        initializeGoogle();

        return;

    }


    setTimeout(
        waitForGoogle,
        300
    );

}


// ==========================================
// INITIALIZE GOOGLE
// ==========================================

function initializeGoogle(){

    if(googleInitialized){

        return;

    }


    const button =
        document.getElementById(
            "googleLoginButton"
        );


    if(!button){

        console.error(
            "googleLoginButton not found."
        );

        return;

    }


    try{

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
            "flex";

        button.style.justifyContent =
            "center";

        button.style.visibility =
            "visible";


        console.log(
            "Google Sign-In initialized."
        );

    }

    catch(error){

        console.error(
            "Google initialization error:",
            error
        );

    }

}


// ==========================================
// GOOGLE LOGIN CALLBACK
// ==========================================

function handleGoogleLogin(response){

    if(
        !response ||
        !response.credential
    ){

        alert(
            "Google login failed."
        );

        return;

    }


    verifyGoogle(
        response.credential
    );

}


// ==========================================
// VERIFY GOOGLE TOKEN
// ==========================================

function verifyGoogle(token){

    if(!token){

        alert(
            "Google token is missing."
        );

        return;

    }


    showLoadingMessage(
        "Signing in..."
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
                "HTTP " +
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

            throw new Error(
                result.message ||
                "Google login failed."
            );

        }


        currentUser =
            result.data;


        /*
         * IMPORTANT:
         * Admin status comes from Code.gs.
         * No admin email is stored here.
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

        showDashboard();

        setupInitialView();


        if(isAdmin){

            showAdminPanel();

            loadAdminData();

        }
        else{

            hideAdminPanel();

        }


        loadComments();

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
// RESTORE SESSION
// ==========================================

function restoreSession(){

    try{

        const saved =
            localStorage.getItem(
                "linktechUser"
            );


        if(!saved){

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
            "Restored session:",
            currentUser.email
        );


        showUser();

        showDashboard();

        setupInitialView();


        if(isAdmin){

            showAdminPanel();

            setTimeout(
                loadAdminData,
                300
            );

        }
        else{

            hideAdminPanel();

        }


        setTimeout(
            loadComments,
            300
        );

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

        isAdmin = false;

    }

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


    const name =
        document.getElementById(
            "userName"
        );


    if(name){

        name.textContent =
            currentUser.name || "";

    }


    const email =
        document.getElementById(
            "userEmail"
        );


    if(email){

        email.textContent =
            currentUser.email || "";

    }


    const image =
        document.getElementById(
            "userImage"
        );


    if(image){

        image.src =
            currentUser.picture || "";

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
// SHOW DASHBOARD
// ==========================================

function showDashboard(){

    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if(dashboard){

        dashboard.style.display =
            "block";

    }

}


// ==========================================
// INITIAL CUSTOMER VIEW
// ==========================================

function setupInitialView(){

    hideAllCustomerSections();

    showConcern();

}


// ==========================================
// HIDE CUSTOMER SECTIONS
// ==========================================

function hideAllCustomerSections(){

    const sections = [

        "concernSection",

        "requestSection",

        "timelineSection",

        "commentSection"

    ];


    sections.forEach(function(id){

        const element =
            document.getElementById(id);


        if(element){

            element.style.display =
                "none";

        }

    });

}


// ==========================================
// SHOW SUBMIT CONCERN
// ==========================================

function showConcern(){

    if(!requireLogin()){

        return;

    }


    hideAllCustomerSections();


    const section =
        document.getElementById(
            "concernSection"
        );


    if(section){

        section.style.display =
            "block";

    }


    scrollToElement(
        "concernSection"
    );

}


// ==========================================
// SHOW MY REQUESTS
// ==========================================

function showRequests(){

    if(!requireLogin()){

        return;

    }


    hideAllCustomerSections();


    const section =
        document.getElementById(
            "requestSection"
        );


    if(section){

        section.style.display =
            "block";

    }


    loadMyRequests();


    scrollToElement(
        "requestSection"
    );

}


// ==========================================
// SHOW TIMELINE
// ==========================================

function showTimeline(){

    if(!requireLogin()){

        return;

    }


    hideAllCustomerSections();


    const section =
        document.getElementById(
            "timelineSection"
        );


    if(section){

        section.style.display =
            "block";

    }


    loadTimeline();


    scrollToElement(
        "timelineSection"
    );

}


// ==========================================
// REQUIRE LOGIN
// ==========================================

function requireLogin(){

    if(!currentUser){

        alert(
            "Please sign in with Google first."
        );

        return false;

    }


    return true;

}


// ==========================================
// SCROLL
// ==========================================

function scrollToElement(id){

    const element =
        document.getElementById(id);


    if(!element){

        return;

    }


    setTimeout(function(){

        element.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    },50);

}


// ==========================================
// LOADING MESSAGE
// ==========================================

function showLoadingMessage(message){

    const button =
        document.getElementById(
            "googleLoginButton"
        );


    if(button){

        button.setAttribute(
            "data-loading",
            message || "Loading..."
        );

    }

}


// ==========================================
// LOGOUT
// ==========================================

function logoutUser(){

    localStorage.removeItem(
        "linktechUser"
    );


    currentUser =
        null;


    isAdmin =
        false;


    try{

        if(
            window.google &&
            google.accounts &&
            google.accounts.id
        ){

            google.accounts.id.disableAutoSelect();

        }

    }
    catch(error){

        console.warn(
            "Google logout warning:",
            error
        );

    }


    location.reload();

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
// PART 2/4
// CONCERNS + REQUESTS + COMMENTS
// ==========================================


// ==========================================
// SUBMIT CUSTOMER CONCERN
// ==========================================

// ==========================================
// SUBMIT CUSTOMER CONCERN
// ==========================================

function submitConcern(){

    if(!requireLogin()){

        return;

    }


    // ======================================
    // CHECK TERMS & CONDITIONS
    // ======================================

    const agree =
        document.getElementById(
            "agreeTerms"
        );


    if(
        agree &&
        !agree.checked
    ){

        alert(
            "Please agree to the Terms & Conditions."
        );

        return;

    }


    // ======================================
    // GET FORM DATA
    // ======================================

    const name =
        getValue("name");

    const email =
        getValue("email") ||
        currentUser.email;

    const address =
        getValue("address");

    const contact =
        getValue("contact");

    const category =
        getValue("category");

    const problem =
        getValue("problem");


    // ======================================
    // VALIDATION
    // ======================================

    if(!name){

        alert(
            "Full name is required."
        );

        return;

    }


    if(!email){

        alert(
            "Google email is required."
        );

        return;

    }


    if(!problem){

        alert(
            "Please describe your concern."
        );

        return;

    }


    // ======================================
    // SUBMIT BUTTON
    // ======================================

    const button =
        document.getElementById(
            "submitConcernBtn"
        );


    if(button){

        button.disabled =
            true;

        button.textContent =
            "Checking...";

    }


    // ======================================
    // SEND TO CODE.GS
    // ======================================

    const payload = {

        action:
            "submitConcern",

        email:
            email,

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

    };


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
                JSON.stringify(
                    payload
                )

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
            "Submit concern result:",
            result
        );


        // ==================================
        // BLOCKED ACTIVE CONCERN
        // ==================================

        if(
            result.blocked === true ||
            (
                result.data &&
                result.data.blocked === true
            )
        ){

            const blockedStatus =
                result.status ||
                (
                    result.data &&
                    result.data.status
                ) ||
                "Pending";


            const message =
                result.message ||
                (
                    "You already have an active concern (" +
                    blockedStatus +
                    "). Please wait until it is Completed or Aborted."
                );


            const concernMessage =
                document.getElementById(
                    "concernMessage"
                );


            if(concernMessage){

                concernMessage.textContent =
                    message;

                concernMessage.style.color =
                    "#ff5555";

            }


            alert(message);

            return;

        }


        // ==================================
        // OTHER SERVER ERROR
        // ==================================

        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to submit concern."
            );

        }


        // ==================================
        // SUCCESS
        // ==================================

        const message =
            document.getElementById(
                "concernMessage"
            );


        if(message){

            message.textContent =
                "Concern submitted successfully.";

            message.style.color =
                "#00ff99";

        }


        alert(
            "Your concern has been submitted successfully."
        );


        clearConcernForm();


        // ==================================
        // SHOW MY REQUESTS
        // ==================================

        setTimeout(function(){

            showRequests();

        },500);

    })

    .catch(function(error){

        console.error(
            "Submit concern error:",
            error
        );


        const message =
            document.getElementById(
                "concernMessage"
            );


        if(message){

            message.textContent =
                error.message ||
                "Unable to submit your concern.";

            message.style.color =
                "#ff5555";

        }


        alert(
            error.message ||
            "Unable to submit your concern."
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
// GET ELEMENT VALUE
// ==========================================

function getValue(id){

    const element =
        document.getElementById(id);


    if(!element){

        return "";

    }


    return String(
        element.value || ""
    ).trim();

}


// ==========================================
// CLEAR CONCERN FORM
// ==========================================

function clearConcernForm(){

    const fields = [

        "address",

        "contact",

        "category",

        "problem"

    ];


    fields.forEach(function(id){

        const element =
            document.getElementById(id);


        if(element){

            element.value =
                "";

        }

    });


    const agree =
        document.getElementById(
            "agreeTerms"
        );


    if(agree){

        agree.checked =
            false;

    }

}


// ==========================================
// LOAD MY REQUESTS
// ==========================================

function loadMyRequests(){

    if(!requireLogin()){

        return;

    }


    const container =
        document.getElementById(
            "myRequests"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "<p>Loading your requests...</p>";


    fetch(

        API_URL +
        "?action=getMyRequests" +
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

        console.log(
            "My requests:",
            result
        );


        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to load requests."
            );

        }


        const data =
            Array.isArray(result.data)
            ?
            result.data
            :
            [];


        if(data.length === 0){

            container.innerHTML = `

                <div class="no-concerns">

                    <p>
                        You have not submitted
                        any concerns yet.
                    </p>

                </div>

            `;

            return;

        }


        let html = "";


        data.forEach(function(item){

            const status =
                normalizeConcernStatus(
                    item.status
                );


            html += `

                <div class="admin-card">

                    <h3>
                        ${escapeHTML(
                            item.category ||
                            "IT Concern"
                        )}
                    </h3>


                    <p>
                        <strong>
                            Reference ID:
                        </strong>

                        ${escapeHTML(
                            item.id || ""
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
                            Status:
                        </strong>

                        <span class="${getStatusClass(status)}">

                            ${escapeHTML(status)}

                        </span>

                    </p>


                    <p>

                        <strong>
                            Submitted:
                        </strong>

                        ${escapeHTML(
                            formatDate(
                                item.date
                            )
                        )}

                    </p>

                </div>

            `;

        });


        container.innerHTML =
            html;

    })

    .catch(function(error){

        console.error(
            "Load requests error:",
            error
        );


        container.innerHTML = `

            <p class="error-message">

                Unable to load your requests.

            </p>

        `;

    });

}


// ==========================================
// SUBMIT COMMUNITY COMMENT
// ==========================================

function submitComment(){

    if(!requireLogin()){

        return;

    }


    const textarea =
        document.getElementById(
            "commentText"
        );


    if(!textarea){

        return;

    }


    const comment =
        textarea.value.trim();


    if(!comment){

        alert(
            "Please enter a comment."
        );

        return;

    }


    const payload = {

        action:
            "submitComment",

        email:
            currentUser.email,

        comment:
            comment

    };


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
                JSON.stringify(
                    payload
                )

        }

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        console.log(
            "Comment result:",
            result
        );


        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to post comment."
            );

        }


        textarea.value =
            "";


        const message =
            document.getElementById(
                "commentLimitMessage"
            );


        if(message){

            message.textContent =
                "Comment posted successfully.";

            message.style.color =
                "#00ff99";

        }


        loadComments();

    })

    .catch(function(error){

        console.error(
            "Comment error:",
            error
        );


        const message =
            document.getElementById(
                "commentLimitMessage"
            );


        if(message){

            message.textContent =
                error.message;

            message.style.color =
                "#ff5555";

        }


        alert(
            error.message ||
            "Unable to post comment."
        );

    });

}


// ==========================================
// LOAD COMMENTS
// ==========================================

function loadComments(){

    const container =
        document.getElementById(
            "commentList"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "<p>Loading comments...</p>";


    fetch(

        API_URL +
        "?action=getComments"

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to load comments."
            );

        }


        const comments =
            Array.isArray(result.data)
            ?
            result.data
            :
            [];


        if(comments.length === 0){

            container.innerHTML =
                "<p>No comments yet.</p>";

            return;

        }


        let html = "";


        comments.forEach(function(item){

            html += `

                <div class="comment">

                    <strong>
                        ${escapeHTML(
                            item.email || "User"
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            item.comment || ""
                        )}
                    </p>

                    <small>

                        ${escapeHTML(
                            formatDate(
                                item.date
                            )
                        )}

                    </small>

                </div>

            `;

        });


        container.innerHTML =
            html;

    })

    .catch(function(error){

        console.error(
            "Comments error:",
            error
        );


        container.innerHTML =
            "<p>Unable to load comments.</p>";

    });

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 3/4
// TIMELINE + ADMIN DASHBOARD
// ==========================================


// ==========================================
// LOAD TIMELINE
// ==========================================

function loadTimeline(){

    const container =
        document.getElementById(
            "timelineList"
        );


    if(!container){

        console.error(
            "timelineList not found."
        );

        return;

    }


    container.innerHTML =
        "<p>Loading timeline...</p>";


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

            throw new Error(
                result.message ||
                "Unable to load timeline."
            );

        }


        const posts =
            Array.isArray(result.data)
            ?
            result.data
            :
            [];


        if(posts.length === 0){

            container.innerHTML = `

                <div class="no-concerns">

                    <p>
                        No timeline posts available.
                    </p>

                </div>

            `;

            return;

        }


        let html = "";


        posts
            .slice()
            .reverse()
            .forEach(function(post){

                html += buildTimelinePost(
                    post
                );

            });


        container.innerHTML =
            html;


        if(isAdmin){

            renderAdminTimeline(
                posts
            );

        }

    })

    .catch(function(error){

        console.error(
            "Timeline error:",
            error
        );


        container.innerHTML = `

            <p class="error-message">

                Unable to load timeline.

            </p>

        `;

    });

}


// ==========================================
// BUILD TIMELINE POST
// ==========================================

function buildTimelinePost(post){

    const image =
        post.image || "";


    const imageHTML =
        image
        ?
        `

            <div class="timeline-image">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(
                        post.title || "Timeline"
                    )}"
                    onerror="this.style.display='none';">

            </div>

        `
        :
        "";


    return `

        <article
            class="timeline-post"
            data-post-id="${escapeHTML(
                post.id || ""
            )}">

            ${imageHTML}


            <div class="timeline-content">

                <h3>

                    ${escapeHTML(
                        post.title ||
                        "Untitled Post"
                    )}

                </h3>


                <p>

                    ${escapeHTML(
                        post.caption || ""
                    )}

                </p>


                <small>

                    Posted by
                    ${escapeHTML(
                        post.postedBy ||
                        "LinkTech"
                    )}

                    <br>

                    ${escapeHTML(
                        formatDate(
                            post.date
                        )
                    )}

                </small>

            </div>

        </article>

    `;

}


// ==========================================
// RENDER ADMIN TIMELINE
// ==========================================

function renderAdminTimeline(posts){

    const container =
        document.getElementById(
            "adminTimelineList"
        );


    if(!container){

        return;

    }


    if(!isAdmin){

        container.innerHTML =
            "";

        return;

    }


    if(
        !Array.isArray(posts) ||
        posts.length === 0
    ){

        container.innerHTML =
            "<p>No timeline posts.</p>";

        return;

    }


    let html = "";


    posts
        .slice()
        .reverse()
        .forEach(function(post){

            html += `

                <div class="admin-card">

                    <h3>

                        ${escapeHTML(
                            post.title || ""
                        )}

                    </h3>


                    <p>

                        ${escapeHTML(
                            post.caption || ""
                        )}

                    </p>


                    <small>

                        ${escapeHTML(
                            formatDate(
                                post.date
                            )
                        )}

                    </small>


                    <br><br>


                    <button
                        type="button"
                        onclick="editTimelinePost(
                            '${escapeHTML(post.id)}'
                        )">

                        Edit

                    </button>


                    <button
                        type="button"
                        onclick="deleteTimelinePost(
                            '${escapeHTML(post.id)}'
                        )">

                        Delete

                    </button>

                </div>

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


    const title =
        getValue("postTitle");


    const caption =
        getValue("postCaption");


    const image =
        getValue("postImage");


    if(!title){

        alert(
            "Post title is required."
        );

        return;

    }


    const payload = {

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

    };


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
                JSON.stringify(
                    payload
                )

        }

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to create post."
            );

        }


        alert(
            "Timeline post published."
        );


        document.getElementById(
            "postTitle"
        ).value = "";


        document.getElementById(
            "postCaption"
        ).value = "";


        document.getElementById(
            "postImage"
        ).value = "";


        loadTimeline();

    })

    .catch(function(error){

        console.error(
            "Create post error:",
            error
        );


        alert(
            error.message ||
            "Unable to create post."
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


    const payload = {

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

    };


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
                JSON.stringify(
                    payload
                )

        }

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to update post."
            );

        }


        alert(
            "Timeline post updated."
        );


        loadTimeline();

    })

    .catch(function(error){

        console.error(
            "Edit post error:",
            error
        );


        alert(
            error.message ||
            "Unable to update post."
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

        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to delete post."
            );

        }


        alert(
            "Timeline post deleted."
        );


        loadTimeline();

    })

    .catch(function(error){

        console.error(
            "Delete post error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete post."
        );

    });

}


// ==========================================
// ADMIN PANEL
// ==========================================

function showAdminPanel(){

    const panel =
        document.getElementById(
            "adminPanel"
        );


    if(panel){

        panel.style.display =
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

}


// ==========================================
// HIDE ADMIN PANEL
// ==========================================

function hideAdminPanel(){

    const panel =
        document.getElementById(
            "adminPanel"
        );


    if(panel){

        panel.style.display =
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
// REQUIRE ADMIN
// ==========================================

function requireAdmin(){

    if(!currentUser){

        alert(
            "Please sign in first."
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
// LOAD ADMIN DATA
// ==========================================

function loadAdminData(){

    if(!requireAdmin()){

        return;

    }


    loadAdminConcerns();

}


// ==========================================
// LOAD ADMIN CONCERNS
// ==========================================

function loadAdminConcerns(){

    if(!requireAdmin()){

        return;

    }


    const container =
        document.getElementById(
            "adminConcerns"
        );


    if(!container){

        return;

    }


    container.innerHTML =
        "<p>Loading customer concerns...</p>";


    const reportElement =
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


    const reportType =
        reportElement
        ?
        reportElement.value
        :
        "new";


    const statusFilter =
        statusElement
        ?
        statusElement.value
        :
        "all";


    const categoryFilter =
        categoryElement
        ?
        categoryElement.value
        :
        "all";


    fetch(

        API_URL +
        "?action=getAdminData" +
        "&email=" +
        encodeURIComponent(
            currentUser.email
        ) +
        "&filter=" +
        encodeURIComponent(
            reportType
        )

    )

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        console.log(
            "Admin data:",
            result
        );


        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to load admin data."
            );

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


        data =
            filterAdminRecords(
                data,
                reportType,
                statusFilter,
                categoryFilter
            );


        updateAdminStatistics(
            data
        );


        renderAdminTable(
            data
        );

    })

    .catch(function(error){

        console.error(
            "Admin data error:",
            error
        );


        container.innerHTML = `

            <p class="error-message">

                ${escapeHTML(
                    error.message ||
                    "Unable to load customer concerns."
                )}

            </p>

        `;

    });

}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// HOME.JS
// PART 4/4
// ADMIN TABLE + FILTERS + STATUS UPDATES
// ==========================================


// ==========================================
// FILTER ADMIN RECORDS
// ==========================================

function filterAdminRecords(
    data,
    reportType,
    statusFilter,
    categoryFilter
){

    let result =
        Array.isArray(data)
        ?
        data.slice()
        :
        [];


    const now =
        new Date();


    // ======================================
    // DATE FILTER
    // ======================================

    if(reportType === "new"){

        result =
            result.filter(function(item){

                return normalizeConcernStatus(
                    item.status
                ) ===
                "Pending";

            });

    }


    if(reportType === "week"){

        const sevenDays =
            7 *
            24 *
            60 *
            60 *
            1000;


        result =
            result.filter(function(item){

                const date =
                    new Date(item.date);


                return (
                    now - date
                ) <=
                sevenDays;

            });

    }


    if(reportType === "month"){

        result =
            result.filter(function(item){

                const date =
                    new Date(item.date);


                return (

                    date.getMonth() ===
                    now.getMonth()

                    &&

                    date.getFullYear() ===
                    now.getFullYear()

                );

            });

    }


    if(reportType === "year"){

        result =
            result.filter(function(item){

                const date =
                    new Date(item.date);


                return (

                    date.getFullYear() ===
                    now.getFullYear()

                );

            });

    }


    // ======================================
    // STATUS FILTER
    // ======================================

    if(
        statusFilter &&
        statusFilter !== "all"
    ){

        result =
            result.filter(function(item){

                return normalizeConcernStatus(
                    item.status
                ).toLowerCase()
                ===
                statusFilter
                    .toLowerCase();

            });

    }


    // ======================================
    // CATEGORY FILTER
    // ======================================

    if(
        categoryFilter &&
        categoryFilter !== "all"
    ){

        result =
            result.filter(function(item){

                return String(
                    item.category || ""
                )
                .trim()
                .toLowerCase()
                ===
                categoryFilter
                    .trim()
                    .toLowerCase();

            });

    }


    return result;

}


// ==========================================
// ADMIN STATISTICS
// ==========================================

function updateAdminStatistics(data){

    const total =
        document.getElementById(
            "totalConcerns"
        );


    const pending =
        document.getElementById(
            "pending"
        );


    const processing =
        document.getElementById(
            "processing"
        );


    const completed =
        document.getElementById(
            "completed"
        );


    const aborted =
        document.getElementById(
            "aborted"
        );


    const records =
        Array.isArray(data)
        ?
        data
        :
        [];


    if(total){

        total.textContent =
            records.length;

    }


    if(pending){

        pending.textContent =
            records.filter(function(item){

                return normalizeConcernStatus(
                    item.status
                ) === "Pending";

            }).length;

    }


    if(processing){

        processing.textContent =
            records.filter(function(item){

                return normalizeConcernStatus(
                    item.status
                ) === "Processing";

            }).length;

    }


    if(completed){

        completed.textContent =
            records.filter(function(item){

                return normalizeConcernStatus(
                    item.status
                ) === "Completed";

            }).length;

    }


    if(aborted){

        aborted.textContent =
            records.filter(function(item){

                return normalizeConcernStatus(
                    item.status
                ) === "Aborted";

            }).length;

    }

}


// ==========================================
// RENDER ADMIN TABLE
// ==========================================

function renderAdminTable(data){

    const container =
        document.getElementById(
            "adminConcerns"
        );


    if(!container){

        return;

    }


    if(
        !Array.isArray(data) ||
        data.length === 0
    ){

        container.innerHTML = `

            <div class="no-concerns">

                <p>
                    No customer concerns found
                    for the selected filters.
                </p>

            </div>

        `;

        return;

    }


    let html = `

        <div class="admin-table-wrapper">

            <table class="admin-concern-table">

                <thead>

                    <tr>

                        <th>
                            Reference ID
                        </th>

                        <th>
                            Customer
                        </th>

                        <th>
                            Email
                        </th>

                        <th>
                            Contact
                        </th>

                        <th>
                            Category
                        </th>

                        <th>
                            Problem
                        </th>

                        <th>
                            Date
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Actions
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


        html += `

            <tr>

                <td>

                    ${escapeHTML(
                        item.id || ""
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        item.name ||
                        "Unknown"
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        item.email || ""
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        item.contact || ""
                    )}

                </td>


                <td>

                    ${escapeHTML(
                        item.category ||
                        "Others"
                    )}

                </td>


                <td>

                    <div class="admin-problem">

                        ${escapeHTML(
                            item.problem || ""
                        )}

                    </div>

                </td>


                <td>

                    ${escapeHTML(
                        formatDate(
                            item.date
                        )
                    )}

                </td>


                <td>

                    <span class="${getStatusClass(status)}">

                        ${escapeHTML(
                            status
                        )}

                    </span>

                </td>


                <td>

                    <div class="status-actions">

                        <button
                            type="button"
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
                                'Pending'
                            )">

                            Pending

                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
                                'Processing'
                            )">

                            Processing

                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
                                'Completed'
                            )">

                            Completed

                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
                                'Aborted'
                            )">

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


    container.innerHTML =
        html;

}


// ==========================================
// STATUS DEFINITIONS
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
// UPDATE CONCERN STATUS
// ==========================================

function updateConcern(
    id,
    status
){

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

            throw new Error(
                result.message ||
                "Unable to update status."
            );

        }


        alert(
            "Concern status updated successfully.\n\n" +
            "The customer notification email has been requested."
        );


        loadAdminData();


        /*
         * If the admin changes the status to
         * Completed, Pending, etc., the user's
         * next My Requests refresh will display
         * the new status.
         */

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
// REPORT FILTER CHANGE
// ==========================================

document.addEventListener(
    "change",
    function(event){

        if(
            event.target &&
            (

                event.target.id ===
                "reportType"

                ||

                event.target.id ===
                "statusFilter"

                ||

                event.target.id ===
                "categoryFilter"

            )

        ){

            if(isAdmin){

                loadAdminData();

            }

        }

    }
);


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
            "Admin concern table not found."
        );

        return;

    }


    const printWindow =
        window.open(
            "",
            "_blank",
            "width=1200,height=800"
        );


    if(!printWindow){

        alert(
            "Please allow pop-ups for printing."
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
                    display:none;
                }

                .status-actions{
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
                ${escapeHTML(
                    new Date().toLocaleString()
                )}
            </p>

            ${container.innerHTML}

        </body>

        </html>

    `);


    printWindow.document.close();


    printWindow.focus();


    setTimeout(function(){

        printWindow.print();

    },500);

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
        )

        +

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

        return response.json();

    })

    .then(function(result){

        if(!result.success){

            throw new Error(
                result.message ||
                "Unable to load report."
            );

        }


        const data =
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


        data.forEach(function(item){

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

                formatDate(
                    item.date
                )

            ]);

        });


        const csv =
            rows
            .map(function(row){

                return row
                    .map(csvEscape)
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
            error.message ||
            "Unable to download CSV."
        );

    });

}


// ==========================================
// DATE FORMAT
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

        return String(value);

    }


    return date.toLocaleString();

}
