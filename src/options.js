document.addEventListener("DOMContentLoaded", () => {
  // Load existing API key when page loads
  chrome.storage.sync.get(["geminiApiKey"], (result) => {
    if (result.geminiApiKey) {
      document.getElementById("api-key").value = result.geminiApiKey;
    }
  });

  // Handle save button click
  document.getElementById("save-button").addEventListener("click", () => {
    const apiKey = document.getElementById("api-key").value.trim();

    if (!apiKey) {
      alert("Please enter a valid Gemini API key.");
      return;
    }

    // Basic validation - Gemini API keys typically start with "AIza"
    if (!apiKey.startsWith("AIza")) {
      const proceed = confirm(
        "The API key doesn't look like a typical Gemini API key (should start with 'AIza'). Do you want to save it anyway?"
      );
      if (!proceed) {
        return;
      }
    }

    // Save the API key
    chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
      if (chrome.runtime.lastError) {
        alert("Error saving API key: " + chrome.runtime.lastError.message);
        return;
      }

      // Show success message
      const successMessage = document.getElementById("success-message");
      successMessage.style.display = "block";

      console.log("API key saved successfully");

      // Auto-close after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
    });
  });

  // Handle Enter key press in input field
  document.getElementById("api-key").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("save-button").click();
    }
  });
});
