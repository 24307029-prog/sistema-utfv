import React, { useState, useEffect, useMemo } from 'react';
import clienteAxios from './api/clienteAxios';
import './App.css';

const CARRERAS_UTFV = [
  { clave: 'TI', nombre: 'Tecnologías de la Información' },
  { clave: 'DN', nombre: 'Desarrollo de Negocios' },
  { clave: 'IRD', nombre: 'Infraestructura de Redes Digitales' },
  { clave: 'DSM', nombre: 'Desarrollo de Software Multiplataforma' },
  { clave: 'MEC', nombre: 'Mecatrónica' }
];

const LogoUTFV = ({ compact = false }) => (
  <svg
    viewBox="0 0 360 155"
    style={{ width: compact ? '105px' : '230px', height: 'auto', display: 'block', margin: compact ? '0' : '0 auto' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="58" cy="18" r="7.5" fill="#C6924E" />
    <circle cx="80" cy="18" r="7.5" fill="#C6924E" />
    <circle cx="58" cy="39" r="7.5" fill="#C6924E" />
    <path
      d="M50 56 H76 V76 C76 89 85 97 97 97 C109 97 118 89 118 76 V14 H144 V77 C144 104 124 121 97 121 C70 121 50 104 50 77 Z"
      fill="#C6924E"
    />
    <path
      d="M153 14 H238 V37 H209 V120 H205 C190 120 183 111 183 96 V37 H153 Z"
      fill="#6A2C34"
    />
    <text x="216" y="106" fill="#9C5338" fontFamily="Arial Black, Segoe UI, sans-serif" fontWeight="900" fontSize="54">
      FV
    </text>
    <line x1="48" y1="127" x2="312" y2="127" stroke="#C6924E" strokeWidth="1.5" />
    <text x="180" y="140" textAnchor="middle" fill="#686667" fontFamily="Segoe UI, Arial, sans-serif" fontWeight="700" fontSize="11.2" letterSpacing="1.6">
      UNIVERSIDAD TECNOLÓGICA
    </text>
    <text x="180" y="153" textAnchor="middle" fill="#9E1B3B" fontFamily="Arial Black, Segoe UI, sans-serif" fontWeight="900" fontSize="16.5" letterSpacing="1.2">
      FIDEL VELÁZQUEZ
    </text>
  </svg>
);

function App() {
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [tabAuth, setTabAuth] = useState('login');
  const [vistaActiva, setVistaActiva] = useState('boleta');

  const [loginMatricula, setLoginMatricula] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [grupoDetalleSeleccionado, setGrupoDetalleSeleccionado] = useState(null);

  const [notasExtInput, setNotasExtInput] = useState({});
  const [formExtManual, setFormExtManual] = useState({
    clave_materia: '',
    nombre_materia: '',
    profesor: '',
    fecha_aplicacion: 'Viernes · 09:00 hrs · Edificio B'
  });

  const [formAspirante, setFormAspirante] = useState({
    nombre: '',
    apellidos: '',
    edad: 18,
    genero: 'Femenino',
    telefono: '',
    email: '',
    calle: '',
    colonia: '',
    municipio: '',
    codigo_postal: '',
    carreraClave: 'TI'
  });

  const [registros, setRegistros] = useState([]);
  const [alumnoSeleccionadoId, setAlumnoSeleccionadoId] = useState('');
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2026-3');
  const [materias, setMaterias] = useState([]);

  const [claveMateria, setClaveMateria] = useState('');
  const [nombreMateria, setNombreMateria] = useState('');
  const [profesorMateria, setProfesorMateria] = useState('');

  const [mostrarModalAlumno, setMostrarModalAlumno] = useState(false);
  const [nuevoAlumno, setNuevoAlumno] = useState({
    matricula: '',
    nombre: '',
    apellidos: '',
    edad: 19,
    genero: 'Masculino',
    telefono: '',
    calle: '',
    colonia: '',
    municipio: '',
    codigo_postal: '',
    carreraClave: 'TI',
    grupo: 'TI-101',
    cuatrimestre: 'primero',
    periodo: '2026-3',
    tutor_grupo: 'Arturo Hernández Jimenez'
  });

  const [mostrarModalProfesor, setMostrarModalProfesor] = useState(false);
  const [nuevoProfesor, setNuevoProfesor] = useState({
    claveEmpleado: '',
    nombreCompleto: '',
    telefono: '',
    carreraClave: 'TI'
  });

  const [aspiranteAInscribir, setAspiranteAInscribir] = useState(null);
  const [datosInscripcion, setDatosInscripcion] = useState({
    nuevaMatricula: '',
    grupo: 'TI-101',
    tutor: 'Arturo Hernández Jimenez'
  });

  const [materiaSeleccionadaProf, setMateriaSeleccionadaProf] = useState('');
  const [actaAlumnos, setActaAlumnos] = useState([]);
  const [respuestasEval, setRespuestasEval] = useState({});

  const esAdmin = usuarioActivo?.rol === 'ADMIN';
  const esProfesor = usuarioActivo?.rol === 'PROFESOR';
  const esAspirante = usuarioActivo?.estatus === 'Aspirante';

  const alumnosActivos = useMemo(() => registros.filter(r => r.rol === 'ALUMNO'), [registros]);
  const listaAspirantes = useMemo(() => registros.filter(r => r.estatus === 'Aspirante'), [registros]);
  const listaProfesores = useMemo(() => registros.filter(r => r.rol === 'PROFESOR'), [registros]);

  const gruposEstadisticas = useMemo(() => {
    const mapa = new Map();

    alumnosActivos.forEach(al => {
      const nombreGrupo = (al.academico?.grupo || al.grupo || 'SIN ASIGNAR').trim().toUpperCase();
      if (!mapa.has(nombreGrupo)) {
        mapa.set(nombreGrupo, {
          nombre: nombreGrupo,
          carrera: al.carrera?.nombre || 'Sin carrera',
          carreraClave: al.carrera?.clave || 'UTFV',
          cuatrimestre: al.academico?.cuatrimestre || 'séptimo',
          tutor: al.academico?.tutor_grupo || 'Arturo Hernández Jimenez',
          estudiantes: []
        });
      }

      const todasMat = al.historial_academico?.flatMap(b => b.materias || []) || [];
      const conNota = todasMat.filter(m => m.parciales?.final !== null && m.parciales?.final !== undefined);
      const promedioAl = conNota.length > 0
        ? Number((conNota.reduce((acc, m) => acc + Number(m.parciales.final), 0) / conNota.length).toFixed(2))
        : null;

      mapa.get(nombreGrupo).estudiantes.push({
        ...al,
        promedioIndividual: promedioAl,
        materiasReprobadas: conNota.filter(m => Number(m.parciales.final) < 8).length
      });
    });

    return Array.from(mapa.values())
      .map(g => {
        const evaluados = g.estudiantes.filter(e => e.promedioIndividual !== null);
        const promedioGrupo = evaluados.length > 0
          ? (evaluados.reduce((acc, e) => acc + e.promedioIndividual, 0) / evaluados.length).toFixed(2)
          : 'S/C';

        const aprobados = evaluados.filter(e => e.promedioIndividual >= 8 && e.materiasReprobadas === 0).length;
        const enRiesgo = evaluados.filter(e => e.promedioIndividual < 8 || e.materiasReprobadas > 0).length;
        const tasaAprobacion = evaluados.length > 0
          ? Math.round((aprobados / evaluados.length) * 100)
          : 0;

        return {
          ...g,
          totalEstudiantes: g.estudiantes.length,
          promedioGrupo,
          aprobados,
          enRiesgo,
          tasaAprobacion
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [alumnosActivos]);

  const grupoActualDetalle = useMemo(() => {
    if (!grupoDetalleSeleccionado) return null;
    return gruposEstadisticas.find(g => g.nombre === grupoDetalleSeleccionado) || null;
  }, [gruposEstadisticas, grupoDetalleSeleccionado]);

  const alumnosFiltrados = useMemo(() => {
    const q = busquedaAlumno.trim().toLowerCase();
    if (!q) return alumnosActivos;
    return alumnosActivos.filter(al =>
      String(al._id).toLowerCase().includes(q) ||
      `${al.nombre} ${al.apellidos}`.toLowerCase().includes(q) ||
      (al.grupo || '').toLowerCase().includes(q) ||
      (al.carrera?.clave || '').toLowerCase().includes(q)
    );
  }, [alumnosActivos, busquedaAlumno]);

  const obtenerRegistros = async () => {
    try {
      const { data } = await clienteAxios.get('/alumnos');
      setRegistros(data);
      const soloAlumnos = data.filter(r => r.rol === 'ALUMNO');
      if (soloAlumnos.length > 0 && !soloAlumnos.some(a => a._id === alumnoSeleccionadoId)) {
        setAlumnoSeleccionadoId(soloAlumnos[0]._id);
      }
    } catch (error) {
      console.error('Error cargando registros:', error);
    }
  };

  useEffect(() => {
    if (usuarioActivo) {
      if (esAdmin || esProfesor) {
        obtenerRegistros();
      } else {
        setRegistros([usuarioActivo]);
        setAlumnoSeleccionadoId(usuarioActivo._id);
      }
    }
  }, [usuarioActivo, esAdmin, esProfesor]);

  // ========================================================
  // LÓGICA DEL PORTAL DEL PROFESOR
  // ========================================================
  const nombreDocenteActual = `${usuarioActivo?.nombre || ''} ${usuarioActivo?.apellidos || ''}`.trim().toUpperCase();

  const materiasDelProfesor = useMemo(() => {
    if (!esProfesor) return [];
    const mapa = new Map();
    alumnosActivos.forEach(al => {
      const boleta = al.historial_academico?.find(h => h.periodo === periodoSeleccionado);
      boleta?.materias?.forEach(m => {
        if ((m.profesor || '').trim().toUpperCase() === nombreDocenteActual) {
          if (!mapa.has(m.clave_materia)) {
            mapa.set(m.clave_materia, {
              clave_materia: m.clave_materia,
              nombre_materia: m.nombre_materia
            });
          }
        }
      });
    });
    return Array.from(mapa.values());
  }, [esProfesor, alumnosActivos, periodoSeleccionado, nombreDocenteActual]);

  useEffect(() => {
    if (esProfesor && materiasDelProfesor.length > 0) {
      if (!materiasDelProfesor.some(m => m.clave_materia === materiaSeleccionadaProf)) {
        setMateriaSeleccionadaProf(materiasDelProfesor[0].clave_materia);
      }
    }
  }, [esProfesor, materiasDelProfesor, materiaSeleccionadaProf]);

  useEffect(() => {
    if (esProfesor && materiaSeleccionadaProf) {
      const lista = [];
      alumnosActivos.forEach(al => {
        const boleta = al.historial_academico?.find(h => h.periodo === periodoSeleccionado);
        const mat = boleta?.materias?.find(
          m => m.clave_materia === materiaSeleccionadaProf &&
               (m.profesor || '').trim().toUpperCase() === nombreDocenteActual
        );
        if (mat) {
          lista.push({
            alumnoId: al._id,
            nombreCompleto: `${al.nombre} ${al.apellidos}`,
            grupo: al.academico?.grupo || al.grupo,
            p1: mat.parciales?.p1 !== null && mat.parciales?.p1 !== undefined ? String(mat.parciales.p1) : '',
            p2: mat.parciales?.p2 !== null && mat.parciales?.p2 !== undefined ? String(mat.parciales.p2) : '',
            p3: mat.parciales?.p3 !== null && mat.parciales?.p3 !== undefined ? String(mat.parciales.p3) : '',
            final: mat.parciales?.final ?? null
          });
        }
      });
      setActaAlumnos(lista);
    }
  }, [esProfesor, materiaSeleccionadaProf, registros, periodoSeleccionado, nombreDocenteActual]);

  const handleCambioNotaProfesor = (idx, campo, valor) => {
    if (valor !== '' && !/^\d*\.?\d*$/.test(valor)) return;

    let valorLimpio = valor;
    if (valor !== '' && parseFloat(valor) > 10) {
      valorLimpio = '10';
    }

    setActaAlumnos(prev => {
      const copia = [...prev];
      const fila = { ...copia[idx], [campo]: valorLimpio };

      const p1Num = fila.p1 === '' ? null : parseFloat(fila.p1);
      const p2Num = fila.p2 === '' ? null : parseFloat(fila.p2);
      const p3Num = fila.p3 === '' ? null : parseFloat(fila.p3);

      if (p1Num === null && p2Num === null && p3Num === null) {
        fila.final = null;
      } else {
        const prom = ((p1Num || 0) + (p2Num || 0) + (p3Num || 0)) / 3;
        fila.final = Number(prom.toFixed(1));
      }

      copia[idx] = fila;
      return copia;
    });
  };

  const handleGuardarActaProfesor = async () => {
    try {
      const payload = {
        periodo: periodoSeleccionado,
        clave_materia: materiaSeleccionadaProf,
        calificaciones: actaAlumnos.map(a => ({
          alumnoId: a.alumnoId,
          p1: a.p1 === '' ? null : Number(a.p1),
          p2: a.p2 === '' ? null : Number(a.p2),
          p3: a.p3 === '' ? null : Number(a.p3),
          final: a.final
        }))
      };
      await clienteAxios.put('/alumnos/profesor/guardar-acta', payload);
      alert(`¡Acta de ${materiaSeleccionadaProf} guardada en MongoDB Atlas!`);
      obtenerRegistros();
    } catch (error) {
      alert('Error al guardar el acta de calificaciones.');
    }
  };

  // ========================================================
  // LÓGICA DE ALUMNOS, ADMIN Y EXTRAORDINARIOS
  // ========================================================
  const alumnoActual = alumnosActivos.find(a => a._id === alumnoSeleccionadoId);

  useEffect(() => {
    if (alumnoActual && !esProfesor) {
      const boleta = alumnoActual.historial_academico?.find(b => b.periodo === periodoSeleccionado);
      if (boleta) {
        setMaterias(boleta.materias);
      } else if (alumnoActual.historial_academico?.length > 0) {
        const ultima = alumnoActual.historial_academico[alumnoActual.historial_academico.length - 1];
        setPeriodoSeleccionado(ultima.periodo);
        setMaterias(ultima.materias);
      } else {
        setMaterias([]);
      }
    }
  }, [alumnoActual, periodoSeleccionado, esProfesor]);

  const materiasReprobadasAlumno = useMemo(() => {
    if (!alumnoActual) return [];
    const lista = [];
    alumnoActual.historial_academico?.forEach(b => {
      b.materias?.forEach(m => {
        const fin = m.parciales?.final;
        if (fin !== null && fin !== undefined && Number(fin) < 8.0) {
          lista.push({
            periodo: b.periodo,
            cuatrimestre: b.cuatrimestre,
            clave_materia: m.clave_materia,
            nombre_materia: m.nombre_materia,
            profesor: m.profesor,
            calificacion_ordinaria: Number(fin)
          });
        }
      });
    });
    return lista;
  }, [alumnoActual]);

  const handleSolicitarExtraordinario = async (materiaObj) => {
    try {
      const { data } = await clienteAxios.post(`/alumnos/${alumnoActual._id}/extraordinarios`, {
        periodo: materiaObj.periodo || periodoSeleccionado,
        clave_materia: materiaObj.clave_materia.toUpperCase(),
        nombre_materia: materiaObj.nombre_materia,
        profesor: materiaObj.profesor,
        calificacion_ordinaria: materiaObj.calificacion_ordinaria ?? null,
        fecha_aplicacion: materiaObj.fecha_aplicacion || 'Próximo viernes · 09:00 hrs'
      });
      alert(
        `¡Solicitud de Examen Extraordinario Registrada!\n\n` +
        `• Materia: ${materiaObj.clave_materia} - ${materiaObj.nombre_materia}\n` +
        `• Se generó automáticamente una línea de captura por $350.00 MXN en "Pagos y Referencias".\n` +
        `• Una vez acreditado el pago, el examen quedará autorizado para presentar.`
      );
      if (esAdmin) obtenerRegistros();
      else { setUsuarioActivo(data); setRegistros([data]); }
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al solicitar examen extraordinario.');
    }
  };

  const handleCalificarExtraordinario = async (folioExt) => {
    const nota = notasExtInput[folioExt];
    if (nota === undefined || nota === '') {
      alert('Ingresa una calificación válida entre 0 y 10.');
      return;
    }
    try {
      const { data } = await clienteAxios.put(`/alumnos/${alumnoActual._id}/extraordinarios/${folioExt}/calificar`, {
        calificacion: nota
      });
      const num = parseFloat(nota);
      alert(
        num >= 8.0
          ? `¡Examen Extraordinario ACREDITADO con ${num.toFixed(1)}!\nLa boleta y el Kardex del alumno se han actualizado automáticamente.`
          : `Calificación extraordinaria registrada (${num.toFixed(1)}). El alumno no alcanzó el mínimo aprobatorio de 8.0.`
      );
      if (esAdmin) obtenerRegistros();
      else { setUsuarioActivo(data); setRegistros([data]); }
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al calificar examen extraordinario.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await clienteAxios.post('/alumnos/login', {
        matricula: loginMatricula,
        password: loginPassword
      });
      setUsuarioActivo(data);
      if (data.estatus === 'Aspirante') setVistaActiva('admision_aspirante');
      else if (data.rol === 'PROFESOR') setVistaActiva('acta_profesor');
      else setVistaActiva('boleta');
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Usuario/Matrícula o contraseña incorrecta.');
    }
  };

  const handleSincronizarAtlas = async () => {
    try {
      const { data } = await clienteAxios.post('/alumnos/sincronizar-atlas');
      alert(data.mensaje);
      if (usuarioActivo) obtenerRegistros();
    } catch (error) {
      alert('Error sincronizando con MongoDB Atlas.');
    }
  };

  const handleRegistrarAspirante = async (e) => {
    e.preventDefault();
    try {
      const carreraObj = CARRERAS_UTFV.find(c => c.clave === formAspirante.carreraClave);
      const payload = {
        nombre: formAspirante.nombre,
        apellidos: formAspirante.apellidos,
        edad: formAspirante.edad,
        genero: formAspirante.genero,
        telefono: formAspirante.telefono,
        email: formAspirante.email,
        direccion: {
          calle: formAspirante.calle,
          colonia: formAspirante.colonia,
          municipio: formAspirante.municipio,
          codigo_postal: formAspirante.codigo_postal
        },
        carrera: carreraObj
      };
      const { data } = await clienteAxios.post('/alumnos/registro-aspirante', payload);
      alert(`¡Registro Exitoso!\nFolio y Contraseña: ${data._id}`);
      setLoginMatricula(data._id);
      setLoginPassword(data._id);
      setTabAuth('login');
    } catch (error) {
      alert('Error al registrar aspirante.');
    }
  };

  const abrirModalInscripcion = (asp) => {
    setAspiranteAInscribir(asp);
    const sugerida = `26307${String(alumnosActivos.length + 1).padStart(3, '0')}`;
    setDatosInscripcion({
      nuevaMatricula: sugerida,
      grupo: `${asp.carrera.clave}-101`,
      tutor: 'Arturo Hernández Jimenez'
    });
  };

  const handleConfirmarInscripcion = async (e) => {
    e.preventDefault();
    try {
      const { data } = await clienteAxios.post(
        `/alumnos/inscribir-aspirante/${aspiranteAInscribir._id}`,
        datosInscripcion
      );
      alert(`¡Aspirante Inscrito!\nNueva Matrícula y Contraseña: ${data._id}`);
      setAspiranteAInscribir(null);
      await obtenerRegistros();
      setAlumnoSeleccionadoId(data._id);
      setVistaActiva('boleta');
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al inscribir aspirante.');
    }
  };

  const handleAgregarMateria = (e) => {
    e.preventDefault();
    if (!claveMateria.trim() || !nombreMateria.trim() || !profesorMateria.trim()) {
      alert('Completa Clave, Materia y Profesor');
      return;
    }
    if (materias.some(m => m.clave_materia.toUpperCase() === claveMateria.trim().toUpperCase())) {
      alert('Esa clave de materia ya existe en esta boleta.');
      return;
    }
    setMaterias([
      ...materias,
      {
        clave_materia: claveMateria.trim().toUpperCase(),
        nombre_materia: nombreMateria.trim(),
        profesor: profesorMateria.trim(),
        parciales: { p1: null, p2: null, p3: null, final: null },
        evaluada: false
      }
    ]);
    setClaveMateria('');
    setNombreMateria('');
    setProfesorMateria('');
  };

  const handleEliminarMateria = (claveEliminar) => {
    if (window.confirm(`¿Eliminar ${claveEliminar}?`)) {
      setMaterias(materias.filter(m => m.clave_materia !== claveEliminar));
    }
  };

  const handleCambioNota = (index, parcialKey, valor) => {
    const copia = [...materias];
    if (valor === '') {
      copia[index].parciales[parcialKey] = null;
    } else {
      let num = parseFloat(valor);
      if (isNaN(num)) num = 0;
      if (num < 0) num = 0;
      if (num > 10) num = 10;
      copia[index].parciales[parcialKey] = num;
    }

    const { p1, p2, p3 } = copia[index].parciales;
    if (p1 === null && p2 === null && p3 === null) {
      copia[index].parciales.final = null;
    } else {
      const promedio = ((Number(p1) || 0) + (Number(p2) || 0) + (Number(p3) || 0)) / 3;
      copia[index].parciales.final = Number(promedio.toFixed(1));
    }
    setMaterias(copia);
  };

  const handleGuardarMongo = async () => {
    if (!alumnoActual) return;
    try {
      await clienteAxios.put(`/alumnos/${alumnoActual._id}/boleta/${periodoSeleccionado}`, { materias });
      alert('Calificaciones guardadas en MongoDB Atlas.');
      obtenerRegistros();
    } catch (error) {
      alert('Error al guardar en MongoDB.');
    }
  };

  const handleCrearAlumnoDirecto = async (e) => {
    e.preventDefault();
    try {
      const carreraObj = CARRERAS_UTFV.find(c => c.clave === nuevoAlumno.carreraClave);
      const payload = {
        matricula: nuevoAlumno.matricula,
        rol: 'ALUMNO',
        nombre: nuevoAlumno.nombre,
        apellidos: nuevoAlumno.apellidos,
        edad: nuevoAlumno.edad,
        genero: nuevoAlumno.genero,
        telefono: nuevoAlumno.telefono,
        direccion: {
          calle: nuevoAlumno.calle,
          colonia: nuevoAlumno.colonia,
          municipio: nuevoAlumno.municipio,
          codigo_postal: nuevoAlumno.codigo_postal
        },
        carrera: carreraObj,
        grupo: nuevoAlumno.grupo,
        cuatrimestre: nuevoAlumno.cuatrimestre,
        periodo: nuevoAlumno.periodo,
        tutor_grupo: nuevoAlumno.tutor_grupo
      };
      const { data } = await clienteAxios.post('/alumnos', payload);
      alert(`Alumno registrado.\nUsuario y Contraseña: ${data._id}`);
      setMostrarModalAlumno(false);
      await obtenerRegistros();
      setAlumnoSeleccionadoId(data._id);
    } catch (error) {
      alert('Error al registrar alumno.');
    }
  };

  const handleCrearProfesor = async (e) => {
    e.preventDefault();
    try {
      const carreraObj = CARRERAS_UTFV.find(c => c.clave === nuevoProfesor.carreraClave);
      const payload = {
        matricula: nuevoProfesor.claveEmpleado.toUpperCase(),
        rol: 'PROFESOR',
        nombre: nuevoProfesor.nombreCompleto.toUpperCase(),
        apellidos: '',
        telefono: nuevoProfesor.telefono,
        carrera: carreraObj
      };
      const { data } = await clienteAxios.post('/alumnos', payload);
      alert(`Profesor registrado.\nUsuario y Contraseña: ${data._id}\nNombre exacto: ${data.nombre}`);
      setMostrarModalProfesor(false);
      setNuevoProfesor({ claveEmpleado: '', nombreCompleto: '', telefono: '', carreraClave: 'TI' });
      obtenerRegistros();
    } catch (error) {
      alert('Error al registrar profesor.');
    }
  };

  const handleEnviarEvaluacion = async (e) => {
    e.preventDefault();
    try {
      const { data } = await clienteAxios.put(`/alumnos/${alumnoActual._id}/evaluar-docentes/${periodoSeleccionado}`);
      alert('¡Evaluación Docente completada! Boleta desbloqueada.');
      if (esAdmin) obtenerRegistros();
      else { setUsuarioActivo(data); setRegistros([data]); }
      setVistaActiva('boleta');
    } catch (error) {
      alert('Error al guardar evaluación.');
    }
  };

  const handleGenerarTramite = async (concepto, monto) => {
    try {
      const { data } = await clienteAxios.post(`/alumnos/${alumnoActual._id}/tramites`, { concepto, monto });
      alert(`Línea de captura generada por $${monto}.00 MXN`);
      if (esAdmin) obtenerRegistros();
      else { setUsuarioActivo(data); setRegistros([data]); }
    } catch (error) {
      alert('Error al generar trámite.');
    }
  };

  const handlePagarReferencia = async (folio) => {
    try {
      const { data } = await clienteAxios.put(`/alumnos/${alumnoActual._id}/tramites/${folio}/pagar`);
      alert('Pago acreditado.');
      if (esAdmin) obtenerRegistros();
      else { setUsuarioActivo(data); setRegistros([data]); }
    } catch (error) {
      alert('Error al acreditar pago.');
    }
  };

  const materiasConNota = materias.filter(m => m.parciales?.final !== null && m.parciales?.final !== undefined);
  const promedioGeneral = materiasConNota.length > 0
    ? (materiasConNota.reduce((acc, m) => acc + Number(m.parciales.final), 0) / materiasConNota.length).toFixed(2)
    : 'S/C';

  const evaluacionPendiente = !esAdmin && !esAspirante && !esProfesor && materias.length > 0 && materias.some(m => !m.evaluada);

  const todasLasMateriasKardex = alumnoActual?.historial_academico?.flatMap(b =>
    b.materias.map(m => ({ ...m, periodo: b.periodo, cuatrimestre: b.cuatrimestre }))
  ) || [];

  const totalExtraordinariosAlumno = alumnoActual?.extraordinarios?.length || 0;

  // ==========================================
  // 1. PANTALLA DE LOGIN Y REGISTRO ASPIRANTES
  // ==========================================
  if (!usuarioActivo) {
    return (
      <div>
        <nav className="navbar">
          <div className="brand">
            <div className="brand-logo-box">
              <LogoUTFV compact />
            </div>
            <h1>Portal Integral de Control Escolar · Alumnos, Docentes y Admisiones</h1>
          </div>
        </nav>

        <div className="auth-container">
          <div className="auth-logo-header">
            <LogoUTFV />
          </div>

          <div className="auth-tabs">
            <button className={`auth-tab ${tabAuth === 'login' ? 'active' : ''}`} onClick={() => setTabAuth('login')}>
              🔑 Iniciar Sesión
            </button>
            <button className={`auth-tab ${tabAuth === 'aspirante' ? 'active' : ''}`} onClick={() => setTabAuth('aspirante')}>
              📝 Registro Aspirantes
            </button>
          </div>

          <div className="auth-body">
            {tabAuth === 'login' ? (
              <>
                <h2 style={{ color: 'var(--utfv-guinda)', marginBottom: '4px' }}>Acceso Institucional</h2>
                <p style={{ color: 'var(--utfv-gray)', fontSize: '0.85rem', marginBottom: '18px' }}>
                  Alumnos: ingresa tu Matrícula como usuario y contraseña (ej. 23307001).
                </p>
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Matrícula / Clave Docente / Usuario</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Ej: 23307001, PROF-01 o admin"
                      value={loginMatricula}
                      onChange={(e) => setLoginMatricula(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      className="input-control"
                      placeholder="Tu matrícula o clave"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-utfv" style={{ width: '100%', marginBottom: '10px' }}>
                    Ingresar al Sistema
                  </button>
                </form>
                <button onClick={handleSincronizarAtlas} className="btn btn-gold" style={{ width: '100%' }}>
                  🔄 Sincronizar 130 Registros de Atlas (Sin borrar nada)
                </button>
              </>
            ) : (
              <>
                <h2 style={{ color: 'var(--utfv-guinda)', marginBottom: '4px' }}>Solicitud de Nuevo Ingreso</h2>
                <p style={{ color: 'var(--utfv-gray)', fontSize: '0.85rem', marginBottom: '16px' }}>
                  Regístrate como Aspirante. Tu folio será tu usuario y contraseña.
                </p>
                <form onSubmit={handleRegistrarAspirante}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Nombre(s)</label>
                      <input type="text" className="input-control" required value={formAspirante.nombre} onChange={(e) => setFormAspirante({ ...formAspirante, nombre: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Apellidos</label>
                      <input type="text" className="input-control" required value={formAspirante.apellidos} onChange={(e) => setFormAspirante({ ...formAspirante, apellidos: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Edad</label>
                      <input type="number" className="input-control" required value={formAspirante.edad} onChange={(e) => setFormAspirante({ ...formAspirante, edad: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Género</label>
                      <select className="input-control" value={formAspirante.genero} onChange={(e) => setFormAspirante({ ...formAspirante, genero: e.target.value })}>
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Teléfono</label>
                      <input type="text" className="input-control" required value={formAspirante.telefono} onChange={(e) => setFormAspirante({ ...formAspirante, telefono: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Correo Personal</label>
                      <input type="email" className="input-control" required value={formAspirante.email} onChange={(e) => setFormAspirante({ ...formAspirante, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Carrera a la que aspira</label>
                    <select className="input-control" value={formAspirante.carreraClave} onChange={(e) => setFormAspirante({ ...formAspirante, carreraClave: e.target.value })}>
                      {CARRERAS_UTFV.map(c => (
                        <option key={c.clave} value={c.clave}>{c.clave} - {c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Calle y Número</label>
                      <input type="text" className="input-control" required value={formAspirante.calle} onChange={(e) => setFormAspirante({ ...formAspirante, calle: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Colonia</label>
                      <input type="text" className="input-control" required value={formAspirante.colonia} onChange={(e) => setFormAspirante({ ...formAspirante, colonia: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Municipio</label>
                      <input type="text" className="input-control" required value={formAspirante.municipio} onChange={(e) => setFormAspirante({ ...formAspirante, municipio: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Código Postal</label>
                      <input type="text" className="input-control" required value={formAspirante.codigo_postal} onChange={(e) => setFormAspirante({ ...formAspirante, codigo_postal: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-utfv" style={{ width: '100%' }}>
                    Registrarme como Aspirante
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. PORTAL EXCLUSIVO DEL PROFESOR
  // ==========================================
  if (esProfesor) {
    const infoMateriaActual = materiasDelProfesor.find(m => m.clave_materia === materiaSeleccionadaProf);

    return (
      <div>
        <nav className="navbar no-print">
          <div className="brand">
            <div className="brand-logo-box">
              <LogoUTFV compact />
            </div>
            <h1>Portal Académico · Captura de Calificaciones por Asignatura</h1>
          </div>
          <div className="nav-actions">
            <span style={{ fontSize: '0.88rem' }}>
              <strong>{usuarioActivo.nombre}</strong> ({usuarioActivo._id})
            </span>
            <button onClick={() => setUsuarioActivo(null)} className="btn btn-danger">Salir</button>
          </div>
        </nav>

        <div style={{ maxWidth: '1080px', margin: '28px auto', padding: '0 16px' }}>
          <div className="card">
            <div className="boleta-banner">
              <div>
                <h2>ACTA DE EVALUACIÓN DOCENTE · UTFV</h2>
                <small style={{ color: 'var(--utfv-gray)' }}>
                  Docente: <strong>{usuarioActivo.nombre}</strong> · Clave: <strong>{usuarioActivo._id}</strong>
                </small>
              </div>
              <button onClick={() => window.print()} className="btn btn-dark no-print">
                🖨️ Imprimir Acta PDF
              </button>
            </div>

            <div className="selectors no-print" style={{ marginBottom: '20px' }}>
              <select value={periodoSeleccionado} onChange={(e) => setPeriodoSeleccionado(e.target.value)}>
                <option value="2026-3">Periodo: 2026-3</option>
              </select>

              <select
                value={materiaSeleccionadaProf}
                onChange={(e) => setMateriaSeleccionadaProf(e.target.value)}
                style={{ minWidth: '340px' }}
              >
                {materiasDelProfesor.length === 0 ? (
                  <option value="">Sin materias asignadas en este periodo</option>
                ) : (
                  materiasDelProfesor.map(m => (
                    <option key={m.clave_materia} value={m.clave_materia}>
                      {m.clave_materia} · {m.nombre_materia}
                    </option>
                  ))
                )}
              </select>
            </div>

            {materiasDelProfesor.length === 0 ? (
              <div style={{ padding: '24px', background: '#fdf9f5', borderRadius: '8px', textAlign: 'center', color: 'var(--utfv-gray)' }}>
                No tienes materias asignadas en el periodo <strong>{periodoSeleccionado}</strong>.
              </div>
            ) : (
              <>
                <div className="alumno-info">
                  <div><strong>Asignatura:</strong> {infoMateriaActual?.clave_materia} - {infoMateriaActual?.nombre_materia}</div>
                  <div><strong>Total de Alumnos Inscritos:</strong> {actaAlumnos.length} estudiantes</div>
                  <div><strong>Periodo Escolar:</strong> {periodoSeleccionado}</div>
                  <div><strong>Escala Aprobatoria:</strong> 8.0 a 10.0</div>
                </div>

                <table className="tabla-calificaciones">
                  <thead>
                    <tr>
                      <th>Matrícula</th>
                      <th>Nombre del Alumno</th>
                      <th>Grupo</th>
                      <th>P1</th>
                      <th>P2</th>
                      <th>P3</th>
                      <th>Promedio Final</th>
                      <th>Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actaAlumnos.map((al, idx) => (
                      <tr key={al.alumnoId}>
                        <td><strong>{al.alumnoId}</strong></td>
                        <td>{al.nombreCompleto}</td>
                        <td>{al.grupo}</td>
                        <td>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="grade-input"
                            placeholder="0 - 10"
                            value={al.p1}
                            onChange={(e) => handleCambioNotaProfesor(idx, 'p1', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="grade-input"
                            placeholder="0 - 10"
                            value={al.p2}
                            onChange={(e) => handleCambioNotaProfesor(idx, 'p2', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            inputMode="decimal"
                            className="grade-input"
                            placeholder="0 - 10"
                            value={al.p3}
                            onChange={(e) => handleCambioNotaProfesor(idx, 'p3', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className={`grade-input grade-final ${al.final === null ? '' : al.final >= 8 ? 'aprobado' : 'reprobado'}`}
                            value={al.final ?? '-'}
                            readOnly
                          />
                        </td>
                        <td>
                          {al.final === null ? (
                            <span style={{ color: 'var(--utfv-gray)', fontSize: '0.82rem' }}>Pendiente</span>
                          ) : (
                            <span className={`status-pill ${al.final >= 8 ? 'status-activo' : 'status-pendiente'}`}>
                              {al.final >= 8 ? 'APROBADO' : 'NO ACREDITADO'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button onClick={handleGuardarActaProfesor} className="btn btn-utfv no-print">
                  💾 Guardar Calificaciones del Acta en MongoDB
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. PORTAL EXCLUSIVO DEL ASPIRANTE
  // ==========================================
  if (esAspirante) {
    return (
      <div>
        <nav className="navbar">
          <div className="brand">
            <div className="brand-logo-box">
              <LogoUTFV compact />
            </div>
            <h1>Portal de Admisiones · Seguimiento de Aspirante</h1>
          </div>
          <div className="nav-actions">
            <span>Folio: <strong>{usuarioActivo._id}</strong></span>
            <button onClick={() => setUsuarioActivo(null)} className="btn btn-danger">Salir</button>
          </div>
        </nav>

        <div style={{ maxWidth: '850px', margin: '30px auto', padding: '0 16px' }}>
          <div className="card">
            <div className="boleta-banner">
              <div>
                <h2>SOLICITUD DE ADMISIÓN · UTFV</h2>
                <small style={{ color: 'var(--utfv-gray)' }}>Proceso de Selección Nuevo Ingreso 2026</small>
              </div>
              <span className="status-pill status-aspirante">ESTATUS: {usuarioActivo.estatus}</span>
            </div>

            <div className="alumno-info">
              <div><strong>Aspirante:</strong> {usuarioActivo.nombre} {usuarioActivo.apellidos}</div>
              <div><strong>Folio / Usuario:</strong> {usuarioActivo._id}</div>
              <div><strong>Carrera Solicitada:</strong> {usuarioActivo.carrera?.clave} - {usuarioActivo.carrera?.nombre}</div>
              <div><strong>Correo:</strong> {usuarioActivo.email}</div>
              <div><strong>Teléfono:</strong> {usuarioActivo.telefono}</div>
              <div><strong>Domicilio:</strong> {usuarioActivo.direccion?.calle}, {usuarioActivo.direccion?.colonia}, {usuarioActivo.direccion?.municipio}</div>
            </div>

            <div style={{ background: '#fdf6ee', border: '1px solid var(--utfv-gold)', padding: '18px', borderRadius: '8px', color: 'var(--utfv-dark)' }}>
              <strong>📌 Estado de tu trámite:</strong> Tu registro como aspirante ha sido validado. Una vez que Servicios Escolares apruebe tu selección, este perfil se convertirá automáticamente en <strong>Alumno_activo</strong> y se te asignará tu matrícula definitiva y grupo.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. PORTAL PRINCIPAL (ADMIN Y ALUMNOS)
  // ==========================================
  const boletaActual = alumnoActual?.historial_academico?.find(b => b.periodo === periodoSeleccionado);

  return (
    <div>
      <nav className="navbar no-print">
        <div className="brand">
          <div className="brand-logo-box">
            <LogoUTFV compact />
          </div>
          <h1>Control Escolar · {alumnosActivos.length} Alumnos Activos en Atlas</h1>
        </div>
        <div className="nav-actions">
          <span style={{ fontSize: '0.88rem' }}>
            {usuarioActivo.nombre} {usuarioActivo.apellidos} <strong>({usuarioActivo.rol})</strong>
          </span>
          <button onClick={() => setUsuarioActivo(null)} className="btn btn-danger">Salir</button>
        </div>
      </nav>

      <div className="erp-layout">
        <aside className="sidebar no-print">
          <div className="sidebar-title">Módulos Académicos</div>
          <button className={`menu-btn ${vistaActiva === 'boleta' ? 'active' : ''}`} onClick={() => setVistaActiva('boleta')}>
            <span>📄 Boleta Académica</span>
          </button>
          <button className={`menu-btn ${vistaActiva === 'kardex' ? 'active' : ''}`} onClick={() => setVistaActiva('kardex')}>
            <span>🎓 Kardex Histórico</span>
          </button>
          <button className={`menu-btn ${vistaActiva === 'extraordinarios' ? 'active' : ''}`} onClick={() => setVistaActiva('extraordinarios')}>
            <span>📝 Extraordinarios</span>
            {(materiasReprobadasAlumno.length > 0 || totalExtraordinariosAlumno > 0) && (
              <span className="badge-count">{materiasReprobadasAlumno.length || totalExtraordinariosAlumno}</span>
            )}
          </button>
          <button className={`menu-btn ${vistaActiva === 'evaluacion' ? 'active' : ''}`} onClick={() => setVistaActiva('evaluacion')}>
            <span>📋 Evaluación Docente</span>
            {evaluacionPendiente && <span className="badge-alert">!</span>}
          </button>

          {esAdmin && (
            <>
              <div className="sidebar-title" style={{ marginTop: '12px' }}>Gestión Institucional</div>
              <button
                className={`menu-btn ${vistaActiva === 'grupos' ? 'active' : ''}`}
                onClick={() => {
                  setVistaActiva('grupos');
                  setGrupoDetalleSeleccionado(null);
                }}
              >
                <span>🏫 Grupos y Estadísticas</span>
                <span className="badge-count">{gruposEstadisticas.length}</span>
              </button>
              <button className={`menu-btn ${vistaActiva === 'aspirantes' ? 'active' : ''}`} onClick={() => setVistaActiva('aspirantes')}>
                <span>🧑‍🎓 Aspirantes ({listaAspirantes.length})</span>
                {listaAspirantes.length > 0 && <span className="badge-count">{listaAspirantes.length}</span>}
              </button>
              <button className={`menu-btn ${vistaActiva === 'profesores' ? 'active' : ''}`} onClick={() => setVistaActiva('profesores')}>
                <span>👨‍🏫 Plantilla Docente ({listaProfesores.length})</span>
              </button>
            </>
          )}

          <div className="sidebar-title" style={{ marginTop: '12px' }}>Servicios Escolares</div>
          <button className={`menu-btn ${vistaActiva === 'tramites' ? 'active' : ''}`} onClick={() => setVistaActiva('tramites')}>
            <span>💳 Pagos y Referencias</span>
          </button>
          <button className={`menu-btn ${vistaActiva === 'perfil' ? 'active' : ''}`} onClick={() => setVistaActiva('perfil')}>
            <span>🪪 Expediente Completo</span>
          </button>
        </aside>

        <main className="main-content">
          {vistaActiva !== 'aspirantes' && vistaActiva !== 'profesores' && vistaActiva !== 'grupos' && (
            <div className="card no-print" style={{ padding: '14px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div className="selectors">
                  {esAdmin && (
                    <>
                      <input
                        type="text"
                        className="input-control"
                        style={{ width: '220px' }}
                        placeholder="🔍 Buscar matrícula, nombre o grupo..."
                        value={busquedaAlumno}
                        onChange={(e) => {
                          setBusquedaAlumno(e.target.value);
                          const q = e.target.value.trim().toLowerCase();
                          const coincidencia = alumnosActivos.find(al =>
                            String(al._id).toLowerCase().includes(q) ||
                            `${al.nombre} ${al.apellidos}`.toLowerCase().includes(q) ||
                            (al.grupo || '').toLowerCase().includes(q)
                          );
                          if (coincidencia) setAlumnoSeleccionadoId(coincidencia._id);
                        }}
                      />
                      <select value={alumnoSeleccionadoId} onChange={(e) => setAlumnoSeleccionadoId(e.target.value)}>
                        {alumnosFiltrados.map(al => (
                          <option key={al._id} value={al._id}>
                            {al._id} · {al.nombre} {al.apellidos} ({al.grupo})
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  <select value={periodoSeleccionado} onChange={(e) => setPeriodoSeleccionado(e.target.value)}>
                    {alumnoActual?.historial_academico?.map(b => (
                      <option key={b.periodo} value={b.periodo}>
                        Periodo: {b.periodo} (Cuatrimestre: {b.cuatrimestre})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {esAdmin && (
                    <>
                      <button onClick={() => setMostrarModalAlumno(true)} className="btn btn-utfv">
                        + Registrar Alumno
                      </button>
                      <button onClick={handleSincronizarAtlas} className="btn btn-secondary">
                        🔄 Sincronizar Atlas
                      </button>
                    </>
                  )}
                  {vistaActiva === 'boleta' && !evaluacionPendiente && (
                    <button onClick={() => window.print()} className="btn btn-dark">
                      🖨️ Guardar / Imprimir PDF
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO DE EXÁMENES EXTRAORDINARIOS                       */}
          {/* ======================================================== */}
          {vistaActiva === 'extraordinarios' && alumnoActual && (
            <div className="card">
              <div className="boleta-banner">
                <div>
                  <h2>EXÁMENES EXTRAORDINARIOS · REGULARIZACIÓN ACADÉMICA</h2>
                  <small style={{ color: 'var(--utfv-gray)' }}>
                    Alumno: <strong>{alumnoActual.nombre} {alumnoActual.apellidos}</strong> ({alumnoActual._id}) · Costo por examen: <strong>$350.00 MXN</strong>
                  </small>
                </div>
                <span className="status-pill status-pendiente">
                  Materias Reprobadas (&lt; 8.0): {materiasReprobadasAlumno.length}
                </span>
              </div>

              <h3 style={{ fontSize: '1rem', color: 'var(--utfv-dark)', marginBottom: '10px' }}>
                1. Asignaturas Reprobadas Detectadas en Boleta (Elegibles para Extraordinario)
              </h3>
              {materiasReprobadasAlumno.length === 0 ? (
                <div style={{ padding: '14px 18px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                  ✓ Este alumno no tiene asignaturas reprobadas (menores a 8.0) en su historial actual.
                </div>
              ) : (
                <table className="tabla-calificaciones" style={{ marginBottom: '24px' }}>
                  <thead>
                    <tr>
                      <th>Periodo</th>
                      <th>Clave</th>
                      <th>Asignatura</th>
                      <th>Profesor</th>
                      <th>Nota Ordinaria</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materiasReprobadasAlumno.map((m, idx) => {
                      const yaTieneSolicitud = alumnoActual.extraordinarios?.some(
                        ex => ex.clave_materia === m.clave_materia && ex.periodo === m.periodo
                      );
                      return (
                        <tr key={`${m.clave_materia}-${idx}`}>
                          <td>{m.periodo}</td>
                          <td><strong>{m.clave_materia}</strong></td>
                          <td>{m.nombre_materia}</td>
                          <td>{m.profesor}</td>
                          <td><strong style={{ color: '#b91c1c' }}>{m.calificacion_ordinaria.toFixed(1)}</strong></td>
                          <td>
                            {yaTieneSolicitud ? (
                              <span className="status-pill status-activo">✓ Solicitud Generada</span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-gold"
                                onClick={() => handleSolicitarExtraordinario(m)}
                              >
                                + Solicitar Extraordinario ($350)
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {esAdmin && (
                <div style={{ background: '#fdf9f5', padding: '14px', borderRadius: '8px', border: '1px solid var(--utfv-border)', marginBottom: '24px' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 'bold', color: 'var(--utfv-dark)', marginBottom: '8px' }}>
                    + Inscribir Materia Manualmente a Extraordinario (Control Escolar)
                  </div>
                  <div className="add-materia-form" style={{ marginBottom: 0 }}>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Clave (ej. MAT-701)"
                      value={formExtManual.clave_materia}
                      onChange={(e) => setFormExtManual({ ...formExtManual, clave_materia: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Nombre de la Materia"
                      value={formExtManual.nombre_materia}
                      onChange={(e) => setFormExtManual({ ...formExtManual, nombre_materia: e.target.value })}
                    />
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Sinodal / Profesor"
                      value={formExtManual.profesor}
                      onChange={(e) => setFormExtManual({ ...formExtManual, profesor: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn-utfv"
                      onClick={() => {
                        if (!formExtManual.clave_materia.trim() || !formExtManual.nombre_materia.trim()) {
                          alert('Escribe clave y nombre de la materia.');
                          return;
                        }
                        handleSolicitarExtraordinario({
                          periodo: periodoSeleccionado,
                          ...formExtManual
                        });
                        setFormExtManual({
                          clave_materia: '',
                          nombre_materia: '',
                          profesor: '',
                          fecha_aplicacion: 'Viernes · 09:00 hrs · Edificio B'
                        });
                      }}
                    >
                      Generar Solicitud
                    </button>
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: '1rem', color: 'var(--utfv-dark)', marginBottom: '10px' }}>
                2. Actas y Seguimiento de Exámenes Extraordinarios Solicitados
              </h3>
              {(!alumnoActual.extraordinarios || alumnoActual.extraordinarios.length === 0) ? (
                <p style={{ color: 'var(--utfv-gray)', fontSize: '0.9rem', padding: '12px' }}>
                  No hay exámenes extraordinarios registrados para este estudiante.
                </p>
              ) : (
                <table className="tabla-calificaciones">
                  <thead>
                    <tr>
                      <th>Folio Ext.</th>
                      <th>Materia</th>
                      <th>Sinodal / Profesor</th>
                      <th>Aplicación</th>
                      <th>Estatus Pago</th>
                      <th>Calificación Ext.</th>
                      {esAdmin && <th>Capturar Nota</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {alumnoActual.extraordinarios.map(ext => (
                      <tr key={ext.folio}>
                        <td><strong>{ext.folio}</strong></td>
                        <td>
                          <strong>{ext.clave_materia}</strong> · {ext.nombre_materia}
                          <div style={{ fontSize: '0.78rem', color: 'var(--utfv-gray)' }}>Periodo: {ext.periodo}</div>
                        </td>
                        <td>{ext.profesor}</td>
                        <td style={{ fontSize: '0.83rem' }}>{ext.fecha_aplicacion}</td>
                        <td>
                          {ext.estatus === 'PENDIENTE_PAGO' ? (
                            <div>
                              <span className="status-pill status-pendiente">PENDIENTE PAGO</span>
                              <div style={{ marginTop: '4px' }}>
                                <button
                                  type="button"
                                  onClick={() => setVistaActiva('tramites')}
                                  style={{ background: 'none', border: 'none', color: 'var(--utfv-guinda)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}
                                >
                                  Ir a pagar ({ext.folio_pago}) →
                                </button>
                              </div>
                            </div>
                          ) : ext.estatus === 'AUTORIZADO' ? (
                            <span className="status-pill status-aspirante">AUTORIZADO (PAGADO)</span>
                          ) : ext.estatus === 'ACREDITADO' ? (
                            <span className="status-pill status-activo">✓ ACREDITADO</span>
                          ) : (
                            <span className="status-pill status-pendiente">NO ACREDITADO</span>
                          )}
                        </td>
                        <td>
                          <strong style={{
                            fontSize: '1rem',
                            color: ext.calificacion_extraordinaria === null
                              ? 'var(--utfv-gray)'
                              : ext.calificacion_extraordinaria >= 8 ? '#15803d' : '#b91c1c'
                          }}>
                            {ext.calificacion_extraordinaria !== null ? ext.calificacion_extraordinaria.toFixed(1) : 'Sin calificar'}
                          </strong>
                        </td>
                        {esAdmin && (
                          <td>
                            {ext.estatus === 'PENDIENTE_PAGO' ? (
                              <span style={{ fontSize: '0.78rem', color: '#92400e' }}>Requiere pago previo</span>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  className="grade-input"
                                  placeholder="8.0"
                                  value={notasExtInput[ext.folio] ?? ''}
                                  onChange={(e) => setNotasExtInput({ ...notasExtInput, [ext.folio]: e.target.value })}
                                />
                                <button
                                  type="button"
                                  className="btn btn-utfv"
                                  style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                  onClick={() => handleCalificarExtraordinario(ext.folio)}
                                >
                                  Guardar
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MÓDULO GRUPOS Y ESTADÍSTICAS DE MONGODB                  */}
          {/* ======================================================== */}
          {vistaActiva === 'grupos' && esAdmin && (
            <div className="card">
              {!grupoActualDetalle ? (
                <>
                  <div className="boleta-banner">
                    <div>
                      <h2>GRUPOS REGISTRADOS EN MONGODB ATLAS ({gruposEstadisticas.length})</h2>
                      <small style={{ color: 'var(--utfv-gray)' }}>
                        Selecciona un grupo para ver su lista completa de estudiantes y métricas de aprovechamiento
                      </small>
                    </div>
                  </div>

                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <span>Total de Grupos</span>
                      <h3>{gruposEstadisticas.length}</h3>
                    </div>
                    <div className="kpi-card">
                      <span>Total de Alumnos</span>
                      <h3>{alumnosActivos.length}</h3>
                    </div>
                    <div className="kpi-card">
                      <span>Promedio Institucional</span>
                      <h3>
                        {(() => {
                          const validos = gruposEstadisticas.filter(g => g.promedioGrupo !== 'S/C');
                          if (validos.length === 0) return 'S/C';
                          return (
                            validos.reduce((acc, g) => acc + Number(g.promedioGrupo), 0) / validos.length
                          ).toFixed(2);
                        })()}
                      </h3>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                      gap: '16px',
                      marginTop: '10px'
                    }}
                  >
                    {gruposEstadisticas.map(grupo => (
                      <div
                        key={grupo.nombre}
                        onClick={() => setGrupoDetalleSeleccionado(grupo.nombre)}
                        style={{
                          border: '1px solid var(--utfv-border)',
                          borderTop: '4px solid var(--utfv-guinda)',
                          borderRadius: '10px',
                          padding: '18px',
                          background: '#ffffff',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(106, 44, 52, 0.06)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, color: 'var(--utfv-dark)', fontSize: '1.25rem' }}>{grupo.nombre}</h3>
                          <span className="status-pill status-activo">{grupo.totalEstudiantes} alumnos</span>
                        </div>

                        <div style={{ fontSize: '0.84rem', color: '#4a3f41', marginBottom: '12px' }}>
                          <div><strong>Carrera:</strong> ({grupo.carreraClave}) {grupo.carrera}</div>
                          <div><strong>Cuatrimestre:</strong> {grupo.cuatrimestre}</div>
                          <div><strong>Tutor:</strong> {grupo.tutor}</div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            paddingTop: '10px',
                            borderTop: '1px solid #f5f0ec',
                            fontSize: '0.85rem'
                          }}
                        >
                          <span>Promedio: <strong>{grupo.promedioGrupo}</strong></span>
                          <span style={{ color: grupo.tasaAprobacion >= 80 ? '#15803d' : '#92400e', fontWeight: 'bold' }}>
                            Aprobación: {grupo.tasaAprobacion}%
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-utfv"
                          style={{ width: '100%', marginTop: '12px', fontSize: '0.85rem' }}
                        >
                          Abrir Grupo y Ver Lista →
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="boleta-banner">
                    <div>
                      <h2>GRUPO {grupoActualDetalle.nombre} · LISTA Y ESTADÍSTICAS</h2>
                      <small style={{ color: 'var(--utfv-gray)' }}>
                        ({grupoActualDetalle.carreraClave}) {grupoActualDetalle.carrera} · Tutor: <strong>{grupoActualDetalle.tutor}</strong>
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }} className="no-print">
                      <button onClick={() => setGrupoDetalleSeleccionado(null)} className="btn btn-secondary">
                        ← Volver a Todos los Grupos
                      </button>
                      <button onClick={() => window.print()} className="btn btn-dark">
                        🖨️ Imprimir Lista
                      </button>
                    </div>
                  </div>

                  <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div className="kpi-card">
                      <span>Estudiantes Inscritos</span>
                      <h3>{grupoActualDetalle.totalEstudiantes}</h3>
                    </div>
                    <div className="kpi-card">
                      <span>Promedio General del Grupo</span>
                      <h3>{grupoActualDetalle.promedioGrupo}</h3>
                    </div>
                    <div className="kpi-card">
                      <span>Tasa de Aprobación</span>
                      <h3 style={{ color: '#15803d' }}>{grupoActualDetalle.tasaAprobacion}%</h3>
                    </div>
                    <div className="kpi-card">
                      <span>Alumnos en Riesgo (&lt; 8.0)</span>
                      <h3 style={{ color: grupoActualDetalle.enRiesgo > 0 ? '#b91c1c' : '#15803d' }}>
                        {grupoActualDetalle.enRiesgo}
                      </h3>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px', background: '#fdf9f5', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--utfv-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '6px' }}>
                      <span><strong>Rendimiento Académico del Grupo {grupoActualDetalle.nombre}</strong></span>
                      <span>Aprobados: <strong>{grupoActualDetalle.aprobados}</strong> · En riesgo: <strong>{grupoActualDetalle.enRiesgo}</strong></span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: '#e6dfd9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${grupoActualDetalle.tasaAprobacion}%`,
                          height: '100%',
                          background: 'var(--utfv-guinda)',
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  <table className="tabla-calificaciones">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Matrícula</th>
                        <th>Nombre Completo</th>
                        <th>Correo Institucional</th>
                        <th>Promedio</th>
                        <th>Situación</th>
                        <th className="no-print">Boleta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupoActualDetalle.estudiantes.map((est, index) => (
                        <tr key={est._id}>
                          <td>{index + 1}</td>
                          <td><strong>{est._id}</strong></td>
                          <td>{est.nombre} {est.apellidos}</td>
                          <td style={{ fontSize: '0.84rem', color: 'var(--utfv-gray)' }}>{est.email}</td>
                          <td>
                            <strong>{est.promedioIndividual !== null ? est.promedioIndividual.toFixed(2) : 'S/C'}</strong>
                          </td>
                          <td>
                            {est.promedioIndividual === null ? (
                              <span style={{ color: 'var(--utfv-gray)', fontSize: '0.82rem' }}>Sin notas</span>
                            ) : est.promedioIndividual >= 8 && est.materiasReprobadas === 0 ? (
                              <span className="status-pill status-activo">REGULAR</span>
                            ) : (
                              <span className="status-pill status-pendiente">EN RIESGO ({est.materiasReprobadas} rep.)</span>
                            )}
                          </td>
                          <td className="no-print">
                            <button
                              type="button"
                              className="btn btn-utfv"
                              style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                              onClick={() => {
                                setAlumnoSeleccionadoId(est._id);
                                setVistaActiva('boleta');
                              }}
                            >
                              Ver Boleta →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* MÓDULO PLANTILLA DOCENTE */}
          {vistaActiva === 'profesores' && esAdmin && (
            <div className="card">
              <div className="boleta-banner">
                <div>
                  <h2>PLANTILLA DOCENTE · CUENTAS DE ACCESO</h2>
                  <small style={{ color: 'var(--utfv-gray)' }}>Los profesores inician sesión con su Clave Docente como usuario y contraseña</small>
                </div>
                <button onClick={() => setMostrarModalProfesor(true)} className="btn btn-utfv">
                  + Registrar Profesor
                </button>
              </div>

              <table className="tabla-calificaciones">
                <thead>
                  <tr>
                    <th>Clave Acceso</th>
                    <th>Nombre del Docente</th>
                    <th>Academia</th>
                    <th>Correo</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  {listaProfesores.map(prof => (
                    <tr key={prof._id}>
                      <td><strong>{prof._id}</strong></td>
                      <td>{prof.nombre}</td>
                      <td>{prof.carrera?.nombre}</td>
                      <td>{prof.email}</td>
                      <td><span className="status-pill status-activo">{prof.estatus}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MÓDULO ASPIRANTES */}
          {vistaActiva === 'aspirantes' && esAdmin && (
            <div className="card">
              <div className="boleta-banner">
                <div>
                  <h2>GESTIÓN DE ASPIRANTES · SELECCIÓN E INSCRIPCIÓN</h2>
                  <small style={{ color: 'var(--utfv-gray)' }}>Convierte aspirantes seleccionados en estudiantes inscritos</small>
                </div>
              </div>

              {listaAspirantes.length === 0 ? (
                <p style={{ padding: '20px', textAlign: 'center', color: 'var(--utfv-gray)' }}>
                  No hay aspirantes pendientes de selección por el momento.
                </p>
              ) : (
                <table className="tabla-calificaciones">
                  <thead>
                    <tr>
                      <th>Folio Aspirante</th>
                      <th>Nombre Completo</th>
                      <th>Edad / Género</th>
                      <th>Carrera Solicitada</th>
                      <th>Municipio</th>
                      <th>Estatus</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listaAspirantes.map(asp => (
                      <tr key={asp._id}>
                        <td><strong>{asp._id}</strong></td>
                        <td>{asp.nombre} {asp.apellidos}</td>
                        <td>{asp.edad} años · {asp.genero}</td>
                        <td>{asp.carrera?.clave} - {asp.carrera?.nombre}</td>
                        <td>{asp.direccion?.municipio}</td>
                        <td><span className="status-pill status-aspirante">{asp.estatus}</span></td>
                        <td>
                          <button onClick={() => abrirModalInscripcion(asp)} className="btn btn-utfv">
                            ✓ Seleccionar e Inscribir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* MÓDULO BOLETA ACADÉMICA */}
          {vistaActiva === 'boleta' && alumnoActual && (
            <div className="card">
              <div className="boleta-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <LogoUTFV compact />
                  <div>
                    <h2>Boleta Académica Oficial</h2>
                    <small style={{ color: 'var(--utfv-gray)' }}>Universidad Tecnológica Fidel Velázquez</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--utfv-dark)' }}>
                  <div><strong>Matrícula:</strong> {alumnoActual._id}</div>
                  <div><strong>Periodo:</strong> {periodoSeleccionado}</div>
                </div>
              </div>

              <div className="alumno-info">
                <div><strong>Alumno:</strong> {alumnoActual.nombre} {alumnoActual.apellidos}</div>
                <div>
                  <strong>Matrícula:</strong> {alumnoActual._id} |{' '}
                  <span className={`status-pill ${alumnoActual.estatus === 'Alumno_activo' ? 'status-activo' : 'status-pendiente'}`}>
                    {alumnoActual.estatus}
                  </span>
                </div>
                <div><strong>Carrera:</strong> ({alumnoActual.carrera?.clave}) {alumnoActual.carrera?.nombre}</div>
                <div><strong>Grupo:</strong> {alumnoActual.academico?.grupo || alumnoActual.grupo} | <strong>Cuatrimestre:</strong> {boletaActual?.cuatrimestre || alumnoActual.academico?.cuatrimestre}</div>
                <div><strong>Correo:</strong> {alumnoActual.email}</div>
                <div><strong>Tutor:</strong> {alumnoActual.academico?.tutor_grupo || 'Arturo Hernández Jimenez'}</div>
              </div>

              {evaluacionPendiente ? (
                <div className="lock-box">
                  <h3 style={{ color: 'var(--utfv-guinda)', marginBottom: '10px' }}>🔒 Boleta Bloqueada por Evaluación Docente</h3>
                  <p style={{ maxWidth: '500px', margin: '0 auto 16px', color: 'var(--utfv-dark)' }}>
                    Para visualizar tus calificaciones debes responder primero la evaluación de tus profesores del periodo <strong>{periodoSeleccionado}</strong>.
                  </p>
                  <button onClick={() => setVistaActiva('evaluacion')} className="btn btn-gold">
                    Contestar Evaluación Docente →
                  </button>
                </div>
              ) : (
                <>
                  {esAdmin && (
                    <form onSubmit={handleAgregarMateria} className="add-materia-form no-print">
                      <input type="text" className="input-control" placeholder="Clave (ej. MAT-105)" value={claveMateria} onChange={(e) => setClaveMateria(e.target.value)} />
                      <input type="text" className="input-control" placeholder="Materia" value={nombreMateria} onChange={(e) => setNombreMateria(e.target.value)} />
                      <input
                        type="text"
                        list="lista-profesores-datalist"
                        className="input-control"
                        placeholder="Profesor (elige o escribe)"
                        value={profesorMateria}
                        onChange={(e) => setProfesorMateria(e.target.value)}
                      />
                      <datalist id="lista-profesores-datalist">
                        {listaProfesores.map(p => (
                          <option key={p._id} value={p.nombre} />
                        ))}
                      </datalist>
                      <button type="submit" className="btn btn-utfv">+ Agregar Materia</button>
                    </form>
                  )}

                  <table className="tabla-calificaciones">
                    <thead>
                      <tr>
                        <th>Clave</th>
                        <th>Materia</th>
                        <th>Profesor</th>
                        <th>P1</th>
                        <th>P2</th>
                        <th>P3</th>
                        <th>Final</th>
                        {esAdmin && <th className="no-print">Quitar</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {materias.map((mat, idx) => {
                        const finalVal = mat.parciales?.final;
                        return (
                          <tr key={mat.clave_materia}>
                            <td><strong>{mat.clave_materia}</strong></td>
                            <td>{mat.nombre_materia}</td>
                            <td>{mat.profesor}</td>
                            <td>
                              <input
                                type="number" step="0.1" min="0" max="10"
                                className="grade-input"
                                placeholder="-"
                                value={mat.parciales?.p1 ?? ''}
                                disabled={!esAdmin}
                                onChange={(e) => handleCambioNota(idx, 'p1', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number" step="0.1" min="0" max="10"
                                className="grade-input"
                                placeholder="-"
                                value={mat.parciales?.p2 ?? ''}
                                disabled={!esAdmin}
                                onChange={(e) => handleCambioNota(idx, 'p2', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number" step="0.1" min="0" max="10"
                                className="grade-input"
                                placeholder="-"
                                value={mat.parciales?.p3 ?? ''}
                                disabled={!esAdmin}
                                onChange={(e) => handleCambioNota(idx, 'p3', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                className={`grade-input grade-final ${finalVal === null || finalVal === undefined ? '' : finalVal >= 8 ? 'aprobado' : 'reprobado'}`}
                                value={finalVal ?? '-'}
                                readOnly
                              />
                            </td>
                            {esAdmin && (
                              <td className="no-print">
                                <button type="button" onClick={() => handleEliminarMateria(mat.clave_materia)} className="btn btn-danger">X</button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="resumen-boleta">
                    <div>Promedio General del Cuatrimestre: <strong>{promedioGeneral}</strong></div>
                    <div style={{ fontWeight: 'bold', color: promedioGeneral === 'S/C' ? 'var(--utfv-gray)' : Number(promedioGeneral) >= 8 ? '#15803d' : '#b91c1c' }}>
                      {promedioGeneral === 'S/C' ? 'PENDIENTE DE CAPTURA' : Number(promedioGeneral) >= 8 ? '✓ APROBADO' : '⚠ EN RIESGO'}
                    </div>
                  </div>

                  {esAdmin && (
                    <button onClick={handleGuardarMongo} className="btn btn-utfv no-print">
                      Guardar Calificaciones en MongoDB
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* MÓDULO KARDEX */}
          {vistaActiva === 'kardex' && alumnoActual && (
            <div className="card">
              <div className="boleta-banner">
                <h2>KARDEX HISTÓRICO DEL ESTUDIANTE</h2>
                <span>Matrícula: <strong>{alumnoActual._id}</strong></span>
              </div>

              <div className="kpi-grid">
                <div className="kpi-card">
                  <span>Promedio Acumulado</span>
                  <h3>{promedioGeneral}</h3>
                </div>
                <div className="kpi-card">
                  <span>Materias Registradas</span>
                  <h3>{todasLasMateriasKardex.length}</h3>
                </div>
                <div className="kpi-card">
                  <span>Carrera</span>
                  <h3 style={{ fontSize: '1.1rem' }}>{alumnoActual.carrera?.nombre}</h3>
                </div>
              </div>

              <table className="tabla-calificaciones">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Cuatrimestre</th>
                    <th>Clave</th>
                    <th>Materia</th>
                    <th>P1</th>
                    <th>P2</th>
                    <th>P3</th>
                    <th>Final</th>
                  </tr>
                </thead>
                <tbody>
                  {todasLasMateriasKardex.map((m, i) => (
                    <tr key={i}>
                      <td>{m.periodo}</td>
                      <td>{m.cuatrimestre}</td>
                      <td><strong>{m.clave_materia}</strong></td>
                      <td>{m.nombre_materia}</td>
                      <td>{m.parciales?.p1 ?? '-'}</td>
                      <td>{m.parciales?.p2 ?? '-'}</td>
                      <td>{m.parciales?.p3 ?? '-'}</td>
                      <td><strong>{m.parciales?.final ?? '-'}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MÓDULO EVALUACIÓN DOCENTE */}
          {vistaActiva === 'evaluacion' && alumnoActual && (
            <div className="card">
              <div className="boleta-banner">
                <h2>EVALUACIÓN DOCENTE · {periodoSeleccionado}</h2>
              </div>
              {!evaluacionPendiente && !esAdmin ? (
                <div style={{ padding: '20px', background: '#dcfce7', borderRadius: '8px', color: '#166534' }}>
                  ✓ Ya completaste la evaluación docente de este periodo.
                </div>
              ) : (
                <form onSubmit={handleEnviarEvaluacion}>
                  <p style={{ marginBottom: '16px', color: '#4a3f41' }}>Evalúa a los docentes de tus asignaturas:</p>
                  {materias.map(m => (
                    <div key={m.clave_materia} style={{ padding: '12px', border: '1px solid var(--utfv-border)', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{m.profesor}</strong>
                        <div style={{ fontSize: '0.84rem', color: 'var(--utfv-gray)' }}>{m.clave_materia} · {m.nombre_materia}</div>
                      </div>
                      <select
                        className="input-control"
                        style={{ width: '210px' }}
                        value={respuestasEval[m.clave_materia] || '5'}
                        onChange={(e) => setRespuestasEval({ ...respuestasEval, [m.clave_materia]: e.target.value })}
                      >
                        <option value="5">5 - Excelente</option>
                        <option value="4">4 - Muy Bueno</option>
                        <option value="3">3 - Bueno</option>
                      </select>
                    </div>
                  ))}
                  <button type="submit" className="btn btn-utfv">Enviar Evaluación y Liberar Boleta</button>
                </form>
              )}
            </div>
          )}

          {/* MÓDULO TRÁMITES */}
          {vistaActiva === 'tramites' && alumnoActual && (
            <div className="card">
              <div className="boleta-banner">
                <h2>VENTANILLA DE PAGOS Y LÍNEAS DE CAPTURA</h2>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
                <button onClick={() => handleGenerarTramite('Reinscripción Cuatrimestral', 1650)} className="btn btn-utfv">+ Reinscripción ($1,650)</button>
                <button onClick={() => handleGenerarTramite('Constancia de Estudios', 120)} className="btn btn-primary">+ Constancia ($120)</button>
              </div>
              <table className="tabla-calificaciones">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Concepto</th>
                    <th>Referencia</th>
                    <th>Monto</th>
                    <th>Estatus</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(!alumnoActual.tramites || alumnoActual.tramites.length === 0) ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--utfv-gray)' }}>Sin trámites registrados.</td></tr>
                  ) : (
                    alumnoActual.tramites.map(t => (
                      <tr key={t.folio}>
                        <td><strong>{t.folio}</strong></td>
                        <td>{t.concepto}</td>
                        <td style={{ fontFamily: 'monospace' }}>{t.referencia}</td>
                        <td>${t.monto}.00</td>
                        <td><span className={`status-pill ${t.estatusPago === 'PAGADO' ? 'status-activo' : 'status-pendiente'}`}>{t.estatusPago}</span></td>
                        <td>
                          {t.estatusPago === 'PENDIENTE' ? (
                            <button onClick={() => handlePagarReferencia(t.folio)} className="btn btn-gold">Pagar Referencia</button>
                          ) : '✓ Pagado'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MÓDULO EXPEDIENTE */}
          {vistaActiva === 'perfil' && alumnoActual && (
            <div className="card">
              <div className="boleta-banner">
                <h2>EXPEDIENTE COMPLETO DEL ESTUDIANTE</h2>
              </div>
              <div className="alumno-info">
                <div><strong>Nombre Completo:</strong> {alumnoActual.nombre} {alumnoActual.apellidos}</div>
                <div><strong>Matrícula (_id):</strong> {alumnoActual._id}</div>
                <div><strong>Edad y Género:</strong> {alumnoActual.edad} años · {alumnoActual.genero}</div>
                <div><strong>Teléfono:</strong> {alumnoActual.telefono}</div>
                <div><strong>Correo Institucional:</strong> {alumnoActual.email}</div>
                <div><strong>Carrera:</strong> ({alumnoActual.carrera?.clave}) {alumnoActual.carrera?.nombre}</div>
                <div><strong>Grupo y Cuatrimestre:</strong> {alumnoActual.academico?.grupo || alumnoActual.grupo} · {alumnoActual.academico?.cuatrimestre}</div>
                <div><strong>Tutor:</strong> {alumnoActual.academico?.tutor_grupo}</div>
                <div><strong>Calle y Colonia:</strong> {alumnoActual.direccion?.calle}, {alumnoActual.direccion?.colonia}</div>
                <div><strong>Municipio y C.P.:</strong> {alumnoActual.direccion?.municipio}, C.P. {alumnoActual.direccion?.codigo_postal}</div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL REGISTRAR PROFESOR */}
      {mostrarModalProfesor && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <h3 style={{ marginBottom: '6px', color: 'var(--utfv-guinda)' }}>Registrar Nuevo Profesor</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--utfv-gray)', marginBottom: '14px' }}>
              La clave de empleado será su usuario y contraseña de acceso.
            </p>
            <form onSubmit={handleCrearProfesor}>
              <div className="form-group">
                <label>Clave de Docente (Ej: PROF-06)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="PROF-06"
                  required
                  value={nuevoProfesor.claveEmpleado}
                  onChange={(e) => setNuevoProfesor({ ...nuevoProfesor, claveEmpleado: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Grado y Nombre Completo (Ej: ING. CARLOS MENDOZA)</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="ING. CARLOS MENDOZA"
                  required
                  value={nuevoProfesor.nombreCompleto}
                  onChange={(e) => setNuevoProfesor({ ...nuevoProfesor, nombreCompleto: e.target.value })}
                />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Academia / Carrera</label>
                  <select className="input-control" value={nuevoProfesor.carreraClave} onChange={(e) => setNuevoProfesor({ ...nuevoProfesor, carreraClave: e.target.value })}>
                    {CARRERAS_UTFV.map(c => (
                      <option key={c.clave} value={c.clave}>{c.clave} - {c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" className="input-control" value={nuevoProfesor.telefono} onChange={(e) => setNuevoProfesor({ ...nuevoProfesor, telefono: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setMostrarModalProfesor(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-utfv">Registrar Profesor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONVERTIR ASPIRANTE -> ESTUDIANTE INSCRITO */}
      {aspiranteAInscribir && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <h3 style={{ marginBottom: '8px', color: 'var(--utfv-guinda)' }}>Inscribir Aspirante Seleccionado</h3>
            <p style={{ fontSize: '0.86rem', color: '#4a3f41', marginBottom: '16px' }}>
              Aspirante: <strong>{aspiranteAInscribir.nombre} {aspiranteAInscribir.apellidos}</strong> ({aspiranteAInscribir.carrera?.nombre})
            </p>
            <form onSubmit={handleConfirmarInscripcion}>
              <div className="form-group">
                <label>Asignar Matrícula Oficial (Usuario y Contraseña)</label>
                <input
                  type="text"
                  className="input-control"
                  required
                  value={datosInscripcion.nuevaMatricula}
                  onChange={(e) => setDatosInscripcion({ ...datosInscripcion, nuevaMatricula: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Asignar Grupo de Primer Cuatrimestre</label>
                <input
                  type="text"
                  className="input-control"
                  required
                  value={datosInscripcion.grupo}
                  onChange={(e) => setDatosInscripcion({ ...datosInscripcion, grupo: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Tutor Asignado</label>
                <input
                  type="text"
                  className="input-control"
                  required
                  value={datosInscripcion.tutor}
                  onChange={(e) => setDatosInscripcion({ ...datosInscripcion, tutor: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setAspiranteAInscribir(null)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-utfv">Confirmar Inscripción</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ALUMNO DIRECTO */}
      {mostrarModalAlumno && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <h3 style={{ marginBottom: '6px', color: 'var(--utfv-guinda)' }}>Registrar Alumno Activo</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--utfv-gray)', marginBottom: '14px' }}>
              La contraseña generada por default será su misma matrícula.
            </p>
            <form onSubmit={handleCrearAlumnoDirecto}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Matrícula (_id)</label>
                  <input type="text" className="input-control" placeholder="Ej: 23307131" required value={nuevoAlumno.matricula} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, matricula: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Grupo</label>
                  <input type="text" className="input-control" placeholder="Ej: TI-701" required value={nuevoAlumno.grupo} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, grupo: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Nombre(s)</label>
                  <input type="text" className="input-control" required value={nuevoAlumno.nombre} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, nombre: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input type="text" className="input-control" required value={nuevoAlumno.apellidos} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, apellidos: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Carrera</label>
                  <select className="input-control" value={nuevoAlumno.carreraClave} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, carreraClave: e.target.value })}>
                    {CARRERAS_UTFV.map(c => (
                      <option key={c.clave} value={c.clave}>{c.clave} - {c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Cuatrimestre</label>
                  <input type="text" className="input-control" value={nuevoAlumno.cuatrimestre} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, cuatrimestre: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Edad</label>
                  <input type="number" className="input-control" value={nuevoAlumno.edad} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, edad: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="text" className="input-control" value={nuevoAlumno.telefono} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, telefono: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Calle y Número</label>
                  <input type="text" className="input-control" value={nuevoAlumno.calle} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, calle: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Colonia</label>
                  <input type="text" className="input-control" value={nuevoAlumno.colonia} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, colonia: e.target.value })} />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Municipio</label>
                  <input type="text" className="input-control" value={nuevoAlumno.municipio} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, municipio: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Código Postal</label>
                  <input type="text" className="input-control" value={nuevoAlumno.codigo_postal} onChange={(e) => setNuevoAlumno({ ...nuevoAlumno, codigo_postal: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setMostrarModalAlumno(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-utfv">Registrar Alumno</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;