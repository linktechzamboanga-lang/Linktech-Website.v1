// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// JAVASCRIPT
// PART 1A-1/4
// CONFIGURATION + GLOBAL VARIABLES + STARTUP
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
// ADMIN ACCOUNT
// ==========================================

const ADMIN_EMAIL =
"linktechzamboanga@gmail.com";


// ==========================================
// LOCAL STORAGE KEY
// ==========================================

const STORAGE_KEY =
"linktechUser";


// ==========================================
// CURRENT USER
// ==========================================

let currentUser = null;

let isAdmin = false;


// ==========================================
// SYSTEM STARTUP
// ==========================================

window.addEventListener(
"load",
initializeSystem
);


// ==========================================
// INITIALIZE SYSTEM
// ==========================================

function initializeSystem(){

restoreSession();

waitForGoogle();

}


// ==========================================
// WAIT FOR GOOGLE IDENTITY API
// ==========================================

function waitForGoogle(retry = 0){

const MAX_RETRY = 20;

if(
window.google &&
google.accounts &&
google.accounts.id
){

initializeGoogle();

return;

}

if(retry >= MAX_RETRY){

console.error(
"Google Identity Services failed to load."
);

const msg =
document.getElementById(
"loginMessage"
);

if(msg){

msg.innerHTML =
"Unable to load Google Sign-In. Please refresh the page.";

}

return;

}

setTimeout(function(){

waitForGoogle(
retry + 1
);

},500);

}


// ==========================================
// SAFE JSON PARSE
// ==========================================

function safeParse(json){

try{

return JSON.parse(json);

}
catch(error){

console.error(
"Invalid session:",
error
);

return null;

}

}


// ==========================================
// SHOW MESSAGE
// ==========================================

function showMessage(id,message){

const element =
document.getElementById(id);

if(element){

element.innerHTML = message;

}

}


// ==========================================
// HIDE ELEMENT
// ==========================================

function hideElement(id){

const element =
document.getElementById(id);

if(element){

element.style.display = "none";

}

}


// ==========================================
// SHOW ELEMENT
// ==========================================

function showElement(id,display="block"){

const element =
document.getElementById(id);

if(element){

element.style.display = display;

}

}


// ==========================================
// PART 1A-2/4
// SESSION RESTORE + GOOGLE INITIALIZATION
// ==========================================


// ==========================================
// RESTORE USER SESSION
// ==========================================

function restoreSession(){

let savedUser =
localStorage.getItem(
STORAGE_KEY
);


if(!savedUser){

return;

}


let user =
safeParse(savedUser);


if(user){

currentUser = user;


showUser();


checkAdmin();


}
else{


localStorage.removeItem(
STORAGE_KEY
);


}

}



// ==========================================
// INITIALIZE GOOGLE LOGIN
// ==========================================

function initializeGoogle(){


google.accounts.id.initialize({

client_id:
GOOGLE_CLIENT_ID,


callback:
handleGoogleLogin,


auto_select:false


});



// GOOGLE LOGIN BUTTON

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

width:300,

text:"signin_with"

}

);


}



// OPTIONAL ONE TAP LOGIN

/*
google.accounts.id.prompt();
*/


console.log(
"Google Login Initialized"
);


}




// ==========================================
// GOOGLE LOGIN RESPONSE
// ==========================================

