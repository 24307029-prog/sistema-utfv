const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');

// Función para normalizar cualquiera de los 130 documentos de Atlas al formato del portal
function normalizarDocumento(doc) {
  const obj = doc.toObject ? doc.toObject() : { ...doc };

  if (!obj.rol) {
    if (obj._id === 'admin') obj.rol = 'ADMIN';
    else if ((obj.estatus || '').toLowerCase() === 'aspirante') obj.rol = 'ASPIRANTE';
    else if ((obj.estatus || '').toLowerCase() === 'docente_activo') obj.rol = 'PROFESOR';
    else obj.rol = 'ALUMNO';
  }

  if (!obj.password) {
    obj.password = String(obj._id);
  }

  const infoAcad = obj.academico || obj['académico'] || {};
  obj.academico = {
    grupo: infoAcad.grupo || obj.grupo || 'SIN ASIGNAR',
    cuatrimestre: infoAcad.cuatrimestre || 'séptimo',
    periodo: infoAcad.periodo || '2026-3',
    tutor_grupo: infoAcad.tutor_grupo || 'Arturo Hernández Jimenez'
  };
  if (!obj.grupo) obj.grupo = obj.academico.grupo;

  const hist = Array.isArray(obj.historial_academico) ? obj.historial_academico : [];
  if (hist.length > 0 && !hist[0].materias && hist[0].clave_materia) {
    const materiasNorm = hist.map(m => {
      const p1 = m.parciales?.p1 ?? null;
      const p2 = m.parciales?.p2 ?? null;
      const p3 = m.parciales?.p3 ?? null;
      let fin = m.parciales?.final ?? null;
      if (fin === null && (p1 !== null || p2 !== null || p3 !== null)) {
        fin = Number((((Number(p1) || 0) + (Number(p2) || 0) + (Number(p3) || 0)) / 3).toFixed(1));
      }
      return {
        clave_materia: m.clave_materia,
        nombre_materia: m.nombre_materia,
        profesor: m.profesor || 'M. EN D. ARTURO HERNANDEZ JIMENEZ',
        parciales: { p1, p2, p3, final: fin },
        evaluada: m.evaluada !== undefined ? m.evaluada : true
      };
    });

    obj.historial_academico = [{
      periodo: '2026-3',
      cuatrimestre: obj.academico.cuatrimestre || 'séptimo',
      materias: materiasNorm
    }];
  } else {
    obj.historial_academico = hist.map(b => ({
      periodo: b.periodo || '2026-3',
      cuatrimestre: b.cuatrimestre || 'séptimo',
      materias: (b.materias || []).map(m => {
        const p1 = m.parciales?.p1 ?? null;
        const p2 = m.parciales?.p2 ?? null;
        const p3 = m.parciales?.p3 ?? null;
        let fin = m.parciales?.final ?? null;
        if (fin === null && (p1 !== null || p2 !== null || p3 !== null)) {
          fin = Number((((Number(p1) || 0) + (Number(p2) || 0) + (Number(p3) || 0)) / 3).toFixed(1));
        }
        return {
          clave_materia: m.clave_materia,
          nombre_materia: m.nombre_materia,
          profesor: m.profesor || 'POR ASIGNAR',
          parciales: { p1, p2, p3, final: fin },
          evaluada: m.evaluada !== undefined ? m.evaluada : false
        };
      })
    }));
  }

  if (!Array.isArray(obj.tramites)) obj.tramites = [];
  if (!Array.isArray(obj.extraordinarios)) obj.extraordinarios = [];
  return obj;
}

// 1. Login Universal
router.post('/login', async (req, res) => {
  try {
    const matricula = (req.body.matricula || '').trim();
    const password = (req.body.password || '').trim();

    if (matricula === 'admin' && password === 'admin') {
      return res.json({
        _id: 'admin',
        estatus: 'Alumno_activo',
        rol: 'ADMIN',
        nombre: 'Servicios Escolares',
        apellidos: 'UTFV Admin',
        email: 'controlescolar@utfv.edu.mx'
      });
    }

    const doc = await Alumno.findById(matricula);
    if (!doc) {
      return res.status(401).json({ mensaje: 'Matrícula/Folio no encontrado en MongoDB Atlas' });
    }

    const usuario = normalizarDocumento(doc);
    if (password !== usuario.password && password !== String(usuario._id)) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en el servidor', error });
  }
});

