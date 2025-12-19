const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const credentials = require('./credentials.json'); // Archivo de credenciales de Google API

// Configuración de Express
const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

// Ruta para recibir los datos de los sensores
app.post('/api/data', async (req, res) => {
  const data = req.body;

  // Verifica que los datos contengan los parámetros necesarios
  if (!data.humedad || !data.temp_suelo || !data.temp_ambiente || !data.luz || !data.ph) {
    return res.status(400).send('Faltan datos');
  }

  try {
    // Autenticación con Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: './credentials.json', // Asegúrate de tener el archivo de credenciales de Google
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // ID de la hoja de Google Sheets (obténlo desde la URL de la hoja de cálculo)
    const spreadsheetId = '19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y'; // Tu ID de hoja de cálculo

    // Datos que se van a agregar a la hoja
    const values = [
      [new Date().toISOString(), data.humedad, data.temp_suelo, data.temp_ambiente, data.luz, data.ph]
    ];

    // Llama a la API de Google Sheets para agregar los datos
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:F', // Asegúrate de que el rango se ajuste a tus columnas
      valueInputOption: 'RAW',
      resource: {
        values,
      },
    });

    res.status(200).send('Datos guardados correctamente');
  } catch (error) {
    console.error('Error al guardar los datos:', error);
    res.status(500).send('Error al guardar los datos');
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
