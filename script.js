const FILTER_KEYS = ["state", "specialties", "languages", "therapyTypes", "availability"];
const PAGE_SIZE = 3;
const menuToggle = document.querySelector("#menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const footerYear = document.querySelector("#home-year");
const loginModal = document.querySelector("#login-modal");
const openLoginModalButton = document.querySelector("#open-login-modal");
const therapistLoginForm = document.querySelector("#therapist-login-form");
const therapistLoginEmailInput = document.querySelector("#therapist-login-email-input");
const therapistLoginPasswordInput = document.querySelector("#therapist-login-password-input");
const loginModalStatus = document.querySelector("#login-modal-status");
const LANGUAGE_FILTERS = [
  { label: "English", aliases: ["English"] },
  { label: "Español", aliases: ["Spanish", "Espanol", "Español"] },
  { label: "Русский", aliases: ["Russian", "Русский"] },
  { label: "中文", aliases: ["Chinese", "Mandarin", "中文"] },
  { label: "العربية", aliases: ["Arabic", "العربية"] },
  { label: "தமிழ்", aliases: ["Tamil", "தமிழ்"] },
  { label: "اردو", aliases: ["Urdu", "اردو"] },
  { label: "हिंदी", aliases: ["Hindi", "हिंदी"] },
  { label: "ਪੰਜਾਬੀ", aliases: ["Punjabi", "ਪੰਜਾਬੀ"] },
  { label: "Bilingual", aliases: ["Bilingual"] }
];
const state = {
  therapists: [],
  filteredTherapists: [],
  displayedTherapists: [],
  currentPage: 1,
  showingRecommendations: false,
  filters: {
    search: "",
    state: [],
    specialties: [],
    languages: [],
    therapyTypes: [],
    availability: [],
    priceMin: 0,
    priceMax: 300
  },
  options: {
    state: [],
    specialties: [],
    languages: [],
    therapyTypes: [],
    availability: []
  }
};

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.classList.toggle("is-open", !isOpen);
    mobileMenu.hidden = isOpen;
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.classList.remove("is-open");
      mobileMenu.hidden = true;
    });
  });
}

if (footerYear) {
  footerYear.textContent = "© " + new Date().getFullYear() + " Footprints to Feel Better";
}

const elements = {
  searchInput: document.querySelector("#therapist-search"),
  cardsGrid: document.querySelector("#cards-grid"),
  resultsCount: document.querySelector("#results-count"),
  pagination: document.querySelector("#pagination"),
  activeFilters: document.querySelector("#active-filters"),
  noResults: document.querySelector("#no-results"),
  openFiltersButton: document.querySelector("#open-filters"),
  closeFiltersButton: document.querySelector("#close-filters"),
  mobileFilters: document.querySelector("#mobile-filters"),
  mobileBackdrop: document.querySelector("#mobile-filters-backdrop"),
  applyMobileFilters: document.querySelector("#apply-mobile-filters"),
  // Price controls temporarily disabled while pricing structure is being revised.
  priceMin: null,
  priceMax: null,
  mobilePriceMin: null,
  mobilePriceMax: null,
  priceOutput: null,
  mobilePriceOutput: null,
  optionBuckets: {
    state: [document.querySelector("#state-options"), document.querySelector("#mobile-state-options")],
    specialties: [document.querySelector("#specialties-options"), document.querySelector("#mobile-specialties-options")],
    languages: [document.querySelector("#languages-options"), document.querySelector("#mobile-languages-options")],
    therapyTypes: [document.querySelector("#therapyTypes-options"), document.querySelector("#mobile-therapyTypes-options")],
    availability: [document.querySelector("#availability-options"), document.querySelector("#mobile-availability-options")]
  }
};

