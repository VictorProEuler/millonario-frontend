import React from "react";

function PantallaSeleccionRol({ onSeleccion }) {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h2>¿Cómo deseas ingresar?</h2>
      <button
        onClick={() => onSeleccion("docente")}
        style={{
          margin: "18px",
          padding: "18px 40px",
          fontSize: "20px",
          background: "#2563eb",
          color: "#fff",
          borderRadius: "10px",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 12px #c7d2fe",
        }}
      >
        Soy docente
      </button>
      <button
        onClick={() => onSeleccion("estudiante")}
        style={{
          margin: "18px",
          padding: "18px 40px",
          fontSize: "20px",
          background: "#0ea5e9",
          color: "#fff",
          borderRadius: "10px",
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 12px #bae6fd",
        }}
      >
        Soy estudiante
      </button>
    </div>
  );
}

export default PantallaSeleccionRol;
