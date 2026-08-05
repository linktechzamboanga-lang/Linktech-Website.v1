function searchSoftware(){

    let input = document
    .getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();


    let cards = document.querySelectorAll(".card");


    cards.forEach(card=>{


        let title = card
        .querySelector("h3")
        .textContent
        .toLowerCase();


        let description = card
        .querySelector("p")
        .textContent
        .toLowerCase();



        if(
            title.includes(input) ||
            description.includes(input)
        ){

            card.style.display="";

        }
        else{

            card.style.display="none";

        }


    });


}



/* =========================
   DOWNLOAD BUTTON SYSTEM
========================= */


const downloadButtons =
document.querySelectorAll(".download-btn");



downloadButtons.forEach(button=>{


button.addEventListener("click",function(){


    let file =
    this.getAttribute("data-file");


    let text =
    this.querySelector(".btn-text");



    /* START LOADING */


    this.classList.add("downloading");


    text.innerText =
    "Preparing Download...";



    /*
       OPEN DOWNLOAD
       New tab prevents
       browser blocking
    */


    setTimeout(()=>{


        window.open(
            file,
            "_blank"
        );


    },800);




    /* SUCCESS MESSAGE */


    setTimeout(()=>{


        this.classList.remove(
            "downloading"
        );


        this.classList.add(
            "success"
        );


        text.innerText =
        "Download Started";


    },1500);




    /* RESET BUTTON */


    setTimeout(()=>{


        this.classList.remove(
            "success"
        );


        text.innerText =
        "Download";


    },5000);



});

});
