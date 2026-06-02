const portalElements = {
  hero: document.querySelector("#portal-hero"),
  refreshButton: document.querySelector("#portal-refresh"),
  signoutButton: document.querySelector("#portal-signout"),
  loginForm: document.querySelector("#portal-login-form"),
  portalEmail: document.querySelector("#portal-email"),
  portalPassword: document.querySelector("#portal-password"),
  authCopy: document.querySelector("#portal-auth-copy"),
  authStatusBadge: document.querySelector("#auth-status-badge"),
  accountCard: document.querySelector("#portal-account-card"),
  accountEmail: document.querySelector("#portal-account-email"),
  accountRole: document.querySelector("#portal-account-role"),
  accountTherapist: document.querySelector("#portal-account-therapist"),
  authGrid: document.querySelector(".portal-grid-auth"),
  editorSection: document.querySelector("#portal-editor-section"),
  editorCard: document.querySelector("#portal-editor-card"),
  editorForm: document.querySelector("#therapist-editor-form"),
  editorHeading: document.querySelector("#editor-heading"),
  editorModeBadge: document.querySelector("#editor-mode-badge"),
  editorStatus: document.querySelector("#editor-status"),
  createNewTherapist: document.querySelector("#create-new-therapist"),
  deleteTherapist: document.querySelector("#delete-therapist"),
  adminPanel: document.querySelector("#admin-panel"),
  adminAddTherapist: document.querySelector("#admin-add-therapist"),
  adminTherapistSearch: document.querySelector("#admin-therapist-search"),
  adminTherapistList: document.querySelector("#admin-therapist-list"),
  imageUpload: document.querySelector("#therapist-image-upload"),
  deleteProfileImage: document.querySelector("#delete-profile-image"),
  fields: {
    id: document.querySelector("#therapist-id"),
    name: document.querySelector("#therapist-name"),
    email: document.querySelector("#therapist-login-email"),
    password: document.querySelector("#therapist-password"),
    title: document.querySelector("#therapist-title"),
    location: document.querySelector("#therapist-location"),
    image: document.querySelector("#therapist-image"),
    price: document.querySelector("#therapist-price"),
    availability: document.querySelector("#therapist-availability"),
    summary: document.querySelector("#therapist-summary"),
    specialties: document.querySelector("#therapist-specialties"),
    languages: document.querySelector("#therapist-languages"),
    therapyTypes: document.querySelector("#therapist-therapy-types")
  }
};

const portalState = {
  session: null,
  access: null,
  therapists: [],
  selectedTherapistId: null,
  adminSearchTerm: "",
  isLoadingPortalData: false,
  isSavingProfile: false,
  isOptimizingImage: false,
  imageSelectionRunId: 0
};

function portalIsAdmin() {
  return portalState.access && portalState.access.role === "admin";
}

function portalCanEdit() {
  return Boolean(portalState.access && (portalState.access.role === "admin" || portalState.access.role === "therapist"));
}

function setEditorDisabled(isDisabled) {
  if (!portalElements.editorForm) {
    return;
  }

  Array.from(portalElements.editorForm.elements).forEach((field) => {
    if (!(field instanceof HTMLElement) || field.type === "hidden") {
      return;
    }

    field.disabled = isDisabled;
  });
}

async function initTherapistPortal() {
  attachPortalEventListeners();
  initPasswordToggles(document);
  await refreshPortalState();
}

