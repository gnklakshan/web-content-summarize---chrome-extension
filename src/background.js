chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  // Check for existing API key
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (!result.geminiApiKey) {
      console.log("No Gemini API key found.");
      chrome.tabs.create({
        url: "src/options.html",
      });
      console.log("Please set your Gemini API key in the options page.");
    } else {
      console.log("Gemini API key is already set.");
    }
  });
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_CONTENT") {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];

      try {
        // Inject content script if not already injected
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content.js"],
        });

        // Send message to content script
        chrome.tabs.sendMessage(
          tab.id,
          { type: "GET_WEB_CONTENT" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error:", chrome.runtime.lastError);
              sendResponse({
                error: "Could not extract content from this page.",
              });
            } else {
              sendResponse(response);
            }
          }
        );
      } catch (error) {
        console.error("Error injecting content script:", error);
        sendResponse({ error: "Could not access this page." });
      }
    });

    return true;
  }
});
