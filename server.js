const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const bodyParser = require('body-parser');

// Configuración de Express
const app = express();
app.use(bodyParser.json()); // Para analizar JSON en las solicitudes

// ID de tu Google Sheet (asegúrate de que este sea correcto)
const SHEET_ID = '19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y';

// Leer las credenciales desde la variable de entorno
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// Inicializar la hoja de Google Spreadsheet
const doc = new GoogleSpreadsheet(SHEET_ID);

// Conectar con Google Sheets usando las credenciales
async function accessSheet() {
  try {
    console.log("Accediendo a la hoja de Google...");
    await doc.useServiceAccountAuth(credentials); // Usar las credenciales del entorno
    await doc.loadInfo(); // Cargar la información de la hoja
    console.log("¡Hoja de Google accedida correctamente!");
  } catch (error) {
    console.error("Error al acceder a la hoja de Google:", error);
  }
}

// Accede a la hoja cuando el servidor inicie
accessSheet();

// Ruta para visualizar los datos en la página
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Ruta para recibir los datos del ESP32 y guardarlos en Google Sheets
app.post('/api/data', async (req, res) => {
  const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

  try {
    // Agregar los datos a Google Sheets
    const sheet = doc.sheetsByIndex[0]; // Obtener la primera hoja de trabajo
    await sheet.addRow({
      Fecha: new Date().toLocaleString(), // Fecha actual
      Humedad: humedad,
      'Temp Suelo (°C)': temp_suelo,
      'Temp Ambiente (°C)': temp_ambiente,
      Luz: luz,
      pH: ph,
    });

    // Enviar respuesta a ESP32
    res.status(200).send('Datos guardados en Google Sheets');
    console.log(`Datos guardados: ${req.body}`);
  } catch (error) {
    console.error('Error al guardar los datos:', error);
    res.status(500).send('Error al guardar los datos');
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
