async function loadProjects() {
  const res = await fetch('projects.json');
  const data = await res.json();

  for (const category of ['architecture', 'production', 'product']) {
    const grid = document.getElementById(`${category}-grid`);
    if (!grid) continue;

    data[category].forEach((proj) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.dataset.title = proj.title;
      card.innerHTML = `<img src="${proj.thumbnail}" alt="${proj.title}">`;
      card.addEventListener('click', () => openPopup(proj));
      grid.appendChild(card);
    });
  }
}

function openPopup(project) {
  const popup = document.getElementById('popup');
  const popupTitle = document.getElementById('popupTitle');
  const popupDesc = document.getElementById('popupDesc');
  const popupGallery = document.getElementById('popupGallery');

  popupTitle.textContent = project.title;
  popupDesc.textContent = project.description;
  popupGallery.innerHTML = '';

  project.gallery.forEach((img) => {
    const thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = img.caption || '';
    thumb.addEventListener('click', () => openImage(img.src, img.caption));
    popupGallery.appendChild(thumb);
  });

  popup.classList.remove('hidden');
}

function closePopup() {
  document.getElementById('popup').classList.add('hidden');
}

function openImage(src, caption) {
  const modal = document.getElementById('imageModal');
  document.getElementById('modalImg').src = src;
  document.getElementById('caption').textContent = caption || '';
  modal.classList.remove('hidden');
}

function closeImage() {
  document.getElementById('imageModal').classList.add('hidden');
}

document.getElementById('closePopup').addEventListener('click', closePopup);
document.getElementById('closeImage').addEventListener('click', closeImage);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePopup();
    closeImage();
  }
});

loadProjects();
