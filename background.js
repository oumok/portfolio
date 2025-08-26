// =============================
// STARFIELD BACKGROUND
// =============================

// Get containers (make sure these exist in your HTML body)
const starsContainer = document.createElement("div");
starsContainer.classList.add("stars");
document.body.appendChild(starsContainer);

const bigStarsContainer = document.createElement("div");
bigStarsContainer.classList.add("big-stars");
document.body.appendChild(bigStarsContainer);

// Create stars
function createStars(container, count, className) {
  for (let i = 0; i < count; i++) {
    const star = document.createElement("div");
    star.classList.add(className);
    star.style.top = Math.random() * 100 + "%";
    star.style.left = Math.random() * 100 + "%";
    container.appendChild(star);
  }
}
createStars(starsContainer, 100, "star"); // many small stars
createStars(bigStarsContainer, 40, "big-star"); // fewer big stars

// Subtle star movement
document.addEventListener("mousemove", (e) => {
  const { innerWidth, innerHeight } = window;
  const moveX = (e.clientX / innerWidth - 0.5) * 10; // gentle
  const moveY = (e.clientY / innerHeight - 0.5) * 10;

  starsContainer.style.transform = `translate(${moveX}px, ${moveY}px)`;
  bigStarsContainer.style.transform = `translate(${moveX * 1.5}px, ${moveY * 1.5}px)`;
});

// =============================
// SHAPE CANVAS
// =============================

const canvas = document.createElement("canvas");
canvas.id = "shapeCanvas";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener("resize", resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Shape library (add more if you want)
const shapeTypes = ["square", "circle", "triangle", "star"];
let floatingShape = randomShape();
let buildings = []; // stacked shapes

function randomShape() {
  return {
    type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
    x: window.innerWidth / 2,
    y: 100,
    size: 30 + Math.random() * 20,
    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
  };
}

// Mouse follow
document.addEventListener("mousemove", (e) => {
  if (floatingShape) {
    floatingShape.x = e.clientX;
    floatingShape.y = e.clientY;
  }
});

// Place shape on click
document.addEventListener("click", (e) => {
  // Skip if clicking on a button or link
  if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;

  const placedShape = { ...floatingShape };
  // Check if it falls on top of an existing stack
  const base = buildings.find(
    (b) =>
      Math.abs(b.x - placedShape.x) < placedShape.size &&
      Math.abs(b.y - placedShape.y) < placedShape.size
  );

  if (base) {
    placedShape.y = base.y - placedShape.size - 2;
  } else {
    placedShape.y = canvas.height - placedShape.size - 5;
  }

  buildings.push(placedShape);
  floatingShape = randomShape(); // new floating shape
});

// Draw loop
function drawShape(s) {
  ctx.fillStyle = s.color;
  ctx.beginPath();

  switch (s.type) {
    case "square":
      ctx.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
      break;
    case "circle":
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "triangle":
      ctx.moveTo(s.x, s.y - s.size / 2);
      ctx.lineTo(s.x - s.size / 2, s.y + s.size / 2);
      ctx.lineTo(s.x + s.size / 2, s.y + s.size / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case "star":
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = s.x + Math.cos(angle) * s.size;
        const y = s.y + Math.sin(angle) * s.size;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      break;
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw buildings
  buildings.forEach(drawShape);

  // draw floating shape
  if (floatingShape) {
    ctx.globalAlpha = 0.7;
    drawShape(floatingShape);
    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(animate);
}
animate();
