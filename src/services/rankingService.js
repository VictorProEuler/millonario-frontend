import { getDatabase, ref, set, onValue } from "firebase/database";
import app from "../firebase/firebaseConfig";

// Guarda el puntaje de un usuario en la sala específica
export function guardarPuntaje(nombre, puntaje, sala) {
  const db = getDatabase(app);
  return set(ref(db, `salas/${sala}/ranking/${nombre}`), {
    nombre,
    puntaje
  });
}

// Escucha el ranking SOLO de la sala específica (en tiempo real)
export function escucharRanking(callback, sala) {
  const db = getDatabase(app);
  const rankingRef = ref(db, `salas/${sala}/ranking`);
  return onValue(rankingRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rankingArray = Object.values(data).sort((a, b) => b.puntaje - a.puntaje);
      callback(rankingArray);
    } else {
      callback([]);
    }
  });
}
