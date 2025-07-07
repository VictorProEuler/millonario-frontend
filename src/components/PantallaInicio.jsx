import React from "react";

function PantallaInicio({
  nombre,
  setNombre,
  codigoSala,
  setCodigoSala,
  onIniciar,
  esDocente,
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-200 to-blue-50">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md relative">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-2 text-center">
          ¿Quién Quiere Ser Millonario?
        </h1>
        <span className="absolute top-4 right-6 text-xs text-gray-400 italic select-none">
          Diseñado por Víctor Aguilar
        </span>
        <form className="mt-8 flex flex-col items-center space-y-6">
          <input
            type="text"
            className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
            placeholder="Nombre y apellido"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            type="text"
            className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
            placeholder="Código de sala (ej: BIO2024)"
            value={codigoSala}
            onChange={(e) => setCodigoSala(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            El código de sala no distingue mayúsculas/minúsculas.
          </p>
          <button
            type="button"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
            onClick={onIniciar}
            disabled={nombre.trim() === "" || codigoSala.trim() === ""}
          >
            {esDocente ? "Crear sala" : "Unirse a sala"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PantallaInicio;
