const participants = [
  { name: "Хозе-Рауль Капабланка", role: "Чемпион мира по шахматам" },
  { name: "Эммануил Ласкер", role: "Чемпион мира по шахматам" },
  { name: "Александр Алехин", role: "Чемпион мира по шахматам" },
  { name: "Арон Нимцович", role: "Чемпион мира по шахматам" },
  { name: "Рихард Рети", role: "Чемпион мира по шахматам" },
  { name: "Остап Бендер", role: "Гроссмейстер" },
];

const participantImage = "assets/images/participant.png";
const participantImageWebp = "assets/images/participant.webp";

function createParticipantCard(participant, participantIndex, isClone = false) {
  const article = document.createElement("article");
  article.className = "participant-card";
  article.dataset.participantIndex = String(participantIndex);

  if (isClone) {
    article.dataset.clone = "true";
    article.setAttribute("aria-hidden", "true");
  }

  const picture = document.createElement("picture");
  const source = document.createElement("source");
  source.srcset = participantImageWebp;
  source.type = "image/webp";

  const image = document.createElement("img");
  image.className = "participant-card__photo";
  image.src = participantImage;
  image.alt = "";
  image.width = 320;
  image.height = 320;
  picture.append(source, image);

  const title = document.createElement("h3");
  title.className = "participant-card__title";
  title.textContent = participant.name;

  const role = document.createElement("p");
  role.className = "participant-card__role";
  role.textContent = participant.role;

  const link = document.createElement("a");
  link.className = "participant-card__link";
  link.href = "#participants";
  link.textContent = "Подробнее";
  link.setAttribute("aria-label", `Подробнее: ${participant.name}`);

  if (isClone) {
    link.tabIndex = -1;
  }

  article.append(picture, title, role, link);
  return article;
}

