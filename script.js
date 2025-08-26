// ===============================
// PROJECT POPUP HANDLING
// ===============================

// Open project popup
function openPopup(project) {
  const popup = document.getElementById("popup-content");
  popup.innerHTML = `
    <h2>${project.title}</h2>
    <p>${project.description}</p>
  `;

  // Render grouped sections
  project.sections.forEach(section => {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("popup-section");

    sectionDiv.innerHTML = `
      <h3 class="popup-section-title">${section.title}</h3>
    `;

    // Loop through images in this section
    section.images.forEach((img, index) => {
      const imgWrapper = document.createElement("div");
      imgWrapper.classList.add("popup-img-wrapper");

      const imgEl = document.createElement("img");
      imgEl.src = img.src;
      imgEl.alt = img.caption;
      imgEl.classList.add("popup-img");

      // On click -> open enlarged view
      imgEl.addEventListener("click", () => {
        openImageModal(section.images, index);
      });

      imgWrapper.appendChild(imgEl);

      if (img.caption) {
        const cap = document.createElement("p");
        cap.innerText = img.caption;
        cap.classList.add("caption");
        imgWrapper.appendChild(cap);
      }

      sectionDiv.appendChild(imgWrapper);
    });

    popup.appendChild(sectionDiv);
  });

  document.getElementById("popup").style.display = "block";
}

// Close project popup
function closePopup() {
  document.getElementById("popup").style.display = "none";
}



// ===============================
// IMAGE ENLARGEMENT MODAL
// ===============================
let currentImages = [];
let currentIndex = 0;

function openImageModal(images, index) {
  currentImages = images;
  currentIndex = index;

  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");
  const modalCap = document.getElementById("modal-caption");

  modalImg.src = currentImages[currentIndex].src;
  modalCap.innerText = currentImages[currentIndex].caption || "";

  modal.style.display = "flex";
}

function closeImageModal() {
  document.getElementById("image-modal").style.display = "none";
}

function showNextImage() {
  currentIndex = (currentIndex + 1) % currentImages.length;
  updateModalImage();
}

function showPrevImage() {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  updateModalImage();
}

function updateModalImage() {
  const modalImg = document.getElementById("modal-img");
  const modalCap = document.getElementById("modal-caption");

  modalImg.src = currentImages[currentIndex].src;
  modalCap.innerText = currentImages[currentIndex].caption || "";
}



// ===============================
// DARK / LIGHT MODE TOGGLE
// ===============================
function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  const mode = document.body.classList.contains("dark-mode") ? "Dark" : "Light";
  localStorage.setItem("theme", mode);
}

// Load saved theme
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "Dark") {
    document.body.classList.add("dark-mode");
  }
});
