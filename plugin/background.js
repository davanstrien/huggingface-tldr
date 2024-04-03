chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getToken") {
    chrome.storage.local.get("token", (data) => {
      sendResponse({ token: data.token });
    });
    return true; // Required to use sendResponse asynchronously
  }
});
