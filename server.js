import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import db from "./firebase.js"; // 👈 IMPORTA FIREBASE

const app = express();
app.use(cors());
app.use(express.json());

// para servir HTML
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// datos en memoria (para la web)
let datos = {
  humedad: "-",
  temp_suelo: "-",
  temp_amb: "-",
  luz: "-",
  ph: "-"
};

// ESP32 ENVÍA DATOS
app.post("/datos", async (req, res) => {
  datos = req.body;
  console.log("📥 Datos recibidos:", datos);

  try {
    await db.ref("historial").push({
      ...datos,
      timestamp: Date.now()
    });
    console.log("🔥 Guardado en Firebase");
  } catch (e) {
    console.error("❌ Error Firebase:", e);
  }

  res.json({ ok: true });
});

// HTML PIDE DATOS
app.get("/datos", (req, res) => {
  res.json(datos);
});

// raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
