const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS y JSON
app.use(cors());
app.use(express.json());

// URL de conexión a MongoDB (ajustada con el nombre "Gersoniot")
const uri = "mongodb+srv://iot:iot123@gerson.vlft9c5.mongodb.net/?appName=Gerson";  // Asegúrate de que este URL sea correcto
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connect() {
    try {
        await client.connect();
        console.log("🚀 Conectado a MongoDB");
    } catch (err) {
        console.error("Error al conectar con MongoDB: ", err);
    }
}

// Conectarse a MongoDB
connect();

// ================= DATOS =================
let datos = {
  humedad: 0,
  temp_suelo: 0,
  temp_amb: 0,
  luz: 0,
  ph: 0,
  fecha: new Date()
};

// ================= RUTA PARA RECIBIR DATOS DEL ESP32 =================
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

  // Guardar los datos en la variable
  datos = {
    humedad,
    temp_suelo,
    temp_amb,
    luz,
    ph,
    fecha: new Date()
  };

  // Guardar en MongoDB
  const database = client.db('iot_arroz');  // Base de datos que usamos en MongoDB
  const collection = database.collection('sensores');  // Nombre de la colección

  // Insertar datos en la base de datos
  collection.insertOne(datos, (err, result) => {
    if (err) {
      return res.status(500).send("Error al guardar los datos");
    }
    console.log("📦 Datos guardados en MongoDB");
    res.status(200).send("Datos guardados");
  });
});

// ================= RUTA PARA OBTENER LOS DATOS =================
app.get("/api/datos", (req, res) => {
  res.json(datos);
});

// ================= RUTA PARA LA PÁGINA PRINCIPAL =================
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
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: green; }
        .card { border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; }
        canvas { max-width: 400px; }
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

      <h3>Gráfico de Humedad</h3>
      <canvas id="graficoHumedad"></canvas>

      <script>
        const ctx = document.getElementById('graficoHumedad').getContext('2d');
        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: [1, 2, 3, 4, 5],  // Aquí puedes agregar las etiquetas del eje X
            datasets: [{
              label: 'Humedad (%)',
              data: [${datos.humedad}, ${datos.humedad}, ${datos.humedad}, ${datos.humedad}, ${datos.humedad}],  // Aquí van los datos
              borderColor: 'rgba(75, 192, 192, 1)',
              fill: false
            }]
          },
          options: {
            scales: {
              y: {
                min: 0,
                max: 100
              }
            }
          }
        });
      </script>

      <script>
        setTimeout(() => location.reload(), 5000);
      </script>
    </body>
    </html>
  `);
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, () => {
  console.log(`🚀 Backend IoT Arroz activo en el puerto ${PORT}`);
});
