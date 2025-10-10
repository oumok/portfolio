/* -------------------- Helpers -------------------- */
const qs = (sel, el = document) => el && el.querySelector(sel);
const qsa = (sel, el = document) => Array.from((el || document).querySelectorAll(sel));
const setLock = (lock) => document.body.classList.toggle('body--lock', lock);

/* -------------------- Modal & Lightbox Elements -------------------- */
const modal = () => qs('#project-modal');
const modalClose = () => qs('#modal-close');
const modalTitle = () => qs('#modal-title');
const modalDesc = () => qs('#modal-description');
const modalDetails = () => qs('#modal-details');
const modalGallery = () => qs('#modal-gallery');

const lightbox = () => qs('#lightbox');
const lightboxImg = () => qs('#lightbox-img');
const lightboxClose = () => qs('#lightbox-close');
const lightboxPrev = () => qs('#lightbox-prev');
const lightboxNext = () => qs('#lightbox-next');
const lightboxCaption = () => qs('#lightbox-caption');

let lbImages = [];
let lbIndex = 0;

/* -------------------- Escape HTML -------------------- */
function escapeHtml(str = '') {
  return String(str || '').replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

/* -------------------- Render Project Card -------------------- */
function renderCard(project, gridEl) {
  const thumb = project.thumbnail || (project.images && project.images[0]) || '';
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;
  card.innerHTML = `
    <img class="card__thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(project.title)}">
    <div class="card__label">${escapeHtml(project.title)}</div>
  `;
  const openHandler = () => openProject(project);
  card.addEventListener('click', openHandler);
  card.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); openHandler(); }});
  gridEl.appendChild(card);
}

/* -------------------- Ensure Modal Structure -------------------- */
function ensureModal() {
  if (!modalGallery()) return;

  let tabs = qs('.modal__tabs', modalGallery().parentElement);
  if (!tabs) {
    tabs = document.createElement('div');
    tabs.className = 'modal__tabs';
    tabs.innerHTML = `
      <button class="tab-btn active" data-tab="concept">Concept Renders</button>
      <button class="tab-btn" data-tab="real">Real-life Photos</button>
    `;
    modalGallery().parentElement.insertBefore(tabs, modalGallery());
  }

  ['concept', 'real'].forEach(cls => {
    if (!qs(`.gallery-group.${cls}`, modalGallery())) {
      const div = document.createElement('div');
      div.className = `gallery-group ${cls}${cls==='concept'?' active':''}`;
      modalGallery().appendChild(div);
    }
  });

  qsa('.tab-btn', tabs).forEach(btn => btn.addEventListener('click', tabClickHandler));
}

/* -------------------- Tab Handler -------------------- */
function tabClickHandler(e) {
  const tab = e.currentTarget.dataset.tab;
  const btns = e.currentTarget.parentElement.querySelectorAll('.tab-btn');
  btns.forEach(b => b.classList.remove('active'));
  e.currentTarget.classList.add('active');
  qsa('.gallery-group', modalGallery()).forEach(g => g.classList.remove('active'));
  qs(`.gallery-group.${tab}`, modalGallery()).classList.add('active');
  lbImages = qsa('img', qs(`.gallery-group.${tab}`, modalGallery())).map(i => i.src);
  lbIndex = 0;
}

