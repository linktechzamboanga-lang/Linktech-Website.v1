
/* ==========================================
   DaFishTech GAME ENGINE
========================================== */

const foods = [
    { name: "Shrimp", emoji: "🦐" },
    { name: "Worm", emoji: "🪱" },
    { name: "Sardine", emoji: "🐟" },
    { name: "Crab", emoji: "🦀" },
    { name: "Squid", emoji: "🦑" },
    { name: "Bread", emoji: "🍞" },
    { name: "Corn", emoji: "🌽" },
    { name: "Cheese", emoji: "🧀" },
    { name: "Hotdog", emoji: "🌭" },
    { name: "Candy", emoji: "🍬" },
    { name: "Banana", emoji: "🍌" },
    { name: "Burger", emoji: "🍔" }
];

let currentTeam = "";
let currentRound = 1;
let fishScore = 0;
let fishermanScore = 0;

let selectedFood = null;
let currentOptions = [];
let gameFinished = false;


/* ==========================================
   HELPERS
========================================== */

function showScreen(id) {

    const screens = [
        "loginScreen",
        "gameScreen"
    ];

    screens.forEach(screen => {
        document.getElementById(screen).classList.add("hidden");
    });

    document.getElementById(id).classList.remove("hidden");
}


function showPanel(id) {

    const panels = [
        "fishermanPanel",
        "fishPanel",
        "resultPanel",
        "winnerPanel"
    ];

    panels.forEach(panel => {
        document.getElementById(panel).classList.add("hidden");
    });

    document.getElementById(id).classList.remove("hidden");
}


function shuffle(array) {

    return [...array].sort(() => Math.random() - 0.5);

}


function updateScore() {

    document.getElementById("fisherScore").textContent =
        fishermanScore;

    document.getElementById("fishScore").textContent =
        fishScore;

    document.getElementById("roundNumber").textContent =
        currentRound + " / 5";

    document.getElementById("progressBar").style.width =
        (fishScore / 5 * 100) + "%";
}


/* ==========================================
   TEAM LOGIN
========================================== */

function selectTeam(team) {

    currentTeam = team;

    showScreen("gameScreen");

    document.getElementById("teamTitle").textContent =
        team === "fisherman"
            ? "🎣 Fisherman Team"
            : "🐟 Fish Team";

    startGame();

}


/* ==========================================
   START GAME
========================================== */

function startGame() {

    currentRound = 1;
    fishScore = 0;
    fishermanScore = 0;

    gameFinished = false;

    updateScore();

    if (currentTeam === "fisherman") {

        showPanel("fishermanPanel");

        prepareBaits();

    } else {

        showPanel("fishPanel");

        document.getElementById("fishChoices").innerHTML = "";

        document.getElementById("fishMessage").textContent =
            "Waiting for the fisherman to cast...";

    }

}


/* ==========================================
   PREPARE BAIT OPTIONS
========================================== */

function prepareBaits() {

    selectedFood = null;

    currentOptions = shuffle(foods).slice(0, 5);

    const container = document.getElementById("baitSetup");

    container.innerHTML = "";

    currentOptions.forEach((food, index) => {

        const button = document.createElement("button");

        button.className = "bait-option";

        button.innerHTML = `
            <span class="bait-emoji">${food.emoji}</span>
            <strong>${food.name}</strong>
        `;

        button.onclick = () => {

            selectedFood = index;

            document.querySelectorAll("#baitSetup .bait-option")
                .forEach(item => item.classList.remove("selected"));

            button.classList.add("selected");

            document.getElementById("castButton").disabled = false;

            document.getElementById("fisherMessage").textContent =
                "Real food selected! Ready to cast your line.";

        };

        container.appendChild(button);

    });

    document.getElementById("castButton").disabled = true;

    document.getElementById("fisherMessage").textContent =
        "Choose the real food first.";

}


/* ==========================================
   FISHERMAN CASTS
========================================== */

