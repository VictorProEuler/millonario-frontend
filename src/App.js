import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import app from "./firebase/firebaseConfig";
import { getDatabase, ref, push, onValue } from "firebase/database";

// 5 preguntas bioquímicas
const preguntas = [
  {
    enunciado: "¿Cuál de las siguientes moléculas es considerada el principal transportador de energía en la célula?",
    opciones: ["Glucosa", "ATP", "ADN", "Colesterol"],
    respuestaCorrecta: 1
  },
  {
    enunciado: "¿Cuál de las siguientes moléculas almacena información genética?",
    opciones: ["ARN", "ATP", "ADN", "Glucógeno"],
    respuestaCorrecta: 2
  },
  {
    enunciado: "¿Cuál es la función principal de las enzimas?",
    opciones: ["Almacenar energía", "Acelerar reacciones químicas", "Formar membranas", "Transportar oxígeno"],
    respuestaCorrecta: 1
  },
  {
    enunciado: "¿Qué monosacárido es la principal fuente de energía celular?",
    opciones: ["Galactosa", "Fructosa", "Glucosa", "Ribosa"],
    respuestaCorrecta: 2
  },
  {
    enunciado: "¿En qué orgánulo ocurre la síntesis de proteínas?",
    opciones: ["Mitocondria", "Ribosoma", "Lisosoma", "Cloroplasto"],
    respuestaCorrecta: 1
  }
];

