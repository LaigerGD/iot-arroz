// ===============================
// IMPORTACIONES
// ===============================
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { google } = require("googleapis");

// ===============================
// CONFIGURACIÓN BÁSICA
// ===============================
const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ ID DE TU GOOGLE SHEET (CONFIRMADO)
const SPREADSHEET_ID = "19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y";

// ===============================
// MIDDLEWARE
// ===============================
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// AUTENTICACIÓN GOOGLE SHEETS
// ===============================
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({
  version: "v4",
  auth,
});

// ===============================
// RUTA PRINCIPAL (WEB)
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// API: RECIBIR DATOS (ESP32 / POSTMAN)
// ===============================
app.post("/api/data", async (req, res) => {
  try {
    const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

    const fecha = new Date().toLocaleString("es-PE");

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Hoja 1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[fecha, humedad, temp_suelo, temp_ambiente, luz, ph]],
      },
    });

    console.log("✅ Datos guardados en Google Sheets");
    res.json({ ok: true });
  } catch (error) {
    console.error("❌ Error guardando datos:", error);
    res.status(500).json({ ok: false });
  }
});

// ===============================
// API: DATOS PARA LA WEB (SIMULADOS)
// ===============================
app.get("/api/data", (req, res) => {
  res.json({
    humedad: Math.floor(Math.random() * 20) + 70,
    temp_suelo: (Math.random() * 5 + 24).toFixed(1),
    temp_ambiente: (Math.random() * 5 + 28).toFixed(1),
    luz: Math.floor(Math.random() * 500) + 400,
    ph: (Math.random() * 1 + 5.8).toFixed(2),
  });
});

// ===============================
// INICIAR SERVIDOR
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
