const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb"); // Importar MongoClient

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const mongoUrl = "mongodb+srv://iot:iot123@gerson.anggqsy.mongodb.net/?appName=Gerson"; // Reemplaza con tu cadena de conexión

// Conectar a la base de datos MongoDB
const client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => {
    console.log("✅ Conectado a MongoDB");
  })
  .catch((err) => {
    console.error("❌ Error de conexión a MongoDB", err);
  });

// ================= DATOS =================
let datos = {
  humedad: 0,
  temp_suelo: 0,
  temp_amb: 0,
  luz: 0,
  ph: 0,
  fecha: new Date()
};

// ================= ESP32 ENVÍA =================
app.post("/api/datos", (req, res) => {
  const { humedad, temp_suelo, temp_amb, luz, ph } = req.body;

  if (
    humedad === undefined ||
    temp_suelo === undefined ||
    temp_amb === undefined ||
    luz === undefined ||
    ph === undefined
  ) {
    return res.status(400).send("Datos incompletos");
  }

  // Actualizamos los datos en la variable
  datos = {
    humedad,
    temp_suelo,
    temp_amb,
    luz,
    ph,
    fecha: new Date()
  };

  console.log("📡 Datos recibidos:", datos);

  // Insertar datos en MongoDB
  const db = client.db("iot-arroz"); // Nombre de la base de datos
  const collection = db.collection("sensores"); // Nombre de la colección

  // Insertar los datos en la colección "sensores"
  collection.insertOne(datos)
    .then(result => {
      console.log("📦 Datos insertados en MongoDB", result);
      res.status(200).send("OK");
    })
    .catch(err => {
      console.error("❌ Error al insertar datos en MongoDB", err);
      res.status(500).send("Error al insertar datos");
    });
});

// ================= WEB LEE =================
app.get("/api/datos", (req, res) => {
  res.json(datos);
});

// ================= PÁGINA WEB =================
app.get("/", (req, res) => {
  let mensajeIA = "Condiciones normales";

  if (datos.humedad < 40) mensajeIA = "⚠️ Humedad baja, posible falta de riego";
  if (datos.temp_suelo > 35) mensajeIA = "⚠️ Temperatura del suelo elevada";
  if (datos.ph < 5.5 || datos.ph > 6.5) mensajeIA = "⚠️ pH fuera del rango óptimo";

  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>IoT Arroz</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial; padding: 20px; }
    h1 { color: green; }
    .card { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>🌱 Sistema IoT – Replante de Arroz</h1>

  <div class="card">💧 Humedad: ${datos.humedad} %</div>
  <div class="card">🌡️ Temp. Suelo: ${datos.temp_suelo} °C</div>
  <div class="card">🌤️ Temp. Ambiente: ${datos.temp_amb} °C</div>
  <div class="card">☀️ Luz: ${datos.luz}</div>
  <div class="card">🧪 pH: ${datos.ph}</div>

  <h2>🤖 Asistencia IA</h2>
  <p>${mensajeIA}</p>

  <script>
    setTimeout(() => location.reload(), 5000);
  </script>
</body>
</html>
  `);
});

// ================= START =================
app.listen(PORT, () => {
  console.log("🚀 Backend IoT Arroz activo");
});
