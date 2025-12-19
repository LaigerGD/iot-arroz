const express = require("express");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

// 🔹 ID DE TU GOOGLE SHEET
const SHEET_ID = "19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y";

// 🔹 AUTENTICACIÓN GOOGLE
const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// 🔹 ENDPOINT PARA RECIBIR DATOS DEL ESP32 / WEB
app.post("/api/data", async (req, res) => {
  try {
    const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

    console.log("📥 Datos recibidos:", req.body);

    const fecha = new Date().toLocaleString("es-PE");

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Hoja 1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[fecha, humedad, temp_suelo, temp_ambiente, luz, ph]],
      },
    });

    console.log("✅ Datos guardados en Google Sheets");
    res.json({ ok: true });
  } catch (error) {
    console.error("❌ Error al guardar:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 SERVIR LA WEB
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});
