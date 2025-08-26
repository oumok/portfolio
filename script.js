document.addEventListener("DOMContentLoaded", () => {
  loadProjects();
  setupPopup();
});

async function loadProjects() {
  try {
    const response = await fetch("projects.json");
    const projects = await response.json();

    projects.forEach(project => {
      const container = document.getElementById(`${project.category}-projects`);
      if (!container) return;

      const card = document.createElement("div");
      card.className = "project-card";

      const img = document.createElement("img");
      img.src = project.thumbnail;
      img.alt = project.title;

      const title = document.createElement("h3");
      title.textContent = project.title;

      card.appendChild(img);
      card.appendChild(title);

      card.addEventListener("click", () => openPopup(project));

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading projects.json:", error);
  }
}

function setupPopup() {
  const popup = document.getElementById("popup");
  const closeBtn = popup.querySelector(".close");
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
  });
}

function openPopup(project) {
  const popup = document.getElementById("popup");
  document.getElementById("popup-title").textContent = project.title;
  document.getElementById("popup-description").textContent = project.description;

  const popupImages = document.getElementById("popup-images");
  popupImages.innerHTML = ""; // clear old images

  project.images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = project.title;
    popupImages.appendChild(img);
  });

  popup.style.display = "block";
}
