function getWebContent() {
  console.log("getWebContent called");
  const maxLength = 20000;

  let content = "";

  // get article content
  const article = document.querySelector("article");
  if (article && article.innerText.trim()) {
    content = article.innerText;
  }

  // If no article, try main content
  if (!content) {
    const main = document.querySelector("main");
    if (main && main.innerText.trim()) {
      content = main.innerText;
    }
  }

  // If  no content,getting all paragraphs
  if (!content) {
    const paragraphs = Array.from(document.querySelectorAll("p"));
    if (paragraphs.length > 0) {
      content = paragraphs
        .map((p) => p.innerText.trim())
        .filter((text) => text)
        .join("\n");
    }
  }

  // Last resort: get body text
  if (!content) {
    content = document.body.innerText || "";
  }

  // Clean up the content
  content = content.trim();

  console.log("Extracted content length:", content.length);
  console.log("Extracted content preview:", content.slice(0, 100));

  return content.length > maxLength
    ? content.slice(0, maxLength) + "..."
    : content;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);

  if (request.type === "GET_WEB_CONTENT") {
    try {
      const content = getWebContent();
      console.log("Sending content back, length:", content.length);
      sendResponse({ content: content, success: true });
    } catch (error) {
      console.error("Error getting web content:", error);
      sendResponse({ error: "Failed to extract content", success: false });
    }
  }

  return true;
});
