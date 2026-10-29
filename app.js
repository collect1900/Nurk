const cartoons = window.nurkCartoons || [];

const galleryGrid = document.querySelector("#galleryGrid");
const dateStrip = document.querySelector("#dateStrip");
const currentDay = document.querySelector("#currentDay");
const featureCaption = document.querySelector("#featureCaption");
const lightbox = document.querySelector("#lightbox");
const lightboxArt = document.querySelector("#lightboxArt");
const lightboxTitle = document.querySelector("#lightboxTitle");
const lightboxCategory = document.querySelector("#lightboxCategory");
const lightboxDescription = document.querySelector("#lightboxDescription");
const closeButton = document.querySelector(".close-button");
let activeDate = "";
let activeSeason = null;
const seasonSelect = document.querySelector("#seasonSelect");
let lightboxItems = [];
let lightboxIndex = 0;
const lightboxNav = document.createElement("nav");
lightboxNav.className = "lightbox-navigation";
lightboxNav.setAttribute("aria-label", "Cartoons from this day");
const previousCartoon = document.createElement("button");
previousCartoon.type = "button";
previousCartoon.textContent = "← Previous";
const cartoonPosition = document.createElement("span");
cartoonPosition.setAttribute("role", "status");
const nextCartoon = document.createElement("button");
nextCartoon.type = "button";
nextCartoon.textContent = "Next →";
lightboxNav.append(previousCartoon, cartoonPosition, nextCartoon);
lightbox.querySelector(".lightbox-copy").prepend(lightboxNav);

function moveCartoon(offset) {
  const next = lightboxIndex + offset;
  if (next < 0 || next >= lightboxItems.length) return;
  lightboxIndex = next;
  renderLightbox();
}

previousCartoon.addEventListener("click", () => moveCartoon(-1));
nextCartoon.addEventListener("click", () => moveCartoon(1));
lightbox.addEventListener("keydown", (event) => {
  if (event.target.closest("input, textarea, select")) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    moveCartoon(event.key === "ArrowLeft" ? -1 : 1);
  }
});
lightbox.addEventListener("close", () => lightboxArt.replaceChildren());

function getSeason(dateToken) {
  const date = parseNurKDate(dateToken);
  const afterAnniversary = date.getMonth() > 5 || (date.getMonth() === 5 && date.getDate() >= 7);
  return date.getFullYear() - 2025 + (afterAnniversary ? 1 : 0);
}

function renderSeasons() {
  const seasons = [...new Set(getAvailableDates().map(getSeason))].filter(n => n >= 1).sort((a, b) => b - a);
  seasonSelect.replaceChildren(...seasons.map(season => {
    const option = document.createElement("option");
    option.value = String(season);
    option.textContent = `Season ${season}`;
    option.selected = season === activeSeason;
    return option;
  }));
  updateSeasonRange();
}

function updateSeasonRange() {
  const startYear = 2024 + activeSeason;
  document.querySelector("#seasonRange").textContent = activeSeason === null ? "" : `7 June ${startYear} – 6 June ${startYear + 1}`;
  document.querySelector("#gallery-title").textContent = activeSeason === null ? "NURK archive" : `Season ${activeSeason}`;
}

seasonSelect.addEventListener("change", () => {
  activeSeason = Number(seasonSelect.value);
  activeDate = getDefaultDate(activeSeason);
  galleryItemIndex = 0;
  updateSeasonRange();
  renderDateStrip();
  renderFeature();
  renderGallery();
});

function getDateFromImagePath(imagePath) {
  const fileName = imagePath.split("/").pop() || "";
  const dateToken = fileName.slice(0, 8);
  return /^\d{2}-\d{2}-\d{2}$/.test(dateToken) ? dateToken : "";
}

function parseNurKDate(dateToken) {
  const [year, month, day] = dateToken.split("-").map(Number);
  return new Date(2000 + year, month - 1, day);
}

function formatDateToken(dateToken) {
  if (!dateToken) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(parseNurKDate(dateToken));
}

function enrichCartoons(items) {
  return items.map((cartoon) => ({
    ...cartoon,
    publishedAt: cartoon.publishedAt || getDateFromImagePath(cartoon.image || "")
  }));
}

