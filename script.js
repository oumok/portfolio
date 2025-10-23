/* -------------------- Helpers -------------------- */
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
const setLock = (lock) => document.body.classList.toggle('body--lock', lock);

/* -------------------- Modal & Lightbox -------------------- */
const modal = () => qs('#project-modal');
const modalClose = () => qs('#modal-close');
const modalTitle = () => qs('#modal-title');
const modalDesc = () => qs('#modal-description');
const modalGallery = () => qs('#modal-gallery');

const lightbox = () => qs('#lightbox');
const lightboxImg = () => qs('#lightbox-img');
const lightboxClose = () => qs('#lightbox-close');
const lightboxPrev = () => qs('#lightbox-prev');
const lightboxNext = () => qs('#lightbox-next');
const lightboxCaption = () => qs('#lightbox-caption');

let lbImages = [], lbIndex = 0;

/* -------------------- Escape HTML -------------------- */
function escapeHtml(str = '') {
  return String(str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

/* -------------------- Render Card -------------------- */
function renderCard(project, gridEl) {
  const thumb = project.thumbnail || (project.images && project.images[0]) || '';
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.innerHTML = `
    <img class="card__thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(project.title)}">
    <div class="card__label">${escapeHtml(project.title)}</div>`;
  card.addEventListener('click', () => openProject(project));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(project); } });
  gridEl.appendChild(card);
}

/* -------------------- Open Project (Tabbed Gallery) -------------------- */
function openProject(project) {
  const galleryEl = modalGallery();
  galleryEl.innerHTML = ''; // Clear previous content

  modalTitle().textContent = project.title || '';
  modalDesc().textContent = project.description || '';

  // --- Handle grouped galleries (with tabs) ---
  if (Array.isArray(project.groups) && project.groups.length > 0) {
    // Create tab buttons
    const tabButtons = document.createElement('div');
    tabButtons.className = 'tab-buttons';
    tabButtons.innerHTML = project.groups
      .map((g, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="tab${i}">${g.name}</button>`)
      .join('');
    galleryEl.appendChild(tabButtons);

    // Create tab contents
    project.groups.forEach((group, i) => {
      const tab = document.createElement('div');
      tab.className = `tab-content ${i === 0 ? 'active' : ''}`;
      tab.id = `tab${i}`;

      const galleryGrid = document.createElement('div');
      galleryGrid.className = 'popup-gallery';

      group.images.forEach((imgSrc) => {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = group.name;
        img.addEventListener('click', () => {
          lbImages = group.images;
          lbIndex = group.images.indexOf(imgSrc);
          openLightbox(imgSrc, group.name);
        });
        galleryGrid.appendChild(img);
      });

      tab.appendChild(galleryGrid);
      galleryEl.appendChild(tab);
    });

    // Tab switching
    galleryEl.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        galleryEl.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        galleryEl.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
        btn.classList.add('active');
        galleryEl.querySelector(`#${tabId}`).classList.add('active');
      });
    });
  }

  // --- Handle simple gallery (no groups) ---
  else {
    const allImages = [].concat(project.gallery || [], project.images || [], project.livePhotos || []);
    allImages.forEach((i) => {
      const src = typeof i === 'string' ? i : i.src;
      const caption = (typeof i === 'string' ? project.title : i.caption) || project.title;
      const img = document.createElement('img');
      img.src = src;
      img.alt = caption;
      img.addEventListener('click', () => {
        lbImages = allImages.map((img) => (typeof img === 'string' ? img : img.src));
        lbIndex = lbImages.indexOf(src);
        openLightbox(src, caption);
      });
      galleryEl.appendChild(img);
    });

    lbImages = allImages.map((img) => (typeof img === 'string' ? img : img.src));
  }

  modal().classList.add('is-open');
  setLock(true);
}


/* -------------------- Modal & Lightbox Controls -------------------- */
function closeModal() { modal().classList.remove('is-open'); setLock(false); }
function openLightbox(src, caption = '') { lbIndex = lbImages.indexOf(src); updateLightbox(caption); lightbox().classList.add('is-open'); setLock(true); }
function closeLightbox() { lightbox().classList.remove('is-open'); if (!modal().classList.contains('is-open')) setLock(false); }
function changeLightbox(step) { lbIndex = (lbIndex + step + lbImages.length) % lbImages.length; updateLightbox(); }
function updateLightbox(caption = '') { lightboxImg().src = lbImages[lbIndex] || ''; lightboxCaption().textContent = caption || lightboxImg().alt || ''; }

/* -------------------- Initialize After DOM Load -------------------- */
document.addEventListener('DOMContentLoaded', () => {

  // Modal & Lightbox Events
  modalClose()?.addEventListener('click', closeModal);
  modal()?.addEventListener('click', e => { if (e.target === modal()) closeModal(); });
  lightboxClose()?.addEventListener('click', closeLightbox);
  lightbox()?.addEventListener('click', e => { if (e.target === lightbox()) closeLightbox(); });
  lightboxPrev()?.addEventListener('click', () => changeLightbox(-1));
  lightboxNext()?.addEventListener('click', () => changeLightbox(1));

  document.addEventListener('keydown', e => {
    if (lightbox()?.classList.contains('is-open')) {
      if (e.key === 'ArrowRight') changeLightbox(1);
      if (e.key === 'ArrowLeft') changeLightbox(-1);
      if (e.key === 'Escape') closeLightbox();
    } else if (modal()?.classList.contains('is-open')) {
      if (e.key === 'Escape') closeModal();
    }
  });

  // Smooth Scroll for Navigation Chips
document.querySelectorAll('.intro__nav a').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');

    // If it's an external link (starts with http or https), let it open normally
    if (/^https?:\/\//i.test(href)) return;

    e.preventDefault();
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

  // Load Projects
  (async function loadProjects() {
    let data = null;
    const dataEl = document.getElementById('projects-data');
    if (dataEl && dataEl.textContent.trim()) {
      try { data = JSON.parse(dataEl.textContent); }
      catch (e) { console.error('Error parsing embedded JSON:', e); }
    }

    if (!data) {
      try { const res = await fetch('./projects.json'); data = await res.json(); }
      catch (err) { console.error('Failed to load projects.json', err); return; }
    }

    const mappings = { architecture: '#architecture .grid', production: '#production .grid', product: '#product .grid', freelance: '#freelance .grid' };
    Object.keys(mappings).forEach(k => {
      const grid = document.querySelector(mappings[k]);
      const list = data[k];
      if (!grid || !Array.isArray(list)) return;
      grid.innerHTML = '';
      list.forEach(p => renderCard(p, grid));
    });
  })();
  
  
  // -------------------- Visitor Counter --------------------
  (async () => {
    const counter = document.getElementById('visit-count');
    if (!counter) return;

    try {
      // Simple free counter using countapi.xyz (no backend needed)
      const res = await fetch('https://api.countapi.xyz/hit/oum-portfolio/visits');
      const data = await res.json();
      counter.textContent = data.value.toLocaleString();
    } catch (err) {
      console.error('Visit counter failed:', err);
      counter.textContent = 'N/A';
    }
  })();

});

