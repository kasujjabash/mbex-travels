/* ==========================================================================
   Mbeks Travels — Enquiry form
   Validates the form, then opens WhatsApp with the answers pre-filled.
   Loaded on contacts.html only.
   ========================================================================== */

(function () {
  "use strict";

  const WHATSAPP_NUMBER = "256706580418";

  const form = document.querySelector("[data-whatsapp-form]");
  if (!form) return;

  const success = form.querySelector("[data-form-success]");
  const required = Array.from(form.querySelectorAll("[required]"));

  function setError(field, hasError) {
    const error = document.getElementById(`${field.id}-error`);
    field.setAttribute("aria-invalid", String(hasError));
    if (error) {
      error.hidden = !hasError;
      if (hasError) field.setAttribute("aria-describedby", error.id);
      else field.removeAttribute("aria-describedby");
    }
  }

  function validate() {
    let firstInvalid = null;
    required.forEach((field) => {
      const invalid = field.value.trim() === "";
      setError(field, invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function buildMessage(data) {
    const lines = ["Hi Mbeks Travels, I'd like to book a trip."];
    const add = (label, value) => {
      if (value && value.trim()) lines.push(`${label}: ${value.trim()}`);
    };

    add("Name", data.get("name"));
    add("Phone/WhatsApp", data.get("phone"));
    add("Destination", data.get("destination") || "Not sure yet");
    add("Travel dates", data.get("dates"));
    add("Group size", data.get("group"));
    add("Message", data.get("message"));

    return lines.join("\n");
  }

  required.forEach((field) => {
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true" && field.value.trim()) setError(field, false);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validate()) return;

    const data = new FormData(form);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(data))}`;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "book_trip_click",
      topic: data.get("destination") || "general",
      link_location: "enquiry-form",
      page_path: window.location.pathname
    });

    // Open WhatsApp in a new tab; if a pop-up blocker stops it, go there directly
    const whatsapp = window.open(url, "_blank");
    if (whatsapp) whatsapp.opener = null;
    else window.location.href = url;

    success.hidden = false;
    form.reset();
  });
})();
