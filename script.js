/* =====================================================
   script.js - Loads projects.json, renders grids,
   handles project modal and lightbox with prev/next.
   Works with grouped projects.json (architecture/production/product)
   or you can keep your existing grouped format.
   ===================================================== */

/* helpers */
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const setLock = (lock) => document.body.classList.toggle('body--lock', lock);

/* modal elements */
const modal = qs('#project-modal');
const modalClose = qs('#modal-close');
const modalTitle = qs('#modal-title');
const modalDesc = qs('#modal-description');
const modalDetails = qs('#modal-details');
const modalGallery = qs('#modal-gallery');

/* lightbox elements */
const lightbox = qs('#lightbox');
const lightboxImg = qs('#lightbox-img');
const lightboxClose = qs('#lightbox-close');
const lightboxPrev = qs('#lightbox-prev');
const lightboxNext = qs('#lightbox-next');
const lightboxCaption = qs('#lightbox-caption');

/* state for lightbox navigation */
let lbImages = [];
let lbIndex = 0;

/* render a single project card inside target grid */
function renderCard(project, gridEl) {
  const cover = project.thumbnail || (project.images && project.images[0]) || '';
  const title = project.title || '';

  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.innerHTML = `
    <img class="card__thumb" src="${cover}" alt="${escapeHtml(title)}">
    <div class="card__label">${escapeHtml(title)}</div>
  `;

  const openHandler = () => openProject(project);
  card.addEventListener('click', openHandler);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHandler(); } });

  gridEl.appendChild(card);
}

/* open project modal */
function openProject(project) {
  modalTitle.textContent = project.title || '';
  modalDesc.textContent = project.description || '';
  modalDetails.textContent = project.details || '';

  // Build gallery items
  modalGallery.innerHTML = '';
  const items = Array.isArray(project.gallery) && project.gallery.length
    ? project.gallery.map(g => (typeof g === 'string' ? { src: g } : g))
    : (project.images || []).map(s => ({ src: s }));

  lbImages = items.map(i => i.src).filter(Boolean);
  lbIndex = 0;

  items.forEach(item => {
    if (!item || !item.src) return;
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.caption || project.title || '';
    img.addEventListener('click', () => openLightbox(item.src, item.caption || ''));
    modalGallery.appendChild(img);
  });

  modal.classList.add('is-open');
  setLock(true);
}

/* close modal */
function closeModal() {
  modal.classList.remove('is-open');
  setLock(false);
}

/* open lightbox showing src (sync index to src) */
function openLightbox(src, caption = '') {
  lbIndex = lbImages.indexOf(src);
  if (lbIndex < 0) lbIndex = 0;
  updateLightbox(caption);
  lightbox.classList.add('is-open');
  setLock(true);
}

/* update lightbox image/caption */
function updateLightbox(caption = '') {
  const src = lbImages[lbIndex];
  lightboxImg.src = src || '';
  lightboxCaption.textContent = caption || '';
}

/* close lightbox */
function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightboxImg.src = '';
  // if modal still open keep lock; otherwise release
  if (!modal.classList.contains('is-open')) setLock(false);
}

/* move image index */
function changeLightbox(step) {
  if (!lbImages.length) return;
  lbIndex = (lbIndex + step + lbImages.length) % lbImages.length;
  updateLightbox();
}

/* event wiring */
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
lightboxPrev.addEventListener('click', () => changeLightbox(-1));
lightboxNext.addEventListener('click', () => changeLightbox(1));

document.addEventListener('keydown', e => {
  if (lightbox.classList.contains('is-open')) {
    if (e.key === 'ArrowRight') changeLightbox(1);
    if (e.key === 'ArrowLeft') changeLightbox(-1);
    if (e.key === 'Escape') closeLightbox();
  } else if (modal.classList.contains('is-open')) {
    if (e.key === 'Escape') closeModal();
  }
});

/* load projects.json and render grids
   supports grouped object { architecture:[..], production:[..], product:[..] }
*/
(async function init() {
  try {
    const res = await fetch('projects.json', { cache: 'no-store' });
    const data = await res.json();

    const byCat = { architecture: [], production: [], product: [] };
    if (Array.isArray(data)) {
      // if data were flat list, you'd need category property on each item
      data.forEach(p => {
        const cat = (p.category || '').toLowerCase();
        if (byCat[cat]) byCat[cat].push(p);
      });
    } else if (data && typeof data === 'object') {
      byCat.architecture = data.architecture || [];
      byCat.production = data.production || [];
      byCat.product = data.product || [];
    }

    Object.entries(byCat).forEach(([cat, list]) => {
      const grid = qs(`#${cat}-grid`);
      if (!grid || !Array.isArray(list)) return;
      list.forEach(p => renderCard(p, grid));
    });
  } catch (err) {
    console.error('projects.json load failed:', err);
  }
})();

/* small helper to avoid XSS if any data is untrusted */
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
  });
}


// Embedded projects loader

(async function loadProjects(){
  try {
    let data = null;
    const dataEl = document.getElementById('projects-data');
    if (dataEl) {
      try { data = JSON.parse(dataEl.textContent); }
      catch(e) { console.error('Failed to parse embedded projects.json', e); }
    }
    if (!data) {
      const res = await fetch('projects.json');
      data = await res.json();
    }
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
      list.forEach(p => renderCard(p, grid));
    });
  } catch (err) {
    console.error('projects.json load failed:', err);
  }
})();
