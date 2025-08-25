document.addEventListener("DOMContentLoaded", () => {
  fetch("projects.json")
    .then(res => res.json())
    .then(data => {
      ["architecture", "production", "product"].forEach(category => {
        const grid = document.getElementById(`${category}-grid`);
        data[category].forEach(project => {
          let img = document.createElement("img");
          img.src = project.thumbnail;
          img.alt = project.title;
          img.addEventListener("click", () => openModal(project));
          grid.appendChild(img);
        });
      });
    });

  const modal = document.getElementById("modal");
  const closeBtn = document.querySelector(".close");

  function openModal(project) {
    document.getElementById("modal-title").innerText = project.title;
    document.getElementById("modal-description").innerText = project.description;
    const gallery = document.getElementById("modal-gallery");
    gallery.innerHTML = "";
    project.images.forEach(img => {
      let image = document.createElement("img");
      image.src = img;
      gallery.appendChild(image);
    });
    modal.style.display = "flex";
  }

  closeBtn.onclick = () => modal.style.display = "none";
  window.onclick = e => { if (e.target == modal) modal.style.display = "none"; }
});
