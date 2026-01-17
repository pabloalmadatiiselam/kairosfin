import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import HeroPortada, { scrollToTop } from './HeroPortada';
import "./ResumenGeneral.css";
import Select from 'react-select';

const colores = ["#4caf50", "#f44336"]; // Ingresos(verde) / Egresos(rojo)

const formatearMes = (mes) => {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return meses[mes - 1] || mes;
};

export default function ResumenGeneral() {
  const [datos, setDatos] = useState(null);
  const [mostrarBotonVolver, setMostrarBotonVolver] = useState(false);  // ← NUEVO
  // Estados para selector de año
  const anioActual = new Date().getFullYear();
  const [anioSeleccionado, setAnioSeleccionado] = useState(anioActual);
  const [aniosDisponibles, setAniosDisponibles] = useState([]);

  // ✅ NUEVO: Detectar si está en la portada o en los gráficos
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Mostrar botón solo si está más allá de la primera pantalla (portada)
      if (scrollPosition > windowHeight * 0.8) {
        setMostrarBotonVolver(true);
      } else {
        setMostrarBotonVolver(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Ejecutar al montar

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cargar años disponibles (solo una vez al montar)
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/anios-disponibles`)
      .then((res) => setAniosDisponibles(res.data))
      .catch((err) => {
        console.error("Error al obtener años:", err);
        // Si falla, al menos mostrar el año actual
        setAniosDisponibles([anioActual]);
      });
  }, [anioActual]);

  // Cargar datos del año seleccionado (cada vez que cambia el año)
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/resumen-general/${anioSeleccionado}`)
      .then((res) => setDatos(res.data))
      .catch((err) => console.error("Error al obtener resumen:", err));
  }, [anioSeleccionado]);

  if (!datos) {
    return (
      <div className="rg-container">
        <h2 className="rg-title">Resumen general</h2>        
        <p>Cargando resumen...</p>
      </div>
    );
  }

  // ---- Transformaciones ----
  const datosIE = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const ingreso = datos.barras_ingresos_egresos_mensual.ingresos.find((m) => m.mes === mes)?.total || 0;
    const egreso = datos.barras_ingresos_egresos_mensual.egresos.find((m) => m.mes === mes)?.total || 0;
    return { mes: formatearMes(mes), Ingresos: ingreso, Egresos: egreso };
  });

  const datosDeudas = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const pagadas = datos.barras_deudas_mensual.pagadas.find((m) => m.mes === mes)?.total || 0;
    const pendientes = datos.barras_deudas_mensual.pendientes.find((m) => m.mes === mes)?.total || 0;
    return { mes: formatearMes(mes), Pagadas: pagadas, Pendientes: pendientes };
  });

  const tortaIngresosEgresos = [
    { name: "Ingresos", value: datos.torta_ingresos_egresos_anual.ingresos },
    { name: "Egresos", value: datos.torta_ingresos_egresos_anual.egresos },
  ];

  const tortaDeudas = [
    { name: "Pagadas", value: datos.torta_deudas_anual.pagadas },
    { name: "Pendientes", value: datos.torta_deudas_anual.pendientes },
  ];

  // ---- Render ----
  return (
    <>
      {/* ✅ PORTADA HERO */}
      <HeroPortada 
        anioSeleccionado={anioSeleccionado}
        aniosDisponibles={aniosDisponibles}
        anioActual={anioActual}
        onAnioChange={setAnioSeleccionado}
      />
      <div className="rg-container">       
        {/* PAREJA 1: Ingresos/Egresos */}
        <section id="seccion-ingresos-egresos" className="rg-pair">
          {mostrarBotonVolver && (
            <button onClick={scrollToTop} className="btn-volver-inicio">
              ↑ Volver al inicio
            </button>
          )}
          <div className="rg-card">
            <h3 className="rg-card-title">Ingresos y egresos — Anual</h3>
            <div className="rg-chart rg-chart--pie">
          <ResponsiveContainer width="100%" height={370}>
              <PieChart margin={{ top: 8, right: 16, bottom: 40, left: 16 }}>
                <Pie
                  data={tortaIngresosEgresos}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={90}
                  labelLine={true} // rayita que conecta
                  label={({ cx, cy, midAngle, outerRadius, name, value }) => {
                    const RADIAN = Math.PI / 180;
                    const offset = 22; // distancia del texto hacia afuera
                    let x = cx + (outerRadius + offset) * Math.cos(-midAngle * RADIAN);
                    let y = cy + (outerRadius + offset) * Math.sin(-midAngle * RADIAN);

                    // --- AJUSTE PEQUEÑO: si la etiqueta queda debajo del centro,
                    //     la movemos un poco hacia arriba para no pegarla a la leyenda ---
                    const distanceBelowCenter = y - cy;
                    if (distanceBelowCenter > outerRadius * 0.22) {
                      y -= 4; // valor pequeño y seguro; aumentalo en 4-8px si querés más separación
                    }

                    return (
                      <text
                        x={x}
                        y={y}
                        fill={colores[tortaIngresosEgresos.indexOf(tortaIngresosEgresos.find(item => item.name === name))]}
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                        fontSize={13}
                        fontWeight="bold"
                      >
                        ${Number(value).toLocaleString('es-AR')}
                      </text>
                    );
                  }}
                >
                  {tortaIngresosEgresos.map((_, i) => (
                    <Cell key={`cell-ie-${i}`} fill={colores[i % colores.length]} />
                  ))}
                </Pie>

                <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]} />

                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  iconType="square"
                  wrapperStyle={{ width: "100%", textAlign: "center"}} 
                  height={24}               
                />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div className="rg-card rg-card--bars">
            <h3 className="rg-card-title">Ingresos y egresos mensuales</h3>
            <div className="rg-chart rg-chart--bars">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosIE}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    interval={0}
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]} />              
                  <Legend height={24} />
                  <Bar dataKey="Ingresos" fill="#4caf50" />
                  <Bar dataKey="Egresos" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* PAREJA 2: Deudas */}
        <section id="seccion-deudas" className="rg-pair">
          {mostrarBotonVolver && (
            <button onClick={scrollToTop} className="btn-volver-inicio">
              ↑ Volver al inicio
            </button>
          )}
          <div className="rg-card">
            <h3 className="rg-card-title">Deudas — Anual</h3>
            <div className="rg-chart rg-chart--pie">
              <ResponsiveContainer width="100%" height={370}>
                <PieChart margin={{ top: 30, right: 50, bottom: 50, left: 50 }}>
                  <Pie
                    data={tortaDeudas}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="48%"
                    outerRadius={90}
                    labelLine={true}
                    label={({ cx, cy, midAngle, outerRadius, name, value }) => {
                      const RADIAN = Math.PI / 180;
                      const offset = 22; // distancia del texto hacia afuera
                      let x = cx + (outerRadius + offset) * Math.cos(-midAngle * RADIAN);
                      let y = cy + (outerRadius + offset) * Math.sin(-midAngle * RADIAN);

                      // Ajuste para evitar superposición con la leyenda
                      const distanceBelowCenter = y - cy;
                      if (distanceBelowCenter > outerRadius * 0.22) {
                        y -= 4;
                      }

                      return (
                        <text
                          x={x}
                          y={y}
                          fill={colores[tortaDeudas.indexOf(tortaDeudas.find(item => item.name === name))]}
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          fontSize={13}
                          fontWeight="bold"
                        >
                          ${Number(value).toLocaleString('es-AR')}
                        </text>
                      );
                    }}
                  >
                    {tortaDeudas.map((_, i) => (
                      <Cell key={`cell-deu-${i}`} fill={colores[i % colores.length]} />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]} />

                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="square"
                    wrapperStyle={{ width: "100%", textAlign: "center" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rg-card rg-card--bars">
            <h3 className="rg-card-title">Deudas mensuales</h3>
            <div className="rg-chart rg-chart--bars">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosDeudas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mes"
                    interval={0}
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]} />
                  <Legend />
                  <Bar dataKey="Pagadas" fill="#4caf50" />
                  <Bar dataKey="Pendientes" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}