/* Helpers */
const qs = (sel, el=document) => el.querySelector(sel);
const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));
const setLock = (lock) => document.body.classList.toggle('body--lock', lock);

/* Modal & Lightbox elements */
const modalEl = () => qs('#project-modal');
const modalCloseBtn = () => qs('#modal-close');
const modalTitle = () => qs('#modal-title');
const modalDesc = () => qs('#modal-description');
const modalTabs = () => qs('#modal-tabs');
const modalGallery = () => qs('#modal-gallery');

const lightboxEl = () => qs('#lightbox');
const lightboxImg = () => qs('#lightbox-img');
const lightboxCaption = () => qs('#lightbox-caption');
const lightboxCloseBtn = () => qs('#lightbox-close');
const lightboxPrevBtn = () => qs('#lightbox-prev');
const lightboxNextBtn = () => qs('#lightbox-next');

let lbImages = [], lbIndex = 0;

/* Escape HTML safe */
function escapeHtml(s=''){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

/* Render card in homepage uniform grid */
function renderCard(project, gridEl){
  const thumb = project.thumbnail || (project.gallery && project.gallery[0] && project.gallery[0].images && project.gallery[0].images[0] ? project.gallery[0].images[0].src : ''); // Better fallback
  const article = document.createElement('article');
  article.className = 'card';
  article.tabIndex = 0;
  article.innerHTML = `<img class="card__thumb" loading="lazy" src="${escapeHtml(thumb)}" alt="${escapeHtml(project.title)}">
    <div class="card__label">${escapeHtml(project.title)}</div>`;
  // click opens project
  article.addEventListener('click', (e)=>{ e.stopPropagation(); openProject(project); });
  article.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); openProject(project); }});
  gridEl.appendChild(article);
}

