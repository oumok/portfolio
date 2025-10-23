// Fetch JSON either from script tag or external file
let projectsData;
const jsonScript = document.getElementById("projects-data");
if (jsonScript && jsonScript.textContent.trim() !== "") {
  projectsData = JSON.parse(jsonScript.textContent);
} else {
  // Fallback: fetch projects.json if needed
  fetch("projects.json")
    .then(res => res.json())
    .then(data => {
      projectsData = data;
      initPortfolio();
    })
    .catch(err => console.error("Failed to load projects.json", err));
}

// Initialize portfolio if JSON is already available
if (projectsData) initPortfolio();

function initPortfolio() {
  const grids = {
    architecture: document.getElementById("architecture-grid"),
    production: document.getElementById("production-grid"),
    product: document.getElementById("product-grid"),
    freelance: document.getElementById("freelance-grid")
  };

  Object.keys(grids).forEach(category => {
    if (!projectsData[category]) return;
    projectsData[category].forEach(project => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img class="card__thumb" src="${project.thumbnail}" alt="${project.title}">
        <div class="card__label">${project.title}</div>
      `;
      card.addEventListener("click", () => openModal(project));
      grids[category].appendChild(card);
    });
  });
}

// Modal elements
const modal = document.getElementById("project-modal");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-description");
const modalGallery = document.getElementById("modal-gallery");
const modalClose = document.getElementById("modal-close");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");
const lightboxClose = document.getElementById("lightbox-close");
const lightboxPrev = document.getElementById("lightbox-prev");
const lightboxNext = document.getElementById("lightbox-next");

let currentImages = [];
let currentIndex = 0;

function openModal(project) {
  modal.classList.add("is-open");
  document.body.classList.add("body--lock");
  modalTitle.textContent = project.title;
  modalDesc.textContent = project.description;
  renderGallery(project);
}

function renderGallery(project) {
  modalGallery.innerHTML = "";

  let groups = project.groups || [{ name: "Gallery", images: project.gallery || project.images }];

  // Optional: tabs if multiple groups
  if (groups.length > 1) {
    const tabsContainer = document.createElement("div");
    tabsContainer.className = "modal__tabs";
    groups.forEach((group, idx) => {
      const tab = document.createElement("button");
      tab.className = "tab-btn";
      tab.textContent = group.name;
      if (idx === 0) tab.classList.add("active");
      tab.addEventListener("click", () => {
        Array.from(tabsContainer.children).forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        renderImages(group.images);
      });
      tabsContainer.appendChild(tab);
    });
    modalGallery.appendChild(tabsContainer);
    renderImages(groups[0].images);
  } else {
    renderImages(groups[0].images);
  }
}

function renderImages(images) {
  const galleryContainer = document.createElement("div");
  galleryContainer.className = "gallery-group active";
  images.forEach((img, idx) => {
    const image = document.createElement("img");
    if (typeof img === "string") {
      image.src = img;
      image.alt = "";
    } else {
      image.src = img.src;
      image.alt = img.caption || "";
    }
    image.addEventListener("click", () => openLightbox(images, idx));
    galleryContainer.appendChild(image);
  });
  // Remove old gallery and append new
  modalGallery.querySelectorAll(".gallery-group").forEach(g => g.remove());
  modalGallery.appendChild(galleryContainer);
}

// Close modal
modalClose.addEventListener("click", () => {
  modal.classList.remove("is-open");
  document.body.classList.remove("body--lock");
});

// Lightbox functions
function openLightbox(images, index) {
  currentImages = images;
  currentIndex = index;
  lightboxImg.src = images[index].src || images[index];
  lightboxCaption.textContent = images[index].caption || "";
  lightbox.classList.add("is-open");
  document.body.classList.add("body--lock");
}

lightboxClose.addEventListener("click", () => {
  lightbox.classList.remove("is-open");
  document.body.classList.remove("body--lock");
});

lightboxPrev.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  updateLightbox();
});
lightboxNext.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % currentImages.length;
  updateLightbox();
});

function updateLightbox() {
  const img = currentImages[currentIndex];
  lightboxImg.src = img.src || img;
  lightboxCaption.textContent = img.caption || "";
}
