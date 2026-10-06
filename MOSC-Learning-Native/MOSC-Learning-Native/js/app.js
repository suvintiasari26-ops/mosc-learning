/**
 * MOSC Learning - Homepage Engine
 */
(function() {
  const C = window.MOSC_CONTENT.chapters;
  const all = C.flatMap(c => c.items.map(i => ({ ...i, chapter: c })));
  const icon = (name, extra = '') => `<svg class="icon ${extra}"><use href="#${name}"></use></svg>`;

  // Render Sidebar
  const nav = document.getElementById('chapterNav');
  if (nav) {
    nav.innerHTML = C.map(c => {
      const cDone = c.items.filter(i => localStorage.getItem('done-' + i.id) === '1').length;
      return `
        <div class="chapter">
          <div class="chapter-title">
            <span class="num">BAB ${c.number}: ${c.title}</span>
            <span class="chapter-badge">${cDone}/${c.items.length}</span>
          </div>
          <div class="chapter-items">
            ${c.items.map(i => {
              const isDone = localStorage.getItem('done-' + i.id) === '1';
              return `
                <a class="nav-item" href="materi.html?id=${encodeURIComponent(i.id)}">
                  <span class="nav-item-text">
                    <span class="nav-item-id">${i.id}</span>
                    <span>${i.title}</span>
                  </span>
                  ${isDone ? icon('check', 'nav-check') : ''}
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  // Resume Learning Banner
  const resumeContainer = document.getElementById('resumeBanner');
  if (resumeContainer) {
    const lastReadId = localStorage.getItem('mosc-last-read') || '1.1';
    const lastItem = all.find(a => a.id === lastReadId) || all[0];
    const doneCount = all.filter(a => localStorage.getItem('done-' + a.id) === '1').length;
    const percent = Math.round((doneCount / all.length) * 100);

    resumeContainer.innerHTML = `
      <div class="resume-card">
        <div class="resume-info">
          <span>Lanjutkan Belajar Terakhir Anda</span>
          <strong>${lastItem.id} ${lastItem.title} (BAB ${lastItem.chapter.number})</strong>
          <small style="color:var(--text-muted);font-weight:600">Progress Pembelajaran: ${doneCount} dari ${all.length} materi diselesaikan (${percent}%)</small>
        </div>
        <a class="btn primary" href="materi.html?id=${encodeURIComponent(lastItem.id)}">
          Lanjutkan Membaca ${icon('arrow')}
        </a>
      </div>
    `;
  }

  // Dynamic Stats
  const stats = document.getElementById('stats');
  if (stats) {
    const totalItems = all.length;
    const doneCount = all.filter(a => localStorage.getItem('done-' + a.id) === '1').length;
    const percent = Math.round((doneCount / totalItems) * 100);

    stats.innerHTML = `
      <div class="stat">
        <strong>3</strong>
        <span>Bab Kurikulum Lengkap</span>
      </div>
      <div class="stat">
        <strong>${totalItems}</strong>
        <span>Subbab Materi & Kasus</span>
      </div>
      <div class="stat">
        <strong style="color:var(--primary)">${doneCount}</strong>
        <span>Materi Telah Diselesaikan</span>
      </div>
      <div class="stat">
        <strong style="color:var(--success)">${percent}%</strong>
        <span>Progres Kelulusan Total</span>
      </div>
    `;
  }

  // Chapter Cards with Progress Bars
  const cards = document.getElementById('chapterCards');
  if (cards) {
    cards.innerHTML = C.map(c => {
      const cDone = c.items.filter(i => localStorage.getItem('done-' + i.id) === '1').length;
      const cPercent = Math.round((cDone / c.items.length) * 100);
      const firstId = c.items[0].id;

      return `
        <div class="chapter-card">
          <div class="number">BAB ${c.number} · KURIKULUM</div>
          <h3>${c.title}</h3>
          <p>${c.items.length} bagian materi terstruktur termasuk studi kasus industri dan latihan evaluasi.</p>
          
          <div class="card-progress-bar">
            <div class="card-progress-fill" style="width: ${cPercent}%;"></div>
          </div>
          
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:12.5px;color:var(--text-muted);font-weight:600">
            <span>Progress Bab:</span>
            <span style="color:var(--primary)">${cDone}/${c.items.length} Selesai (${cPercent}%)</span>
          </div>

          <a class="btn primary" style="width:100%;justify-content:center" href="materi.html?id=${encodeURIComponent(firstId)}">
            ${cDone > 0 ? 'Lanjutkan Bab' : 'Mulai Belajar'} ${icon('arrow')}
          </a>
        </div>
      `;
    }).join('');
  }

  // Theme Management
  function applyTheme() {
    const isDark = localStorage.getItem('mosc-theme') === 'dark';
    document.body.classList.toggle('dark', isDark);
    const b = document.getElementById('themeBtn');
    if (b) {
      b.innerHTML = icon(isDark ? 'sun' : 'moon');
      b.title = isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap';
    }
  }

  document.getElementById('themeBtn')?.addEventListener('click', () => {
    localStorage.setItem('mosc-theme', document.body.classList.contains('dark') ? 'light' : 'dark');
    applyTheme();
  });

  document.getElementById('menuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  applyTheme();
})();
