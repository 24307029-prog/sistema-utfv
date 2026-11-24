const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/utfv_control_escolar';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB conectado con éxito'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

app.use('/api/alumnos', require('./routes/alumnos'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});