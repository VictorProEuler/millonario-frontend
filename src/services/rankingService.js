import { getDatabase, ref, set, get, onValue } from "firebase/database";
import app from "../firebase/firebaseConfig";

// Calcula y guarda el ranking global actualizado en /salas/{codigoSala}/ranking
export async function recalcularRankingGlobal(codigoSala) {
  const db = getDatabase(app);
  const respuestasRef = ref(db, `salas/${codigoSala}/respuestas`);
  const estudiantesRef = ref(db, `salas/${codigoSala}/estudiantes`);

  // Trae estudiantes para mostrar el nombre original si hace falta
  const estSnap = await get(estudiantesRef);
  const estudiantes = estSnap.exists()
    ? Object.values(estSnap.val() || {}).reduce((acc, cur) => {
        acc[cur.nombre.trim().toLowerCase()] = cur.nombre;
        return acc;
      }, {})
    : {};

  // Trae respuestas
  const snapshot = await get(respuestasRef);
  if (!snapshot.exists()) return;
  const respuestasPorUsuario = snapshot.val();
  const ranking = {};

  Object.entries(respuestasPorUsuario).forEach(([nombre, respuestas]) => {
    const nombreNorm = nombre.trim().toLowerCase();
    let puntajeTotal = 0;
    Object.values(respuestas).forEach((r) => {
      if (typeof r.puntaje === "number") puntajeTotal += r.puntaje;
    });
    const nombreAMostrar = estudiantes[nombreNorm] || nombre;
    ranking[nombreAMostrar] = { nombre: nombreAMostrar, puntaje: puntajeTotal };
  });

  const rankingRef = ref(db, `salas/${codigoSala}/ranking`);
  await set(rankingRef, ranking);
}

// Escucha el ranking en tiempo real y lo ordena descendente
export function escucharRanking(callback, sala) {
  const db = getDatabase(app);
  const rankingRef = ref(db, `salas/${sala}/ranking`);
  return onValue(rankingRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rankingArray = Object.values(data).sort(
        (a, b) => b.puntaje - a.puntaje
      );
      callback(rankingArray);
    } else {
      callback([]);
    }
  });
}
