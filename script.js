// script.js

let projectsData = {};
let currentProject = null;
let currentGroupIndex = 0;
let currentImageIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
    setupThemeToggle();
});

// -------------------- LOAD PROJECTS --------------------
async function loadProjects() {
    try {
        const response = await fetch("projects.json");
        projectsData = await response.json();

        ["architecture", "production", "product"].forEach(category => {
            const container = document.getElementById(`${category}-projects`);
            if (projectsData[category]) {
                projectsData[category].forEach((project, index) => {
                    const card = document.createElement("div");
                    card.classList.add("project-card");
                    card.innerHTML = `
                        <img src="${project.thumbnail}" alt="${project.title}">
                        <h3>${project.title}</h3>
                        <p>${project.description}</p>
                    `;
                    card.addEventListener("click", () => openPopup(category, index));
                    container.appendChild(card);
                });
            }
        });
    } catch (error) {
        console.error("Error loading projects.json:", error);
    }
}

// -------------------- POPUP --------------------
function openPopup(category, index) {
    currentProject = projectsData[category][index];
    currentGroupIndex = 0;
    currentImageIndex = 0;

    document.getElementById("popup-title").textContent = currentProject.title;
    document.getElementById("popup-description").textContent = currentProject.description;

    renderGroups();
    showImage();

    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// -------------------- GROUPS --------------------
function renderGroups() {
    const groupsContainer = document.getElementById("popup-groups");
    groupsContainer.innerHTML = "";

    currentProject.galleryGroups.forEach((group, gIndex) => {
        const btn = document.createElement("button");
        btn.textContent = group.title;
        btn.classList.add("group-btn");
        if (gIndex === currentGroupIndex) btn.classList.add("active");

        btn.addEventListener("click", () => {
            currentGroupIndex = gIndex;
            currentImageIndex = 0;
            renderGroups();
            showImage();
        });

        groupsContainer.appendChild(btn);
    });
}

// -------------------- IMAGE DISPLAY --------------------
function showImage() {
    const group = currentProject.galleryGroups[currentGroupIndex];
    const imageObj = group.images[currentImageIndex];

    const imageEl = document.getElementById("popup-image");
    const captionEl = document.getElementById("popup-caption");

    imageEl.src = imageObj.src;
    imageEl.alt = imageObj.caption;
    captionEl.textContent = imageObj.caption;
}

// -------------------- NAVIGATION --------------------
function prevImage() {
    const group = currentProject.galleryGroups[currentGroupIndex];
    currentImageIndex = (currentImageIndex - 1 + group.images.length) % group.images.length;
    showImage();
}

function nextImage() {
    const group = currentProject.galleryGroups[currentGroupIndex];
    currentImageIndex = (currentImageIndex + 1) % group.images.length;
    showImage();
}

// -------------------- THEME TOGGLE --------------------
function setupThemeToggle() {
    const toggleBtn = document.getElementById("theme-toggle");

    // Load saved preference
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }

    toggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        const theme = document.body.classList.contains("dark") ? "dark" : "light";
        localStorage.setItem("theme", theme);
    });
}
