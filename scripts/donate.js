(() => {
  const form = document.querySelector("#donor-form");
  if (!form) return;

  const statusNode = form.querySelector("[data-feedback]");
  const submitButton = form.querySelector('button[type="submit"]');

  const API_URL = "http://localhost:4000/api/donations";

  const setStatus = (message, status) => {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.dataset.status = status;
    statusNode.classList.add("is-visible");
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    payload.age = Number(payload.age);
    payload.phoneNumber = payload.phoneNumber.trim();

    try {
      submitButton.disabled = true;
      submitButton.setAttribute("aria-busy", "true");
      setStatus("Submitting your details...", "info");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.message || "We could not register your details just now. Please try again.";
        throw new Error(errorMessage);
      }

      setStatus("Thank you! Your donor profile has been saved. Our coordination team will reach out when a match is confirmed.", "success");
      form.reset();
    } catch (error) {
      setStatus(error.message, "error");
      console.error("[LifePulse] Donation form submission failed:", error);
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
    }
  });
})();

