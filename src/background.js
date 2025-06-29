chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  //  initialization
  chrome.storage.sync.get(["geminiAPIKey"], (result) => {
    if (!result.geminiAPIKey) {
      console.log("No Gemini API key found.");
      chrome.tabs.create({
        url: "src/options.html",
      });
    } else {
      console.log("Gemini API key is already set.");
    }
  });
});
