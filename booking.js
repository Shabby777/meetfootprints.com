const STANDARD_SESSION_RATE = 150;

const CAL_BASE_URL = "https://cal.com/footprintstofeelbetter";
const calLinkByTherapistId = {
  "sheila-1099-arias": `${CAL_BASE_URL}/sheila-arias-1099`,
  "shariva-reed-atkinson": `${CAL_BASE_URL}/shariva-atkinson-reed`,
  "ranique-1099-bell": `${CAL_BASE_URL}/ranique-bell-1099`,
  "faith-1099-cohen": `${CAL_BASE_URL}/faith-cohen-1099`,
  "elsa-lmsw-guerrero": `${CAL_BASE_URL}/elsa-guerrero-lmsw`,
  "ayla-aniela-in-paychex-gustin": `${CAL_BASE_URL}/ayla-gustin-aniela-in-paychex`,
  "lezlee-1099-henry-dupoux": `${CAL_BASE_URL}/lezlee-henry-dupoux-1099`,
  "norma-1099-melendez": `${CAL_BASE_URL}/norma-melendez-1099`,
  "sara-1099-montoya": `${CAL_BASE_URL}/sara-montoya-1099`,
  "andy-emily-ortiz": `${CAL_BASE_URL}/andy-ortiz-emily`,
  "jacqueline-1099-rolon": `${CAL_BASE_URL}/jacqueline-rolon-1099`,
  "fatima-1099-santana": `${CAL_BASE_URL}/fatima-santana-1099`,
  "betsy-paulino-vega": `${CAL_BASE_URL}/betsy-vega-paulino`,
  "kartum-massaquoi": `${CAL_BASE_URL}/kartumu-massaquoi`
};
const therapistsWithoutCalLinks = new Set([
  "michelle-fuentes"
]);

const bookingFallbackTherapists = [
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
    summary: "Values multiculturalism, cultural awareness, compassion, and empathy.",
    calLink: ""
  }
];

const bookingState = {
  therapists: [],
  therapist: null
};

const bookingElements = {
  therapistImage: document.querySelector("#therapist-image"),
  therapistName: document.querySelector("#therapist-name"),
  therapistRole: document.querySelector("#therapist-role"),
  therapistPrice: document.querySelector("#therapist-price"),
  therapistAvailability: document.querySelector("#therapist-availability"),
  calEmbedFrame: document.querySelector("#cal-embed-frame"),
  calEmbedFallback: document.querySelector("#cal-embed-fallback"),
  calDirectLink: document.querySelector("#cal-direct-link"),
  calDirectLinkWrap: document.querySelector("#cal-direct-link-wrap")
};

async function initBookingPage() {
  bookingState.therapists = await loadBookingTherapists();
  bookingState.therapist = resolveTherapistFromQuery();

  if (!bookingState.therapist) {
    renderMissingTherapist();
    return;
  }

  renderTherapistDetails();
  renderCalEmbed();
}

async function loadBookingTherapists() {
  return window.therapistDataApi.loadTherapists({
    fallbackUrl: "data/therapists.json",
    fallbackData: bookingFallbackTherapists
  });
}

function resolveTherapistFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const therapistId = params.get("therapist");
  if (!therapistId) {
    return bookingState.therapists[0] || null;
  }

  return window.therapistDataApi.findTherapistByIdentifier(bookingState.therapists, therapistId);
}

function renderTherapistDetails() {
  const therapist = bookingState.therapist;
  document.title = `Book Consultation with ${therapist.name} | Footprints to Feel Better`;
  bookingElements.therapistImage.src = therapist.image || "data/portraits/portrait.svg";
  bookingElements.therapistImage.alt = therapist.name;
  bookingElements.therapistName.textContent = therapist.name;
  bookingElements.therapistRole.textContent = `${therapist.title || "Footprints Therapist"} | ${therapist.location || "Location TBD"} | ${therapist.languages.join(", ") || "Language details coming soon"}`;
  bookingElements.therapistPrice.textContent = formatPrice(STANDARD_SESSION_RATE);
  bookingElements.therapistAvailability.textContent = therapist.availability || "Available";
}

function renderCalEmbed() {
  const therapist = bookingState.therapist;
  const calLink = resolveTherapistCalLink(therapist);
  const frame = bookingElements.calEmbedFrame;
  const fallback = bookingElements.calEmbedFallback;
  const directWrap = bookingElements.calDirectLinkWrap;
  const directLink = bookingElements.calDirectLink;

  if (!calLink) {
    if (frame) {
      frame.classList.add("hidden");
      frame.removeAttribute("src");
    }
    if (fallback) {
      fallback.classList.remove("hidden");
    }
    if (directWrap) {
      directWrap.classList.add("hidden");
    }
    return;
  }

  const embedUrl = toCalEmbedUrl(calLink);
  if (frame) {
    frame.src = embedUrl;
    frame.classList.remove("hidden");
  }
  if (directLink) {
    directLink.href = calLink;
  }
  if (directWrap) {
    directWrap.classList.remove("hidden");
  }
  if (fallback) {
    fallback.classList.add("hidden");
  }
}

function resolveTherapistCalLink(therapist) {
  if (!therapist) {
    return "";
  }

  const therapistSlug = window.therapistDataApi.slugify(therapist.name) || "";
  const mappedLink = calLinkByTherapistId[therapist.id] || calLinkByTherapistId[therapistSlug];
  if (mappedLink) {
    return mappedLink;
  }

  if (therapist.calLink) {
    return therapist.calLink;
  }

  if (therapistsWithoutCalLinks.has(therapist.id) || therapistsWithoutCalLinks.has(therapistSlug)) {
    return "";
  }

  return therapistSlug ? `${CAL_BASE_URL}/${therapistSlug}` : "";
}

function toCalEmbedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("embed")) {
      url.searchParams.set("embed", "1");
    }
    return url.toString();
  } catch (error) {
    console.warn("Invalid Cal.com URL for therapist:", rawUrl, error);
    return rawUrl;
  }
}

function renderMissingTherapist() {
  bookingElements.therapistName.textContent = "Therapist unavailable";
  bookingElements.therapistRole.textContent = "Please go back and choose another therapist.";
  bookingElements.therapistPrice.textContent = "Contact for rate";
  bookingElements.therapistAvailability.textContent = "Unavailable";
  bookingElements.calEmbedFrame.classList.add("hidden");
  bookingElements.calEmbedFallback.classList.remove("hidden");
  bookingElements.calDirectLinkWrap.classList.add("hidden");
  bookingElements.calEmbedFallback.querySelector("p").textContent =
    "We could not find that therapist. Please return to Clinical Staff and try again.";
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

initBookingPage();
