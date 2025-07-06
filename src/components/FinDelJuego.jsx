import React from "react";   // <--- SIEMPRE ARRIBA

function FinDelJuego({
  nombre,
  puntaje,
  ranking,
  onReiniciar
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-green-100 to-green-300">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-green-700 mb-4">¡Juego terminado!</h1>
        <p className="text-xl mb-2">Jugador: <span className="font-bold">{nombre}</span></p>
        <p className="text-2xl font-bold mb-8">Puntaje: <span className="text-green-700">{puntaje}</span></p>
        <h2 className="text-xl font-bold text-blue-700 mt-4 mb-2">Ranking en tiempo real</h2>
        <div className="w-full max-w-md bg-blue-50 rounded-lg shadow p-3">
          {ranking.map((r, i) => (
            <div key={i} className="flex justify-between font-mono px-2 py-1">
              <span>{r.nombre}</span>
              <span>{r.puntaje}</span>
            </div>
          ))}
        </div>
        <button
          className="mt-4 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
          onClick={onReiniciar}
        >
          Jugar de nuevo
        </button>
      </div>
    </div>
  );
}

export default FinDelJuego;
