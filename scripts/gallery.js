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
  const items = Array.from(root.querySelectorAll(".masonry li"));
  const status = root.querySelector("[data-gallery-status]");

  const lightboxImg = dialog.querySelector(".lightbox__img");
  const lightboxCaption = dialog.querySelector(".lightbox__caption");
  let visible = items;
  let current = 0;
  let opener = null;

  /* ---------------- Filters ---------------- */
  function applyFilter(theme) {
    filters.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.filter === theme)));
    items.forEach((item) => {
      item.hidden = theme !== "all" && item.dataset.theme !== theme;
    });
    visible = items.filter((item) => !item.hidden);
    if (status) status.textContent = `Showing ${visible.length} photos`;
  }

  filters.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  /* ---------------- Lightbox ---------------- */
  function show(index) {
    current = (index + visible.length) % visible.length;
    const img = visible[current].querySelector("img");
    // Show the largest file in the srcset (full quality in the viewer)
    lightboxImg.src = img.srcset ? img.srcset.split(",").pop().trim().split(" ")[0] : img.currentSrc || img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = img.alt;
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
