const express = require("express");
const cors = require("cors");

// Importar las funciones necesarias de Firebase SDK
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// Configuración de Firebase (usa tus propios valores)
const firebaseConfig = {
  apiKey: "AIzaSyCjVwTpFJLtRyTHPawYAD8KP0F5ab8KwCM",  // Usa tu apiKey aquí
  authDomain: "sistema-iot-c2ffd.firebaseapp.com",  // Usa tu authDomain aquí
  projectId: "sistema-iot-c2ffd",  // Usa tu projectId aquí
  storageBucket: "sistema-iot-c2ffd.appspot.com",  // Usa tu storageBucket aquí
  messagingSenderId: "471483105768",  // Usa tu messagingSenderId aquí
  appId: "1:471483105768:web:b19ec6c8d73f41683fa45d",  // Usa tu appId aquí
  measurementId: "G-1DXNYXW",  // Usa tu measurementId aquí (si está disponible)
};

// Inicializar Firebase
const appFirebase = initializeApp(firebaseConfig);
const database = getDatabase(appFirebase);

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS y JSON
app.use(cors());
app.use(express.json());

// ================= DATOS =================
let datos = {
  humedad: 0,
  temp_suelo: 0,
  temp_amb: 0,
  luz: 0,
  ph: 0,
  fecha: new Date()
};

// ================= FUNCION PARA GUARDAR EN FIREBASE =================
function guardarDatosEnFirebase(datos) {
  const reference = ref(database, 'sensores');  // Crea una referencia en la base de datos
  set(reference, datos)  // Aquí 'datos' es el objeto que quieres guardar
    .then(() => {
      console.log('Datos guardados con éxito en Firebase');
    })
    .catch((error) => {
      console.error('Error al guardar los datos en Firebase:', error);
    });
}

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

  // Guardar en Firebase
  guardarDatosEnFirebase(datos);

  // Responder al cliente
  res.status(200).send("Datos guardados en Firebase");
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
