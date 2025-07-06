// /src/services/salaService.js

import { getDatabase, ref, set, onValue } from "firebase/database";
import app from "../firebase/firebaseConfig";

// Inicializa la sala con estado y modo (solo el docente debe usar esto)
export function inicializarSala(codigoSala, modo = "profesor") {
  const db = getDatabase(app);
  return set(ref(db, `salas/${codigoSala}/estado`), {
    modo,
    preguntaActual: 0,
    estado: "jugando"
  });
}

// Escucha los cambios en el estado de la sala en tiempo real
export function escucharEstadoSala(codigoSala, callback) {
  const db = getDatabase(app);
  const estadoRef = ref(db, `salas/${codigoSala}/estado`);
  return onValue(estadoRef, (snapshot) => {
    callback(snapshot.val());
  });
}

// (Opcional, para cambiar el estado desde el docente)
export function actualizarEstadoSala(codigoSala, nuevosValores) {
  const db = getDatabase(app);
  return set(ref(db, `salas/${codigoSala}/estado`), nuevosValores);
}
