const BOOKED_SLOTS_KEY = "footprints-booked-slots";
const DEFAULT_TIME_BATCH = 6;
const DEFAULT_DATE_BATCH = 8;

const bookingState = {
  therapists: [],
  therapist: null,
  selectedDate: null,
  selectedTime: null,
  availabilityByDate: new Map(),
  orderedDates: [],
  visibleDateStart: 0,
  visibleDateCount: DEFAULT_DATE_BATCH,
  visibleTimeCount: DEFAULT_TIME_BATCH
};

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
    price: 165,
    availability: "Available",
    summary: "Values multiculturalism, cultural awareness, compassion, and empathy. Experienced supporting clients with depression, anxiety, trauma, self-esteem, stress management, and family or marital conflicts."
  }
];

const validationMessages = {
  clientName: "Please enter your full name.",
  clientEmail: "Please enter a valid email address.",
  clientPhone: "Please enter a valid phone number.",
  contactMethod: "Please choose a preferred contact method.",
  clientNotes: "Please share a short note about what support you need.",
  consent: "Please agree before confirming the consultation request."
};

const bookingElements = {
  therapistImage: document.querySelector("#therapist-image"),
  therapistName: document.querySelector("#therapist-name"),
  therapistRole: document.querySelector("#therapist-role"),
  therapistPrice: document.querySelector("#therapist-price"),
  therapistAvailability: document.querySelector("#therapist-availability"),
  summaryDate: document.querySelector("#summary-date"),
  summaryTime: document.querySelector("#summary-time"),
  continueButton: document.querySelector("#continue-button"),
  dateOptions: document.querySelector("#date-options"),
  dateRangeLabel: document.querySelector("#date-range-label"),
  prevDatesButton: document.querySelector("#prev-dates"),
  nextDatesButton: document.querySelector("#next-dates"),
  timeSlots: document.querySelector("#time-slots"),
  slotHelper: document.querySelector("#slot-helper"),
  showMoreTimesButton: document.querySelector("#show-more-times"),
  detailsPanel: document.querySelector("#details-panel"),
  detailsCopy: document.querySelector("#details-copy"),
  bookingForm: document.querySelector("#booking-form"),
  formStatus: document.querySelector("#form-status"),
  confirmationCard: document.querySelector("#confirmation-card"),
  confirmationText: document.querySelector("#confirmation-text")
};

async function initBookingPage() {
  attachEventListeners();

  bookingState.therapists = await loadBookingTherapists();
  bookingState.therapist = resolveTherapistFromQuery();
  bookingState.availabilityByDate = buildAvailabilityMap(bookingState.therapist);
  bookingState.orderedDates = [...bookingState.availabilityByDate.keys()]
    .filter((key) => bookingState.availabilityByDate.get(key).slots.length > 0)
    .sort((left, right) => left.localeCompare(right));

  renderTherapistDetails();
  renderDateOptions();
  renderTimeSlots();
  updateSummary();
}

function attachEventListeners() {
  bookingElements.dateOptions.addEventListener("click", handleDateClick);
  bookingElements.timeSlots.addEventListener("click", handleTimeClick);
  bookingElements.continueButton.addEventListener("click", revealDetailsPanel);
  bookingElements.prevDatesButton.addEventListener("click", showEarlierDates);
  bookingElements.nextDatesButton.addEventListener("click", showLaterDates);
  bookingElements.showMoreTimesButton.addEventListener("click", showMoreTimes);
  bookingElements.bookingForm.addEventListener("submit", handleBookingSubmit);

  bookingElements.bookingForm.querySelectorAll("input, select, textarea").forEach((field) => {
    const eventName = field.type === "checkbox" || field.tagName === "SELECT" ? "change" : "input";
    field.addEventListener(eventName, () => validateField(field));
  });
}

async function loadBookingTherapists() {
  try {
    const response = await fetch("data/therapists.json");
    if (!response.ok) {
      throw new Error("Could not load therapists data.");
    }
    return await response.json();
  } catch (error) {
    console.warn("Using fallback therapist data for booking page.", error);
    return bookingFallbackTherapists;
  }
}

function resolveTherapistFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const therapistId = params.get("therapist");
  return bookingState.therapists.find((therapist) => therapist.id === therapistId) || bookingState.therapists[0];
}

