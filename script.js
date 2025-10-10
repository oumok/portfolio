/* =====================================================
   script.js - Cleaned & working version
   - loads projects (embedded or projects.json)
   - renders grids
   - modal with Concept / Real tabs
   - responsive modal gallery
   - lightbox with prev/next and keyboard controls
   ===================================================== */

/* helpers */
const qs = (sel, el = document) => el && el.querySelector(sel);
const qsa = (sel, el = document) => Array.from((el || document).querySelectorAll(sel));
const setLock = (lock) => document.body.classList.toggle('body--lock', lock);

/* modal elements (these may exist after DOM load) */
const modal = () => qs('#project-modal');
const modalClose = () => qs('#modal-close');
const modalTitle = () => qs('#modal-title');
const modalDesc = () => qs('#modal-description');
const modalDetails = () => qs('#modal-details');
const modalGalleryContainer = () => qs('#modal-gallery');

/* lightbox elements */
const lightbox = () => qs('#lightbox');
const lightboxImg = () => qs('#lightbox-img');
const lightboxClose = () => qs('#lightbox-close');
const lightboxPrev = () => qs('#lightbox-prev');
const lightboxNext = () => qs('#lightbox-next');
const lightboxCaption = () => qs('#lightbox-caption');

/* state for lightbox navigation */
let lbImages = []; // array of src strings for current active group
let lbIndex = 0;

/* ------------------------------------------------------------------
   Render a single project card inside target grid element
   ------------------------------------------------------------------ */
function renderCard(project, gridEl) {
  const cover = project.thumbnail || (project.images && project.images[0]) || '';
  const title = project.title || '';

  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.innerHTML = `
    <img class="card__thumb" src="${escapeHtml(cover)}" alt="${escapeHtml(title)}">
    <div class="card__label">${escapeHtml(title)}</div>
  `;

  const openHandler = () => openProject(project);
  card.addEventListener('click', openHandler);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHandler(); }
  });

  gridEl.appendChild(card);
}

/* ------------------------------------------------------------------
   Ensure modal gallery structure is present:
   - .modal__tabs (two buttons with data-tab="concept"/"real")
   - #modal-gallery .gallery-group.concept
   - #modal-gallery .gallery-group.real
   This will create missing elements if the HTML doesn't already include them.
   ------------------------------------------------------------------ */
function ensureModalStructure() {
  const galleryRoot = modalGalleryContainer();
  if (!galleryRoot) return;

  // create tabs container if missing
  let tabs = qs('.modal__tabs', galleryRoot.parentElement || document);
  if (!tabs) {
    tabs = document.createElement('div');
    tabs.className = 'modal__tabs';
    tabs.innerHTML = `
      <button class="tab-btn active" data-tab="concept">Concept Renders</button>
      <button class="tab-btn" data-tab="real">Real-life Photos</button>
    `;
    // insert tabs before galleryRoot
    galleryRoot.parentElement.insertBefore(tabs, galleryRoot);
  }

  // create gallery groups if missing
  let conceptGroup = qs('.gallery-group.concept', galleryRoot);
  let realGroup = qs('.gallery-group.real', galleryRoot);

  if (!conceptGroup) {
    conceptGroup = document.createElement('div');
    conceptGroup.className = 'gallery-group concept active';
    galleryRoot.appendChild(conceptGroup);
  }

  if (!realGroup) {
    realGroup = document.createElement('div');
    realGroup.className = 'gallery-group real';
    galleryRoot.appendChild(realGroup);
  }

  // add tab click wiring (idempotent)
  qsa('.tab-btn', tabs).forEach(btn => {
    btn.removeEventListener('click', tabClickHandler);
    btn.addEventListener('click', tabClickHandler);
  });
}

