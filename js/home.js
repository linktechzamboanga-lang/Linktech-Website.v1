// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// JAVASCRIPT
// PART 8/10
// GOOGLE LOGIN + AUTO ADMIN SYSTEM
// ==========================================


// ==========================================
// GOOGLE CLIENT ID
// ==========================================

const GOOGLE_CLIENT_ID =
"495855477306-9rdg89fh3g5mtolu8th08ltojor8lkkr.apps.googleusercontent.com";



// ==========================================
// GOOGLE APPS SCRIPT API URL
// ==========================================

const API_URL =
"https://script.google.com/macros/s/AKfycbzRmfdun0BXZvGC9S3Hw9EsCUD-CzUQtna6gPI8bKz6X6pl5kHDOrJbFDV9F4iLqVOv/exec";



// ==========================================
// ADMIN GOOGLE ACCOUNT
// ==========================================

const ADMIN_EMAIL =
"linktechzamboanga@gmail.com";




// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;

let isAdmin = false;




// ==========================================
// START SYSTEM
// ==========================================

window.onload=function(){


restoreSession();


initializeGoogle();


};





// ==========================================
// RESTORE SESSION
// ==========================================

function restoreSession(){


let saved =
localStorage.getItem(
"linktechUser"
);



if(saved){


currentUser =
JSON.parse(saved);



showUser();



checkAdmin();



}


}







// ==========================================
// INITIALIZE GOOGLE LOGIN
// ==========================================

function initializeGoogle(){


if(
!window.google ||
!google.accounts
){

console.log(
"Google API loading..."
);


return;

}



google.accounts.id.initialize({

client_id:
GOOGLE_CLIENT_ID,


callback:
handleGoogleLogin


});




let button =
document.getElementById(
"googleLoginButton"
);



if(button){


google.accounts.id.renderButton(

button,

{

theme:"outline",

size:"large",

width:300

}

);


}



}






// ==========================================
// GOOGLE LOGIN RESPONSE
// ==========================================

function handleGoogleLogin(response){


let token =
response.credential;



verifyGoogle(token);



}






// ==========================================
// VERIFY GOOGLE ACCOUNT
// ==========================================

function verifyGoogle(token){



fetch(API_URL,{

method:"POST",


body:JSON.stringify({

action:"googleLogin",

token:token


})


})


.then(res=>res.json())


.then(data=>{



if(data.success){



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



}

else{


alert(
data.message ||
"Login failed"
);


}



})


.catch(err=>{


console.error(err);


alert(
"Connection error"
);


});


}








// ==========================================
// SHOW USER PROFILE
// ==========================================

function showUser(){


let login =
document.getElementById(
"googleLoginButton"
);



if(login)

login.style.display="none";




let profile =
document.getElementById(
"userProfile"
);



if(profile)

profile.style.display="block";




let dashboard =
document.getElementById(
"dashboard"
);



if(dashboard)

dashboard.style.display="block";





let name =
document.getElementById(
"userName"
);



let email =
document.getElementById(
"userEmail"
);



let image =
document.getElementById(
"userImage"
);



if(name)

name.innerHTML =
currentUser.name || "";



if(email)

email.innerHTML =
currentUser.email || "";



if(image)

image.src =
currentUser.picture || "";





let inputName =
document.getElementById(
"name"
);



let inputEmail =
document.getElementById(
"email"
);



if(inputName)

inputName.value =
currentUser.name;



if(inputEmail)

inputEmail.value =
currentUser.email;



}








// ==========================================
// AUTO ADMIN CHECK
// ==========================================

function checkAdmin(){


if(!currentUser)

return;


if(

currentUser.email.toLowerCase()

===

ADMIN_EMAIL.toLowerCase()

){


isAdmin=true;



let adminPanel =
document.getElementById(
"adminPanel"
);



let timelineAdmin =
document.getElementById(
"timelineAdmin"
);



if(adminPanel)

adminPanel.style.display="block";



if(timelineAdmin)

timelineAdmin.style.display="block";



loadAdminData();



}

else{


isAdmin=false;


}



}







