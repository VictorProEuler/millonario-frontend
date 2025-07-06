import { useState, useRef, useEffect } from "react";
import preguntas from "./data/preguntas";
import PantallaInicio from "./components/PantallaInicio";
import FinDelJuego from "./components/FinDelJuego";
import PantallaJuego from "./components/PantallaJuego";
import { guardarPuntaje, escucharRanking } from "./services/rankingService";
import {
  inicializarSala,
  escucharEstadoSala,
  actualizarEstadoSala,
} from "./services/salaService";
import ModalRanking from "./components/ModalRanking";

function App() {
  const [nombre, setNombre] = useState("");
  const [juegoIniciado, setJuegoIniciado] = useState(false);
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
  const [codigoSala, setCodigoSala] = useState("");
  const [ranking, setRanking] = useState([]);
  const [estadoSala, setEstadoSala] = useState(null); // <--- Estado sincronizado de sala
  const [mostrarRankingParcial, setMostrarRankingParcial] = useState(false);
  const [rankingParcial, setRankingParcial] = useState([]);

  // Timer y sonidos
  const [segundos, setSegundos] = useState(15);
  const timerRef = useRef(null);
  const timerAudioRef = useRef(null);
  const transicionAudioRef = useRef(null);

  // Normalización de sala
  function normalizarSala(codigo) {
    return codigo.trim().toUpperCase();
  }

  // Sonidos de acierto/fallo
  const playSound = (tipo) => {
    const audio = new window.Audio(
      tipo === "acierto" ? "/sonidos/acierto.mp3" : "/sonidos/fallo.mp3"
    );
    audio.play();
  };

  // Sonido de transición al iniciar cada pregunta
  useEffect(() => {
    if (
      juegoIniciado &&
      !juegoTerminado &&
      estadoSala?.preguntaActual !== undefined
    ) {
      if (transicionAudioRef.current) {
        transicionAudioRef.current.pause();
        transicionAudioRef.current.currentTime = 0;
      }
      transicionAudioRef.current = new window.Audio("/sonidos/transicion.mp3");
      transicionAudioRef.current.play().catch(() => {});
    }
  }, [estadoSala?.preguntaActual, juegoIniciado, juegoTerminado]);

  // Timer visible y sonido
  useEffect(() => {
    if (juegoIniciado && !juegoTerminado && !respuestaVerificada) {
      setSegundos(15);
      if (timerAudioRef.current) {
        timerAudioRef.current.pause();
        timerAudioRef.current.currentTime = 0;
      }
      timerAudioRef.current = new window.Audio("/sonidos/timer.mp3");
      timerAudioRef.current.loop = true;
      timerAudioRef.current.play().catch(() => {});

      timerRef.current = setInterval(() => {
        setSegundos((prev) => {
          if (prev > 1) return prev - 1;
          else {
            clearInterval(timerRef.current);
            timerAudioRef.current.pause();
            timerAudioRef.current.currentTime = 0;
            setRespuestaVerificada(true);
            return 0;
          }
        });
      }, 1000);
    }
    return () => {
      clearInterval(timerRef.current);
      if (timerAudioRef.current) {
        timerAudioRef.current.pause();
        timerAudioRef.current.currentTime = 0;
      }
    };
  }, [
    estadoSala?.preguntaActual,
    juegoIniciado,
    juegoTerminado,
    respuestaVerificada,
  ]);

  // Ranking en tiempo real (al finalizar)
  useEffect(() => {
    if (juegoTerminado) {
      const sala = normalizarSala(codigoSala);
      guardarPuntaje(nombre, puntaje, sala);
      const unsubscribe = escucharRanking(setRanking, sala);
      return () => unsubscribe && unsubscribe();
    }
  }, [juegoTerminado, nombre, puntaje, codigoSala]);

  // Escucha el estado de sala en tiempo real (preguntaActual)
  useEffect(() => {
    if (codigoSala.trim() !== "") {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharEstadoSala(sala, setEstadoSala);
      return () => unsubscribe && unsubscribe();
    }
  }, [codigoSala]);

  // Efecto para escuchar el ranking parcial
  useEffect(() => {
    if (juegoIniciado && !juegoTerminado && codigoSala.trim() !== "") {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharRanking(setRankingParcial, sala);
      return () => unsubscribe && unsubscribe();
    }
  }, [juegoIniciado, juegoTerminado, codigoSala]);

  // Avanzar a la siguiente pregunta (solo el profe)
  const avanzarPregunta = () => {
    if (!estadoSala) return;
    if (estadoSala.preguntaActual + 1 < preguntas.length) {
      actualizarEstadoSala(normalizarSala(codigoSala), {
        ...estadoSala,
        preguntaActual: estadoSala.preguntaActual + 1,
      });
      guardarPuntaje(nombre, puntaje, normalizarSala(codigoSala)); // <-- AGREGA ESTA LÍNEA AQUÍ
    } else {
      // Fin del juego
      actualizarEstadoSala(normalizarSala(codigoSala), {
        ...estadoSala,
        preguntaActual: estadoSala.preguntaActual + 1,
        fase: "finalizado",
      });
      guardarPuntaje(nombre, puntaje, normalizarSala(codigoSala)); //<-- Y AQUÍ TAMBIÉN
      setJuegoTerminado(true);
    }
    setRespuestaSeleccionada(null);
    setRespuestaVerificada(false);
    setUsado5050(false);
    setOpcionesVisibles([0, 1, 2, 3]);
    setUsadoAmigo(false);
    setMensajeAmigo(null);
    setAmigoPensando(false);
  };

  // Lógica 50/50
  const usar5050 = () => {
    if (usado5050) return;
    setUsado5050(true);
    const preguntaActualIdx = estadoSala?.preguntaActual ?? 0;
    const incorrectas = preguntas[preguntaActualIdx].opciones
      .map((_, idx) => idx)
      .filter((idx) => idx !== preguntas[preguntaActualIdx].respuestaCorrecta);
    const idxAleatorio =
      incorrectas[Math.floor(Math.random() * incorrectas.length)];
    setOpcionesVisibles(
      [preguntas[preguntaActualIdx].respuestaCorrecta, idxAleatorio].sort()
    );
  };

  // Lógica comodín "preguntar a un amigo"
  const usarAmigo = () => {
    if (usadoAmigo) return;
    setUsadoAmigo(true);
    setAmigoPensando(true);
    setMensajeAmigo(null);
    const preguntaActualIdx = estadoSala?.preguntaActual ?? 0;
    setTimeout(() => {
      setAmigoPensando(false);
      const acierta = Math.random() < 0.7;
      const idxSugerido = acierta
        ? preguntas[preguntaActualIdx].respuestaCorrecta
        : [0, 1, 2, 3].filter(
            (idx) => idx !== preguntas[preguntaActualIdx].respuestaCorrecta
          )[Math.floor(Math.random() * 3)];
      setMensajeAmigo(
        `🤔 Tu amigo piensa que la respuesta es: "${preguntas[preguntaActualIdx].opciones[idxSugerido]}".`
      );
    }, 1500);
  };

  // Puntuación proporcional al tiempo
  const calcularPuntaje = () => {
    if (segundos > 12) return 1000;
    if (segundos > 9) return 900;
    if (segundos > 6) return 800;
    if (segundos > 3) return 600;
    if (segundos > 0) return 400;
    return 200;
  };

  // Al seleccionar respuesta
  const handleSeleccion = (idx) => {
    setRespuestaSeleccionada(idx);
    setRespuestaVerificada(true);
    const preguntaActualIdx = estadoSala?.preguntaActual ?? 0;
    if (idx === preguntas[preguntaActualIdx].respuestaCorrecta) {
      playSound("acierto");
      setMostrarAnimacion(true);
      setPuntaje((p) => p + calcularPuntaje());
      setTimeout(() => setMostrarAnimacion(false), 1200);
    } else {
      playSound("fallo");
    }
    // Aquí ya no avanzas localmente la pregunta. El profe debe pulsar "Siguiente".
  };

  // Antes de iniciar
  if (!juegoIniciado) {
    return (
      <PantallaInicio
        nombre={nombre}
        setNombre={setNombre}
        codigoSala={codigoSala}
        setCodigoSala={setCodigoSala}
        onIniciar={() => {
          if (nombre.trim() !== "" && codigoSala.trim() !== "") {
            inicializarSala(normalizarSala(codigoSala), "profesor");
            setJuegoIniciado(true);
          }
        }}
      />
    );
  }

  // Si no hay estado de sala aún, loader
  if (!estadoSala) {
    return <div>Cargando sala...</div>;
  }

  // Fin del juego
  if (estadoSala.fase === "finalizado" || juegoTerminado) {
    return (
      <FinDelJuego
        nombre={nombre}
        puntaje={puntaje}
        ranking={ranking}
        onReiniciar={() => {
          setJuegoIniciado(false);
          setRespuestaSeleccionada(null);
          setRespuestaVerificada(false);
          setUsado5050(false);
          setOpcionesVisibles([0, 1, 2, 3]);
          setUsadoAmigo(false);
          setMensajeAmigo(null);
          setAmigoPensando(false);
          setPuntaje(0);
          setJuegoTerminado(false);
          setRanking([]);
        }}
      />
    );
  }

  // ---- Esto va JUSTO aquí, dentro del cuerpo de la función y antes del return ----
  const preguntaActualIdx = estadoSala.preguntaActual ?? 0;
  const preguntaActual = preguntas[preguntaActualIdx];
  if (!preguntaActual) {
    return <div>Cargando pregunta...</div>;
  }
  // -------------------------------------------------------------------------------

  // Normaliza nombre actual
  const nombreNormalizado = nombre.trim().toLowerCase();

  // Copia del ranking parcial y actualiza o inserta el puntaje actual
  let rankingVisible = [...rankingParcial];
  const idx = rankingVisible.findIndex(
    (item) => item.nombre.trim().toLowerCase() === nombreNormalizado
  );

  if (idx >= 0) {
    rankingVisible[idx].puntaje = puntaje;
  } else {
    rankingVisible.push({ nombre, puntaje });
  }

  rankingVisible.sort((a, b) => b.puntaje - a.puntaje);

  return (
    <div>
      <PantallaJuego
        puntaje={puntaje}
        segundos={segundos}
        mostrarAnimacion={mostrarAnimacion}
        amigoPensando={amigoPensando}
        preguntaActual={preguntaActual}
        indicePregunta={preguntaActualIdx}
        respuestaSeleccionada={respuestaSeleccionada}
        respuestaVerificada={respuestaVerificada}
        opcionesVisibles={opcionesVisibles}
        usado5050={usado5050}
        usar5050={usar5050}
        usadoAmigo={usadoAmigo}
        usarAmigo={usarAmigo}
        mensajeAmigo={mensajeAmigo}
        handleSeleccion={handleSeleccion}
      />

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={avanzarPregunta}
          style={{
            padding: "12px 28px",
            fontSize: "18px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "10px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 12px #c7d2fe",
          }}
        >
          Siguiente pregunta
        </button>
        <button
          onClick={() => setMostrarRankingParcial(true)}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            background: "#0ea5e9",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer",
            marginLeft: "20px",
          }}
        >
          Ver ranking parcial
        </button>
      </div>

      <ModalRanking
        visible={mostrarRankingParcial}
        ranking={rankingVisible}
        onClose={() => setMostrarRankingParcial(false)}
        titulo="Ranking parcial"
      />
    </div>
  );
}

export default App;