const fallbackTherapists = [
  {
    id: "siham-abdelqader",
    name: "Siham Abdelqader",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Siham%20Pic%202.jpg/:/cr=t:9.58%25,l:0%25,w:100%25,h:50.13%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-LP",
    location: "NY",
    specialties: ["Depression", "Anxiety", "Trauma"],
    languages: ["English", "Arabic"],
    therapyTypes: ["Individual", "Family"],
    availability: "Available",
    summary: "Values multiculturalism, cultural awareness, compassion, and empathy. Experienced supporting clients with depression, anxiety, trauma, self-esteem, stress management, and family or marital conflicts."
  },
  {
    id: "diana-abrams",
    name: "Diana Abrams",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Diana_Abrams.jpg/:/cr=t:21.8%25,l:0%25,w:100%25,h:56.39%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-LP",
    location: "NJ",
    specialties: ["Trauma", "Empowerment", "Personal Growth"],
    languages: ["English"],
    therapyTypes: ["Individual", "Trauma-Informed"],
    availability: "Limited",
    summary: "Creates a safe space where clients feel seen, heard, and empowered. Practices from a trauma-informed lens with empathy, cultural humility, and collaboration."
  },
  {
    id: "kevin-adams",
    name: "Kevin Adams",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Kevin%20Adams%20.webp/:/cr=t:0.43%25,l:0%25,w:100%25,h:75.08%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-LP",
    location: "FL",
    specialties: ["Person-Centered", "Group Therapy", "Multicultural"],
    languages: ["English"],
    therapyTypes: ["Individual", "Group"],
    availability: "Available",
    summary: "Follows a person-centered approach and believes treatment plans should be tailored to each client. Brings a versatile style and works across cultures and group settings."
  },
  {
    id: "carol-aiuto",
    name: "Carol Aiuto",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Carol%20Aiuto%20.webp/:/cr=t:12.41%25,l:0%25,w:100%25,h:75.19%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-I",
    location: "NY",
    specialties: ["CBT", "Life Coaching", "Strengths"],
    languages: ["English"],
    therapyTypes: ["Individual", "Supportive"],
    availability: "Available",
    summary: "Brings over five years of coaching experience and dual master's degrees in school counseling and mental health counseling, with a strong focus on helping people overcome obstacles and realize their potential."
  },
  {
    id: "shamina-aktar",
    name: "Shamina Aktar",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Shamina%20Aktar%20.webp/:/cr=t:0.43%25,l:0%25,w:100%25,h:75.19%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-LP",
    location: "CT",
    specialties: ["Trauma", "Substance Use", "Anxiety"],
    languages: ["English"],
    therapyTypes: ["Individual", "CBT"],
    availability: "Waitlist",
    summary: "Works to help clients feel safe, heard, and understood in a supportive, judgement-free environment. Draws from person-centered, motivational interviewing, CBT, and solution-focused approaches."
  },
  {
    id: "lourdyes-alger",
    name: "Lourdyes Alger",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Lourdyes%20Alger%20-d726671.webp",
    title: "Partner-LMHC",
    location: "NV",
    specialties: ["Trauma", "Anxiety", "Depression"],
    languages: ["English", "Spanish"],
    therapyTypes: ["Individual", "Mindfulness"],
    availability: "Available",
    summary: "Has over eight years of psychotherapy experience and uses person-centered, cognitive behavioral, and mindfulness approaches with children and adults working through trauma, anxiety, and depression."
  },
  {
    id: "marie-allen",
    name: "Marie Allen",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Marie%20Allen.webp/:/cr=t:0%25,l:0%25,w:100%25,h:75.19%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-LP",
    location: "NJ",
    specialties: ["Personalized Care", "Counseling", "Support"],
    languages: ["English"],
    therapyTypes: ["Individual", "Supportive"],
    availability: "Limited",
    summary: "Brings more than 20 years of expertise to mental health counseling and focuses on creating supportive environments with personalized therapeutic interventions tailored to each person's needs."
  },
  {
    id: "nicole-allen",
    name: "Nicole Allen",
    image: "data/portraits/portrait.svg",
    title: "MHC-I",
    location: "FL",
    specialties: ["Client Care", "Case Management", "Life Challenges"],
    languages: ["English"],
    therapyTypes: ["Individual", "Supportive"],
    availability: "Available",
    summary: "Brings a strong foundation in interpersonal communication and a deep commitment to helping people navigate difficult circumstances with compassionate, client-centered support."
  },
  {
    id: "asma-ansari",
    name: "Asma Ansari",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Asma%20Ansari.jpg/:/cr=t:35.05%25,l:17.53%25,w:64.94%25,h:32.54%25/rs=w:388,h:291.72932330827064,cg:true,m",
    title: "Psychotherapist",
    location: "CT",
    specialties: ["CBT", "DBT", "Mindfulness"],
    languages: ["English"],
    therapyTypes: ["Individual", "ACT"],
    availability: "Available",
    summary: "Blends traditional approaches like CBT and DBT with Internal Family Systems, ACT, mindfulness, and body-based awareness, helping clients reconnect with themselves through compassion and collaboration."
  },
  {
    id: "ray-ansarul",
    name: "Ray Ansarul",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Ray%20Ansarul%20.webp/:/cr=t:12.35%25,l:0%25,w:100%25,h:75.29%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-I",
    location: "NY",
    specialties: ["Compassion", "Collaboration", "Supportive Care"],
    languages: ["English"],
    therapyTypes: ["Individual", "Supportive"],
    availability: "Waitlist",
    summary: "Strives to create a safe, compassionate, and understanding space, with a strong belief that effective therapy grows from a trusting therapeutic relationship and collaborative pacing."
  },
  {
    id: "jean-antoine",
    name: "Jean Antoine",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Jean%20Antoine.png/:/cr=t:16.42%25,l:0%25,w:100%25,h:56.12%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-LP",
    location: "NV",
    specialties: ["Anxiety", "Chronic Illness", "CBT"],
    languages: ["English"],
    therapyTypes: ["Individual", "Person-Centered"],
    availability: "Available",
    summary: "Offers a safe and open space to build rapport and work through current stressors, using cognitive behavioral therapy and person-centered therapy to support anxiety, chronic illness, and emotional processing."
  },
  {
    id: "lashonne-small",
    name: "Lashonne Small",
    image: "data/portraits/portrait.svg",
    title: "MHC-LP",
    location: "FL",
    specialties: ["Adolescents", "Couples", "Families"],
    languages: ["English"],
    therapyTypes: ["Individual", "Couples"],
    availability: "Limited",
    summary: "Creates a supportive space for individuals, adolescents, couples, and families to work through life changes, improve communication, and build healthier, more confident relationships."
  }
];

