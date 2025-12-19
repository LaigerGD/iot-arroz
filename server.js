import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";

const app = express();
app.use(bodyParser.json());

/* =========================
   CONFIG GOOGLE SHEETS
========================= */

// 1️⃣ CREDENCIALES DESDE VARIABLE DE ENTORNO
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// 2️⃣ AUTENTICACIÓN
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ["https://www.googleapis.com/auth/spreadsheets"]
);

const sheets = google.sheets({ version: "v4", auth });

// 3️⃣ ID DE TU SHEET (solo el ID)
const SPREADSHEET_ID = "19TOTCF0SkEN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y";

// 4️⃣ NOMBRE DE LA HOJA
const SHEET_NAME = "Hoja 1";

/* =========================
   ENDPOINT PARA DATOS IoT
========================= */

app.post("/datos", async (req, res) => {
  try {
    const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

    console.log("📡 Datos recibidos:", req.body);

    // FECHA Y HORA ACTUAL
    const fecha = new Date().toLocaleString("es-MX");

    // 5️⃣ AGREGAR FILA (append → NO BORRA NADA)
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[fecha, humedad, temp_suelo, temp_ambiente, luz, ph]],
      },
    });

    console.log("✅ Datos guardados en Google Sheets");

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("❌ Error al guardar:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   SERVIDOR
========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});
