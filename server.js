// ===============================
// IMPORTS
// ===============================
const express = require("express");
const axios = require("axios");
const cors = require("cors");

// ===============================
// CONFIG
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

// URL REAL de tu Apps Script
const GOOGLE_SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbyXmVGl8Dg37m6203GUNbkqesn9GcVzV8uU4rHQe8cX6Cs4ijrA1NdU0c_24CGWN0tR/exec";

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// ESTADO GLOBAL (último dato)
// ===============================
let lastData = {
  humedad: null,
  temp_suelo: null,
  temp_ambiente: null,
  luz: null,
  ph: null,
  fecha: null
};

// ===============================
// RUTAS
// ===============================

// Ruta base (test)
app.get("/", (req, res) => {
  res.send("Servidor IoT Arroz activo 🌾");
});

// -------------------------------
// ESP32 → SERVER
// -------------------------------
app.post("/api/data", async (req, res) => {
  try {
    const {
      humedad,
      temp_suelo,
      temp_ambiente,
      luz,
      ph
    } = req.body;

    // Validación básica
    if (
      humedad === undefined ||
      temp_suelo === undefined ||
      temp_ambiente === undefined ||
      luz === undefined ||
      ph === undefined
    ) {
      return res.status(400).json({
        status: "error",
        message: "Datos incompletos"
      });
    }

    // Guardar último estado
    lastData = {
      humedad,
      temp_suelo,
      temp_ambiente,
      luz,
      ph,
      fecha: new Date().toISOString()
    };

    // Enviar a Google Sheets
    await axios.post(GOOGLE_SHEETS_URL, {
      humedad,
      temp_suelo,
      temp_ambiente,
      luz,
      ph
    });

    res.json({
      status: "ok",
      message: "Datos recibidos y guardados"
    });

  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno del servidor"
    });
  }
});

// -------------------------------
// FRONTEND → SERVER
// -------------------------------
app.get("/api/data", (req, res) => {
  res.json(lastData);
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
