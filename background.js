(() => {
  const canvas = document.createElement("canvas");
  canvas.id = "shapeCanvas";
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "-1",
    pointerEvents: "none",
    background: "linear-gradient(to top, #0a0a0a, #111)"
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  // --- Stars ---
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.2 + 0.05
  }));

  // --- Falling shapes (building blocks) ---
  const shapes = [];
  let cursorShape = null;
  const shapeTypes = ["square", "circle", "triangle", "rect"];

  function createShape(x, y, type = null) {
    const size = 30 + Math.random() * 20;
    return {
      x,
      y,
      size,
      type: type || shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
      vy: 0,
      placed: false
    };
  }

  function drawShape(s, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#eee";
    ctx.beginPath();
    switch (s.type) {
      case "square":
        ctx.rect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
        break;
      case "circle":
        ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
        break;
      case "triangle":
        ctx.moveTo(s.x, s.y - s.size / 2);
        ctx.lineTo(s.x - s.size / 2, s.y + s.size / 2);
        ctx.lineTo(s.x + s.size / 2, s.y + s.size / 2);
        ctx.closePath();
        break;
      case "rect":
        ctx.rect(s.x - s.size / 2, s.y - s.size / 4, s.size, s.size / 2);
        break;
    }
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // --- Cursor follower ---
  document.addEventListener("mousemove", e => {
    cursorShape = createShape(e.clientX, e.clientY);
  });

  // --- Place shape on click ---
  document.addEventListener("click", e => {
    if (!cursorShape) return;
    const newShape = createShape(e.clientX, e.clientY, cursorShape.type);
    shapes.push(newShape);
  });

  // --- Physics update ---
  function updateShapes() {
    const gravity = 0.4;
    shapes.forEach(s => {
      if (!s.placed) {
        s.vy += gravity;
        s.y += s.vy;

        // Check collision with ground
        if (s.y + s.size / 2 >= height) {
          s.y = height - s.size / 2;
          s.vy = 0;
          s.placed = true;
        }

        // Check collision with other shapes
        for (let other of shapes) {
          if (other === s || !other.placed) continue;
          const dx = Math.abs(s.x - other.x);
          const dy = (s.y + s.size / 2) - (other.y - other.size / 2);

          if (dx < (s.size / 2 + other.size / 2) * 0.8 && dy > 0 && dy < 10) {
            s.y = other.y - other.size / 2 - s.size / 2;
            s.vy = 0;
            s.placed = true;
          }
        }
      }
    });
  }

  // --- Animation loop ---
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Stars background
    ctx.fillStyle = "#fff";
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();

      // Subtle fluid drift
      star.y += star.speed;
      if (star.y > height) star.y = 0;
    });

    // Draw stacked shapes
    updateShapes();
    shapes.forEach(s => drawShape(s));

    // Cursor shape preview
    if (cursorShape) drawShape(cursorShape, 0.3);

    requestAnimationFrame(animate);
  }

  animate();

  // Resize handling
  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
})();
