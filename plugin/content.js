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

function isTokenAvailable(callback) {
  try {
    chrome.runtime.sendMessage({ action: "getToken" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error in sendMessage:", chrome.runtime.lastError);
        callback(false);
      } else {
        callback(!!response.token);
      }
    });
  } catch (error) {
    console.error("Error in isTokenAvailable:", error);
    callback(false);
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
    voteText.textContent = "Is this tl;dr summary useful?";
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

function isMainDatasetsPage() {
  const url = window.location.href;
  const mainPagePattern = /^https:\/\/huggingface\.co\/datasets(?:\?.*)?$/;
  return mainPagePattern.test(url);
}

function fetchAndAddDescriptions() {
  if (isMainDatasetsPage()) {
    fetch(
      "https://huggingface.co/datasets/davanstrien/descriptions/resolve/main/data.json?download=true"
    )
      .then((response) => response.json())
      .then((data) => {
        const datasetBoxes = document.querySelectorAll(
          ".overview-card-wrapper"
        );
        datasetBoxes.forEach((box) => {
          addDatasetDescription(data, box);
        });
      })
      .catch((error) => {
        console.error("Error fetching dataset descriptions:", error);
      });
  }
}
let previousVotes = {};

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("vote-button") && isMainDatasetsPage()) {
    const { vote } = event.target.dataset;
    const datasetName = event.target.dataset.dataset;

    // Check if the user has already voted for the same option
    if (previousVotes[datasetName] === parseInt(vote)) {
      // Display an "already voted" message
      const alreadyVotedMessage = document.createElement("div");
      alreadyVotedMessage.textContent = "Already voted!";
      alreadyVotedMessage.style.marginTop = "5px";
      alreadyVotedMessage.style.color = "#ff0000";
      alreadyVotedMessage.style.fontSize = "12px";
      event.target.parentNode.appendChild(alreadyVotedMessage);

      // Remove the "already voted" message after 2 seconds
      setTimeout(() => {
        alreadyVotedMessage.remove();
      }, 2000);

      return; // Exit the event listener
    }

    const overviewCardWrapper = event.target.closest(".overview-card-wrapper");
    if (overviewCardWrapper) {
      const descriptionElement =
        overviewCardWrapper.querySelector(".tl-dr-description");
      const description = descriptionElement
        ? descriptionElement.textContent.trim()
        : "No tl;dr description available";

      const userID = generateUserId(); // Generate or retrieve the user ID

      const payload = {
        dataset: datasetName,
        description: description,
        vote: parseInt(vote),
        userID: userID, // Include the user ID in the payload
      };

      // Check if the token is available
      isTokenAvailable((tokenAvailable) => {
        if (tokenAvailable) {
          // Retrieve the token from the background script
          chrome.runtime.sendMessage({ action: "getToken" }, (response) => {
            const { token } = response;
            // Token is available, proceed with vote submission
            fetch("https://davanstrien-dataset-tldr.hf.space/vote", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
              body: JSON.stringify(payload),
            })
              .then((response) => response.json())
              .then((data) => {
                console.log("Vote submitted successfully:", data);

                // Update the previous vote for the dataset
                previousVotes[datasetName] = parseInt(vote);

                // Set the opacity of all vote buttons to 0.5
                const voteButtons =
                  overviewCardWrapper.querySelectorAll(".vote-button");
                voteButtons.forEach((button) => {
                  button.style.opacity = "0.5";
                  button.classList.remove("voted");
                });

                // Set the opacity of the current voted button to 1 and add the "voted" class
                event.target.style.opacity = "1";
                event.target.classList.add("voted");

                // Display a success message
                const successMessage = document.createElement("div");
                successMessage.textContent = "Vote registered!";
                successMessage.style.marginTop = "5px";
                successMessage.style.color = "#4caf50";
                successMessage.style.fontSize = "12px";
                overviewCardWrapper.appendChild(successMessage);

                // Remove the success message after 2 seconds
                setTimeout(() => {
                  successMessage.remove();
                }, 2000);
              })
              .catch((error) => {
                console.error("Error submitting vote:", error);
              });
          });
        } else {
          // Token is missing, display an alert or message to the user
          alert(
            "Please provide the token in the extension settings to submit your vote."
          );
        }
      });
    }
  }
});

const observer = new MutationObserver((mutations) => {
  if (isMainDatasetsPage()) {
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
  }
});

const observerOptions = {
  childList: true,
  subtree: true,
};

const targetNode = document.body;
observer.observe(targetNode, observerOptions);

// Add descriptions to the initial set of dataset boxes
fetchAndAddDescriptions();
