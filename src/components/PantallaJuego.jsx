import React from "react";
import Confetti from "react-confetti";

function PantallaJuego({
  puntaje,
  segundos,
  mostrarAnimacion,
  amigoPensando,
  preguntaActual,
  indicePregunta,
  respuestaSeleccionada,
  respuestaVerificada,
  opcionesVisibles,
  usado5050,
  usar5050,
  usadoAmigo,
  usarAmigo,
  mensajeAmigo,
  handleSeleccion,
  esDocente, // <---- nuevo prop
}) {
  // Si quieres debugear el rol:
  // console.log("esDocente:", esDocente);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-yellow-100 to-yellow-200 relative overflow-hidden">
      {/* Puntaje GRANDE a la izquierda */}
      {!esDocente && (
        <div className="absolute top-10 left-10">
          <div className="bg-blue-900 text-white font-extrabold rounded-2xl px-8 py-4 text-3xl shadow-lg select-none">
            Puntaje: {puntaje}
          </div>
        </div>
      )}

      {/* Cronómetro GRANDE a la derecha */}
      <div className="absolute top-10 right-10">
        <div
          className={`bg-white border-4 rounded-full flex items-center justify-center shadow-lg w-32 h-32 text-6xl font-mono font-extrabold text-blue-600 transition-all duration-300
          ${
            segundos <= 3
              ? "border-red-500 text-red-600 animate-pulse"
              : "border-blue-400"
          }`}
        >
          {segundos}
        </div>
      </div>

      {mostrarAnimacion && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      {amigoPensando && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-30">
          <span
            className="text-[8rem] font-bold animate-zoom-bounce"
            style={{
              textShadow: "0 4px 24px #06b6d4, 0 8px 48px #0ea5e966",
            }}
          >
            🤔
          </span>
          <span className="mt-4 text-2xl text-white font-bold drop-shadow-lg animate-pulse">
            Tu amigo está pensando...
          </span>
          <style>
            {`
              @keyframes zoom-bounce {
                0% { transform: scale(0.2); opacity: 0.6; }
                50% { transform: scale(1.3); opacity: 1; }
                80% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
              }
              .animate-zoom-bounce {
                animation: zoom-bounce 1.3s cubic-bezier(0.68,-0.55,0.27,1.55) both;
              }
            `}
          </style>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-xl flex flex-col items-center">
        <h2 className="text-2xl font-bold text-yellow-700 mb-2">{`Pregunta ${
          indicePregunta + 1
        }`}</h2>
        <p className="mb-6 text-gray-800 text-center">
          {preguntaActual.enunciado}
        </p>

        {/* SOLO estudiantes ven comodines */}
        {!esDocente && (
          <div className="flex w-full justify-end mb-4 space-x-3">
            <button
              className={`py-2 px-5 rounded-lg text-white font-bold bg-purple-500 hover:bg-purple-600 transition disabled:bg-gray-300`}
              onClick={usar5050}
              disabled={usado5050 || respuestaVerificada}
              title="Elimina dos opciones incorrectas"
            >
              50/50
            </button>
            <button
              className={`py-2 px-5 rounded-lg text-white font-bold bg-teal-500 hover:bg-teal-600 transition disabled:bg-gray-300`}
              onClick={usarAmigo}
              disabled={usadoAmigo || respuestaVerificada}
              title="Preguntar a un amigo"
            >
              🤔 Amigo
            </button>
          </div>
        )}

        {/* Opciones visibles */}
        <div className="w-full flex flex-col gap-4">
          {preguntaActual.opciones.map(
            (opcion, idx) =>
              opcionesVisibles.includes(idx) && (
                <button
                  key={idx}
                  className={`py-3 px-6 rounded-lg border font-semibold transition
                    ${
                      respuestaSeleccionada === idx
                        ? respuestaVerificada
                          ? idx === preguntaActual.respuestaCorrecta
                            ? "bg-green-400 text-white border-green-600"
                            : "bg-red-400 text-white border-red-600"
                          : "bg-blue-100 border-blue-400"
                        : "bg-white border-gray-300 hover:bg-blue-50"
                    }
                  `}
                  disabled={esDocente || respuestaVerificada}
                  onClick={esDocente ? undefined : () => handleSeleccion(idx)}
                  style={
                    esDocente ? { cursor: "not-allowed", opacity: 0.7 } : {}
                  }
                >
                  {opcion}
                </button>
              )
          )}
        </div>

        {/* Mensaje del amigo */}
        {!amigoPensando && mensajeAmigo && !esDocente && (
          <div className="mt-8 mb-2 w-full flex flex-col items-center">
            <div className="px-6 py-4 bg-teal-100 rounded-xl shadow-lg text-lg font-bold text-teal-800 border border-teal-400">
              {mensajeAmigo}
            </div>
          </div>
        )}

        {/* Feedback solo para estudiantes */}
        {respuestaVerificada && !esDocente && (
          <div className="mt-8 text-lg font-bold relative">
            {respuestaSeleccionada === preguntaActual.respuestaCorrecta ? (
              <span
                className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-5xl text-green-700 font-extrabold pointer-events-none select-none animate-[zoomOut_1.8s_ease-in-out]`}
                style={{
                  textShadow: "0 2px 16px #10b981, 0 2px 32px #10b98177",
                  animationName: "zoomOut",
                }}
              >
                ¡Correcto!
              </span>
            ) : (
              <span className="text-2xl text-red-700 font-bold">
                Respuesta incorrecta
              </span>
            )}
          </div>
        )}

        {/* Si es docente, mensaje fijo */}
        {esDocente && (
          <div className="mt-8 mb-2 w-full flex flex-col items-center">
            <div className="px-6 py-3 bg-blue-50 rounded-xl shadow text-base text-blue-700 border border-blue-200">
              Observa la pregunta y controla el avance desde tu panel. <br />
              (Solo estudiantes pueden responder y sumar puntaje)
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes zoomOut {
          0% {
            opacity: 0;
            transform: scale(0.2) translate(-50%, -50%);
          }
          20% {
            opacity: 1;
            transform: scale(1.3) translate(-50%, -50%);
          }
          60% {
            opacity: 1;
            transform: scale(1) translate(-50%, -50%);
          }
          100% {
            opacity: 0;
            transform: scale(1.6) translate(-50%, -50%);
          }
        }
      `}</style>
    </div>
  );
}

export default PantallaJuego;
