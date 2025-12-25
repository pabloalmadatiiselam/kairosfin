import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BarraNavegacion from "./componentes/BarraNavegacion";
import PiePagina from "./componentes/PiePagina";
import ResumenGeneral from "./componentes/ResumenGeneral";
import AltaIngreso from "./componentes/AltaIngreso";
import AltaEgreso from "./componentes/AltaEgreso";
import RegistrarDeuda from "./componentes/RegistrarDeuda";
import Informes from "./componentes/Informes"
import { DeudasProvider } from './context/DeudasContext';
import Descripciones from "./componentes/Descripciones";
import ScrollToTop from "./componentes/ScrollToTop";
//import "./App.css";

function App() {
  return (
    <Router>
      {/* PASO CRÍTICO: Envolver TODA la aplicación con el Provider */}
      {/* EXPLICACIÓN: Esto hace que el contexto esté disponible en TODOS los componentes */}
      <DeudasProvider>
        <ScrollToTop />  {/* ← AGREGAR ESTA LÍNEA */}
        <div className="app-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {/* Barra de navegación */} 
          <BarraNavegacion />
          {/* Contenido principal */}
          {/*<div style={{ flex: 1 }}>*/}
          <div style={{ flex: 1, minHeight: 'calc(100vh - 150px)' }}>            
              <Routes>
                <Route path="/" element={<ResumenGeneral />} />
                <Route path="/alta-ingreso" element={<AltaIngreso />} />
                <Route path="/alta-egreso" element={<AltaEgreso />} />
                <Route path="/registrar-deuda" element={<RegistrarDeuda />} />
                <Route path="/descripciones" element={<Descripciones />} />
                <Route path="/informes" element={<Informes />} />                
              </Routes>
          </div>
          {/* Pie de página */}
          <PiePagina />
        </div>
      </DeudasProvider>
    </Router>
  );
}

export default App;