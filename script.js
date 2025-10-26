/* -------------------- Helpers -------------------- */
const qs = (sel, el = document) => (el || document).querySelector(sel);
const qsa = (sel, el = document) => Array.from((el || document).querySelectorAll(sel));
const setLock = (lock) => document.body.classList.toggle('body--lock', lock);

/* -------------------- Elements -------------------- */
const modal = () => qs('#project-modal');
const modalPanel = () => qs('.modal__panel');
const modalClose = () => qs('#modal-close');
const modalTitle = () => qs('#modal-title');
const modalDesc = () => qs('#modal-description');
const modalTabs = () => qs('#modal-tabs');
const modalGallery = () => qs('#modal-gallery');

const lightbox = () => qs('#lightbox');
const lightboxImg = () => qs('#lightbox-img');
const lightboxClose = () => qs('#lightbox-close');
const lightboxPrev = () => qs('#lightbox-prev');
const lightboxNext = () => qs('#lightbox-next');
const lightboxCaption = () => qs('#lightbox-caption');

let lbImages = []; // [{src, caption}]
let lbIndex = 0;

/* -------------------- Normalizers -------------------- */
function normalizeImage(item) {
  if (!item) return { src: '', caption: '' };
  if (typeof item === 'string') return { src: item, caption: '' };
  return { src: item.src || item, caption: item.caption || item.alt || '' };
}

function normalizeGroupsFromProject(project) {
  // Option A: expect project.gallery to be an array of groups:
  // project.gallery = [ { group: "Concept Sketches", images: [ {src,caption}, ... ] }, ... ]
  if (Array.isArray(project.gallery) && project.gallery.length && project.gallery[0].group) {
    return project.gallery.map(g => ({
      name: g.group || g.name || 'Gallery',
      images: Array.isArray(g.images) ? g.images.map(normalizeImage) : []
    }));
  }

  // Fallback: legacy shapes -> gallery/images/livePhotos arrays
  const combined = [];
  ['gallery', 'images', 'livePhotos'].forEach(key => {
    if (Array.isArray(project[key])) {
      project[key].forEach(i => combined.push(normalizeImage(i)));
    }
  });

  // If there are explicit project.groups (alternate shape), support that
  if (Array.isArray(project.groups) && project.groups.length) {
    return project.groups.map(g => ({
      name: g.name || g.group || 'Gallery',
      images: Array.isArray(g.images) ? g.images.map(normalizeImage) : []
    }));
  }

  // Wrap combined into a single group if nothing else
  if (combined.length) {
    return [{ name: 'Gallery', images: combined }];
  }

  // Empty fallback
  return [{ name: 'Gallery', images: [] }];
}

/* -------------------- Render Card -------------------- */
function getThumb(project) {
  if (project.thumbnail) return project.thumbnail;
  // look for first image in any common field
  const fields = ['gallery', 'images', 'livePhotos', 'groups'];
  for (const k of fields) {
    const val = project[k];
    if (Array.isArray(val) && val.length) {
      // if groups shape, dive
      if (k === 'groups' && val[0] && val[0].images && val[0].images.length) {
        return typeof val[0].images[0] === 'string' ? val[0].images[0] : (val[0].images[0].src || '');
      }
      const first = val[0];
      if (typeof first === 'string') return first;
      if (first && first.src) return first.src;
    }
  }
  return '';
}

function renderCard(project, gridEl) {
  const thumb = getThumb(project) || '';
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.innerHTML = `
    <img class="card__thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(project.title||'')}">
    <div class="card__label">${escapeHtml(project.title||'')}</div>
  `;
  card.addEventListener('click', () => openProject(project));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(project); }});
  gridEl.appendChild(card);
}

