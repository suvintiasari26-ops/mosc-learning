/**
 * MOSC Learning - Enhanced Interactive Reader Engine
 */
(function() {
  const C = window.MOSC_CONTENT.chapters;
  const all = C.flatMap(c => c.items.map(i => ({ ...i, chapter: c })));
  
  const esc = s => String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  const icon = (name, extraClass = '') => `<svg class="icon ${extraClass}"><use href="#${name}"></use></svg>`;

  // Helper for reading time estimation
  function getReadingTime(contentArray) {
    const text = contentArray.join(' ');
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return minutes;
  }

  // Current subbab ID
  const urlParams = new URLSearchParams(window.location.search);
  const currentId = urlParams.get('id') || '1.1';
  const currentItem = all.find(a => a.id === currentId) || all[0];

  // Save last read to localStorage for homepage resume
  try {
    localStorage.setItem('mosc-last-read', currentItem.id);
  } catch(e) {}

  // Update Topbar Progress
  function updateGlobalProgress() {
    const total = all.length;
    const doneCount = all.filter(a => localStorage.getItem('done-' + a.id) === '1').length;
    const percent = Math.round((doneCount / total) * 100);

    const progContainer = document.getElementById('topbarProgress');
    if (progContainer) {
      progContainer.innerHTML = `
        <div class="topbar-progress-bar-wrap">
          <div class="topbar-progress-bar-fill" style="width: ${percent}%;"></div>
        </div>
        <span>${doneCount}/${total} Selesai (${percent}%)</span>
      `;
    }

    const sideProg = document.getElementById('sidebarProgress');
    if (sideProg) {
      sideProg.textContent = `${doneCount} dari ${total} materi diselesaikan (${percent}%)`;
    }
  }

  // Render Sidebar Navigation
  function renderSidebar() {
    const nav = document.getElementById('chapterNav');
    if (!nav) return;

    nav.innerHTML = C.map(c => {
      const chapterDone = c.items.filter(i => localStorage.getItem('done-' + i.id) === '1').length;
      return `
        <div class="chapter" data-chapter="${c.number}">
          <div class="chapter-title">
            <span class="num">BAB ${c.number}: ${esc(c.title)}</span>
            <span class="chapter-badge">${chapterDone}/${c.items.length}</span>
          </div>
          <div class="chapter-items">
            ${c.items.map(i => {
              const isActive = i.id === currentItem.id;
              const isDone = localStorage.getItem('done-' + i.id) === '1';
              return `
                <a class="nav-item ${isActive ? 'active' : ''}" href="materi.html?id=${encodeURIComponent(i.id)}" id="nav-${i.id.replace('.', '_')}">
                  <span class="nav-item-text">
                    <span class="nav-item-id">${i.id}</span>
                    <span>${esc(i.title)}</span>
                  </span>
                  ${isDone ? icon('check', 'nav-check') : ''}
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Smoothly scroll active nav-item into view
    setTimeout(() => {
      const activeEl = document.querySelector('.nav-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 100);
  }

  // Table Generator from Markdown lines
  function parseTable(lines) {
    if (!lines || lines.length < 2) return '';
    const headers = lines[0].split('|').slice(1, -1).map(h => h.trim());
    const bodyRows = lines.slice(2).map(row => row.split('|').slice(1, -1).map(c => c.trim()));

    return `
      <div class="table-responsive">
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${bodyRows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Quiz Parser and Renderer
  function renderQuizWidget(quizData, quizIndex) {
    return `
      <div class="quiz-card" data-quiz-index="${quizIndex}" data-answer="${quizData.answer}">
        <div class="quiz-q-num">Pertanyaan ${quizIndex + 1}</div>
        <div class="quiz-question">${esc(quizData.question)}</div>
        <div class="quiz-options">
          ${quizData.options.map((opt, optIdx) => `
            <button class="quiz-opt-btn" data-opt-index="${optIdx}">
              <span class="quiz-opt-letter">${String.fromCharCode(65 + optIdx)}</span>
              <span>${esc(opt)}</span>
            </button>
          `).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback-${quizIndex}">
          <strong>${icon('check')} Penjelasan:</strong> ${esc(quizData.explanation)}
        </div>
      </div>
    `;
  }

  // Productivity Calculator HTML
  function getProductivityCalculatorHTML() {
    return `
      <div class="calc-card" id="productivityCalc">
        <div class="calc-title">
          <h3>${icon('calc')} Kalkulator Produktivitas Multifaktor (MFP)</h3>
          <span class="calc-badge">Interaktif</span>
        </div>
        <p class="calc-desc">Masukkan parameter operasional di bawah untuk menghitung Produktivitas Tenaga Kerja dan Multifactor Productivity secara instan:</p>
        
        <div class="calc-grid">
          <div class="calc-field">
            <label class="calc-label">Jumlah Output Produk:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcProdOutput" value="10000" min="1">
              <span class="calc-unit">Unit</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Harga Jual per Unit:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcProdPrice" value="50000" min="1">
              <span class="calc-unit">Rp/Unit</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Jam Kerja Tenaga Kerja:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcProdLaborHours" value="2000" min="1">
              <span class="calc-unit">Jam</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Tarif Upah per Jam:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcProdLaborRate" value="30000" min="0">
              <span class="calc-unit">Rp/Jam</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Total Biaya Bahan Baku:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcProdMaterial" value="150000000" min="0">
              <span class="calc-unit">Rp</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Biaya Modal & Overhead:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcProdCapital" value="30000000" min="0">
              <span class="calc-unit">Rp</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Biaya Energi & Utilitas:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcProdEnergy" value="20000000" min="0">
              <span class="calc-unit">Rp</span>
            </div>
          </div>
        </div>

        <div class="calc-results-panel">
          <div class="calc-results-title">Hasil Perhitungan Produktivitas:</div>
          <div class="calc-metric-grid">
            <div class="calc-metric-box">
              <div class="calc-metric-label">Produktivitas Tenaga Kerja Fisik</div>
              <div class="calc-metric-val" id="resLaborUnit">5.00</div>
              <small style="color:var(--text-muted)">Unit per Jam Kerja</small>
            </div>
            <div class="calc-metric-box">
              <div class="calc-metric-label">Produktivitas Finansial TK</div>
              <div class="calc-metric-val" id="resLaborRp">8.33</div>
              <small style="color:var(--text-muted)">Rp Output / Rp Upah</small>
            </div>
            <div class="calc-metric-box highlight">
              <div class="calc-metric-label">Multifactor Productivity (MFP)</div>
              <div class="calc-metric-val" id="resMFP">1.92</div>
              <small style="color:var(--primary);font-weight:600">Rasio Output / Input</small>
            </div>
          </div>
          <div id="resMFPStatus" class="calc-status-tag success">Status: Sangat Sehat (Output > Total Biaya Input)</div>
        </div>
      </div>
    `;
  }

  // Line Balancing Calculator HTML
  function getLineBalancingCalculatorHTML() {
    return `
      <div class="calc-card" id="lineBalanceCalc">
        <div class="calc-title">
          <h3>${icon('clock')} Kalkulator Takt Time & Keseimbangan Lini</h3>
          <span class="calc-badge">Line Balancing</span>
        </div>
        <p class="calc-desc">Hitung Takt Time, jumlah stasiun kerja minimum, dan efisiensi lini produksi perakitan secara instan:</p>

        <div class="calc-grid">
          <div class="calc-field">
            <label class="calc-label">Waktu Kerja Bersih Tersedia:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcLBTime" value="420" min="1">
              <span class="calc-unit">Menit/Hari</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Target Permintaan Pelanggan:</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcLBDemand" value="140" min="1">
              <span class="calc-unit">Unit/Hari</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Total Waktu Seluruh Tugas (∑t):</label>
            <div class="calc-input-wrap">
              <input type="number" step="0.1" class="calc-input" id="calcLBTaskSum" value="9.0" min="0.1">
              <span class="calc-unit">Menit</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Jumlah Stasiun Kerja Aktual (k):</label>
            <div class="calc-input-wrap">
              <input type="number" class="calc-input" id="calcLBStations" value="4" min="1">
              <span class="calc-unit">Stasiun</span>
            </div>
          </div>
          <div class="calc-field">
            <label class="calc-label">Cycle Time Aktual Terpanjang (CT):</label>
            <div class="calc-input-wrap">
              <input type="number" step="0.1" class="calc-input" id="calcLBCycleTime" value="2.8" min="0.1">
              <span class="calc-unit">Menit/Unit</span>
            </div>
          </div>
        </div>

        <div class="calc-results-panel">
          <div class="calc-results-title">Hasil Keseimbangan Lini Perakitan:</div>
          <div class="calc-metric-grid">
            <div class="calc-metric-box">
              <div class="calc-metric-label">Takt Time Pelanggan</div>
              <div class="calc-metric-val" id="resLBTakt">3.00</div>
              <small style="color:var(--text-muted)">Menit per Unit</small>
            </div>
            <div class="calc-metric-box">
              <div class="calc-metric-label">Stasiun Minimum Teoritis (N_min)</div>
              <div class="calc-metric-val" id="resLBNmin">3</div>
              <small style="color:var(--text-muted)">Stasiun Kerja</small>
            </div>
            <div class="calc-metric-box highlight">
              <div class="calc-metric-label">Efisiensi Lini Perakitan</div>
              <div class="calc-metric-val" id="resLBEff">80.36%</div>
              <small style="color:var(--primary);font-weight:600">Optimalitas Aliran</small>
            </div>
            <div class="calc-metric-box">
              <div class="calc-metric-label">Balance Delay</div>
              <div class="calc-metric-val" id="resLBDelay">19.64%</div>
              <small style="color:var(--text-muted)">Waktu Menganggur</small>
            </div>
          </div>
          <div id="resLBStatus" class="calc-status-tag success">Status: Layak (Cycle Time ≤ Takt Time)</div>
        </div>
      </div>
    `;
  }

  // Setup Event Listeners for Productivity Calculator
  function initProductivityCalculator() {
    function recalc() {
      const output = parseFloat(document.getElementById('calcProdOutput')?.value) || 0;
      const price = parseFloat(document.getElementById('calcProdPrice')?.value) || 0;
      const laborHours = parseFloat(document.getElementById('calcProdLaborHours')?.value) || 1;
      const laborRate = parseFloat(document.getElementById('calcProdLaborRate')?.value) || 0;
      const matCost = parseFloat(document.getElementById('calcProdMaterial')?.value) || 0;
      const capCost = parseFloat(document.getElementById('calcProdCapital')?.value) || 0;
      const energyCost = parseFloat(document.getElementById('calcProdEnergy')?.value) || 0;

      const laborCost = laborHours * laborRate;
      const totalOutputRp = output * price;
      const totalInputRp = laborCost + matCost + capCost + energyCost;

      const laborPhys = output / laborHours;
      const laborRp = laborCost > 0 ? (totalOutputRp / laborCost) : 0;
      const mfp = totalInputRp > 0 ? (totalOutputRp / totalInputRp) : 0;

      const elLaborPhys = document.getElementById('resLaborUnit');
      const elLaborRp = document.getElementById('resLaborRp');
      const elMFP = document.getElementById('resMFP');
      const elStatus = document.getElementById('resMFPStatus');

      if (elLaborPhys) elLaborPhys.textContent = laborPhys.toFixed(2);
      if (elLaborRp) elLaborRp.textContent = laborRp.toFixed(2);
      if (elMFP) elMFP.textContent = mfp.toFixed(2);

      if (elStatus) {
        if (mfp >= 1.5) {
          elStatus.className = 'calc-status-tag success';
          elStatus.textContent = 'Status: Sangat Sehat (Output menghasilkan nilai tambah tinggi)';
        } else if (mfp >= 1.0) {
          elStatus.className = 'calc-status-tag warning';
          elStatus.textContent = 'Status: Cukup Efisien (Output berada di atas titik impas input)';
        } else {
          elStatus.className = 'calc-status-tag';
          elStatus.style.background = 'var(--danger-bg)';
          elStatus.style.color = '#991b1b';
          elStatus.textContent = 'Status: Tidak Efisien (Biaya input melebihi nilai output)';
        }
      }
    }

    const inputs = ['calcProdOutput', 'calcProdPrice', 'calcProdLaborHours', 'calcProdLaborRate', 'calcProdMaterial', 'calcProdCapital', 'calcProdEnergy'];
    inputs.forEach(id => {
      document.getElementById(id)?.addEventListener('input', recalc);
    });
  }

  // Setup Event Listeners for Line Balancing Calculator
  function initLineBalancingCalculator() {
    function recalc() {
      const time = parseFloat(document.getElementById('calcLBTime')?.value) || 1;
      const demand = parseFloat(document.getElementById('calcLBDemand')?.value) || 1;
      const taskSum = parseFloat(document.getElementById('calcLBTaskSum')?.value) || 0.1;
      const stations = parseFloat(document.getElementById('calcLBStations')?.value) || 1;
      const cycleTime = parseFloat(document.getElementById('calcLBCycleTime')?.value) || 0.1;

      const takt = time / demand;
      const nMin = Math.ceil(taskSum / takt);
      const eff = (taskSum / (stations * cycleTime)) * 100;
      const delay = Math.max(0, 100 - eff);

      const elTakt = document.getElementById('resLBTakt');
      const elNmin = document.getElementById('resLBNmin');
      const elEff = document.getElementById('resLBEff');
      const elDelay = document.getElementById('resLBDelay');
      const elStatus = document.getElementById('resLBStatus');

      if (elTakt) elTakt.textContent = takt.toFixed(2);
      if (elNmin) elNmin.textContent = nMin;
      if (elEff) elEff.textContent = eff.toFixed(2) + '%';
      if (elDelay) elDelay.textContent = delay.toFixed(2) + '%';

      if (elStatus) {
        if (cycleTime <= takt) {
          elStatus.className = 'calc-status-tag success';
          elStatus.textContent = `Status: Layak (Cycle Time ${cycleTime.toFixed(1)}m ≤ Takt Time ${takt.toFixed(1)}m - Permintaan Pasar Terpenuhi)`;
        } else {
          elStatus.className = 'calc-status-tag';
          elStatus.style.background = 'var(--danger-bg)';
          elStatus.style.color = '#991b1b';
          elStatus.textContent = `Status: Peringatan (Cycle Time ${cycleTime.toFixed(1)}m > Takt Time ${takt.toFixed(1)}m - Terjadi Keterlambatan Pasokan)`;
        }
      }
    }

    const inputs = ['calcLBTime', 'calcLBDemand', 'calcLBTaskSum', 'calcLBStations', 'calcLBCycleTime'];
    inputs.forEach(id => {
      document.getElementById(id)?.addEventListener('input', recalc);
    });
  }

  // Parse and Render Article Body
  function renderArticle(item) {
    const article = document.getElementById('article');
    const toc = document.getElementById('articleToc');
    if (!article) return;

    const x = all.findIndex(a => a.id === item.id);
    const prev = all[x - 1];
    const next = all[x + 1];
    const done = localStorage.getItem('done-' + item.id) === '1';
    const readingTime = getReadingTime(item.content);

    // Process blocks in content
    const content = item.content;
    let htmlOutput = '';
    const tocHeadings = [];

    let inTable = false;
    let tableBuffer = [];
    let inList = false;
    let listType = 'ul';
    let quizList = [];

    for (let i = 0; i < content.length; i++) {
      const line = content[i].trim();

      // Check if line is Table row
      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        tableBuffer.push(line);
        continue;
      } else if (inTable) {
        htmlOutput += parseTable(tableBuffer);
        tableBuffer = [];
        inTable = false;
      }

      // Check for Quiz block
      // Check for Quiz block
      if (line.includes('[QUIZ]')) {
        let quizText = '';

        // Ambil seluruh blok quiz mulai dari [QUIZ]
        quizText = line.substring(line.indexOf('[QUIZ]'));

        // Jika [/QUIZ] belum ada di baris yang sama,
        // lanjut membaca baris berikutnya
        while (!quizText.includes('[/QUIZ]') && i + 1 < content.length) {
            i++;
            quizText += '\n' + content[i];
        }

        // Ambil hanya isi di antara [QUIZ] dan [/QUIZ]
        const startTag = '[QUIZ]';
        const endTag = '[/QUIZ]';

        const startIndex = quizText.indexOf(startTag);
        const endIndex = quizText.indexOf(endTag);

        if (startIndex !== -1 && endIndex !== -1) {
            const jsonStr = quizText
                .substring(startIndex + startTag.length, endIndex)
                .trim();

            try {
                const quizObj = JSON.parse(jsonStr);

                if (
                    quizObj &&
                    typeof quizObj.question === 'string' &&
                    Array.isArray(quizObj.options) &&
                    typeof quizObj.answer === 'number'
                ) {
                    quizList.push(quizObj);
                } else {
                    console.error('Format quiz tidak valid:', quizObj);
                }

            } catch (e) {
                console.error('Quiz JSON parse error:', e);
                console.error('JSON yang dicoba:', jsonStr);
            }
        } else {
            console.error('Tag [QUIZ] atau [/QUIZ] tidak lengkap:', quizText);
        }

        continue;
      }

      // Check for Widget Productivity
      if (line.includes('[WIDGET:productivity]')) {
        if (inList) { htmlOutput += `</${listType}>`; inList = false; }
        htmlOutput += getProductivityCalculatorHTML();
        continue;
      }

      // Check for Widget Line Balance
      if (line.includes('[WIDGET:line_balance]')) {
        if (inList) { htmlOutput += `</${listType}>`; inList = false; }
        htmlOutput += getLineBalancingCalculatorHTML();
        continue;
      }

      // Check for Formula Block
      if (line.startsWith('[FORMULA]') && line.endsWith('[/FORMULA]')) {
        if (inList) { htmlOutput += `</${listType}>`; inList = false; }
        const formulaText = line.replace('[FORMULA]', '').replace('[/FORMULA]', '').trim();
        htmlOutput += `
          <div class="formula-box">
            <span class="formula-text">∑ ${esc(formulaText)}</span>
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${formulaText.replace(/'/g, "\\'")}').then(() => alert('Rumus disalin!'))">Salin</button>
          </div>
        `;
        continue;
      }

      // Check for Callout Note
      if (line.startsWith('[NOTE:') || line.startsWith('[TIP:') || line.startsWith('[PENTING:') || line.startsWith('[CASE:')) {
        if (inList) { htmlOutput += `</${listType}>`; inList = false; }
        const match = line.match(/^\[([A-Z]+):\s*([^\]]+)\]\s*(.*)$/);
        if (match) {
          const type = match[1].toLowerCase();
          const title = match[2];
          const text = match[3];
          const calloutIcon = type === 'tip' ? icon('lightbulb') : (type === 'penting' ? icon('alert') : icon('info'));
          htmlOutput += `
            <div class="callout ${type === 'tip' ? 'tip' : (type === 'penting' ? 'warning' : 'note')}">
              <span class="callout-icon">${calloutIcon}</span>
              <div>
                <div class="callout-title">${esc(title)}</div>
                <div class="callout-content">${esc(text)}</div>
              </div>
            </div>
          `;
          continue;
        }
      }

      // Check for Subheadings
      if (line.match(/^(\d+\.\d+(\.\d+)?|[A-Z]\.)\s+([A-Za-z].*)$/) && line.length < 90) {
        if (inList) { htmlOutput += `</${listType}>`; inList = false; }
        const headingId = 'sec-' + i;
        tocHeadings.push({ id: headingId, title: line });
        htmlOutput += `<h2 id="${headingId}">${esc(line)}</h2>`;
        continue;
      }

      // Check for Lists (bullet or numbered)
      if (line.startsWith('- ') || line.startsWith('• ')) {
        if (!inList || listType !== 'ul') {
          if (inList) htmlOutput += `</${listType}>`;
          htmlOutput += '<ul class="article-list">';
          inList = true;
          listType = 'ul';
        }
        htmlOutput += `<li>${esc(line.substring(2))}</li>`;
        continue;
      } else if (line.match(/^\d+\.\s+/)) {
        if (!inList || listType !== 'ol') {
          if (inList) htmlOutput += `</${listType}>`;
          htmlOutput += '<ol class="article-list">';
          inList = true;
          listType = 'ol';
        }
        htmlOutput += `<li>${esc(line.replace(/^\d+\.\s+/, ''))}</li>`;
        continue;
      } else {
        if (inList) {
          htmlOutput += `</${listType}>`;
          inList = false;
        }
      }

      // Standard Paragraph
      if (line) {
        htmlOutput += `<p>${esc(line)}</p>`;
      }
    }

    if (inTable) htmlOutput += parseTable(tableBuffer);
    if (inList) htmlOutput += `</${listType}>`;

    // Append Quizzes if any
    if (quizList.length > 0) {
      htmlOutput += `
        <div class="quiz-wrapper">
          <div class="quiz-header">
            <span class="quiz-badge">Kuis Uji Pemahaman Interaktif</span>
            <span class="quiz-score-badge" id="quizScoreText">0/${quizList.length} Dijawab</span>
          </div>
          ${quizList.map((q, idx) => renderQuizWidget(q, idx)).join('')}
          <button class="quiz-reset-btn" id="quizResetBtn">${icon('check')} Ulangi Latihan Kuis</button>
        </div>
      `;
    }

    // Assemble Full Article Markup
    article.innerHTML = `
      <div class="crumb-bar">
        <a class="crumb" href="materi.html?id=${encodeURIComponent(item.chapter.items[0].id)}">
          BAB ${item.chapter.number}: ${esc(item.chapter.title)}
        </a>
        <span class="badge-tag">${icon('clock')} ~${readingTime} Menit Baca</span>
        ${done ? `<span class="badge-tag" style="background:var(--success-bg);color:#065f46">${icon('check')} Telah Selesai</span>` : ''}
      </div>

      <h1>${esc(item.id)} ${esc(item.title)}</h1>

      <div class="article-body">
        ${htmlOutput}
      </div>

      <div class="article-actions">
        <button class="complete-btn ${done ? 'done' : ''}" id="completeBtn">
          ${icon('check')} ${done ? 'Materi Telah Diselesaikan' : 'Tandai sebagai Selesai'}
        </button>
        ${next ? `
          <a class="next-action-btn" href="materi.html?id=${encodeURIComponent(next.id)}" id="nextActionBtn">
            Lanjut ke Bab Berikutnya ${icon('arrow')}
          </a>
        ` : ''}
      </div>

      <div class="article-nav">
        ${prev ? `
          <a href="materi.html?id=${encodeURIComponent(prev.id)}">
            ← <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(prev.id)} ${esc(prev.title)}</span>
          </a>
        ` : '<span></span>'}
        ${next ? `
          <a href="materi.html?id=${encodeURIComponent(next.id)}" style="margin-left:auto">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(next.id)} ${esc(next.title)}</span> →
          </a>
        ` : ''}
      </div>

      <div class="keyboard-hint">
        <span style="display:inline-flex;align-items:center;gap:6px;">${icon('lightbulb')} Navigasi Cepat: Tekan <kbd>←</kbd> untuk bab sebelumnya dan <kbd>→</kbd> untuk bab berikutnya di keyboard.</span>
      </div>
    `;

    // Render Table of Contents in Right Column
    if (toc) {
      if (tocHeadings.length > 1) {
        toc.style.display = 'block';
        toc.innerHTML = `
          <div class="toc-header">
            ${icon('book')} Daftar Isi Halaman
          </div>
          <ul class="toc-list">
            ${tocHeadings.map(h => `
              <li class="toc-item">
                <a class="toc-link" href="#${h.id}">${esc(h.title)}</a>
              </li>
            `).join('')}
          </ul>
        `;

        // Smooth scroll for TOC links
        toc.querySelectorAll('.toc-link').forEach(link => {
          link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          });
        });
      } else {
        toc.style.display = 'none';
      }
    }

    // Bind Complete Button
    const completeBtn = document.getElementById('completeBtn');
    if (completeBtn) {
      completeBtn.onclick = () => {
        const isDone = localStorage.getItem('done-' + item.id) === '1';
        localStorage.setItem('done-' + item.id, isDone ? '0' : '1');
        renderSidebar();
        updateGlobalProgress();
        renderArticle(item);
      };
    }

    // Bind Quiz Option Buttons
    document.querySelectorAll('.quiz-card').forEach(card => {
      const qIdx = card.getAttribute('data-quiz-index');
      const correctAns = parseInt(card.getAttribute('data-answer'), 10);
      const optBtns = card.querySelectorAll('.quiz-opt-btn');
      const feedbackEl = document.getElementById('quiz-feedback-' + qIdx);

      optBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const chosenIdx = parseInt(btn.getAttribute('data-opt-index'), 10);
          optBtns.forEach(b => b.disabled = true);

          if (chosenIdx === correctAns) {
            btn.classList.add('correct');
            if (feedbackEl) {
              feedbackEl.className = 'quiz-feedback correct show';
            }
          } else {
            btn.classList.add('incorrect');
            optBtns[correctAns]?.classList.add('correct');
            if (feedbackEl) {
              feedbackEl.className = 'quiz-feedback incorrect show';
            }
          }
          updateQuizScore();
        });
      });
    });

    // Reset Quiz button
    document.getElementById('quizResetBtn')?.addEventListener('click', () => {
      document.querySelectorAll('.quiz-card').forEach(card => {
        card.querySelectorAll('.quiz-opt-btn').forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('correct', 'incorrect');
        });
        const fb = card.querySelector('.quiz-feedback');
        if (fb) fb.className = 'quiz-feedback';
      });
      updateQuizScore();
    });

    function updateQuizScore() {
      const totalQ = quizList.length;
      const correctCount = document.querySelectorAll('.quiz-opt-btn.correct:not([disabled])').length;
      const answeredCount = document.querySelectorAll('.quiz-opt-btn.correct, .quiz-opt-btn.incorrect').length;
      const scoreText = document.getElementById('quizScoreText');
      if (scoreText) {
        scoreText.textContent = `${answeredCount}/${totalQ} Dijawab`;
      }
    }

    // Initialize Embedded Calculators
    initProductivityCalculator();
    initLineBalancingCalculator();
  }

  // Keyboard Navigation: Arrow Left / Arrow Right
  window.addEventListener('keydown', e => {
    // Avoid triggering when user is typing in search or inputs
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    const x = all.findIndex(a => a.id === currentItem.id);
    if (e.key === 'ArrowRight' && all[x + 1]) {
      window.location.href = 'materi.html?id=' + encodeURIComponent(all[x + 1].id);
    } else if (e.key === 'ArrowLeft' && all[x - 1]) {
      window.location.href = 'materi.html?id=' + encodeURIComponent(all[x - 1].id);
    }
  });

  // Search Filter in Sidebar
  document.getElementById('searchInput')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.chapter').forEach(ch => {
      let anyMatch = false;
      ch.querySelectorAll('.nav-item').forEach(item => {
        const match = !q || item.textContent.toLowerCase().includes(q);
        item.style.display = match ? 'flex' : 'none';
        if (match) anyMatch = true;
      });
      ch.style.display = anyMatch ? 'block' : 'none';
    });
  });

  // Theme Management
  function applyTheme() {
    const isDark = localStorage.getItem('mosc-theme') === 'dark';
    document.body.classList.toggle('dark', isDark);
    const themeBtn = document.getElementById('themeBtn');
    if (themeBtn) {
      themeBtn.innerHTML = icon(isDark ? 'sun' : 'moon');
      themeBtn.title = isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap';
    }
  }

  if (document.getElementById('article')) {
    document.getElementById('themeBtn')?.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('mosc-theme', isDark ? 'light' : 'dark');
      applyTheme();
    });

    // Mobile Menu Toggle
    document.getElementById('menuBtn')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Close sidebar on mobile when clicked outside
    document.addEventListener('click', e => {
      const sidebar = document.getElementById('sidebar');
      const menuBtn = document.getElementById('menuBtn');
      if (sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !menuBtn?.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    }
    );
  }

  // Calculator Modal Controller
  const modal = document.getElementById('calculatorModal');
  const openModalBtn = document.getElementById('toolsBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      modal.classList.add('open');
      initModalCalculators();
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('open');
    });
  }

  modal?.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  });

  // Tab switching inside modal
  function initModalCalculators() {
    const tabBtns = document.querySelectorAll('.modal-tab-btn');
    const tabPanes = document.querySelectorAll('.modal-tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.style.display = 'none');

        btn.classList.add('active');
        const target = btn.getAttribute('data-tab');
        const activePane = document.getElementById(target);
        if (activePane) activePane.style.display = 'block';
      });
    });

    initProductivityCalculator();
    initLineBalancingCalculator();
  }

  function initEntranceAnimations() {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const selectors = [
      '.hero', '.resume-card', '.stat', '.section > .eyebrow', '.section > h2',
      '.chapter-card', '.article > .crumb-bar', '.article > h1',
      '.article-body > p', '.article-body > h2', '.article-body > h3',
      '.article-body > ul', '.article-body > ol', '.article-body > .callout',
      '.article-body > .formula-box', '.article-body > .table-responsive',
      '.quiz-header', '.quiz-card', '.quiz-wrapper > .quiz-reset-btn',
      '.calc-card', '.article-actions', '.article-nav', '.keyboard-hint'
    ].join(',');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    const observed = new WeakSet();
    const observeElements = root => {
      if (root instanceof Element && root.matches(selectors) && !observed.has(root)) {
        observed.add(root);
        root.classList.add('scroll-reveal');
        observer.observe(root);
      }

      root.querySelectorAll?.(selectors).forEach(element => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add('scroll-reveal');
        observer.observe(element);
      });
    };

    observeElements(document);
    new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node instanceof Element) observeElements(node);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  function initSearchAutocomplete() {
    const input = document.getElementById('searchInput');
    const list = document.getElementById('searchSuggestions');
    if (!input || !list) return;

    let results = [];
    let activeIndex = -1;

    function closeSuggestions() {
      list.hidden = true;
      list.replaceChildren();
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      activeIndex = -1;
    }

    function setActive(index) {
      const options = list.querySelectorAll('.search-suggestion');
      if (!options.length) return;
      activeIndex = (index + options.length) % options.length;
      options.forEach((option, optionIndex) => {
        const isActive = optionIndex === activeIndex;
        option.classList.toggle('active', isActive);
        option.setAttribute('aria-selected', String(isActive));
      });
      input.setAttribute('aria-activedescendant', options[activeIndex].id);
      options[activeIndex].scrollIntoView({ block: 'nearest' });
    }

    function updateSuggestions() {
      const query = input.value.trim().toLocaleLowerCase();
      list.replaceChildren();
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
      if (!query) {
        closeSuggestions();
        return;
      }

      results = all.filter(item => `${item.id} ${item.title} ${item.chapter.title}`.toLocaleLowerCase().includes(query)).slice(0, 8);
      if (!results.length) {
        const empty = document.createElement('div');
        empty.className = 'search-empty';
        empty.setAttribute('role', 'status');
        empty.textContent = 'Tidak ada materi yang cocok.';
        list.append(empty);
      } else {
        results.forEach((item, index) => {
          const option = document.createElement('button');
          option.type = 'button';
          option.id = `search-option-${index}`;
          option.className = 'search-suggestion';
          option.setAttribute('role', 'option');
          option.setAttribute('aria-selected', 'false');

          const id = document.createElement('span');
          id.className = 'search-suggestion-id';
          id.textContent = item.id;
          const details = document.createElement('span');
          details.className = 'search-suggestion-details';
          const title = document.createElement('span');
          title.className = 'search-suggestion-title';
          title.textContent = item.title;
          const chapter = document.createElement('span');
          chapter.className = 'search-suggestion-chapter';
          chapter.textContent = `BAB ${item.chapter.number}: ${item.chapter.title}`;
          details.append(title, chapter);
          option.append(id, details);
          list.append(option);
        });
      }

      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }

    input.addEventListener('input', updateSuggestions);
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' && !list.hidden) {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === 'ArrowUp' && !list.hidden) {
        event.preventDefault();
        setActive(activeIndex < 0 ? list.querySelectorAll('.search-suggestion').length - 1 : activeIndex - 1);
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault();
        window.location.href = `materi.html?id=${encodeURIComponent(results[activeIndex].id)}`;
      } else if (event.key === 'Escape') {
        closeSuggestions();
      }
    });

    list.addEventListener('mousedown', event => event.preventDefault());
    list.addEventListener('click', event => {
      const option = event.target.closest('.search-suggestion');
      if (!option) return;
      const index = Number(option.id.replace('search-option-', ''));
      if (results[index]) window.location.href = `materi.html?id=${encodeURIComponent(results[index].id)}`;
    });
    input.addEventListener('blur', () => window.setTimeout(closeSuggestions, 120));
    document.addEventListener('click', event => {
      if (!event.target.closest('.searchbox')) closeSuggestions();
    });
  }

  // Initial Execution
  applyTheme();
  renderSidebar();
  updateGlobalProgress();
  renderArticle(currentItem);
  initSearchAutocomplete();
  initEntranceAnimations();
})();
