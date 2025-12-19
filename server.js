const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// =================== CONFIG ===================
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyXmVGl8Dg37m6203GUNbkqesn9GcVzV8uU4rHQe8cX6Cs4ijrA1NdU0c_24CGWN0tR/exec";

// =============================================

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// =================== ESTADO ===================
let lastData = null;
let lastUpdate = Date.now();

let history = {
  humedad: [],
  temp_suelo: [],
  temp_ambiente: [],
  luz: [],
  ph: [],
  bateria: []
};

// =================== UTIL ===================
function pushHistory(arr, value) {
  arr.push(value);
  if (arr.length > 20) arr.shift();
}

// =================== IA AGRÍCOLA ===================
function getIAStatus(data) {
  if (!data) return "⚠️ ESP32 desconectado.";

  if (data.bateria < 20)
    return "🔋 Batería crítica. Riesgo de apagado.";

  if (data.humedad < 60)
    return "💧 Suelo seco. Se recomienda riego.";

  if (data.humedad > 90)
    return "⚠️ Exceso de agua. Riesgo de pudrición.";

  if (data.ph < 5.5 || data.ph > 7.5)
    return "🧪 pH fuera de rango óptimo para arroz.";

  if (data.luz < 400)
    return "🌥️ Luz insuficiente. Afecta crecimiento.";

  return "✅ Condiciones adecuadas para el arroz.";
}

// =================== ESP32 ENVÍA DATOS ===================
app.post("/api/data", async (req, res) => {
  const data = req.body;

  lastData = data;
  lastUpdate = Date.now();

  pushHistory(history.humedad, data.humedad);
  pushHistory(history.temp_suelo, data.temp_suelo);
  pushHistory(history.temp_ambiente, data.temp_ambiente);
  pushHistory(history.luz, data.luz);
  pushHistory(history.ph, data.ph);
  pushHistory(history.bateria, data.bateria);

  // 👉 Guardar en Google Sheets
  try {
    await axios.post(GOOGLE_SCRIPT_URL, data);
  } catch (err) {
    console.error("Error enviando a Sheets:", err.message);
  }

  res.json({ status: "OK" });
});

// =================== FRONTEND PIDE DATOS ===================
app.get("/api/data", (req, res) => {

  // ESP32 desconectado (10 segundos sin datos)
  if (!lastData || Date.now() - lastUpdate > 10000) {
    return res.json({
      disconnected: true,
      ia: "⚠️ ESP32 desconectado o sin transmisión."
    });
  }

  res.json({
    disconnected: false,
    ...lastData,
    history,
    ia: getIAStatus(lastData)
  });
});

// =================== START ===================
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