/* -------------------- Escape HTML -------------------- */
function escapeHtml(str='') {
  return String(str||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

/* -------------------- Open Project (tabs & groups) -------------------- */
function openProject(project) {
  const galleryEl = modalGallery();
  const tabsEl = modalTabs();
  if (!galleryEl || !tabsEl) return;

  galleryEl.innerHTML = '';
  tabsEl.innerHTML = '';
  modalTitle().textContent = project.title || '';
  modalDesc().textContent = project.description || '';

  const groups = normalizeGroupsFromProject(project);

  // render tabs (only if >1 group)
  if (groups.length > 1) {
    groups.forEach((g, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
      btn.textContent = g.name || `Group ${idx+1}`;
      btn.addEventListener('click', () => {
        // tab toggle
        qsa('.tab-btn', tabsEl).forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        // show corresponding gallery-group
        qsa('.gallery-group', galleryEl).forEach(c=>c.classList.remove('active'));
        const target = qs(`#gallery-group-${idx}`, galleryEl);
        if (target) target.classList.add('active');
      });
      tabsEl.appendChild(btn);
    });
  }

  // render gallery groups
  groups.forEach((g, idx) => {
    const groupWrap = document.createElement('div');
    groupWrap.className = 'gallery-group' + (idx===0 ? ' active' : '');
    groupWrap.id = `gallery-group-${idx}`;

    (g.images || []).forEach(imgObj => {
      const n = normalizeImage(imgObj);
      const img = document.createElement('img');
      img.src = n.src || '';
      img.alt = n.caption || project.title || '';
      // Clicking an image loads the lightbox for this group's images
      img.addEventListener('click', () => {
        lbImages = (g.images || []).map(normalizeImage);
        lbIndex = lbImages.findIndex(i=>i.src === n.src);
        if (lbIndex < 0) lbIndex = 0;
        openLightbox(lbImages[lbIndex].src, lbImages[lbIndex].caption);
      });
      groupWrap.appendChild(img);
    });

    galleryEl.appendChild(groupWrap);
  });

  modal().classList.add('is-open');
  setLock(true);
}

/* -------------------- Modal & Lightbox Controls -------------------- */
function closeModal() {
  const m = modal();
  if (!m) return;
  m.classList.remove('is-open');
  setLock(false);
}

function openLightbox(src, caption='') {
  if (!src) return;
  const lb = lightbox();
  if (!lb) return;
  if (!Array.isArray(lbImages) || lbImages.length === 0) lbImages = [{ src, caption }];
  lbIndex = lbImages.findIndex(i=>i.src === src);
  if (lbIndex < 0) lbIndex = 0;
  updateLightbox();
  lb.classList.add('is-open');
  setLock(true);
}

function closeLightbox() {
  const lb = lightbox();
  if (!lb) return;
  lb.classList.remove('is-open');
  // if modal is closed too, unlock
  if (!modal().classList.contains('is-open')) setLock(false);
}

function changeLightbox(step) {
  if (!Array.isArray(lbImages) || lbImages.length === 0) return;
  lbIndex = (lbIndex + step + lbImages.length) % lbImages.length;
  updateLightbox();
}

function updateLightbox() {
  const img = lightboxImg();
  const cap = lightboxCaption();
  if (!img || !cap) return;
  const entry = lbImages[lbIndex] || {};
  img.src = entry.src || '';
  cap.textContent = entry.caption || '';
}

/* -------------------- Wiring & init -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // modal panel click: close only when clicking background outside panel
  modal()?.addEventListener('click', (e) => {
    if (!modalPanel()) return;
    if (!modalPanel().contains(e.target)) closeModal();
  });

  modalClose()?.addEventListener('click', closeModal);

  lightboxClose()?.addEventListener('click', closeLightbox);
  lightbox()?.addEventListener('click', (e) => { if (e.target === lightbox()) closeLightbox(); });

  lightboxPrev()?.addEventListener('click', () => changeLightbox(-1));
  lightboxNext()?.addEventListener('click', () => changeLightbox(1));

  document.addEventListener('keydown', (e) => {
    if (lightbox()?.classList.contains('is-open')) {
      if (e.key === 'ArrowRight') changeLightbox(1);
      if (e.key === 'ArrowLeft') changeLightbox(-1);
      if (e.key === 'Escape') closeLightbox();
    } else if (modal()?.classList.contains('is-open')) {
      if (e.key === 'Escape') closeModal();
    }
  });

  // smooth scroll for local nav chips (external links are left alone)
  qsa('.intro__nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '';
      if (/^https?:\/\//i.test(href)) return;
      if (!href.startsWith('#')) return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // load projects: embedded JSON first (clean comment stripping), fallback to fetch
  (async function loadProjects() {
    let data = null;
    const dataEl = document.getElementById('projects-data');
    if (dataEl && dataEl.textContent.trim()) {
      try {
        const raw = dataEl.textContent.replace(/<!--[\s\S]*?-->/g, '').trim();
        data = JSON.parse(raw);
      } catch (err) {
        console.error('Error parsing embedded JSON:', err);
      }
    }

    if (!data) {
      try {
        const res = await fetch('./projects.json', { cache: 'no-store' });
        data = await res.json();
      } catch (err) {
        console.error('Failed to load projects.json', err);
        return;
      }
    }

    const mappings = {
      architecture: '#architecture-grid',
      production: '#production-grid',
      product: '#product-grid',
      freelance: '#freelance-grid'
    };

    Object.keys(mappings).forEach(k => {
      const grid = document.querySelector(mappings[k]);
      const list = data[k];
      if (!grid || !Array.isArray(list)) return;
      grid.innerHTML = '';
      list.forEach(p => renderCard(p, grid));
    });
  })();

  // visitor counter
(async function visitorCounter() {
  const counter = document.getElementById('visit-count');
  if (!counter) return;

  const key = "oumkuvelkar_portfolio_visits";

  try {
    // Ensure counter exists if first-time setup — increment afterwards
    await fetch(`https://api.countapi.xyz/create?namespace=oumkuvelkar&key=${key}&value=0`, { method: "GET" });

    const res = await fetch(`https://api.countapi.xyz/hit/oumkuvelkar/${key}`);
    const json = await res.json();

    counter.textContent = (json && json.value)
      ? Number(json.value).toLocaleString()
      : "N/A";
  } catch (err) {
    console.error("Visit counter failed:", err);
    counter.textContent = "N/A";
  }
})();
});

/* -------------------- end script -------------------- */

