// ---------- Helpers ----------
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];
const lockScroll = (lock) => document.body.classList.toggle('body--lock', lock);

// ---------- Modal state ----------
const modal = qs('#project-modal');
const modalCloseBtn = qs('#modal-close');
const modalTitle = qs('#modal-title');
const modalDesc = qs('#modal-description');
const modalDetails = qs('#modal-details');
const modalGallery = qs('#modal-gallery');

// ---------- Lightbox state ----------
const lightbox = qs('#lightbox');
const lightboxImg = qs('#lightbox-img');
const lightboxClose = qs('#lightbox-close');

// Close handlers
function closeModal(){ modal.classList.remove('is-open'); lockScroll(false); }
function openLightbox(src){ lightboxImg.src = src; lightbox.classList.add('is-open'); lockScroll(true); }
function closeLightbox(){ lightbox.classList.remove('is-open'); lightboxImg.src=''; lockScroll(false); }

modalCloseBtn.addEventListener('click', closeModal);
lightboxClose.addEventListener('click', closeLightbox);
modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) closeLightbox(); });
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){ if(lightbox.classList.contains('is-open')) closeLightbox(); else if(modal.classList.contains('is-open')) closeModal(); }
});

// ---------- Render card ----------
function renderCard(project, targetGrid){
  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('role','button');
  card.setAttribute('tabindex','0');
  card.innerHTML = `
    <img class="card__thumb" src="${(project.thumbnail || project.images?.[0]) || ''}" alt="${project.title || 'Project'} cover">
    <div class="card__label">${project.title || ''}</div>
  `;
  const open = () => openProject(project);
  card.addEventListener('click', open);
  card.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); open(); } });
  targetGrid.appendChild(card);
}

// ---------- Open project (modal) ----------
function openProject(project){
  modalTitle.textContent = project.title || '';
  modalDesc.textContent = project.description || '';
  modalDetails.textContent = project.details || ''; // optional

  // build gallery (3-up grid). Support either `images:[]` or `gallery:[{src,caption}]`
  modalGallery.innerHTML = '';
  const items = Array.isArray(project.gallery) && project.gallery.length
    ? project.gallery.map(g => (typeof g === 'string' ? {src:g} : g))
    : (project.images || []).map(src => ({src}));

  items.forEach(({src, caption})=>{
    if(!src) return;
    const img = document.createElement('img');
    img.src = src;
    img.alt = caption || project.title || 'Project image';
    img.addEventListener('click', ()=> openLightbox(src));
    modalGallery.appendChild(img);
  });

  lockScroll(true);
  modal.classList.add('is-open');
}

// ---------- Load projects.json (supports both shapes) ----------
(async function init(){
  try{
    const res = await fetch('projects.json', {cache:'no-store'});
    const data = await res.json();

    // Accept either grouped-by-category object OR flat array with category
    const byCategory = { architecture:[], production:[], product:[] };

    if (Array.isArray(data)) {
      // flat list
      data.forEach(p=>{
        const cat = (p.category||'').toLowerCase();
        if(byCategory[cat]) byCategory[cat].push(p);
      });
    } else if (data && typeof data === 'object') {
      // grouped object
      byCategory.architecture = data.architecture || [];
      byCategory.production   = data.production   || [];
      byCategory.product      = data.product      || [];
    }

    // Render into grids
    Object.entries(byCategory).forEach(([cat, list])=>{
      const grid = qs(`#${cat}-grid`);
      if(!grid || !Array.isArray(list)) return;
      list.forEach(p => renderCard(p, grid));
    });

  } catch(err){
    console.error('Failed to load projects.json', err);
  }
})();
