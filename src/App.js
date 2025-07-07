import { useState, useRef, useEffect } from "react";
import preguntas from "./data/preguntas";
import PantallaInicio from "./components/PantallaInicio";
import FinDelJuego from "./components/FinDelJuego";
import PantallaJuego from "./components/PantallaJuego";
import { escucharRanking } from "./services/rankingService";
import {
  inicializarSala,
  escucharEstadoSala,
  actualizarEstadoSala,
  registrarEstudiante,
  escucharEstudiantes,
  guardarRespuesta,
  asignarCerosSiNoRespondieron,
} from "./services/salaService";
import ModalRanking from "./components/ModalRanking";
import PantallaSeleccionRol from "./components/PantallaSeleccionRol";
import PanelDocente from "./components/PanelDocente";

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
  const [estadoSala, setEstadoSala] = useState(null);
  const [mostrarRankingParcial, setMostrarRankingParcial] = useState(false);
  const [rankingParcial, setRankingParcial] = useState([]);
  const [rol, setRol] = useState(null);
  const [listaEstudiantes, setListaEstudiantes] = useState([]); // para panel docente

  const [segundos, setSegundos] = useState(15);
  const timerRef = useRef(null);
  const timerAudioRef = useRef(null);
  const transicionAudioRef = useRef(null);

  function normalizarSala(codigo) {
    return codigo.trim().toUpperCase();
  }

  const playSound = (tipo) => {
    const audio = new window.Audio(
      tipo === "acierto" ? "/sonidos/acierto.mp3" : "/sonidos/fallo.mp3"
    );
    audio.play();
  };

  // ---- SELECCIÓN Y REGISTRO DE RESPUESTA ----
  const handleSeleccion = async (idx) => {
    setRespuestaSeleccionada(idx);
    setRespuestaVerificada(true);
    const preguntaActualIdx = estadoSala?.preguntaActual ?? 0;

    const puntajeObtenido =
      idx === preguntas[preguntaActualIdx].respuestaCorrecta
        ? calcularPuntaje()
        : 0;

    if (rol === "estudiante") {
      await guardarRespuesta(
        normalizarSala(codigoSala),
        nombre,
        preguntaActualIdx,
        idx,
        puntajeObtenido
      );
    }

    if (idx === preguntas[preguntaActualIdx].respuestaCorrecta) {
      playSound("acierto");
      setMostrarAnimacion(true);
      setPuntaje((p) => p + puntajeObtenido);
      setTimeout(() => setMostrarAnimacion(false), 1200);
    } else {
      playSound("fallo");
    }
  };

  // ---- AVANZAR PREGUNTA (docente) ----
  const avanzarPregunta = async () => {
    if (!estadoSala) return;
    const indicePregunta = estadoSala.preguntaActual;

    // Asignar 0 a los que no respondieron la pregunta actual
    await asignarCerosSiNoRespondieron(
      normalizarSala(codigoSala),
      indicePregunta
    );

    // Luego avanza la pregunta
    if (indicePregunta + 1 < preguntas.length) {
      actualizarEstadoSala(normalizarSala(codigoSala), {
        ...estadoSala,
        preguntaActual: indicePregunta + 1,
      });
    } else {
      actualizarEstadoSala(normalizarSala(codigoSala), {
        ...estadoSala,
        preguntaActual: indicePregunta + 1,
        fase: "finalizado",
      });
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

  const calcularPuntaje = () => {
    if (segundos > 12) return 1000;
    if (segundos > 9) return 900;
    if (segundos > 6) return 800;
    if (segundos > 3) return 600;
    if (segundos > 0) return 400;
    return 200;
  };

  // ---- useEffect para escuchar estudiantes en la sala (solo docente) ----
  useEffect(() => {
    if (rol === "docente" && juegoIniciado && codigoSala.trim() !== "") {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharEstudiantes(sala, (estudiantes) => {
        setListaEstudiantes(estudiantes.map((e) => e.nombre));
      });
      return () => unsubscribe && unsubscribe();
    }
  }, [rol, juegoIniciado, codigoSala]);

  // --- Efecto para resetear estados de respuesta al cambiar de pregunta (arregla avance de preguntas) ---
  useEffect(() => {
    if (
      juegoIniciado &&
      !juegoTerminado &&
      estadoSala?.fase === "jugando" &&
      rol === "estudiante"
    ) {
      setRespuestaSeleccionada(null);
      setRespuestaVerificada(false);
      setUsado5050(false);
      setOpcionesVisibles([0, 1, 2, 3]);
      setUsadoAmigo(false);
      setMensajeAmigo(null);
      setAmigoPensando(false);
      setSegundos(15);
    }
  }, [
    estadoSala?.preguntaActual,
    estadoSala?.fase,
    juegoIniciado,
    juegoTerminado,
    rol,
  ]);

  // ---- Efecto para reproducir transición de pregunta ----
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

  // ---- Efecto para manejar cronómetro ----
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
            if (respuestaSeleccionada !== null) {
              setRespuestaVerificada(true);
            }
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
    respuestaSeleccionada,
  ]);

  // ---- Efecto para ranking al terminar ----
  useEffect(() => {
    if (juegoTerminado) {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharRanking(setRanking, sala);
      return () => unsubscribe && unsubscribe();
    }
  }, [juegoTerminado, codigoSala]);

  // ---- Efecto para escuchar estado de sala ----
  useEffect(() => {
    if (codigoSala.trim() !== "") {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharEstadoSala(sala, setEstadoSala);
      return () => unsubscribe && unsubscribe();
    }
  }, [codigoSala]);

  // ---- Efecto para ranking parcial en tiempo real (también para el docente) ----
  useEffect(() => {
    if (
      juegoIniciado &&
      estadoSala?.fase === "jugando" &&
      codigoSala.trim() !== ""
    ) {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharRanking(setRankingParcial, sala);
      return () => unsubscribe && unsubscribe();
    }
  }, [juegoIniciado, estadoSala?.fase, codigoSala]);

  // --- CONTROL DE FASES Y PANTALLAS ---

  if (!rol) {
    return <PantallaSeleccionRol onSeleccion={setRol} />;
  }

  if (!juegoIniciado) {
    return (
      <PantallaInicio
        nombre={nombre}
        setNombre={setNombre}
        codigoSala={codigoSala}
        setCodigoSala={setCodigoSala}
        esDocente={rol === "docente"}
        onIniciar={() => {
          if (nombre.trim() !== "" && codigoSala.trim() !== "") {
            const sala = normalizarSala(codigoSala);
            if (rol === "docente") {
              inicializarSala(sala, "profesor");
            } else if (rol === "estudiante") {
              registrarEstudiante(sala, nombre);
            }
            setJuegoIniciado(true);
          }
        }}
      />
    );
  }

  if (!estadoSala) {
    return <div>Cargando sala...</div>;
  }

  // --- Si la sala está esperando y eres docente, muestra PanelDocente ---
  if (rol === "docente" && estadoSala.fase === "esperando") {
    return (
      <PanelDocente
        codigoSala={codigoSala}
        estudiantes={listaEstudiantes}
        onIniciarPartida={() => {
          actualizarEstadoSala(normalizarSala(codigoSala), {
            ...estadoSala,
            fase: "jugando",
            preguntaActual: 0,
          });
        }}
      />
    );
  }

  // --- Si la sala está esperando y eres estudiante, muestra mensaje de espera ---
  if (rol === "estudiante" && estadoSala.fase === "esperando") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">
          Esperando a que el docente inicie la partida...
        </h2>
        <p className="text-gray-500">No cierres esta ventana.</p>
      </div>
    );
  }

  if (estadoSala.fase === "finalizado" || juegoTerminado) {
    const nombreDocente = rol === "docente" ? nombre.trim().toLowerCase() : "";
    const rankingFiltrado = ranking.filter(
      (item) => item.nombre.trim().toLowerCase() !== nombreDocente
    );
    return (
      <FinDelJuego
        nombre={nombre}
        puntaje={puntaje}
        ranking={rankingFiltrado}
        esDocente={rol === "docente"}
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

  const preguntaActualIdx = estadoSala.preguntaActual ?? 0;
  const preguntaActual = preguntas[preguntaActualIdx];
  if (!preguntaActual) {
    return <div>Cargando pregunta...</div>;
  }

  const nombreDocente = rol === "docente" ? nombre.trim().toLowerCase() : "";
  let rankingVisible = [...rankingParcial].filter(
    (item) => item.nombre.trim().toLowerCase() !== nombreDocente
  );
  if (rol === "estudiante") {
    const nombreNormalizado = nombre.trim().toLowerCase();
    const idx = rankingVisible.findIndex(
      (item) => item.nombre.trim().toLowerCase() === nombreNormalizado
    );
    if (idx >= 0) {
      rankingVisible[idx].puntaje = puntaje;
    } else {
      rankingVisible.push({ nombre, puntaje });
    }
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
        esDocente={rol === "docente"}
      />

      {rol === "docente" && (
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
      )}

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