function renderTherapistDetails() {
  const therapist = bookingState.therapist;
  document.title = `Book Consultation with ${therapist.name} | Footprints to Feel Better`;
  bookingElements.therapistImage.src = therapist.image || "data/portraits/portrait.svg";
  bookingElements.therapistImage.alt = therapist.name;
  bookingElements.therapistName.textContent = therapist.name;
  bookingElements.therapistRole.textContent = `${therapist.title} | ${therapist.location} | ${therapist.languages.join(", ")}`;
  bookingElements.therapistPrice.textContent = formatPrice(therapist.price);
  bookingElements.therapistAvailability.textContent = therapist.availability;
}

function buildAvailabilityMap(therapist) {
  const map = new Map();
  const daysToGenerate = getDaysToGenerate(therapist.availability);
  const slotsPerDay = getSlotsForAvailability(therapist.availability);
  const bookedSlots = getBookedSlotsForTherapist(therapist.id);
  const date = new Date();
  const leadDays = therapist.availability === "Waitlist" ? 5 : 1;
  date.setDate(date.getDate() + leadDays);

  let generatedDays = 0;
  while (generatedDays < daysToGenerate) {
    if (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
      continue;
    }

    const key = formatDateKey(date);
    const allSlots = rotateSlots(slotsPerDay, generatedDays);
    const reservedSlots = bookedSlots[key] || [];
    const openSlots = allSlots.filter((slot) => !reservedSlots.includes(slot));

    map.set(key, {
      date: stripTime(date),
      fullLabel: formatReadableDate(date),
      label: formatDateCardLabel(date),
      slots: openSlots,
      totalSlots: allSlots.length
    });

    generatedDays += 1;
    date.setDate(date.getDate() + 1);
  }

  return map;
}

function getSlotsForAvailability(status) {
  const slotLibrary = {
    Available: ["8:30 AM", "9:30 AM", "10:30 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM", "5:30 PM", "6:30 PM"],
    Limited: ["9:30 AM", "11:00 AM", "1:30 PM", "4:30 PM", "6:00 PM"],
    Waitlist: ["10:00 AM", "12:30 PM", "3:00 PM", "5:00 PM"]
  };

  return slotLibrary[status] || slotLibrary.Available;
}

function getDaysToGenerate(status) {
  const dayCounts = {
    Available: 90,
    Limited: 75,
    Waitlist: 60
  };

  return dayCounts[status] || 90;
}

function rotateSlots(slots, offset) {
  if (!slots.length) {
    return [];
  }

  return slots.map((_, index) => slots[(index + offset) % slots.length]);
}

function renderDateOptions() {
  const fragment = document.createDocumentFragment();
  const visibleDates = bookingState.orderedDates.slice(
    bookingState.visibleDateStart,
    bookingState.visibleDateStart + bookingState.visibleDateCount
  );

  visibleDates.forEach((dateKey) => {
    const dayData = bookingState.availabilityByDate.get(dateKey);
    const isSelected = bookingState.selectedDate === dateKey;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.date = dateKey;
    button.className = getDateButtonClasses(isSelected);
    button.innerHTML = getDateButtonContent(dayData, isSelected);
    fragment.appendChild(button);
  });

  bookingElements.dateOptions.replaceChildren(fragment);
  updateDatePager(visibleDates);
}

function renderTimeSlots() {
  const fragment = document.createDocumentFragment();
  const dayData = bookingState.selectedDate ? bookingState.availabilityByDate.get(bookingState.selectedDate) : null;

  if (!dayData) {
    bookingElements.slotHelper.textContent = "Select a date first.";
    bookingElements.showMoreTimesButton.classList.add("hidden");
    bookingElements.timeSlots.innerHTML = `
      <div class="col-span-full rounded-[1.75rem] border border-dashed border-[#e6ced3] bg-[#fffafa] p-8 text-center text-sm text-[#7b6169]">
        Available consultation times will appear here after you choose a date.
      </div>
    `;
    return;
  }

  if (!dayData.slots.length) {
    bookingElements.slotHelper.textContent = "That day is fully booked. Please choose another date.";
    bookingElements.showMoreTimesButton.classList.add("hidden");
    bookingElements.timeSlots.innerHTML = `
      <div class="col-span-full rounded-[1.75rem] border border-dashed border-[#e6ced3] bg-[#fffafa] p-8 text-center text-sm text-[#7b6169]">
        All times for this day have already been reserved.
      </div>
    `;
    return;
  }

  bookingElements.slotHelper.textContent = `${dayData.slots.length} available time slots on ${dayData.fullLabel}.`;

  dayData.slots.slice(0, bookingState.visibleTimeCount).forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.time = slot;
    button.className = getTimeButtonClasses(slot === bookingState.selectedTime);
    button.innerHTML = `
      <span class="font-heading text-lg font-bold">${slot}</span>
      <span class="mt-1 text-sm ${slot === bookingState.selectedTime ? "text-[#6f2143]" : "text-[#6c5960]"}">50-minute video consultation</span>
    `;
    fragment.appendChild(button);
  });

  bookingElements.timeSlots.replaceChildren(fragment);
  bookingElements.showMoreTimesButton.classList.toggle("hidden", dayData.slots.length <= bookingState.visibleTimeCount);
}

