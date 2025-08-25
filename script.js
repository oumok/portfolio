// ============================
// Portfolio Lightbox Script
// ============================

// Store images & current index
let currentIndex = 0;
let currentImages = [];

// Open lightbox with selected image
function openLightbox(images, index, captionText) {
  currentImages = images;
  currentIndex = index;

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const caption = document.getElementById("caption");

  lightbox.style.display = "block";
  document.body.style.overflow = "hidden"; // stop background scroll
  lightboxImg.src = currentImages[currentIndex];
  caption.innerHTML = captionText || "";
}

// Close lightbox
function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
  document.body.style.overflow = "auto"; // enable scroll back
}

// Go to next/prev image
function changeImage(step) {
  currentIndex = (currentIndex + step + currentImages.length) % currentImages.length;
  const lightboxImg = document.getElementById("lightbox-img");
  const caption = document.getElementById("caption");

  lightboxImg.src = currentImages[currentIndex];
  caption.innerHTML = ""; // you can load captions per image if needed
}

// ============================
// Event Listeners
// ============================

// Close button
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.querySelector(".lightbox .close");
  if (closeBtn) {
    closeBtn.onclick = closeLightbox;
  }

  // Next/Prev buttons
  const nextBtn = document.querySelector(".lightbox .next");
  const prevBtn = document.querySelector(".lightbox .prev");

  if (nextBtn) {
    nextBtn.onclick = () => changeImage(1);
  }
  if (prevBtn) {
    prevBtn.onclick = () => changeImage(-1);
  }

  // Close on click outside
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.onclick = (e) => {
      if (e.target.id === "lightbox") closeLightbox();
    };
  }

  // Keyboard navigation
  document.onkeydown = function (e) {
    if (document.getElementById("lightbox").style.display === "block") {
      if (e.key === "ArrowRight") {
        changeImage(1);
      } else if (e.key === "ArrowLeft") {
        changeImage(-1);
      } else if (e.key === "Escape") {
        closeLightbox();
      }
    }
  };
});
