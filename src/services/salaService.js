import { getDatabase, ref, set, onValue, push } from "firebase/database";
import app from "../firebase/firebaseConfig";

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

// Guardar respuesta individual por pregunta
export function guardarRespuesta(
  codigoSala,
  nombre,
  indicePregunta,
  respuesta,
  puntaje
) {
  const db = getDatabase(app);
  return set(
    ref(db, `salas/${codigoSala}/respuestas/${nombre}/${indicePregunta}`),
    {
      respuesta,
      puntaje,
    }
  );
}

// Asignar 0 puntos a quienes no respondieron la pregunta actual
export function asignarCerosSiNoRespondieron(codigoSala, indicePregunta) {
  const db = getDatabase(app);
  const estudiantesRef = ref(db, `salas/${codigoSala}/estudiantes`);
  return new Promise((resolve) => {
    onValue(
      estudiantesRef,
      (snapshot) => {
        const estudiantes = snapshot.val() ? Object.values(snapshot.val()) : [];
        let pendientes = estudiantes.length;
        if (pendientes === 0) resolve();

        estudiantes.forEach((estudiante) => {
          const nombre = estudiante.nombre;
          const respuestaRef = ref(
            db,
            `salas/${codigoSala}/respuestas/${nombre}/${indicePregunta}`
          );
          onValue(
            respuestaRef,
            (snap) => {
              if (!snap.exists()) {
                set(respuestaRef, {
                  respuesta: null,
                  puntaje: 0,
                }).then(() => {
                  pendientes--;
                  if (pendientes === 0) resolve();
                });
              } else {
                pendientes--;
                if (pendientes === 0) resolve();
              }
            },
            { onlyOnce: true }
          );
        });
      },
      { onlyOnce: true }
    );
  });
}
