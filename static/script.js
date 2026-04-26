

// const API_BASE = "/api/v1";

// let currentVideoInfo = null;
// let downloadTimer = null;

// // =========================
// // ELEMENTS
// // =========================
// const videoUrlInput = document.getElementById("videoUrl");
// const extractBtn = document.getElementById("extractBtn");
// const extractLabel = extractBtn?.querySelector(".extract-label");
// const pasteBtn = document.getElementById("pasteBtn");
// const urlError = document.getElementById("urlError");
// const downloadPanel = document.getElementById("downloadPanel");
// const mobileDownloadDock = document.getElementById("mobileDownloadDock");

// // tabs
// const tabButtons = document.querySelectorAll(".tab-btn");
// const tabPanels = document.querySelectorAll(".tab-panel");
// const tabSwitcher = document.querySelector(".tab-switcher");

// // =========================
// // INIT
// // =========================
// document.addEventListener("DOMContentLoaded", () => {
//   setupEventListeners();
//   setupTabs();

//   window.addEventListener("resize", () => {
//     if (currentVideoInfo) syncMobileDownloadDock();
//   });

//   // page load complete
//   window.addEventListener("load", stopAllDownloadLoading);
// });

// // =========================
// // EVENTS
// // =========================
// function setupEventListeners() {
//   extractBtn?.addEventListener("click", handleExtractInfo);

//   videoUrlInput?.addEventListener("keypress", (e) => {
//     if (e.key === "Enter") handleExtractInfo();
//   });

//   pasteBtn?.addEventListener("click", async () => {
//     try {
//       const text = await navigator.clipboard.readText();

//       if (text?.trim()) {
//         videoUrlInput.value = text.trim();
//         videoUrlInput.focus();
//       }
//     } catch {
//       showError("Paste manually (Ctrl + V)");
//     }
//   });
// }

// // =========================
// // TABS
// // =========================
// function setupTabs() {
//   tabButtons.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const target = btn.dataset.tab;

//       tabButtons.forEach((b) => b.classList.remove("active"));
//       tabPanels.forEach((p) => p.classList.remove("active"));

//       btn.classList.add("active");
//       document.getElementById(target)?.classList.add("active");

//       if (tabSwitcher) {
//         tabSwitcher.setAttribute(
//           "data-active",
//           target.includes("audio") ? "audio" : "video"
//         );
//       }
//     });
//   });
// }

// // =========================
// // VALIDATION
// // =========================
// function isValidTwitterUrl(url) {
//   return /twitter\.com|x\.com/.test(url);
// }

// function showError(message) {
//   urlError.textContent = message;
//   urlError.classList.add("show");
// }

// function clearError() {
//   urlError.textContent = "";
//   urlError.classList.remove("show");
// }

// // =========================
// // FETCH INFO
// // =========================
// async function handleExtractInfo() {
//   const url = videoUrlInput.value.trim();

//   if (!url || !isValidTwitterUrl(url)) {
//     showError("Invalid Twitter/X URL");
//     return;
//   }

//   clearError();

//   extractBtn.disabled = true;
//   if (extractLabel) extractLabel.textContent = "Loading...";

//   try {
//     const res = await fetch(
//       `${API_BASE}/info?url=${encodeURIComponent(url)}`,
//       { method: "POST" }
//     );

//     if (!res.ok) throw new Error("Request failed");

//     const data = await res.json();

//     currentVideoInfo = data;

//     displayVideoInfo(data);
//     displayFormats(data);

//     if (downloadPanel) {
//       downloadPanel.style.display = "grid";
//     }

//     setTimeout(() => {
//       const y = downloadPanel.offsetTop - 80;

//       window.scrollTo({
//         top: y,
//         behavior: "smooth",
//       });
//     }, 100);

//   } catch (err) {
//     console.error(err);
//     showError("Failed to fetch video");
//   } finally {
//     extractBtn.disabled = false;
//     if (extractLabel) extractLabel.textContent = "Download";
//   }
// }

// // =========================
// // VIDEO INFO
// // =========================
// function displayVideoInfo(info) {
//   document.getElementById("videoInfo").innerHTML = `
//     <div class="video-grid">
//       <div class="left-side">
//         <img src="${info.thumbnail}" class="thumb" alt="thumbnail">
//       </div>

//       <div class="right-side">
//         <h2>${escapeHtml(info.title || "Video")}</h2>
//       </div>
//     </div>
//   `;
// }

// // =========================
// // FORMATS
// // =========================
// function displayFormats(info) {
//   const videoFormats = (info.video_formats || []).slice(0, 6);
//   const audioFormats = (info.audio_formats || []).slice(0, 6);

//   // VIDEO
//   document.getElementById("videoFormats").innerHTML =
//     videoFormats.length
//       ? videoFormats.map((f) => `
//         <div class="quality-card">
//           <div>
//             <strong>${f.height || "HD"}p</strong><br>
//             <small>${f.ext || "mp4"}</small>
//           </div>

