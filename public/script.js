(() => {
  const checks = Array.from(document.querySelectorAll('.checklist input[type="checkbox"]'));
  const bar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const resetButton = document.getElementById('resetChecklist');
  const searchInput = document.getElementById('equipmentSearch');
  const equipmentCards = Array.from(document.querySelectorAll('#equipmentGrid .item'));
  const equipmentCount = document.getElementById('equipmentCount');
  const printButton = document.getElementById('printGuide');
  const storageKey = 'guia-descarte-checklist-v1';

  function loadChecklist() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      checks.forEach((input, index) => {
        input.checked = Boolean(saved[index]);
      });
    } catch (error) {
      // A página continua funcional mesmo se o armazenamento estiver indisponível.
    }
  }

  function saveChecklist() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(checks.map(input => input.checked)));
    } catch (error) {
      // O checklist ainda funciona durante a sessão.
    }
  }

  function updateProgress() {
    const done = checks.filter(input => input.checked).length;
    const total = checks.length;
    const percentage = total ? (done / total) * 100 : 0;
    if (bar) bar.style.width = percentage + '%';
    if (progressText) {
      progressText.textContent = done + ' de ' + total + ' etapas concluídas';
    }
    saveChecklist();
  }

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

  checks.forEach(input => input.addEventListener('change', updateProgress));
  resetButton?.addEventListener('click', () => {
    checks.forEach(input => { input.checked = false; });
    updateProgress();
  });
  searchInput?.addEventListener('input', filterEquipment);
  printButton?.addEventListener('click', () => window.print());

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

  loadChecklist();
  updateProgress();
  filterEquipment();
})();
