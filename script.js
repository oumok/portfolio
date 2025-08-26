document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  setupPopup();
});

function loadProjects() {
  fetch("projects.json")
    .then(res => res.json())
    .then(data => {
      data.forEach(project => {
        const container = document.getElementById(`${project.category}-projects`);
        if (!container) return;

        const card = document.createElement("div");
        card.className = "project-card";
        card.innerHTML = `
          <img src="${project.images[0]}" alt="${project.title}">
          <h3>${project.title}</h3>
        `;
        card.addEventListener("click", () => openPopup(project));
        container.appendChild(card);
      });
    })
    .catch(err => console.error("Error loading projects.json:", err));
}

let currentProject = null;
let currentIndex = 0;

function setupPopup() {
  const popup = document.getElementById("popup");
  const closeBtn = document.getElementById("popup-close");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  closeBtn.addEventListener("click", () => popup.classList.add("hidden"));
  prevBtn.addEventListener("click", showPrevImage);
  nextBtn.addEventListener("click", showNextImage);
}

function openPopup(project) {
  currentProject = project;
  currentIndex = 0;

  document.getElementById("popup-title").textContent = project.title;
  document.getElementById("popup-description").textContent = project.description;

  const imgContainer = document.getElementById("popup-images");
  imgContainer.innerHTML = "";

  project.images.forEach((img, i) => {
    const imageEl = document.createElement("img");
    imageEl.src = img;
    if (i === 0) imageEl.classList.add("active");
    imgContainer.appendChild(imageEl);
  });

  document.getElementById("popup").classList.remove("hidden");
}

function showPrevImage() {
  if (!currentProject) return;
  const imgs = document.querySelectorAll("#popup-images img");
  imgs[currentIndex].classList.remove("active");
  currentIndex = (currentIndex - 1 + imgs.length) % imgs.length;
  imgs[currentIndex].classList.add("active");
}

function showNextImage() {
  if (!currentProject) return;
  const imgs = document.querySelectorAll("#popup-images img");
  imgs[currentIndex].classList.remove("active");
  currentIndex = (currentIndex + 1) % imgs.length;
  imgs[currentIndex].classList.add("active");
}
