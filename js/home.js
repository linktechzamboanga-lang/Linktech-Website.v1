const GOOGLE_CLIENT_ID =
"495855477306-9rdg89fh3g5mtolu8th08ltojor8lkkr.apps.googleusercontent.com";

const API_URL =
"https://script.google.com/macros/s/AKfycbz_r84riscYI5Cdyq4qucX3kb64VWsH-WPSxffqJs-lQZEXCouPv73QlDTC0xSnxCxV/exec";

const ADMIN_EMAIL =
"linktechzamboanga@gmail.com";

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
// ADMIN SYSTEM + REPORT + TIMELINE MANAGEMENT
// ==========================================



// ==========================================
// LOAD ADMIN DATA
// ==========================================

function loadAdminData(){


if(!isAdmin){

alert(
"Admin access required."
);

return;

}



loadAdminDashboard();

loadAdminConcerns();

}




// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================

function loadAdminDashboard(){



fetch(

API_URL+

"?action=getAdminData"+

"&email="+

encodeURIComponent(
currentUser.email
)

)


.then(res=>res.json())


.then(result=>{


if(!result.success)

return;



let data =
result.data || [];



let total =
document.getElementById(
"totalConcerns"
);


let pending =
document.getElementById(
"pending"
);



let completed =
document.getElementById(
"completed"
);



if(total)

total.innerHTML =
data.length;



if(pending)

pending.innerHTML =
data.filter(

x=>x.status=="Pending"

).length;



if(completed)

completed.innerHTML =
data.filter(

x=>x.status=="Completed"

).length;



});


}







// ==========================================
// LOAD ADMIN CONCERNS
// ==========================================

function loadAdminConcerns(){



let filter =
document.getElementById(
"reportType"
);



let type =
filter ?
filter.value :
"all";




fetch(

API_URL+

"?action=getAdminData"+

"&email="+

encodeURIComponent(
currentUser.email
)

+

"&filter="+type

)


.then(res=>res.json())


.then(result=>{



let box =
document.getElementById(
"adminConcerns"
);



if(!box)

return;



let html="";



(result.data || [])
.forEach(item=>{


html+=`

<div class="admin-request">


<h3>
${item.name}
</h3>


<p>
Email:
${item.email}
</p>


<p>
Category:
${item.category}
</p>


<p>
Problem:
${item.problem}
</p>


<p>

Status:

<b>
${item.status}
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



});


}








// ==========================================
// UPDATE CONCERN STATUS
// ==========================================

function updateConcern(id,status){



fetch(API_URL,{


method:"POST",


body:JSON.stringify({


action:
"updateConcernStatus",


email:
currentUser.email,


id:id,


status:status


})


})


.then(res=>res.json())


.then(result=>{


alert(
result.message
);


loadAdminData();


});


}








// ==========================================
// PRINT REPORT
// ==========================================

function printReport(){


let content =

document.getElementById(
"adminConcerns"
).innerHTML;



let windowPrint =
window.open(
"",
"",
"width=900,height=700"
);



windowPrint.document.write(`

<html>

<head>

<title>
LinkTech Report
</title>

</head>


<body>


<h2>
LinkTech Customer Concern Report
</h2>


${content}


</body>


</html>

`);



windowPrint.print();



}









// ==========================================
// DOWNLOAD CSV REPORT
// ==========================================

function downloadCSV(){



fetch(

API_URL+

"?action=getAdminData"+

"&email="+

encodeURIComponent(
currentUser.email
)

)


.then(res=>res.json())


.then(result=>{



let rows=[


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
.forEach(item=>{


rows.push([

item.name,

item.email,

item.category,

item.problem,

item.status,

item.date

]);


});




let csv =
rows.map(row=>

row.join(",")

).join("\n");



let blob =
new Blob(

[csv],

{

type:
"text/csv"

}

);



let url =
URL.createObjectURL(blob);



let a =
document.createElement("a");


a.href=url;


a.download=
"LinkTech_Report.csv";


a.click();



});



}








// ==========================================
// CREATE TIMELINE POST
// ==========================================

function createPost(){



if(!isAdmin)

return;



let title =
document.getElementById(
"postTitle"
).value;



let caption =
document.getElementById(
"postCaption"
).value;



let image =
document.getElementById(
"postImage"
).value;



fetch(API_URL,{


method:"POST",


body:JSON.stringify({


action:
"createPost",


email:
currentUser.email,


title:title,


caption:caption,


image:image


})


})


.then(res=>res.json())


.then(result=>{


alert(
result.message
);


loadTimeline();


});



}








// ==========================================
// DELETE TIMELINE POST
// ==========================================

function deleteTimelinePost(id){



fetch(API_URL,{


method:"POST",


body:JSON.stringify({


action:
"deletePost",


email:
currentUser.email,


id:id


})


})


.then(res=>res.json())


.then(result=>{


alert(
result.message
);


loadTimeline();


});


}








// ==========================================
// EDIT TIMELINE POST
// ==========================================

function editTimelinePost(id){



let title =
prompt(
"New title:"
);



let caption =
prompt(
"New caption:"
);



fetch(API_URL,{


method:"POST",


body:JSON.stringify({


action:
"updatePost",


email:
currentUser.email,


id:id,


title:title,


caption:caption,


image:""


})


})


.then(res=>res.json())


.then(result=>{


alert(
result.message
);


loadTimeline();


});


}
