const express = require('express');
const bodyParser = require('body-parser');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS
app.use(cors());

// Middleware para parsear JSON
app.use(bodyParser.json());

// Conectar a Google Sheets usando las credenciales de la variable de entorno
const doc = new GoogleSpreadsheet('19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y');

// Conectar a Google Sheets
async function accessSpreadsheet() {
  await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT));
  await doc.loadInfo(); // Carga la información del documento
  console.log('Hoja cargada correctamente!');
}

accessSpreadsheet();

// Ruta para recibir datos desde el ESP32
app.post('/api/data', async (req, res) => {
  try {
    const { humedad, temp_suelo, temp_ambiente, luz, ph } = req.body;

    // Abrir la hoja y acceder a la hoja de trabajo
    const sheet = doc.sheetsByIndex[0]; // Suponiendo que estamos usando la primera hoja
    await sheet.addRow({
      Fecha: new Date().toLocaleString(),
      Humedad: humedad,
      Temp_Suelo: temp_suelo,
      Temp_Ambiente: temp_ambiente,
      Luz: luz,
      pH: ph,
    });

    console.log('Datos guardados en Google Sheets:', req.body);
    res.status(200).send('Datos guardados correctamente');
  } catch (error) {
    console.error('Error al guardar los datos:', error);
    res.status(500).send('Error al guardar los datos');
  }
});

// Ruta para enviar los datos actuales al frontend
app.get('/api/data', async (req, res) => {
  try {
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    // Obtener los últimos datos de la hoja
    const lastRow = rows[rows.length - 1];

    res.json({
      humedad: lastRow.Humedad,
      temp_suelo: lastRow.Temp_Suelo,
      temp_ambiente: lastRow.Temp_Ambiente,
      luz: lastRow.Luz,
      ph: lastRow.pH,
    });
  } catch (error) {
    console.error('Error al obtener los datos:', error);
    res.status(500).send('Error al obtener los datos');
  }
});

// Servir los archivos estáticos (HTML, CSS, JS)
app.use(express.static('public'));

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
