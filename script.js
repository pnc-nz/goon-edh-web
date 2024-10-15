const basicLandsDeckId = "9637985";
const nonBasicLandsDeckId = "7966401";
const bannedCardsDeckId = "7853311";
// BASIC LANDS - https://archidekt.com/decks/9637985
// NON-BASIC LANDS - https://archidekt.com/decks/7966401
// Browser: https://archidekt.com/decks/7853311/banlist_draft
// API: https://archidekt.com/api/decks/7853311/
// ## DECK
// bannedDeck.name // deck name
// bannedDeck.featured // hero image
// bannedDeck.categories[] // array of all categories possible for this deck
// ## CARDS
// bannedDeck.cards[x].categories[] // all
// bannedDeck.cards[x].card.id // card id
// bannedDeck.cards[x].card.oracleCard.name // card name

// Fading Elements
function fadeoutElement(element) {
  // let element = document.getElementById(element);
  let opacity = 1;
  function fader() {
    opacity -= 0.1; // Reduce opacity by 10% each step
    element.style.opacity = opacity;
    if (opacity > 0) {
      setTimeout(fader, 100); // Repeat every 20 milliseconds
    }
    if (opacity <= 0) {
      element.remove();
    }
  }
  fader();
}
// Dynamic Message
function showMessage(message, messageType, messageTimeoutMs) {
  // Create a new div element
  const messageElement = document.createElement("div");

  // Set the text content with the appropriate emoji
  let emoji = "";
  let backgroundColor = "";

  switch (messageType.toUpperCase()) {
    case "INFO":
      emoji = "ℹ️";
      backgroundColor = "#f0f0f0"; // Light grey/white
      break;
    case "WARNING":
      emoji = "⚠️";
      backgroundColor = "#fff3cd"; // Light yellow
      break;
    case "ERROR":
      emoji = "❌";
      backgroundColor = "#f8d7da"; // Light red
      break;
    case "SUCCESS":
      emoji = "✅";
      backgroundColor = "#d4edda"; // Light green
      break;
    default:
      emoji = "ℹ️";
      backgroundColor = "#f0f0f0"; // Default to INFO styling if unrecognized
  }

  // Apply styles and content to the message element
  messageElement.textContent = `${emoji} ${message}`;
  messageElement.style.color = "#333"; // Dark text color for contrast
  messageElement.style.backgroundColor = backgroundColor;
  messageElement.style.padding = "10px 20px";
  messageElement.style.borderRadius = "5px";
  messageElement.style.fontWeight = "bold";
  messageElement.style.textAlign = "left";
  messageElement.style.marginTop = "15px";
  messageElement.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";

  // Append the element to the body or a specific container
  document.body.prepend(messageElement);

  // Remove the message after x time
  setTimeout(() => {
    fadeoutElement(messageElement);
  }, messageTimeoutMs);
}

