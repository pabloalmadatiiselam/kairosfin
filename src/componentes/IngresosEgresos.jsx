import './IngresosEgresos.css';
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

function IngresosEgresos() {
  const [datosMensuales, setDatosMensuales] = useState([]);

  useEffect(() => {
  fetch("http://127.0.0.1:8000/movimientos")
    .then((response) => response.json())
    .then((data) => {
      console.log("Datos recibidos desde /movimientos:", data);

      const agrupados = {};

      data.forEach((item) => {
        const [anio, mes, dia] = item.fecha.split("-");
        const fecha = new Date(anio, mes - 1, dia); // Corrección clave
        const claveMes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

        if (!agrupados[claveMes]) {
          agrupados[claveMes] = { mes: claveMes, ingreso: 0, egreso: 0 };
        }

        if (item.tipo === "ingreso") {
          agrupados[claveMes].ingreso += parseFloat(item.monto);
        } else if (item.tipo === "egreso") {
          agrupados[claveMes].egreso += parseFloat(item.monto);
        }
      });

      const datosFormateados = Object.values(agrupados)
        .filter((mes) => mes.ingreso > 0 || mes.egreso > 0)
        .sort((a, b) => a.mes.localeCompare(b.mes));

      setDatosMensuales(datosFormateados);
    })
    .catch((error) => {
      console.error("Error al obtener los movimientos:", error);
    });
}, []);

  return (
    <div className="ingreso-chart">      
      <h3 className="chart-title">Ingresos Mensuales</h3>
        <div className="chart-wrapper">    
          <BarChart
            data={datosMensuales}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="mes"
              angle={-45}
              textAnchor="end"
              interval={0}
              height={80}
            />
            <YAxis />
            <Tooltip />
            <Legend verticalAlign="top" />
            <Bar dataKey="ingreso" fill="#0088FE" name="Ingresos" />
            <Bar dataKey="egreso" fill="#FF8042" name="Egresos" />
          </BarChart>
        </div>    
    </div>
  );
}

export default IngresosEgresos;
