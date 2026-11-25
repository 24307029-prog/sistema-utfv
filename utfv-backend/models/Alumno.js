const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  estatus: { type: String, default: 'Alumno_activo' },
  rol: { type: String, default: 'ALUMNO' },
  password: { type: String },
  nombre: { type: String, required: true },
  apellidos: { type: String, default: '' },
  edad: { type: Number, default: 18 },
  genero: { type: String, default: 'No especificado' },
  telefono: { type: String, default: '' },
  email: { type: String, default: '' },
  direccion: {
    calle: { type: String, default: '' },
    colonia: { type: String, default: '' },
    municipio: { type: String, default: '' },
    codigo_postal: { type: String, default: '' }
  },
  carrera: {
    clave: { type: String, default: 'TI' },
    nombre: { type: String, default: 'Tecnologías de la Información' }
  },
  grupo: { type: String, default: 'SIN ASIGNAR' },
  academico: {
    grupo: { type: String, default: '' },
    cuatrimestre: { type: String, default: 'séptimo' },
    periodo: { type: String, default: '2026-3' },
    tutor_grupo: { type: String, default: 'Arturo Hernández Jimenez' }
  },
  historial_academico: { type: Array, default: [] },
  tramites: { type: Array, default: [] }
}, { strict: false, timestamps: true });

module.exports = mongoose.model('Alumno', alumnoSchema, 'estudiantes');