// Function to convert a string to 'Title Case'
function toTitleCase(str) {
  return str
    .toLowerCase() // Convert the entire string to lowercase
    .split(" ") // Split the string into words
    .map((word) => {
      // Capitalize the first letter and concatenate it with the rest of the word
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" "); // Join the words back into a single string
}

function getDeckIdFromUrl(deckUrl) {
  // Extract the deck ID from the URL using a regular expression
  const match = deckUrl.match(/\/decks\/(\d+)\//);
  if (match && match[1]) {
    return match[1];
  } else {
    console.warn("Invalid deck URL format");
    return null;
  }
}

// Function to get deck data by deckId
async function getDeckById(deckId) {
  let original_url = `https://archidekt.com/api/decks/${deckId}/`;
  // const url = "https://corsproxy.io/?" + original_url;
  const url = "https://corsproxy.io/?" + encodeURIComponent(original_url);
  if (deckId == -1) {
    url = "banlist_sample.json";
  }

  if (deckId == -2) {
    url = "basics_sample.json";
  }

  if (deckId == -3) {
    url = "nonbasics_sample.json";
  }

  if (deckId == 0) {
    url = "deck_sample.json";
  }

  const options = {
    method: "GET",
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("**** [GET] Success *****");
    console.log(data);
    return data;
  } catch (error) {
    console.error("**** [GET] Error *****", error);
    return null;
  }
}

// Function to extract card names from the deck data
function getCardNamesFromArchidektDeck(deckData, prepend_quantity = false) {
  if (!deckData || !deckData.cards) {
    console.warn("Invalid deck data provided");
    return [];
  }

  return deckData.cards
    .filter((card) => !card.categories.includes("Maybeboard")) // Exclude cards with the "Maybeboard" category
    .map((card) => {
      const cardName = card.card.oracleCard.name;
      return prepend_quantity ? `${card.quantity} ${cardName}` : cardName;
    });
}

function isValidExportFmt(input) {
  // Check if the input is a deck format
  // (e.g., cards listed by `{x} {name} {a} {b}` format, where x is a number followed by n space - separated strings)
  const exportFormatPattern = /^\d+\s+.+$/;
  const lines = input.split("\n");

  // Check each line to see if it follows the card format
  for (let line of lines) {
    if (!exportFormatPattern.test(line.trim())) {
      return false; // If any line doesn't match, it's not a valid deck format
    }
  }
  return true;
}

function isValidArchidektUrlFmt(input) {
  // Matches the format of the URL
  const urlPattern = /^https:\/\/archidekt\.com\/decks\/\d+\/.+$/;
  return urlPattern.test(input);
}

function isValidInput(input) {
  // Trim whitespace and check if input is empty
  const trimmedInput = input.trim();
  if (trimmedInput === "") {
    return false; // Empty input is not valid
  }

  // Input is a valid Archidekt URL
  if (isValidArchidektUrlFmt(input)) {
    return true;
  }
  // Check if the input is a deck format
  if (isValidExportFmt(input)) {
    return true;
  }
  // Default
  return false;
}

// Process decklist: remove basic lands and remove banned cards
async function processDeck(deck) {
  // Handle Configuration
  const removeBannedCards = document.getElementById("removeBannedCards").checked;
  const removeBasicLands = document.getElementById("removeBasicLands").checked;
  const removeNonBasicLands = document.getElementById("removeNonBasicLands").checked;

  let cardsToRemove = [];
  // Handle banned deck(s)
  if (removeBannedCards) {
    const d = await getDeckById(bannedCardsDeckId);
    // const d = await getDeckById(-1);
    const cards = getCardNamesFromArchidektDeck(d);
    cardsToRemove.push(...cards);
  }
  if (removeBasicLands) {
    const d = await getDeckById(basicLandsDeckId);
    // const d = await getDeckById(-2);
    const cards = getCardNamesFromArchidektDeck(d);
    cardsToRemove.push(...cards);
  }

  if (removeNonBasicLands) {
    const d = await getDeckById(nonBasicLandsDeckId);
    // const d = await getDeckById(-3);
    const cards = getCardNamesFromArchidektDeck(d);
    cardsToRemove.push(...cards);
  }

  console.log("CARDS TO REMOVE:");
  console.log(cardsToRemove);

  // Handle input
  const inputCards = deck.split("\n").filter((line) => line.trim() !== "");
  console.log("INPUT CARDS:");
  console.log(inputCards);

  // Process Cards
  let cards_to_include = [];
  let cards_to_omit = [];

  inputCards.forEach((card) => {
    // Trim off Quantity and convert to TitleCase
    // Iterate over the array and split each element to get the card name
    const parts = card.split(/\s(.+)/); // Split into two parts: quantity and the rest
    cardName = toTitleCase(parts[1].trim());

    // Omit banned cards
    if (removeBannedCards && cardsToRemove.includes(cardName)) {
      console.log(`[REMOVE]: ${cardName}`);
      cards_to_omit.push(card);
    }
    // Omit basic lands
    else if (removeBasicLands && cardsToRemove.includes(cardName)) {
      console.log(`[REMOVE]: ${cardName}`);
      cards_to_omit.push(card);
    }
    // Omit non-basic lands
    else if (removeNonBasicLands && cardsToRemove.includes(cardName)) {
      console.log(`[REMOVE]: ${cardName}`);
      cards_to_omit.push(card);
    }
    // Emit Card
    else {
      // console.log(`[INCLUDE]: ${line}`);
      cards_to_include.push(card);
    }
  });

  // Display output and warnings
  document.getElementById("cards-include").textContent = cards_to_include.join("\n");
  document.getElementById("cards-remove").textContent = cards_to_omit.join("\n");

  if (cards_to_omit.length > 0 || cards_to_include.length > 0) {
    let removed = [];
    if (removeBannedCards) removed.push("Banned");
    if (removeBasicLands) removed.push("Basics");
    if (removeNonBasicLands) removed.push("Non-Basics");
    if (removed.length > 0) {
      navigator.clipboard.writeText(cards_to_include.join("\n"));
      message = `Removed [${removed.join(", ")}] cards and copied output to clipboard`;
      showMessage(message, "SUCCESS", 5000);
    } else {
      showMessage("Cards processed and copied output to clipboard", "SUCCESS", 5000);
    }
  }
}

// ...................../´¯¯/)
// ...................,/¯.../  goon squad
// .................../..../
// .............../´¯/'..'/´¯¯`·¸    get
// .........../'/.../..../....../¨¯\
// ..........('(....´...´... ¯~/'..')  fucked
// ...........\..............'...../
// ............\....\.........._.·´
// .............\..............(
// ..............\..............\  ~ kai

/* BUTTON - PROCESS DECK */
document.getElementById("processDeck").addEventListener("click", async () => {
  let decklist = document.getElementById("decklist").value;
  if (!isValidInput(decklist)) {
    alert("Please enter a valid deck format or a valid Archidekt Deck URL. Your deck must be set to 'public'!");
    return;
  } else {
    if (isValidArchidektUrlFmt(decklist)) {
      input_deck = await getDeckById(getDeckIdFromUrl(decklist));
      decklist = getCardNamesFromArchidektDeck(input_deck, true).join("\n");
      document.getElementById("decklist").value = decklist;
    }
    await processDeck(decklist);
  }
});

/* BUTTON - RESET DECK */
document.getElementById("resetDeck").addEventListener("click", () => {
  document.getElementById("decklist").value = "";
  document.getElementById("cards-include").textContent = "";
  document.getElementById("cards-remove").textContent = "";
});
