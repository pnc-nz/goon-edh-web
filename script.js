// GitHub URL for banned cards
const bannedCardsURL = "https://raw.githubusercontent.com/pnc-nz/goon-edh-web/main/banned_cards.txt";

// Fetch banned cards list from GitHub
async function fetchBannedCards() {
  try {
    const response = await fetch(bannedCardsURL);
    const data = await response.text();
    return new Set(
      data
        .split("\n")
        .map((card) => card.trim().replace("1 ", ""))
        .filter(Boolean)
    );
  } catch (error) {
    console.error("Error fetching banned cards:", error);
    return new Set();
  }
}

// Process decklist: remove basic lands and check for banned cards
async function processDecklist(decklist) {
  const bannedCards = await fetchBannedCards();
  const lines = decklist.split("\n").filter((line) => line.trim() !== "");

  let output = "";
  let warnings = [];

  lines.forEach((line) => {
    // Extract card name after the first space
    const cardName = line.split(" ", 2)[1]?.trim();

    // Check for banned cards
    if (bannedCards.has(cardName)) {
      warnings.push(cardName);
    }

    output += line + "\n"; // Include valid card
  });

  // Display output and warnings
  document.getElementById("output").textContent = output;
  if (warnings.length > 0) {
    alert("Warning! Banned or non-proxyable cards found: " + warnings.join(", "));
  }
}

// Handle the decklist paste input and process the deck
document.getElementById("processDeck").addEventListener("click", () => {
  const decklist = document.getElementById("decklist").value;

  if (decklist.trim() !== "") {
    processDecklist(decklist);
  } else {
    alert("Please paste a valid decklist.");
  }
});
