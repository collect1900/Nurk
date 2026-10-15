const cartoons = window.nurkCartoons || [];

const galleryGrid = document.querySelector("#galleryGrid");
const filterButtons = document.querySelectorAll(".filter-button");
const dateStrip = document.querySelector("#dateStrip");
const currentDay = document.querySelector("#currentDay");
const featureCaption = document.querySelector("#featureCaption");
const lightbox = document.querySelector("#lightbox");
const lightboxArt = document.querySelector("#lightboxArt");
const lightboxTitle = document.querySelector("#lightboxTitle");
const lightboxCategory = document.querySelector("#lightboxCategory");
const lightboxDescription = document.querySelector("#lightboxDescription");
const closeButton = document.querySelector(".close-button");
let activeFilter = "alles";
let activeDate = "";
let lightboxItems = [];
let lightboxIndex = 0;
const lightboxNav = document.createElement("nav");
lightboxNav.className = "lightbox-navigation";
lightboxNav.setAttribute("aria-label", "Cartoons van deze dag");
const previousCartoon = document.createElement("button");
previousCartoon.type = "button";
previousCartoon.textContent = "← Vorige";
const cartoonPosition = document.createElement("span");
cartoonPosition.setAttribute("role", "status");
const nextCartoon = document.createElement("button");
nextCartoon.type = "button";
nextCartoon.textContent = "Volgende →";
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
  if (event.target.closest("video, input, textarea, select")) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    moveCartoon(event.key === "ArrowLeft" ? -1 : 1);
  }
});
lightbox.addEventListener("close", () => lightboxArt.replaceChildren());

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

  return new Intl.DateTimeFormat("nl-NL", {
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

const datedCartoons = enrichCartoons(cartoons);

function getAvailableDates() {
  return [...new Set(datedCartoons
    .map((cartoon) => cartoon.publishedAt)
    .filter(Boolean))]
    .sort((left, right) => parseNurKDate(right) - parseNurKDate(left));
}

function getDefaultDate() {
  const dates = getAvailableDates();
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return dates.find((dateToken) => parseNurKDate(dateToken) <= today) || dates[0] || "";
}

function createArtwork(cartoon, sizeClass = "thumb") {
  const art = document.createElement("div");
  art.className = `cartoon-frame ${sizeClass}`;

  if (cartoon.type === "video") {
    const video = document.createElement("video");
    video.className = "cartoon-video";
    video.src = cartoon.image;
    video.controls = sizeClass === "lightbox-artwork";
    video.muted = sizeClass !== "lightbox-artwork";
    video.playsInline = true;
    video.preload = "metadata";
    art.append(video);
  } else if (cartoon.image) {
    const image = document.createElement("img");
    image.className = "cartoon-image";
    image.src = cartoon.image;
    image.alt = cartoon.title;
    art.append(image);
  } else {
    art.classList.add("placeholder-art");
    art.style.background = cartoon.color;
    art.style.setProperty("--tilt", cartoon.tilt);
    art.innerHTML = `<span class="placeholder-label" style="background:${cartoon.accent}">beeld volgt</span>`;
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
  cartoonPosition.textContent = `${lightboxIndex + 1} van ${lightboxItems.length}`;
  previousCartoon.setAttribute("aria-disabled", String(lightboxIndex === 0));
  nextCartoon.setAttribute("aria-disabled", String(lightboxIndex === lightboxItems.length - 1));
}

function renderDateStrip() {
  const dates = getAvailableDates();

  if (!dates.length) {
    dateStrip.hidden = true;
    currentDay.textContent = "Nog geen gedateerde NURK-bestanden gevonden";
    return;
  }

  dateStrip.hidden = false;
  dateStrip.replaceChildren(...dates.map((dateToken) => {
    const button = document.createElement("button");
    button.className = `date-button${dateToken === activeDate ? " active" : ""}`;
    button.type = "button";
    button.textContent = formatDateToken(dateToken);
    button.addEventListener("click", () => {
      activeDate = dateToken;
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
  currentDay.textContent = `Getoond: ${formatDateToken(activeDate)}`;
}

function renderFeature() {
  const featured = datedCartoons.find((cartoon) => cartoon.publishedAt === activeDate) || datedCartoons[0];

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

  const visible = activeFilter === "alles"
    ? source
    : source.filter((cartoon) => cartoon.category === activeFilter);

  galleryGrid.replaceChildren(...visible.map((cartoon) => {
    const card = document.createElement("article");
    card.className = "cartoon-card";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.setAttribute("aria-label", `${cartoon.title} openen`);
    trigger.append(createArtwork(cartoon));
    trigger.addEventListener("click", () => openLightbox(cartoon));

    const meta = document.createElement("div");
    meta.className = "card-meta";
    meta.innerHTML = `
      <h3>${cartoon.title}</h3>
      <span class="category">${cartoon.category}</span>
    `;

    card.append(trigger, meta);
    return card;
  }));

  if (!visible.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "empty-state";
    emptyState.textContent = "Geen cartoons gevonden voor deze dag en filter.";
    galleryGrid.replaceChildren(emptyState);
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderGallery();
  });
});

closeButton.addEventListener("click", () => lightbox.close());

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

activeDate = getDefaultDate();
renderDateStrip();
renderFeature();
renderGallery();
