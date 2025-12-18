const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ================= CONEXIÓN A MONGO =================
const uri = "mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/test?retryWrites=true&w=majority";
let db;

// Conectar a MongoDB
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db("iot_arroz"); // Base de datos "iot_arroz"
    console.log("Conectado a MongoDB");
  })
  .catch(err => console.error("Error al conectar con MongoDB:", err));

// ================= ENDPOINT PARA RECIBIR DATOS =================
app.post("/api/datos", (req, res) => {
  const { humedad, temp_suelo, temp_amb, luz, ph } = req.body;

  if (humedad === undefined || temp_suelo === undefined || temp_amb === undefined || luz === undefined || ph === undefined) {
    return res.status(400).send("Faltan datos");
  }

  // Guardar los datos en MongoDB
  db.collection("sensores").insertOne({
    humedad, temp_suelo, temp_amb, luz, ph, fecha: new Date()
  })
    .then(() => {
      console.log("Datos guardados");
      res.status(200).send("Datos guardados");
    })
    .catch(err => {
      console.error("Error al guardar los datos:", err);
      res.status(500).send("Error al guardar los datos");
    });
});

// ================= ENDPOINT PARA OBTENER LOS DATOS =================
app.get("/api/datos", (req, res) => {
  db.collection("sensores")
    .find()
    .sort({ fecha: -1 })
    .limit(1)
    .toArray()
    .then(data => {
      res.json(data[0]); // Enviar los últimos datos registrados
    })
    .catch(err => {
      res.status(500).send("Error al obtener los datos");
    });
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

      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        fetch('/api/datos')
          .then(response => response.json())
          .then(datos => {
            const ctx = document.getElementById('grafico').getContext('2d');
            new Chart(ctx, {
              type: 'line', // Tipo de gráfico
              data: {
                labels: ['Humedad', 'Temp. Suelo', 'Temp. Ambiente', 'Luz', 'pH'],
                datasets: [{
                  label: 'Datos Sensor',
                  data: [datos.humedad, datos.temp_suelo, datos.temp_amb, datos.luz, datos.ph],
                  borderColor: 'rgb(75, 192, 192)',
                  fill: false
                }]
              },
              options: {
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }
            });
          })
          .catch(error => console.error('Error al obtener los datos:', error));
      </script>

      <canvas id="grafico" width="400" height="200"></canvas>
    </body>
    </html>
  `);
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, () => {
  console.log(`🚀 Backend IoT Arroz activo en el puerto ${PORT}`);
});