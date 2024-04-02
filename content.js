/**
 * Generates a unique user ID and stores it in the localStorage.
 * If a user ID already exists, retrieves and returns it.
 * @returns {string} The generated or existing user ID.
 */
function generateUserId() {
  const existingUserId = localStorage.getItem("userId");
  if (existingUserId) {
    return existingUserId;
  } else {
    const newUserId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("userId", newUserId);
    return newUserId;
  }
}

function addDatasetDescription(descriptions, box) {
  const datasetName = box.querySelector("h4").textContent.trim();
  const description = descriptions[datasetName];

  if (!box.querySelector(".tl-dr-description")) {
    let displayText = "No tl;dr description currently available";
    if (description) {
      displayText = "<b>tl;dr</b> " + description;
    }

    const descriptionElement = document.createElement("div");
    descriptionElement.innerHTML = displayText;
    descriptionElement.style.marginTop = "5px";
    descriptionElement.style.marginLeft = "5px";
    descriptionElement.style.fontSize = "12px";
    descriptionElement.style.color = "#888";
    descriptionElement.classList.add("tl-dr-description");

    const voteText = document.createElement("div");
    voteText.textContent = "Is tis tl;dr summary useful?";
    voteText.style.marginTop = "5px";
    voteText.style.marginLeft = "5px";
    voteText.style.fontSize = "12px";
    voteText.style.color = "#888";
    voteText.style.fontWeight = "bold";

    const voteButtons = document.createElement("div");
    voteButtons.style.marginTop = "5px";
    voteButtons.style.marginLeft = "5px";

    const upvoteButton = document.createElement("button");
    upvoteButton.textContent = "👍";
    upvoteButton.classList.add("vote-button");
    upvoteButton.dataset.vote = "1";
    upvoteButton.dataset.dataset = datasetName;

    const downvoteButton = document.createElement("button");
    downvoteButton.textContent = "👎";
    downvoteButton.classList.add("vote-button");
    downvoteButton.dataset.vote = "0";
    downvoteButton.dataset.dataset = datasetName;

    voteButtons.appendChild(upvoteButton);
    voteButtons.appendChild(downvoteButton);

    box.appendChild(descriptionElement);
    box.appendChild(voteText);
    box.appendChild(voteButtons);
  }
}

function fetchAndAddDescriptions() {
  fetch(
    "https://huggingface.co/datasets/davanstrien/descriptions/resolve/main/data.json?download=true"
  )
    .then((response) => response.json())
    .then((data) => {
      const datasetBoxes = document.querySelectorAll(".overview-card-wrapper");
      datasetBoxes.forEach((box) => {
        addDatasetDescription(data, box);
      });
    })
    .catch((error) => {
      console.error("Error fetching dataset descriptions:", error);
    });
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("vote-button")) {
    const { vote } = event.target.dataset;
    const datasetName = event.target.dataset.dataset;

    // Get the dataset description
    const descriptionElement = event.target
      .closest(".overview-card-wrapper")
      .querySelector(".tl-dr-description");
    const description = descriptionElement
      ? descriptionElement.textContent.trim()
      : "";

    const userID = generateUserId(); // Generate or retrieve the user ID

    const payload = {
      dataset: datasetName,
      description: description,
      vote: parseInt(vote),
      userID: userID, // Include the user ID in the payload
    };

    // Retrieve the token from chrome.storage.local
    chrome.storage.local.get("token", (data) => {
      const { token } = data;
      console.log("Retrieved token:", token); // Log the token value
      if (token) {
        fetch("https://davanstrien-dataset-tldr.hf.space/vote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Vote submitted successfully:", data);
          })
          .catch((error) => {
            console.error("Error submitting vote:", error);
          });
      } else {
        console.error("Token not found in storage");
      }
    });
  }
});

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      const { addedNodes } = mutation;
      addedNodes.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.classList.contains("overview-card-wrapper")
        ) {
          fetchAndAddDescriptions();
        }
      });
    }
  });
});

const observerOptions = {
  childList: true,
  subtree: true,
};

const targetNode = document.body;
observer.observe(targetNode, observerOptions);

// Add descriptions to the initial set of dataset boxes
fetchAndAddDescriptions();
