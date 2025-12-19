const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

/* =======================
   CONFIGURACIÓN
======================= */

// URL DE TU APPS SCRIPT (Google Sheets)
const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyXmVGl8Dg37m6203GUNbkqesn9GcVzV8uU4rHQe8cX6Cs4ijrA1NdU0c_24CGWN0tR/exec';

// Tiempo máximo sin datos (ms) para considerar desconectado
const TIMEOUT_MS = 15000;

/* =======================
   MIDDLEWARES
======================= */

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (HTML, CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

/* =======================
   ESTADO GLOBAL
======================= */

let latestData = {
  humedad: 0,
  temp_suelo: 0,
  temp_ambiente: 0,
  luz: 0,
  ph: 0,
  bateria: 0,
  timestamp: null
};

/* =======================
   ENDPOINT ESP32
======================= */

app.post('/api/data', async (req, res) => {
  const data = req.body;

  // Validación básica
  if (!data) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  // Guardar último estado
  latestData = {
    humedad: data.humedad || 0,
    temp_suelo: data.temp_suelo || 0,
    temp_ambiente: data.temp_ambiente || 0,
    luz: data.luz || 0,
    ph: data.ph || 0,
    bateria: data.bateria || 0,
    timestamp: Date.now()
  };

  // Enviar a Google Sheets
  try {
    await axios.post(GOOGLE_SCRIPT_URL, latestData, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error enviando a Google Sheets:', error.message);
  }

  res.json({ status: 'OK' });
});

/* =======================
   ENDPOINT DASHBOARD
======================= */

app.get('/api/data', (req, res) => {
  let status = 'ESP32 CONECTADO';

  if (
    !latestData.timestamp ||
    Date.now() - latestData.timestamp > TIMEOUT_MS
  ) {
    status = 'ESP32 DESCONECTADO';
  }

  res.json({
    ...latestData,
    status
  });
});

/* =======================
   RUTA PRINCIPAL
======================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* =======================
   SERVIDOR
======================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor IoT activo en puerto ${PORT}`);
});
