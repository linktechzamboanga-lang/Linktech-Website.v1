<script>


/* =========================
   PAYMENT FORM
========================= */

const paymentForm =
    document.getElementById(
        "paymentForm"
    );


const statusBox =
    document.getElementById(
        "status"
    );


paymentForm.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        const name =
            document
                .getElementById(
                    "customerName"
                )
                .value
                .trim();


        const email =
            document
                .getElementById(
                    "customerEmail"
                )
                .value
                .trim();


        const reference =
            document
                .getElementById(
                    "gcashReference"
                )
                .value
                .trim();


        if (
            !name ||
            !email ||
            !reference
        ) {

            showStatus(
                "Please complete all fields.",
                "error"
            );

            return;

        }


        /*
         * IMPORTANT
         *
         * This currently sends the
         * information to your website
         * backend.
         *
         * Replace the URL below with
         * your real API endpoint.
         */

        const API_URL =
            "https://YOUR-DOMAIN.COM/api/pro-payment";


        const paymentData = {

            product:
                "Computer Inventory Pro",

            amount:
                150,

            currency:
                "PHP",

            name:
                name,

            email:
                email,

            gcashReference:
                reference

        };


        showStatus(
            "Submitting your payment details...",
            "success"
        );


        fetch(
            API_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify(
                        paymentData
                    )

            }
        )

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Server error"
                );

            }

            return response.json();

        })

        .then(data => {


            if (
                data.success
            ) {

                showStatus(

                    "Payment details submitted successfully." +
                    "<br><br>" +

                    "Your ₱150 payment will be verified." +
                    "<br>" +

                    "After approval, your Pro APK download will be provided.",

                    "success"

                );

            } else {

                showStatus(

                    data.message ||
                    "Unable to submit payment.",

                    "error"

                );

            }

        })

        .catch(error => {

            console.error(
                error
            );

            showStatus(

                "Unable to connect to the payment server. Please try again.",

                "error"

            );

        });

    }
);


/* =========================
   STATUS
========================= */

function showStatus(
    message,
    type
) {

    statusBox.innerHTML =
        message;

    statusBox.className =
        "status " + type;

}


</script>