function getPublicationTodayToken(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam", year: "2-digit", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const part = type => parts.find(item => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

const requestedDate = new URLSearchParams(window.location.search).get("date") || "";
const requestedDateToken = /^20\d{2}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate.slice(2) : "";

// A date link may preview that date; other future dates remain hidden.
const datedCartoons = enrichCartoons(cartoons).filter(cartoon =>
  cartoon.publishedAt && (cartoon.publishedAt <= getPublicationTodayToken() || cartoon.publishedAt === requestedDateToken)
);

let galleryItemIndex = 0;
const carousel = document.createElement("div");
carousel.className = "gallery-carousel";
carousel.setAttribute("role", "region");
carousel.setAttribute("aria-label", "Browse NURK cartoons");
carousel.tabIndex = 0;
const galleryPrevious = document.createElement("button");
galleryPrevious.type = "button";
galleryPrevious.className = "gallery-arrow";
galleryPrevious.textContent = "‹";
galleryPrevious.setAttribute("aria-label", "Previous cartoon");
const galleryNext = document.createElement("button");
galleryNext.type = "button";
galleryNext.className = "gallery-arrow";
galleryNext.textContent = "›";
galleryNext.setAttribute("aria-label", "Next cartoon");
const galleryPosition = document.createElement("p");
galleryPosition.className = "gallery-position";
galleryPosition.setAttribute("role", "status");
galleryGrid.before(carousel);
carousel.append(galleryPrevious, galleryGrid, galleryNext);
carousel.after(galleryPosition);
function getGallerySequence() {
  return [...datedCartoons].filter(item => item.publishedAt).sort((a, b) => parseNurKDate(b.publishedAt) - parseNurKDate(a.publishedAt));
}
function moveGallery(offset) {
  const dates = getAvailableDates();
  const current = dates.indexOf(activeDate);
  const target = dates[current + offset];
  if (current < 0 || !target) return;
  activeDate = target;
  activeSeason = getSeason(activeDate);
  galleryItemIndex = 0;
  renderSeasons(); renderDateStrip(); renderGallery();
}
galleryPrevious.addEventListener("click", () => moveGallery(-1));
galleryNext.addEventListener("click", () => moveGallery(1));
carousel.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault(); moveGallery(event.key === "ArrowLeft" ? -1 : 1);
  }
});
let swipeStart = null;
let suppressGalleryClickUntil = 0;
galleryGrid.addEventListener("pointerdown", event => {
  if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
  swipeStart = { x: event.clientX, y: event.clientY };
});
galleryGrid.addEventListener("pointercancel", () => { swipeStart = null; });
galleryGrid.addEventListener("pointerup", event => {
  if (!swipeStart) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
    suppressGalleryClickUntil = Date.now() + 400; moveGallery(dx < 0 ? 1 : -1);
  }
});
galleryGrid.addEventListener("click", event => {
  if (Date.now() < suppressGalleryClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);

const publicationCount = document.querySelector("#publicationCount");
if (publicationCount) publicationCount.textContent = new Intl.NumberFormat("en-GB").format(getPublicationCount());

function getPublicationCount() {
  const dates = getAvailableDates();
  if (!dates.length) return 0;
  const first = parseNurKDate(dates[dates.length - 1]);
  const latest = parseNurKDate(getDefaultDate());
  return Math.round((Date.UTC(latest.getFullYear(), latest.getMonth(), latest.getDate()) - Date.UTC(first.getFullYear(), first.getMonth(), first.getDate())) / 86400000) + 1;
}

function getAvailableDates(season = null) {
  return [...new Set(datedCartoons
    .map((cartoon) => cartoon.publishedAt)
    .filter((date) => date && (season === null || getSeason(date) === season)))]
    .sort((left, right) => parseNurKDate(right) - parseNurKDate(left));
}

function getInitialGalleryDate() {
  const featureDate = hasRequestedDate ? requestedDateToken : getDefaultDate();
  if (!featureDate) return "";
  const previousDay = parseNurKDate(featureDate);
  previousDay.setDate(previousDay.getDate() - 1);
  return getAvailableDates().find(date => parseNurKDate(date) <= previousDay) || "";
}

function getDefaultDate(season = null) {
  const dates = getAvailableDates(season);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dates.find((dateToken) => parseNurKDate(dateToken) <= today) || dates[0] || "";
}

function createArtwork(cartoon, sizeClass = "thumb") {
  const art = document.createElement("div");
  art.className = `cartoon-frame ${sizeClass}`;

  if (cartoon.image) {
    const image = document.createElement("img");
    image.className = "cartoon-image";
    image.draggable = false;
    image.src = cartoon.image;
    image.alt = cartoon.title;
    art.append(image);
  } else {
    art.classList.add("placeholder-art");
    art.style.background = cartoon.color;
    art.style.setProperty("--tilt", cartoon.tilt);
    art.innerHTML = `<span class="placeholder-label" style="background:${cartoon.accent}">image coming soon</span>`;
  }

  return art;
}

function openLightbox(cartoon) {
  lightboxItems = datedCartoons.filter((item) => item.publishedAt === cartoon.publishedAt);
  lightboxIndex = lightboxItems.indexOf(cartoon);
  renderLightbox();
  lightbox.showModal();
}

function renderLightbox() {
  const cartoon = lightboxItems[lightboxIndex];
  lightboxArt.replaceChildren(createArtwork(cartoon, "lightbox-artwork"));
  lightboxTitle.textContent = cartoon.title;
  lightboxCategory.textContent = [cartoon.category, formatDateToken(cartoon.publishedAt)]
    .filter(Boolean)
    .join(" - ");
  lightboxDescription.textContent = cartoon.description;
  lightboxNav.hidden = lightboxItems.length < 2;
  cartoonPosition.textContent = `${lightboxIndex + 1} of ${lightboxItems.length}`;
  previousCartoon.setAttribute("aria-disabled", String(lightboxIndex === 0));
  nextCartoon.setAttribute("aria-disabled", String(lightboxIndex === lightboxItems.length - 1));
}

function renderDateStrip() {
  const dates = getAvailableDates(activeSeason);

  if (!dates.length) {
    dateStrip.hidden = true;
    currentDay.textContent = "No dated NURK cartoons found";
    return;
  }

  dateStrip.hidden = false;
  dateStrip.replaceChildren(...dates.map((dateToken) => {
    const button = document.createElement("button");
    button.className = `date-button${dateToken === activeDate ? " active" : ""}`;
    button.type = "button";
    const weekday = document.createElement("span");
    weekday.className = "date-weekday";
    weekday.textContent = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(parseNurKDate(dateToken));
    const date = document.createElement("span");
    date.className = "date-calendar";
    date.textContent = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(parseNurKDate(dateToken));
    button.append(weekday, date);
    button.addEventListener("click", () => {
      activeDate = dateToken;
      galleryItemIndex = 0;
      renderDateStrip();
      renderFeature();
      renderGallery();
    });
    return button;
  }));

  dateStrip.querySelector(".active")?.scrollIntoView({
    behavior: "auto",
    block: "nearest",
    inline: "center"
  });
  currentDay.textContent = `Showing: ${formatDateToken(activeDate)}`;
}

function renderFeature() {
  const latestDate = hasRequestedDate ? requestedDateToken : getDefaultDate();
  const featured = datedCartoons.find((cartoon) => cartoon.publishedAt === latestDate);

  if (!featured) {
    return;
  }

  document.querySelector("#featureArt")?.replaceWith(createArtwork(featured, "feature-drawing"));
  document.querySelector(".feature-drawing").id = "featureArt";
  featureCaption.textContent = `${featured.title} - ${formatDateToken(featured.publishedAt)}`;
}

function renderGallery() {
  const source = activeDate
    ? datedCartoons.filter((cartoon) => cartoon.publishedAt === activeDate)
    : datedCartoons;

  galleryItemIndex = Math.min(galleryItemIndex, Math.max(0, source.length - 1));
  const visible = source;
  const sequence = getGallerySequence();
  const position = sequence.indexOf(visible[0]);
  galleryPrevious.setAttribute("aria-disabled", String(getAvailableDates().indexOf(activeDate) <= 0));
  galleryNext.setAttribute("aria-disabled", String(getAvailableDates().indexOf(activeDate) >= getAvailableDates().length - 1));
  galleryPosition.textContent = source.length > 1 ? source.length + " cartoons on this day" : "";

  galleryGrid.replaceChildren(...visible.map((cartoon) => {
    const card = document.createElement("article");
    card.className = "cartoon-card";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.setAttribute("aria-label", `Open ${cartoon.title}`);
    trigger.append(createArtwork(cartoon));
    trigger.addEventListener("click", () => openLightbox(cartoon));

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.textContent = `${cartoon.title} - ${formatDateToken(cartoon.publishedAt)}`;

    card.append(trigger, meta);
    return card;
  }));

  if (!visible.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "No cartoons found for this day.";
    galleryGrid.replaceChildren(emptyState);
  }
}


closeButton.addEventListener("click", () => lightbox.close());

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

const hasRequestedDate = datedCartoons.some(cartoon => cartoon.publishedAt === requestedDateToken);
activeDate = getInitialGalleryDate();
activeSeason = activeDate ? getSeason(activeDate) : null;
renderSeasons();
renderDateStrip();
renderFeature();
renderGallery();


