document.getElementById("summarize").addEventListener("click", () => {
  console.log("Summarize button clicked");

  const resultDiv = document.getElementById("result");
  const summaryType = document.getElementById("summary-type").value;

  resultDiv.innerHTML = <div class="loader"></div>;

  //   get user gemini api key
  chrome.storage.sync.get(["geminiApiKey"], ({ geminiApiKey }) => {
    if (!geminiApiKey) {
      resultDiv.innerHTML = "Please set your Gemini API key in the options.";
      return;
    }
  });

  // ask content.js for page content
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(
      tab.id,
      { type: "GET_WEB_CONTENT" },
      async (content) => {
        if (!content) {
          resultDiv.textContent = "Could not retrieve content from the page.";
          return;
        }
        // send content to gemini api
        try {
          const summery = await getGeminiSummary(
            content,
            summaryType,
            geminiApiKey
          );
        } catch (error) {
          resultDiv.textContent =
            "Error processing the content." + error.message;
        }
      }
    );
  });
});

async function getGeminiSummary(rawContent, Type, geminiApiKey) {
  const max = 20000;
  const content =
    rawContent.length > max ? rawContent.slice(0, max) : rawContent;

  const promptMap = {
    brief: `summerize in 2-3 sentences\n\n ${content}`,
    detailed: `Give a detailed summery\n\n ${content}`,
    bullet: `Summerize in 5-7 bullet points (Strat each line with "-")\n\n ${content}`,
  };

  const prompt = promptMap[Type] || promptMap.brief;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: { temerature: 0.2 },
      }),
    }
  );

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(`Error:${error.message} - ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No summary available"
  );
}

document.getElementById("copy-button").addEventListener("click", () => {
  const txt = document.getElementById("result").innerText;
  if (!txt) {
    alert("No summary to copy. Please generate a summary first.");
    return;
  }

  navigator.clipboard
    .writeText(txt)
    .then(() => {
      const btn = document.getElementById("copy-button");
      const oldText = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = oldText;
      }, 2000);
      alert("Summary copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
      alert("Failed to copy summary. Please try again.");
    });
});
