// A separate archive: Dutch cartoons never enter The Daily Nurk or its counter.
(() => {
  const items = enrichCartoons(window.nurkVandaagCartoons || []).filter(item =>
    item.publishedAt && item.publishedAt <= getPublicationTodayToken()
  );
  const dates = [...new Set(items.map(item => item.publishedAt))].sort().reverse();
  let selectedDate = dates[0] || "";
  const strip = document.querySelector("#vandaagDateStrip");
  const grid = document.querySelector("#vandaagGrid");
  const carousel = document.querySelector("#vandaagCarousel");
  const newer = document.querySelector("#vandaagNewer");
  const older = document.querySelector("#vandaagOlder");
  const position = document.querySelector("#vandaagPosition");

  function selectDate(date) {
    selectedDate = date;
    render();
    const active = strip.querySelector(".active");
    if (active) strip.scrollLeft = active.offsetLeft - strip.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
  }

  function move(offset) {
    const target = dates[dates.indexOf(selectedDate) + offset];
    if (target) selectDate(target);
  }

  function render() {
    strip.replaceChildren(...dates.map(dateToken => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `date-button${dateToken === selectedDate ? " active" : ""}`;
      button.setAttribute("aria-pressed", String(dateToken === selectedDate));
      const weekday = document.createElement("span");
      weekday.className = "date-weekday";
      weekday.textContent = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(parseNurKDate(dateToken));
      const date = document.createElement("span");
      date.className = "date-calendar";
      date.textContent = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(parseNurKDate(dateToken));
      button.append(weekday, date);
      button.addEventListener("click", () => selectDate(dateToken));
      return button;
    }));
    const visible = items.filter(item => item.publishedAt === selectedDate);
    grid.replaceChildren(...visible.map(cartoon => {
      const card = document.createElement("article");
      card.className = "cartoon-card";
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.setAttribute("aria-label", `Open ${cartoon.title}`);
      trigger.append(createArtwork(cartoon));
      trigger.addEventListener("click", () => openLightbox(cartoon, items));
      const meta = document.createElement("div");
      meta.className = "card-meta";
      meta.textContent = `${cartoon.title} - ${formatDateToken(cartoon.publishedAt)}`;
      card.append(trigger, meta);
      return card;
    }));
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Our first Dutch cartoons are coming soon.";
      grid.append(empty);
    }
    const index = dates.indexOf(selectedDate);
    newer.setAttribute("aria-disabled", String(index <= 0));
    older.setAttribute("aria-disabled", String(index < 0 || index >= dates.length - 1));
    strip.hidden = !dates.length;
    position.textContent = visible.length > 1 ? `${visible.length} cartoons on this day` : "";
  }

  newer.addEventListener("click", () => move(-1));
  older.addEventListener("click", () => move(1));
  carousel.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  let start = null;
  let suppressClickUntil = 0;
  grid.addEventListener("pointerdown", event => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    start = { x: event.clientX, y: event.clientY };
  });
  grid.addEventListener("pointercancel", () => { start = null; });
  grid.addEventListener("pointerup", event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      suppressClickUntil = Date.now() + 400;
      move(dx < 0 ? 1 : -1);
    }
  });
  grid.addEventListener("click", event => {
    if (Date.now() < suppressClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
  render();
})();
