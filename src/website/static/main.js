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
const resultsEl = document.getElementById("results");
const resultsTitle = document.getElementById("results-title");
const resultsSummary = document.getElementById("results-summary");
const resultsGrid = document.getElementById("results-grid");
const placeholder = document.getElementById("search-placeholder");

// Rotating placeholder usernames
const PLACEHOLDER_USERNAMES = [
  "MrBeast",
  "ElonMusk",
  "Ninja",
  "PewDiePie",
  "KylieJenner",
  "Zuck",
  "TimCook",
  "mkbhd",
  "katyperry",
  "cristiano",
];

let placeholderIndex = 0;
let placeholderInterval = null;

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

let shuffledUsernames = shuffleArray(PLACEHOLDER_USERNAMES);

// Set initial placeholder immediately
placeholder.textContent = shuffledUsernames[0];

function rotatePlaceholder() {
  // Fade out
  placeholder.classList.add("fade-out");

  setTimeout(() => {
    // Change text
    placeholderIndex = (placeholderIndex + 1) % shuffledUsernames.length;
    if (placeholderIndex === 0) {
      shuffledUsernames = shuffleArray(PLACEHOLDER_USERNAMES);
    }
    placeholder.textContent = shuffledUsernames[placeholderIndex];

    // Fade in
    placeholder.classList.remove("fade-out");
  }, 400);
}

function startPlaceholderRotation() {
  if (!placeholderInterval && !input.value) {
    placeholder.classList.remove("hidden");
    placeholderInterval = setInterval(rotatePlaceholder, 2500);
  }
}

function stopPlaceholderRotation() {
  if (placeholderInterval) {
    clearInterval(placeholderInterval);
    placeholderInterval = null;
  }
}

// Hide placeholder when user types, show when empty
input.addEventListener("input", () => {
  if (input.value) {
    stopPlaceholderRotation();
    placeholder.classList.add("hidden");
  } else {
    placeholder.classList.remove("hidden");
    startPlaceholderRotation();
  }
});

// Start rotation on load
startPlaceholderRotation();

// Debounce helper
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

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

// Track current request to avoid race conditions
let currentRequest = null;

// Check username
async function checkUsername() {
  const username = input.value.trim().toLowerCase();

  // Hide results if input is empty
  if (!username) {
    resultsEl.classList.remove("visible");
    return;
  }

  // Validate
  if (!/^[a-z0-9._]+$/i.test(username)) {
    return;
  }

  // Create a unique identifier for this request
  const requestId = Date.now();
  currentRequest = requestId;

  showLoading(username);

  try {
    const res = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    // Ignore if a newer request has been made
    if (currentRequest !== requestId) return;

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to check username");
    }

    showResults(data);
  } catch (err) {
    // Only show error if this is still the current request
    if (currentRequest === requestId) {
      showError(err.message);
    }
  }
}

// Debounced version for input events
const debouncedCheck = debounce(checkUsername, 400);

// Event listeners
input.addEventListener("input", debouncedCheck);

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
