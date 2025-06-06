// === CONSTANTS ===
const ROOM_ID = "room_9326";
const API = "http://127.0.0.1:8000";
const FILTERS = ["invert", "blur"];

// === ELEMENTS ===
const canvas = document.getElementById('board');
const ctx = canvas.getContext("2d", { willReadFrequently: true });

const select = document.getElementById("filter-select");
const refreshButton = document.getElementById('refresh');
const applyFilterButton = document.getElementById("apply-filter");

let drawing = false;

// === INIT FILTER SELECT OPTIONS ===
FILTERS.forEach(f => {
  const opt = document.createElement("option");
  opt.value = f;
  opt.textContent = f;
  select.appendChild(opt);
});

// === DRAWING EVENTS ===
canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', e => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const cmd = { x: e.clientX - rect.left, y: e.clientY - rect.top, type: "line" };
  sendCommand(cmd);
  draw(cmd);
});

// === DRAW FUNCTION ===
function draw(cmd) {
  ctx.lineTo(cmd.x, cmd.y);
  ctx.stroke();
}

// === SEND DRAW DATA TO SERVER ===
async function sendCommand(cmd) {
  await fetch(`${API}/draw/${ROOM_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
}

// === POLLING FUNCTION ===
async function poll() {
  try {
    const res = await fetch(`${API}/draw/${ROOM_ID}`);
    const json = await res.json();

    console.log("🔍 Відповідь від сервера:", json);

    if (Array.isArray(json)) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      json.forEach(({ x0, y0, x1, y1, color }) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      });
    } else {
      console.warn(" Сервер повернув неочікувану відповідь:", json);
    }
  } catch (err) {
    console.error(" ПОМИЛКА при fetch:", err);
  }
}

// === FILTER FUNCTION ===
async function applyFilter() {
  const { width, height } = canvas;

  // Малюємо білий фон під зображення
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas. width, canvas. height);
  ctx.restore();

  const imgData = ctx.getImageData(0, 0, width, height);
  const dataArray = Array.from(imgData.data);

  const filterName = select.value;

  try {
    const res = await fetch(`${API}/filter/${ROOM_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_data: dataArray,
        filter_name: filterName,
        width,
        height
      })
    });

    const json = await res.json();
    const newData = new Uint8ClampedArray(json.image_data);
    ctx.putImageData(new ImageData(newData, width, height), 0, 0);

    console.log(" Фільтр застосовано:", filterName);
  } catch (err) {
    console.error(" Помилка при застосуванні фільтра:", err);
  }
}

// === EVENT LISTENERS ===
refreshButton.onclick = poll;
applyFilterButton.onclick = applyFilter;

// === INITIAL LOAD ===
poll();
