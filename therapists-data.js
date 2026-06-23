(function () {
  const supabaseRuntime = window.footprintsSupabase || {};
  const client = supabaseRuntime.client || null;
  const SESSION_STORAGE_KEY = "footprints-staff-session-token";
  const THERAPIST_UPDATE_STORAGE_KEY = "footprints-therapist-profile-updated";
  const THERAPIST_IMAGE_BUCKET = "therapist-images";
  const STAFF_EMAIL_DOMAIN = "footprintstofeelbetter.com";
  const EMPTY_THERAPIST = {
    id: "",
    email: "",
    name: "",
    image: "data/portraits/portrait.svg",
    title: "",
    location: "",
    specialties: [],
    languages: [],
    therapyTypes: [],
    price: null,
    availability: "Available",
    summary: "",
    calLink: "",
    updatedAt: ""
  };

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function stripNumericSuffix(value) {
    return String(value || "")
      .trim()
      .replace(/-\d+$/, "");
  }

  function toArray(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function normalizeTherapist(record) {
    const base = { ...EMPTY_THERAPIST };
    const next = { ...base, ...(record || {}) };
    return {
      id: String(next.id || slugify(next.name) || ""),
      email: String(next.email || "").trim().toLowerCase(),
      name: String(next.name || "").trim(),
      image: String(next.image || base.image).trim() || base.image,
      title: String(next.title || "").trim(),
      location: String(next.location || "").trim(),
      specialties: toArray(next.specialties),
      languages: toArray(next.languages),
      therapyTypes: toArray(next.therapyTypes || next.therapy_types),
      price: next.price === "" || next.price == null || Number.isNaN(Number(next.price)) ? null : Number(next.price),
      availability: String(next.availability || base.availability).trim() || base.availability,
      summary: String(next.summary || "").trim(),
      calLink: String(next.calLink || next.cal_link || next.calUrl || next.cal_url || next.calBookingUrl || "").trim(),
      updatedAt: String(next.updatedAt || next.updated_at || "").trim()
    };
  }

  function mapDbTherapist(record) {
    return normalizeTherapist({
      ...record,
      therapyTypes: record.therapy_types
    });
  }

  function getTherapistUpdateKey(therapistId) {
    return `${THERAPIST_UPDATE_STORAGE_KEY}:${therapistId}`;
  }

  function cacheUpdatedTherapist(therapist) {
    const savedAt = new Date().toISOString();
    const normalized = normalizeTherapist(therapist);
    if (!normalized.id) {
      return normalized;
    }

    if (!normalized.updatedAt) {
      normalized.updatedAt = savedAt;
    }

    const payload = {
      therapist: normalized,
      savedAt
    };
    const serializedPayload = JSON.stringify(payload);

    try {
      window.localStorage.setItem(getTherapistUpdateKey(normalized.id), serializedPayload);
      window.localStorage.setItem(THERAPIST_UPDATE_STORAGE_KEY, serializedPayload);
    } catch (error) {
      // Ignore storage quota/privacy failures; Supabase remains the source of truth.
    }

    window.dispatchEvent(new CustomEvent("footprints:therapist-updated", {
      detail: payload
    }));

    return normalized;
  }

  function getCachedUpdatedTherapist(therapistId) {
    if (!therapistId) {
      return null;
    }

    try {
      const lookupIds = [String(therapistId || "").trim(), stripNumericSuffix(therapistId)];
      for (const lookupId of [...new Set(lookupIds.filter(Boolean))]) {
        const rawPayload = window.localStorage.getItem(getTherapistUpdateKey(lookupId));
        if (!rawPayload) {
          continue;
        }

        const payload = JSON.parse(rawPayload);
        return payload && payload.therapist ? normalizeTherapist(payload.therapist) : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  function parseTherapistUpdateEvent(event) {
    try {
      const payload = event && event.detail
        ? event.detail
        : JSON.parse(event && event.newValue ? event.newValue : "null");
      const therapist = payload && payload.therapist ? normalizeTherapist(payload.therapist) : null;
      return therapist && therapist.id ? therapist : null;
    } catch (error) {
      return null;
    }
  }

  function getMostRecentTherapist(primaryTherapist, fallbackTherapist) {
    if (!primaryTherapist) {
      return fallbackTherapist || null;
    }

    if (!fallbackTherapist) {
      return primaryTherapist;
    }

    const primaryTime = Date.parse(primaryTherapist.updatedAt || "") || 0;
    const fallbackTime = Date.parse(fallbackTherapist.updatedAt || "") || 0;
    return fallbackTime > primaryTime ? fallbackTherapist : primaryTherapist;
  }

  function findTherapistByIdentifier(therapists, therapistId) {
    const normalizedId = String(therapistId || "").trim();
    if (!normalizedId) {
      return null;
    }

    const fallbackId = stripNumericSuffix(normalizedId);

    return therapists.find((therapist) => {
      if (!therapist) {
        return false;
      }

      const therapistIdValue = String(therapist.id || "").trim();
      const therapistSlug = slugify(therapist.name);
      if (therapistIdValue === normalizedId || therapistIdValue === fallbackId) {
        return true;
      }

      return therapistSlug === normalizedId || therapistSlug === fallbackId;
    }) || null;
  }

  async function fetchJsonFallback(fallbackUrl, fallbackData) {
    if (fallbackUrl) {
      try {
        const response = await fetch(fallbackUrl);
        if (!response.ok) {
          throw new Error("Unable to load fallback therapist data.");
        }

        const json = await response.json();
        if (Array.isArray(json) && json.length) {
          return json.map(normalizeTherapist);
        }
      } catch (error) {
        console.warn("Unable to load therapist JSON fallback. Trying inline fallback data.", error);
      }
    }

    if (Array.isArray(fallbackData) && fallbackData.length) {
      return fallbackData.map(normalizeTherapist);
    }

    return [];
  }

  function getStoredSessionToken() {
    return window.localStorage.getItem(SESSION_STORAGE_KEY) || "";
  }

  function isDataUrl(value) {
    return String(value || "").startsWith("data:image/");
  }

  async function dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error("Could not prepare the selected image for upload.");
    }

    return response.blob();
  }

  function getImageExtension(mimeType) {
    if (mimeType === "image/png") {
      return "png";
    }

    if (mimeType === "image/webp") {
      return "webp";
    }

    return "jpg";
  }

  function buildTherapistImagePath(therapist, blob) {
    const therapistKey = slugify(therapist.id || therapist.name) || `therapist-${Date.now()}`;
    const extension = getImageExtension(blob.type);
    return `${therapistKey}/profile-${Date.now()}.${extension}`;
  }

  async function uploadTherapistImageIfNeeded(therapist) {
    if (!client || !isDataUrl(therapist.image)) {
      return therapist.image;
    }

    const blob = await dataUrlToBlob(therapist.image);
    const path = buildTherapistImagePath(therapist, blob);
    const uploadResult = await client.storage
      .from(THERAPIST_IMAGE_BUCKET)
      .upload(path, blob, {
        cacheControl: "31536000",
        contentType: blob.type || "image/jpeg",
        upsert: true
      });

    if (uploadResult.error) {
      throw uploadResult.error;
    }

    const publicUrlResult = client.storage
      .from(THERAPIST_IMAGE_BUCKET)
      .getPublicUrl(path);

    return publicUrlResult.data.publicUrl;
  }

  function normalizeStaffEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function isAllowedStaffEmail(email) {
    return normalizeStaffEmail(email).endsWith(`@${STAFF_EMAIL_DOMAIN}`);
  }

  function createInvalidStaffEmailError() {
    return new Error(`Only @${STAFF_EMAIL_DOMAIN} email addresses are allowed.`);
  }

  function setStoredSessionToken(token) {
    if (!token) {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SESSION_STORAGE_KEY, token);
  }

  async function loadTherapists(options) {
    const settings = options || {};
    if (client) {
      const selectColumns = settings.includeImages === false
        ? "id, name, title, location, specialties, languages, therapy_types, price, availability, summary, is_active, updated_at"
        : "id, name, image, title, location, specialties, languages, therapy_types, price, availability, summary, is_active, updated_at";
      const result = await client
        .from("therapists")
        .select(selectColumns)
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (!result.error) {
        return result.data.map(mapDbTherapist);
      }

      console.warn("Supabase therapist load failed. Falling back to local data.", result.error);
    }

    return fetchJsonFallback(settings.fallbackUrl, settings.fallbackData);
  }

  async function loadPortalTherapists() {
    if (!client) {
      return {
        data: [],
        error: new Error("Supabase is not configured yet. Add your project URL and anon key in supabase-config.js.")
      };
    }

    const token = getStoredSessionToken();
    if (!token) {
      return { data: [], error: null };
    }

    const result = await client
      .rpc("footprints_list_portal_therapists", { p_token: token });

    if (result.error) {
      return result;
    }

    return {
      data: Array.isArray(result.data) ? result.data.map(mapDbTherapist) : [],
      error: null
    };
  }

  async function loadPortalTherapistById(therapistId) {
    if (!client) {
      return {
        data: null,
        error: new Error("Supabase is not configured yet. Add your project URL and anon key in supabase-config.js.")
      };
    }

    const token = getStoredSessionToken();
    if (!token) {
      return { data: null, error: new Error("You must sign in first.") };
    }

    const result = await client
      .rpc("footprints_get_portal_therapist", {
        p_token: token,
        p_therapist_id: therapistId
      })
      .single();

    if (result.error) {
      return result;
    }

    return {
      data: mapDbTherapist(result.data),
      error: null
    };
  }

  async function loadTherapistById(therapistId, options) {
    if (!therapistId) {
      return null;
    }

    if (client) {
      const result = await client
        .from("therapists")
        .select("id, name, image, title, location, specialties, languages, therapy_types, price, availability, summary, is_active, updated_at")
        .eq("id", therapistId)
        .maybeSingle();

      if (!result.error && result.data && result.data.is_active) {
        const dbTherapist = mapDbTherapist(result.data);
        cacheUpdatedTherapist(dbTherapist);
        return dbTherapist;
      }

      if (result.error) {
        console.warn("Supabase therapist lookup failed. Falling back to local data.", result.error);
      }
    }

    const therapists = await loadTherapists(options);
    const fallbackTherapist = findTherapistByIdentifier(therapists, therapistId);
    return getMostRecentTherapist(fallbackTherapist, getCachedUpdatedTherapist(therapistId));
  }

  async function loginWithPassword(email, password) {
    if (!client) {
      return {
        data: null,
        error: new Error("Supabase is not configured yet. Add your project URL and anon key in supabase-config.js.")
      };
    }

    const normalizedEmail = normalizeStaffEmail(email);
    if (!isAllowedStaffEmail(normalizedEmail)) {
      return {
        data: null,
        error: createInvalidStaffEmailError()
      };
    }

    const result = await client
      .rpc("footprints_create_staff_session", {
        p_email: normalizedEmail,
        p_password: String(password || "")
      })
      .single();

    if (result.error) {
      return result;
    }

    setStoredSessionToken(result.data.session_token);
    return result;
  }

  async function getCurrentUserAccess() {
    if (!client) {
      return { session: null, access: null };
    }

    const token = getStoredSessionToken();
    if (!token) {
      return { session: null, access: null };
    }

    const result = await client
      .rpc("footprints_get_staff_session", { p_token: token })
      .single();

    if (result.error || !result.data) {
      setStoredSessionToken("");
      return { session: null, access: null, error: result.error || null };
    }

    return {
      session: {
        token,
        expires_at: result.data.expires_at
      },
      access: {
        email: result.data.email,
        role: result.data.role,
        therapist_id: result.data.therapist_id
      },
      error: null
    };
  }

  async function signOut() {
    const token = getStoredSessionToken();
    setStoredSessionToken("");

    if (!client || !token) {
      return { error: null };
    }

    const result = await client.rpc("footprints_destroy_staff_session", { p_token: token });
    return { error: result.error || null };
  }

  async function saveTherapistProfile(therapist, password) {
    if (!client) {
      return {
        data: null,
        error: new Error("Supabase is not configured yet. Add your project URL and anon key in supabase-config.js.")
      };
    }

    const token = getStoredSessionToken();
    if (!token) {
      return { data: null, error: new Error("You must sign in first.") };
    }

    const normalized = normalizeTherapist(therapist);
    if (normalized.email && !isAllowedStaffEmail(normalized.email)) {
      return {
        data: null,
        error: createInvalidStaffEmailError()
      };
    }
    const explicitId = therapist && typeof therapist.id === "string" ? therapist.id.trim() : "";
    let imageUrl = normalized.image;
    try {
      imageUrl = await uploadTherapistImageIfNeeded({
        ...normalized,
        id: explicitId || normalized.id
      });
    } catch (error) {
      return {
        data: null,
        error: new Error(`Image upload failed: ${error.message || "Please check the therapist-images Storage bucket."}`)
      };
    }

    const result = await client
      .rpc("footprints_save_therapist_profile", {
        p_token: token,
        p_therapist: {
          id: explicitId || null,
          email: normalized.email || null,
          name: normalized.name,
          image: imageUrl,
          title: normalized.title,
          location: normalized.location,
          specialties: normalized.specialties,
          languages: normalized.languages,
          therapyTypes: normalized.therapyTypes,
          price: normalized.price,
          availability: normalized.availability,
          summary: normalized.summary
        },
        p_password: String(password || "").trim() || null
      })
      .single();

    if (result.error) {
      return result;
    }

    return { data: cacheUpdatedTherapist(mapDbTherapist(result.data)), error: null };
  }

  async function deleteTherapistProfile(therapistId) {
    if (!client) {
      return {
        error: new Error("Supabase is not configured yet. Add your project URL and anon key in supabase-config.js.")
      };
    }

    const token = getStoredSessionToken();
    if (!token) {
      return { error: new Error("You must sign in first.") };
    }

    const result = await client.rpc("footprints_delete_therapist_profile", {
      p_token: token,
      p_therapist_id: therapistId
    });

    return { error: result.error || null };
  }

  window.therapistDataApi = {
    EMPTY_THERAPIST,
    STAFF_EMAIL_DOMAIN,
    THERAPIST_UPDATE_STORAGE_KEY,
    THERAPIST_IMAGE_BUCKET,
    isAllowedStaffEmail,
    normalizeStaffEmail,
    slugify,
    stripNumericSuffix,
    normalizeTherapist,
    cacheUpdatedTherapist,
    getCachedUpdatedTherapist,
    parseTherapistUpdateEvent,
    getMostRecentTherapist,
    findTherapistByIdentifier,
    loadTherapists,
    loadPortalTherapists,
    loadPortalTherapistById,
    loadTherapistById,
    loginWithPassword,
    getCurrentUserAccess,
    signOut,
    saveTherapistProfile,
    deleteTherapistProfile
  };
})();
