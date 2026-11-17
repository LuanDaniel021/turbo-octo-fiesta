const checks = [...document.querySelectorAll('.checklist input')];
    const bar = document.getElementById('progressBar');
    const text = document.getElementById('progressText');
    function updateProgress() {
      const done = checks.filter(input => input.checked).length;
      bar.style.width = (done / checks.length * 100) + '%';
      text.textContent = done + ' de ' + checks.length + ' etapas concluídas';
    }
    checks.forEach(input => input.addEventListener('change', updateProgress));