/* -------------------- Open Project in Modal -------------------- */
function openProject(project) {
  ensureModal();
  modalTitle().textContent = project.title || '';
  modalDesc().textContent = project.description || '';
  modalDetails().textContent = project.details || '';

  const conceptGroup = qs('.gallery-group.concept', modalGallery());
  const realGroup = qs('.gallery-group.real', modalGallery());
  conceptGroup.innerHTML = '';
  realGroup.innerHTML = '';

  // Concept images
  const conceptImages = project.gallery || project.images || [];
  conceptImages.forEach(img => {
    const src = typeof img==='string'?img:img.src;
    const caption = typeof img==='string'?'':img.caption;
    const el = document.createElement('img');
    el.src = src;
    el.alt = caption || project.title;
    el.addEventListener('click', () => {
      lbImages = qsa('img', conceptGroup).map(i=>i.src);
      lbIndex = lbImages.indexOf(src);
      openLightbox(src, caption);
    });
    conceptGroup.appendChild(el);
  });

  // Real-life photos
  const realImages = project.livePhotos || [];
  realImages.forEach(img => {
    const src = typeof img==='string'?img:img.src;
    const caption = typeof img==='string'?'':img.caption;
    const el = document.createElement('img');
    el.src = src;
    el.alt = caption || project.title;
    el.addEventListener('click', () => {
      lbImages = qsa('img', realGroup).map(i=>i.src);
      lbIndex = lbImages.indexOf(src);
      openLightbox(src, caption);
    });
    realGroup.appendChild(el);
  });

  // Default to concept tab
  qs('.tab-btn[data-tab="concept"]', modalGallery().parentElement).classList.add('active');
  conceptGroup.classList.add('active');
  realGroup.classList.remove('active');

  lbImages = qsa('img', conceptGroup).map(i=>i.src);
  lbIndex = 0;

  modal().classList.add('is-open');
  setLock(true);
}

/* -------------------- Modal & Lightbox Controls -------------------- */
function closeModal() { modal().classList.remove('is-open'); setLock(false); }
function openLightbox(src, caption='') { lbIndex = lbImages.indexOf(src); if(lbIndex<0) lbIndex=0; updateLightbox(caption); lightbox().classList.add('is-open'); setLock(true); }
function updateLightbox(caption='') {
  lightboxImg().src = lbImages[lbIndex]||'';
  if(!caption) {
    const active = qs('.gallery-group.active', modalGallery());
    const imgs = active? qsa('img', active) : [];
    if(imgs[lbIndex]) caption = imgs[lbIndex].alt || '';
  }
  lightboxCaption().textContent = caption;
}
function closeLightbox() { lightbox().classList.remove('is-open'); lightboxImg().src=''; if(!modal().classList.contains('is-open')) setLock(false); }
function changeLightbox(step) { lbIndex=(lbIndex+step+lbImages.length)%lbImages.length; updateLightbox(); }

/* -------------------- Global Event Wiring -------------------- */
function wireEvents() {
  modalClose().addEventListener('click', closeModal);
  modal().addEventListener('click', e=>{ if(e.target===modal()) closeModal(); });
  lightboxClose().addEventListener('click', closeLightbox);
  lightbox().addEventListener('click', e=>{ if(e.target===lightbox()) closeLightbox(); });
  lightboxPrev().addEventListener('click',()=>changeLightbox(-1));
  lightboxNext().addEventListener('click',()=>changeLightbox(1));
  document.addEventListener('keydown', e=>{
    if(lightbox().classList.contains('is-open')) {
      if(e.key==='ArrowRight') changeLightbox(1);
      if(e.key==='ArrowLeft') changeLightbox(-1);
      if(e.key==='Escape') closeLightbox();
    } else if(modal().classList.contains('is-open') && e.key==='Escape') closeModal();
  });
}

/* -------------------- Load Projects -------------------- */
(async function(){
  let data=null;
  try {
    const embedded = document.getElementById('projects-data');
    if(embedded && embedded.textContent.trim()) data=JSON.parse(embedded.textContent);
    else {
      const res = await fetch(`./projects.json?nocache=${Date.now()}`);
      if(!res.ok) throw new Error('Failed to load projects.json');
      data = await res.json();
    }

    wireEvents();

    const mappings = {architecture:'#architecture .grid', production:'#production .grid', product:'#product .grid'};
    Object.keys(mappings).forEach(k=>{
      const grid=document.querySelector(mappings[k]);
      if(!grid||!Array.isArray(data[k])) return;
      grid.innerHTML='';
      data[k].forEach(p=>renderCard(p,grid));
    });
  } catch(e){ console.error('Projects load error:', e); }
})();