function handleDateClick(event) {
  const button = event.target.closest("[data-date]");
  if (!button) {
    return;
  }

  const selectedDate = button.dataset.date;
  const dayData = bookingState.availabilityByDate.get(selectedDate);
  if (!dayData || !dayData.slots.length) {
    return;
  }

  bookingState.selectedDate = selectedDate;
  bookingState.selectedTime = null;
  bookingState.visibleTimeCount = DEFAULT_TIME_BATCH;
  updateSummary();
  renderDateOptions();
  renderTimeSlots();
  setDetailsEnabled(false);
}

function handleTimeClick(event) {
  const button = event.target.closest("[data-time]");
  if (!button) {
    return;
  }

  bookingState.selectedTime = button.dataset.time;
  updateSummary();
  renderTimeSlots();
  setDetailsEnabled(true);
}

function updateSummary() {
  const selectedDay = bookingState.selectedDate ? bookingState.availabilityByDate.get(bookingState.selectedDate) : null;
  bookingElements.summaryDate.textContent = selectedDay ? selectedDay.fullLabel : "Choose a date";
  bookingElements.summaryTime.textContent = bookingState.selectedTime || "Choose a time";
  bookingElements.continueButton.disabled = !(bookingState.selectedDate && bookingState.selectedTime);
}

function revealDetailsPanel() {
  if (!bookingState.selectedDate || !bookingState.selectedTime) {
    return;
  }

  setDetailsEnabled(true);
  bookingElements.detailsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setDetailsEnabled(enabled) {
  bookingElements.detailsPanel.classList.toggle("opacity-60", !enabled);
  bookingElements.detailsCopy.textContent = enabled
    ? `You selected ${bookingElements.summaryDate.textContent} at ${bookingState.selectedTime}. Complete the client details to continue the booking request.`
    : "Select a time first to unlock the rest of the consultation booking flow.";

  bookingElements.bookingForm.querySelectorAll("input, select, textarea, button").forEach((field) => {
    field.disabled = !enabled;
  });

  if (!enabled) {
    clearFormErrors();
  }
}

function handleBookingSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    bookingElements.formStatus.textContent = "Please complete the required fields before confirming the consultation request.";
    bookingElements.formStatus.classList.remove("hidden");
    const firstInvalidField = bookingElements.bookingForm.querySelector("[aria-invalid='true']");
    if (firstInvalidField) {
      firstInvalidField.focus();
    }
    return;
  }

  const dayData = bookingState.availabilityByDate.get(bookingState.selectedDate);
  if (!dayData || !dayData.slots.includes(bookingState.selectedTime)) {
    resolveBookingConflict();
    return;
  }

  saveBookedSlot(bookingState.therapist.id, bookingState.selectedDate, bookingState.selectedTime);
  removeBookedSlotFromState(bookingState.selectedDate, bookingState.selectedTime);

  const formData = new FormData(bookingElements.bookingForm);
  const clientName = String(formData.get("clientName") || "The client").trim();
  bookingElements.confirmationText.textContent = `${clientName} is set for ${bookingElements.summaryDate.textContent} at ${bookingState.selectedTime} with ${bookingState.therapist.name}. That time has now been reserved and will not appear again for other clients.`;
  bookingElements.confirmationCard.classList.remove("hidden");
  bookingElements.confirmationCard.scrollIntoView({ behavior: "smooth", block: "nearest" });

  resetBookingFlow();
}

