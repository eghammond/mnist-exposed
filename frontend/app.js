const canvas = document.getElementById("draw-canvas");
const ctx = canvas.getContext("2d");
const predictBtn = document.getElementById("predict-btn");
const clearBtn = document.getElementById("clear-btn");
const predictionDisplay = document.getElementById("prediction-display");
const barsContainer = document.getElementById("bars");

const STROKE_WIDTH = 18;

let drawing = false;
let lastX = 0;
let lastY = 0;

function resetCanvas() {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = STROKE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function getPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const point = evt.touches ? evt.touches[0] : evt;
  return {
    x: ((point.clientX - rect.left) / rect.width) * canvas.width,
    y: ((point.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function startDraw(evt) {
  evt.preventDefault();
  drawing = true;
  const { x, y } = getPos(evt);
  lastX = x;
  lastY = y;
  // draw a dot for single clicks/taps
  ctx.beginPath();
  ctx.arc(x, y, STROKE_WIDTH / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function moveDraw(evt) {
  if (!drawing) return;
  evt.preventDefault();
  const { x, y } = getPos(evt);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x;
  lastY = y;
}

function endDraw() {
  drawing = false;
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", moveDraw);
window.addEventListener("mouseup", endDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", moveDraw);
window.addEventListener("touchend", endDraw);

clearBtn.addEventListener("click", () => {
  resetCanvas();
  predictionDisplay.innerHTML = "&nbsp;";
  barsContainer.innerHTML = "";
});

function canvasTo28x28() {
  const small = document.createElement("canvas");
  small.width = 28;
  small.height = 28;
  const smallCtx = small.getContext("2d");
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(canvas, 0, 0, 28, 28);

  const { data } = smallCtx.getImageData(0, 0, 28, 28);
  const pixels = [];
  for (let row = 0; row < 28; row++) {
    const rowPixels = [];
    for (let col = 0; col < 28; col++) {
      const idx = (row * 28 + col) * 4;
      // canvas is white-on-black, single channel is enough (R === G === B)
      rowPixels.push(data[idx] / 255);
    }
    pixels.push(rowPixels);
  }
  return pixels;
}

function renderBars(probabilities, prediction) {
  barsContainer.innerHTML = "";
  probabilities.forEach((p, digit) => {
    const row = document.createElement("div");
    row.className = "bar-row" + (digit === prediction ? " is-predicted" : "");

    const label = document.createElement("div");
    label.className = "digit-label";
    label.textContent = digit;

    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${(p * 100).toFixed(1)}%`;
    track.appendChild(fill);

    const value = document.createElement("div");
    value.className = "bar-value";
    value.textContent = `${(p * 100).toFixed(1)}%`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    barsContainer.appendChild(row);
  });
}

async function predict() {
  const pixels = canvasTo28x28();

  predictBtn.disabled = true;
  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pixels }),
    });
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const { prediction, probabilities } = await res.json();
    predictionDisplay.textContent = prediction;
    renderBars(probabilities, prediction);
  } catch (err) {
    predictionDisplay.textContent = "?";
    barsContainer.innerHTML = "";
    console.error(err);
    alert("Prediction failed. Is the backend running?");
  } finally {
    predictBtn.disabled = false;
  }
}

predictBtn.addEventListener("click", predict);

resetCanvas();