function App() {
  const [nombre, setNombre] = useState("");
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [indicePregunta, setIndicePregunta] = useState(0);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);
  const [respuestaVerificada, setRespuestaVerificada] = useState(false);
  const [mostrarAnimacion, setMostrarAnimacion] = useState(false);
  const [usado5050, setUsado5050] = useState(false);
  const [opcionesVisibles, setOpcionesVisibles] = useState([0, 1, 2, 3]);
  const [usadoAmigo, setUsadoAmigo] = useState(false);
  const [mensajeAmigo, setMensajeAmigo] = useState(null);
  const [amigoPensando, setAmigoPensando] = useState(false);
  const [puntaje, setPuntaje] = useState(0);
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [ranking, setRanking] = useState([]);

  // Escucha cambios en la lista de puntajes (ranking)
  useEffect(() => {
    const db = getDatabase(app);
    const rankingRef = ref(db, "rankingMillonario");
    const unsubscribe = onValue(rankingRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rankingArray = Object.values(data).sort((a, b) => b.puntaje - a.puntaje);
      setRanking(rankingArray);
    });
    return () => unsubscribe();
  }, []);

  // Al terminar el juego, guarda el puntaje
  useEffect(() => {
    if (juegoTerminado && nombre.trim() !== "") {
      const db = getDatabase(app);
      push(ref(db, "rankingMillonario"), {
        nombre,
        puntaje
      });
    }
  }, [juegoTerminado, nombre, puntaje]);

  const playSound = (tipo) => {
    const audio = new window.Audio(
      tipo === "acierto"
        ? "/sonidos/acierto.mp3"
        : "/sonidos/fallo.mp3"
    );
    audio.play();
  };

  // Lógica 50/50
  const usar5050 = () => {
    if (usado5050) return;
    setUsado5050(true);
    const incorrectas = preguntas[indicePregunta].opciones
      .map((_, idx) => idx)
      .filter(idx => idx !== preguntas[indicePregunta].respuestaCorrecta);
    const idxAleatorio = incorrectas[Math.floor(Math.random() * incorrectas.length)];
    setOpcionesVisibles([preguntas[indicePregunta].respuestaCorrecta, idxAleatorio].sort());
  };

  // Lógica comodín "preguntar a un amigo"
  const usarAmigo = () => {
    if (usadoAmigo) return;
    setUsadoAmigo(true);
    setAmigoPensando(true);
    setMensajeAmigo(null);
    setTimeout(() => {
      setAmigoPensando(false);
      const acierta = Math.random() < 0.7;
      const idxSugerido = acierta
        ? preguntas[indicePregunta].respuestaCorrecta
        : [0, 1, 2, 3].filter(idx => idx !== preguntas[indicePregunta].respuestaCorrecta)[Math.floor(Math.random() * 3)];
      setMensajeAmigo(
        `🤔 Tu amigo piensa que la respuesta es: "${preguntas[indicePregunta].opciones[idxSugerido]}".`
      );
    }, 1500);
  };

  // Al seleccionar respuesta
  const handleSeleccion = (idx) => {
    setRespuestaSeleccionada(idx);
    setRespuestaVerificada(true);
    if (idx === preguntas[indicePregunta].respuestaCorrecta) {
      playSound("acierto");
      setMostrarAnimacion(true);
      setPuntaje((p) => p + 1);
      setTimeout(() => setMostrarAnimacion(false), 1200);
    } else {
      playSound("fallo");
    }
    // Avanzar a la siguiente pregunta tras 1.5 segundos
    setTimeout(() => {
      if (indicePregunta + 1 < preguntas.length) {
        setIndicePregunta(indicePregunta + 1);
        setRespuestaSeleccionada(null);
        setRespuestaVerificada(false);
        setUsado5050(false);
        setOpcionesVisibles([0, 1, 2, 3]);
        setUsadoAmigo(false);
        setMensajeAmigo(null);
        setAmigoPensando(false);
      } else {
        setJuegoTerminado(true);
      }
    }, 1800);
  };

  // Antes de iniciar
  if (!juegoIniciado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-200 to-blue-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md relative">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-2 text-center">¿Quién Quiere Ser Millonario?</h1>
          <span className="absolute top-4 right-6 text-xs text-gray-400 italic select-none">
            Diseñado por Víctor Aguilar
          </span>
          <form className="mt-8 flex flex-col items-center space-y-6">
            <input
              type="text"
              className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
              placeholder="Nombre y apellido"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
            <button
              type="button"
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
              onClick={() => {
                if (nombre.trim() !== "") setJuegoIniciado(true);
              }}
              disabled={nombre.trim() === ""}
            >
              Comenzar juego
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Fin del juego
  if (juegoTerminado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-green-100 to-green-300">
        <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center">
          <h1 className="text-4xl font-extrabold text-green-700 mb-4">¡Juego terminado!</h1>
          <p className="text-xl mb-2">Jugador: <span className="font-bold">{nombre}</span></p>
          <p className="text-2xl font-bold mb-4">Puntaje: <span className="text-green-700">{puntaje} / {preguntas.length}</span></p>

          {/* Ranking en tiempo real */}
          {ranking.length > 0 && (
            <div className="mt-6 w-full">
              <h3 className="text-lg font-bold mb-2 text-center text-blue-700">Ranking en tiempo real</h3>
              <div className="bg-blue-50 rounded-lg px-4 py-2 max-h-56 overflow-y-auto shadow-inner">
                {ranking.map((jugador, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b last:border-b-0">
                    <span className="font-semibold">{jugador.nombre}</span>
                    <span className="font-mono text-blue-800">{jugador.puntaje}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="mt-8 px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition"
            onClick={() => {
              setJuegoIniciado(false);
              setIndicePregunta(0);
              setRespuestaSeleccionada(null);
              setRespuestaVerificada(false);
              setUsado5050(false);
              setOpcionesVisibles([0, 1, 2, 3]);
              setUsadoAmigo(false);
              setMensajeAmigo(null);
              setAmigoPensando(false);
              setPuntaje(0);
              setJuegoTerminado(false);
            }}
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    );
  }

  // Pregunta en curso
  const preguntaActual = preguntas[indicePregunta];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-yellow-100 to-yellow-200 relative overflow-hidden">
      {mostrarAnimacion && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      {/* Emoji GRANDE con zoom y fondo oscuro */}
      {amigoPensando && (
        <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-black bg-opacity-30">
          <span
            className="text-[8rem] font-bold animate-zoom-bounce"
            style={{
              textShadow: "0 4px 24px #06b6d4, 0 8px 48px #0ea5e966",
            }}
          >🤔</span>
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
        <h2 className="text-2xl font-bold text-yellow-700 mb-2">{`Pregunta ${indicePregunta + 1}`}</h2>
        <p className="mb-6 text-gray-800 text-center">{preguntaActual.enunciado}</p>

        {/* Botones de comodines */}
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

        {/* Opciones visibles */}
        <div className="w-full flex flex-col gap-4">
          {preguntaActual.opciones.map((opcion, idx) => (
            opcionesVisibles.includes(idx) && (
              <button
                key={idx}
                className={`py-3 px-6 rounded-lg border font-semibold transition
                  ${respuestaSeleccionada === idx
                    ? respuestaVerificada
                      ? (idx === preguntaActual.respuestaCorrecta
                        ? "bg-green-400 text-white border-green-600"
                        : "bg-red-400 text-white border-red-600")
                      : "bg-blue-100 border-blue-400"
                    : "bg-white border-gray-300 hover:bg-blue-50"
                  }
                `}
                disabled={respuestaVerificada}
                onClick={() => handleSeleccion(idx)}
              >
                {opcion}
              </button>
            )
          ))}
        </div>

        {/* Mensaje del amigo */}
        {(!amigoPensando && mensajeAmigo) && (
          <div className="mt-8 mb-2 w-full flex flex-col items-center">
            <div className="px-6 py-4 bg-teal-100 rounded-xl shadow-lg text-lg font-bold text-teal-800 border border-teal-400">
              {mensajeAmigo}
            </div>
          </div>
        )}

        {respuestaVerificada && (
          <div className="mt-8 text-lg font-bold relative">
            {respuestaSeleccionada === preguntaActual.respuestaCorrecta ? (
              <span
                className={`absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 text-5xl text-green-700 font-extrabold pointer-events-none select-none animate-[zoomOut_1.8s_ease-in-out]`}
                style={{
                  textShadow: "0 2px 16px #10b981, 0 2px 32px #10b98177",
                  animationName: "zoomOut"
                }}
              >
                ¡Correcto!
              </span>
            ) : (
              <span className="text-2xl text-red-700 font-bold">Respuesta incorrecta</span>
            )}
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

export default App;
