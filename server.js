const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* ================== CONFIG ================== */

// URL DE TU GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyXmVGl8Dg37m6203GUNbkqesn9GcVzV8uU4rHQe8cX6Cs4ijrA1NdU0c_24CGWN0tR/exec";

// tiempo máximo sin datos (ms) → desconectado
const TIMEOUT_MS = 15000;

// historial para gráficas
const MAX_POINTS = 20;

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================== ESTADO ================== */

let lastDataTime = 0;

let currentData = {
  humedad: 0,
  temp_suelo: 0,
  temp_ambiente: 0,
  luz: 0,
  ph: 0,
  bateria: 0
};

let history = {
  labels: [],
  humedad: [],
  temp_suelo: [],
  temp_ambiente: [],
  luz: [],
  ph: [],
  bateria: []
};

/* ================== FUNCIONES ================== */

function addHistory(label, key, value) {
  history[key].push(value);
  if (history[key].length > MAX_POINTS) history[key].shift();
}

function addLabel(label) {
  history.labels.push(label);
  if (history.labels.length > MAX_POINTS) history.labels.shift();
}

function isDisconnected() {
  return Date.now() - lastDataTime > TIMEOUT_MS;
}

function analyzeData() {
  if (isDisconnected()) {
    return {
      estado: "DESCONECTADO",
      mensajes: ["ESP32 o controlador desconectado"],
      recomendacionFinal:
        "Verifique alimentación, conexión WiFi o sistema solar."
    };
  }

  let mensajes = [];
  let estado = "OPTIMO";

  if (currentData.humedad < 65) {
    mensajes.push("Humedad baja: considerar riego.");
    estado = "ATENCION";
  }

  if (currentData.temp_suelo > 35) {
    mensajes.push("Temperatura del suelo elevada.");
    estado = "ATENCION";
  }

  if (currentData.ph < 5.5 || currentData.ph > 7.2) {
    mensajes.push("pH fuera del rango óptimo.");
    estado = "ATENCION";
  }

  if (currentData.bateria < 30) {
    mensajes.push("Batería baja: revisar panel solar.");
    estado = "ATENCION";
  }

  if (mensajes.length === 0) {
    mensajes.push("Condiciones del terreno óptimas.");
  }

  return {
    estado,
    mensajes,
    recomendacionFinal:
      estado === "OPTIMO"
        ? "Sistema funcionando correctamente."
        : "Revisar alertas indicadas."
  };
}

/* ================== RUTAS ================== */

// ESP32 → SERVER
app.post("/api/data", async (req, res) => {
  const data = req.body;

  currentData = data;
  lastDataTime = Date.now();

  const label = new Date().toLocaleTimeString();

  addLabel(label);
  addHistory(label, "humedad", data.humedad);
  addHistory(label, "temp_suelo", data.temp_suelo);
  addHistory(label, "temp_ambiente", data.temp_ambiente);
  addHistory(label, "luz", data.luz);
  addHistory(label, "ph", data.ph);
  addHistory(label, "bateria", data.bateria);

  // Enviar a Google Sheets
  try {
    await axios.post(GOOGLE_SCRIPT_URL, data);
  } catch (err) {
    console.error("Error enviando a Sheets:", err.message);
  }

  res.json({ status: "ok" });
});

// HMI → DATOS
app.get("/api/data", (req, res) => {
  if (isDisconnected()) {
    return res.json({
      ...currentData,
      history,
      disconnected: true
    });
  }

  res.json({
    ...currentData,
    history,
    disconnected: false
  });
});

// HMI → ASISTENTE IA
app.get("/api/analysis", (req, res) => {
  res.json(analyzeData());
});

/* ================== SERVER ================== */

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
