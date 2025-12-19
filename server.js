import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// 🔴 VALIDACIÓN CRÍTICA
if (!process.env.GOOGLE_CREDENTIALS) {
  console.error("❌ GOOGLE_CREDENTIALS NO DEFINIDA");
  process.exit(1);
}

// Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "TU_ID_DE_SHEET";
const SHEET_NAME = "Hoja 1";

app.post("/data", async (req, res) => {
  const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

  console.log("📥 Datos recibidos:", req.body);

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          new Date().toLocaleString(),
          humedad,
          temp_suelo,
          temp_ambiente,
          luz,
          ph
        ]]
      }
    });

    console.log("✅ Guardado en Google Sheets");
    res.json({ ok: true });

  } catch (error) {
    console.error("❌ Error al guardar:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
});