function attachPortalEventListeners() {
  portalElements.loginForm.addEventListener("submit", handlePortalLogin);
  portalElements.signoutButton.addEventListener("click", handlePortalSignout);
  portalElements.refreshButton.addEventListener("click", handlePortalRefresh);
  portalElements.editorForm.addEventListener("submit", handleProfileSave);
  portalElements.createNewTherapist.addEventListener("click", showBlankTherapistForm);
  portalElements.deleteTherapist.addEventListener("click", handleProfileDelete);
  portalElements.adminAddTherapist.addEventListener("click", () => {
    showBlankTherapistForm();
    portalElements.editorForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  portalElements.adminTherapistSearch.addEventListener("input", handleAdminSearchInput);
  portalElements.adminTherapistList.addEventListener("click", handleAdminListClick);
  portalElements.imageUpload.addEventListener("change", handleImageSelectionChange);
  portalElements.deleteProfileImage.addEventListener("click", handleProfileImageDelete);
}

async function refreshPortalState(options) {
  const settings = options || {};
  const { session, access, error } = await window.therapistDataApi.getCurrentUserAccess();
  portalState.session = session;
  portalState.access = access;
  portalState.isLoadingPortalData = false;

  if (error) {
    portalElements.authCopy.textContent = `Session lookup failed: ${error.message}`;
  }

  if (!access) {
    portalState.therapists = [];
    renderPortal();
    return;
  }

  if (!settings.preserveCurrentTherapists) {
    portalState.therapists = [];
  }
  portalState.isLoadingPortalData = true;
  if (!settings.preserveCurrentTherapists) {
    renderPortal();
  }

  const portalResult = await window.therapistDataApi.loadPortalTherapists();
  portalState.isLoadingPortalData = false;
  portalState.therapists = portalResult.error ? [] : portalResult.data;

  if (portalResult.error) {
    portalElements.authCopy.textContent = `Access lookup failed: ${portalResult.error.message}`;
  }

  renderPortal();
}

function renderPortal() {
  const isSignedIn = Boolean(portalState.session && portalState.access);
  const access = portalState.access;
  const isLoadingPortalData = portalState.isLoadingPortalData;
  const linkedTherapist = access && access.therapist_id
    ? portalState.therapists.find((therapist) => therapist.id === access.therapist_id)
    : null;

  portalElements.authStatusBadge.textContent = isSignedIn ? "Signed in" : "Signed out";
  portalElements.hero.classList.toggle("hidden", !isSignedIn);
  portalElements.authGrid.classList.toggle("portal-grid-auth-signed-in", isSignedIn);
  portalElements.signoutButton.classList.toggle("hidden", !isSignedIn);
  portalElements.accountCard.classList.toggle("hidden", !isSignedIn);
  portalElements.editorSection.classList.toggle("hidden", !portalCanEdit());
  portalElements.editorCard.classList.toggle("hidden", !portalCanEdit());
  portalElements.editorForm.classList.toggle("hidden", !portalCanEdit());
  portalElements.adminPanel.classList.toggle("hidden", !portalIsAdmin());
  portalElements.createNewTherapist.classList.toggle("hidden", !portalIsAdmin());
  portalElements.deleteTherapist.classList.toggle("hidden", !portalIsAdmin());
  portalElements.editorModeBadge.classList.toggle("hidden", !portalCanEdit());
  setEditorDisabled(!portalCanEdit() || isLoadingPortalData || portalState.isSavingProfile);

  if (!isSignedIn) {
    portalElements.authCopy.textContent = "Use the email and password or PIN linked to your therapist or admin account.";
    portalElements.editorStatus.textContent = "Sign in to edit therapist information.";
    portalElements.editorModeBadge.textContent = "Signed out";
    portalElements.editorHeading.textContent = "Therapist profile";
    return;
  }

  portalElements.accountEmail.textContent = access.email || "-";
  portalElements.accountRole.textContent = access.role || "-";
  portalElements.accountTherapist.textContent = isLoadingPortalData
    ? "Loading..."
    : (linkedTherapist ? linkedTherapist.name : "Not linked");
  portalElements.editorModeBadge.textContent = portalIsAdmin() ? "Admin access" : "Therapist access";

  if (isLoadingPortalData) {
    populateTherapistForm(window.therapistDataApi.EMPTY_THERAPIST);
    portalElements.editorHeading.textContent = portalIsAdmin() ? "Loading therapist profiles" : "Loading therapist profile";
    portalElements.editorStatus.textContent = portalIsAdmin()
      ? "Signed in successfully. Loading therapist profiles..."
      : "Signed in successfully. Loading your profile...";
    return;
  }

  if (portalIsAdmin()) {
    renderAdminList();
    const requestedTherapistId = new URLSearchParams(window.location.search).get("therapist");
    const selectedTherapist = portalState.therapists.find((therapist) => therapist.id === (portalState.selectedTherapistId || requestedTherapistId))
      || window.therapistDataApi.EMPTY_THERAPIST;
    portalState.selectedTherapistId = selectedTherapist.id || null;
    populateTherapistForm(selectedTherapist);
    portalElements.editorHeading.textContent = selectedTherapist.id ? `Editing ${selectedTherapist.name}` : "Create therapist profile";
    portalElements.editorStatus.textContent = selectedTherapist.id
      ? "Profile summary loaded. Click Edit in the admin list to load full profile details."
      : "Admin access is active. Select a therapist to edit, or add a new profile.";
    return;
  }

  const therapist = linkedTherapist || window.therapistDataApi.EMPTY_THERAPIST;
  portalState.selectedTherapistId = therapist.id || null;
  populateTherapistForm(therapist);
  portalElements.fields.email.readOnly = true;
  portalElements.editorHeading.textContent = therapist.id ? `Editing ${therapist.name}` : "Linked therapist profile not found";
  portalElements.editorStatus.textContent = therapist.id
    ? "Update your profile details and save to publish changes. Fill the password/PIN field only if you want to change it."
    : "Your account is signed in, but no therapist profile is linked yet.";
}

function renderAdminList() {
  const searchTerm = portalState.adminSearchTerm.trim().toLowerCase();
  const visibleTherapists = portalState.therapists.filter((therapist) => {
    if (!searchTerm) {
      return true;
    }

    return (therapist.name || "").toLowerCase().includes(searchTerm);
  });
  const fragment = document.createDocumentFragment();

  if (!visibleTherapists.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "portal-helper";
    emptyState.textContent = "No therapist profiles match that name.";
    portalElements.adminTherapistList.replaceChildren(emptyState);
    return;
  }

  visibleTherapists.forEach((therapist) => {
    const row = document.createElement("article");
    row.className = "portal-list-item";
    row.innerHTML = `
      <div>
        <h3>${therapist.name || "Untitled therapist"}</h3>
        <p>${therapist.title || "No title"} | ${therapist.location || "No location"} | ${therapist.email || "No login email"}</p>
      </div>
      <div class="portal-list-actions">
        <button type="button" class="secondary-button" data-edit-therapist="${therapist.id}">Edit</button>
      </div>
    `;
    fragment.appendChild(row);
  });

  portalElements.adminTherapistList.replaceChildren(fragment);
}

function handleAdminSearchInput(event) {
  portalState.adminSearchTerm = event.target.value;
  renderAdminList();
}

function populateTherapistForm(therapist) {
  const normalized = window.therapistDataApi.normalizeTherapist(therapist);
  portalElements.fields.id.value = normalized.id;
  portalElements.fields.name.value = normalized.name;
  portalElements.fields.email.value = normalized.email;
  portalElements.fields.password.value = "";
  portalElements.fields.title.value = normalized.title;
  portalElements.fields.location.value = normalized.location;
  portalElements.fields.image.value = normalized.image === "data/portraits/portrait.svg" ? "" : normalized.image;
  portalElements.imageUpload.value = "";
  portalElements.fields.price.value = normalized.price == null ? "" : String(normalized.price);
  portalElements.fields.availability.value = normalized.availability;
  portalElements.fields.summary.value = normalized.summary;
  portalElements.fields.specialties.value = normalized.specialties.join(", ");
  portalElements.fields.languages.value = normalized.languages.join(", ");
  portalElements.fields.therapyTypes.value = normalized.therapyTypes.join(", ");
  portalElements.fields.email.readOnly = !portalIsAdmin();
  updateProfileImageDeleteState();
}

function showBlankTherapistForm() {
  portalState.selectedTherapistId = null;
  populateTherapistForm(window.therapistDataApi.EMPTY_THERAPIST);
  portalElements.editorHeading.textContent = "Create therapist profile";
  portalElements.editorStatus.textContent = "Fill out the fields and save to add a new therapist. Add a password or PIN if this therapist should be able to log in.";
}

function showSavedTherapistForm(therapist) {
  portalState.selectedTherapistId = therapist.id;
  mergeSavedTherapist(therapist);
  populateTherapistForm(therapist);
  portalElements.editorHeading.textContent = `Editing ${therapist.name}`;

  if (portalIsAdmin()) {
    renderAdminList();
  }
}

function readTherapistForm() {
  return {
    therapist: {
      id: portalElements.fields.id.value.trim(),
      name: portalElements.fields.name.value.trim(),
      email: portalElements.fields.email.value.trim().toLowerCase(),
      title: portalElements.fields.title.value.trim(),
      location: portalElements.fields.location.value.trim(),
      image: portalElements.fields.image.value.trim(),
      price: portalElements.fields.price.value.trim(),
      availability: portalElements.fields.availability.value,
      summary: portalElements.fields.summary.value.trim(),
      specialties: portalElements.fields.specialties.value,
      languages: portalElements.fields.languages.value,
      therapyTypes: portalElements.fields.therapyTypes.value
    },
    password: portalElements.fields.password.value.trim()
  };
}

function isBlankProfileData(therapist) {
  return !therapist.name
    && !therapist.email
    && !therapist.title
    && !therapist.location
    && !therapist.image
    && !therapist.summary
    && !therapist.specialties.trim()
    && !therapist.languages.trim()
    && !therapist.therapyTypes.trim()
    && !therapist.price;
}

function validateTherapistSave(formData) {
  const therapist = formData.therapist;
  const existingTherapistId = therapist.id || portalState.selectedTherapistId;

  if (!portalElements.editorForm.reportValidity()) {
    return false;
  }

  if (!therapist.name) {
    portalElements.editorStatus.textContent = "Please enter the therapist full name before saving.";
    portalElements.fields.name.focus();
    return false;
  }

  if (existingTherapistId && isBlankProfileData(therapist)) {
    portalElements.editorStatus.textContent = "Save blocked because this profile form is empty. Reload the therapist profile before saving.";
    return false;
  }

  return true;
}

function hasCustomProfileImage() {
  const imageValue = portalElements.fields.image.value.trim();
  return Boolean(imageValue && imageValue !== window.therapistDataApi.EMPTY_THERAPIST.image);
}

function updateProfileImageDeleteState() {
  const hasUpload = Boolean(portalElements.imageUpload.files && portalElements.imageUpload.files.length);
  portalElements.deleteProfileImage.classList.toggle("hidden", !(hasUpload || hasCustomProfileImage()));
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load that image file."));
    image.src = src;
  });
}

