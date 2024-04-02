document.addEventListener("DOMContentLoaded", () => {
  const tokenInput = document.getElementById("token");
  const saveButton = document.getElementById("save");

  // Load the saved token from storage
  chrome.storage.local.get("token", (data) => {
    if (data.token) {
      tokenInput.value = data.token;
    }
  });

  // Save the token when the Save button is clicked
  saveButton.addEventListener("click", () => {
    const token = tokenInput.value;
    chrome.storage.local.set({ token: token }, () => {
      console.log("Token saved");
      alert("Token saved successfully!");
    });
  });
});
