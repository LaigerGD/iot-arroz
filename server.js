const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// CONFIG
// =======================
const MAX_POINTS = 20;
const PORT = process.env.PORT || 3000;

// =======================
// DATA STORAGE
// =======================
let history = {
  labels: [],
  humedad: [],
  temp_suelo: [],
  temp_ambiente: [],
  luz: [],
  ph: [],
  bateria: []
};

let lastDataTime = null;

// =======================
// HELPER
// =======================
function pushData(arr, value) {
  arr.push(value);
  if (arr.length > MAX_POINTS) arr.shift();
}

function pushLabel() {
  const time = new Date().toLocaleTimeString();
  history.labels.push(time);
  if (history.labels.length > MAX_POINTS) history.labels.shift();
}

// =======================
// API – RECEIVE DATA FROM ESP32
// =======================
app.post('/api/data', (req, res) => {
  const {
    humedad = 0,
    temp_suelo = 0,
    temp_ambiente = 0,
    luz = 0,
    ph = 0,
    bateria = 0
  } = req.body;

  pushLabel();
  pushData(history.humedad, humedad);
  pushData(history.temp_suelo, temp_suelo);
  pushData(history.temp_ambiente, temp_ambiente);
  pushData(history.luz, luz);
  pushData(history.ph, ph);
  pushData(history.bateria, bateria);

  lastDataTime = Date.now();

  res.json({ ok: true });
});

// =======================
// API – SEND DATA TO FRONTEND
// =======================
app.get('/api/data', (req, res) => {
  let status = 'ESP32 DESCONECTADO';

  if (lastDataTime && Date.now() - lastDataTime < 10000) {
    status = 'ESP32 CONECTADO';
  }

  const latestIndex = history.humedad.length - 1;

  res.json({
    status,
    latest: {
      humedad: history.humedad[latestIndex] || 0,
      temp_suelo: history.temp_suelo[latestIndex] || 0,
      temp_ambiente: history.temp_ambiente[latestIndex] || 0,
      luz: history.luz[latestIndex] || 0,
      ph: history.ph[latestIndex] || 0,
      bateria: history.bateria[latestIndex] || 0
    },
    history
  });
});

// =======================
// STATIC FILES (HTML, LOGO)
// =======================
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// START SERVER
// =======================
app.listen(PORT, () => {
  console.log(`✅ Server corriendo en puerto ${PORT}`);
});