async function optimizeImageFile(file) {
  const fileDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.readAsDataURL(file);
  });

  const image = await loadImageElement(fileDataUrl);
  const maxDimension = 1200;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const width = Math.max(1, Math.round((image.naturalWidth || 1) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || 1) * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image processing is not supported in this browser.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const quality = mimeType === "image/jpeg" ? 0.78 : undefined;
  const optimizedDataUrl = canvas.toDataURL(mimeType, quality);

  return {
    dataUrl: optimizedDataUrl,
    width,
    height,
    mimeType
  };
}

function handleImageSelectionChange(event) {
  const currentRunId = ++portalState.imageSelectionRunId;
  const [file] = event.target.files || [];
  if (!file) {
    portalState.isOptimizingImage = false;
    updateProfileImageDeleteState();
    return;
  }

  if (!file.type.startsWith("image/")) {
    portalState.isOptimizingImage = false;
    portalElements.editorStatus.textContent = "Please choose an image file.";
    event.target.value = "";
    updateProfileImageDeleteState();
    return;
  }

  portalState.isOptimizingImage = true;
  portalElements.editorStatus.textContent = "Optimizing image...";
  optimizeImageFile(file)
    .then((optimized) => {
      if (currentRunId !== portalState.imageSelectionRunId) {
        return;
      }

      portalState.isOptimizingImage = false;
      portalElements.fields.image.value = optimized.dataUrl;
      updateProfileImageDeleteState();
      portalElements.editorStatus.textContent = `Image is ready. ${file.name} optimized to ${optimized.width}x${optimized.height}. Save the profile to upload it.`;
    })
    .catch(() => {
      if (currentRunId !== portalState.imageSelectionRunId) {
        return;
      }

      portalState.isOptimizingImage = false;
      event.target.value = "";
      updateProfileImageDeleteState();
      portalElements.editorStatus.textContent = "Could not process that image file. Please try another one.";
    });
}

