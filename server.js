import express from "express";
import cors from "cors";
import db from "./firebase.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta para recibir datos del ESP32
app.post("/datos", async (req, res) => {
  try {
    await db.ref("sensores").push({
      ...req.body,
      fecha: Date.now()
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error guardando datos:", error);
    res.status(500).json({ error: "Error al guardar datos" });
  }
});

// Ruta para enviar el último dato a la web
app.get("/datos", async (req, res) => {
  try {
    const snapshot = await db
      .ref("sensores")
      .limitToLast(1)
      .once("value");

    const data = snapshot.val();
    const ultimo = data ? Object.values(data)[0] : {};

    res.json(ultimo);
  } catch (error) {
    console.error("Error leyendo datos:", error);
    res.status(500).json({ error: "Error al leer datos" });
  }
});

// Puerto (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Servidor listo en puerto", PORT);
});
