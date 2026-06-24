const COACHES_DATA_URL = "data/coaches.json";

const COACH_BOOKING_STATE = {
  coaches: [],
  coach: null
};

const coachBookingElements = {
  avatar: document.querySelector("#coach-avatar"),
  name: document.querySelector("#coach-name"),
  role: document.querySelector("#coach-role"),
  experience: document.querySelector("#coach-experience"),
  availability: document.querySelector("#coach-availability"),
  calEmbedFrame: document.querySelector("#cal-embed-frame"),
  calEmbedFallback: document.querySelector("#cal-embed-fallback"),
  calDirectLink: document.querySelector("#cal-direct-link"),
  calDirectLinkWrap: document.querySelector("#cal-direct-link-wrap")
};

const CAL_BASE_URL = "https://cal.com/footprintstofeelbetter";

async function initCoachBookingPage() {
  COACH_BOOKING_STATE.coaches = await loadCoaches();
  COACH_BOOKING_STATE.coach = resolveCoachFromQuery();

  if (!COACH_BOOKING_STATE.coach) {
    renderMissingCoach();
    return;
  }

  renderCoachDetails();
  renderCalEmbed();
}

async function loadCoaches() {
  const response = await fetch(COACHES_DATA_URL);
  if (!response.ok) {
    throw new Error("Unable to load coaches data.");
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeCoach).filter((coach) => coach.id && coach.name) : [];
}

function normalizeCoach(coach) {
  return {
    id: String(coach && coach.id ? coach.id : "").trim(),
    name: String(coach && coach.name ? coach.name : "").trim(),
    title: String(coach && coach.title ? coach.title : "").trim(),
    image: String(coach && coach.image ? coach.image : "").trim(),
    location: String(coach && coach.location ? coach.location : "").trim(),
    experience: String(coach && coach.experience ? coach.experience : "").trim(),
    languages: Array.isArray(coach && coach.languages) ? coach.languages.map((item) => String(item || "").trim()).filter(Boolean) : [],
    availability: String(coach && coach.availability ? coach.availability : "").trim(),
    summary: String(coach && coach.summary ? coach.summary : "").trim(),
    bookingUrl: String(coach && coach.bookingUrl ? coach.bookingUrl : "").trim(),
    calLink: String(coach && coach.calLink ? coach.calLink : "").trim()
  };
}

function getCoachImage(coach) {
  return String(coach && coach.image ? coach.image : "").trim();
}

function getCoachInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function resolveCoachFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const coachId = params.get("coach") || params.get("therapist");
  if (!coachId) {
    return COACH_BOOKING_STATE.coaches[0] || null;
  }

  return COACH_BOOKING_STATE.coaches.find((coach) => coach.id === coachId) || null;
}

function renderCoachAvatar() {
  const coach = COACH_BOOKING_STATE.coach;
  if (!coachBookingElements.avatar || !coach) {
    return;
  }

  const initials = getCoachInitials(coach.name) || "C";
  const imageSrc = getCoachImage(coach);

  coachBookingElements.avatar.replaceChildren();
  coachBookingElements.avatar.classList.add("overflow-hidden");

  if (imageSrc) {
    const image = document.createElement("img");
    image.src = imageSrc;
    image.alt = coach.name ? `${coach.name} portrait` : "Coach portrait";
    image.loading = "lazy";
    image.decoding = "async";
    image.className = "h-full w-full object-cover";
    image.addEventListener("error", () => {
      image.remove();
      const fallback = document.createElement("span");
      fallback.className = "flex h-full w-full items-center justify-center bg-gradient-to-br from-burgundy to-accent text-2xl font-extrabold text-white";
      fallback.textContent = initials;
      coachBookingElements.avatar.appendChild(fallback);
    }, { once: true });
    coachBookingElements.avatar.appendChild(image);
    return;
  }

  const fallback = document.createElement("span");
  fallback.className = "flex h-full w-full items-center justify-center bg-gradient-to-br from-burgundy to-accent text-2xl font-extrabold text-white";
  fallback.textContent = initials;
  coachBookingElements.avatar.appendChild(fallback);
}

function renderCoachDetails() {
  const coach = COACH_BOOKING_STATE.coach;
  document.title = `Book Consultation with ${coach.name} | Footprints to Feel Better`;

  renderCoachAvatar();

  if (coachBookingElements.name) {
    coachBookingElements.name.textContent = coach.name;
  }

  if (coachBookingElements.role) {
    coachBookingElements.role.textContent = `${coach.title || "Coach"} | ${coach.location || "Location TBD"} | ${coach.languages.join(", ") || "Language details coming soon"}`;
  }

  if (coachBookingElements.experience) {
    coachBookingElements.experience.textContent = coach.experience || "Contact for details";
  }

  if (coachBookingElements.availability) {
    coachBookingElements.availability.textContent = coach.availability || "Available";
  }
}

function resolveCoachCalLink(coach) {
  if (!coach || !coach.id) {
    return "";
  }

  if (coach.bookingUrl) {
    return coach.bookingUrl;
  }

  if (coach.calLink) {
    return coach.calLink;
  }

  return `${CAL_BASE_URL}/${coach.id}`;
}

function renderCalEmbed() {
  const coach = COACH_BOOKING_STATE.coach;
  const calLink = resolveCoachCalLink(coach);
  const frame = coachBookingElements.calEmbedFrame;
  const fallback = coachBookingElements.calEmbedFallback;
  const directWrap = coachBookingElements.calDirectLinkWrap;
  const directLink = coachBookingElements.calDirectLink;

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

function toCalEmbedUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("embed")) {
      url.searchParams.set("embed", "1");
    }
    return url.toString();
  } catch (error) {
    console.warn("Invalid Cal.com URL for coach:", rawUrl, error);
    return rawUrl;
  }
}

function renderMissingCoach() {
  if (coachBookingElements.name) {
    coachBookingElements.name.textContent = "Coach unavailable";
  }
  if (coachBookingElements.role) {
    coachBookingElements.role.textContent = "Please go back and choose another coach.";
  }
  if (coachBookingElements.experience) {
    coachBookingElements.experience.textContent = "Unavailable";
  }
  if (coachBookingElements.availability) {
    coachBookingElements.availability.textContent = "Unavailable";
  }
  if (coachBookingElements.calEmbedFrame) {
    coachBookingElements.calEmbedFrame.classList.add("hidden");
  }
  if (coachBookingElements.calEmbedFallback) {
    coachBookingElements.calEmbedFallback.classList.remove("hidden");
    coachBookingElements.calEmbedFallback.querySelector("p").textContent =
      "We could not find that coach. Please return to Coaches and try again.";
  }
  if (coachBookingElements.calDirectLinkWrap) {
    coachBookingElements.calDirectLinkWrap.classList.add("hidden");
  }
}

initCoachBookingPage();
