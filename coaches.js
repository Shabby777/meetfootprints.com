const coachState = {
  all: [],
  filtered: []
};

const pageChrome = {
  menuToggle: document.querySelector("#menu-toggle"),
  mobileMenu: document.querySelector("#mobile-menu"),
  footerYear: document.querySelector("#home-year"),
  loginModal: document.querySelector("#login-modal"),
  openLoginModalButton: document.querySelector("#open-login-modal"),
  therapistLoginForm: document.querySelector("#therapist-login-form"),
  therapistLoginEmailInput: document.querySelector("#therapist-login-email-input"),
  therapistLoginPasswordInput: document.querySelector("#therapist-login-password-input"),
  loginModalStatus: document.querySelector("#login-modal-status")
};

const coachElements = {
  search: document.querySelector("#coach-search"),
  clearSearch: document.querySelector("#clear-search"),
  count: document.querySelector("#results-count"),
  grid: document.querySelector("#coach-grid"),
  emptyState: document.querySelector("#empty-state")
};

const COACHES_DATA_URL = "data/coaches.json";

function attachChromeEvents() {
  if (pageChrome.menuToggle && pageChrome.mobileMenu) {
    pageChrome.menuToggle.addEventListener("click", () => {
      const isOpen = pageChrome.menuToggle.getAttribute("aria-expanded") === "true";
      pageChrome.menuToggle.setAttribute("aria-expanded", String(!isOpen));
      pageChrome.menuToggle.classList.toggle("is-open", !isOpen);
      pageChrome.mobileMenu.hidden = isOpen;
    });

    pageChrome.mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        pageChrome.menuToggle.setAttribute("aria-expanded", "false");
        pageChrome.menuToggle.classList.remove("is-open");
        pageChrome.mobileMenu.hidden = true;
      });
    });
  }

  if (pageChrome.footerYear) {
    pageChrome.footerYear.textContent = `(c) ${new Date().getFullYear()} Footprints to Feel Better`;
  }

  initLoginModal();
}

function initLoginModal() {
  if (
    !pageChrome.loginModal
    || !pageChrome.openLoginModalButton
    || !pageChrome.therapistLoginForm
    || !pageChrome.loginModalStatus
  ) {
    return;
  }

  const closeButtons = pageChrome.loginModal.querySelectorAll("[data-close-login-modal]");

  pageChrome.openLoginModalButton.addEventListener("click", openLoginModal);
  closeButtons.forEach((button) => button.addEventListener("click", closeLoginModal));

  pageChrome.loginModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-login-modal]")) {
      closeLoginModal();
    }
  });

  pageChrome.therapistLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!window.therapistDataApi) {
      pageChrome.loginModalStatus.textContent = "Login tools are not available right now.";
      return;
    }

    const normalizedEmail = window.therapistDataApi.normalizeStaffEmail(pageChrome.therapistLoginEmailInput.value);

    if (!window.therapistDataApi.isAllowedStaffEmail(normalizedEmail)) {
      pageChrome.loginModalStatus.textContent = `Only @${window.therapistDataApi.STAFF_EMAIL_DOMAIN} email addresses can sign in.`;
      pageChrome.therapistLoginEmailInput.focus();
      return;
    }

    pageChrome.loginModalStatus.textContent = "Signing in...";
    const result = await window.therapistDataApi.loginWithPassword(
      normalizedEmail,
      pageChrome.therapistLoginPasswordInput.value
    );

    if (result.error) {
      pageChrome.loginModalStatus.textContent = result.error.message;
      return;
    }

    pageChrome.loginModalStatus.textContent = "Sign-in successful. Redirecting to the therapist portal...";
    const portalUrl = new URL("therapist-portal.html", window.location.href);
    window.location.href = portalUrl.toString();
  });

  initPasswordToggles(pageChrome.loginModal);
}

function openLoginModal() {
  pageChrome.loginModal.classList.remove("hidden");
  pageChrome.loginModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  pageChrome.loginModalStatus.textContent = `Use your @${window.therapistDataApi.STAFF_EMAIL_DOMAIN} email to sign in.`;
  pageChrome.therapistLoginEmailInput.focus();
}

function closeLoginModal() {
  pageChrome.loginModal.classList.add("hidden");
  pageChrome.loginModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function initPasswordToggles(scope) {
  scope.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);
      if (!target) {
        return;
      }

      const shouldShow = target.type === "password";
      target.type = shouldShow ? "text" : "password";
      button.textContent = shouldShow ? "Hide" : "Show";
      button.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
    });
  });
}

function normalizeCoach(coach) {
  return {
    id: String(coach && coach.id ? coach.id : "").trim(),
    name: String(coach && coach.name ? coach.name : "").trim(),
    title: String(coach && coach.title ? coach.title : "").trim(),
    image: String(coach && coach.image ? coach.image : "").trim(),
    location: String(coach && coach.location ? coach.location : "").trim(),
    experience: String(coach && coach.experience ? coach.experience : "").trim(),
    specialties: Array.isArray(coach && coach.specialties) ? coach.specialties.map(cleanText).filter(Boolean) : [],
    languages: Array.isArray(coach && coach.languages) ? coach.languages.map(cleanText).filter(Boolean) : [],
    summary: String(coach && coach.summary ? coach.summary : "").trim(),
    availability: String(coach && coach.availability ? coach.availability : "").trim(),
    email: String(coach && coach.email ? coach.email : "").trim(),
    bookingUrl: String(coach && coach.bookingUrl ? coach.bookingUrl : "").trim(),
    focusAreas: Array.isArray(coach && coach.focusAreas) ? coach.focusAreas.map(cleanText).filter(Boolean) : []
  };
}

