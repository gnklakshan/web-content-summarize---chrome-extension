document.getElementById("summarize").addEventListener("click", () => {
  console.log("Summarize button clicked");

  const result = document.getElementById("result");
  result.textContent = "Extractig Content...";

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { type: "GET_WEB_CONTENT" }, (content) => {
      result.textContent = content
        ? content.slice(0, 400) + "..."
        : "No article content found.";
    });
  });
});
