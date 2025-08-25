// Lightbox functionality
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");
const closeBtn = document.querySelector(".lightbox .close");

// Open lightbox on project image click
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("project-img")) {
    lightbox.style.display = "flex";
    lightboxImg.src = e.target.src;
    lightboxCaption.textContent = e.target.dataset.caption || "";
  }
});

// Close lightbox
closeBtn.addEventListener("click", () => {
  lightbox.style.display = "none";
});

// Close on outside click
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.style.display = "none";
  }
});
