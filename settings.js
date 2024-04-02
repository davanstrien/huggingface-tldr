document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("token");
  const saveButton = document.getElementById("save");

  // Load the saved token from storage
  chrome.storage.sync.get("token", (data) => {
    if (data.token) {
      tokenInput.value = data.token;
    }
  });

  // Save the token when the Save button is clicked
  saveButton.addEventListener("click", () => {
    const token = tokenInput.value;
    chrome.storage.sync.set({ token: token }, () => {
      console.log("Token saved");
    });
  });
});
