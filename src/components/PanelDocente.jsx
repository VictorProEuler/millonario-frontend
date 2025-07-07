import React from "react";

function PanelDocente({ codigoSala, estudiantes, onIniciarPartida }) {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Estudiantes en la sala</h2>
      {estudiantes.length === 0 ? (
        <p>Aún no hay estudiantes conectados.</p>
      ) : (
        <ul>
          {estudiantes.map((nombre, idx) => (
            <li key={idx}>{nombre}</li>
          ))}
        </ul>
      )}
      <button
        onClick={onIniciarPartida}
        disabled={estudiantes.length === 0}
        style={{
          marginTop: "1.5rem",
          padding: "10px 20px",
          fontSize: "18px",
          backgroundColor: "#22c55e",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        Iniciar partida
      </button>
    </div>
  );
}

export default PanelDocente;
