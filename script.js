/* -------------------- Helpers -------------------- */
const qs = (sel, el=document) => el.querySelector(sel);
const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));
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

let lbImages=[], lbIndex=0;

/* -------------------- Escape HTML -------------------- */
function escapeHtml(str=''){ return String(str||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

/* -------------------- Render Card -------------------- */
function renderCard(project, gridEl){
  const thumb = project.thumbnail || (project.images && project.images[0]) || '';
  const card = document.createElement('article');
  card.className='card'; card.tabIndex=0;
  card.innerHTML=`<img class="card__thumb" src="${escapeHtml(thumb)}" alt="${escapeHtml(project.title)}">
    <div class="card__label">${escapeHtml(project.title)}</div>`;
  card.addEventListener('click',()=>openProject(project));
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProject(project);}});
  gridEl.appendChild(card);
}

/* -------------------- Open Project -------------------- */
function openProject(project){
  const galleryEl = modalGallery();
  galleryEl.innerHTML='';

  modalTitle().textContent=project.title||'';
  modalDesc().textContent=project.description||'';

  const conceptImgs = project.gallery||project.images||[];
  const realImgs = project.livePhotos||[];

  const tabs = document.createElement('div'); tabs.className='modal__tabs';

  if(conceptImgs.length){
    const btn = document.createElement('button');
    btn.className='tab-btn active'; btn.textContent='Concept / Renders'; btn.dataset.tab='concept';
    btn.addEventListener('click',()=>switchTab('concept',btn));
    tabs.appendChild(btn);
    galleryEl.appendChild(createGalleryGroup(conceptImgs,'concept','active',project.title));
  }

  if(realImgs.length){
    const btn = document.createElement('button');
    btn.className='tab-btn'; btn.textContent='Real-life Photos'; btn.dataset.tab='real';
    btn.addEventListener('click',()=>switchTab('real',btn));
    tabs.appendChild(btn);
    galleryEl.appendChild(createGalleryGroup(realImgs,'real','',project.title));
  }

  if(tabs.childNodes.length) galleryEl.parentElement.insertBefore(tabs,galleryEl);

  modal().classList.add('is-open');
  setLock(true);

  lbImages = conceptImgs.length ? conceptImgs.map(i=>typeof i==='string'?i:i.src) : (realImgs.length ? realImgs.map(i=>i.src) : []);
  lbIndex=0;
}

/* -------------------- Gallery Group -------------------- */
function createGalleryGroup(items,type,active,title){
  const div = document.createElement('div');
  div.className=`gallery-group ${type} ${active||''}`;
  items.forEach(i=>{
    const src = typeof i==='string'?i:i.src;
    const caption = (typeof i==='string'?title:i.caption)||title;
    const img = document.createElement('img'); img.src=src; img.alt=caption;
    img.addEventListener('click',()=>{ 
      lbImages=Array.from(div.querySelectorAll('img')).map(x=>x.src); 
      lbIndex=lbImages.indexOf(src); 
      openLightbox(src,caption); 
    });
    div.appendChild(img);
  });
  return div;
}

/* -------------------- Switch Tabs -------------------- */
function switchTab(tab,btn){
  const tabs = btn.parentElement.querySelectorAll('.tab-btn'); tabs.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const galleryEl = modalGallery();
  galleryEl.querySelectorAll('.gallery-group').forEach(g=>g.classList.remove('active'));
  const activeGroup = qs(`.gallery-group.${tab}`,galleryEl);
  if(activeGroup) activeGroup.classList.add('active');
  lbImages = Array.from(activeGroup.querySelectorAll('img')).map(i=>i.src);
  lbIndex=0;
}

/* -------------------- Modal & Lightbox Controls -------------------- */
function closeModal(){ modal().classList.remove('is-open'); setLock(false); }
function openLightbox(src,caption=''){ lbIndex=lbImages.indexOf(src); updateLightbox(caption); lightbox().classList.add('is-open'); setLock(true); }
function closeLightbox(){ lightbox().classList.remove('is-open'); if(!modal().classList.contains('is-open')) setLock(false); }
function changeLightbox(step){ lbIndex=(lbIndex+step+lbImages.length)%lbImages.length; updateLightbox(); }
function updateLightbox(caption=''){ lightboxImg().src=lbImages[lbIndex]||''; lightboxCaption().textContent=caption||lightboxImg().alt||''; }

/* -------------------- Initialize After DOM Load -------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Modal & Lightbox Events
  modalClose()?.addEventListener('click', closeModal);
  modal()?.addEventListener('click', e => { if(e.target===modal()) closeModal(); });
  lightboxClose()?.addEventListener('click', closeLightbox);
  lightbox()?.addEventListener('click', e => { if(e.target===lightbox()) closeLightbox(); });
  lightboxPrev()?.addEventListener('click', ()=>changeLightbox(-1));
  lightboxNext()?.addEventListener('click', ()=>changeLightbox(1));

  document.addEventListener('keydown', e => {
    if(lightbox()?.classList.contains('is-open')){
      if(e.key==='ArrowRight') changeLightbox(1);
      if(e.key==='ArrowLeft') changeLightbox(-1);
      if(e.key==='Escape') closeLightbox();
    } else if(modal()?.classList.contains('is-open')){
      if(e.key==='Escape') closeModal();
    }
  });

  // Smooth Scroll for CTA buttons
  document.querySelectorAll('.intro__nav a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if(target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Load Projects
  (async function loadProjects(){
    let data=null;
    const dataEl=document.getElementById('projects-data');
    if(dataEl && dataEl.textContent.trim()){ 
      try{ data=JSON.parse(dataEl.textContent); } 
      catch(e){ console.error(e); } 
    }
    if(!data){ 
      try { const res=await fetch('./projects.json'); data=await res.json(); } 
      catch(err){ console.error('Failed to load projects.json', err); return; }
    }

    const mappings={ architecture:'#architecture .grid', production:'#production .grid', product:'#product .grid' };
    Object.keys(mappings).forEach(k=>{
      const grid=document.querySelector(mappings[k]);
      const list=data[k]; if(!grid||!Array.isArray(list)) return;
      grid.innerHTML=''; list.forEach(p=>renderCard(p,grid));
    });
  })();
});
