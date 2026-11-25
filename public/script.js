
(async () => {

  const SOURCE = "./data";

  const FILES = {
      pontos:"pontos.json"
  }

  const LIST_FILES = [
      FILES.pontos
  ];

  const DATA_READY = await loader( SOURCE, LIST_FILES );

  const POINTS = DATA_READY[FILES.pontos].points;

  const mapTag = document.querySelector(".map-tag");
  if (mapTag) mapTag.textContent = `${POINTS.length} ${POINTS.length === 1 ? "ponto" : "pontos"}`;

  const OVERLAY = document.getElementById('overlay');

  let LAST_TRIGGER = null;

  let MODAL = null;

  const searchInput = document.getElementById('equipmentSearch');
  const equipmentCards = Array.from(document.querySelectorAll('#equipmentGrid .equipment-item'));
  const equipmentCount = document.getElementById('equipmentCount');

  function filterEquipment() {
    const term = (searchInput?.value || '').trim().toLocaleLowerCase('pt-BR');
    let visible = 0;

    equipmentCards.forEach(card => {
      const matches = card.textContent.toLocaleLowerCase('pt-BR').includes(term);
      card.hidden = !matches;
      if (matches) visible++;
    });

    if (equipmentCount) {
      equipmentCount.textContent = visible + (visible === 1 ? ' categoria encontrada' : ' categorias encontradas');
    }
  }

  function initializeMap() {
    const mapElement = document.getElementById('collectionMap');
    if (!mapElement || typeof L === 'undefined') return;

    const map = L.map(mapElement, {zoomControl:false}).setView([-15.7939, -47.8828], 13);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markers = POINTS.map(point => {
      const [latitude, longitude] = point.position;
      const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(latitude + "," + longitude)}`;
      const coordinates = `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;

      return L.marker(point.position)
        .addTo(map)
        .bindPopup(
          '<strong>' + point.name + '</strong>' +
          '<a class="map-route-link" href="' + routeUrl + '" target="_blank" rel="noopener noreferrer">Google Maps Rota</a>' +
          '<div class="map-popup-coordinates">' + coordinates + '</div>'
        );
    });

    const markerGroup = L.featureGroup(markers).addTo(map);
    map.fitBounds(markerGroup.getBounds(), {
      padding: [24, 24],
      maxZoom: 14
    });
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

  renderPontos(POINTS)

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

  OVERLAY?.addEventListener('click', () => {
    if (MODAL) closeModal();
  });

  searchInput?.addEventListener('input', filterEquipment);

  // CABEÇALHO INTELIGENTE — direção da rolagem
  const topHeader = document.querySelector('.top');
  let previousScrollY = window.scrollY;
  const scrollThreshold = 8;

  window.addEventListener('scroll', () => {
    if (!topHeader) return;

    const currentScrollY = Math.max(0, window.scrollY);
    const difference = currentScrollY - previousScrollY;
    const passedThreshold = Math.abs(difference) >= scrollThreshold;

    const navigationWasOpen = navToggle?.getAttribute('aria-expanded') === 'true';

    if (passedThreshold && navigationWasOpen) {
      setNavigationOpen(false);
      topHeader.classList.remove('header-hidden');
    } else if (currentScrollY <= 12) {
      topHeader.classList.remove('header-hidden');
    } else if (passedThreshold) {
      topHeader.classList.toggle('header-hidden', difference > 0);
    }

    previousScrollY = currentScrollY;
  }, { passive: true });

  const navToggle = document.querySelector('.nav-toggle');
  const mainNavigation = document.getElementById('main-navigation');

  function setNavigationOpen(open) {
    if (!navToggle || !mainNavigation) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    mainNavigation.classList.toggle('open', open);
  }

  navToggle?.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    setNavigationOpen(!isOpen);
  });

  document.addEventListener('click', event => {
    if (navToggle?.getAttribute('aria-expanded') !== 'true') return;
    if (topHeader?.contains(event.target)) return;
    setNavigationOpen(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1050) setNavigationOpen(false);
  }, { passive: true });

  mainNavigation?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => setNavigationOpen(false));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
      setNavigationOpen(false);
      navToggle.focus();
    }
  });

  const navLinks = Array.from(document.querySelectorAll('.top nav a'));
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const activeLink = navLinks.find(link => link.getAttribute('href') === '#' + entry.target.id);
        navLinks.forEach(link => {
          const active = link === activeLink;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    sections.forEach(section => observer.observe(section));
  }

  filterEquipment();
  initializeMap();
  
})();
