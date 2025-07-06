document.getElementById("summarize").addEventListener("click", async () => {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = '<div class="loading"><div class="loader"></div></div>';

  const summaryType = document.getElementById("summary-type").value;

  try {
    // Get API key from storage
    const storageResult = await new Promise((resolve) => {
      chrome.storage.sync.get(["geminiApiKey"], resolve);
    });

    if (!storageResult.geminiApiKey) {
      resultDiv.innerHTML = `
        <div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;">
          API key not found. Please set your API key in the extension options.
          <br><br>
          <button onclick="chrome.runtime.openOptionsPage()" style="padding: 5px 10px; background: #4285f4; color: white; border: none; border-radius: 3px; cursor: pointer;">
            Open Options
          </button>
        </div>
      `;
      return;
    }

    // Get content from the current page
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_CONTENT" }, resolve);
    });

    if (!response || !response.success || !response.content) {
      resultDiv.innerHTML = `
        <div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;">
          ${
            response?.error ||
            "Could not extract content from this page. Please try refreshing the page."
          }
        </div>
      `;
      return;
    }

    if (response.content.trim().length < 50) {
      resultDiv.innerHTML = `
        <div style="color: #ff9800; padding: 10px; background: #fff3e0; border-radius: 4px;">
          This page doesn't seem to have enough content to summarize. Please try a different page.
        </div>
      `;
      return;
    }

    // Generate summary
    const summary = await getGeminiSummary(
      response.content,
      summaryType,
      storageResult.geminiApiKey
    );

    resultDiv.innerHTML = `<div style="white-space: pre-wrap; line-height: 1.6;">${summary}</div>`;
  } catch (error) {
    console.error("Error:", error);
    resultDiv.innerHTML = `
      <div style="color: #d32f2f; padding: 10px; background: #ffebee; border-radius: 4px;">
        Error: ${
          error.message || "Failed to generate summary. Please try again."
        }
      </div>
    `;
  }
});

document.getElementById("copy-btn").addEventListener("click", () => {
  const resultDiv = document.getElementById("result");
  const summaryText = resultDiv.innerText;

  if (
    summaryText &&
    summaryText.trim() !== "" &&
    !summaryText.includes("Select a summary type")
  ) {
    navigator.clipboard
      .writeText(summaryText)
      .then(() => {
        const copyBtn = document.getElementById("copy-btn");
        const originalText = copyBtn.innerText;

        copyBtn.innerText = "Copied!";
        copyBtn.style.backgroundColor = "#2e7d32";
        setTimeout(() => {
          copyBtn.innerText = originalText;
          copyBtn.style.backgroundColor = "#34a853";
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy text to clipboard");
      });
  } else {
    alert("No summary available to copy");
  }
});

async function getGeminiSummary(text, summaryType, apiKey) {
  // Truncate very long texts to avoid API limits
  const maxLength = 15000; // Reduced to be safer
  const truncatedText =
    text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

  let prompt;
  switch (summaryType) {
    case "brief":
      prompt = `Please provide a brief summary of the following web content in 2-3 clear sentences. Focus on the main topic and key points:\n\n${truncatedText}`;
      break;
    case "detailed":
      prompt = `Please provide a detailed summary of the following web content. Include all main points, key details, and important information. Organize the summary in a clear, readable format:\n\n${truncatedText}`;
      break;
    case "bullets":
      prompt = `Please summarize the following web content in 5-7 key bullet points. Format each point as a line starting with "• " (bullet symbol followed by a space). Keep each point concise and focused on a single key insight:\n\n${truncatedText}`;
      break;
    default:
      prompt = `Please summarize the following web content:\n\n${truncatedText}`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 400) {
        throw new Error("Invalid API key or request format");
      } else if (response.status === 403) {
        throw new Error("API key access denied or quota exceeded");
      } else if (response.status === 429) {
        throw new Error("Too many requests. Please try again later");
      } else {
        throw new Error(
          errorData.error?.message || `API request failed (${response.status})`
        );
      }
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No summary generated");
    }

    const summary = data.candidates[0]?.content?.parts?.[0]?.text;

    if (!summary || summary.trim() === "") {
      throw new Error("Empty summary received");
    }

    return summary.trim();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection");
    }
    throw error;
  }
}
