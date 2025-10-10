/* =====================================================
   script.js - Full Drop-in Version
   Supports:
   - Three sections: architecture / production / product
   - Modal with tabs (Renders / Real Photos)
   - Responsive gallery
   - Lightbox with prev/next and keyboard navigation
   - Safe HTML escaping
===================================================== */

/* Helpers */
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from((el || document).querySelectorAll(sel));
const setLock = lock => document.body.classList.toggle('body--lock', lock);

/* Modal & Lightbox elements */
const modalEl = () => qs('#project-modal');
const modalCloseBtn = () => qs('#modal-close');
const modalTitle = () => qs('#modal-title');
const modalDesc = () => qs('#modal-description');
const modalDetails = () => qs('#modal-details');
const modalGallery = () => qs('#modal-gallery');
const modalTabs = () => qs('.modal__tabs');

const lightboxEl = () => qs('#lightbox');
const lightboxImg = () => qs('#lightbox-img');
const lightboxCaption = () => qs('#lightbox-caption');
const lightboxCloseBtn = () => qs('#lightbox-close');
const lightboxPrevBtn = () => qs('#lightbox-prev');
const lightboxNextBtn = () => qs('#lightbox-next');

/* State */
let activeProject = null;
let lbImages = [];
let lbIndex = 0;

/* ------------------------------------------------------------------
   Escape HTML helper
------------------------------------------------------------------ */
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m]));
}

/* ------------------------------------------------------------------
   Render a single project card
------------------------------------------------------------------ */
function renderCard(project, gridEl) {
  const cover = project.thumbnail || (project.images && project.images[0]) || '';
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.innerHTML = `
    <img class="card__thumb" src="${escapeHtml(cover)}" alt="${escapeHtml(project.title)}">
    <div class="card__label">${escapeHtml(project.title)}</div>
  `;

  const openHandler = () => openProject(project);
  card.addEventListener('click', openHandler);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHandler(); }
  });

  gridEl.appendChild(card);
}

/* ------------------------------------------------------------------
   Open project modal and populate tabs
------------------------------------------------------------------ */
function openProject(project) {
  activeProject = project;

  modalTitle().textContent = project.title || '';
  modalDesc().textContent = project.description || '';
  modalDetails().textContent = project.details || '';

  // Clear previous gallery
  modalGallery().innerHTML = '';
  modalTabs().innerHTML = '';

  // Prepare tabs
  const tabs = [];
  if (project.gallery?.length) tabs.push({name: 'Renders / Plans', key: 'gallery'});
  if (project.livePhotos?.length) tabs.push({name: 'Real-life Photos', key: 'livePhotos'});
  if (!project.gallery && !project.livePhotos && project.images?.length) tabs.push({name: 'Gallery', key: 'images'});

  tabs.forEach((tab, idx) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.textContent = tab.name;
    if (idx === 0) btn.classList.add('active');
    btn.addEventListener('click', () => showTab(tab.key, btn));
    modalTabs().appendChild(btn);
  });

  if (tabs[0]) showTab(tabs[0].key, modalTabs().querySelector('.tab-btn'));

  modalEl().classList.add('is-open');
  setLock(true);
}

/* ------------------------------------------------------------------
   Show tab content
------------------------------------------------------------------ */
function showTab(key, btn) {
  // Update active button
  qsa('.tab-btn', btn.parentElement).forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Fill gallery
  modalGallery().innerHTML = '';
  let items = [];
  if (key === 'gallery') items = activeProject.gallery || [];
  else if (key === 'livePhotos') items = activeProject.livePhotos || [];
  else if (key === 'images') items = (activeProject.images || []).map(src => ({src}));

  items.forEach(item => {
    const data = (typeof item === 'string') ? {src: item} : item;
    const img = document.createElement('img');
    img.src = data.src;
    img.alt = data.caption || activeProject.title || '';
    img.addEventListener('click', () => {
      lbImages = items.map(i => typeof i === 'string' ? i : i.src);
      lbIndex = lbImages.indexOf(data.src); if (lbIndex < 0) lbIndex = 0;
      openLightbox(data.src, data.caption || '');
    });
    modalGallery().appendChild(img);
  });
}

/* ------------------------------------------------------------------
   Modal controls
------------------------------------------------------------------ */
function closeModal() {
  modalEl().classList.remove('is-open');
  setLock(false);
}

/* ------------------------------------------------------------------
   Lightbox controls
------------------------------------------------------------------ */
function openLightbox(src, caption='') {
  lbIndex = lbImages.indexOf(src); if (lbIndex < 0) lbIndex = 0;
  updateLightbox(caption);
  lightboxEl().classList.add('is-open');
  setLock(true);
}

function updateLightbox(caption='') {
  lightboxImg().src = lbImages[lbIndex] || '';
  if (!caption) {
    const activeImgs = qsa('#modal-gallery img');
    caption = activeImgs[lbIndex] ? activeImgs[lbIndex].alt : '';
  }
  lightboxCaption().textContent = caption;
}

function closeLightbox() {
  lightboxEl().classList.remove('is-open');
  lightboxImg().src = '';
  if (!modalEl().classList.contains('is-open')) setLock(false);
}

function changeLightbox(step) {
  if (!lbImages.length) return;
  lbIndex = (lbIndex + step + lbImages.length) % lbImages.length;
  updateLightbox();
}

/* ------------------------------------------------------------------
   Wire global events
------------------------------------------------------------------ */
function wireEvents() {
  // Modal close
  modalCloseBtn()?.addEventListener('click', closeModal);
  modalEl()?.addEventListener('click', e => { if (e.target === modalEl()) closeModal(); });

  // Lightbox
  lightboxCloseBtn()?.addEventListener('click', closeLightbox);
  lightboxEl()?.addEventListener('click', e => { if (e.target === lightboxEl()) closeLightbox(); });
  lightboxPrevBtn()?.addEventListener('click', () => changeLightbox(-1));
  lightboxNextBtn()?.addEventListener('click', () => changeLightbox(1));

  // Keyboard
  document.addEventListener('keydown', e => {
    if (lightboxEl()?.classList.contains('is-open')) {
      if (e.key === 'ArrowRight') changeLightbox(1);
      if (e.key === 'ArrowLeft') changeLightbox(-1);
      if (e.key === 'Escape') closeLightbox();
    } else if (modalEl()?.classList.contains('is-open')) {
      if (e.key === 'Escape') closeModal();
    }
  });
}

/* ------------------------------------------------------------------
   Load projects and render grids
------------------------------------------------------------------ */
async function loadProjects() {
  let data = null;

  // Embedded JSON
  const dataEl = document.getElementById('projects-data');
  if (dataEl && dataEl.textContent.trim()) {
    try { data = JSON.parse(dataEl.textContent); } catch(err) { console.warn('JSON parse failed', err); }
  }

  // Fetch fallback
  if (!data) {
    try {
      const res = await fetch(`./projects.json?nocache=${Date.now()}`, {cache:'no-store'});
      if (!res.ok) throw new Error(res.statusText);
      data = await res.json();
    } catch(err) { console.error('projects.json fetch failed', err); return; }
  }

  // Wire events
  wireEvents();

  // Render sections
  const mapping = {
    architecture: '#architecture-grid',
    production: '#production-grid',
    product: '#product-grid'
  };

  Object.keys(mapping).forEach(key => {
    const grid = qs(mapping[key]); if (!grid) return;
    grid.innerHTML = '';
    (data[key] || []).forEach(p => renderCard(p, grid));
  });

  console.log('✅ Projects loaded', data);
}

/* ------------------------------------------------------------------
   Init
------------------------------------------------------------------ */
loadProjects();