// ==========================================
// LOGOUT USER
// ==========================================

function logoutUser(){



localStorage.removeItem(
"linktechUser"
);



currentUser=null;


isAdmin=false;



location.reload();


}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// JAVASCRIPT
// PART 9/10
// CUSTOMER FUNCTIONS
// ==========================================



// ==========================================
// SHOW SECTIONS
// ==========================================

function showConcern(){


hideSections();


let section =
document.getElementById(
"concernSection"
);


if(section)

section.style.display="block";


}



function showRequests(){


hideSections();


let section =
document.getElementById(
"requestSection"
);


if(section)

section.style.display="block";


loadRequests();


}



function showTimeline(){


hideSections();


let section =
document.getElementById(
"timelineSection"
);


if(section)

section.style.display="block";


loadTimeline();


}




function hideSections(){


let sections=[


"concernSection",

"requestSection",

"timelineSection"


];


sections.forEach(id=>{


let element =
document.getElementById(id);


if(element)

element.style.display="none";


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




// TERMS CHECK

let terms =
document.getElementById(
"agreeTerms"
);



if(
terms &&
!terms.checked
){


alert(
"Please accept Terms & Conditions."
);


return;


}





let data={


action:
"submitConcern",


name:
document.getElementById(
"name"
).value,


email:
currentUser.email,


address:
document.getElementById(
"address"
).value,


contact:
document.getElementById(
"contact"
).value,


category:
document.getElementById(
"category"
).value,


problem:
document.getElementById(
"problem"
).value


};




fetch(API_URL,{


method:"POST",


body:
JSON.stringify(data)


})


.then(res=>res.json())


.then(result=>{



let msg =
document.getElementById(
"concernMessage"
);



if(msg)

msg.innerHTML =
result.message;



if(result.success){



document.getElementById(
"problem"
).value="";



alert(
"Concern submitted successfully."
);



}



})


.catch(error=>{


console.error(error);


alert(
"Submit error."
);


});


}








// ==========================================
// LOAD MY REQUESTS
// ==========================================

function loadRequests(){



if(!currentUser)

return;




fetch(

API_URL+

"?action=getMyRequests&email="+

encodeURIComponent(
currentUser.email
)

)


.then(res=>res.json())


.then(result=>{



let box =
document.getElementById(
"myRequests"
);



if(!box)

return;



let html="";



let data =
result.data || [];



if(data.length===0){


html =
"<p>No submitted concerns.</p>";


}

else{


data.forEach(item=>{


html+=`

<div class="request-card">


<h4>
${item.category}
</h4>


<p>
${item.problem}
</p>


<p>

Status:

<b>
${item.status}
</b>

</p>


<small>

${item.date}

</small>


</div>

`;



});


}



box.innerHTML =
html;



})



.catch(err=>{


console.error(err);


});


}









// ==========================================
// SUBMIT COMMENT
// ==========================================

function submitComment(){



if(!currentUser){


alert(
"Login required."
);


return;


}



let text =
document.getElementById(
"commentText"
).value;



if(!text.trim()){


alert(
"Write a comment first."
);


return;


}





fetch(API_URL,{


method:"POST",


body:JSON.stringify({


action:
"submitComment",


email:
currentUser.email,


comment:
text



})


})


.then(res=>res.json())


.then(result=>{



document.getElementById(
"commentLimitMessage"
).innerHTML =
result.message;



if(result.success){


document.getElementById(
"commentText"
).value="";


loadComments();


}



})



.catch(err=>{


console.error(err);


});


}








// ==========================================
// LOAD COMMENTS
// ==========================================

function loadComments(){



fetch(

API_URL+

"?action=getComments"

)


.then(res=>res.json())


.then(result=>{


let box =
document.getElementById(
"commentList"
);



if(!box)

return;



let html="";



(result.data || [])
.forEach(item=>{


html+=`

<div class="comment-card">


<b>
${item.email}
</b>


<p>
${item.comment}
</p>


<small>
${item.date}
</small>


</div>


`;


});



box.innerHTML =
html;



});



}








// ==========================================
// LOAD TIMELINE
// ==========================================

function loadTimeline(){



fetch(

API_URL+

"?action=getTimeline"

)


.then(res=>res.json())


.then(result=>{



let box =
document.getElementById(
"timelineList"
);



if(!box)

return;




let html="";



(result.data || [])
.forEach(post=>{


html+=`

<div class="timeline-post">


<img src="${post.image}"
alt="Timeline Image">


<h3>
${post.title}
</h3>


<p>
${post.caption}
</p>


<small>
Posted:
${post.date}
</small>


</div>


`;



});



box.innerHTML =
html;



})


.catch(err=>{


console.error(err);


});


}

// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// JAVASCRIPT
// PART 10/10
// IMPROVED ADMIN SYSTEM
// ==========================================


// ==========================================
// ADMIN STATUS DEFINITIONS
// ==========================================

const CONCERN_STATUS = {

    PENDING: "Pending",
    PROCESSING: "Processing",
    COMPLETED: "Completed",
    ABORTED: "Aborted"

};



// ==========================================
// SAFE HTML ESCAPE
// ==========================================

function escapeHTML(value){

    if(value === null || value === undefined){
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



// ==========================================
// CHECK ADMIN ACCESS
// ==========================================

function requireAdmin(){

    if(!currentUser){

        alert("Please login first.");

        return false;

    }


    if(!isAdmin){

        alert("Admin access required.");

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

    .then(function(res){

        return res.json();

    })

    .then(function(result){

        if(!result.success){

            console.error(
                result.message
            );

            return;

        }


        const summary =
            result.data.summary || {};



        let total =
            document.getElementById(
                "totalConcerns"
            );


        let pending =
            document.getElementById(
                "pending"
            );


        let processing =
            document.getElementById(
                "processing"
            );


        let completed =
            document.getElementById(
                "completed"
            );


        let aborted =
            document.getElementById(
                "aborted"
            );



        if(total){

            total.textContent =
                summary.totalRequests || 0;

        }


        if(pending){

            pending.textContent =
                summary.pending || 0;

        }


        if(processing){

            processing.textContent =
                summary.processing || 0;

        }


        if(completed){

            completed.textContent =
                summary.completed || 0;

        }


        if(aborted){

            aborted.textContent =
                summary.aborted || 0;

        }

    })

    .catch(function(error){

        console.error(
            "Dashboard error:",
            error
        );

    });

}
        // ==================================
        // NORMALIZE STATUS
        // ==================================

        data = data.map(function(item){

            return {

                ...item,

                status:
                    normalizeConcernStatus(
                        item.status
                    )

            };

        });


        // ==================================
        // TOTAL
        // ==================================

        let total =
            document.getElementById(
                "totalConcerns"
            );


        if(total){

            total.textContent =
                data.length;

        }



        // ==================================
        // PENDING
        // ==================================

        let pending =
            document.getElementById(
                "pending"
            );


        if(pending){

            pending.textContent =
                data.filter(function(item){

                    return item.status ===
                        CONCERN_STATUS.PENDING;

                }).length;

        }



        // ==================================
        // PROCESSING
        // ==================================

        let processing =
            document.getElementById(
                "processing"
            );


        if(processing){

            processing.textContent =
                data.filter(function(item){

                    return item.status ===
                        CONCERN_STATUS.PROCESSING;

                }).length;

        }



        // ==================================
        // COMPLETED
        // ==================================

        let completed =
            document.getElementById(
                "completed"
            );


        if(completed){

            completed.textContent =
                data.filter(function(item){

                    return item.status ===
                        CONCERN_STATUS.COMPLETED;

                }).length;

        }



        // ==================================
        // ABORTED
        // ==================================

        let aborted =
            document.getElementById(
                "aborted"
            );


        if(aborted){

            aborted.textContent =
                data.filter(function(item){

                    return item.status ===
                        CONCERN_STATUS.ABORTED;

                }).length;

        }

    })

    .catch(function(error){

        console.error(
            "Admin dashboard error:",
            error
        );

    });

}



// ==========================================
// NORMALIZE STATUS
// ==========================================

function normalizeConcernStatus(status){

    if(!status){
        return CONCERN_STATUS.PENDING;
    }


    let value =
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
// LOAD ADMIN CONCERNS
// ==========================================

function loadAdminConcerns(){

    if(!requireAdmin()){
        return;
    }


    let box =
        document.getElementById(
            "adminConcerns"
        );


    if(!box){
        return;
    }


    box.innerHTML =
        "<p>Loading customer concerns...</p>";



    let filter =
        document.getElementById(
            "reportType"
        );


    let type =
        filter ?
        filter.value :
        "all";



    fetch(

        API_URL +
        "?action=getAdminData" +
        "&email=" +
        encodeURIComponent(
            currentUser.email
        ) +
        "&filter=" +
        encodeURIComponent(type)

    )

    .then(function(res){

        if(!res.ok){

            throw new Error(
                "HTTP error: " +
                res.status
            );

        }

        return res.json();

    })

    .then(function(result){

        console.log(
            "ADMIN DATA:",
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



        // ==================================
        // IMPORTANT FIX
        // ==================================

        let data =
            result.data &&
            Array.isArray(
                result.data.requests
            )

            ?

            result.data.requests

            :

            [];



        // ==================================
        // NO DATA
        // ==================================

        if(data.length === 0){

            box.innerHTML =
                "<p>No customer concerns found.</p>";

            return;

        }



        // ==================================
        // BUILD CONCERN LIST
        // ==================================

        let html = "";



        data.forEach(function(item){

            let status =
                normalizeConcernStatus(
                    item.status
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

                        <span class="
                            ${getStatusClass(status)}
                        ">
                            ${escapeHTML(status)}
                        </span>

                    </div>


                    <p>
                        <strong>
                            Concern ID:
                        </strong>

                        ${escapeHTML(
                            item.id || ""
                        )}
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
                            Submitted:
                        </strong>

                        ${escapeHTML(
                            item.date || ""
                        )}

                    </p>



                    <div class="admin-request-actions">


                        <button
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
                                'Pending'
                            )"
                        >
                            Pending
                        </button>


                        <button
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
                                'Processing'
                            )"
                        >
                            Processing
                        </button>


                        <button
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
                                'Completed'
                            )"
                        >
                            Completed
                        </button>


                        <button
                            onclick="updateConcern(
                                '${escapeHTML(item.id)}',
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
            "Admin concern loading error:",
            error
        );


        box.innerHTML =

            `<p>
                Unable to load customer concerns.
                Please check the Google Apps Script API.
            </p>`;

    });

}
        // ==================================
        // CLIENT-SIDE FILTER
        // ==================================

        if(type !== "all"){

            data =
                data.filter(function(item){

                    return normalizeConcernStatus(
                        item.status
                    ).toLowerCase()
                    ===
                    type.toLowerCase();

                });

        }



        // ==================================
        // NO RECORDS
        // ==================================

        if(data.length === 0){

            box.innerHTML =

                `<div class="no-concerns">
                    <p>No customer concerns found.</p>
                </div>`;

            return;

        }



        // ==================================
        // BUILD ADMIN CARDS
        // ==================================

        let html = "";



        data.forEach(function(item){

            let status =
                normalizeConcernStatus(
                    item.status
                );


            let statusClass =
                getStatusClass(status);


            let id =
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

                        <span class="${statusClass}">
                            ${escapeHTML(status)}
                        </span>

                    </div>


                    <div class="admin-request-info">

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

                    </div>


                    <div class="admin-request-actions">

                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                '${CONCERN_STATUS.PENDING}'
                            )"
                        >
                            Pending
                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                '${CONCERN_STATUS.PROCESSING}'
                            )"
                        >
                            Processing
                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                '${CONCERN_STATUS.COMPLETED}'
                            )"
                        >
                            Completed
                        </button>


                        <button
                            type="button"
                            onclick="updateConcern(
                                '${id}',
                                '${CONCERN_STATUS.ABORTED}'
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

            `<p class="error-message">
                Unable to connect to the LinkTech API.
                Please check your internet connection
                and Google Apps Script deployment.
            </p>`;

    });

}



