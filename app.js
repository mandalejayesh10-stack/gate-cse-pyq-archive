/**
 * GATE CSE Complete PYQ Archive Platform (1983–2026)
 * Main Frontend Application Logic
 */

// Application State
const state = {
  questions: [],
  taxonomy: {},
  coverage: [],
  sources: [],
  
  activeMode: 'all', // all, subject, topic, year, sub_top_yr, yr_sub_top, top_years, exam_set, source_audit, unverified, missing_browser, practice, analytics
  filters: {
    query: '',
    yearMin: 1983,
    yearMax: 2026,
    subject: '',
    chapter: '',
    topic: '',
    year: null,
    set: '',
    qtype: '',
    marks: '',
    attemptStatus: '',
    sort: 'year-asc'
  },
  
  pagination: {
    page: 1,
    pageSize: 15
  },
  
  userProgress: {
    attempts: {},     // qId -> { selected: 'A', isCorrect: true, timestamp: ... }
    bookmarks: {},    // qId -> true
    notes: {}
  },
  
  practiceTest: {
    active: false,
    timerSeconds: 0,
    intervalId: null,
    questions: []
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  loadLocalStorage();
  setupEventListeners();
  await loadData();
  populateFilterDropdowns();
  renderSidebar();
  applyFiltersAndRender();
});