async function init() {
  attachEventListeners();
  syncRangeInputs();
  state.therapists = await loadTherapists();
  state.options = buildFilterOptions(state.therapists);
  hydrateStateFromUrl();
  renderFilterOptions();
  render();
}

async function loadTherapists() {
  return window.therapistDataApi.loadTherapists({
    fallbackUrl: "data/therapists.json",
    fallbackData: fallbackTherapists
  });
}

function buildFilterOptions(therapists) {
  const optionMap = {
    state: new Set(),
    specialties: new Set(),
    languages: new Set(),
    therapyTypes: new Set(),
    availability: new Set()
  };

  therapists.forEach((therapist) => {
    if (therapist.location) {
      optionMap.state.add(therapist.location);
    }
    therapist.specialties.forEach((item) => optionMap.specialties.add(item));
    therapist.languages.forEach((item) => {
      const matchedLanguage = LANGUAGE_FILTERS.find((language) => language.aliases.includes(item));
      optionMap.languages.add(matchedLanguage ? matchedLanguage.label : item);
    });
    if (therapist.languages.length > 1) {
      optionMap.languages.add("Bilingual");
    }
    therapist.therapyTypes.forEach((item) => optionMap.therapyTypes.add(item));
    optionMap.availability.add(therapist.availability);
  });

  LANGUAGE_FILTERS.forEach((language) => optionMap.languages.add(language.label));

  return Object.fromEntries(
    Object.entries(optionMap).map(([key, values]) => {
      if (key !== "languages") {
        return [key, [...values].sort((a, b) => a.localeCompare(b))];
      }

      const orderedLanguages = [
        ...LANGUAGE_FILTERS.map((language) => language.label).filter((label) => values.has(label)),
        ...[...values]
          .filter((label) => !LANGUAGE_FILTERS.some((language) => language.label === label))
          .sort((a, b) => a.localeCompare(b))
      ];

      return [key, orderedLanguages];
    })
  );
}

