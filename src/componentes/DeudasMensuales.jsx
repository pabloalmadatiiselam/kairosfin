import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import axios from 'axios';
import './Deudas.css';

const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DeudasMensuales = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/resumen-general');
        const pagadas = response.data.barras_deudas_mensual.pagadas;
        const pendientes = response.data.barras_deudas_mensual.pendientes;

        // Combinamos pagadas y pendientes en un solo array por mes
        const dataMap = {};

        pagadas.forEach(item => {
          const mes = item.mes;
          if (!dataMap[mes]) dataMap[mes] = { mes: monthNames[mes - 1], pagado: 0, pendiente: 0 };
          dataMap[mes].pagado = item.total;
        });

        pendientes.forEach(item => {
          const mes = item.mes;
          if (!dataMap[mes]) dataMap[mes] = { mes: monthNames[mes - 1], pagado: 0, pendiente: 0 };
          dataMap[mes].pendiente = item.total;
        });

        const finalData = Object.values(dataMap).sort((a, b) =>
          monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes)
        );

        setData(finalData);
      } catch (error) {
        console.error('Error al obtener las deudas mensuales:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="deuda-card">
      <h3 className="deuda-title">Deudas Mensuales</h3>
      <div className="deuda-chart-wrapper">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="pagado" fill="#4caf50" name="Pagado" />
          <Bar dataKey="pendiente" fill="#f44336" name="Pendiente" />
        </BarChart>
      </div>
    </div>
  );
};

export default DeudasMensuales;