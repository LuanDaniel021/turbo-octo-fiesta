(() => {
  const searchInput = document.getElementById('equipmentSearch');
  const equipmentCards = Array.from(document.querySelectorAll('#equipmentGrid .item'));
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

    const map = L.map(mapElement, { scrollWheelZoom: false, zoomControl: false }).setView([-15.7939, -47.8828], 13);
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const samplePoints = [
      { name: 'Ponto de exemplo 1', position: [-15.7868, -47.8912] },
      { name: 'Ponto de exemplo 2', position: [-15.8002, -47.8875] },
      { name: 'Ponto de exemplo 3', position: [-15.7901, -47.8708] },
      { name: 'Ponto de exemplo 4', position: [-15.8050, -47.8750] },
      { name: 'Ponto de exemplo 5', position: [-15.7805, -47.8790] }
    ];

    const markers = samplePoints.map(point =>
      L.marker(point.position)
        .addTo(map)
        .bindPopup('<strong>' + point.name + '</strong><br>Localização demonstrativa')
    );

    L.featureGroup(markers).addTo(map);
    map.fitBounds(L.featureGroup(markers).getBounds().pad(0.18));
  }


  // SISTEMA DE MODAIS
  const OVERLAY = document.getElementById('overlay');
  let MODAL = null;

  function closeModal() {
    if (MODAL) {
      MODAL.classList.remove('open');
      MODAL = null;
    }

    if (!MODAL) OVERLAY?.classList.remove('open');
  }

  document.querySelectorAll('.open-modal').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const modalId = trigger.dataset.modal;
      const targetModal = modalId ? document.getElementById(modalId) : null;
      if (!targetModal) return;

      if (MODAL && MODAL !== targetModal) {
        MODAL.classList.remove('open');
      }

      MODAL = targetModal;
      MODAL.classList.add('open');
      OVERLAY?.classList.add('open');
    });
  });

  document.querySelectorAll('.close-modal').forEach(control => {
    control.addEventListener('click', closeModal);
  });

  OVERLAY?.addEventListener('click', () => {
    if (MODAL) closeModal();
    else OVERLAY.classList.remove('open');
  });

  searchInput?.addEventListener('input', filterEquipment);

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
