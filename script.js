/**
 * Parody tribute page gallery loader for GitHub Pages.
 * It reads the /photos folder using the GitHub Contents API and renders a gallery.
 *
 * Notes:
 * - Repo must be PUBLIC for unauthenticated API access.
 * - Photos stored in /photos at repository root.
 */

const CONFIG = {
  // REQUIRED: set these
  owner: "dreulongneckmemorial",
  repo: "https://github.com/DrewLongNeckMemorial/Memorial-site/tree/main",
  branch: "main",

  // Folder containing images
  photosPath: "photos",

  // Allowed image extensions
  allowedExt: ["jpg", "jpeg", "png", "webp"],

  // Page text
  accountName: "@molested_drewhunter",
  accountDates: "2026 — 2026",
  accountQuote: "“I got touched...”",
  eyebrowText: "In loving memory of the timeline",
  heroTitle: "A tribute page for a fallen Drew Longneck.",
  heroSub:
    "The photos got requested to be taken down. The content lives on here, — post, reposts and fanmade! " +
    "This gallery updates automatically as new images are added to the repo/drive.",

  // Status badges
  cardStatus: "Status: Touched",
  statsStatus: "Touched",
  statsEra: "2026–2026",
  statsKnownFor: "gettin molested",

  // External submission link (Google Form / Drive folder)
  // GitHub Pages cannot accept uploads directly.
  submitLink: "https://drive.google.com/drive/folders/1Nqq5UOWJPB3j4m4TSgBoRtCkxdg2O_cr"
};

const el = (id) => document.getElementById(id);

function applyText() {
  if (el("accountName")) el("accountName").textContent = CONFIG.accountName;
  if (el("accountDates")) el("accountDates").textContent = CONFIG.accountDates;
  if (el("accountQuote")) el("accountQuote").textContent = CONFIG.accountQuote;
  if (el("eyebrowText")) el("eyebrowText").textContent = CONFIG.eyebrowText;
  if (el("heroTitle")) el("heroTitle").textContent = CONFIG.heroTitle;
  if (el("heroSub")) el("heroSub").textContent = CONFIG.heroSub;

  if (el("cardHandle")) el("cardHandle").textContent = CONFIG.accountName;
  if (el("cardStatus")) el("cardStatus").textContent = CONFIG.cardStatus;

  if (el("statsHandle")) el("statsHandle").textContent = CONFIG.accountName;
  if (el("statsStatus")) el("statsStatus").textContent = CONFIG.statsStatus;
  if (el("statsEra")) el("statsEra").textContent = CONFIG.statsEra;
  if (el("statsKnownFor")) el("statsKnownFor").textContent = CONFIG.statsKnownFor;

  if (el("submitLink")) el("submitLink").href = CONFIG.submitLink;
}

function isAllowed(filename) {
  const parts = filename.split(".");
  if (parts.length < 2) return false;
  const ext = parts.pop().toLowerCase();
  return CONFIG.allowedExt.includes(ext);
}

function prettyCaption(filename) {
  // "2026-01-09_001.jpg" => "2026 01 09 001"
  const base = filename.replace(/\.[^/.]+$/, "");
  return base.replace(/[_-]+/g, " ").trim();
}

function sortByName(a, b) {
  // Stable predictable ordering if files are numbered or dated
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
}

async function fetchPhotosList() {
  const apiUrl =
    `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/` +
    `${CONFIG.photosPath}?ref=${encodeURIComponent(CONFIG.branch)}`;

  const res = await fetch(apiUrl, {
    headers: { "Accept": "application/vnd.github+json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load photos (${res.status}). ${text}`);
  }

  const items = await res.json();
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
  if (countEl) countEl.textContent = `${count} image${count === 1 ? "" : "s"}`;

  if (count === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML =
      `<h3>No images yet</h3>` +
      `<p class="muted">Add images to <code>/${CONFIG.photosPath}</code> in the repo.</p>`;
    grid.appendChild(empty);
    return;
  }

  for (const item of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "photo";
    btn.setAttribute("aria-label", `Open image: ${item.name}`);

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
`How to add images to the tribute site:

Option A (no GitHub access):
1) Submit here: ${CONFIG.submitLink}
2) A maintainer reviews and adds images to /${CONFIG.photosPath}

Option B (with GitHub access):
1) Add image files to /${CONFIG.photosPath}
2) Commit + push to the "${CONFIG.branch}" branch in ${CONFIG.owner}/${CONFIG.repo}
3) GitHub Pages updates automatically

House rules:
- No private info, no doxxing, no harassment, no hate.`;

    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy contributor instructions"), 1200);
    } catch {
      alert(text);
    }
  });
}

async function init() {
  applyText();
  setupLightbox();
  setupCopyInstructions();

  const grid = el("galleryGrid");
  if (grid) grid.setAttribute("aria-busy", "true");

  try {
    const items = await fetchPhotosList();
    renderGallery(items);
  } catch (err) {
    const grid2 = el("galleryGrid");
    const countEl = el("photoCount");
    if (countEl) countEl.textContent = "Gallery unavailable";

    if (grid2) {
      grid2.setAttribute("aria-busy", "false");
      grid2.innerHTML = `
        <div class="card">
          <h3>Couldn’t load images</h3>
          <p class="muted">
            Check <code>owner</code>, <code>repo</code>, and <code>branch</code> in <code>script.js</code>,
            ensure the repo is public, and confirm there is a <code>/${CONFIG.photosPath}</code> folder.
          </p>
          <p class="muted small"><code>${String(err.message || err)}</code></p>
        </div>
      `;
    }
  }
}

init();
