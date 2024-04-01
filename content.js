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

    // Check if the user has already rated this dataset
    if (localStorage.getItem(datasetName)) {
      console.log("You have already rated this dataset.");
      return;
    }

    const payload = {
      dataset: datasetName,
      vote: parseInt(vote),
    };

    fetch("http://localhost:8000/vote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Vote submitted successfully:", data);
        // Store the rated dataset in localStorage
        localStorage.setItem(datasetName, true);
        console.log("Rated dataset stored in localStorage.");
      })
      .catch((error) => {
        console.error("Error submitting vote:", error);
      });
  }
});

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      const addedNodes = mutation.addedNodes;
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
