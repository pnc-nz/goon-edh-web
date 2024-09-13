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

  let cards_to_include = "";
  let cards_to_omit = [];

  lines.forEach((line) => {
    // Extract card name after the first space
    const cardName = line.split(" ", 2)[1]?.trim();

    // Check for banned cards
    if (bannedCards.has(cardName)) {
      cards_to_omit.push(cardName);
    } else {
      cards_to_include += line + "\n"; // Include valid card
    }
  });

  // DEBUG:
  console.log("CARDS TO OMIT");
  console.log(cards_to_omit);

  // Display output and warnings
  document.getElementById("cards-include").textContent = cards_to_include;
  if (cards_to_omit.length > 0) {
    document.getElementById("cards-remove").textContent = cards_to_omit;
    alert("Warning! Banned or non-proxyable cards found: " + cards_to_omit.join(", "));
  }
}

// Clear decklist: remove all input
async function clearDecklist(decklist) {
  decklist.value = "";
}

// Handle the decklist paste input and process the deck
document.getElementById("clearDeck").addEventListener("click", () => {
  const decklist = document.getElementById("decklist").value;
  if (decklist.trim() !== "") {
    clearDecklist(decklist);
  }
});

// Handle the decklist paste input and process the deck
document.getElementById("processDeck").addEventListener("click", () => {
  const decklist = document.getElementById("decklist").value;

  if (decklist.trim() !== "") {
    processDecklist(decklist);
  } else {
    alert("Please paste a valid decklist.");
  }
});