function cleanText(value) {
  return String(value || "").trim();
}

function getSearchableText(coach) {
  return [
    coach.name,
    coach.title,
    coach.location,
    coach.experience,
    coach.summary,
    coach.availability,
    ...(coach.specialties || []),
    ...(coach.languages || []),
    ...(coach.focusAreas || [])
  ].join(" ").toLowerCase();
}

function matchesSearch(coach, query) {
  if (!query) {
    return true;
  }

  return getSearchableText(coach).includes(query);
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getAccentClasses(id) {
  const variants = [
    "from-burgundy to-accent",
    "from-rose to-gold",
    "from-cocoa to-burgundy",
    "from-gold to-rose"
  ];
  const hash = String(id || "coach").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
}

function formatCoachMeta(coach) {
  const items = [];
  if (coach.location) {
    items.push(coach.location);
  }
  if (coach.experience) {
    items.push(coach.experience);
  }
  if (coach.availability) {
    items.push(coach.availability);
  }
  return items.join(" | ");
}

function renderCoaches(coaches) {
  const fragment = document.createDocumentFragment();

  coaches.forEach((coach) => {
    const card = document.createElement("article");
    card.className = "group rounded-[28px] border border-panel bg-white/90 p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft";

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "flex items-center gap-4";

    const avatar = document.createElement("div");
    avatar.className = `flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br ${getAccentClasses(coach.id)} text-2xl font-extrabold text-white shadow-lg`;
    avatar.textContent = getInitials(coach.name) || "C";

    const mediaText = document.createElement("div");
    mediaText.className = "min-w-0";

    const name = document.createElement("h2");
    name.className = "font-display text-3xl leading-none text-burgundy";
    name.textContent = coach.name || "Coach";

    const title = document.createElement("p");
    title.className = "mt-2 text-sm font-extrabold uppercase tracking-[0.24em] text-cocoa";
    title.textContent = coach.title || "Coach";

    mediaText.append(name, title);
    mediaWrap.append(avatar, mediaText);

    const meta = document.createElement("p");
    meta.className = "mt-4 text-sm font-semibold text-ink";
    meta.textContent = formatCoachMeta(coach);

    const summary = document.createElement("p");
    summary.className = "mt-4 min-h-[5.5rem] text-sm leading-7 text-ink";
    summary.textContent = coach.summary || "Coach details are being updated.";

    const chips = document.createElement("div");
    chips.className = "mt-5 flex flex-wrap gap-2";
    const chipValues = [...(coach.specialties || []), ...(coach.focusAreas || [])].slice(0, 4);
    chipValues.forEach((value) => {
      const chip = document.createElement("span");
      chip.className = "inline-flex items-center rounded-full border border-panel bg-sand px-3 py-1 text-xs font-bold text-burgundy";
      chip.textContent = value;
      chips.appendChild(chip);
    });

    const footer = document.createElement("div");
    footer.className = "mt-5 flex justify-center border-t border-panel pt-4";

    const booking = document.createElement("a");
    booking.className = "inline-flex items-center justify-center rounded-full bg-burgundy px-6 py-3 text-sm font-bold text-white transition hover:bg-rose";
    const bookingTarget = coach.bookingUrl || `coach-booking.html?coach=${encodeURIComponent(coach.id)}`;
    booking.href = bookingTarget;
    booking.textContent = "Book Consultation";

    footer.appendChild(booking);

    card.append(mediaWrap, meta, summary, chips, footer);
    fragment.appendChild(card);
  });

  coachElements.grid.replaceChildren(fragment);
}

function updateView() {
  const query = String(coachElements.search.value || "").trim().toLowerCase();
  coachState.filtered = coachState.all.filter((coach) => matchesSearch(coach, query));

  coachElements.count.textContent = `Showing ${coachState.filtered.length} of ${coachState.all.length} coaches`;
  coachElements.emptyState.classList.toggle("hidden", coachState.filtered.length > 0);
  coachElements.grid.classList.toggle("hidden", coachState.filtered.length === 0);

  if (coachState.filtered.length > 0) {
    renderCoaches(coachState.filtered);
  } else {
    coachElements.grid.replaceChildren();
  }
}

function debounce(callback, delay) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
}

async function loadCoaches() {
  const response = await fetch(COACHES_DATA_URL);
  if (!response.ok) {
    throw new Error("Unable to load coaches data.");
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeCoach).filter((coach) => coach.name) : [];
}

function attachEvents() {
  coachElements.search.addEventListener("input", debounce(updateView, 120));
  coachElements.clearSearch.addEventListener("click", () => {
    coachElements.search.value = "";
    updateView();
    coachElements.search.focus();
  });
}

async function init() {
  attachChromeEvents();
  attachEvents();

  try {
    coachState.all = (await loadCoaches()).sort((left, right) => left.name.localeCompare(right.name));
    coachState.filtered = coachState.all;
    renderCoaches(coachState.all);
    updateView();
  } catch (error) {
    coachElements.count.textContent = "Unable to load coaches right now.";
    coachElements.emptyState.classList.remove("hidden");
    coachElements.emptyState.querySelector("p").textContent = "Please check the coaches JSON file or try again after the page is served from the project root.";
    coachElements.grid.classList.add("hidden");
  }
}

init();