function attachEventListeners() {
  initFilterGroupToggles();
  initLoginModal();

  elements.searchInput.addEventListener("input", debounce((event) => {
    state.filters.search = event.target.value.trim();
    render(true);
  }, 120));

  elements.cardsGrid.addEventListener("click", handleCardActionClick);

  document.querySelectorAll("[data-clear-filters]").forEach((button) => {
    button.addEventListener("click", clearAllFilters);
  });

  elements.openFiltersButton.addEventListener("click", openMobileFilters);
  elements.closeFiltersButton.addEventListener("click", closeMobileFilters);
  elements.mobileBackdrop.addEventListener("click", closeMobileFilters);
  elements.applyMobileFilters.addEventListener("click", closeMobileFilters);

  // Price inputs temporarily disabled while pricing structure is being revised.

  elements.activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");
    if (!button) {
      return;
    }

    const { key, value } = button.dataset;
    if (key === "search") {
      state.filters.search = "";
      elements.searchInput.value = "";
    } else if (key !== "price") {
      state.filters[key] = state.filters[key].filter((item) => item !== value);
      syncCheckboxes();
    }

    render(true);
  });

  elements.pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page]");
    if (!button) {
      return;
    }

    const nextPage = Number(button.dataset.page);
    if (!Number.isNaN(nextPage)) {
      state.currentPage = nextPage;
      render();
    }
  });
}

function initLoginModal() {
  if (!loginModal || !openLoginModalButton || !therapistLoginForm || !loginModalStatus) {
    return;
  }

  openLoginModalButton.addEventListener("click", openLoginModal);
  loginModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-close-login-modal]")) {
      closeLoginModal();
    }
  });

  therapistLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const normalizedEmail = window.therapistDataApi.normalizeStaffEmail(therapistLoginEmailInput.value);

    if (!window.therapistDataApi.isAllowedStaffEmail(normalizedEmail)) {
      loginModalStatus.textContent = `Only @${window.therapistDataApi.STAFF_EMAIL_DOMAIN} email addresses can sign in.`;
      therapistLoginEmailInput.focus();
      return;
    }

    loginModalStatus.textContent = "Signing in...";
    const result = await window.therapistDataApi.loginWithPassword(
      normalizedEmail,
      therapistLoginPasswordInput.value
    );

    if (result.error) {
      loginModalStatus.textContent = result.error.message;
      return;
    }

    loginModalStatus.textContent = "Sign-in successful. Redirecting to the therapist portal...";
    const portalUrl = new URL("therapist-portal.html", window.location.href);
    window.location.href = portalUrl.toString();
  });

  initPasswordToggles(loginModal);
}

function openLoginModal() {
  loginModal.classList.remove("hidden");
  loginModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  loginModalStatus.textContent = `Use your @${window.therapistDataApi.STAFF_EMAIL_DOMAIN} email to sign in.`;
  therapistLoginEmailInput.focus();
}

function closeLoginModal() {
  loginModal.classList.add("hidden");
  loginModal.setAttribute("aria-hidden", "true");
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

function initFilterGroupToggles() {
  document.querySelectorAll(".filter-group-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isExpanded));
    });
  });
}

function handleCardActionClick(event) {
  const profileButton = event.target.closest("[data-view-profile]");
  if (profileButton) {
    const therapistId = profileButton.dataset.therapistId;
    if (!therapistId) {
      return;
    }

    const profileUrl = new URL("therapist-profile.html", window.location.href);
    profileUrl.searchParams.set("therapist", therapistId);
    window.location.href = profileUrl.toString();
    return;
  }

  const bookButton = event.target.closest("[data-book-consultation]");
  if (!bookButton) {
    return;
  }

  const therapistId = bookButton.dataset.therapistId;
  if (!therapistId) {
    return;
  }

  const bookingUrl = `https://booking.meetfootprints.com/booking?therapist=${therapistId}`;
  window.location.href = bookingUrl;
}

function renderFilterOptions() {
  FILTER_KEYS.forEach((key) => {
    const buckets = elements.optionBuckets[key];
    buckets.forEach((bucket) => {
      bucket.replaceChildren(createCheckboxFragment(key, state.options[key]));
    });
  });
  syncCheckboxes();
}

function createCheckboxFragment(groupKey, values) {
  const fragment = document.createDocumentFragment();

  values.forEach((value) => {
    const label = document.createElement("label");
    label.className = "filter-checkbox";
    label.innerHTML = `
      <input type="checkbox" value="${value}" data-filter-group="${groupKey}">
      <span>${value}</span>
    `;
    label.querySelector("input").addEventListener("change", handleCheckboxChange);
    fragment.appendChild(label);
  });

  return fragment;
}

function handleCheckboxChange(event) {
  const { filterGroup } = event.target.dataset;
  const { value, checked } = event.target;
  const selected = new Set(state.filters[filterGroup]);

  if (checked) {
    selected.add(value);
  } else {
    selected.delete(value);
  }

  state.filters[filterGroup] = [...selected];
  syncCheckboxes();
  render(true);
}

