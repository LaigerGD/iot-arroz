// Importar las dependencias necesarias
const express = require('express');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cors = require('cors');

// Configuración del servidor Express
const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS para permitir solicitudes desde cualquier origen
app.use(cors());

// Middleware para procesar el cuerpo de las solicitudes como JSON
app.use(bodyParser.json());

// ID de la hoja de cálculo de Google Sheets
const SPREADSHEET_ID = '19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y';

// Cargar las credenciales desde la variable de entorno
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Inicializar Google Spreadsheet
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

// Conectar a Google Sheets
async function connectToGoogleSheets() {
  try {
    // Autenticarse usando las credenciales de la variable de entorno
    await doc.useServiceAccountAuth(credentials); 
    await doc.loadInfo(); // Cargar la información de la hoja de cálculo
    console.log('Conexión exitosa con Google Sheets');
  } catch (error) {
    console.error('Error al conectar con Google Sheets:', error);
    throw new Error('No se pudo conectar a Google Sheets');
  }
}

// Endpoint para recibir datos desde el ESP32
app.post('/api/data', async (req, res) => {
  try {
    // Obtener los datos del cuerpo de la solicitud
    const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

    // Verificar si los datos son válidos
    if (isNaN(humedad) || isNaN(temp_suelo) || isNaN(temp_ambiente) || isNaN(luz) || isNaN(ph)) {
      return res.status(400).send('Datos inválidos');
    }

    // Guardar los datos en la hoja de Google Sheets
    const sheet = doc.sheetsByIndex[0]; // Asegúrate de que estás usando la hoja correcta
    await sheet.addRow({
      Fecha: new Date().toLocaleString(), // Registrar la fecha y hora
      Humedad: humedad,
      Temp_Suelo: temp_suelo,
      Temp_Ambiente: temp_ambiente,
      Luz: luz,
      pH: ph,
    });

    console.log(`Datos guardados en Google Sheets: ${JSON.stringify(req.body)}`);

    // Responder que los datos fueron guardados correctamente
    res.status(200).send('Datos guardados en Google Sheets');
  } catch (error) {
    console.error('Error al guardar los datos:', error);
    res.status(500).send('Error al guardar los datos');
  }
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
