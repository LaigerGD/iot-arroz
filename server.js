const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// URL DE TU APPS SCRIPT (LA QUE YA PASASTE)
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyXmVGl8Dg37m6203GUNbkqesn9GcVzV8uU4rHQe8cX6Cs4ijrA1NdU0c_24CGWN0tR/exec";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== MEMORIA EN TIEMPO REAL ======
let lastData = {
  humedad: 0,
  temp_suelo: 0,
  temp_ambiente: 0,
  luz: 0,
  ph: 0,
};

let history = {
  humedad: [],
  temp_suelo: [],
  temp_ambiente: [],
  luz: [],
  ph: [],
  labels: [],
};

// ====== RECIBIR DATOS DEL ESP32 ======
app.post("/api/data", async (req, res) => {
  const data = req.body;
  const timestamp = new Date().toLocaleTimeString();

  lastData = data;

  history.humedad.push(data.humedad);
  history.temp_suelo.push(data.temp_suelo);
  history.temp_ambiente.push(data.temp_ambiente);
  history.luz.push(data.luz);
  history.ph.push(data.ph);
  history.labels.push(timestamp);

  // Limitar historial
  if (history.labels.length > 20) {
    Object.keys(history).forEach((k) => history[k].shift());
  }

  // Enviar a Google Sheets
  try {
    await axios.post(GOOGLE_SCRIPT_URL, data);
  } catch (err) {
    console.error("Error Google Sheets:", err.message);
  }

  res.json({ status: "OK" });
});

// ====== DATOS PARA EL DASHBOARD ======
app.get("/api/data", (req, res) => {
  res.json({
    ...lastData,
    history,
  });
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
