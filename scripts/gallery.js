/* ==========================================================================
   Mbeks Travels — Gallery: theme filters + lightbox
   Loaded on gallery.html only.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.querySelector("[data-gallery]");
  const dialog = document.querySelector("[data-lightbox]");
  if (!root || !dialog) return;

  const filters = Array.from(root.querySelectorAll("[data-filter]"));
  const items = Array.from(root.querySelectorAll(".photo-grid__item"));
  const status = root.querySelector("[data-gallery-status]");

  const lightboxImg = dialog.querySelector(".lightbox__img");
  const lightboxCount = dialog.querySelector("[data-lightbox-count]");
  const lightboxTag = dialog.querySelector("[data-lightbox-tag]");
  const lightboxText = dialog.querySelector("[data-lightbox-text]");
  let visible = items;
  let current = 0;
  let opener = null;

  /* ---------------- Filters ---------------- */
  function applyFilter(theme) {
    filters.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.filter === theme)));
    items.forEach((item) => {
      item.hidden = theme !== "all" && item.dataset.theme !== theme;
      // Replay the fade-in on the photos that stay
      item.classList.remove("is-in");
      if (!item.hidden) {
        void item.offsetWidth;
        item.classList.add("is-in");
      }
    });
    visible = items.filter((item) => !item.hidden);
    if (status) status.textContent = `Showing ${visible.length} photos`;
  }

  filters.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  /* ---------------- Lightbox ---------------- */
  const pad = (n) => String(n).padStart(2, "0");

  function show(index) {
    current = (index + visible.length) % visible.length;
    const item = visible[current];
    const img = item.querySelector("img");
    // Show the largest file in the srcset (full quality in the viewer)
    lightboxImg.src = img.srcset ? img.srcset.split(",").pop().trim().split(" ")[0] : img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    lightboxText.textContent = img.alt;
    lightboxTag.textContent = item.querySelector(".photo-grid__tag").textContent;
    lightboxCount.textContent = `${pad(current + 1)} / ${pad(visible.length)}`;
  }

  items.forEach((item) => {
    item.querySelector("button").addEventListener("click", (event) => {
      opener = event.currentTarget;
      show(visible.indexOf(item));
      dialog.showModal();
    });
  });

  dialog.querySelector("[data-lightbox-close]").addEventListener("click", () => dialog.close());
  dialog.querySelector("[data-lightbox-prev]").addEventListener("click", () => show(current - 1));
  dialog.querySelector("[data-lightbox-next]").addEventListener("click", () => show(current + 1));

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });

  // Click on the dark background (not the photo or buttons) closes it
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => {
    if (opener) opener.focus();
  });
})();
