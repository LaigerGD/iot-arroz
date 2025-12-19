const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIG =================
const PORT = process.env.PORT || 3000;
const MAX_POINTS = 20;

// 👉 TU URL DE APPS SCRIPT (EXCEL)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyXmVGl8Dg37m6203GUNbkqesn9GcVzV8uU4rHQe8cX6Cs4ijrA1NdU0c_24CGWN0tR/exec';

// ================= DATA =================
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

// ================= HELPERS =================
function push(arr, val) {
  arr.push(val);
  if (arr.length > MAX_POINTS) arr.shift();
}

function pushLabel() {
  const t = new Date().toLocaleTimeString();
  history.labels.push(t);
  if (history.labels.length > MAX_POINTS) history.labels.shift();
}

// ================= ESP32 → SERVER =================
app.post('/api/data', async (req, res) => {
  const data = {
    humedad: req.body.humedad || 0,
    temp_suelo: req.body.temp_suelo || 0,
    temp_ambiente: req.body.temp_ambiente || 0,
    luz: req.body.luz || 0,
    ph: req.body.ph || 0,
    bateria: req.body.bateria || 0
  };

  pushLabel();
  push(history.humedad, data.humedad);
  push(history.temp_suelo, data.temp_suelo);
  push(history.temp_ambiente, data.temp_ambiente);
  push(history.luz, data.luz);
  push(history.ph, data.ph);
  push(history.bateria, data.bateria);

  lastDataTime = Date.now();

  // 👉 ENVÍO A GOOGLE SHEETS
  try {
    await axios.post(GOOGLE_SCRIPT_URL, data);
  } catch (err) {
    console.error('Error enviando a Excel:', err.message);
  }

  res.json({ ok: true });
});

// ================= WEB → SERVER =================
app.get('/api/data', (req, res) => {
  const status =
    lastDataTime && Date.now() - lastDataTime < 10000
      ? 'ESP32 CONECTADO'
      : 'ESP32 DESCONECTADO';

  const i = history.labels.length - 1;

  res.json({
    status,
    latest: {
      humedad: history.humedad[i] || 0,
      temp_suelo: history.temp_suelo[i] || 0,
      temp_ambiente: history.temp_ambiente[i] || 0,
      luz: history.luz[i] || 0,
      ph: history.ph[i] || 0,
      bateria: history.bateria[i] || 0
    },
    history
  });
});

// ================= STATIC =================
app.use(express.static(path.join(__dirname, 'public')));

// ================= START =================
app.listen(PORT, () => {
  console.log('Servidor listo en puerto', PORT);
});
