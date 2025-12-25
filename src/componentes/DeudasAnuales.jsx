import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import "./Deudas.css"; // Asegurate de tener estilos correctos

const DeudasAnuales = () => {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/deudas")
      .then((response) => response.json())
      .then((data) => {
        const pagadas = data
          .filter((item) => item.estado === "pagado")
          .reduce((total, item) => total + parseFloat(item.monto), 0);

        const pendientes = data
          .filter((item) => item.estado === "pendiente")
          .reduce((total, item) => total + parseFloat(item.monto), 0);

        setDatos([
          { name: "Deudas Pagadas", value: pagadas },
          { name: "Deudas Pendientes", value: pendientes },
        ]);
      })
      .catch((error) => {
        console.error("Error al obtener las deudas:", error);
      });
  }, []);

  const colores = ["#00C49F", "#FF6384"]; // Pagadas y pendientes

  return (
    <div className="deudas-anuales">
      <h2 className="titulo-grafico">Deudas Pagadas vs Pendientes</h2>
      <div className="contenedor-grafico" style={{ height: "400px" }}>
        <PieChart width={400} height={400}>
          <Pie
            dataKey="value"
            data={datos}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label
          >
            {datos.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </div>
    </div>
  );
};

export default DeudasAnuales;