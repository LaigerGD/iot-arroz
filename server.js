import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// para servir HTML
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// variable para guardar últimos datos
let datos = {
  humedad: "-",
  temp_suelo: "-",
  temp_amb: "-",
  luz: "-",
  ph: "-"
};

// ESP32 ENVÍA DATOS AQUÍ
app.post("/datos", (req, res) => {
  datos = req.body;
  console.log("📡 Datos recibidos:", datos);
  res.json({ ok: true });
});

// HTML pide datos
app.get("/datos", (req, res) => {
  res.json(datos);
});

// raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🔥 Servidor activo en puerto", PORT);
});