function handlePriceInput(event) {
  const isMin = event.target.id.includes("min");
  const currentValue = Number(event.target.value);
  const minValue = Number(elements.priceMin.value);
  const maxValue = Number(elements.priceMax.value);

  if (isMin) {
    state.filters.priceMin = Math.min(currentValue, maxValue);
    if (currentValue > maxValue) {
      state.filters.priceMax = currentValue;
    }
  } else {
    state.filters.priceMax = Math.max(currentValue, minValue);
    if (currentValue < minValue) {
      state.filters.priceMin = currentValue;
    }
  }

  syncRangeInputs();
  render(true);
}

function syncCheckboxes() {
  document.querySelectorAll("[data-filter-group]").forEach((checkbox) => {
    const { filterGroup } = checkbox.dataset;
    checkbox.checked = state.filters[filterGroup].includes(checkbox.value);
  });
}

function syncRangeInputs() {
  if (!elements.priceMin || !elements.priceMax || !elements.mobilePriceMin || !elements.mobilePriceMax
    || !elements.priceOutput || !elements.mobilePriceOutput) {
    return;
  }

  const min = state.filters.priceMin;
  const max = state.filters.priceMax;

  elements.priceMin.value = String(min);
  elements.priceMax.value = String(max);
  elements.mobilePriceMin.value = String(min);
  elements.mobilePriceMax.value = String(max);

  const label = `${formatPrice(min)} - ${max >= 300 ? "$300+" : formatPrice(max)}`;
  elements.priceOutput.value = label;
  elements.mobilePriceOutput.value = label;
}

function hydrateStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const searchValue = params.get("search");
  if (searchValue) {
    state.filters.search = searchValue;
    elements.searchInput.value = searchValue;
  }

  FILTER_KEYS.forEach((key) => {
    const raw = params.get(key);
    if (!raw) {
      return;
    }
    state.filters[key] = raw.split(",").map((item) => decodeURIComponent(item)).filter(Boolean);
  });

  const urlPage = Number(params.get("page"));
  if (!Number.isNaN(urlPage) && urlPage > 0) {
    state.currentPage = urlPage;
  }

  syncRangeInputs();
}