function castLine() {

    if (selectedFood === null || gameFinished) return;

    showPanel("fishPanel");

    document.getElementById("fishMessage").textContent =
        "🎣 The line is in the water! Find the real food!";

    const container = document.getElementById("fishChoices");

    container.innerHTML = "";

    currentOptions.forEach((food, index) => {

        const button = document.createElement("button");

        button.className = "bait-option";

        button.innerHTML = `
            <span class="bait-emoji">${food.emoji}</span>
            <strong>${food.name}</strong>
        `;

        button.onclick = () => fishGuess(index, button);

        container.appendChild(button);

    });

}


/* ==========================================
   FISH MAKES A GUESS
========================================== */

function fishGuess(index, button) {

    if (gameFinished) return;

    const allButtons = document.querySelectorAll(
        "#fishChoices .bait-option"
    );

    allButtons.forEach(item => item.disabled = true);

    if (index === selectedFood) {

        // CORRECT FOOD
        fishScore++;

        updateScore();

        button.classList.add("selected");

        document.getElementById("resultEmoji").textContent = "🐟";

        document.getElementById("resultTitle").textContent =
            "YUMMY! Correct Food!";

        document.getElementById("resultDescription").textContent =
            "You found the real food! The fisherman couldn't catch you. You survived round " +
            currentRound + "!";

        document.getElementById("nextButton").textContent =
            fishScore >= 5
                ? "CLAIM VICTORY 🏆"
                : "NEXT ROUND →";

        showPanel("resultPanel");

    } else {

        // WRONG FOOD - CAUGHT
        fishermanScore++;

        updateScore();

        button.style.background = "#ffe9e9";

        button.style.borderColor = "#ef7777";

        button.style.color = "#bd3333";

        document.getElementById("resultEmoji").textContent = "🎣";

        document.getElementById("resultTitle").textContent =
            "GOTCHA! FISH CAUGHT!";

        document.getElementById("resultDescription").textContent =
            "Oh no! You chose a fake lure! The fisherman caught you!";

        document.getElementById("nextButton").textContent =
            "SEE WINNER 🏆";

        showPanel("resultPanel");

    }

}


/* ==========================================
   NEXT ROUND / FINAL RESULT
========================================== */

function nextRound() {

    if (gameFinished) return;

    // Fish wins after five successful guesses
    if (fishScore >= 5) {

        finishGame("fish");

        return;

    }

    // Fisherman wins after one wrong guess
    if (fishermanScore >= 1) {

        finishGame("fisherman");

        return;

    }

    currentRound++;

    updateScore();

    if (currentTeam === "fisherman") {

        showPanel("fishermanPanel");

        prepareBaits();

    } else {

        showPanel("fishPanel");

        document.getElementById("fishChoices").innerHTML = "";

        document.getElementById("fishMessage").textContent =
            "Round " + currentRound + "! Waiting for the next cast.";

    }

}


/* ==========================================
   GAME WINNER
========================================== */

function finishGame(winner) {

    gameFinished = true;

    showPanel("winnerPanel");

    if (winner === "fish") {

        document.getElementById("winnerEmoji").textContent = "🏆🐟";

        document.getElementById("winnerTitle").textContent =
            "FISH TEAM WINS!";

        document.getElementById("winnerDescription").textContent =
            "Congratulations! You survived all five fishing casts and ate the real food every time! The fisherman is officially hungry! 😂";

    } else {

        document.getElementById("winnerEmoji").textContent = "🎣🏆";

        document.getElementById("winnerTitle").textContent =
            "FISHERMAN TEAM WINS!";

        document.getElementById("winnerDescription").textContent =
            "Congratulations! You tricked the fish and successfully caught it! Better luck next time, little fish! 😂";

    }

}


/* ==========================================
   RESET GAME
========================================== */

function resetGame() {

    currentTeam = "";
    currentRound = 1;

    fishScore = 0;
    fishermanScore = 0;

    selectedFood = null;
    currentOptions = [];

    gameFinished = false;

    updateScore();

    showScreen("loginScreen");

}