/* Tab click handler (separate function so we can remove/listen safely) */
function tabClickHandler(e) {
  const btn = e.currentTarget;
  const tab = btn.getAttribute('data-tab');
  if (!tab) return;

  // toggle active class on buttons
  const tabs = btn.parentElement.querySelectorAll('.tab-btn');
  tabs.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // toggle gallery groups
  const galleryRoot = modalGalleryContainer();
  if (!galleryRoot) return;
  galleryRoot.querySelectorAll('.gallery-group').forEach(g => g.classList.remove('active'));
  const activeGroup = qs(`.gallery-group.${tab}`, galleryRoot);
  if (activeGroup) activeGroup.classList.add('active');

  // update lightbox image list to active group's images
  lbImages = qsa('img', activeGroup).map(i => i.src);
  lbIndex = 0;
}

/* ------------------------------------------------------------------
   Open a project into the modal, fill concept / real groups
   ------------------------------------------------------------------ */
function openProject(project) {
  ensureModalStructure(); // safe-guard

  const m = modal();
  if (!m) return;

  modalTitle().textContent = project.title || '';
  modalDesc().textContent = project.description || '';
  modalDetails().textContent = project.details || '';

  // find groups
  const galleryRoot = modalGalleryContainer();
  const conceptGroup = qs('.gallery-group.concept', galleryRoot);
  const realGroup = qs('.gallery-group.real', galleryRoot);

  // clear previous
  conceptGroup.innerHTML = '';
  realGroup.innerHTML = '';

  // Fill concept renders (project.gallery or project.images fallback)
  const conceptItems = Array.isArray(project.gallery) && project.gallery.length
    ? project.gallery
    : (Array.isArray(project.images) ? project.images : []);

  conceptItems.forEach(item => {
    const data = (typeof item === 'string') ? { src: item } : item || {};
    if (!data.src) return;
    const img = document.createElement('img');
    img.src = data.src;
    img.alt = data.caption || project.title || '';
    img.addEventListener('click', () => {
      // ensure lbImages reflect current active group before opening
      lbImages = qsa('img', conceptGroup).map(i => i.src);
      lbIndex = lbImages.indexOf(data.src);
      if (lbIndex < 0) lbIndex = 0;
      openLightbox(data.src, data.caption || '');
    });
    conceptGroup.appendChild(img);
  });

  // Fill real photos (project.livePhotos)
  if (Array.isArray(project.livePhotos) && project.livePhotos.length) {
    project.livePhotos.forEach(item => {
      const data = (typeof item === 'string') ? { src: item } : item || {};
      if (!data.src) return;
      const img = document.createElement('img');
      img.src = data.src;
      img.alt = data.caption || project.title || '';
      img.addEventListener('click', () => {
        lbImages = qsa('img', realGroup).map(i => i.src);
        lbIndex = lbImages.indexOf(data.src);
        if (lbIndex < 0) lbIndex = 0;
        openLightbox(data.src, data.caption || '');
      });
      realGroup.appendChild(img);
    });
  }

  // default to concept tab active
  const tabs = document.querySelectorAll('.modal__tabs .tab-btn');
  tabs.forEach(b => b.classList.remove('active'));
  const defaultBtn = document.querySelector('.modal__tabs .tab-btn[data-tab="concept"]');
  if (defaultBtn) defaultBtn.classList.add('active');

  conceptGroup.classList.add('active');
  realGroup.classList.remove('active');

  // prepare lightbox initially with concept images
  lbImages = qsa('img', conceptGroup).map(i => i.src);
  lbIndex = 0;

  m.classList.add('is-open');
  setLock(true);
}

/* ------------------------------------------------------------------
   Modal and lightbox controls
   ------------------------------------------------------------------ */
function closeModal() {
  const m = modal();
  if (!m) return;
  m.classList.remove('is-open');
  setLock(false);
}

function openLightbox(src, caption = '') {
  lbIndex = lbImages.indexOf(src);
  if (lbIndex < 0) lbIndex = 0;
  updateLightbox(caption);
  const lb = lightbox();
  if (!lb) return;
  lb.classList.add('is-open');
  setLock(true);
}

