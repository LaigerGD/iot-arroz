const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ================= SIMULANDO LOS DATOS DE LOS SENSORES =================
function generarDatos() {
  return {
    humedad: Math.floor(Math.random() * (80 - 50 + 1)) + 50,     // Genera valores entre 50 y 80
    temp_suelo: Math.floor(Math.random() * (35 - 20 + 1)) + 20,  // Genera valores entre 20°C y 35°C
    temp_amb: Math.floor(Math.random() * (40 - 25 + 1)) + 25,    // Genera valores entre 25°C y 40°C
    luz: Math.floor(Math.random() * (1000 - 100 + 1)) + 100,     // Genera valores entre 100 y 1000
    ph: (Math.random() * (8 - 5) + 5).toFixed(2)                  // Genera valores entre 5.0 y 8.0 con dos decimales
  };
}

// ================= ENDPOINT PARA OBTENER DATOS =================
app.get("/api/datos", (req, res) => {
  const datos = generarDatos();  // Generamos los datos aleatorios
  res.json(datos);               // Enviamos los datos como respuesta
});

// ================= SERVIR EL ARCHIVO HTML =================
app.use(express.static(path.join(__dirname, 'public')));

// ================= INICIAR EL SERVIDOR =================
app.listen(PORT, () => {
  console.log(`Backend IoT Arroz activo en el puerto ${PORT}`);
});
