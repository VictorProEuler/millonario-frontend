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
import PantallaSeleccionRol from "./components/PantallaSeleccionRol";
import { registrarEstudiante } from "./services/salaService";

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

  const avanzarPregunta = () => {
    if (!estadoSala) return;
    if (estadoSala.preguntaActual + 1 < preguntas.length) {
      actualizarEstadoSala(normalizarSala(codigoSala), {
        ...estadoSala,
        preguntaActual: estadoSala.preguntaActual + 1,
      });
      // Solo guarda puntaje si es estudiante
      if (rol === "estudiante") {
        guardarPuntaje(nombre, puntaje, normalizarSala(codigoSala));
      }
    } else {
      actualizarEstadoSala(normalizarSala(codigoSala), {
        ...estadoSala,
        preguntaActual: estadoSala.preguntaActual + 1,
        fase: "finalizado",
      });
      if (rol === "estudiante") {
        guardarPuntaje(nombre, puntaje, normalizarSala(codigoSala));
      }
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
  };

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

  useEffect(() => {
    if (juegoTerminado) {
      const sala = normalizarSala(codigoSala);
      // Solo guarda si es estudiante
      if (rol === "estudiante") {
        guardarPuntaje(nombre, puntaje, sala);
      }
      const unsubscribe = escucharRanking(setRanking, sala);
      return () => unsubscribe && unsubscribe();
    }
  }, [juegoTerminado, nombre, puntaje, codigoSala, rol]);

  useEffect(() => {
    if (codigoSala.trim() !== "") {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharEstadoSala(sala, setEstadoSala);
      return () => unsubscribe && unsubscribe();
    }
  }, [codigoSala]);

  useEffect(() => {
    if (juegoIniciado && !juegoTerminado && codigoSala.trim() !== "") {
      const sala = normalizarSala(codigoSala);
      const unsubscribe = escucharRanking(setRankingParcial, sala);
      return () => unsubscribe && unsubscribe();
    }
  }, [juegoIniciado, juegoTerminado, codigoSala]);

  // ---- Renderizado Condicional ----

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
              registrarEstudiante(sala, nombre); // ← este es el nuevo
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

  if (estadoSala.fase === "finalizado" || juegoTerminado) {
    // Filtrar ranking: NUNCA mostrar el nombre del docente
    const nombreDocente = rol === "docente" ? nombre.trim().toLowerCase() : "";
    const rankingFiltrado = ranking.filter(
      (item) => item.nombre.trim().toLowerCase() !== nombreDocente
    );

    return (
      <FinDelJuego
        nombre={nombre}
        puntaje={puntaje}
        ranking={rankingFiltrado}
        esDocente={rol === "docente"} // <--- AGREGA ESTA LÍNEA
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

  // Pregunta actual
  const preguntaActualIdx = estadoSala.preguntaActual ?? 0;
  const preguntaActual = preguntas[preguntaActualIdx];
  if (!preguntaActual) {
    return <div>Cargando pregunta...</div>;
  }

  // Ranking visible (parcial): NUNCA incluir al docente
  const nombreDocente = rol === "docente" ? nombre.trim().toLowerCase() : "";
  let rankingVisible = [...rankingParcial].filter(
    (item) => item.nombre.trim().toLowerCase() !== nombreDocente
  );
  // Si eres estudiante, agrega tu propio puntaje actualizado si es necesario
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