/* Open project modal with tabs and grouped galleries */
function openProject(project){
  modalTabs().innerHTML = '';
  modalGallery().innerHTML = '';
  modalTitle().textContent = project.title || '';
  modalDesc().textContent = project.description || '';

  // Populate Project Details
  const details = project.details || {}; 
  const locEl = qs('#modal-detail-location');
  const areaEl = qs('#modal-detail-area');
  const clientEl = qs('#modal-detail-client');
  const durationEl = qs('#modal-detail-duration');
  const softwareEl = qs('#modal-detail-software');
  const scopeEl = qs('#modal-detail-scope');

  const populateDetail = (el, label, value) => {
    if (el && value) {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      el.innerHTML = `<strong>${label}:</strong> ${escapeHtml(displayValue)}`;
      el.style.display = ''; 
    } else if (el) {
      el.innerHTML = ''; 
      el.style.display = 'none'; 
    }
  };

  populateDetail(locEl, 'Location', details.location);
  populateDetail(areaEl, 'Area', details.area);
  populateDetail(clientEl, 'Client', details.client);
  populateDetail(durationEl, 'Duration', details.duration);
  populateDetail(softwareEl, 'Software', details.software);
  populateDetail(scopeEl, 'Scope', details.scope);

  // Build image groups (always bento)
  let groups = [];
  if (Array.isArray(project.gallery) && project.gallery.length && project.gallery[0].group) {
    groups = project.gallery.map((g, i) => {
      const imgs = (g.images || []).map(it => (typeof it==='string')? {src:it, caption:''} : {src:it.src||'', caption:it.caption||''});
      return { id: `tab${i}`, name: g.group || `Group ${i+1}`, images: imgs, type: 'bento' };
    });
  } else {
    // Fallback logic
    const all = (project.images || project.gallery || []).map(it => (typeof it==='string')?{src:it, caption:''}:{src:it.src||'', caption:it.caption||''});
    if (all.length) groups.push({ id:'all', name:'All', images:all, type:'bento' });
  }

  // Create tabs and content
  let firstVisibleTabIndex = -1; // Track the index of the first tab with images
  groups.forEach((g, idx) => {
    if (!g.images.length) return; // Skip empty groups

    if (firstVisibleTabIndex === -1) {
        firstVisibleTabIndex = idx; // Mark the first non-empty tab
    }

    // Create Tab Button
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (idx === firstVisibleTabIndex ? ' active' : ''); // Activate the first visible tab
    btn.textContent = g.name;
    btn.dataset.tab = g.id;
    modalTabs().appendChild(btn);

    // Create Content Container
    const container = document.createElement('div');
    container.className = 'tab-content' + (idx === firstVisibleTabIndex ? ' active' : ''); // Activate the first visible content
    container.id = g.id;

    // Create Bento Grid
    const bento = document.createElement('div'); bento.className = 'bento';
    g.images.forEach((imgObj, imgIndex) => {
      const item = document.createElement('div'); item.className = 'bento-item';
      const img = document.createElement('img');
      img.loading = 'lazy'; img.alt = imgObj.caption || project.title || '';
      img.src = imgObj.src;
      img.addEventListener('click', (e)=> {
        e.stopPropagation();
        lbImages = g.images; 
        lbIndex = imgIndex;
        openLightbox(imgObj.caption || project.title);
      });
      item.appendChild(img); bento.appendChild(item);
    });
    container.appendChild(bento);
    modalGallery().appendChild(container);
  });

  // Tab switching behavior
  modalTabs().querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', ()=>{
      modalTabs().querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      modalGallery().querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      btn.classList.add('active');
      const target = modalGallery().querySelector(`#${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Show modal
  modalEl().classList.add('is-open');
  setLock(true);

  // Analytics
  if (window.gtag) {
    try { gtag('event','open_project',{ 'project_title': project.title }); } catch(e) {}
  }
}

/* Modal controls */
function closeModal(){ modalEl().classList.remove('is-open'); setLock(false); }

/* Lightbox controls */
function openLightbox(caption=''){
  const imgObj = lbImages[lbIndex];
  if (!imgObj || !imgObj.src) return;
  
  lightboxImg().src = imgObj.src;
  lightboxCaption().textContent = caption || imgObj.caption || ''; 
  lightboxEl().classList.add('is-open');
  setLock(true);
}
function closeLightbox(){ lightboxEl().classList.remove('is-open'); if(!modalEl().classList.contains('is-open')) setLock(false); }
function changeLightbox(step){ 
  lbIndex = (lbIndex + step + lbImages.length) % lbImages.length; 
  openLightbox(lbImages[lbIndex].caption || ''); 
}

/* Function to fade hero on scroll */
function initHeroFade() {
  const hero = qs('#landing');
  if (!hero) return;
  const fadeEnd = 500; 

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    let opacity = 1 - (scrollY / fadeEnd);
    opacity = Math.max(0, Math.min(1, opacity)); 
    hero.style.opacity = opacity;
  });
}

/* Function to show/hide sticky nav */
function initStickyNav() {
  const stickyNav = qs('#sticky-nav');
  const header = qs('#landing');
  if (!stickyNav || !header) return;

  const headerHeight = header.offsetHeight;
  window.addEventListener('scroll', () => {
    if (window.scrollY > headerHeight - 50) { 
      stickyNav.classList.add('is-sticky');
    } else {
      stickyNav.classList.remove('is-sticky');
    }
  });
}

/* Function to highlight active section in sticky nav */
function initSectionObserver() {
  const stickyLinks = qsa('#sticky-nav a.chip');
  if (!stickyLinks.length) return;

  const observerOptions = {
    root: null, 
    rootMargin: "-40% 0px -60% 0px", // Middle 20% of viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const activeLink = qs(`#sticky-nav a[href="#${id}"]`);
        
        stickyLinks.forEach(link => link.classList.remove('active'));
        if (activeLink) {
          activeLink.classList.add('active');
        }
      }
    });
  }, observerOptions);

  qsa('main .section.frosted-pane').forEach(section => { // Observe only frosted sections in main
    observer.observe(section);
  });
}