// 2. Obtener TODOS los registros de Atlas normalizados
router.get('/', async (req, res) => {
  try {
    const docs = await Alumno.find({ _id: { $ne: 'admin' } }).sort({ _id: 1 });
    const normalizados = docs.map(normalizarDocumento);
    res.json(normalizados);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener registros de Atlas', error });
  }
});

// 3. Sincronizar Atlas SIN BORRAR los 130 registros
router.post('/sincronizar-atlas', async (req, res) => {
  try {
    const docs = await Alumno.find({ _id: { $ne: 'admin' } });
    const profesoresDetectados = new Set();

    for (const doc of docs) {
      const norm = normalizarDocumento(doc);
      await Alumno.updateOne(
        { _id: doc._id },
        {
          $set: {
            rol: norm.rol,
            password: norm.password,
            academico: norm.academico,
            grupo: norm.grupo,
            historial_academico: norm.historial_academico,
            extraordinarios: norm.extraordinarios
          }
        }
      );

      norm.historial_academico.forEach(h => {
        h.materias?.forEach(m => {
          if (m.profesor && m.profesor !== 'POR ASIGNAR') {
            profesoresDetectados.add(m.profesor.trim().toUpperCase());
          }
        });
      });
    }

    let idxProf = 1;
    for (const nombreProf of profesoresDetectados) {
      const yaExiste = await Alumno.findOne({ nombre: nombreProf, rol: 'PROFESOR' });
      if (!yaExiste) {
        let claveProf = `PROF-${String(idxProf).padStart(2, '0')}`;
        while (await Alumno.findById(claveProf)) {
          idxProf++;
          claveProf = `PROF-${String(idxProf).padStart(2, '0')}`;
        }
        await Alumno.create({
          _id: claveProf,
          estatus: 'Docente_activo',
          rol: 'PROFESOR',
          password: claveProf,
          nombre: nombreProf,
          apellidos: '',
          email: `${claveProf.toLowerCase()}@docentes.utfv.edu.mx`,
          carrera: { clave: 'UTFV', nombre: 'Planta Docente UTFV' },
          grupo: 'DOCENTES',
          historial_academico: []
        });
        idxProf++;
      }
    }

    res.json({
      mensaje: `Sincronización completa: ${docs.length} registros actualizados y ${profesoresDetectados.size} profesores vinculados sin borrar ningún dato.`
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al sincronizar Atlas', error });
  }
});

// 4. Registro público de ASPIRANTES
router.post('/registro-aspirante', async (req, res) => {
  try {
    const { nombre, apellidos, edad, genero, telefono, email, direccion, carrera } = req.body;
    const count = await Alumno.countDocuments({ estatus: 'Aspirante' });
    const folioAspirante = `ASP-26${String(count + 1).padStart(2, '0')}`;

    const nuevoAspirante = new Alumno({
      _id: folioAspirante,
      estatus: 'Aspirante',
      rol: 'ASPIRANTE',
      password: folioAspirante,
      nombre,
      apellidos,
      edad: Number(edad) || 18,
      genero,
      telefono,
      email,
      direccion,
      carrera,
      grupo: 'ASPIRANTE-2026',
      academico: {
        grupo: 'ASPIRANTE-2026',
        cuatrimestre: 'propedéutico',
        periodo: '2026-3',
        tutor_grupo: 'Comité de Admisiones UTFV'
      },
      historial_academico: [],
      tramites: [{
        folio: `FICHA-${Math.floor(10000 + Math.random() * 90000)}`,
        concepto: 'Ficha de Examen de Admisión UTFV',
        monto: 450,
        referencia: `8800${folioAspirante.replace('-', '')}99`,
        estatusPago: 'PAGADO',
        fecha: new Date().toLocaleDateString('es-MX')
      }]
    });

    await nuevoAspirante.save();
    res.status(201).json(nuevoAspirante);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al registrar aspirante', error });
  }
});

// 5. Convertir ASPIRANTE -> ALUMNO INSCRITO
router.post('/inscribir-aspirante/:folio', async (req, res) => {
  try {
    const { folio } = req.params;
    const { nuevaMatricula, grupo, tutor } = req.body;

    const aspirante = await Alumno.findById(folio);
    if (!aspirante) return res.status(404).json({ mensaje: 'Aspirante no encontrado' });

    const matriculaFinal = nuevaMatricula.trim();
    const existeMatricula = await Alumno.findById(matriculaFinal);
    if (existeMatricula) {
      return res.status(400).json({ mensaje: `La matrícula ${matriculaFinal} ya está asignada.` });
    }

    const materiasPrimerCuatri = aspirante.carrera.clave === 'TI'
      ? [
          { clave_materia: 'ING-101', nombre_materia: 'INGLES I', profesor: 'LIC. MARIA LOPEZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false },
          { clave_materia: 'MAT-101', nombre_materia: 'ÁLGEBRA LINEAL', profesor: 'LIC. CARLOS PEREZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false },
          { clave_materia: 'PRG-101', nombre_materia: 'FUNDAMENTOS DE PROGRAMACIÓN', profesor: 'ING. ANA MARTINEZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false },
          { clave_materia: 'RED-101', nombre_materia: 'FUNDAMENTOS DE REDES', profesor: 'ING. ROBERTO GOMEZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false }
        ]
      : [
          { clave_materia: 'ING-101', nombre_materia: 'INGLES I', profesor: 'LIC. MARIA LOPEZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false },
          { clave_materia: 'ADM-101', nombre_materia: 'FUNDAMENTOS DE ADMINISTRACIÓN', profesor: 'LIC. JORGE RAMIREZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false },
          { clave_materia: 'MKT-101', nombre_materia: 'FUNDAMENTOS DE MERCADOTECNIA', profesor: 'MTRA. LAURA SANCHEZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false },
          { clave_materia: 'CON-101', nombre_materia: 'CONTABILIDAD BÁSICA', profesor: 'C.P. LUIS RAMIREZ', parciales: { p1: null, p2: null, p3: null, final: null }, evaluada: false }
        ];

    const nombreNormalizado = `${aspirante.nombre.toLowerCase().replace(/\s+/g, '.')}.${aspirante.apellidos.split(' ')[0].toLowerCase()}@alumnos.utfv.edu.mx`;

    const alumnoInscrito = new Alumno({
      _id: matriculaFinal,
      estatus: 'Alumno_activo',
      rol: 'ALUMNO',
      password: matriculaFinal,
      nombre: aspirante.nombre,
      apellidos: aspirante.apellidos,
      edad: aspirante.edad,
      genero: aspirante.genero,
      telefono: aspirante.telefono,
      email: nombreNormalizado,
      direccion: aspirante.direccion,
      carrera: aspirante.carrera,
      grupo: grupo || `${aspirante.carrera.clave}-101`,
      academico: {
        grupo: grupo || `${aspirante.carrera.clave}-101`,
        cuatrimestre: 'primero',
        periodo: '2026-3',
        tutor_grupo: tutor || 'Arturo Hernández Jimenez'
      },
      historial_academico: [{
        periodo: '2026-3',
        cuatrimestre: 'primero',
        materias: materiasPrimerCuatri
      }],
      tramites: aspirante.tramites || [],
      extraordinarios: []
    });

    await alumnoInscrito.save();
    await Alumno.findByIdAndDelete(folio);

    res.status(201).json(alumnoInscrito);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al inscribir aspirante', error });
  }
});

// 6. Crear Alumno o Profesor desde Admin
router.post('/', async (req, res) => {
  try {
    const {
      matricula, rol, nombre, apellidos, edad, genero, telefono, email,
      direccion, carrera, grupo, cuatrimestre, periodo, tutor_grupo
    } = req.body;

    const idLimpio = matricula.trim();
    const esDocente = rol === 'PROFESOR';

    const emailAuto = email || (esDocente
      ? `${nombre.toLowerCase().replace(/[^a-z0-9]/g, '.')}@docentes.utfv.edu.mx`
      : `${nombre.toLowerCase().replace(/\s+/g, '.')}.${apellidos.split(' ')[0].toLowerCase()}@alumnos.utfv.edu.mx`);

    const nuevoRegistro = new Alumno({
      _id: idLimpio,
      estatus: esDocente ? 'Docente_activo' : 'Alumno_activo',
      rol: esDocente ? 'PROFESOR' : 'ALUMNO',
      password: idLimpio,
      nombre,
      apellidos: apellidos || '',
      edad: Number(edad) || (esDocente ? 35 : 19),
      genero: genero || 'No especificado',
      telefono: telefono || '',
      email: emailAuto,
      direccion: direccion || {},
      carrera: carrera || { clave: 'TI', nombre: 'Tecnologías de la Información' },
      grupo: esDocente ? 'DOCENTES' : grupo,
      academico: {
        grupo: esDocente ? 'DOCENTES' : grupo,
        cuatrimestre: cuatrimestre || 'primero',
        periodo: periodo || '2026-3',
        tutor_grupo: tutor_grupo || 'Arturo Hernández Jimenez'
      },
      historial_academico: esDocente ? [] : [{
        periodo: periodo || '2026-3',
        cuatrimestre: cuatrimestre || 'primero',
        materias: []
      }],
      tramites: [],
      extraordinarios: []
    });

    await nuevoRegistro.save();
    res.status(201).json(nuevoRegistro);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear registro', error });
  }
});

// 7. Guardar boleta completa de un alumno
router.put('/:id/boleta/:periodo', async (req, res) => {
  try {
    const { id, periodo } = req.params;
    const { materias } = req.body;

    const doc = await Alumno.findById(id);
    if (!doc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });

    const norm = normalizarDocumento(doc);
    const idx = norm.historial_academico.findIndex(h => h.periodo === periodo);
    if (idx !== -1) {
      norm.historial_academico[idx].materias = materias;
    } else {
      norm.historial_academico.push({
        periodo,
        cuatrimestre: norm.academico?.cuatrimestre || 'séptimo',
        materias
      });
    }

    await Alumno.updateOne({ _id: id }, { $set: { historial_academico: norm.historial_academico } });
    res.json(norm);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar calificaciones', error });
  }
});

// 8. Guardar acta masiva desde el PORTAL DEL PROFESOR
router.put('/profesor/guardar-acta', async (req, res) => {
  try {
    const { periodo, clave_materia, calificaciones } = req.body;

    for (const item of calificaciones) {
      const doc = await Alumno.findById(item.alumnoId);
      if (!doc) continue;

      const norm = normalizarDocumento(doc);
      const boleta = norm.historial_academico.find(h => h.periodo === periodo);
      if (!boleta) continue;

      const mat = boleta.materias.find(m => m.clave_materia === clave_materia);
      if (mat) {
        mat.parciales.p1 = item.p1;
        mat.parciales.p2 = item.p2;
        mat.parciales.p3 = item.p3;
        mat.parciales.final = item.final;
        await Alumno.updateOne({ _id: item.alumnoId }, { $set: { historial_academico: norm.historial_academico } });
      }
    }

    res.json({ mensaje: 'Acta guardada en MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar acta', error });
  }
});

// 9. SOLICITAR EXAMEN EXTRAORDINARIO (Genera folio de examen + referencia de pago $350)
router.post('/:id/extraordinarios', async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo, clave_materia, nombre_materia, profesor, calificacion_ordinaria, fecha_aplicacion } = req.body;

    const doc = await Alumno.findById(id);
    if (!doc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });

    const norm = normalizarDocumento(doc);

    // Evitar duplicar solicitud pendiente para la misma materia
    const yaSolicitado = norm.extraordinarios.some(
      ex => ex.clave_materia === clave_materia && ex.periodo === periodo && ex.estatus !== 'REPROBADO_EXT'
    );
    if (yaSolicitado) {
      return res.status(400).json({ mensaje: 'Ya existe una solicitud de extraordinario activa para esta materia.' });
    }

    const folioExt = `EXT-${Math.floor(100000 + Math.random() * 900000)}`;
    const folioPago = `UTFV-${Math.floor(100000 + Math.random() * 900000)}`;

    norm.extraordinarios.unshift({
      folio: folioExt,
      folio_pago: folioPago,
      periodo: periodo || '2026-3',
      clave_materia,
      nombre_materia,
      profesor: profesor || 'POR ASIGNAR',
      calificacion_ordinaria: calificacion_ordinaria ?? null,
      calificacion_extraordinaria: null,
      fecha_aplicacion: fecha_aplicacion || 'Próximo viernes · 09:00 hrs',
      estatus: 'PENDIENTE_PAGO' // PENDIENTE_PAGO -> AUTORIZADO -> ACREDITADO / NO_ACREDITADO
    });

    // Generar línea de captura automática por $350 MXN
    norm.tramites.unshift({
      folio: folioPago,
      concepto: `Examen Extraordinario (${clave_materia} - ${nombre_materia})`,
      monto: 350,
      referencia: `7700${norm._id}${Math.floor(1000 + Math.random() * 9000)}`,
      estatusPago: 'PENDIENTE',
      fecha: new Date().toLocaleDateString('es-MX')
    });

    await Alumno.updateOne(
      { _id: id },
      { $set: { extraordinarios: norm.extraordinarios, tramites: norm.tramites } }
    );

    res.json(norm);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al solicitar examen extraordinario', error });
  }
});

// 10. CAPTURAR CALIFICACIÓN DE EXTRAORDINARIO (Si aprueba >= 8.0, actualiza la boleta automáticamente)
router.put('/:id/extraordinarios/:folio/calificar', async (req, res) => {
  try {
    const { id, folio } = req.params;
    const { calificacion } = req.body;

    const notaNum = Number(parseFloat(calificacion).toFixed(1));
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
      return res.status(400).json({ mensaje: 'La calificación debe estar entre 0 y 10.' });
    }

    const doc = await Alumno.findById(id);
    if (!doc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });

    const norm = normalizarDocumento(doc);
    const ext = norm.extraordinarios.find(e => e.folio === folio);
    if (!ext) return res.status(404).json({ mensaje: 'Solicitud de extraordinario no encontrada' });

    ext.calificacion_extraordinaria = notaNum;
    ext.estatus = notaNum >= 8.0 ? 'ACREDITADO' : 'NO_ACREDITADO';

    // Si aprobó el extraordinario, actualizar la calificación final en su boleta histórica
    if (notaNum >= 8.0) {
      const boleta = norm.historial_academico.find(b => b.periodo === ext.periodo);
      if (boleta) {
        const mat = boleta.materias.find(m => m.clave_materia === ext.clave_materia);
        if (mat) {
          mat.parciales.final = notaNum;
        }
      }
    }

    await Alumno.updateOne(
      { _id: id },
      {
        $set: {
          extraordinarios: norm.extraordinarios,
          historial_academico: norm.historial_academico
        }
      }
    );

    res.json(norm);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calificar examen extraordinario', error });
  }
});

// 11. Completar Evaluación Docente
router.put('/:id/evaluar-docentes/:periodo', async (req, res) => {
  try {
    const { id, periodo } = req.params;
    const doc = await Alumno.findById(id);
    if (!doc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });

    const norm = normalizarDocumento(doc);
    const boleta = norm.historial_academico.find(b => b.periodo === periodo);
    if (boleta) {
      boleta.materias.forEach(m => { m.evaluada = true; });
    }

    await Alumno.updateOne({ _id: id }, { $set: { historial_academico: norm.historial_academico } });
    res.json(norm);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar evaluación', error });
  }
});

// 12. Generar trámite / línea de captura
router.post('/:id/tramites', async (req, res) => {
  try {
    const { id } = req.params;
    const { concepto, monto } = req.body;
    const doc = await Alumno.findById(id);
    if (!doc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });

    const norm = normalizarDocumento(doc);
    norm.tramites.unshift({
      folio: `UTFV-${Math.floor(100000 + Math.random() * 900000)}`,
      concepto,
      monto,
      referencia: `9900${norm._id}${Math.floor(1000 + Math.random() * 9000)}`,
      estatusPago: 'PENDIENTE',
      fecha: new Date().toLocaleDateString('es-MX')
    });

    const nuevoEstatus = concepto.includes('Reinscripción') ? 'Pendiente_pago' : norm.estatus;
    await Alumno.updateOne({ _id: id }, { $set: { tramites: norm.tramites, estatus: nuevoEstatus } });
    norm.estatus = nuevoEstatus;
    res.json(norm);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar trámite', error });
  }
});

// 13. Pagar referencia bancaria (También autoriza automáticamente el Examen Extraordinario vinculado)
router.put('/:id/tramites/:folio/pagar', async (req, res) => {
  try {
    const { id, folio } = req.params;
    const doc = await Alumno.findById(id);
    if (!doc) return res.status(404).json({ mensaje: 'Alumno no encontrado' });

    const norm = normalizarDocumento(doc);
    const tramite = norm.tramites.find(t => t.folio === folio);
    if (tramite) {
      tramite.estatusPago = 'PAGADO';
      if (norm.estatus === 'Pendiente_pago') norm.estatus = 'Alumno_activo';

      // Si el pago corresponde a un Examen Extraordinario, autorizarlo automáticamente
      const extVinculado = norm.extraordinarios.find(e => e.folio_pago === folio);
      if (extVinculado && extVinculado.estatus === 'PENDIENTE_PAGO') {
        extVinculado.estatus = 'AUTORIZADO';
      }
    }

    await Alumno.updateOne(
      { _id: id },
      { $set: { tramites: norm.tramites, estatus: norm.estatus, extraordinarios: norm.extraordinarios } }
    );
    res.json(norm);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar pago', error });
  }
});

module.exports = router;