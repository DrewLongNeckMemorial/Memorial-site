/**
 * Memorial gallery loader for GitHub Pages.
 * It reads the /photos folder using the GitHub Contents API and renders a gallery.
 *
 * Requirements:
 * - Repo must be PUBLIC (unauthenticated API access).
 * - Photos stored in /photos at repository root.
 */

const CONFIG = {
  // TODO: set these 3 values
  owner: "YOUR_GITHUB_USERNAME_OR_ORG",
  repo: "YOUR_REPO_NAME",
  branch: "main",

  photosPath: "photos", // folder in repo
  allowedExt: ["jpg", "jpeg", "png", "webp"],

  // Optional: display names/dates/quote
  personName: "His Name",
  personDates: "Month Day, Year — Month Day, Year",
  personQuote: "“Add a short quote, saying, or line that represents him.”",

  // External submission link (Google Form / Drive folder)
  shareLink: "https://example.com"
};

const el = (id) => document.getElementById(id);

function setHeaderContent() {
  if (el("personName")) el("personName").textContent = CONFIG.personName;
  if (el("personDates")) el("personDates").textContent = CONFIG.personDates;
  if (el("personQuote")) el("personQuote").textContent = CONFIG.personQuote;
  if (el("shareLink")) el("shareLink").href = CONFIG.shareLink;
}

function isAllowed(filename) {
  const parts = filename.split(".");
  if (parts.length < 2) return false;
  const ext = parts.pop().toLowerCase();
  return CONFIG.allowedExt.includes(ext);
}

function prettyCaption(filename) {
  // Convert "2026-01-09_001.jpg" => "2026-01-09 · 001"
  const base = filename.replace(/\.[^/.]+$/, "");
  const cleaned = base.replace(/[_-]+/g, " ").trim();
  return cleaned;
}

function sortByName(a, b) {
  // Sort by filename (good if you name files with dates / numbering)
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

async function fetchPhotosList() {
  const apiUrl = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.photosPath}?ref=${encodeURIComponent(CONFIG.branch)}`;

  const res = await fetch(apiUrl, {
    headers: { "Accept": "application/vnd.github+json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load photos (${res.status}). ${text}`);
  }

  const items = await res.json();
  // Items are objects: {name, path, download_url, type, ...}
  return items
    .filter(it => it.type === "file" && isAllowed(it.name))
    .sort(sortByName);
}

function renderGallery(items) {
  const grid = el("galleryGrid");
  const countEl = el("photoCount");
  if (!grid) return;

  grid.innerHTML = "";
  grid.setAttribute("aria-busy", "false");

  const count = items.length;
  if (countEl) countEl.textContent = `${count} photo${count === 1 ? "" : "s"}`;

  if (count === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `<h3>No photos yet</h3><p class="muted">Add images to <code>/${CONFIG.photosPath}</code> in the repo.</p>`;
    grid.appendChild(empty);
    return;
  }

  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "photo";
    btn.setAttribute("aria-label", `Open photo: ${item.name}`);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = prettyCaption(item.name);
    img.src = item.download_url;

    const cap = document.createElement("div");
    cap.className = "caption";
    cap.textContent = prettyCaption(item.name);

    btn.appendChild(img);
    btn.appendChild(cap);

    btn.addEventListener("click", () => openLightbox(item.download_url, prettyCaption(item.name)));

    grid.appendChild(btn);
  }
}

function setupLightbox() {
  const box = el("lightbox");
  const img = el("lightboxImg");
  const cap = el("lightboxCaption");
  const close = el("lightboxClose");

  const closeBox = () => {
    if (!box) return;
    box.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (img) img.src = "";
    if (cap) cap.textContent = "";
  };

  if (close) close.addEventListener("click", closeBox);

  if (box) {
    box.addEventListener("click", (e) => {
      // Close when clicking the backdrop (not the image)
      if (e.target === box) closeBox();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeBox();
  });

  window.openLightbox = (src, caption) => {
    if (!box || !img) return;
    img.src = src;
    img.alt = caption || "";
    if (cap) cap.textContent = caption || "";
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
}

function openLightbox(src, caption) {
  if (typeof window.openLightbox === "function") window.openLightbox(src, caption);
}

function setupCopyInstructions() {
  const btn = el("copyRepoInfo");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const text =
`How to contribute photos:
1) Send photos using the form/drive link: ${CONFIG.shareLink}
2) If you have GitHub access: add images to /${CONFIG.photosPath} in the repo "${CONFIG.owner}/${CONFIG.repo}"
3) Commit + push to the "${CONFIG.branch}" branch
4) The site updates automatically via GitHub Pages`;

    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy instructions for contributors"), 1200);
    } catch {
      // Fallback
      alert(text);
    }
  });
}

async function init() {
  setHeaderContent();
  setupLightbox();
  setupCopyInstructions();

  const grid = el("galleryGrid");
  if (grid) grid.setAttribute("aria-busy", "true");

  try {
    const items = await fetchPhotosList();
    renderGallery(items);
  } catch (err) {
    const grid = el("galleryGrid");
    const countEl = el("photoCount");
    if (countEl) countEl.textContent = "Gallery unavailable";

    if (grid) {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = `
        <div class="card">
          <h3>Couldn’t load photos</h3>
          <p class="muted">
            Make sure you set <code>owner</code>, <code>repo</code>, and <code>branch</code> in <code>script.js</code>,
            the repo is public, and there is a <code>/${CONFIG.photosPath}</code> folder.
          </p>
          <p class="muted small"><code>${String(err.message || err)}</code></p>
        </div>
      `;
    }
  }
}

init();