function handleProfileImageDelete() {
  if (!portalCanEdit()) {
    portalElements.editorStatus.textContent = "You do not have permission to edit profile images.";
    return;
  }

  const hasUpload = Boolean(portalElements.imageUpload.files && portalElements.imageUpload.files.length);
  if (!hasUpload && !hasCustomProfileImage()) {
    portalElements.editorStatus.textContent = "There is no profile image to remove.";
    updateProfileImageDeleteState();
    return;
  }

  portalElements.imageUpload.value = "";
  portalElements.fields.image.value = "";
  portalState.isOptimizingImage = false;
  portalState.imageSelectionRunId += 1;
  updateProfileImageDeleteState();
  portalElements.editorStatus.textContent = "Profile image removed. Save the profile to restore the default portrait.";
}

async function handlePortalLogin(event) {
  event.preventDefault();
  const normalizedEmail = window.therapistDataApi.normalizeStaffEmail(portalElements.portalEmail.value);

  if (!window.therapistDataApi.isAllowedStaffEmail(normalizedEmail)) {
    portalElements.authCopy.textContent = `Only @${window.therapistDataApi.STAFF_EMAIL_DOMAIN} email addresses can sign in.`;
    portalElements.portalEmail.focus();
    return;
  }

  portalElements.authCopy.textContent = "Signing in...";

  const result = await window.therapistDataApi.loginWithPassword(
    normalizedEmail,
    portalElements.portalPassword.value
  );

  if (result.error) {
    portalElements.authCopy.textContent = result.error.message;
    return;
  }

  portalElements.portalPassword.value = "";
  portalElements.authCopy.textContent = "Sign-in successful.";
  await refreshPortalState();
}

