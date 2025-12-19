const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔴 PEGA AQUÍ TU URL REAL DE GOOGLE SHEETS
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/TU_ID_REAL/exec";

let lastData = {};

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📡 Ruta donde el ESP32 envía datos
app.post("/api/data", async (req, res) => {
  try {
    lastData = req.body;

    // Enviar a Google Sheets
    await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lastData)
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error guardando datos" });
  }
});

// 📊 Ruta para que la web lea datos
app.get("/api/data", (req, res) => {
  res.json(lastData);
});

// INICIAR SERVIDOR (ESTO EVITA EL ERROR ESTADO 1)
app.listen(PORT, () => {
  console.log("Servidor activo en puerto", PORT);
});
