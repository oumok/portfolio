const container = document.getElementById("projectsContainer");
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupDescription = document.getElementById("popupDescription");
const popupImages = document.getElementById("popupImages");
const popupClose = document.getElementById("popupClose");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");

let currentGallery = [];
let currentIndex = 0;

async function init() {
  const res = await fetch("projects.json");
  const data = await res.json();

  for (const category in data) {
    const section = document.createElement("section");
    section.classList.add("section");

    const title = document.createElement("h2");
    title.textContent = category.replace(/^\w/, c => c.toUpperCase());
    section.appendChild(title);

    const grid = document.createElement("div");
    grid.classList.add("grid");

    data[category].forEach(project => {
      const card = document.createElement("div");
      card.classList.add("card");

      const img = document.createElement("img");
      img.src = project.thumbnail;
      img.alt = project.title;

      const caption = document.createElement("div");
      caption.classList.add("card-title");
      caption.textContent = project.title;

      card.appendChild(img);
      card.appendChild(caption);
      card.addEventListener("click", () => openPopup(project));

      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  }
}

function openPopup(project) {
  popupTitle.textContent = project.title;
  popupDescription.textContent = project.description;
  popupImages.innerHTML = "";

  currentGallery = project.gallery;

  project.gallery.forEach((img, index) => {
    const imgEl = document.createElement("img");
    imgEl.src = img.src;
    imgEl.alt = project.title;
    imgEl.addEventListener("click", () => openLightbox(index));
    popupImages.appendChild(imgEl);
  });

  popup.classList.remove("hidden");
}

popupClose.addEventListener("click", () => {
  popup.classList.add("hidden");
});

function openLightbox(index) {
  currentIndex = index;
  const img = currentGallery[index];
  lightboxImg.src = img.src;
  lightboxCaption.textContent = img.caption || "";
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  lightbox.classList.add("hidden");
}

document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("hidden")) {
    if (e.key === "ArrowRight") nextImage();
    if (e.key === "ArrowLeft") prevImage();
    if (e.key === "Escape") closeLightbox();
  } else if (e.key === "Escape") {
    popup.classList.add("hidden");
  }
});

function nextImage() {
  currentIndex = (currentIndex + 1) % currentGallery.length;
  openLightbox(currentIndex);
}

function prevImage() {
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  openLightbox(currentIndex);
}

lightbox.addEventListener("click", closeLightbox);

init();
