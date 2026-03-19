/* ===========================================================
   QuickCopy v3 — Side Panel with Quick Links
   =========================================================== */

const COLORS = [
  '#6366f1','#8b5cf6','#a855f7','#ec4899',
  '#ef4444','#f97316','#eab308','#22c55e',
  '#14b8a6','#06b6d4','#3b82f6','#64748b'
];

let state = {
  categories: [],
  snippets: [],
  quickLinks: [
    { name: '', url: '' },
    { name: '', url: '' }
  ]
};

let activeCat = 'all';
let searchQuery = '';
let editingId = null;
let selectedColor = COLORS[0];
let confirmCallback = null;
let qlEditMode = false;

/* ── Storage ──────────────────────────────────────────────── */
const store = {
  async get () {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get('qc', r => resolve(r.qc || null));
      } else {
        const d = localStorage.getItem('qc');
        resolve(d ? JSON.parse(d) : null);
      }
    });
  },
  async set (data) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ qc: data });
    } else {
      localStorage.setItem('qc', JSON.stringify(data));
    }
  }
};

// Sync in real-time
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.qc) {
      state = changes.qc.newValue || state;
      if (!state.quickLinks) {
        state.quickLinks = [{ name: '', url: '' }, { name: '', url: '' }];
      }
      render();
    }
  });
}

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const saved = await store.get();
  if (saved) {
    state = saved;
    if (!state.quickLinks) {
      state.quickLinks = [{ name: '', url: '' }, { name: '', url: '' }];
    }
  } else {
    state = {
      categories: [{ id: 'general', name: 'General', color: '#6366f1' }],
      snippets: [],
      quickLinks: [{ name: '', url: '' }, { name: '', url: '' }]
    };
    persist();
  }
  renderColorPicker();
  render();
  bind();
});

function persist () { store.set(state); }
function uid () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }
function esc (t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function render () {
  renderCategories();
  renderSnippets();
  renderCategorySelect();
  renderQuickLinks();
}

/* =======================================
   QUICK LINKS
   ======================================= */
function renderQuickLinks () {
  const link1 = state.quickLinks[0] || { name: '', url: '' };
  const link2 = state.quickLinks[1] || { name: '', url: '' };

  const row1 = $('qlRow1');
  const row2 = $('qlRow2');

  if (link1.url) {
    row1.classList.add('has-url');
    $('qlName1').textContent = link1.name || 'Enlace 1';
    $('qlUrl1').textContent = truncateUrl(link1.url);
  } else {
    row1.classList.remove('has-url');
    $('qlName1').textContent = 'Sin configurar';
    $('qlUrl1').textContent = '';
  }

  if (link2.url) {
    row2.classList.add('has-url');
    $('qlName2').textContent = link2.name || 'Enlace 2';
    $('qlUrl2').textContent = truncateUrl(link2.url);
  } else {
    row2.classList.remove('has-url');
    $('qlName2').textContent = 'Sin configurar';
    $('qlUrl2').textContent = '';
  }
}

function truncateUrl (url) {
  try {
    const u = new URL(url);
    let display = u.hostname + u.pathname;
    if (display.length > 40) display = display.substring(0, 40) + '…';
    return display;
  } catch {
    return url.length > 40 ? url.substring(0, 40) + '…' : url;
  }
}

function openQuickLinksEdit () {
  qlEditMode = true;
  const link1 = state.quickLinks[0] || { name: '', url: '' };
  const link2 = state.quickLinks[1] || { name: '', url: '' };

  $('qlEditName1').value = link1.name || '';
  $('qlEditUrl1').value = link1.url || '';
  $('qlEditName2').value = link2.name || '';
  $('qlEditUrl2').value = link2.url || '';

  $('qlView').style.display = 'none';
  $('qlEdit').style.display = 'flex';
}

function closeQuickLinksEdit () {
  qlEditMode = false;
  $('qlView').style.display = 'flex';
  $('qlEdit').style.display = 'none';
}

function saveQuickLinks () {
  state.quickLinks = [
    {
      name: $('qlEditName1').value.trim(),
      url: normalizeUrl($('qlEditUrl1').value.trim())
    },
    {
      name: $('qlEditName2').value.trim(),
      url: normalizeUrl($('qlEditUrl2').value.trim())
    }
  ];
  persist();
  closeQuickLinksEdit();
  renderQuickLinks();
  toast('Enlaces guardados');
}

function normalizeUrl (url) {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  return url;
}

function openQuickLinks () {
  const urls = state.quickLinks
    .map(l => l.url)
    .filter(u => u && u.length > 0);

  if (urls.length === 0) {
    toast('No hay enlaces configurados');
    return;
  }

  if (typeof chrome !== 'undefined' && chrome.tabs) {
    urls.forEach(url => {
      chrome.tabs.create({ url, active: false });
    });
    toast(`${urls.length} enlace${urls.length > 1 ? 's' : ''} abierto${urls.length > 1 ? 's' : ''}`);
  } else {
    urls.forEach(url => window.open(url, '_blank'));
    toast('Enlaces abiertos');
  }
}

function toggleQuickLinksCollapse (e) {
  if (e.target.closest('.quicklinks-header-actions')) return;
  $('quicklinksSection').classList.toggle('collapsed');
}

/* =======================================
   CATEGORIES
   ======================================= */
function renderCategories () {
  const el = $('categoriesList');
  el.innerHTML = '';
  el.appendChild(makePill('all', 'Todos', null, state.snippets.length, activeCat === 'all'));
  state.categories.forEach(c => {
    const count = state.snippets.filter(s => s.catId === c.id).length;
    el.appendChild(makePill(c.id, c.name, c.color, count, activeCat === c.id));
  });
}

function makePill (id, name, color, count, active) {
  const btn = document.createElement('button');
  btn.className = 'cat-pill' + (active ? ' active' : '');

  if (color && active) {
    btn.style.background = color;
    btn.style.borderColor = color;
    btn.style.color = '#fff';
  } else if (color) {
    btn.style.borderColor = color;
    btn.style.color = color;
  }

  const isDeletable = id !== 'all' && id !== 'general';
  btn.innerHTML = `
    <span>${esc(name)}</span>
    <span class="pill-count">${count}</span>
    ${isDeletable ? `<button class="pill-del" data-id="${id}" title="Eliminar">×</button>` : ''}
  `;

  btn.addEventListener('click', e => {
    if (e.target.classList.contains('pill-del')) {
      e.stopPropagation();
      confirmAction(`¿Eliminar categoría <strong>${esc(name)}</strong>?<br>Los snippets se moverán a General.`, () => {
        deleteCategory(e.target.dataset.id);
      });
      return;
    }
    activeCat = id;
    render();
  });
  return btn;
}

function renderCategorySelect () {
  const sel = $('snippetCategorySelect');
  sel.innerHTML = '';
  state.categories.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name;
    sel.appendChild(o);
  });
}

