import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import "./IngresosEgresos.css";  // Importar estilos existentes

function IngresosEgresosAnual() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch("`${import.meta.env.VITE_API_URL}`/movimientos")
      .then((response) => response.json())
      .then((data) => {
        const ingresos = data
          .filter((item) => item.tipo === "ingreso")
          .reduce((total, item) => total + item.monto, 0);

        const egresos = data
          .filter((item) => item.tipo === "egreso")
          .reduce((total, item) => total + item.monto, 0);

        setDatos([
          { name: "Ingresos", value: ingresos },
          { name: "Egresos", value: egresos },
        ]);
      });
  }, []);

  const colores = ["#0088FE", "#FF8042"];

  return (
    <div className="ingresos-egresos">
      <h2 className="titulo-grafico">Ingresos y Egresos por Año</h2>
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
}

export default IngresosEgresosAnual;