function handleGoogleLogin(response){


if(!response || !response.credential){


showMessage(
"loginMessage",
"Google login failed."
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


fetch(
API_URL,
{

method:"POST",

headers:{

"Content-Type":
"application/json"

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



.then(function(res){


return res.json();


})



.then(function(data){


console.log(
"Google Login Response:",
data
);



if(data.success){



currentUser =
data.data;



localStorage.setItem(

STORAGE_KEY,

JSON.stringify(
currentUser
)

);



showUser();



checkAdmin();



showMessage(

"loginMessage",

"Login successful."

);



}
else{


showMessage(

"loginMessage",

data.message ||
"Google login failed."

);



}



})



.catch(function(error){


console.error(
"Google Login Error:",
error
);



showMessage(

"loginMessage",

"Connection error. Please try again."

);



});


}


// ==========================================
// PART 1B-1/4
// USER PROFILE + ADMIN ACCESS SYSTEM
// ==========================================


// ==========================================
// SHOW USER PROFILE
// ==========================================

function showUser(){


if(!currentUser){

return;

}



// Hide Google Login Button

hideElement(
"googleLoginButton"
);



// Show User Profile

showElement(
"userProfile",
"block"
);



// Show Dashboard

showElement(
"dashboard",
"block"
);



// USER NAME

const name =
document.getElementById(
"userName"
);


if(name){

name.innerHTML =
currentUser.name || "User";

}



// USER EMAIL

const email =
document.getElementById(
"userEmail"
);


if(email){

email.innerHTML =
currentUser.email || "";

}



// USER IMAGE

const image =
document.getElementById(
"userImage"
);


if(image){


if(currentUser.picture){

image.src =
currentUser.picture;

}
else{

image.src =
"";

}


}



// AUTO FILL CONCERN FORM

const inputName =
document.getElementById(
"name"
);


if(inputName){

inputName.value =
currentUser.name || "";

}



// AUTO FILL EMAIL

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
// CHECK ADMIN ACCOUNT
// ==========================================

function checkAdmin(){


if(!currentUser){

isAdmin=false;

return;

}



let email =
(currentUser.email || "")
.toLowerCase();



if(
email ===
ADMIN_EMAIL.toLowerCase()
){



isAdmin=true;



// Show Admin Panel

showElement(
"adminPanel",
"block"
);



// Show Timeline Admin Controls

showElement(
"timelineAdmin",
"block"
);



// Load Admin Information

loadAdminData();



}
else{


isAdmin=false;



// Hide Admin Areas

hideElement(
"adminPanel"
);


hideElement(
"timelineAdmin"
);



}



}



// ==========================================
// CHECK ADMIN PERMISSION
// ==========================================

function requireAdmin(){


if(!isAdmin){


alert(
"Admin access required."
);


return false;


}


return true;


}




// ==========================================
// LOGOUT USER
// ==========================================

function logoutUser(){



localStorage.removeItem(
STORAGE_KEY
);



currentUser = null;


isAdmin = false;



if(
google &&
google.accounts &&
google.accounts.id
){


google.accounts.id.disableAutoSelect();


}



location.reload();



}


// ==========================================
// PART 1B-2/4
// API HELPER + COMMON REQUEST HANDLER
// ==========================================


// ==========================================
// API POST REQUEST HELPER
// ==========================================

async function apiPost(data){


try{


const response =
await fetch(

API_URL,

{

method:"POST",

headers:{

"Content-Type":
"application/json"

},

body:
JSON.stringify(data)

}

);



const result =
await response.json();



return result;



}
catch(error){


console.error(
"API POST ERROR:",
error
);



return {

success:false,

message:
"Connection error. Please try again."

};


}



}




// ==========================================
// API GET REQUEST HELPER
// ==========================================

async function apiGet(params){


try{


const query =
new URLSearchParams(
params
).toString();



const response =
await fetch(

API_URL +
"?" +
query

);



const result =
await response.json();



return result;



}
catch(error){


console.error(
"API GET ERROR:",
error
);



return {

success:false,

message:
"Connection error. Please try again.",

data:[]

};


}



}




// ==========================================
// CLEAR LOGIN DATA
// ==========================================

function clearSession(){


localStorage.removeItem(
STORAGE_KEY
);


currentUser = null;


isAdmin = false;


}




// ==========================================
// REQUIRE LOGIN
// ==========================================

function requireLogin(){


if(!currentUser){


alert(
"Please login with Google first."
);


return false;


}



return true;


}




// ==========================================
// SAFE ELEMENT VALUE
// ==========================================

function getValue(id){


const element =
document.getElementById(id);



if(element){

return element.value.trim();

}



return "";

}



// ==========================================
// SET ELEMENT VALUE
// ==========================================

function setValue(id,value){


const element =
document.getElementById(id);



if(element){

element.value =
value || "";

}



}



// ==========================================
// FORMAT DATE
// ==========================================

function formatDate(date){


if(!date){

return "";

}


return new Date(date)
.toLocaleString();


}



// ==========================================
// DEBUG USER SESSION
// ==========================================

function debugSession(){


console.log({

currentUser:
currentUser,

isAdmin:
isAdmin

});


}


// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// JAVASCRIPT
// PART 2/4
// CUSTOMER FUNCTIONS
// ==========================================


// ==========================================
// SECTION NAVIGATION
// ==========================================


function showConcern(){


hideSections();


showElement(
"concernSection",
"block"
);


}



function showRequests(){


hideSections();


showElement(
"requestSection",
"block"
);


loadRequests();


}



function showTimeline(){


hideSections();


showElement(
"timelineSection",
"block"
);


loadTimeline();


}



function hideSections(){


const sections = [

"concernSection",

"requestSection",

"timelineSection"

];


sections.forEach(function(id){


hideElement(id);


});


}





// ==========================================
// SUBMIT CUSTOMER CONCERN
// ==========================================


async function submitConcern(){



if(!requireLogin()){

return;

}



const terms =
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



const data = {


action:
"submitConcern",


name:
getValue("name"),


email:
currentUser.email,


address:
getValue("address"),


contact:
getValue("contact"),


category:
getValue("category"),


problem:
getValue("problem")



};



if(!data.problem){


alert(
"Please enter your concern."
);


return;


}




const result =
await apiPost(data);



showMessage(

"concernMessage",

result.message

);



if(result.success){



setValue(
"problem",
""
);



alert(
"Concern submitted successfully."
);



}



}







// ==========================================
// LOAD MY REQUESTS
// ==========================================


async function loadRequests(){



if(!requireLogin()){

return;

}



const result =
await apiGet({

action:
"getMyRequests",


email:
currentUser.email

});



const box =
document.getElementById(
"myRequests"
);



if(!box){

return;

}



let html = "";



const data =
result.data || [];



if(data.length === 0){


html =
"<p>No submitted concerns.</p>";


}

else{



data.forEach(function(item){



html += `

<div class="request-card">


<h4>
${item.category || "Concern"}
</h4>


<p>
${item.problem || ""}
</p>


<p>

Status:

<b>
${item.status || "Pending"}
</b>

</p>


<small>
${formatDate(item.date)}
</small>


</div>

`;



});



}



box.innerHTML =
html;



}







// ==========================================
// SUBMIT COMMENT
// ==========================================


async function submitComment(){



if(!requireLogin()){

return;

}



const text =
getValue(
"commentText"
);



if(!text){


alert(
"Write a comment first."
);


return;


}



const result =
await apiPost({

action:
"submitComment",


email:
currentUser.email,


comment:
text


});



showMessage(

"commentLimitMessage",

result.message

);



if(result.success){


setValue(
"commentText",
""
);



loadComments();



}



}







// ==========================================
// LOAD COMMENTS
// ==========================================


async function loadComments(){



const result =
await apiGet({

action:
"getComments"

});



const box =
document.getElementById(
"commentList"
);



if(!box){

return;

}



let html = "";



(result.data || [])
.forEach(function(item){



html += `

<div class="comment-card">


<b>
${item.email || ""}
</b>


<p>
${item.comment || ""}
</p>


<small>
${formatDate(item.date)}
</small>


</div>

`;



});



box.innerHTML =
html;



}







// ==========================================
// LOAD TIMELINE POSTS
// ==========================================


async function loadTimeline(){



const result =
await apiGet({

action:
"getTimeline"

});



const box =
document.getElementById(
"timelineList"
);



if(!box){

return;

}



let html = "";



(result.data || [])
.forEach(function(post){



html += `

<div class="timeline-post">


${post.image ? 
`<img src="${post.image}" 
alt="Timeline Image">`
:
""}



<h3>
${post.title || ""}
</h3>


<p>
${post.caption || ""}
</p>


<small>
Posted:
${formatDate(post.date)}
</small>


</div>

`;



});



box.innerHTML =
html;



}


// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// JAVASCRIPT
// PART 3/4
// TIMELINE MANAGEMENT SYSTEM
// ==========================================


// ==========================================
// REFRESH TIMELINE
// ==========================================

async function refreshTimeline(){

await loadTimeline();

}





// ==========================================
// CREATE TIMELINE POST
// ==========================================

async function createPost(){



if(!requireAdmin()){

return;

}



const title =
getValue(
"postTitle"
);



const caption =
getValue(
"postCaption"
);



const image =
getValue(
"postImage"
);



if(!title){


alert(
"Please enter post title."
);


return;


}



const result =
await apiPost({

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



alert(

result.message ||

"Post created."

);



if(result.success){



setValue(
"postTitle",
""
);



setValue(
"postCaption",
""
);



setValue(
"postImage",
""
);



loadTimeline();



}



}







// ==========================================
// LOAD ADMIN TIMELINE
// ==========================================

async function loadAdminTimeline(){



if(!requireAdmin()){

return;

}



const result =
await apiGet({

action:
"getTimeline",

email:
currentUser.email

});



const box =
document.getElementById(
"adminTimelineList"
);



if(!box){

return;

}



let html = "";



(result.data || [])
.forEach(function(post){



html += `

<div class="admin-timeline-card">


<h3>
${post.title || ""}
</h3>


<p>
${post.caption || ""}
</p>



<button onclick="editTimelinePost('${post.id}')">

Edit

</button>



<button onclick="deleteTimelinePost('${post.id}')">

Delete

</button>


</div>

`;



});



box.innerHTML =
html;



}







// ==========================================
// DELETE TIMELINE POST
// ==========================================

async function deleteTimelinePost(id){



if(!requireAdmin()){

return;

}



if(
!confirm(
"Delete this timeline post?"
)

){

return;

}



const result =
await apiPost({

action:
"deletePost",


email:
currentUser.email,


id:
id


});



alert(

result.message ||

"Post deleted."

);



if(result.success){



loadTimeline();


loadAdminTimeline();



}



}







// ==========================================
// EDIT TIMELINE POST
// ==========================================

async function editTimelinePost(id){



if(!requireAdmin()){

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



const result =
await apiPost({

action:
"updatePost",


email:
currentUser.email,


id:
id,


title:
title,


caption:
caption



});



alert(

result.message ||

"Post updated."

);



if(result.success){



loadTimeline();


loadAdminTimeline();



}



}







// ==========================================
// TOGGLE TIMELINE ADMIN PANEL
// ==========================================

function toggleTimelineAdmin(){



if(!requireAdmin()){

return;

}



const panel =
document.getElementById(
"timelineAdmin"
);



if(!panel){

return;

}



if(panel.style.display === "none"){

panel.style.display="block";

}
else{

panel.style.display="none";

}



}







// ==========================================
// AUTO LOAD TIMELINE WHEN USER LOGIN
// ==========================================

function initializeTimeline(){


if(
document.getElementById(
"timelineSection"
)

){


loadTimeline();


}



if(isAdmin){


loadAdminTimeline();


}



}


// ==========================================
// LINKTECH CUSTOMER SUPPORT PORTAL
// JAVASCRIPT
// PART 4/4
// ADMIN DASHBOARD + REPORT SYSTEM
// ==========================================


// ==========================================
// LOAD ADMIN DATA
// ==========================================

async function loadAdminData(){


if(!requireAdmin()){

return;

}



loadAdminDashboard();

loadAdminConcerns();

loadAdminTimeline();


}





// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================

async function loadAdminDashboard(){



if(!currentUser){

return;

}



const result =
await apiGet({

action:
"getAdminData",


email:
currentUser.email


});



if(!result.success){

return;

}



const data =
result.data || [];



const total =
document.getElementById(
"totalConcerns"
);



const pending =
document.getElementById(
"pending"
);



const completed =
document.getElementById(
"completed"
);



if(total){

total.innerHTML =
data.length;

}



if(pending){

pending.innerHTML =

data.filter(function(item){

return item.status === "Pending";

}).length;

}



if(completed){

completed.innerHTML =

data.filter(function(item){

return item.status === "Completed";

}).length;

}



}





// ==========================================
// LOAD ADMIN CONCERNS
// ==========================================

async function loadAdminConcerns(){



if(!requireAdmin()){

return;

}



const filter =
getValue(
"reportType"
) || "all";



const result =
await apiGet({

action:
"getAdminData",


email:
currentUser.email,


filter:
filter


});



const box =
document.getElementById(
"adminConcerns"
);



if(!box){

return;

}



let html = "";



(result.data || [])
.forEach(function(item){



html += `

<div class="admin-request">


<h3>
${item.name || ""}
</h3>


<p>
Email:
${item.email || ""}
</p>


<p>
Category:
${item.category || ""}
</p>


<p>
Problem:
${item.problem || ""}
</p>


<p>
Status:

<b>
${item.status || ""}
</b>

</p>



<button onclick="updateConcern('${item.id}','Completed')">

Complete

</button>



<button onclick="updateConcern('${item.id}','Processing')">

Processing

</button>



</div>

`;



});



box.innerHTML =
html;



}







// ==========================================
// UPDATE CONCERN STATUS
// ==========================================

async function updateConcern(id,status){



if(!requireAdmin()){

return;

}



const result =
await apiPost({

action:
"updateConcernStatus",


email:
currentUser.email,


id:
id,


status:
status


});



alert(

result.message ||

"Status updated."

);



if(result.success){


loadAdminData();


}



}







// ==========================================
// PRINT REPORT
// ==========================================

function printReport(){



const content =
document.getElementById(
"adminConcerns"
);



if(!content){

return;

}



const printWindow =
window.open(
"",
"",
"width=900,height=700"
);



printWindow.document.write(`

<html>

<head>

<title>
LinkTech Report
</title>


<style>

body{

font-family:Arial;

padding:20px;

}


.admin-request{

border:1px solid #ccc;

padding:15px;

margin-bottom:10px;

}


</style>


</head>


<body>


<h2>
LinkTech Customer Concern Report
</h2>


${content.innerHTML}


</body>


</html>

`);



printWindow.document.close();


printWindow.focus();


printWindow.print();



}







// ==========================================
// DOWNLOAD CSV REPORT
// ==========================================

async function downloadCSV(){



if(!requireAdmin()){

return;

}



const result =
await apiGet({

action:
"getAdminData",


email:
currentUser.email


});



const rows = [


[

"Name",

"Email",

"Category",

"Problem",

"Status",

"Date"

]


];



(result.data || [])
.forEach(function(item){



rows.push([

item.name || "",

item.email || "",

item.category || "",

item.problem || "",

item.status || "",

item.date || ""

]);


});



const csv =

rows.map(function(row){


return row.map(function(value){


return '"' +

String(value)
.replace(/"/g,'""')

+

'"';


}).join(",");



}).join("\n");





const blob =
new Blob(

[csv],

{

type:
"text/csv"

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
"LinkTech_Report.csv";


link.click();



URL.revokeObjectURL(
url
);



}







// ==========================================
// FINAL SYSTEM INITIALIZATION
// ==========================================

function finalizeSystem(){


if(currentUser){


showUser();


checkAdmin();


}



if(
document.getElementById(
"timelineList"
)

){


loadTimeline();


}



}



// ==========================================
// AUTO RUN AFTER PAGE READY
// ==========================================

document.addEventListener(

"DOMContentLoaded",

function(){


setTimeout(

finalizeSystem,

1000

);


}

);