// Load LocalStorage
function loadLocalStorage() {
  try {
    const saved = localStorage.getItem('gate_pyq_progress');
    if (saved) {
      state.userProgress = JSON.parse(saved);
    }
    const theme = localStorage.getItem('gate_pyq_theme');
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
}

function saveLocalStorage() {
  try {
    localStorage.setItem('gate_pyq_progress', JSON.stringify(state.userProgress));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

// Load JSON Datasets
async function loadData() {
  try {
    const [qRes, taxRes, covRes, srcRes] = await Promise.all([
      fetch('questions.json'),
      fetch('taxonomy.json'),
      fetch('coverage_report.json'),
      fetch('source_manifest.json')
    ]);
    
    state.questions = await qRes.json();
    state.taxonomy = await taxRes.json();
    const covData = await covRes.json();
    state.coverage = covData.coverage_audit_1983_2026 || [];
    const srcData = await srcRes.json();
    state.sources = srcData.sources || [];
    
    document.getElementById('headerTotalCount').textContent = state.questions.length.toLocaleString();
    showToast(`Loaded ${state.questions.length} questions across 44 years.`);
  } catch (e) {
    console.error('Data load error:', e);
    showToast('Failed to load questions.json. Check local server setup.', 4000);
  }
}

// Populate Filter Dropdowns
function populateFilterDropdowns() {
  const minSel = document.getElementById('filterYearMin');
  const maxSel = document.getElementById('filterYearMax');
  const subjSel = document.getElementById('filterSubject');
  
  minSel.innerHTML = '';
  maxSel.innerHTML = '';
  for (let yr = 1983; yr <= 2026; yr++) {
    const opt1 = document.createElement('option');
    opt1.value = yr;
    opt1.textContent = yr;
    if (yr === 1983) opt1.selected = true;
    minSel.appendChild(opt1);
    
    const opt2 = document.createElement('option');
    opt2.value = yr;
    opt2.textContent = yr;
    if (yr === 2026) opt2.selected = true;
    maxSel.appendChild(opt2);
  }
  
  subjSel.innerHTML = '<option value="">All Subjects</option>';
  Object.keys(state.taxonomy).forEach(subj => {
    const opt = document.createElement('option');
    opt.value = subj;
    opt.textContent = subj;
    subjSel.appendChild(opt);
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    if (document.body.classList.contains('theme-dark')) {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      localStorage.setItem('gate_pyq_theme', 'light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      localStorage.setItem('gate_pyq_theme', 'dark');
    }
  });

  // Export & Import
  document.getElementById('exportDataBtn').addEventListener('click', exportProgress);
  document.getElementById('importDataInput').addEventListener('change', importProgress);
  document.getElementById('resetDataBtn').addEventListener('click', resetProgress);

  // Mode Navigation Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeMode = tab.dataset.mode;
      state.pagination.page = 1;
      
      // Reset conflicting filters when switching perspectives
      if (state.activeMode === 'year' || state.activeMode === 'yr_sub_top' || state.activeMode === 'exam_set') {
        state.filters.subject = '';
        state.filters.chapter = '';
        state.filters.topic = '';
        const subjDropdown = document.getElementById('filterSubject');
        if (subjDropdown) subjDropdown.value = '';
      } else if (state.activeMode === 'subject' || state.activeMode === 'topic' || state.activeMode === 'sub_top_yr') {
        state.filters.year = null;
        state.filters.set = '';
        state.filters.yearMin = 1983;
        state.filters.yearMax = 2026;
        const minSel = document.getElementById('filterYearMin');
        const maxSel = document.getElementById('filterYearMax');
        if (minSel) minSel.value = 1983;
        if (maxSel) maxSel.value = 2026;
      }
      
      renderSidebar();
      applyFiltersAndRender();
    });
  });

  // Search & Filter Inputs
  const searchInput = document.getElementById('globalSearchInput');
  searchInput.addEventListener('input', debounce((e) => {
    state.filters.query = e.target.value.trim();
    state.pagination.page = 1;
    applyFiltersAndRender();
  }, 250));

  document.getElementById('clearSearchBtn').addEventListener('click', () => {
    searchInput.value = '';
    state.filters.query = '';
    state.pagination.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('filterYearMin').addEventListener('change', (e) => {
    state.filters.yearMin = parseInt(e.target.value);
    state.pagination.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('filterYearMax').addEventListener('change', (e) => {
    state.filters.yearMax = parseInt(e.target.value);
    state.pagination.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('filterSubject').addEventListener('change', (e) => {
    state.filters.subject = e.target.value;
    state.filters.chapter = '';
    state.filters.topic = '';
    state.pagination.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('filterQType').addEventListener('change', (e) => {
    state.filters.qtype = e.target.value;
    state.pagination.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('filterMarks').addEventListener('change', (e) => {
    state.filters.marks = e.target.value;
    state.pagination.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('filterAttempt').addEventListener('change', (e) => {
    state.filters.attemptStatus = e.target.value;
    state.pagination.page = 1;
    applyFiltersAndRender();
  });

  document.getElementById('filterSort').addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    applyFiltersAndRender();
  });

  document.getElementById('sidebarResetFilter').addEventListener('click', () => {
    state.filters.subject = '';
    state.filters.chapter = '';
    state.filters.topic = '';
    state.filters.year = null;
    state.filters.set = '';
    document.getElementById('filterSubject').value = '';
    state.pagination.page = 1;
    renderSidebar();
    applyFiltersAndRender();
  });
}

// Render Sidebar Based on Active Mode
function renderSidebar() {
  const container = document.getElementById('sidebarContent');
  const title = document.getElementById('sidebarTitle');
  container.innerHTML = '';

  if (state.activeMode === 'all' || state.activeMode === 'subject' || state.activeMode === 'topic' || state.activeMode === 'sub_top_yr') {
    title.textContent = 'Subject & Topics Taxonomy';
    Object.keys(state.taxonomy).forEach(subj => {
      const group = document.createElement('div');
      group.className = 'tree-group';

      const count = state.questions.filter(q => q.subject === subj).length;
      const header = document.createElement('div');
      header.className = `tree-header ${state.filters.subject === subj ? 'active' : ''}`;
      header.innerHTML = `<span>${subj}</span> <span class="count-badge">${count}</span>`;
      header.addEventListener('click', () => {
        state.filters.subject = state.filters.subject === subj ? '' : subj;
        state.filters.chapter = '';
        state.filters.topic = '';
        document.getElementById('filterSubject').value = state.filters.subject;
        state.pagination.page = 1;
        renderSidebar();
        applyFiltersAndRender();
      });
      group.appendChild(header);

      if (state.filters.subject === subj || state.activeMode === 'topic') {
        const items = document.createElement('div');
        items.className = 'tree-items';
        const chapters = state.taxonomy[subj];
        Object.keys(chapters).forEach(chap => {
          const topics = chapters[chap];
          topics.forEach(top => {
            const topCount = state.questions.filter(q => q.subject === subj && q.topic === top).length;
            if (topCount > 0) {
              const item = document.createElement('div');
              item.className = `tree-item ${state.filters.topic === top ? 'active' : ''}`;
              item.innerHTML = `<span>${top}</span> <span class="count-badge">${topCount}</span>`;
              item.addEventListener('click', (e) => {
                e.stopPropagation();
                state.filters.subject = subj;
                state.filters.chapter = chap;
                state.filters.topic = state.filters.topic === top ? '' : top;
                document.getElementById('filterSubject').value = subj;
                state.pagination.page = 1;
                renderSidebar();
                applyFiltersAndRender();
              });
              items.appendChild(item);
            }
          });
        });
        group.appendChild(items);
      }
      container.appendChild(group);
    });
  } else if (state.activeMode === 'year') {
    title.textContent = 'Mode C: Year-Wise Papers (1983–2026)';
    const yearsGroup = document.createElement('div');
    yearsGroup.className = 'tree-items';
    
    for (let yr = 2026; yr >= 1983; yr--) {
      const yrQs = state.questions.filter(q => q.year === yr);
      const item = document.createElement('div');
      item.className = `tree-item ${state.filters.year === yr ? 'active' : ''}`;
      const statusBadge = yr < 1987 ? '<span class="status-badge status-missing">No Paper</span>' : 
                         (yrQs.length > 0 ? `<span class="count-badge">${yrQs.length} Qs</span>` : '<span class="status-badge status-partial">Missing</span>');
      item.innerHTML = `<span>GATE ${yr}</span> ${statusBadge}`;
      item.addEventListener('click', () => {
        if (yr < 1987) {
          showToast(`GATE ${yr}: Exam was held, but no public question paper was retained.`, 3500);
          return;
        }
        state.filters.year = (state.filters.year === yr) ? null : yr;
        state.filters.yearMin = state.filters.year ? yr : 1983;
        state.filters.yearMax = state.filters.year ? yr : 2026;
        state.filters.subject = '';
        state.filters.chapter = '';
        state.filters.topic = '';
        const subjDropdown = document.getElementById('filterSubject');
        if (subjDropdown) subjDropdown.value = '';
        document.getElementById('filterYearMin').value = state.filters.yearMin;
        document.getElementById('filterYearMax').value = state.filters.yearMax;
        state.pagination.page = 1;
        renderSidebar();
        applyFiltersAndRender();
      });
      yearsGroup.appendChild(item);
    }
    container.appendChild(yearsGroup);
  } else if (state.activeMode === 'yr_sub_top') {
    title.textContent = 'Mode E: Year → Subject → Topic';
    for (let yr = 2026; yr >= 1987; yr--) {
      const yrQs = state.questions.filter(q => q.year === yr);
      if (yrQs.length === 0) continue;

      const group = document.createElement('div');
      group.className = 'tree-group';

      const header = document.createElement('div');
      header.className = `tree-header ${state.filters.year === yr ? 'active' : ''}`;
      header.innerHTML = `<span>GATE ${yr}</span> <span class="count-badge">${yrQs.length}</span>`;
      header.addEventListener('click', () => {
        state.filters.year = (state.filters.year === yr) ? null : yr;
        state.filters.yearMin = state.filters.year ? yr : 1983;
        state.filters.yearMax = state.filters.year ? yr : 2026;
        state.filters.subject = '';
        state.filters.chapter = '';
        state.filters.topic = '';
        const subjDropdown = document.getElementById('filterSubject');
        if (subjDropdown) subjDropdown.value = '';
        document.getElementById('filterYearMin').value = state.filters.yearMin;
        document.getElementById('filterYearMax').value = state.filters.yearMax;
        state.pagination.page = 1;
        renderSidebar();
        applyFiltersAndRender();
      });
      group.appendChild(header);

      if (state.filters.year === yr) {
        const subList = document.createElement('div');
        subList.className = 'tree-items';
        
        // Group subjects for this year
        const yearSubjs = {};
        yrQs.forEach(q => {
          yearSubjs[q.subject] = (yearSubjs[q.subject] || 0) + 1;
        });

        Object.keys(yearSubjs).sort().forEach(sub => {
          const sItem = document.createElement('div');
          sItem.className = `tree-item ${state.filters.subject === sub ? 'active' : ''}`;
          sItem.innerHTML = `<span>${sub}</span> <span class="count-badge">${yearSubjs[sub]}</span>`;
          sItem.addEventListener('click', (e) => {
            e.stopPropagation();
            state.filters.subject = (state.filters.subject === sub) ? '' : sub;
            state.filters.chapter = '';
            state.filters.topic = '';
            const subjDropdown = document.getElementById('filterSubject');
            if (subjDropdown) subjDropdown.value = state.filters.subject;
            state.pagination.page = 1;
            renderSidebar();
            applyFiltersAndRender();
          });
          subList.appendChild(sItem);

          // If subject selected, show topics for this year and subject
          if (state.filters.subject === sub) {
            const topList = document.createElement('div');
            topList.style.paddingLeft = '18px';
            const yearTopics = {};
            yrQs.filter(q => q.subject === sub).forEach(q => {
              yearTopics[q.topic] = (yearTopics[q.topic] || 0) + 1;
            });
            Object.keys(yearTopics).sort().forEach(top => {
              const tItem = document.createElement('div');
              tItem.className = `tree-item ${state.filters.topic === top ? 'active' : ''}`;
              tItem.style.fontSize = '0.78rem';
              tItem.innerHTML = `<span>${top}</span> <span class="count-badge">${yearTopics[top]}</span>`;
              tItem.addEventListener('click', (ev) => {
                ev.stopPropagation();
                state.filters.topic = (state.filters.topic === top) ? '' : top;
                state.pagination.page = 1;
                renderSidebar();
                applyFiltersAndRender();
              });
              topList.appendChild(tItem);
            });
            subList.appendChild(topList);
          }
        });
        group.appendChild(subList);
      }
      container.appendChild(group);
    }
  } else if (state.activeMode === 'exam_set') {
    title.textContent = 'Mode G: Exam & Paper Sets';
    const examCategories = [
      { id: 'gate_cse_multi', name: 'GATE CSE Multi-Session Sets', filter: q => q.exam === 'GATE' && q.branch === 'CS' && q.set && q.set !== 'Standard Set' },
      { id: 'gate_cse_master', name: 'GATE CSE Master Papers', filter: q => q.exam === 'GATE' && q.branch === 'CS' && (!q.set || q.set === 'Standard Set') },
      { id: 'gate_it', name: 'GATE IT Branch Papers (2004–2008)', filter: q => q.branch === 'IT' },
      { id: 'gate_da', name: 'GATE DA (Data Science & AI)', filter: q => q.branch === 'DA' },
      { id: 'isro_cse', name: 'ISRO CSE Question Bank', filter: q => q.exam === 'ISRO' }
    ];

    examCategories.forEach(cat => {
      const catQs = state.questions.filter(cat.filter);
      const group = document.createElement('div');
      group.className = 'tree-group';

      const header = document.createElement('div');
      header.className = 'tree-header';
      header.innerHTML = `<span>${cat.name}</span> <span class="count-badge">${catQs.length}</span>`;
      header.addEventListener('click', () => {
        // Filter by this category
        state.filters.query = cat.id === 'gate_it' ? 'GATE IT' : (cat.id === 'gate_da' ? 'GATE DA' : (cat.id === 'isro_cse' ? 'ISRO' : ''));
        state.filters.year = null;
        state.filters.subject = '';
        state.pagination.page = 1;
        applyFiltersAndRender();
      });
      group.appendChild(header);
      container.appendChild(group);
    });
  } else if (state.activeMode === 'source_audit' || state.activeMode === 'missing_browser') {
    title.textContent = 'Audit & Coverage Actions';
    const box = document.createElement('div');
    box.style.padding = '10px';
    box.innerHTML = `
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">
        Explore source provenance, 44-year audit reports, and missing historical records.
      </p>
      <button class="btn btn-primary btn-sm" style="width:100%; margin-bottom:8px;" onclick="switchMode('source_audit')">View Source Manifest</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="switchMode('missing_browser')">View Missing Data Audit</button>
    `;
    container.appendChild(box);
  } else {
    title.textContent = 'Quick Actions';
    const box = document.createElement('div');
    box.style.padding = '10px';
    box.innerHTML = `
      <button class="btn btn-primary btn-sm" style="width:100%; margin-bottom:8px;" onclick="startRandomPractice(10)">🎲 Random 10 Questions</button>
      <button class="btn btn-secondary btn-sm" style="width:100%; margin-bottom:8px;" onclick="startRandomPractice(25)">🎲 Random 25 Questions</button>
      <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="filterBookmarked()">⭐ Solved & Bookmarked</button>
    `;
    container.appendChild(box);
  }
}

// Global Filter and Render Controller
function applyFiltersAndRender() {
  hideAllSpecialViews();

  // If in special views, render those instead
  if (state.activeMode === 'source_audit') {
    renderSourceAuditView();
    return;
  }
  if (state.activeMode === 'missing_browser') {
    renderMissingDataView();
    return;
  }
  if (state.activeMode === 'analytics') {
    renderAnalyticsView();
    return;
  }
  if (state.activeMode === 'practice') {
    renderPracticeView();
    return;
  }

  // Filter Questions
  let filtered = state.questions.filter(q => {
    // Year range
    if (q.year < state.filters.yearMin || q.year > state.filters.yearMax) return false;
    // Specific Year
    if (state.filters.year && q.year !== state.filters.year) return false;
    // Subject
    if (state.filters.subject && q.subject !== state.filters.subject) return false;
    // Topic
    if (state.filters.topic && q.topic !== state.filters.topic) return false;
    // Type
    if (state.filters.qtype && q.question_type !== state.filters.qtype) return false;
    // Marks
    if (state.filters.marks && q.marks !== parseInt(state.filters.marks)) return false;
    // Attempt Status
    if (state.filters.attemptStatus) {
      const att = state.userProgress.attempts[q.id];
      const bm = state.userProgress.bookmarks[q.id];
      if (state.filters.attemptStatus === 'unattempted' && att) return false;
      if (state.filters.attemptStatus === 'correct' && (!att || !att.isCorrect)) return false;
      if (state.filters.attemptStatus === 'incorrect' && (!att || att.isCorrect)) return false;
      if (state.filters.attemptStatus === 'bookmarked' && !bm) return false;
    }
    // Search Query
    if (state.filters.query) {
      const qLower = state.filters.query.toLowerCase();
      const matchText = q.question_text.toLowerCase().includes(qLower);
      const matchId = q.id.toLowerCase().includes(qLower);
      const matchTopic = q.topic.toLowerCase().includes(qLower);
      const matchOpts = q.options && q.options.some(o => o.toLowerCase().includes(qLower));
      if (!matchText && !matchId && !matchTopic && !matchOpts) return false;
    }
    // Unverified Mode
    if (state.activeMode === 'unverified') {
      if (q.answer_status !== 'community_verified' && q.classification_status !== 'needs_review') return false;
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (state.filters.sort === 'year-asc') return a.year - b.year || a.id.localeCompare(b.id);
    if (state.filters.sort === 'year-desc') return b.year - a.year || a.id.localeCompare(b.id);
    if (state.filters.sort === 'marks-desc') return b.marks - a.marks || a.year - b.year;
    if (state.filters.sort === 'qnum-asc') {
      const aNum = parseInt(a.question_number.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.question_number.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    }
    return 0;
  });

  // Active filter badge
  const activeBadge = document.getElementById('activeFilterBadge');
  const filterDesc = [];
  if (state.filters.subject) filterDesc.push(state.filters.subject);
  if (state.filters.topic) filterDesc.push(state.filters.topic);
  if (state.filters.year) filterDesc.push(`GATE ${state.filters.year}`);
  if (state.filters.query) filterDesc.push(`"${state.filters.query}"`);
  
  if (filterDesc.length > 0) {
    activeBadge.style.display = 'inline-block';
    activeBadge.textContent = filterDesc.join(' • ');
  } else {
    activeBadge.style.display = 'none';
  }

  // Count
  document.getElementById('resultsCount').textContent = `Showing ${filtered.length.toLocaleString()} matching questions`;

  // Pagination Slice
  const totalPages = Math.ceil(filtered.length / state.pagination.pageSize) || 1;
  if (state.pagination.page > totalPages) state.pagination.page = totalPages;
  const startIdx = (state.pagination.page - 1) * state.pagination.pageSize;
  const endIdx = startIdx + state.pagination.pageSize;
  const pageQuestions = filtered.slice(startIdx, endIdx);

  renderQuestions(pageQuestions);
  renderPagination(totalPages);
}

// Render Question Cards
function renderQuestions(questions) {
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';
  container.style.display = 'flex';

  if (questions.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 48px 20px; color: var(--text-muted);">
        <h3>No matching questions found</h3>
        <p style="margin-top:8px;">Try broadening your search query or clearing active filters.</p>
      </div>
    `;
    return;
  }

  questions.forEach(q => {
    const card = document.createElement('article');
    card.className = 'question-card';
    card.id = `card-${q.id}`;

    const isBookmarked = !!state.userProgress.bookmarks[q.id];
    const attempt = state.userProgress.attempts[q.id];

    // Card Header / Badges
    card.innerHTML = `
      <div class="question-meta-bar">
        <div class="meta-badges">
          <span class="badge badge-year">GATE ${q.year}</span>
          <span class="badge badge-qnum">${q.question_number}</span>
          ${q.set && q.set !== 'Standard Set' ? `<span class="badge badge-qnum">${q.set}</span>` : ''}
          <span class="badge badge-subject">${escapeHtml(q.subject)}</span>
          <span class="badge badge-topic">${escapeHtml(q.topic)}</span>
          <span class="badge badge-type">${q.question_type}</span>
          <span class="badge badge-marks">${q.marks} Mark${q.marks > 1 ? 's' : ''} (Neg: -${q.negative_marking})</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon ${isBookmarked ? 'bookmarked' : ''}" title="Bookmark Question" onclick="toggleBookmark('${q.id}')">
            ${isBookmarked ? '★' : '☆'}
          </button>
        </div>
      </div>
      <div class="question-body">
        ${formatQuestionText(q.question_text)}
      </div>
      <div class="options-container" id="opts-${q.id}"></div>
      <div class="card-footer">
        <div>
          <button class="btn btn-secondary btn-sm" onclick="toggleSolution('${q.id}')">💡 View Solution &amp; Key</button>
          ${q.additional_source_urls && q.additional_source_urls[0] ? `<a href="${q.additional_source_urls[0]}" target="_blank" class="btn-link" style="margin-left:12px;">🔗 GATE Overflow Discussion</a>` : ''}
        </div>
        <div id="status-badge-${q.id}">
          ${attempt ? (attempt.isCorrect ? '<span class="status-badge status-complete">✓ Solved Correct</span>' : '<span class="status-badge status-missing">✗ Solved Incorrect</span>') : '<span class="count-badge">Unattempted</span>'}
        </div>
      </div>
      <div class="solution-box" id="sol-${q.id}" style="display:none;">
        <div style="font-weight:700; margin-bottom:6px; color:var(--accent-primary);">
          Correct Answer: ${q.correct_answer || 'Check Explanation'} 
          <span style="font-size:0.75rem; font-weight:normal; color:var(--text-muted);">(${q.answer_status})</span>
        </div>
        <div>${q.explanation || 'Detailed discussion available on GATE Overflow.'}</div>
      </div>
    `;

    // Render Options
    const optsContainer = card.querySelector(`#opts-${q.id}`);
    if (q.question_type === 'MCQ' || q.question_type === 'MSQ') {
      const optsList = document.createElement('div');
      optsList.className = 'options-list';
      q.options.forEach((optText, optIdx) => {
        const optLetter = String.fromCharCode(65 + optIdx);
        const optItem = document.createElement('div');
        optItem.className = 'option-item';

        if (attempt && attempt.selected === optLetter) {
          optItem.classList.add('selected');
          if (attempt.isCorrect) optItem.classList.add('correct');
          else optItem.classList.add('incorrect');
        }

        optItem.innerHTML = `
          <div class="opt-indicator">${optLetter}</div>
          <div class="opt-text">${formatQuestionText(optText)}</div>
        `;
        optItem.addEventListener('click', () => selectOption(q.id, optLetter, q.correct_answer));
        optsList.appendChild(optItem);
      });
      optsContainer.appendChild(optsList);
    } else {
      // NAT
      optsContainer.innerHTML = `
        <div class="nat-input-container">
          <input type="text" id="nat-val-${q.id}" placeholder="Enter numerical answer" value="${attempt ? attempt.selected : ''}">
          <button class="btn btn-primary btn-sm" onclick="submitNat('${q.id}', '${q.correct_answer}')">Submit</button>
        </div>
      `;
    }

    container.appendChild(card);
  });

  // Render LaTeX math using KaTeX
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(container, {
        delimiters: [
          { left: '[latex]', right: '[/latex]', display: false },
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
}

// User Actions
window.toggleBookmark = function(qId) {
  state.userProgress.bookmarks[qId] = !state.userProgress.bookmarks[qId];
  saveLocalStorage();
  const btn = document.querySelector(`#card-${qId} .btn-icon`);
  if (btn) {
    btn.classList.toggle('bookmarked', state.userProgress.bookmarks[qId]);
    btn.textContent = state.userProgress.bookmarks[qId] ? '★' : '☆';
  }
  showToast(state.userProgress.bookmarks[qId] ? 'Question bookmarked' : 'Bookmark removed');
};

window.toggleSolution = function(qId) {
  const box = document.getElementById(`sol-${qId}`);
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
};

window.selectOption = function(qId, selectedOption, correctAnswer) {
  const isCorrect = (selectedOption === correctAnswer);
  state.userProgress.attempts[qId] = {
    selected: selectedOption,
    isCorrect: isCorrect,
    timestamp: Date.now()
  };
  saveLocalStorage();

  // Update UI instantly
  const optsContainer = document.getElementById(`opts-${qId}`);
  if (optsContainer) {
    const items = optsContainer.querySelectorAll('.option-item');
    items.forEach((item, idx) => {
      const letter = String.fromCharCode(65 + idx);
      item.classList.remove('selected', 'correct', 'incorrect');
      if (letter === selectedOption) {
        item.classList.add('selected');
        item.classList.add(isCorrect ? 'correct' : 'incorrect');
      }
      if (!isCorrect && letter === correctAnswer) {
        item.classList.add('correct');
      }
    });
  }

  const badge = document.getElementById(`status-badge-${qId}`);
  if (badge) {
    badge.innerHTML = isCorrect ? '<span class="status-badge status-complete">✓ Solved Correct</span>' : '<span class="status-badge status-missing">✗ Solved Incorrect</span>';
  }

  // Open solution box
  window.toggleSolution(qId);
  showToast(isCorrect ? 'Correct Answer! (+marks awarded)' : 'Incorrect Answer (Negative marking applied)');
};

window.submitNat = function(qId, correctAnswer) {
  const input = document.getElementById(`nat-val-${qId}`);
  const val = input ? input.value.trim() : '';
  if (!val) return;

  const isCorrect = (val === correctAnswer);
  state.userProgress.attempts[qId] = {
    selected: val,
    isCorrect: isCorrect,
    timestamp: Date.now()
  };
  saveLocalStorage();

  const badge = document.getElementById(`status-badge-${qId}`);
  if (badge) {
    badge.innerHTML = isCorrect ? '<span class="status-badge status-complete">✓ Solved Correct</span>' : '<span class="status-badge status-missing">✗ Solved Incorrect</span>';
  }
  window.toggleSolution(qId);
  showToast(isCorrect ? 'Correct numerical answer!' : `Incorrect. Expected answer is ${correctAnswer}`);
};

// Pagination Rendering
function renderPagination(totalPages) {
  const renderBtns = (el) => {
    el.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = state.pagination.page === 1;
    prevBtn.addEventListener('click', () => { state.pagination.page--; applyFiltersAndRender(); });
    el.appendChild(prevBtn);

    const maxShown = 5;
    let startPage = Math.max(1, state.pagination.page - 2);
    let endPage = Math.min(totalPages, startPage + maxShown - 1);
    if (endPage - startPage < maxShown - 1) {
      startPage = Math.max(1, endPage - maxShown + 1);
    }

    for (let p = startPage; p <= endPage; p++) {
      const pBtn = document.createElement('button');
      pBtn.className = `page-btn ${p === state.pagination.page ? 'active' : ''}`;
      pBtn.textContent = p;
      pBtn.addEventListener('click', () => { state.pagination.page = p; applyFiltersAndRender(); });
      el.appendChild(pBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = state.pagination.page === totalPages;
    nextBtn.addEventListener('click', () => { state.pagination.page++; applyFiltersAndRender(); });
    el.appendChild(nextBtn);
  };

  renderBtns(document.getElementById('topPagination'));
  renderBtns(document.getElementById('bottomPagination'));
}

// Special Views
function hideAllSpecialViews() {
  document.getElementById('questionsContainer').style.display = 'none';
  document.getElementById('auditViewContainer').style.display = 'none';
  document.getElementById('missingViewContainer').style.display = 'none';
  document.getElementById('practiceViewContainer').style.display = 'none';
  document.getElementById('analyticsViewContainer').style.display = 'none';
  document.getElementById('topPagination').innerHTML = '';
  document.getElementById('bottomPagination').innerHTML = '';
}

function renderSourceAuditView() {
  const container = document.getElementById('auditViewContainer');
  container.style.display = 'block';
  
  let html = `
    <h2>Mode H: Source Directory &amp; Audit Registry</h2>
    <p style="color:var(--text-secondary); margin-bottom:18px;">
      Multi-source reconciliation directory linking all official question repositories and primary archives.
    </p>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:16px; margin-bottom:28px;">
  `;

  state.sources.forEach(src => {
    html += `
      <div class="question-card">
        <h3 style="color:var(--accent-primary); font-size:1rem; margin-bottom:6px;">${escapeHtml(src.name)}</h3>
        <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:8px;">${escapeHtml(src.type)} • Years: ${src.years_covered}</p>
        <p style="font-size:0.85rem; margin-bottom:10px;">${escapeHtml(src.reliability_notes)}</p>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:12px;">
          Status: <strong>${escapeHtml(src.accessibility_status)}</strong>
        </div>
        <a href="${src.url}" target="_blank" class="btn btn-secondary btn-sm">Visit Source ↗</a>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function renderMissingDataView() {
  const container = document.getElementById('missingViewContainer');
  container.style.display = 'block';

  let html = `
    <h2>Mode J: Missing-Data &amp; Year-by-Year Coverage Matrix (1983–2026)</h2>
    <p style="color:var(--text-secondary); margin-bottom:16px;">
      Complete archival coverage audit for all 44 calendar years. Transparent reporting of unlocatable pre-digitization exams and historical fragments.
    </p>
    <div class="audit-table-wrap">
      <table class="audit-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Exam Held / Institute</th>
            <th>Completeness Status</th>
            <th>Verified Qs</th>
            <th>Official Key</th>
            <th>Sources Checked</th>
            <th>Archival Gaps / Notes</th>
          </tr>
        </thead>
        <tbody>
  `;

  state.coverage.forEach(cov => {
    const liveCount = state.questions.filter(q => q.year === cov.year).length;
    const isComplete = cov.paper_completeness_status.includes('Verified complete') || liveCount >= 45;
    const isMissing = cov.year < 1987 && liveCount === 0;
    const badgeClass = isComplete ? 'status-complete' : (isMissing ? 'status-missing' : 'status-partial');
    const displayStatus = isMissing ? 'No applicable examination / Paper not located' : (isComplete ? (cov.year >= 2014 ? (cov.year === 2014 || cov.year === 2015 ? 'Verified complete (Multi-session 3 Sets)' : 'Verified complete (Multi-session 2 Sets)') : 'Verified complete paper') : 'Partially available historical paper');

    html += `
      <tr>
        <td><strong>${cov.year}</strong></td>
        <td>${cov.organizing_institute || 'National Committee'}</td>
        <td><span class="status-badge ${badgeClass}">${displayStatus}</span></td>
        <td><strong>${liveCount}</strong></td>
        <td>${cov.official_key_available || liveCount > 0 ? '✓ Available' : '—'}</td>
        <td style="font-size:0.75rem;">${cov.sources_checked.join(', ')}</td>
        <td style="font-size:0.8rem; color:var(--text-secondary);">${cov.gaps_and_notes}</td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;
  container.innerHTML = html;
}

function renderAnalyticsView() {
  const container = document.getElementById('analyticsViewContainer');
  container.style.display = 'block';

  const totalAttempted = Object.keys(state.userProgress.attempts).length;
  const correctCount = Object.values(state.userProgress.attempts).filter(a => a.isCorrect).length;
  const incorrectCount = totalAttempted - correctCount;
  const accuracy = totalAttempted > 0 ? ((correctCount / totalAttempted) * 100).toFixed(1) : 0;
  const bookmarkCount = Object.values(state.userProgress.bookmarks).filter(b => b).length;

  let html = `
    <h2>Progress &amp; Preparation Analytics</h2>
    <p style="color:var(--text-secondary); margin-bottom:20px;">
      Track solved questions, accuracy rates, and revision bookmarks stored locally in your browser.
    </p>
    <div class="analytics-grid">
      <div class="analytics-card">
        <h4>Total Attempted</h4>
        <div class="metric-val">${totalAttempted}</div>
      </div>
      <div class="analytics-card">
        <h4>Accuracy Rate</h4>
        <div class="metric-val" style="color:var(--success);">${accuracy}%</div>
      </div>
      <div class="analytics-card">
        <h4>Correct Answers</h4>
        <div class="metric-val" style="color:var(--success);">${correctCount}</div>
      </div>
      <div class="analytics-card">
        <h4>Incorrect Answers</h4>
        <div class="metric-val" style="color:var(--error);">${incorrectCount}</div>
      </div>
      <div class="analytics-card">
        <h4>Bookmarked Questions</h4>
        <div class="metric-val" style="color:var(--warning);">${bookmarkCount}</div>
      </div>
    </div>
    
    <div style="margin-top:28px;">
      <button class="btn btn-primary" onclick="filterIncorrect()">Review Incorrect Questions</button>
      <button class="btn btn-secondary" style="margin-left:10px;" onclick="filterBookmarked()">Practice Bookmarked</button>
      <button class="btn btn-danger" style="margin-left:10px;" onclick="resetProgress()">Reset History</button>
    </div>
  `;

  container.innerHTML = html;
}

function renderPracticeView() {
  const container = document.getElementById('practiceViewContainer');
  container.style.display = 'block';

  container.innerHTML = `
    <h2>Simulated Practice &amp; Custom Mock Tests</h2>
    <p style="color:var(--text-secondary); margin-bottom:20px;">
      Solve authentic GATE questions under timed conditions with standard marking rules (+1, +2, -0.33, -0.66).
    </p>
    <div class="analytics-grid">
      <div class="question-card">
        <h3>Standard Mini Mock (10 Qs)</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin:10px 0;">10 random core questions from across the 1987–2026 archive.</p>
        <button class="btn btn-primary" onclick="startRandomPractice(10)">Start 10 Questions</button>
      </div>
      <div class="question-card">
        <h3>Subject Focused Test (25 Qs)</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin:10px 0;">25 questions focused on your selected subject with timer.</p>
        <button class="btn btn-primary" onclick="startRandomPractice(25)">Start 25 Questions</button>
      </div>
      <div class="question-card">
        <h3>Full Length Paper Practice</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin:10px 0;">Select any complete paper from 1995–2026 in original question order.</p>
        <button class="btn btn-primary" onclick="switchMode('year')">Select Year-Wise Paper</button>
      </div>
    </div>
  `;
}

// Global Helpers
window.switchMode = function(mode) {
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });
  state.activeMode = mode;
  state.pagination.page = 1;
  renderSidebar();
  applyFiltersAndRender();
};

window.startRandomPractice = function(count) {
  let pool = [...state.questions];
  if (state.filters.subject) {
    pool = pool.filter(q => q.subject === state.filters.subject);
  }
  pool.sort(() => 0.5 - Math.random());
  const selected = pool.slice(0, count);
  
  hideAllSpecialViews();
  state.activeMode = 'all';
  document.getElementById('resultsCount').textContent = `Practice Session: ${selected.length} Random Questions`;
  renderQuestions(selected);
  showToast(`Started practice test with ${selected.length} questions!`);
};

window.filterBookmarked = function() {
  state.filters.attemptStatus = 'bookmarked';
  document.getElementById('filterAttempt').value = 'bookmarked';
  window.switchMode('all');
};

window.filterIncorrect = function() {
  state.filters.attemptStatus = 'incorrect';
  document.getElementById('filterAttempt').value = 'incorrect';
  window.switchMode('all');
};

function exportProgress() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.userProgress, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `gate_cse_progress_${new Date().toISOString().slice(0,10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Progress exported successfully.');
}

function importProgress(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      state.userProgress = JSON.parse(event.target.result);
      saveLocalStorage();
      applyFiltersAndRender();
      showToast('Progress imported successfully!');
    } catch (err) {
      showToast('Invalid progress JSON file.', 4000);
    }
  };
  reader.readAsText(file);
}

function resetProgress() {
  if (confirm('Are you sure you want to reset all your progress, answers, and bookmarks?')) {
    state.userProgress = { attempts: {}, bookmarks: {}, notes: {} };
    saveLocalStorage();
    applyFiltersAndRender();
    showToast('All progress has been reset.');
  }
}

function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toastMessage');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatQuestionText(text) {
  if (!text) return '';
  // Convert [latex]...[/latex] to span if KaTeX is not loaded
  let formatted = text.replace(/\n/g, '<br>');
  formatted = formatted.replace(/\r/g, '');
  // preserve code blocks
  formatted = formatted.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  return formatted;
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
