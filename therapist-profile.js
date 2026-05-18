const profileFallbackTherapists = [
  {
    id: "siham-abdelqader",
    email: "siham@example.com",
    name: "Siham Abdelqader",
    image: "https://img1.wsimg.com/isteam/ip/be3b4275-20eb-4372-92a9-bcc3a138027c/Siham%20Pic%202.jpg/:/cr=t:9.58%25,l:0%25,w:100%25,h:50.13%25/rs=w:388,h:291.72932330827064,cg:true",
    title: "MHC-LP",
    location: "NY",
    specialties: ["Depression", "Anxiety", "Trauma"],
    languages: ["English", "Arabic"],
    therapyTypes: ["Individual", "Family"],
    availability: "Available",
    summary: "Values multiculturalism, cultural awareness, compassion, and empathy. Experienced supporting clients with depression, anxiety, trauma, self-esteem, stress management, and family or marital conflicts."
  }
];

const STANDARD_SESSION_RATE = 150;

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
  notFoundState: document.querySelector("#not-found-state"),
  editLink: document.querySelector("#profile-edit-link")
};

async function initTherapistProfile() {
  const therapistId = new URLSearchParams(window.location.search).get("therapist");
  const therapist = await window.therapistDataApi.loadTherapistById(therapistId, {
    fallbackUrl: "data/therapists.json",
    fallbackData: profileFallbackTherapists
  });

  if (!therapist) {
    showNotFoundState();
    return;
  }

  renderTherapistProfile(therapist);
  await renderEditAccess(therapist);
}

async function renderEditAccess(therapist) {
  if (!profileElements.editLink) {
    return;
  }

  const { access } = await window.therapistDataApi.getCurrentUserAccess();
  const canEdit = access && (
    access.role === "admin"
    || (access.role === "therapist" && access.therapist_id === therapist.id)
  );

  if (!canEdit) {
    return;
  }

  const editUrl = new URL("therapist-portal.html", window.location.href);
  editUrl.searchParams.set("therapist", therapist.id);
  profileElements.editLink.href = editUrl.toString();
  profileElements.editLink.classList.remove("hidden");
}

function renderTherapistProfile(therapist) {
  document.title = `${therapist.name} | Footprints to Feel Better`;

  profileElements.profileName.textContent = therapist.name;
  profileElements.profileRole.textContent = `${therapist.title} | ${therapist.location}`;
  profileElements.profileSummary.textContent = therapist.summary;
  profileElements.heroLocation.textContent = therapist.location;
  profileElements.heroPrice.textContent = formatPrice(STANDARD_SESSION_RATE);
  profileElements.heroAvailability.textContent = therapist.availability;

  profileElements.profileImage.src = therapist.image || "data/portraits/portrait.svg";
  profileElements.profileImage.alt = therapist.name;
  profileElements.sidebarName.textContent = therapist.name;
  profileElements.sidebarRole.textContent = buildSidebarRole(therapist);

  renderChipGroup(profileElements.heroChips, therapist.specialties.slice(0, 4));
  renderChipGroup(profileElements.languagesList, therapist.languages, "Languages coming soon");
  renderChipGroup(profileElements.therapyTypesList, therapist.therapyTypes, "Formats coming soon");
  renderAboutCopy(therapist);
  renderSpecialties(therapist.specialties);
  renderExpectations(therapist);
  renderHighlights(therapist);
}

function buildRoleLine(therapist) {
  return [therapist.title, therapist.location].filter(Boolean).join(" | ") || "Footprints Therapist";
}

function buildSidebarRole(therapist) {
  const languageText = therapist.languages.length ? therapist.languages.join(", ") : "Language details coming soon";
  return [therapist.title, languageText].filter(Boolean).join(" | ");
}

function renderChipGroup(container, items, fallbackText) {
  const fragment = document.createDocumentFragment();

  if (!items.length && fallbackText) {
    const text = document.createElement("p");
    text.className = "text-sm text-[#7b6169]";
    text.textContent = fallbackText;
    fragment.appendChild(text);
    container.replaceChildren(fragment);
    return;
  }

  items.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "inline-flex rounded-full bg-[#fff0f4] px-4 py-2 text-sm font-semibold text-rosewood";
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
  const items = specialties.length ? specialties : ["Supportive Care"];

  items.forEach((specialty, index) => {
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
  const firstName = therapist.name.split(" ")[0] || "This therapist";
  const therapyTypes = therapist.therapyTypes.slice(0, 2).join(" and ").toLowerCase() || "supportive";
  const specialties = therapist.specialties.slice(0, 3).join(", ").toLowerCase() || "each client's goals";

  profileElements.expectationOne.textContent = `${firstName} begins with a calm, supportive conversation so the client feels heard.`;
  profileElements.expectationTwo.textContent = `Support may draw from ${therapyTypes} approaches based on what feels most helpful.`;
  profileElements.expectationThree.textContent = `Work may focus on ${specialties} with next steps shaped around steady progress.`;
}

function renderHighlights(therapist) {
  const specialtySummary = therapist.specialties.slice(0, 2).join(" and ").toLowerCase() || "a range of emotional needs";
  const firstName = therapist.name.split(" ")[0] || "This therapist";
  profileElements.highlightApproach.textContent = `${firstName} brings a supportive style centered on empathy, trust, and practical care.`;
  profileElements.highlightFit.textContent = `This therapist may be a good fit for clients looking for support with ${specialtySummary}.`;
}

function showNotFoundState() {
  document.title = "Therapist Profile Not Found | Footprints to Feel Better";
  profileElements.notFoundState.classList.remove("hidden");
  document.querySelectorAll("main > section").forEach((section) => {
    section.classList.add("hidden");
  });
}

function buildProfileParagraphs(therapist) {
  const firstName = therapist.name.split(" ")[0] || "This therapist";
  const paragraphs = [];

  if (therapist.summary) {
    paragraphs.push(therapist.summary);
  }

  if (therapist.location || therapist.languages.length) {
    const locationText = therapist.location ? `works with clients in ${therapist.location}` : "supports clients across multiple locations";
    const languageText = therapist.languages.length ? ` and offers support in ${therapist.languages.join(", ")}` : "";
    paragraphs.push(`${firstName} ${locationText}${languageText}.`);
  }

  if (therapist.specialties.length || therapist.therapyTypes.length) {
    const specialtiesText = therapist.specialties.length ? therapist.specialties.slice(0, 3).join(", ").toLowerCase() : "client-specific concerns";
    const typesText = therapist.therapyTypes.length ? therapist.therapyTypes.join(" and ").toLowerCase() : "supportive care";
    paragraphs.push(`Sessions may include support around ${specialtiesText} using ${typesText} care options.`);
  }

  return paragraphs.length ? paragraphs : ["Profile details are being updated."];
}

function buildSpecialtyDescription(specialty) {
  return `Support may focus on ${specialty.toLowerCase()} with a calm, practical approach tailored to the client's needs.`;
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

initTherapistProfile();