function validateForm() {
  let isValid = true;

  bookingElements.bookingForm.querySelectorAll("[data-field]").forEach((field) => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  return isValid;
}

function validateField(field) {
  const value = field.type === "checkbox" ? field.checked : field.value.trim();
  let errorMessage = "";

  if (field.type === "checkbox") {
    if (!field.checked) {
      errorMessage = validationMessages[field.name];
    }
  } else if (!value) {
    errorMessage = validationMessages[field.name];
  } else if (field.name === "clientEmail" && !isValidEmail(value)) {
    errorMessage = validationMessages.clientEmail;
  } else if (field.name === "clientPhone" && !isValidPhone(value)) {
    errorMessage = validationMessages.clientPhone;
  }

  const errorElement = document.querySelector(`#${field.name}-error`);
  field.setAttribute("aria-invalid", errorMessage ? "true" : "false");
  field.classList.toggle("border-[#b42318]", Boolean(errorMessage));
  field.classList.toggle("focus:border-[#b42318]", Boolean(errorMessage));
  field.classList.toggle("focus:ring-[#b42318]", Boolean(errorMessage));

  if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.classList.toggle("hidden", !errorMessage);
  }

  if (!errorMessage) {
    bookingElements.formStatus.classList.add("hidden");
  }

  return !errorMessage;
}

function clearFormErrors() {
  bookingElements.formStatus.classList.add("hidden");
  bookingElements.bookingForm.querySelectorAll("[data-field]").forEach((field) => {
    field.setAttribute("aria-invalid", "false");
    field.classList.remove("border-[#b42318]", "focus:border-[#b42318]", "focus:ring-[#b42318]");
    const errorElement = document.querySelector(`#${field.name}-error`);
    if (errorElement) {
      errorElement.textContent = "";
      errorElement.classList.add("hidden");
    }
  });
}

function resolveBookingConflict() {
  const fallback = findNextAvailableSlot(bookingState.selectedDate);

  if (!fallback) {
    bookingElements.formStatus.textContent = "That therapist no longer has open slots in the current schedule. Please choose another therapist or come back later.";
    bookingElements.formStatus.classList.remove("hidden");
    bookingState.selectedDate = null;
    bookingState.selectedTime = null;
    bookingState.visibleTimeCount = DEFAULT_TIME_BATCH;
    updateSummary();
    renderDateOptions();
    renderTimeSlots();
    setDetailsEnabled(false);
    return;
  }

  bookingState.selectedDate = fallback.dateKey;
  bookingState.selectedTime = fallback.time;
  bookingState.visibleDateStart = getVisibleDateStartForDate(fallback.dateKey);
  bookingState.visibleTimeCount = Math.max(DEFAULT_TIME_BATCH, fallback.dayData.slots.indexOf(fallback.time) + 1);
  bookingElements.formStatus.textContent = `That exact time is no longer available. We moved this booking to the next open slot: ${fallback.dayData.fullLabel} at ${fallback.time}.`;
  bookingElements.formStatus.classList.remove("hidden");
  updateSummary();
  renderDateOptions();
  renderTimeSlots();
  setDetailsEnabled(true);
}

function showEarlierDates() {
  bookingState.visibleDateStart = Math.max(0, bookingState.visibleDateStart - bookingState.visibleDateCount);
  renderDateOptions();
}

function showLaterDates() {
  const maxStart = Math.max(0, bookingState.orderedDates.length - bookingState.visibleDateCount);
  bookingState.visibleDateStart = Math.min(maxStart, bookingState.visibleDateStart + bookingState.visibleDateCount);
  renderDateOptions();
}

function showMoreTimes() {
  const selectedDay = bookingState.selectedDate ? bookingState.availabilityByDate.get(bookingState.selectedDate) : null;
  if (!selectedDay) {
    return;
  }

  bookingState.visibleTimeCount = Math.min(selectedDay.slots.length, bookingState.visibleTimeCount + DEFAULT_TIME_BATCH);
  renderTimeSlots();
}

function updateDatePager(visibleDates) {
  const firstDate = visibleDates[0] ? bookingState.availabilityByDate.get(visibleDates[0]).fullLabel : "";
  const lastDate = visibleDates[visibleDates.length - 1]
    ? bookingState.availabilityByDate.get(visibleDates[visibleDates.length - 1]).fullLabel
    : "";

  bookingElements.dateRangeLabel.textContent = visibleDates.length
    ? `Showing ${firstDate} to ${lastDate}.`
    : "No dates available right now.";
  bookingElements.prevDatesButton.disabled = bookingState.visibleDateStart === 0;
  bookingElements.nextDatesButton.disabled =
    bookingState.visibleDateStart + bookingState.visibleDateCount >= bookingState.orderedDates.length;
}

