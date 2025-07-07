// En src/services/salaService.js

import { getDatabase, ref, set, onValue, push } from "firebase/database";
import app from "../firebase/firebaseConfig";

// Nuevo: Registrar nombre de estudiante al entrar a la sala
export function registrarEstudiante(codigoSala, nombre) {
  const db = getDatabase(app);
  const listaRef = ref(db, `salas/${codigoSala}/estudiantes`);
  const nuevoEstudiante = {
    nombre,
    timestamp: Date.now(),
  };
  return push(listaRef, nuevoEstudiante);
}

// Ya existentes
export function inicializarSala(codigoSala, modo = "profesor") {
  const db = getDatabase(app);
  return set(ref(db, `salas/${codigoSala}/estado`), {
    modo,
    preguntaActual: 0,
    estado: "esperando", // ← importante: no "jugando" todavía
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

// Nuevo: Escuchar lista de estudiantes conectados
export function escucharEstudiantes(codigoSala, callback) {
  const db = getDatabase(app);
  const listaRef = ref(db, `salas/${codigoSala}/estudiantes`);
  return onValue(listaRef, (snapshot) => {
    const data = snapshot.val() || {};
    const estudiantes = Object.values(data);
    callback(estudiantes);
  });
}
