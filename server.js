// Importar las dependencias necesarias
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cors = require('cors');

// Crear la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Configurar CORS para permitir solicitudes desde cualquier origen
app.use(cors());

// Middleware para procesar el cuerpo de las solicitudes como JSON
app.use(bodyParser.json());

// Almacén en memoria para los últimos datos del ESP32
let esp32Data = {
  humedad: 0,
  temp_suelo: 0,
  temp_ambiente: 0,
  luz: 0,
  ph: 0
};

// ID de la hoja de cálculo de Google Sheets
const SPREADSHEET_ID = '19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y';

// Cargar las credenciales desde la variable de entorno
const credentialsEnv = process.env.GOOGLE_CREDENTIALS;

if (!credentialsEnv) {
  console.error("❌ La variable de entorno 'GOOGLE_CREDENTIALS' no está configurada correctamente.");
  process.exit(1); // Detener la ejecución si no está configurada la variable
}

let credentials;
try {
  credentials = JSON.parse(credentialsEnv); // Intentamos parsear las credenciales
} catch (error) {
  console.error("❌ Error al parsear las credenciales de Google Sheets: ", error);
  process.exit(1); // Detener la ejecución si ocurre un error al parsear
}

// Inicializar Google Spreadsheet
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

// Conectar a Google Sheets
async function connectToGoogleSheets() {
  try {
    await doc.useServiceAccountAuth(credentials); // Autenticarse con Google Sheets
    await doc.loadInfo(); // Cargar la información de la hoja de cálculo
    console.log('Conexión exitosa con Google Sheets');
  } catch (error) {
    console.error('Error al conectar con Google Sheets:', error);
    throw new Error('No se pudo conectar a Google Sheets');
  }
}

// Endpoint para recibir datos del ESP32 y guardarlos en Google Sheets
app.post('/api/data', async (req, res) => {
  const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

  // Verificar que los datos sean válidos
  if (isNaN(humedad) || isNaN(temp_suelo) || isNaN(temp_ambiente) || isNaN(luz) || isNaN(ph)) {
    return res.status(400).send('Datos inválidos');
  }

  // Almacenar los datos en la memoria
  esp32Data = { humedad, temp_suelo, temp_ambiente, luz, ph };

  // Guardar los datos en la hoja de Google Sheets
  try {
    const sheet = doc.sheetsByIndex[0]; // Acceder a la primera hoja
    await sheet.addRow({
      Fecha: new Date().toLocaleString(), // Registrar la fecha y hora
      Humedad: humedad,
      Temp_Suelo: temp_suelo,
      Temp_Ambiente: temp_ambiente,
      Luz: luz,
      pH: ph,
    });

    console.log(`Datos guardados en Google Sheets: ${JSON.stringify(req.body)}`);
    res.status(200).send('Datos recibidos y guardados en Google Sheets');
  } catch (error) {
    console.error('Error al guardar los datos:', error);
    res.status(500).send('Error al guardar los datos');
  }
});

// Endpoint para obtener los datos desde la memoria (y mostrar los datos en la página web)
app.get('/api/data', (req, res) => {
  res.status(200).json(esp32Data); // Enviar los datos más recientes del ESP32
});

// Iniciar el servidor y conectar a Google Sheets
app.listen(port, async () => {
  try {
    await connectToGoogleSheets();
    console.log(`Servidor escuchando en http://localhost:${port}`);
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
  }
});
