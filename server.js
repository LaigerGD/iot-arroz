import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ===== Firebase =====
import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("./serviceAccountKey.json");

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sistema-iot-c2ffd-default-rtdb.firebaseio.com"
});

const db = admin.database();

// ===== Express =====
const app = express();
app.use(cors());
app.use(express.json());

// Para servir HTML
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// Guardar último dato recibido (para la web)
let ultimoDato = {
  humedad: "-",
  temp_suelo: "-",
  temp_amb: "-",
  luz: "-",
  ph: "-"
};

// ===== ESP32 ENVÍA DATOS =====
app.post("/datos", async (req, res) => {
  try {
    const datos = req.body;
    console.log("📥 Datos recibidos:", datos);

    // Guardar último dato
    ultimoDato = datos;

    // 🔥 GUARDAR EN FIREBASE (HISTORIAL)
    await db.ref("historial").push({
      ...datos,
      timestamp: Date.now()
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("❌ Error Firebase:", error);
    res.status(500).json({ ok: false });
  }
});

// ===== HTML PIDE DATOS =====
app.get("/datos", (req, res) => {
  res.json(ultimoDato);
});

// ===== RAÍZ =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== PUERTO =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto", PORT);
});
