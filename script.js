const CONFIG = {
  personName: "Drew LongNeck",
  personDates: "January 7, 2026 — January 9, 2026",
  personQuote: "“i got touched...",
  photosJson: "data/photos.json"
};

const el = (id) => document.getElementById(id);

function setHeaderContent() {
  if (el("personName")) el("personName").textContent = CONFIG.personName;
  if (el("personDates")) el("personDates").textContent = CONFIG.personDates;
  if (el("personQuote")) el("personQuote").textContent = CONFIG.personQuote;
}

function buildCaptionText(item) {
  const parts = [];
  if (item.caption) parts.push(item.caption);
  if (item.credit) parts.push(`— ${item.credit}`);
  return parts.join(" ");
}

function makePhotoNode(item) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "photo";
  btn.setAttribute("aria-label", "Open photo");

  const img = document.createElement("img");
  img.loading = "lazy";
  img.src = item.src;
  img.alt = item.caption || "Memorial photo";

  const captionText = buildCaptionText(item);
  if (captionText) {
    const cap = document.createElement("div");
    cap.className = "caption";
    cap.textContent = captionText;
    btn.appendChild(cap);
  }

  btn.insertBefore(img, btn.firstChild);

  btn.addEventListener("click", () => openLightbox(item.src, captionText || ""));
  return btn;
}

async function loadPhotos() {
  const res = await fetch(CONFIG.photosJson, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${CONFIG.photosJson} (${res.status})`);
  return res.json();
}

function render(photos) {
  const featured = el("featuredGrid");
  const masonry = el("masonryGrid");
  const countEl = el("photoCount");

  if (countEl) countEl.textContent = `${photos.length} photo${photos.length === 1 ? "" : "s"}`;

  const featuredItems = photos.filter(p => p.section === "featured");
  const masonryItems = photos.filter(p => p.section !== "featured");

  if (featured) {
    featured.innerHTML = "";
    for (const item of featuredItems) featured.appendChild(makePhotoNode(item));
  }

  if (masonry) {
    masonry.innerHTML = "";
    for (const item of masonryItems) {
      const wrap = document.createElement("div");
      wrap.className = "masonry-item";
      wrap.appendChild(makePhotoNode(item));
      masonry.appendChild(wrap);
    }
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
  if (box) box.addEventListener("click", (e) => { if (e.target === box) closeBox(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBox(); });

  window.openLightbox = (src, caption) => {
    if (!box || !img) return;
    img.src = src;
    img.alt = caption || "Memorial photo";
    if (cap) cap.textContent = caption || "";
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
}

function openLightbox(src, caption) {
  if (typeof window.openLightbox === "function") window.openLightbox(src, caption);
}

async function init() {
  setHeaderContent();
  setupLightbox();

  try {
    const photos = await loadPhotos();
    render(photos);
  } catch (err) {
    const countEl = el("photoCount");
    if (countEl) countEl.textContent = "Gallery unavailable";

    const masonry = el("masonryGrid");
    if (masonry) {
      masonry.innerHTML = `
        <div class="card">
          <h3>Couldn’t load photos</h3>
          <p class="muted">Check that <code>${CONFIG.photosJson}</code> exists and paths like <code>photos/001.jpg</code> are correct.</p>
          <p class="muted small"><code>${String(err.message || err)}</code></p>
        </div>
      `;
    }
  }
}

init();