function updateUrlFromState() {
  const params = new URLSearchParams();

  if (state.filters.search) {
    params.set("search", state.filters.search);
  }

  FILTER_KEYS.forEach((key) => {
    if (state.filters[key].length) {
      params.set(key, state.filters[key].join(","));
    }
  });

  if (state.currentPage > 1) {
    params.set("page", String(state.currentPage));
  }

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function render(resetPage = false) {
  state.filteredTherapists = getFilteredTherapists();

  if (state.filteredTherapists.length === 0 && hasActiveFilters()) {
    state.showingRecommendations = true;
    state.displayedTherapists = getRecommendedTherapists(3);
  } else {
    state.showingRecommendations = false;
    state.displayedTherapists = state.filteredTherapists;
  }

  const totalPages = state.showingRecommendations
    ? 1
    : Math.max(1, Math.ceil(state.displayedTherapists.length / PAGE_SIZE));

  if (resetPage || state.showingRecommendations) {
    state.currentPage = 1;
  } else {
    state.currentPage = Math.min(state.currentPage, totalPages);
  }

  const paginatedTherapists = state.showingRecommendations
    ? state.displayedTherapists
    : paginateTherapists(state.displayedTherapists, state.currentPage);

  updateUrlFromState();
  renderCards(paginatedTherapists);
  renderResultsCount(state.filteredTherapists.length, state.displayedTherapists.length, state.showingRecommendations);
  renderActiveFilters();
  renderPagination(totalPages);
  toggleNoResults(state.showingRecommendations);
}

function getFilteredTherapists() {
  return state.therapists.filter((therapist) => {
    const hasDisplayTitle = typeof therapist.title === "string" && therapist.title.trim().length > 0;
    if (!hasDisplayTitle) {
      return false;
    }

    const searchTerm = state.filters.search.toLowerCase();
    const matchesSearch = !searchTerm || [
      therapist.name,
      therapist.title,
      therapist.location,
      ...therapist.specialties,
      ...therapist.languages,
      ...therapist.therapyTypes
    ].join(" ").toLowerCase().includes(searchTerm);

    const matchesState = !state.filters.state.length || state.filters.state.includes(therapist.location);
    const matchesSpecialties = !state.filters.specialties.length
      || therapist.specialties.some((item) => state.filters.specialties.includes(item));
    const matchesLanguages = !state.filters.languages.length
      || state.filters.languages.some((language) => matchesLanguageFilter(therapist.languages, language));
    const matchesTherapyTypes = !state.filters.therapyTypes.length
      || therapist.therapyTypes.some((item) => state.filters.therapyTypes.includes(item));
    const matchesAvailability = !state.filters.availability.length
      || state.filters.availability.includes(therapist.availability);
    return [
      matchesSearch,
      matchesState,
      matchesSpecialties,
      matchesLanguages,
      matchesTherapyTypes,
      matchesAvailability
    ].every(Boolean);
  });
}

function getRecommendedTherapists(minimumCount = 3) {
  const searchTerm = state.filters.search.toLowerCase();
  const scored = state.therapists
    .filter((therapist) => typeof therapist.title === "string" && therapist.title.trim().length > 0)
    .map((therapist) => {
    let score = 0;

    if (searchTerm) {
      const haystack = [
        therapist.name,
        therapist.title,
        therapist.location,
        ...therapist.specialties,
        ...therapist.languages,
        ...therapist.therapyTypes
      ].join(" ").toLowerCase();
      if (haystack.includes(searchTerm)) {
        score += 5;
      }
    }

    if (state.filters.state.includes(therapist.location)) {
      score += 4;
    }

    score += therapist.specialties.filter((item) => state.filters.specialties.includes(item)).length * 3;
    score += state.filters.languages.filter((language) => matchesLanguageFilter(therapist.languages, language)).length * 3;
    score += therapist.therapyTypes.filter((item) => state.filters.therapyTypes.includes(item)).length * 2;

    if (state.filters.availability.includes(therapist.availability)) {
      score += 1;
    }

    return { therapist, score };
  });

  const recommendations = scored
    .sort((left, right) => right.score - left.score || left.therapist.name.localeCompare(right.therapist.name))
    .map((entry) => entry.therapist);

  return recommendations.slice(0, Math.max(minimumCount, PAGE_SIZE));
}

function matchesLanguageFilter(therapistLanguages, selectedLanguage) {
  if (selectedLanguage === "Bilingual") {
    return therapistLanguages.length > 1;
  }

  const languageConfig = LANGUAGE_FILTERS.find((language) => language.label === selectedLanguage);
  if (!languageConfig) {
    return therapistLanguages.includes(selectedLanguage);
  }

  return therapistLanguages.some((language) => languageConfig.aliases.includes(language));
}

function renderCards(therapists) {
  const fragment = document.createDocumentFragment();

  therapists.forEach((therapist) => {
    const card = document.createElement("article");
    card.className = "therapist-card";
    card.innerHTML = `
      <div class="card-image-wrap">
        <img class="card-image" src="${therapist.image || "data/portraits/portrait.svg"}" alt="${therapist.name}" loading="lazy">
      </div>
      <div class="card-body">
        <h2 class="card-name">${therapist.name}</h2>
        <p class="card-title">${therapist.title || "Footprints Therapist"}</p>
        <div class="card-meta">
          <span>${therapist.location || "Location TBD"}</span>
          <span class="meta-dot" aria-hidden="true"></span>
          <span>${therapist.languages.length ? therapist.languages.join(" · ") : "Language details coming soon"}</span>
        </div>
        <div class="card-tags">
          ${therapist.specialties.slice(0, 3).map((item) => `<span class="chip soft">${item}</span>`).join("")}
        </div>
        <p class="card-summary">${buildTherapistSummary(therapist)}</p>
      </div>
      <div class="card-actions">
        <button
          class="primary-button"
          type="button"
          data-view-profile
          data-therapist-id="${therapist.id}"
        >
          View Profile
        </button>
        <button
          class="secondary-button"
          type="button"
          data-book-consultation
          data-therapist-id="${therapist.id}"
        >
          Book Consultation
        </button>
      </div>
    `;
    const cardImage = card.querySelector(".card-image");
    if (cardImage) {
      cardImage.src = therapist.image || "data/portraits/portrait.svg";
      cardImage.alt = therapist.name;
    }
    fragment.appendChild(card);
  });

  elements.cardsGrid.replaceChildren(fragment);
}

function paginateTherapists(therapists, currentPage) {
  const start = (currentPage - 1) * PAGE_SIZE;
  return therapists.slice(start, start + PAGE_SIZE);
}

function buildTherapistSummary(therapist) {
  if (therapist.summary) {
    return therapist.summary;
  }
  const specialties = therapist.specialties.slice(0, 2).join(", ");
  const therapyTypes = therapist.therapyTypes.slice(0, 2).join(" and ");
  if (specialties && therapyTypes) {
    return `Specializes in ${specialties}. Offers ${therapyTypes.toLowerCase()} sessions.`;
  }
  if (specialties) {
    return `Specializes in ${specialties}.`;
  }
  if (therapyTypes) {
    return `Offers ${therapyTypes.toLowerCase()} sessions.`;
  }
  return "Profile details are being updated.";
}

function renderResultsCount(totalMatches, displayedCount, showingRecommendations) {
  if (showingRecommendations) {
    const noun = displayedCount === 1 ? "therapist" : "therapists";
    elements.resultsCount.textContent = `Showing ${displayedCount} recommended ${noun}`;
    return;
  }

  const noun = totalMatches === 1 ? "therapist" : "therapists";
  elements.resultsCount.textContent = `Showing ${totalMatches} ${noun}`;
}

function renderPagination(totalPages) {
  if (state.showingRecommendations || state.filteredTherapists.length === 0 || totalPages <= 1) {
    elements.pagination.classList.add("hidden");
    elements.pagination.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();
  const pages = buildPaginationModel(totalPages, state.currentPage);

  fragment.appendChild(createPaginationButton("Prev", Math.max(1, state.currentPage - 1), state.currentPage === 1, true));

  pages.forEach((item) => {
    if (item === "...") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "pagination-ellipsis";
      ellipsis.textContent = "...";
      fragment.appendChild(ellipsis);
      return;
    }

    fragment.appendChild(createPaginationButton(String(item), item, false, false, item === state.currentPage));
  });

  fragment.appendChild(
    createPaginationButton("Next", Math.min(totalPages, state.currentPage + 1), state.currentPage === totalPages, true)
  );

  elements.pagination.classList.remove("hidden");
  elements.pagination.replaceChildren(fragment);
}

function createPaginationButton(label, page, disabled, isNav, isActive = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `pagination-button${isNav ? " is-nav" : ""}${isActive ? " is-active" : ""}`;
  button.textContent = label;
  button.dataset.page = String(page);
  button.disabled = disabled;
  button.setAttribute("aria-label", `Go to page ${page}`);
  if (isActive) {
    button.setAttribute("aria-current", "page");
  }
  return button;
}

function buildPaginationModel(totalPages, currentPage) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

function renderActiveFilters() {
  const fragment = document.createDocumentFragment();
  const entries = [];

  if (state.filters.search) {
    entries.push({ key: "search", value: state.filters.search, label: `Search: ${state.filters.search}` });
  }

  FILTER_KEYS.forEach((key) => {
    state.filters[key].forEach((value) => entries.push({ key, value, label: value }));
  });

  entries.forEach((entry) => {
    const pill = document.createElement("div");
    pill.className = "filter-pill";
    pill.innerHTML = `
      <span>${entry.label}</span>
      <button type="button" aria-label="Remove ${entry.label}" data-remove-filter data-key="${entry.key}" data-value="${entry.value}">X</button>
    `;
    fragment.appendChild(pill);
  });

  elements.activeFilters.replaceChildren(fragment);
}

function toggleNoResults(hasNoResults) {
  elements.noResults.classList.toggle("hidden", !hasNoResults);
}

function hasActiveFilters() {
  return Boolean(state.filters.search)
    || FILTER_KEYS.some((key) => state.filters[key].length > 0);
}

function clearAllFilters() {
  state.filters = {
    search: "",
    state: [],
    specialties: [],
    languages: [],
    therapyTypes: [],
    availability: [],
    priceMin: 0,
    priceMax: 300
  };
  elements.searchInput.value = "";
  syncCheckboxes();
  syncRangeInputs();
  render(true);
}

function openMobileFilters() {
  elements.mobileFilters.classList.remove("hidden");
  elements.mobileBackdrop.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeMobileFilters() {
  elements.mobileFilters.classList.add("hidden");
  elements.mobileBackdrop.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return "Contact for rate";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function debounce(callback, delay) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
}

init();







