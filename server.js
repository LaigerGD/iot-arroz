const express = require('express');
const app = express();
const port = process.env.PORT || 1000;
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { google } = require('googleapis');

// Datos de Google Sheets
const SPREADSHEET_ID = '19TOTCF0SKeN5oSAtdVnAwbbrjXwyaGUV8Y-gBYR8W-Y';  // Reemplaza con tu ID de hoja
const SHEET_ID = 'Sheet1'; // Nombre de la hoja donde guardas los datos

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta para obtener los datos y mostrarlos en el front-end
app.get('/api/data', async (req, res) => {
    try {
        // Simulamos datos del ESP32
        const data = {
            humedad: 75, // Simulado
            temp_suelo: 28.5, // Simulado
            temp_ambiente: 26.2, // Simulado
            luz: 750, // Simulado
            ph: 6.4 // Simulado
        };
        
        // Llamamos a la función para guardar los datos en Google Sheets
        await saveToSheet(data);

        res.json(data); // Enviar los datos al frontend
    } catch (error) {
        console.error('Error al obtener los datos:', error);
        res.status(500).send('Error en la solicitud');
    }
});

// Función para guardar los datos en Google Sheets
async function saveToSheet(data) {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

        // Cargar las credenciales de Google Sheets desde el archivo de entorno
        await doc.useServiceAccountAuth({
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        });

        await doc.loadInfo(); // Cargar la información de la hoja
        const sheet = doc.sheetsByTitle[SHEET_ID]; // Obtener la hoja

        // Añadir una nueva fila a la hoja con los datos
        await sheet.addRow({
            Fecha: new Date().toLocaleString(),
            Humedad: data.humedad,
            Temp_Suelo: data.temp_suelo,
            Temp_Ambiente: data.temp_ambiente,
            Luz: data.luz,
            pH: data.ph
        });
    } catch (error) {
        console.error('Error al guardar datos en Google Sheets:', error);
    }
}

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