/* =======================================
   SNIPPETS
   ======================================= */
function renderSnippets () {
  const list = $('snippetsList');
  const empty = $('emptyState');
  list.innerHTML = '';

  let items = state.snippets;
  if (activeCat !== 'all') items = items.filter(s => s.catId === activeCat);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.text.toLowerCase().includes(q)
    );
  }

  if (!items.length) {
    list.style.display = 'none';
    empty.classList.add('visible');
    if (searchQuery) {
      empty.querySelector('.empty-title').textContent = 'Sin resultados';
      empty.querySelector('.empty-desc').innerHTML = `No se encontró nada para "<strong>${esc(searchQuery)}</strong>"`;
    } else {
      empty.querySelector('.empty-title').textContent = 'No hay snippets';
      empty.querySelector('.empty-desc').innerHTML = 'Pulsa <strong>+</strong> para guardar tu primer texto';
    }
    return;
  }

  empty.classList.remove('visible');
  list.style.display = 'flex';
  items.forEach(s => list.appendChild(makeRow(s)));
}

function makeRow (snippet) {
  const cat = state.categories.find(c => c.id === snippet.catId);
  const col = cat?.color || '#6366f1';

  const row = document.createElement('div');
  row.className = 'snippet-row';
  row.dataset.sid = snippet.id;

  row.innerHTML = `
    <span class="row-title">${esc(snippet.title)}</span>
    <div class="row-actions">
      <button class="btn-icon btn-edit" title="Editar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="btn-icon btn-icon-danger btn-del" title="Eliminar">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4
            a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
    <svg class="row-copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  `;

  const style = document.createElement('style');
  style.textContent = `.snippet-row[data-sid="${snippet.id}"]::before{background:${col}}`;
  row.appendChild(style);

  row.addEventListener('click', e => {
    if (e.target.closest('.btn-icon')) return;
    copyText(snippet.text, row);
  });

  row.querySelector('.btn-edit').addEventListener('click', e => {
    e.stopPropagation();
    openEditModal(snippet);
  });

  row.querySelector('.btn-del').addEventListener('click', e => {
    e.stopPropagation();
    confirmAction(`¿Eliminar <strong>${esc(snippet.title)}</strong>?`, () => {
      deleteSnippet(snippet.id);
    });
  });

  return row;
}

/* ── Clipboard ──────────────────────────────────────────── */
async function copyText (text, el) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }

  el.classList.add('copied');
  setTimeout(() => el.classList.remove('copied'), 1200);
  toast('¡Copiado al portapapeles!');
}

/* ── CRUD Snippets ──────────────────────────────────────── */
function addSnippet (title, text, catId) {
  state.snippets.unshift({ id: uid(), title, text, catId, ts: Date.now() });
  persist(); render();
}

function updateSnippet (id, title, text, catId) {
  const s = state.snippets.find(x => x.id === id);
  if (s) { s.title = title; s.text = text; s.catId = catId; }
  persist(); render();
}

function deleteSnippet (id) {
  state.snippets = state.snippets.filter(s => s.id !== id);
  persist(); render();
}

/* ── CRUD Categories ────────────────────────────────────── */
function addCategory (name, color) {
  state.categories.push({ id: uid(), name, color });
  persist(); render();
}

