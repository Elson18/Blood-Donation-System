(() => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navList = document.querySelector("[data-nav-list]");

  if (navToggle && navList) {
    const toggleNavigation = () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      navList.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("no-scroll", !isOpen);
    };

    navToggle.addEventListener("click", toggleNavigation);

    navList.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (navToggle.getAttribute("aria-expanded") === "true") {
          toggleNavigation();
        }
      });
    });
  }

  const yearTargets = document.querySelectorAll("[data-current-year]");
  if (yearTargets.length) {
    const currentYear = new Date().getFullYear();
    yearTargets.forEach((node) => {
      node.textContent = currentYear;
    });
  }
})();