function getDateButtonClasses(isSelected) {
  return [
    "rounded-[1.75rem] border p-5 text-left transition",
    isSelected
      ? "border-rosewood bg-rosewood text-white shadow-glow"
      : "border-[#edd9dd] bg-[#fffafa] hover:-translate-y-0.5 hover:border-rosewood/40 hover:bg-white"
  ].join(" ");
}

function getDateButtonContent(dayData, isSelected) {
  return `
    <span class="text-xs font-semibold uppercase tracking-[0.16em] ${isSelected ? "text-white/80" : "text-clay"}">${dayData.label.dayName}</span>
    <span class="mt-2 font-heading text-2xl font-extrabold ${isSelected ? "text-white" : "text-ink"}">${dayData.label.dayNumber}</span>
    <span class="mt-1 text-sm ${isSelected ? "text-white/80" : "text-[#6c5960]"}">${dayData.label.monthName}</span>
    <span class="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? "bg-white/15 text-white" : "bg-[#fff0f4] text-rosewood"}">${dayData.slots.length} open</span>
  `;
}

function getTimeButtonClasses(isSelected) {
  return [
    "rounded-[1.5rem] border p-4 text-left transition",
    isSelected
      ? "border-rosewood bg-[#fff0f4] ring-2 ring-rosewood/20"
      : "border-[#edd9dd] bg-[#fffafa] hover:-translate-y-0.5 hover:border-rosewood/40 hover:bg-white"
  ].join(" ");
}

function getBookedSlots() {
  try {
    const raw = window.localStorage.getItem(BOOKED_SLOTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.warn("Unable to read booked slots from storage.", error);
    return {};
  }
}

function getBookedSlotsForTherapist(therapistId) {
  const storage = getBookedSlots();
  return storage[therapistId] || {};
}

function saveBookedSlot(therapistId, dateKey, time) {
  const storage = getBookedSlots();
  const therapistSlots = storage[therapistId] || {};
  const daySlots = therapistSlots[dateKey] || [];

  if (!daySlots.includes(time)) {
    daySlots.push(time);
  }

  therapistSlots[dateKey] = daySlots;
  storage[therapistId] = therapistSlots;
  window.localStorage.setItem(BOOKED_SLOTS_KEY, JSON.stringify(storage));
}

function removeBookedSlotFromState(dateKey, time) {
  const dayData = bookingState.availabilityByDate.get(dateKey);
  if (!dayData) {
    return;
  }

  dayData.slots = dayData.slots.filter((slot) => slot !== time);
  if (!dayData.slots.length) {
    bookingState.orderedDates = bookingState.orderedDates.filter((key) => key !== dateKey);
  }
}

function resetBookingFlow() {
  bookingElements.bookingForm.reset();
  clearFormErrors();
  bookingState.selectedDate = null;
  bookingState.selectedTime = null;
  bookingState.visibleTimeCount = DEFAULT_TIME_BATCH;
  bookingState.visibleDateStart = 0;
  updateSummary();
  renderDateOptions();
  renderTimeSlots();
  setDetailsEnabled(false);
}

function findNextAvailableSlot(startDateKey) {
  const orderedEntries = [...bookingState.availabilityByDate.entries()]
    .filter(([, dayData]) => dayData.slots.length > 0)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  if (!orderedEntries.length) {
    return null;
  }

  const startIndex = orderedEntries.findIndex(([dateKey]) => dateKey >= startDateKey);
  const normalizedStart = startIndex === -1 ? 0 : startIndex;

  for (let index = normalizedStart; index < orderedEntries.length; index += 1) {
    const [dateKey, dayData] = orderedEntries[index];
    if (dayData.slots.length) {
      return {
        dateKey,
        time: dayData.slots[0],
        dayData
      };
    }
  }

  for (let index = 0; index < normalizedStart; index += 1) {
    const [dateKey, dayData] = orderedEntries[index];
    if (dayData.slots.length) {
      return {
        dateKey,
        time: dayData.slots[0],
        dayData
      };
    }
  }

  return null;
}

function getVisibleDateStartForDate(dateKey) {
  const index = bookingState.orderedDates.indexOf(dateKey);
  if (index === -1) {
    return 0;
  }

  return Math.floor(index / bookingState.visibleDateCount) * bookingState.visibleDateCount;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateCardLabel(date) {
  return {
    dayName: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
    dayNumber: new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(date),
    monthName: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)
  };
}

function formatReadableDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatPrice(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

initBookingPage();