function updateLightbox(caption = '') {
  const imgEl = lightboxImg();
  const capEl = lightboxCaption();
  if (!imgEl || !capEl) return;
  imgEl.src = lbImages[lbIndex] || '';
  // If caption not passed, try to pull from current active gallery image alt
  if (!caption) {
    const activeGroup = qs('#modal-gallery .gallery-group.active');
    const imgs = activeGroup ? qsa('img', activeGroup) : [];
    if (imgs[lbIndex]) caption = imgs[lbIndex].alt || '';
  }
  capEl.textContent = caption || '';
}

function closeLightbox() {
  const lb = lightbox();
  if (!lb) return;
  lb.classList.remove('is-open');
  const imgEl = lightboxImg();
  if (imgEl) imgEl.src = '';
  if (!modal().classList.contains('is-open')) setLock(false);
}

function changeLightbox(step) {
  if (!lbImages || !lbImages.length) return;
  lbIndex = (lbIndex + step + lbImages.length) % lbImages.length;
  updateLightbox();
}

/* ------------------------------------------------------------------
   Wire up persistent event listeners (modal close, lightbox buttons, keys)
   ------------------------------------------------------------------ */
function wireGlobalEvents() {
  // modal close and click outside
  const mClose = modalClose();
  if (mClose) mClose.addEventListener('click', closeModal);
  const m = modal();
  if (m) m.addEventListener('click', e => { if (e.target === m) closeModal(); });

  // lightbox controls
  const lbClose = lightboxClose();
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  const lb = lightbox();
  if (lb) lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  const lbP = lightboxPrev();
  const lbN = lightboxNext();
  if (lbP) lbP.addEventListener('click', () => changeLightbox(-1));
  if (lbN) lbN.addEventListener('click', () => changeLightbox(1));

  // keyboard
  document.addEventListener('keydown', e => {
    const lbOpen = lightbox() && lightbox().classList.contains('is-open');
    const modalOpen = modal() && modal().classList.contains('is-open');
    if (lbOpen) {
      if (e.key === 'ArrowRight') changeLightbox(1);
      if (e.key === 'ArrowLeft') changeLightbox(-1);
      if (e.key === 'Escape') closeLightbox();
    } else if (modalOpen) {
      if (e.key === 'Escape') closeModal();
    }
  });
}

/* ------------------------------------------------------------------
   Load projects (embedded or external) and render into grids
   - supports embedded <script id="projects-data"> JSON OR external projects.json
   - uses cache-busting to avoid stale JSON on GH Pages
   ------------------------------------------------------------------ */
(async function loadProjects() {
  try {
    let data = null;

    // 1) try embedded JSON (script tag with id="projects-data")
    const dataEl = document.getElementById('projects-data');
    if (dataEl && dataEl.textContent.trim()) {
      try {
        data = JSON.parse(dataEl.textContent);
      } catch (err) {
        console.warn('Embedded projects JSON parse failed:', err);
        data = null;
      }
    }

    // 2) If not embedded, fetch external projects.json (cache-busted)
    if (!data) {
      const res = await fetch(`./projects.json?nocache=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('projects.json fetch failed: ' + res.status);
      data = await res.json();
    }

    // ensure modal structure and event wiring are ready
    ensureModalStructure();
    wireGlobalEvents();

    // render sections
    const mappings = {
      architecture: '#architecture .grid',
      production: '#production .grid',
      product: '#product .grid'
    };

    Object.keys(mappings).forEach(key => {
      const list = data[key];
      const grid = document.querySelector(mappings[key]);
      if (!grid || !Array.isArray(list)) return;
      grid.innerHTML = ''; // clear old
      list.forEach(p => renderCard(p, grid));
    });

    console.log('✅ Projects loaded', data);

  } catch (err) {
    console.error('projects.json load failed:', err);
  }
})();

/* ------------------------------------------------------------------
   small helper to avoid XSS if any data is untrusted
   ------------------------------------------------------------------ */
function escapeHtml(str = '') {
  return String(str || '').replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
  });
}
