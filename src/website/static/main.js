const PLATFORMS = [
  { name: "x", displayName: "X/Twitter", icon: "https://svgl.app/library/x_dark.svg" },
  { name: "tiktok", displayName: "TikTok", icon: "https://svgl.app/library/tiktok-icon-dark.svg" },
  { name: "threads", displayName: "Threads", icon: "https://svgl.app/library/threads_dark.svg" },
  { name: "youtube", displayName: "YouTube", icon: "https://svgl.app/library/youtube.svg" },
  {
    name: "instagram",
    displayName: "Instagram",
    icon: "https://svgl.app/library/instagram-icon.svg",
  },
  { name: "facebook", displayName: "Facebook", icon: "https://svgl.app/library/facebook-icon.svg" },
  { name: "telegram", displayName: "Telegram", icon: "https://svgl.app/library/telegram.svg" },
  { name: "github", displayName: "GitHub", icon: "https://svgl.app/library/github_dark.svg" },
];

const input = document.getElementById("username-input");
const btn = document.getElementById("check-btn");
const resultsEl = document.getElementById("results");
const resultsTitle = document.getElementById("results-title");
const resultsSummary = document.getElementById("results-summary");
const resultsGrid = document.getElementById("results-grid");

// Show loading state
function showLoading(username) {
  resultsEl.classList.add("visible");
  resultsTitle.textContent = `@${username}`;
  resultsSummary.innerHTML = '<div class="spinner"></div>';

  resultsGrid.innerHTML = PLATFORMS.map(
    (p) => `
    <div class="result-card" data-platform="${p.name}">
      <div class="result-card-header">
        <div class="result-icon">
          <img src="${p.icon}" alt="${p.displayName}" width="18" height="18">
        </div>
        <div class="result-status"><div class="spinner"></div></div>
      </div>
      <div class="result-name">${p.displayName}</div>
    </div>
  `,
  ).join("");
}

// Show results
function showResults(data) {
  resultsTitle.textContent = `@${data.username}`;
  resultsSummary.innerHTML = `
    <span class="available">${data.summary.available} available</span> / 
    <span class="taken">${data.summary.taken} taken</span>
  `;

  resultsGrid.innerHTML = PLATFORMS.map((p) => {
    const result = data.results[p.name];
    const statusClass = result?.error ? "" : result?.available ? "available" : "taken";
    const statusText = result?.error ? "Error" : result?.available ? "Available" : "Taken";

    return `
      <a class="result-card ${statusClass}" href="${result?.url || "#"}" target="_blank" rel="noopener">
        <div class="result-card-header">
          <div class="result-icon">
            <img src="${p.icon}" alt="${p.displayName}" width="18" height="18">
          </div>
          <div class="result-status">${statusText}</div>
        </div>
        <div class="result-name">${p.displayName}</div>
      </a>
    `;
  }).join("");
}

// Show error
function showError(message) {
  resultsSummary.innerHTML = `<span style="color: var(--red)">${message}</span>`;
  resultsGrid.innerHTML = "";
}

// Check username
async function checkUsername() {
  const username = input.value.trim().toLowerCase();
  if (!username) return;

  // Validate
  if (!/^[a-z0-9._]+$/i.test(username)) {
    alert("Invalid username. Only letters, numbers, dots, and underscores allowed.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Checking...";
  showLoading(username);

  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to check username");
    }

    showResults(data);
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Check";
  }
}

// Event listeners
btn.addEventListener("click", checkUsername);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkUsername();
});

// Focus input on load
input.focus();

// Copy to clipboard
const CODE_SNIPPETS = {
  cli: `# Check a username
npx namewastaken mrbeast

# Check specific platforms
npx nwt mrbeast -p tt,ig,yt

# JSON output
npx nwt mrbeast --json`,
  sdk: `import nwt from 'namewastaken'

const result = await nwt.check('mrbeast')
result.tiktok.taken  // true

await nwt.available('mrbeast') // false`,
  mcp: `{
  "mcpServers": {
    "namewastaken": {
      "command": "npx",
      "args": ["namewastaken", "mcp"]
    }
  }
}`,
};

document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const key = btn.dataset.copy;
    const text = CODE_SNIPPETS[key];

    try {
      await navigator.clipboard.writeText(text);
      btn.classList.add("copied");
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  });
});
