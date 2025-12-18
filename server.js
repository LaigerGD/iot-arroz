import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Firebase Admin (Service Account)
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sistema-iot-c2ffd-default-rtdb.firebaseio.com"
});

const db = admin.database();

// 📥 ESP32 → Render
app.post("/api/datos", async (req, res) => {
  try {
    const data = req.body;

    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: "JSON vacío" });
    }

    const timestamp = Date.now();

    await db.ref("datos/actual").set(data);
    await db.ref(`datos/historial/${timestamp}`).set(data);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Firebase error" });
  }
});

// 📤 Web / pruebas
app.get("/api/datos", async (req, res) => {
  const snap = await db.ref("datos/actual").once("value");
  res.json(snap.val());
});

// 🌐 Web
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("Servidor activo en puerto", PORT)
);
