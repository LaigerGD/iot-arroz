/**
 * server.js
 * Backend simple para web IoT Arroz
 */

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------- DATOS SIMULADOS ----------------
let data = {
  humedad: 70,
  temp_suelo: 26,
  temp_ambiente: 30,
  luz: 700,
  ph: 6.2,
  fecha: new Date()
};

// Simular sensores cada 3 segundos
setInterval(() => {
  data = {
    humedad: Math.floor(Math.random() * 30) + 60,
    temp_suelo: (Math.random() * 10 + 25).toFixed(1),
    temp_ambiente: (Math.random() * 10 + 28).toFixed(1),
    luz: Math.floor(Math.random() * 600) + 400,
    ph: (Math.random() * 1.5 + 5.5).toFixed(1),
    fecha: new Date()
  };
}, 3000);

// ---------------- MIDDLEWARE ----------------
app.use(express.static("public"));

// ---------------- RUTAS ----------------

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API para enviar datos a la web
app.get("/api/data", (req, res) => {
  res.json(data);
});

// ---------------- INICIAR SERVIDOR ----------------
app.listen(PORT, () => {
  console.log(`✅ Servidor IoT Arroz activo en puerto ${PORT}`);
});
