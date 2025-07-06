import React from "react";

function ModalRanking({ visible, ranking, onClose, titulo = "Ranking Parcial" }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-red-600 font-bold"
          aria-label="Cerrar"
        >×</button>
        <h2 className="text-2xl font-bold text-blue-700 mb-4">{titulo}</h2>
        <div className="bg-blue-50 rounded-lg shadow p-3">
          {ranking.length === 0 ? (
            <div className="text-gray-500 italic">Aún no hay respuestas registradas.</div>
          ) : (
            ranking.map((r, i) => (
              <div key={i} className={`flex justify-between font-mono px-2 py-1 ${i < 3 ? "font-bold text-blue-900" : ""}`}>
                <span>{i + 1}. {r.nombre}</span>
                <span>{r.puntaje}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalRanking;
