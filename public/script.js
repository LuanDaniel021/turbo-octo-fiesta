
(async () => {

  const DATA_SOURCE = "./data";

  const DATA_FILES = {
    pontos: "pontos.json"
  }

  const DATA_LIST_FILES = [
    DATA_FILES.pontos
  ];

  let DATA_READY = {};

  try {
    DATA_READY = await loader(DATA_SOURCE, DATA_LIST_FILES);
  } catch (error) {
    console.error("A aplicação continuará sem os dados dos pontos.", error);
  }

  const POINTS = Array.isArray(DATA_READY[DATA_FILES.pontos]?.points)
    ? DATA_READY[DATA_FILES.pontos].points
    : [];

  const MAP_TAG = document.querySelector(".map-tag");

  const OVERLAY = document.getElementById('overlay');

  const TOP_HEADER = document.querySelector('.top');
  const NAV_TOGGLE = document.querySelector('.nav-toggle');
  const MAIN_NAVIGATION = document.getElementById('main-navigation');
  const SEARCH_INPUT = document.getElementById('equipmentSearch');
  const EQUIPMENT_CARDS = Array.from(document.querySelectorAll('#equipmentGrid .equipment-item'));
  const EQUIPMENT_COUNT = document.getElementById('equipmentCount');
  const NAV_LINKS = Array.from(document.querySelectorAll('.top nav a'));
  const SECTIONS = NAV_LINKS
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const SCROLL_THRESHOLD = 8;
  
  let PREVIOUS_SCROLL_Y = window.scrollY;
  
  let LAST_TRIGGER = null;

  let MODAL = null;

  function filterEquipment() {
    const term = (SEARCH_INPUT?.value || '').trim().toLocaleLowerCase('pt-BR');
    let visible = 0;

    EQUIPMENT_CARDS.forEach(card => {
      const matches = card.textContent.toLocaleLowerCase('pt-BR').includes(term);
      card.hidden = !matches;
      if (matches) visible++;
    });

    if (EQUIPMENT_COUNT) {
      EQUIPMENT_COUNT.textContent = visible + (visible === 1 ? ' categoria encontrada' : ' categorias encontradas');
    }
  }

  function initializeMap() {
    const mapElement = document.getElementById('collectionMap');
    if (!mapElement || typeof L === 'undefined') return;

    const map = L.map(mapElement, { zoomControl: false }).setView([-15.7939, -47.8828], 13);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markers = POINTS.map(point => {
      const [latitude, longitude] = point.position;
      const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latitude + "," + longitude)}`;
      const coordinates = `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;

      const popup = document.createElement("div");

      const title = document.createElement("strong");
      title.textContent = point.name || "Ponto de recebimento";

      const route = document.createElement("a");
      route.className = "map-route-link";
      route.href = routeUrl;
      route.target = "_blank";
      route.rel = "noopener noreferrer";
      route.textContent = "Google Maps Rota";

      const location = document.createElement("div");
      location.className = "map-popup-coordinates";
      location.textContent = coordinates;

      popup.append(title, route, location);

      return L.marker(point.position)
        .addTo(map)
        .bindPopup(popup);
    });

    if (markers.length) {
      const markerGroup = L.featureGroup(markers).addTo(map);
      map.fitBounds(markerGroup.getBounds(), {
        padding: [24, 24],
        maxZoom: 14
      });
    }
  }

  function createMapPoint(item, index) {
    const card = document.createElement("article");
    card.className = "map-point-card open-modal";
    card.dataset.modal = item.id ? `modal-${item.id}` : "";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-haspopup", "dialog");

    const num = document.createElement("span");
    num.className = "map-point-number";
    num.textContent = String(index + 1).padStart(2, "0");

    const info = document.createElement("div");
    info.className = "map-point-info";

    const title = document.createElement("h3");
    title.textContent = item.name || `Ponto ${index + 1}`;

    const location = document.createElement("p");
    location.className = "map-point-location";
    const place = item.location || {};
    location.textContent = [place.city, place.state, place.country].filter(Boolean).join(" · ") || "Localização não informada";



    info.append(title, location);
    card.append(num, info);

    return card;
  }

  function createModalSection(data) {
    const modalId = `modal-${data.id}`;
    const titleId = `${modalId}-titulo`;

    const section = document.createElement("section");
    section.id = modalId;
    section.className = "modal";
    section.setAttribute("role", "dialog");
    section.setAttribute("aria-modal", "true");
    section.setAttribute("tabindex", "-1");
    section.setAttribute("aria-labelledby", titleId);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "close-modal";
    closeBtn.setAttribute("aria-label", "Fechar modal");
    closeBtn.textContent = "✕";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const kicker = document.createElement("div");
    kicker.className = "section-kicker";
    kicker.textContent = "Ponto de recebimento";

    const heading = document.createElement("h2");
    heading.id = titleId;
    heading.textContent = data.name;

    const intro = document.createElement("p");
    intro.className = "intro";
    intro.textContent = data.intro || data.description || "";

    modalContent.append(kicker, heading, intro);

    const place = data.location || {};
    const address = [place.address, [place.city, place.state].filter(Boolean).join("/")].filter(Boolean).join(" — ");
    if (address || data.hours) {
      const addressHeading = document.createElement("h3");
      addressHeading.textContent = "Endereço e atendimento";
      modalContent.append(addressHeading);

      if (address) {
        const addressText = document.createElement("p");
        addressText.textContent = address;
        modalContent.append(addressText);
      }

      if (data.hours) {
        const hoursText = document.createElement("p");
        hoursText.textContent = data.hours;
        modalContent.append(hoursText);
      }
    }

    for (const item of data.details || []) {
      const h3 = document.createElement("h3");
      h3.textContent = item.title;

      const p = document.createElement("p");
      p.textContent = item.text;

      modalContent.append(h3, p);
    }

    if (data.instructions) {
      const h3 = document.createElement("h3");
      h3.textContent = data.instructions.title || "Orientações";

      const p = document.createElement("p");
      p.textContent = data.instructions.text || "";

      modalContent.append(h3, p);
    }

    if (data.note) {
      const noteDiv = document.createElement("div");
      noteDiv.className = "note";

      const separatorIndex = data.note.indexOf(":");
      if (separatorIndex !== -1) {
        const strong = document.createElement("strong");
        strong.textContent = data.note.slice(0, separatorIndex + 1);
        noteDiv.append(strong, data.note.slice(separatorIndex + 1));
      } else {
        noteDiv.textContent = data.note;
      }

      modalContent.append(noteDiv);
    }

    const position = data.position;
    if (Array.isArray(position) && position.length === 2 && position.every(Number.isFinite)) {
      const [latitude, longitude] = position;
      const routeLink = document.createElement("a");
      routeLink.className = "modal-route-link";
      routeLink.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latitude + "," + longitude)}`;
      routeLink.target = "_blank";
      routeLink.rel = "noopener noreferrer";
      routeLink.textContent = "Traçar rota no Google Maps";
      modalContent.append(routeLink);
    }

    section.append(closeBtn, modalContent);
    return section;
  }

  function renderPontos(items) {
    const pointsContainer = document.getElementById("mapPoints");
    const modalsContainer = document.getElementById("modals");

    items.forEach((item, index) => {
      if (pointsContainer) {
        pointsContainer.appendChild(createMapPoint(item, index));
      }

      if (modalsContainer && item.id) {
        modalsContainer.appendChild(createModalSection(item));
      }
    });
  }

  function getModalFocusables(modal) {
    return Array.from(modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.getClientRects().length > 0);
  }

  function closeModal() {
    if (!MODAL) return;

    MODAL.classList.remove('open');
    MODAL = null;
    OVERLAY?.classList.remove('open');
    document.body.classList.remove('modal-open');

    const trigger = LAST_TRIGGER;
    LAST_TRIGGER = null;
    trigger?.focus();
  }

  function openModal(trigger) {
    const modalId = trigger.dataset.modal;
    const targetModal = modalId ? document.getElementById(modalId) : null;
    if (!targetModal) return;

    if (MODAL === targetModal) return;
    if (MODAL) MODAL.classList.remove('open');

    MODAL = targetModal;
    LAST_TRIGGER = trigger;
    MODAL.classList.add('open');
    OVERLAY?.classList.add('open');
    document.body.classList.add('modal-open');

    const closeControl = MODAL.querySelector('.close-modal');
    (closeControl || MODAL).focus();
  }

  function setNavigationOpen(open) {
    if (!NAV_TOGGLE || !MAIN_NAVIGATION) return;
    NAV_TOGGLE.setAttribute('aria-expanded', String(open));
    NAV_TOGGLE.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    MAIN_NAVIGATION.classList.toggle('open', open);
  }

  renderPontos(POINTS);

  filterEquipment();

  initializeMap();

  if (MAP_TAG) MAP_TAG.textContent = `${POINTS.length} ${POINTS.length === 1 ? "ponto" : "pontos"}`;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const activeLink = NAV_LINKS.find(link => link.getAttribute('href') === '#' + entry.target.id);
        NAV_LINKS.forEach(link => {
          const active = link === activeLink;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    SECTIONS.forEach(section => observer.observe(section));
  }

  OVERLAY?.addEventListener('click', () => {
    if (MODAL) closeModal();
  });

  SEARCH_INPUT?.addEventListener('input', filterEquipment);

  NAV_TOGGLE?.addEventListener('click', () => {
    const isOpen = NAV_TOGGLE.getAttribute('aria-expanded') === 'true';
    setNavigationOpen(!isOpen);
  });

  MAIN_NAVIGATION?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setNavigationOpen(false));
  });

  document.querySelectorAll('.open-modal').forEach(trigger => {
    trigger.addEventListener('click', event => {
      if (trigger.tagName === 'A') event.preventDefault();
      openModal(trigger);
    });

    if (trigger.getAttribute('role') === 'button') {
      trigger.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openModal(trigger);
      });
    }
  });

  document.querySelectorAll('.close-modal').forEach(control => {
    control.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', event => {
    if (!MODAL) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusables = getModalFocusables(MODAL);
    if (!focusables.length) {
      event.preventDefault();
      MODAL.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener('click', event => {
    if (NAV_TOGGLE?.getAttribute('aria-expanded') !== 'true') return;
    if (TOP_HEADER?.contains(event.target)) return;
    setNavigationOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && NAV_TOGGLE?.getAttribute('aria-expanded') === 'true') {
      setNavigationOpen(false);
      NAV_TOGGLE.focus();
    }
  });

  window.addEventListener('scroll', () => {
    if (!TOP_HEADER) return;

    const currentScrollY = Math.max(0, window.scrollY);
    const difference = currentScrollY - PREVIOUS_SCROLL_Y;
    const passedThreshold = Math.abs(difference) >= SCROLL_THRESHOLD;

    const navigationWasOpen = NAV_TOGGLE?.getAttribute('aria-expanded') === 'true';

    if (passedThreshold && navigationWasOpen) {
      setNavigationOpen(false);
      TOP_HEADER.classList.remove('header-hidden');
    } else if (currentScrollY <= 12) {
      TOP_HEADER.classList.remove('header-hidden');
    } else if (passedThreshold) {
      TOP_HEADER.classList.toggle('header-hidden', difference > 0);
    }

    PREVIOUS_SCROLL_Y = currentScrollY;
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1050) setNavigationOpen(false);
  }, { passive: true });

})();
