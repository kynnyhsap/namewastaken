async function checkHandle() {
  const handle = document.getElementById("handle").value;
  if (!handle) return;

  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML =
    '<div class="text-white/60 text-center">hold up checking the vibes...</div>';

  try {
    const response = await fetch(`/api/check/${handle}`);
    const data = await response.json();

    if (!data.success) {
      resultsDiv.innerHTML = `
        <div class="text-white/60 text-center border border-white/20 p-4">
          ${data.error}
        </div>
      `;
      return;
    }

    resultsDiv.innerHTML = `
      <div class="border border-white/20 divide-y divide-white/20">
        <div class="flex items-center justify-between p-4">
          <span class="text-white/60">youtube</span>
          <div class="flex items-center gap-2">
            <span class="${
              data.data.results.youtube ? "text-white/60" : "text-white"
            }">
              ${data.data.results.youtube ? "taken" : "available"}
            </span>
            <div class="w-2 h-2 rounded-full ${
              data.data.results.youtube ? "bg-white/60" : "bg-white"
            }"></div>
          </div>
        </div>
        <div class="flex items-center justify-between p-4">
          <span class="text-white/60">insta status</span>
          <div class="flex items-center gap-2">
            <span class="${
              data.data.results.instagram ? "text-white/60" : "text-white"
            }">
              ${data.data.results.instagram ? "taken" : "available"}
            </span>
            <div class="w-2 h-2 rounded-full ${
              data.data.results.instagram ? "bg-white/60" : "bg-white"
            }"></div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    resultsDiv.innerHTML =
      '<div class="text-white/60 text-center">oof bestie something broke</div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("handle").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      checkHandle();
    }
  });
});
