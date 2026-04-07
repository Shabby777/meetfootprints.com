const profileFallbackTherapists = [
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
  }
];

const profileElements = {
  profileName: document.querySelector("#profile-name"),
  profileRole: document.querySelector("#profile-role"),
  profileSummary: document.querySelector("#profile-summary"),
  heroChips: document.querySelector("#hero-chips"),
  heroLocation: document.querySelector("#hero-location"),
  heroPrice: document.querySelector("#hero-price"),
  heroAvailability: document.querySelector("#hero-availability"),
  profileImage: document.querySelector("#profile-image"),
  sidebarName: document.querySelector("#sidebar-name"),
  sidebarRole: document.querySelector("#sidebar-role"),
  languagesList: document.querySelector("#languages-list"),
  therapyTypesList: document.querySelector("#therapy-types-list"),
  aboutCopy: document.querySelector("#about-copy"),
  specialtiesGrid: document.querySelector("#specialties-grid"),
  expectationOne: document.querySelector("#expectation-one"),
  expectationTwo: document.querySelector("#expectation-two"),
  expectationThree: document.querySelector("#expectation-three"),
  highlightApproach: document.querySelector("#highlight-approach"),
  highlightFit: document.querySelector("#highlight-fit"),
  headerBookLink: document.querySelector("#header-book-link"),
  sidebarBookLink: document.querySelector("#sidebar-book-link"),
  footerBookLink: document.querySelector("#footer-book-link"),
  notFoundState: document.querySelector("#not-found-state")
};

async function initTherapistProfile() {
  const therapists = await loadTherapists();
  const therapist = resolveTherapistFromQuery(therapists);

  if (!therapist) {
    showNotFoundState();
    return;
  }

  renderTherapistProfile(therapist);
}

async function loadTherapists() {
  try {
    const response = await fetch("data/therapists.json");
    if (!response.ok) {
      throw new Error("Could not load therapists data.");
    }
    return await response.json();
  } catch (error) {
    console.warn("Using fallback therapist data for profile page.", error);
    return profileFallbackTherapists;
  }
}

function resolveTherapistFromQuery(therapists) {
  const params = new URLSearchParams(window.location.search);
  const therapistId = params.get("therapist");
  return therapists.find((therapist) => therapist.id === therapistId) || null;
}

function renderTherapistProfile(therapist) {
  document.title = `${therapist.name} | Footprints to Feel Better`;

  profileElements.profileName.textContent = therapist.name;
  profileElements.profileRole.textContent = `${therapist.title} | ${therapist.location}`;
  profileElements.profileSummary.textContent = therapist.summary;
  profileElements.heroLocation.textContent = therapist.location;
  profileElements.heroPrice.textContent = formatPrice(therapist.price);
  profileElements.heroAvailability.textContent = therapist.availability;

  profileElements.profileImage.src = therapist.image || "data/portraits/portrait.svg";
  profileElements.profileImage.alt = therapist.name;
  profileElements.sidebarName.textContent = therapist.name;
  profileElements.sidebarRole.textContent = `${therapist.title} | ${therapist.languages.join(", ")}`;

  renderChipGroup(profileElements.heroChips, therapist.specialties.slice(0, 4), "hero");
  renderChipGroup(profileElements.languagesList, therapist.languages, "soft");
  renderChipGroup(profileElements.therapyTypesList, therapist.therapyTypes, "soft");
  renderAboutCopy(therapist);
  renderSpecialties(therapist.specialties);
  renderExpectations(therapist);
  renderHighlights(therapist);
  updateBookLinks(therapist.id);
}

function renderChipGroup(container, items, tone) {
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = tone === "hero"
      ? "inline-flex rounded-full bg-[#fff0f4] px-4 py-2 text-sm font-semibold text-rosewood"
      : "inline-flex rounded-full bg-[#fff0f4] px-4 py-2 text-sm font-semibold text-rosewood";
    chip.textContent = item;
    fragment.appendChild(chip);
  });

  container.replaceChildren(fragment);
}

function renderAboutCopy(therapist) {
  const paragraphs = buildProfileParagraphs(therapist);
  const fragment = document.createDocumentFragment();

  paragraphs.forEach((paragraph) => {
    const node = document.createElement("p");
    node.textContent = paragraph;
    fragment.appendChild(node);
  });

  profileElements.aboutCopy.replaceChildren(fragment);
}

function renderSpecialties(specialties) {
  const fragment = document.createDocumentFragment();

  specialties.forEach((specialty, index) => {
    const card = document.createElement("article");
    card.className = "rounded-[1.5rem] border border-[#f0d8dd] bg-sand p-5";
    card.innerHTML = `
      <p class="text-xs font-bold uppercase tracking-[0.2em] text-clay">Specialty ${String(index + 1).padStart(2, "0")}</p>
      <h3 class="mt-3 font-heading text-2xl font-bold text-ink">${specialty}</h3>
      <p class="mt-3 text-sm leading-7 text-[#5b4850]">${buildSpecialtyDescription(specialty)}</p>
    `;
    fragment.appendChild(card);
  });

  profileElements.specialtiesGrid.replaceChildren(fragment);
}

function renderExpectations(therapist) {
  const firstName = therapist.name.split(" ")[0];
  profileElements.expectationOne.textContent = `${firstName} begins with a calm, supportive conversation so the client feels heard.`;
  profileElements.expectationTwo.textContent = `Support may draw from ${therapist.therapyTypes.slice(0, 2).join(" and ").toLowerCase()} approaches based on what feels most helpful.`;
  profileElements.expectationThree.textContent = `Work may focus on ${therapist.specialties.slice(0, 3).join(", ").toLowerCase()} with next steps shaped around steady progress.`;
}

function renderHighlights(therapist) {
  profileElements.highlightApproach.textContent = `${therapist.name.split(" ")[0]} brings a supportive style centered on empathy, trust, and practical care.`;
  profileElements.highlightFit.textContent = `This therapist may be a good fit for clients looking for support with ${therapist.specialties.slice(0, 2).join(" and ").toLowerCase()}.`;
}

function updateBookLinks(therapistId) {
  const bookingUrl = `book-consultation.html?therapist=${encodeURIComponent(therapistId)}`;
  profileElements.headerBookLink.href = bookingUrl;
  profileElements.sidebarBookLink.href = bookingUrl;
  profileElements.footerBookLink.href = bookingUrl;
}

function showNotFoundState() {
  document.title = "Therapist Profile Not Found | Footprints to Feel Better";
  profileElements.notFoundState.classList.remove("hidden");
  document.querySelectorAll("main > section").forEach((section) => {
    section.classList.add("hidden");
  });
}

function buildProfileParagraphs(therapist) {
  const firstName = therapist.name.split(" ")[0];
  return [
    therapist.summary,
    `${firstName} works with clients in ${therapist.location} and offers support in ${therapist.languages.join(", ")}.`,
    `Sessions may include support around ${therapist.specialties.slice(0, 3).join(", ").toLowerCase()} using ${therapist.therapyTypes.join(" and ").toLowerCase()} care options.`
  ];
}

function buildSpecialtyDescription(specialty) {
  return `Support may focus on ${specialty.toLowerCase()} with a calm, practical approach tailored to the client's needs.`;
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

initTherapistProfile();
