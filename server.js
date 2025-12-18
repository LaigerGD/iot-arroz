const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// ================= CONEXIÓN A MONGO DB =================
const uri = "mongodb+srv://iot:<iot123>@gerson.anggqsy.mongodb.net/?appName=Gerson";
let db;

// Conexión a la base de datos
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db("iot_arroz");  // Cambia "iot_arroz" por el nombre de tu base de datos
    console.log("Conectado a MongoDB");
  })
  .catch(err => console.error("Error al conectar con MongoDB:", err));

// ================= CONFIGURACIONES =================
app.use(cors());
app.use(express.json());

// ================= RUTA PARA OBTENER DATOS =================
app.post("/api/datos", (req, res) => {
  const { humedad, temp_suelo, temp_amb, luz, ph } = req.body;

  if (!humedad || !temp_suelo || !temp_amb || !luz || !ph) {
    return res.status(400).send("Faltan datos");
  }

  const datos = {
    humedad,
    temp_suelo,
    temp_amb,
    luz,
    ph,
    fecha: new Date()
  };

  // Guardar en la base de datos
  db.collection("sensores").insertOne(datos)
    .then(() => res.status(200).send("Datos guardados"))
    .catch(err => res.status(500).send("Error al guardar los datos"));
});

// ================= SERVIR EL ARCHIVO HTML =================
app.use(express.static(path.join(__dirname, 'public')));

// ================= INICIAR EL SERVIDOR =================
app.listen(PORT, () => {
  console.log(`Backend IoT Arroz activo en el puerto ${PORT}`);
});
