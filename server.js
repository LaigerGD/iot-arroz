const express = require("express");
const WebSocket = require("ws");

// Para enviar datos a Google Sheets
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// 🔴 PEGA AQUÍ TU URL DE GOOGLE APPS SCRIPT
const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbwuajTzbzGCI2f4QFF8Z5VOWe4T1ipdire7msIElCBZgUcNqounNA3-LUQi5myEGg9b/exec";

// Iniciar servidor HTTP
const server = app.listen(PORT, () => {
  console.log("✅ Servidor IoT Arroz activo en puerto", PORT);
});

// WebSocket
const wss = new WebSocket.Server({ server });

// Últimos datos recibidos
let ultimoDato = {
  humedad: "-",
  temp_suelo: "-",
  temp_ambiente: "-",
  luz: "-",
  ph: "-"
};

// Cuando la web se conecta
wss.on("connection", (ws) => {
  ws.send(JSON.stringify(ultimoDato));
});

// Endpoint que usa el ESP32
app.post("/api/data", async (req, res) => {
  ultimoDato = req.body;

  // 1️⃣ Enviar datos a la web en tiempo real
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(ultimoDato));
    }
  });

  // 2️⃣ Guardar datos en Google Sheets (Excel)
  try {
    await fetch(GOOGLE_SHEETS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(ultimoDato)
    });
  } catch (error) {
    console.error("❌ Error enviando a Google Sheets");
  }

  res.json({ status: "ok" });
});