function initParticipantsCarousel() {
  const viewport = document.querySelector(".participants__viewport");
  const list = document.querySelector("[data-participants-list]");
  const counters = [
    document.querySelector("[data-participant-counter]"),
    document.querySelector("[data-participant-counter-mobile]"),
  ].filter(Boolean);
  const prevButtons = [
    document.querySelector("[data-participant-prev]"),
    document.querySelector("[data-participant-prev-mobile]"),
  ].filter(Boolean);
  const nextButtons = [
    document.querySelector("[data-participant-next]"),
    document.querySelector("[data-participant-next-mobile]"),
  ].filter(Boolean);

  if (!viewport || !list) {
    return;
  }

  const mobileMedia = window.matchMedia("(max-width: 767px)");
  const tabletMedia = window.matchMedia("(max-width: 1024px)");
  let index = 0;
  let position = 0;
  let cloneCount = 0;
  let timerId = null;
  let resizeFrame = null;
  let isAnimating = false;

  function visibleCount() {
    if (mobileMedia.matches) {
      return 1;
    }

    return tabletMedia.matches ? 2 : 3;
  }

  function normalizeIndex(nextIndex) {
    return (nextIndex + participants.length) % participants.length;
  }

  function formatCounter() {
    return `<strong>${index + 1}</strong> / ${participants.length}`;
  }

  function updateCounter() {
    counters.forEach((counter) => {
      counter.innerHTML = formatCounter();
    });
  }

  function setCardAccessibility() {
    const visibleIndexes = Array.from({ length: visibleCount() }, (_, offset) => {
      return normalizeIndex(index + offset);
    });

    Array.from(list.children).forEach((card) => {
      const link = card.querySelector(".participant-card__link");
      const isClone = card.dataset.clone === "true";
      const isVisible = !isClone && visibleIndexes.includes(Number(card.dataset.participantIndex));

      card.setAttribute("aria-hidden", isVisible ? "false" : "true");

      if (link) {
        link.tabIndex = isVisible ? 0 : -1;
      }
    });
  }

  function setPosition(nextPosition, shouldAnimate = true) {
    const targetCard = list.children[nextPosition];

    if (!targetCard) {
      return;
    }

    if (!shouldAnimate) {
      list.classList.add("is-instant");
    }

    position = nextPosition;
    list.style.transform = `translateX(-${targetCard.offsetLeft}px)`;

    if (!shouldAnimate) {
      list.getBoundingClientRect();
      list.classList.remove("is-instant");
    }
  }

  function renderTrack() {
    const fragment = document.createDocumentFragment();
    isAnimating = false;
    cloneCount = visibleCount();

    participants.slice(-cloneCount).forEach((participant, cloneIndex) => {
      const participantIndex = participants.length - cloneCount + cloneIndex;
      fragment.append(createParticipantCard(participant, participantIndex, true));
    });

    participants.forEach((participant, participantIndex) => {
      fragment.append(createParticipantCard(participant, participantIndex));
    });

    participants.slice(0, cloneCount).forEach((participant, participantIndex) => {
      fragment.append(createParticipantCard(participant, participantIndex, true));
    });

    list.replaceChildren(fragment);
    setPosition(index + cloneCount, false);
    updateCounter();
    setCardAccessibility();
  }

  function goTo(nextIndex) {
    if (isAnimating) {
      return;
    }

    index = normalizeIndex(nextIndex);
    updateCounter();
    setCardAccessibility();
    isAnimating = true;
    setPosition(nextIndex + cloneCount);
  }

  function startAuto() {
    stopAuto();
    timerId = window.setInterval(() => {
      goTo(index + 1);
    }, 4000);
  }

  function stopAuto() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  prevButtons.forEach((button) => {
    button.addEventListener("click", () => {
      goTo(index - 1);
      startAuto();
    });
  });

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      goTo(index + 1);
      startAuto();
    });
  });

  list.addEventListener("transitionend", (event) => {
    if (event.propertyName !== "transform") {
      return;
    }

    isAnimating = false;

    if (position < cloneCount || position >= participants.length + cloneCount) {
      setPosition(index + cloneCount, false);
    }

    setCardAccessibility();
  });

  viewport.addEventListener("mouseenter", stopAuto);
  viewport.addEventListener("mouseleave", startAuto);
  viewport.addEventListener("focusin", stopAuto);
  viewport.addEventListener("focusout", startAuto);

  mobileMedia.addEventListener("change", renderTrack);
  tabletMedia.addEventListener("change", renderTrack);
  window.addEventListener("resize", () => {
    if (resizeFrame !== null) {
      window.cancelAnimationFrame(resizeFrame);
    }

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      setPosition(index + cloneCount, false);
    });
  });

  renderTrack();
  startAuto();
}

function initStagesCarousel() {
  const carousel = document.querySelector(".stages-carousel");
  const track = carousel?.querySelector(".stages-grid");
  const prev = document.querySelector("[data-stage-prev]");
  const next = document.querySelector("[data-stage-next]");
  const dotsRoot = document.querySelector("[data-stage-dots]");
  const slideCount = Number(carousel?.dataset.stageSlides);

  if (!track || !slideCount || !prev || !next || !dotsRoot) {
    return;
  }

  let index = 0;
  const dots = Array.from({ length: slideCount }, (_, dotIndex) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Показать слайд ${dotIndex + 1}`);
    dot.addEventListener("click", () => goTo(dotIndex));
    dotsRoot.append(dot);
    return dot;
  });

  function update() {
    prev.disabled = index === 0;
    next.disabled = index === slideCount - 1;
    track.style.setProperty("--stage-index", index);
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      dot.setAttribute("aria-current", dotIndex === index ? "true" : "false");
    });
  }

  function goTo(nextIndex) {
    index = Math.min(Math.max(nextIndex, 0), slideCount - 1);
    update();
  }

  prev.addEventListener("click", () => goTo(index - 1));
  next.addEventListener("click", () => goTo(index + 1));
  update();
}

document.addEventListener("DOMContentLoaded", () => {
  initParticipantsCarousel();
  initStagesCarousel();
});