/* Event wiring */
document.addEventListener('DOMContentLoaded', ()=>{

  // Modal & Lightbox Wiring
  modalCloseBtn()?.addEventListener('click', closeModal);
  modalEl()?.addEventListener('click', e => { if (e.target === modalEl()) closeModal(); });
  lightboxCloseBtn()?.addEventListener('click', closeLightbox);
  lightboxEl()?.addEventListener('click', e => { if (e.target === lightboxEl()) closeLightbox(); });
  lightboxPrevBtn()?.addEventListener('click', ()=>changeLightbox(-1));
  lightboxNextBtn()?.addEventListener('click', ()=>changeLightbox(1));
  document.addEventListener('keydown', e=>{
    if (lightboxEl()?.classList.contains('is-open')){
      if (e.key==='ArrowRight') changeLightbox(1);
      if (e.key==='ArrowLeft') changeLightbox(-1);
      if (e.key==='Escape') closeLightbox();
    } else if (modalEl()?.classList.contains('is-open')){
      if (e.key==='Escape') closeModal();
    }
  });

  // Smooth Scroll Wiring
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        const stickyNavHeight = qs('#sticky-nav')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - stickyNavHeight - 16; 
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Load Projects
  (async function loadProjects(){
    let data = null;
    const dataEl = document.getElementById('projects-data');
    if (dataEl && dataEl.textContent && dataEl.textContent.trim().length > 50){
      try { data = JSON.parse(dataEl.textContent); }
      catch (e){ console.error('Error parsing embedded JSON:', e); }
    }
    
    if (!data){
      try {
        const res = await fetch('./projects.json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        data = await res.json();
      } catch (err){
        console.error('Failed to load projects.json', err);
        // Maybe display an error message on the page here
        return;
      }
    }

    const mappings = {
      architecture: '#architecture-grid',
      production: '#production-grid',
      product: '#product-grid',
      freelance: '#freelance-grid'
    };
    Object.keys(mappings).forEach(k=>{
      const grid = document.querySelector(mappings[k]);
      const list = data[k] || [];
      if (!grid) return;
      grid.innerHTML = ''; 
      list.forEach(p => renderCard(p, grid));
    });

    qsAllLoadedSetup(); // Setup lazy loading after cards are added
  })();

  // Init Skill Meters
  (function initSkillMeters(){
    const skillsSection = document.getElementById('skills');
    if (!skillsSection) return;
    const items = skillsSection.querySelectorAll('.skill-circle');
    items.forEach(it => { it.style.setProperty('--deg','0deg'); });

    const io = new IntersectionObserver((entries, obs)=>{
      entries.forEach(en=>{
        if (en.isIntersecting){
          items.forEach(it=>{
            const pct = Number(it.getAttribute('data-percent')||0);
            const deg = Math.round((pct/100)*360);
            requestAnimationFrame(()=> { it.style.setProperty('--deg', deg + 'deg'); it.classList.add('animated'); });
          });
          obs.disconnect(); // Animate only once
        }
      });
    }, { threshold: 0.25 });
    io.observe(skillsSection);
  })();

  // Init Experience Ticker
  (function initTicker(){
    const sc = qs('.scroll-content');
    if (!sc) return;
    sc.innerHTML = sc.innerHTML + ' • ' + sc.innerHTML; // Duplicate for smooth loop
  })();

  // Initialize Scroll-Based Features
  initHeroFade(); 
  initStickyNav(); 
  initSectionObserver(); 

});

/* Lazy Loading Setup */
function qsAllLoadedSetup(){
  const imgs = qsa('.card__thumb, .modal-gallery img'); // Select only relevant images
  const io = new IntersectionObserver((entries, obs)=>{
    entries.forEach(entry=>{
      if (entry.isIntersecting){
        entry.target.classList.add('loaded'); // You might need a CSS rule for `.loaded` opacity transition
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });

  imgs.forEach(img=>{
    io.observe(img);
    // Stop propagation only for modal/bento images
    if (img.closest('.modal-gallery') || img.closest('.bento')) {
      img.addEventListener('click', e=> e.stopPropagation());
    }
  });
}

// No extra click listener needed at the end