function deleteCategory (id) {
  if (id === 'general') return;
  state.snippets.forEach(s => { if (s.catId === id) s.catId = 'general'; });
  state.categories = state.categories.filter(c => c.id !== id);
  if (activeCat === id) activeCat = 'all';
  persist(); render();
}

/* ── Modals ─────────────────────────────────────────────── */
function openAddModal () {
  editingId = null;
  $('modalTitle').textContent = 'Nuevo Snippet';
  $('snippetTitleInput').value = '';
  $('snippetTextInput').value = '';
  renderCategorySelect();
  $('snippetCategorySelect').value = state.categories[0]?.id || 'general';
  $('modalOverlay').classList.add('active');
  setTimeout(() => $('snippetTitleInput').focus(), 100);
}

function openEditModal (snippet) {
  editingId = snippet.id;
  $('modalTitle').textContent = 'Editar Snippet';
  $('snippetTitleInput').value = snippet.title;
  $('snippetTextInput').value = snippet.text;
  renderCategorySelect();
  $('snippetCategorySelect').value = snippet.catId;
  $('modalOverlay').classList.add('active');
  setTimeout(() => $('snippetTitleInput').focus(), 100);
}

function closeModal () { $('modalOverlay').classList.remove('active'); editingId = null; }
function closeConfirm () { $('confirmOverlay').classList.remove('active'); confirmCallback = null; }

function confirmAction (msg, cb) {
  $('confirmText').innerHTML = msg;
  confirmCallback = cb;
  $('confirmOverlay').classList.add('active');
}

function saveSnippet () {
  const title = $('snippetTitleInput').value.trim();
  const text = $('snippetTextInput').value.trim();
  const catId = $('snippetCategorySelect').value;

  if (!title || !text) { toast('Completa título y texto'); return; }

  if (editingId) updateSnippet(editingId, title, text, catId);
  else addSnippet(title, text, catId);

  closeModal();
  toast(editingId ? 'Snippet actualizado' : 'Snippet guardado');
}

/* ── Category Form ──────────────────────────────────────── */
function toggleCatForm () {
  const form = $('categoryForm');
  const open = form.classList.toggle('active');
  if (open) {
    $('catNameInput').value = '';
    selectColor(COLORS[0]);
    setTimeout(() => $('catNameInput').focus(), 150);
  }
}

function renderColorPicker () {
  const wrap = $('colorPicker');
  wrap.innerHTML = '';
  COLORS.forEach(c => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'color-dot' + (c === selectedColor ? ' selected' : '');
    dot.style.background = c;
    dot.addEventListener('click', () => selectColor(c));
    wrap.appendChild(dot);
  });
}

function selectColor (c) {
  selectedColor = c;
  document.querySelectorAll('.color-dot').forEach(d =>
    d.classList.toggle('selected', rgbToHex(d.style.backgroundColor) === c)
  );
}

function saveCategoryForm () {
  const name = $('catNameInput').value.trim();
  if (!name) return;
  addCategory(name, selectedColor);
  toggleCatForm();
  toast('Categoría creada');
}

/* ── Toast ──────────────────────────────────────────────── */
let toastTimer;
function toast (msg) {
  const el = $('toast');
  $('toastMsg').textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
}

/* ── Events ─────────────────────────────────────────────── */
function bind () {
  $('btnAddSnippet').addEventListener('click', openAddModal);
  $('searchInput').addEventListener('input', e => { searchQuery = e.target.value; renderSnippets(); });

  // Quick Links
  $('quicklinksToggle').addEventListener('click', toggleQuickLinksCollapse);
  $('btnEditLinks').addEventListener('click', e => { e.stopPropagation(); openQuickLinksEdit(); });
  $('btnOpenLinks').addEventListener('click', e => { e.stopPropagation(); openQuickLinks(); });
  $('qlSaveBtn').addEventListener('click', saveQuickLinks);
  $('qlCancelBtn').addEventListener('click', closeQuickLinksEdit);

  // Categories
  $('btnAddCategory').addEventListener('click', toggleCatForm);
  $('saveCatBtn').addEventListener('click', saveCategoryForm);
  $('cancelCatBtn').addEventListener('click', toggleCatForm);
  $('catNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveCategoryForm(); });

  // Snippets
  $('saveSnippetBtn').addEventListener('click', saveSnippet);
  $('cancelSnippetBtn').addEventListener('click', closeModal);
  $('btnCloseModal').addEventListener('click', closeModal);
  $('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  // Confirm
  $('confirmOkBtn').addEventListener('click', () => { confirmCallback?.(); closeConfirm(); });
  $('confirmCancelBtn').addEventListener('click', closeConfirm);
  $('confirmOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeConfirm(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeConfirm(); }
  });
}

/* ── Helpers ─────────────────────────────────────────────── */
function $ (id) { return document.getElementById(id); }

function rgbToHex (rgb) {
  if (!rgb || rgb.startsWith('#')) return rgb;
  const m = rgb.match(/\d+/g);
  if (!m) return rgb;
  const [r, g, b] = m.map(Number);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}