async function handlePortalSignout() {
  const result = await window.therapistDataApi.signOut();
  if (result.error) {
    portalElements.authCopy.textContent = result.error.message;
    return;
  }

  portalState.session = null;
  portalState.access = null;
  portalState.therapists = [];
  renderPortal();
}

function handlePortalRefresh() {
  window.location.reload();
}

async function handleProfileSave(event) {
  event.preventDefault();

  if (portalState.isSavingProfile) {
    portalElements.editorStatus.textContent = "Save already in progress. Please wait a moment.";
    return;
  }

  if (!portalCanEdit()) {
    portalElements.editorStatus.textContent = "You do not have permission to save profiles.";
    return;
  }

  if (portalState.isOptimizingImage) {
    portalElements.editorStatus.textContent = "Please wait for the selected image to finish processing before saving.";
    return;
  }

  const formData = readTherapistForm();
  if (!validateTherapistSave(formData)) {
    return;
  }

  if (formData.therapist.email && !window.therapistDataApi.isAllowedStaffEmail(formData.therapist.email)) {
    portalElements.editorStatus.textContent = `Only @${window.therapistDataApi.STAFF_EMAIL_DOMAIN} email addresses are allowed for therapist/admin logins.`;
    portalElements.fields.email.focus();
    return;
  }

  portalState.isSavingProfile = true;
  setEditorDisabled(true);
  portalElements.editorStatus.textContent = "Saving profile...";
  let finalStatusMessage = "";
  try {
    const result = await window.therapistDataApi.saveTherapistProfile(formData.therapist, formData.password);

    if (result.error) {
      finalStatusMessage = `Save failed: ${result.error.message}`;
      return;
    }

    showSavedTherapistForm(result.data);
    finalStatusMessage = "Profile saved successfully.";
    portalElements.editorStatus.textContent = finalStatusMessage;
  } catch (error) {
    finalStatusMessage = `Save failed: ${error.message || "Please try again."}`;
  } finally {
    portalState.isSavingProfile = false;
    setEditorDisabled(!portalCanEdit());
    if (finalStatusMessage) {
      portalElements.editorStatus.textContent = finalStatusMessage;
    }
  }
}

function mergeSavedTherapist(savedTherapist) {
  if (!savedTherapist || !savedTherapist.id) {
    return;
  }

  const existingIndex = portalState.therapists.findIndex((therapist) => therapist.id === savedTherapist.id);
  if (existingIndex >= 0) {
    portalState.therapists[existingIndex] = savedTherapist;
  } else {
    portalState.therapists.push(savedTherapist);
  }
}

async function handleProfileDelete() {
  if (!portalIsAdmin()) {
    portalElements.editorStatus.textContent = "Only admins can delete profiles.";
    return;
  }

  const therapistId = portalElements.fields.id.value.trim();
  if (!therapistId) {
    portalElements.editorStatus.textContent = "Select a therapist profile first.";
    return;
  }

  const confirmed = window.confirm("Delete this therapist profile?");
  if (!confirmed) {
    return;
  }

  portalElements.editorStatus.textContent = "Deleting profile...";
  const result = await window.therapistDataApi.deleteTherapistProfile(therapistId);

  if (result.error) {
    portalElements.editorStatus.textContent = `Delete failed: ${result.error.message}`;
    return;
  }

  portalState.selectedTherapistId = null;
  portalElements.editorStatus.textContent = "Profile deleted successfully.";
  await refreshPortalState();
}

async function handleAdminListClick(event) {
  const button = event.target.closest("[data-edit-therapist]");
  if (!button) {
    return;
  }

  const therapistId = button.dataset.editTherapist;
  if (!therapistId) {
    return;
  }

  portalElements.editorStatus.textContent = "Loading full therapist profile...";
  button.disabled = true;
  const result = await window.therapistDataApi.loadPortalTherapistById(therapistId);
  button.disabled = false;

  if (result.error) {
    portalElements.editorStatus.textContent = `Profile load failed: ${result.error.message}`;
    return;
  }

  const therapist = result.data;
  portalState.selectedTherapistId = therapist.id;
  mergeSavedTherapist(therapist);
  populateTherapistForm(therapist);
  portalElements.editorHeading.textContent = `Editing ${therapist.name}`;
  portalElements.editorStatus.textContent = "Profile loaded. To reset this therapist password or PIN, enter a new one in the password field and save. Leave it blank to keep the current one.";
  portalElements.editorForm.scrollIntoView({ behavior: "smooth", block: "start" });
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

initTherapistPortal();
