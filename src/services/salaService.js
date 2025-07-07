import { getDatabase, ref, set, onValue, push, get } from "firebase/database";
import app from "../firebase/firebaseConfig";
import { recalcularRankingGlobal } from "./rankingService";

// Registrar nombre de estudiante al entrar a la sala
export function registrarEstudiante(codigoSala, nombre) {
  const db = getDatabase(app);
  const listaRef = ref(db, `salas/${codigoSala}/estudiantes`);
  const nuevoEstudiante = {
    nombre,
    timestamp: Date.now(),
  };
  return push(listaRef, nuevoEstudiante);
}

// Inicializar sala (usa "fase", no "estado")
export function inicializarSala(codigoSala, modo = "profesor") {
  const db = getDatabase(app);
  return set(ref(db, `salas/${codigoSala}/estado`), {
    modo,
    preguntaActual: 0,
    fase: "esperando", // <-- aquí
  });
}

export function escucharEstadoSala(codigoSala, callback) {
  const db = getDatabase(app);
  const estadoRef = ref(db, `salas/${codigoSala}/estado`);
  return onValue(estadoRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export function actualizarEstadoSala(codigoSala, nuevosValores) {
  const db = getDatabase(app);
  return set(ref(db, `salas/${codigoSala}/estado`), nuevosValores);
}

// Escuchar lista de estudiantes conectados
export function escucharEstudiantes(codigoSala, callback) {
  const db = getDatabase(app);
  const listaRef = ref(db, `salas/${codigoSala}/estudiantes`);
  return onValue(listaRef, (snapshot) => {
    const data = snapshot.val() || {};
    const estudiantes = Object.values(data);
    callback(estudiantes);
  });
}

// Guardar respuesta individual por pregunta Y actualiza ranking global
export async function guardarRespuesta(
  codigoSala,
  nombre,
  indicePregunta,
  respuesta,
  puntaje
) {
  const db = getDatabase(app);
  await set(
    ref(db, `salas/${codigoSala}/respuestas/${nombre}/${indicePregunta}`),
    {
      respuesta,
      puntaje,
    }
  );
  // Actualiza ranking inmediatamente después de guardar la respuesta
  await recalcularRankingGlobal(codigoSala);
}

// Asignar 0 puntos a quienes no respondieron la pregunta actual Y actualiza ranking global
export async function asignarCerosSiNoRespondieron(codigoSala, indicePregunta) {
  const db = getDatabase(app);
  const estudiantesRef = ref(db, `salas/${codigoSala}/estudiantes`);
  const estSnap = await get(estudiantesRef);
  const estudiantes = estSnap.exists() ? Object.values(estSnap.val()) : [];

  // Asignar 0 a quienes no respondieron
  for (let estudiante of estudiantes) {
    const nombre = estudiante.nombre;
    const respuestaRef = ref(
      db,
      `salas/${codigoSala}/respuestas/${nombre}/${indicePregunta}`
    );
    const respuestaSnap = await get(respuestaRef);
    if (!respuestaSnap.exists()) {
      await set(respuestaRef, { respuesta: null, puntaje: 0 });
    }
  }

  // Actualiza ranking después de asignar ceros
  await recalcularRankingGlobal(codigoSala);
}
