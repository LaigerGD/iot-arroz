const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔗 URL DE TU GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyXmVGl8Dg37m6203GUNbkqesn9GcVzV8uU4rHQe8cX6Cs4ijrA1NdU0c_24CGWN0tR/exec";

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== MEMORIA EN TIEMPO REAL =====
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

// ===== ASISTENTE IA (REGLAS INTELIGENTES) =====
function analizarTerreno(data) {
  let mensajes = [];
  let estado = "ÓPTIMO";

  // Humedad
  if (data.humedad < 70) {
    mensajes.push("🌧️ Humedad baja: se recomienda riego.");
    estado = "ATENCIÓN";
  } else if (data.humedad > 90) {
    mensajes.push("💧 Exceso de humedad: riesgo de encharcamiento.");
    estado = "ATENCIÓN";
  } else {
    mensajes.push("✅ Humedad adecuada para el arroz.");
  }

  // Temperatura del suelo
  if (data.temp_suelo < 20) {
    mensajes.push("🌡️ Suelo frío: puede retrasar el crecimiento.");
    estado = "ATENCIÓN";
  } else if (data.temp_suelo > 32) {
    mensajes.push("🔥 Suelo caliente: posible estrés radicular.");
    estado = "ATENCIÓN";
  } else {
    mensajes.push("✅ Temperatura del suelo óptima.");
  }

  // Temperatura ambiente
  if (data.temp_ambiente > 35) {
    mensajes.push("☀️ Temperatura ambiente alta: vigilar evaporación.");
    estado = "ATENCIÓN";
  } else {
    mensajes.push("✅ Temperatura ambiente adecuada.");
  }

  // Luz
  if (data.luz < 400) {
    mensajes.push("🌥️ Luz insuficiente para fotosíntesis.");
    estado = "ATENCIÓN";
  } else {
    mensajes.push("☀️ Nivel de luz adecuado.");
  }

  // pH
  if (data.ph < 5.5) {
    mensajes.push("⚠️ pH ácido: considerar encalado.");
    estado = "ATENCIÓN";
  } else if (data.ph > 7) {
    mensajes.push("⚠️ pH alcalino: puede afectar absorción de nutrientes.");
    estado = "ATENCIÓN";
  } else {
    mensajes.push("✅ pH ideal para el cultivo de arroz.");
  }

  return {
    estado,
    mensajes,
    recomendacionFinal:
      estado === "ÓPTIMO"
        ? "🌱 Condiciones adecuadas para el replante del arroz."
        : "⚠️ Se recomiendan ajustes antes del replante.",
  };
}

// ===== RECIBIR DATOS DEL ESP32 =====
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
    Object.keys(history).forEach((key) => history[key].shift());
  }

  // Enviar a Google Sheets
  try {
    await axios.post(GOOGLE_SCRIPT_URL, data);
  } catch (error) {
    console.error("Error al enviar a Google Sheets:", error.message);
  }

  res.json({ status: "OK" });
});

// ===== DATOS PARA DASHBOARD =====
app.get("/api/data", (req, res) => {
  res.json({
    ...lastData,
    history,
  });
});

// ===== ASISTENTE IA =====
app.get("/api/analysis", (req, res) => {
  const analysis = analizarTerreno(lastData);
  res.json(analysis);
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Servidor IoT Arroz activo en puerto ${PORT}`);
});