//           <button
//             class="format-download-btn"
//             onclick="startDownload('${f.format_id}','${info.safe_title}', this)"
//           >
//             Download
//           </button>
//         </div>
//       `).join("")
//       : `<p>No video formats</p>`;

//   // AUDIO
//   document.getElementById("audioFormats").innerHTML =
//     audioFormats.length
//       ? audioFormats.map((f) => `
//         <div class="quality-card">
//           <div>
//             <strong>${f.abr || "128"} kbps</strong><br>
//             <small>${f.ext || "mp3"}</small>
//           </div>

//           <button
//             class="format-download-btn"
//             onclick="startDownload('${f.format_id}','${info.safe_title}', this)"
//           >
//             Download
//           </button>
//         </div>
//       `).join("")
//       : `<p>No audio formats</p>`;

//   syncMobileDownloadDock();
// }

// // =========================
// // DOWNLOAD
// // =========================
// function startDownload(formatId, title, btn) {
//   const url = videoUrlInput.value.trim();

//   if (!url) {
//     alert("Enter URL first");
//     return;
//   }

//   // all buttons reset
//   stopAllDownloadLoading();

//   // clicked button loading
//   if (btn) {
//     btn.disabled = true;
//     btn.dataset.original = btn.innerHTML;
//     btn.innerHTML = "Downloading...";
//   }

//   const downloadUrl =
//     `${API_BASE}/stream?url=${encodeURIComponent(url)}&format_id=${formatId}&filename=${encodeURIComponent(title)}`;

//   // hidden iframe method
//   const iframe = document.createElement("iframe");
//   iframe.style.display = "none";
//   iframe.src = downloadUrl;
//   document.body.appendChild(iframe);

//   // browser starts download => stop loading after short delay
//   downloadTimer = setTimeout(() => {
//     stopAllDownloadLoading();

//     setTimeout(() => {
//       iframe.remove();
//     }, 3000);

//   }, 2500);
// }





// // =========================
// // RESET BUTTONS
// // =========================
// function stopAllDownloadLoading() {
//   clearTimeout(downloadTimer);

//   document.querySelectorAll(".format-download-btn").forEach((btn) => {
//     btn.disabled = false;
//     btn.innerHTML = btn.dataset.original || "Download";
//   });
// }

// // =========================
// // MOBILE DOCK
// // =========================
// function syncMobileDownloadDock() {
//   if (!mobileDownloadDock) return;

//   if (window.innerWidth >= 768) {
//     mobileDownloadDock.style.display = "none";
//     return;
//   }

//   const btn = document.querySelector(".format-download-btn");

//   if (!btn) {
//     mobileDownloadDock.style.display = "none";
//     return;
//   }

//   mobileDownloadDock.innerHTML = "";

//   const clone = btn.cloneNode(true);
//   clone.onclick = btn.onclick;

//   mobileDownloadDock.appendChild(clone);
//   mobileDownloadDock.style.display = "block";
// }

// // =========================
// // HELPERS
// // =========================
// function escapeHtml(text) {
//   const div = document.createElement("div");
//   div.textContent = text || "";
//   return div.innerHTML;
// }


const API_BASE = "/api/v1";

let currentVideoInfo = null;
let downloadTimer = null;

// =========================
// ELEMENTS
// =========================
const videoUrlInput = document.getElementById("videoUrl");
const extractBtn = document.getElementById("extractBtn");
const extractLabel = extractBtn?.querySelector(".extract-label");
const pasteBtn = document.getElementById("pasteBtn");
const urlError = document.getElementById("urlError");
const downloadPanel = document.getElementById("downloadPanel");
const mobileDownloadDock = document.getElementById("mobileDownloadDock");

// tabs
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const tabSwitcher = document.querySelector(".tab-switcher");

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  setupTabs();

  window.addEventListener("resize", () => {
    if (currentVideoInfo) syncMobileDownloadDock();
  });

  window.addEventListener("load", stopAllDownloadLoading);
});

// =========================
// EVENTS
// =========================
function setupEventListeners() {
  extractBtn?.addEventListener("click", handleExtractInfo);

  videoUrlInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleExtractInfo();
  });

  pasteBtn?.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) {
        videoUrlInput.value = text.trim();
        videoUrlInput.focus();
      }
    } catch {
      showError("Paste manually (Ctrl + V)");
    }
  });
}

// =========================
// TABS
// =========================
function setupTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(target)?.classList.add("active");

      if (tabSwitcher) {
        tabSwitcher.setAttribute(
          "data-active",
          target.includes("audio") ? "audio" : "video"
        );
      }
    });
  });
}

// =========================
// VALIDATION
// =========================
function isValidTwitterUrl(url) {
  return /twitter\.com|x\.com/.test(url);
}

