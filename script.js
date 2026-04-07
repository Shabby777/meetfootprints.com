const FILTER_KEYS = ["state", "specialties", "languages", "therapyTypes", "availability"];
const PAGE_SIZE = 3;
const state = {
  therapists: [],
  filteredTherapists: [],
  currentPage: 1,
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
  priceMin: document.querySelector("#price-min"),
  priceMax: document.querySelector("#price-max"),
  mobilePriceMin: document.querySelector("#mobile-price-min"),
  mobilePriceMax: document.querySelector("#mobile-price-max"),
  priceOutput: document.querySelector("#price-output"),
  mobilePriceOutput: document.querySelector("#mobile-price-output"),
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
    price: 165,
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
    price: 175,
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
    price: 145,
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
    price: 155,
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
    price: 190,
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
    price: 130,
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
    price: 180,
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
    price: 125,
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
    price: 160,
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
    price: 170,
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
    price: 150,
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
    price: 210,
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
  try {
    const response = await fetch("data/therapists.json");
    if (!response.ok) {
      throw new Error("Unable to load therapists JSON.");
    }
    return await response.json();
  } catch (error) {
    console.warn("Falling back to inline therapist data.", error);
    return fallbackTherapists;
  }
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
    optionMap.state.add(therapist.location);
    therapist.specialties.forEach((item) => optionMap.specialties.add(item));
    therapist.languages.forEach((item) => optionMap.languages.add(item));
    therapist.therapyTypes.forEach((item) => optionMap.therapyTypes.add(item));
    optionMap.availability.add(therapist.availability);
  });

  return Object.fromEntries(
    Object.entries(optionMap).map(([key, values]) => [key, [...values].sort((a, b) => a.localeCompare(b))])
  );
}

function attachEventListeners() {
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

  [elements.priceMin, elements.priceMax, elements.mobilePriceMin, elements.mobilePriceMax].forEach((input) => {
    input.addEventListener("input", handlePriceInput);
  });

  elements.activeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-filter]");
    if (!button) {
      return;
    }

    const { key, value } = button.dataset;
    if (key === "search") {
      state.filters.search = "";
      elements.searchInput.value = "";
    } else if (key === "price") {
      state.filters.priceMin = 0;
      state.filters.priceMax = 300;
      syncRangeInputs();
    } else {
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

  const bookingUrl = new URL("book-consultation.html", window.location.href);
  bookingUrl.searchParams.set("therapist", therapistId);
  window.location.href = bookingUrl.toString();
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

  const urlMin = Number(params.get("priceMin"));
  const urlMax = Number(params.get("priceMax"));
  const urlPage = Number(params.get("page"));

  if (!Number.isNaN(urlMin) && urlMin >= 0) {
    state.filters.priceMin = urlMin;
  }
  if (!Number.isNaN(urlMax) && urlMax > 0) {
    state.filters.priceMax = urlMax;
  }
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

  if (state.filters.priceMin > 0) {
    params.set("priceMin", String(state.filters.priceMin));
  }

  if (state.filters.priceMax < 300) {
    params.set("priceMax", String(state.filters.priceMax));
  }
  if (state.currentPage > 1) {
    params.set("page", String(state.currentPage));
  }

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState({}, "", nextUrl);
}

function render(resetPage = false) {
  state.filteredTherapists = getFilteredTherapists();
  const totalPages = Math.max(1, Math.ceil(state.filteredTherapists.length / PAGE_SIZE));
  if (resetPage) {
    state.currentPage = 1;
  } else {
    state.currentPage = Math.min(state.currentPage, totalPages);
  }
  const paginatedTherapists = paginateTherapists(state.filteredTherapists, state.currentPage);
  updateUrlFromState();
  renderCards(paginatedTherapists);
  renderResultsCount(state.filteredTherapists.length);
  renderActiveFilters();
  renderPagination(totalPages);
  toggleNoResults(state.filteredTherapists.length === 0);
}

function getFilteredTherapists() {
  return state.therapists.filter((therapist) => {
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
      || therapist.languages.some((item) => state.filters.languages.includes(item));
    const matchesTherapyTypes = !state.filters.therapyTypes.length
      || therapist.therapyTypes.some((item) => state.filters.therapyTypes.includes(item));
    const matchesAvailability = !state.filters.availability.length
      || state.filters.availability.includes(therapist.availability);
    const matchesPrice = therapist.price >= state.filters.priceMin && therapist.price <= state.filters.priceMax;

    return [
      matchesSearch,
      matchesState,
      matchesSpecialties,
      matchesLanguages,
      matchesTherapyTypes,
      matchesAvailability,
      matchesPrice
    ].every(Boolean);
  });
}

function renderCards(therapists) {
  const fragment = document.createDocumentFragment();

  therapists.forEach((therapist) => {
    const card = document.createElement("article");
    card.className = "therapist-card";
    card.innerHTML = `
      <div class="card-image-wrap">
        <img class="card-image" src="${therapist.image}" alt="${therapist.name}" loading="lazy">
      </div>
      <div class="card-body">
        <h2 class="card-name">${therapist.name}</h2>
        <p class="card-title">${therapist.title}</p>
        <div class="card-meta">
          <span>${therapist.location}</span>
          <span class="meta-dot" aria-hidden="true"></span>
          <span>${therapist.languages.join(" Â· ")}</span>
        </div>
        <div class="card-tags">
          ${therapist.specialties.slice(0, 3).map((item) => `<span class="chip soft">${item}</span>`).join("")}
        </div>
        <p class="card-summary">${buildTherapistSummary(therapist)}</p>
        <div class="card-price-row">
          <div>
            <span class="price-label">Session Rate</span>
            <span class="price-value">${formatPrice(therapist.price)}</span>
          </div>
          <span class="availability ${therapist.availability.toLowerCase()}">${therapist.availability}</span>
        </div>
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
  return `Specializes in ${specialties}. Offers ${therapyTypes.toLowerCase()} sessions.`;
}

function renderResultsCount(total) {
  const noun = total === 1 ? "therapist" : "therapists";
  elements.resultsCount.textContent = `Showing ${total} ${noun}`;
}

function renderPagination(totalPages) {
  if (state.filteredTherapists.length === 0 || totalPages <= 1) {
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

  if (state.filters.priceMin > 0 || state.filters.priceMax < 300) {
    entries.push({
      key: "price",
      value: `${state.filters.priceMin}-${state.filters.priceMax}`,
      label: `Price: ${formatPrice(state.filters.priceMin)} - ${state.filters.priceMax >= 300 ? "$300+" : formatPrice(state.filters.priceMax)}`
    });
  }

  entries.forEach((entry) => {
    const pill = document.createElement("div");
    pill.className = "filter-pill";
    pill.innerHTML = `
      <span>${entry.label}</span>
      <button type="button" aria-label="Remove ${entry.label}" data-remove-filter data-key="${entry.key}" data-value="${entry.value}">Ã—</button>
    `;
    fragment.appendChild(pill);
  });

  elements.activeFilters.replaceChildren(fragment);
}

function toggleNoResults(hasNoResults) {
  elements.noResults.classList.toggle("hidden", !hasNoResults);
  elements.cardsGrid.classList.toggle("hidden", hasNoResults);
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


