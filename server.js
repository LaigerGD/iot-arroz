const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

// ===== FIREBASE ADMIN =====
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://sistema-iot-c2ffd-default-rtdb.firebaseio.com"
});

const db = admin.database();

// ===== EXPRESS =====
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== SERVIR HTML =====
app.use(express.static(path.join(__dirname, "public")));

// ===== ESP32 → GUARDA DATOS =====
app.post("/api/datos", async (req, res) => {
  try {
    const { humedad, temp_suelo, temp_amb, luz, ph } = req.body;

    if (
      humedad === undefined ||
      temp_suelo === undefined ||
      temp_amb === undefined ||
      luz === undefined ||
      ph === undefined
    ) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const datos = {
      humedad,
      temp_suelo,
      temp_amb,
      luz,
      ph,
      fecha: Date.now()
    };

    await db.ref("sensores").push(datos);

    res.json({ ok: true });

  } catch (e) {
    res.status(500).json({ error: "Error servidor" });
  }
});

// ===== WEB → ÚLTIMO DATO =====
app.get("/api/datos", async (req, res) => {
  const snap = await db.ref("sensores").limitToLast(1).once("value");
  const data = snap.val();
  const ultimo = data ? Object.values(data)[0] : {};
  res.json(ultimo);
});

// ===== START =====
app.listen(PORT, () => {
  console.log("🚀 Server listo");
});
