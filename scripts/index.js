(() => {
  const API_ROOT = "http://localhost:4000/api";
  const triggerButtons = document.querySelectorAll("[data-blood-group]");
  const popup = document.querySelector("[data-emergency-popup]");
  const popupBody = popup?.querySelector("[data-popup-body]");
  const popupClose = popup?.querySelector("[data-popup-close]");

  if (!triggerButtons.length || !popup || !popupBody || !popupClose) {
    return;
  }

  let activeButton = null;

  const setPopupVisibility = (shouldShow) => {
    popup.classList.toggle("is-visible", shouldShow);
    popup.setAttribute("aria-hidden", shouldShow ? "false" : "true");
    if (!shouldShow && activeButton) {
      activeButton.classList.remove("is-active");
      activeButton = null;
    }
  };

  const renderStatus = (message, type = "info") => {
    popupBody.innerHTML = "";
    const paragraph = document.createElement("p");
    paragraph.className = "emergency-popup__empty";
    paragraph.textContent = message;
    popupBody.appendChild(paragraph);
    popup.dataset.state = type;
  };

  const renderDonors = (donors, bloodGroup) => {
    popupBody.innerHTML = "";

    if (!donors.length) {
      renderStatus(`No donors found for ${bloodGroup} yet. Please try another group or check back soon.`, "empty");
      return;
    }

    donors.forEach((donor) => {
      const card = document.createElement("article");
      card.className = "donor-card";

      const name = document.createElement("h4");
      name.className = "donor-card__name";
      name.textContent = donor.name;

      const meta = document.createElement("p");
      meta.className = "donor-card__meta";

      const ageValue = Number.isFinite(donor.age) ? donor.age : "N/A";
      const cityValue = donor.city || "N/A";
      const stateValue = donor.state || "N/A";

      const age = document.createElement("span");
      age.textContent = `Age: ${ageValue}`;

      const city = document.createElement("span");
      city.textContent = `City: ${cityValue}`;

      const state = document.createElement("span");
      state.textContent = `State: ${stateValue}`;

      meta.append(age, city, state);

      const badge = document.createElement("span");
      badge.className = "donor-card__badge";
      const groupValue = donor.bloodGroup ? String(donor.bloodGroup).toUpperCase() : "N/A";
      badge.textContent = groupValue;

      const location = document.createElement("p");
      location.className = "donor-card__location";
      const registeredDate = donor.createdAt ? new Date(donor.createdAt).toLocaleDateString() : "recently";
      location.textContent = `Registered ${registeredDate}`;

      card.append(name, meta, badge, location);
      popupBody.appendChild(card);
    });
  };

  const fetchDonors = async (bloodGroup) => {
    renderStatus("Searching for compassionate donors near you…");
    setPopupVisibility(true);

    try {
      const response = await fetch(`${API_ROOT}/donations?bloodGroup=${encodeURIComponent(bloodGroup)}`);
      if (!response.ok) {
        throw new Error("Unable to fetch donors right now. Please try again.");
      }
      const data = await response.json();
      renderDonors(data?.donors ?? [], bloodGroup);
    } catch (error) {
      renderStatus(error.message || "Something went wrong. Please try again later.", "error");
      console.error("[LifePulse] Emergency finder error:", error);
    }
  };

  triggerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const bloodGroup = button.dataset.bloodGroup;
      if (!bloodGroup) return;

      if (activeButton === button) {
        setPopupVisibility(false);
        return;
      }

      if (activeButton) {
        activeButton.classList.remove("is-active");
      }
      activeButton = button;
      activeButton.classList.add("is-active");

      triggerButtons.forEach((btn) => {
        btn.disabled = true;
      });

      fetchDonors(bloodGroup).finally(() => {
        triggerButtons.forEach((btn) => {
          btn.disabled = false;
        });
      });
    });
  });

  popupClose.addEventListener("click", () => {
    setPopupVisibility(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("is-visible")) {
      setPopupVisibility(false);
    }
  });
})();