// ==========================================
// UPDATE CONCERN STATUS
// ==========================================

function updateConcern(id, status){

    if(!requireAdmin()){
        return;
    }


    if(!id){

        alert(
            "Concern ID is missing."
        );

        return;

    }


    let newStatus =
        normalizeConcernStatus(
            status
        );


    let confirmation =

        confirm(

            "Change concern status to " +
            newStatus +
            "?"

        );


    if(!confirmation){
        return;
    }



    fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

            action:
                "updateConcernStatus",

            email:
                currentUser.email,

            id:
                id,

            status:
                newStatus

        })

    })

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
            "Update status response:",
            result
        );


        if(result.success){

            alert(
                result.message ||
                "Concern status updated successfully."
            );


            // Refresh dashboard
            loadAdminDashboard();


            // Refresh concern list
            loadAdminConcerns();

        }

        else{

            alert(

                result.message ||
                "Unable to update concern status."

            );

        }

    })

    .catch(function(error){

        console.error(
            "Update concern error:",
            error
        );


        alert(
            "Connection error while updating concern status."
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


    let container =
        document.getElementById(
            "adminConcerns"
        );


    if(!container){

        alert(
            "Admin concern list not found."
        );

        return;

    }


    let content =
        container.innerHTML;


    let printWindow =
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

            ${content}

        </body>

        </html>

    `);


    printWindow.document.close();

    printWindow.focus();

    printWindow.print();

}



// ==========================================
// CSV VALUE ESCAPE
// ==========================================

function csvEscape(value){

    if(value === null ||
       value === undefined){

        return "";

    }


    return '"' +
        String(value)
        .replace(/"/g,'""') +
        '"';

}



// ==========================================
// DOWNLOAD CSV REPORT
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
                "HTTP error: " +
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


        let rows = [

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



        (result.data || [])
        .forEach(function(item){

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

        });



        let csv =

            rows.map(function(row){

                return row.map(
                    csvEscape
                ).join(",");

            }).join("\r\n");



        let blob =

            new Blob(

                [csv],

                {
                    type:
                    "text/csv;charset=utf-8;"
                }

            );



        let url =
            URL.createObjectURL(
                blob
            );


        let a =
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


        URL.revokeObjectURL(url);

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
// CREATE TIMELINE POST
// ==========================================

function createPost(){

    if(!requireAdmin()){
        return;
    }


    let title =
        document.getElementById(
            "postTitle"
        ).value.trim();


    let caption =
        document.getElementById(
            "postCaption"
        ).value.trim();


    let image =
        document.getElementById(
            "postImage"
        ).value.trim();



    if(!title){

        alert(
            "Please enter a post title."
        );

        return;

    }



    fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

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

    })

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        alert(
            result.message ||
            "Post operation completed."
        );


        if(result.success){

            loadTimeline();

        }

    })

    .catch(function(error){

        console.error(
            "Create post error:",
            error
        );

        alert(
            "Unable to create post."
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


    if(!confirm(
        "Delete this timeline post?"
    )){

        return;

    }



    fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

            action:
                "deletePost",

            email:
                currentUser.email,

            id:
                id

        })

    })

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        alert(
            result.message
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

    });

}



// ==========================================
// EDIT TIMELINE POST
// ==========================================

function editTimelinePost(id){

    if(!requireAdmin()){
        return;
    }


    let title =
        prompt(
            "New title:"
        );


    if(title === null){
        return;
    }


    let caption =
        prompt(
            "New caption:"
        );


    if(caption === null){
        return;
    }



    fetch(API_URL,{

        method:"POST",

        body:JSON.stringify({

            action:
                "updatePost",

            email:
                currentUser.email,

            id:
                id,

            title:
                title,

            caption:
                caption,

            image:
                ""

        })

    })

    .then(function(response){

        return response.json();

    })

    .then(function(result){

        alert(
            result.message
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

    });

}
