import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

// ===== FIREBASE =====
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sistema-iot-c2ffd-default-rtdb.firebaseio.com"
});

const db = admin.database();

// ===== APP =====
const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 ESTO ERA LO QUE FALTABA / ESTABA MAL
app.use(cors());
app.use(express.json()); // ⬅️ CLAVE
app.use(express.urlencoded({ extended: true }));

// ===== RUTA POST (ESP32 / ReqBin) =====
app.post("/api/datos", async (req, res) => {
  try {
    const datos = req.body;

    // Validación mínima
    if (!datos || Object.keys(datos).length === 0) {
      return res.status(400).json({ error: "JSON vacío" });
    }

    await db.ref("sensores").set({
      ...datos,
      timestamp: Date.now()
    });

    console.log("📥 Datos recibidos:", datos);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// ===== RUTA GET (WEB) =====
app.get("/api/datos", async (req, res) => {
  const snap = await db.ref("sensores").once("value");
  res.json(snap.val() || {});
});

// ===== WEB =====
app.use(express.static("public"));

app.listen(PORT, () => {
  console.log(`🚀 Server activo en puerto ${PORT}`);
});