function showError(message) {
  urlError.textContent = message;
  urlError.classList.add("show");
}

function clearError() {
  urlError.textContent = "";
  urlError.classList.remove("show");
}

// =========================
// FETCH INFO
// =========================
async function handleExtractInfo() {
  const url = videoUrlInput.value.trim();

  if (!url || !isValidTwitterUrl(url)) {
    showError("Invalid Twitter/X URL");
    return;
  }

  clearError();

  extractBtn.disabled = true;
  if (extractLabel) extractLabel.textContent = "Loading...";

  try {
    const res = await fetch(
      `${API_BASE}/info?url=${encodeURIComponent(url)}`,
      { method: "POST" }
    );

    if (!res.ok) throw new Error("Request failed");

    const data = await res.json();

    console.log("[INFO API]", data);

    currentVideoInfo = data;

    displayVideoInfo(data);
    displayFormats(data);

    if (downloadPanel) {
      downloadPanel.style.display = "grid";
    }

    setTimeout(() => {
      const y = downloadPanel.offsetTop - 80;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }, 100);

  } catch (err) {
    console.error("[ERROR INFO API]", err);
    showError("Failed to fetch video");
  } finally {
    extractBtn.disabled = false;
    if (extractLabel) extractLabel.textContent = "Download";
  }
}

// =========================
// VIDEO INFO
// =========================
function displayVideoInfo(info) {
  document.getElementById("videoInfo").innerHTML = `
    <div class="video-grid">
      <div class="left-side">
        <img src="${info.thumbnail}" class="thumb" alt="thumbnail">
      </div>

      <div class="right-side">
        <h2>${escapeHtml(info.title || "Video")}</h2>
      </div>
    </div>
  `;
}

// =========================
// FORMATS
// =========================
function displayFormats(info) {
  const videoFormats = (info.video_formats || []).slice(0, 6);
  const audioFormats = (info.audio_formats || []).slice(0, 6);

  document.getElementById("videoFormats").innerHTML =
    videoFormats.length
      ? videoFormats.map((f) => `
        <div class="quality-card">
          <div>
            <strong>${f.height || "HD"}p</strong><br>
            <small>${f.ext || "mp4"}</small>
          </div>

          <button
            class="format-download-btn"
            onclick="startDownload('${f.format_id}','${info.safe_title}', this)"
          >
            Download
          </button>
        </div>
      `).join("")
      : `<p>No video formats</p>`;

  document.getElementById("audioFormats").innerHTML =
    audioFormats.length
      ? audioFormats.map((f) => `
        <div class="quality-card">
          <div>
            <strong>${f.abr || "128"} kbps</strong><br>
            <small>${f.ext || "mp3"}</small>
          </div>

          <button
            class="format-download-btn"
            onclick="startDownload('${f.format_id}','${info.safe_title}', this)"
          >
            Download
          </button>
        </div>
      `).join("")
      : `<p>No audio formats</p>`;

  syncMobileDownloadDock();
}

// =========================
// DOWNLOAD (FIXED 🔥)
// =========================
function startDownload(formatId, title, btn) {
  const url = videoUrlInput.value.trim();

  console.log("[DOWNLOAD START]", formatId);

  if (!url) {
    alert("Enter URL first");
    return;
  }

  if (btn?.dataset.loading === "true") return;

  stopAllDownloadLoading();

  if (btn) {
    btn.dataset.loading = "true";
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = "Downloading...";
  }

  const downloadUrl =
    `${API_BASE}/stream?url=${encodeURIComponent(url)}&format_id=${formatId}&filename=${encodeURIComponent(title)}`;

  console.log("[DOWNLOAD URL]", downloadUrl);

  try {
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = title || "video";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    console.warn("[FALLBACK OPEN]");
    window.open(downloadUrl, "_blank");
  }

  setTimeout(() => {
    stopAllDownloadLoading();
  }, 2500);
}

// =========================
// RESET BUTTONS
// =========================
function stopAllDownloadLoading() {
  clearTimeout(downloadTimer);

  document.querySelectorAll(".format-download-btn").forEach((btn) => {
    btn.disabled = false;
    btn.dataset.loading = "false";
    btn.innerHTML = btn.dataset.original || "Download";
  });
}

// =========================
// MOBILE DOCK
// =========================
function syncMobileDownloadDock() {
  if (!mobileDownloadDock) return;

  if (window.innerWidth >= 768) {
    mobileDownloadDock.style.display = "none";
    return;
  }

  const btn = document.querySelector(".format-download-btn");

  if (!btn) {
    mobileDownloadDock.style.display = "none";
    return;
  }

  mobileDownloadDock.innerHTML = "";

  const clone = btn.cloneNode(true);
  clone.onclick = btn.onclick;

  mobileDownloadDock.appendChild(clone);
  mobileDownloadDock.style.display = "block";
}

// =========================
// HELPERS
// =========================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}