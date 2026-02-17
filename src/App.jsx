import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Lazy load para que cargue más rápido
const ResumenGeneral = lazy(() => import("./componentes/ResumenGeneral"));
import BarraNavegacion from "./componentes/BarraNavegacion";
import PiePagina from "./componentes/PiePagina";
import AltaIngreso from "./componentes/AltaIngreso";
import AltaEgreso from "./componentes/AltaEgreso";
import RegistrarDeuda from "./componentes/RegistrarDeuda";
import Informes from "./componentes/Informes";
import Descripciones from "./componentes/Descripciones";
import Login from "./componentes/Login";  // ← NUEVO
import ProtectedRoute from "./componentes/ProtectedRoute";  // ← NUEVO
import { DeudasProvider } from './context/DeudasContext';
import ScrollToTop from "./componentes/ScrollToTop";
import { isAuthenticated } from "./utils/auth";  // ← NUEVO
//import "./App.css";

function App() {
  return (
    <Router>
      <DeudasProvider>
        <ScrollToTop />
        
        <Routes>
          {/* ======================== */}
          {/* RUTA PÚBLICA: LOGIN */}
          {/* ======================== */}
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? <Navigate to="/" replace /> : <Login />
            } 
          />

          {/* ======================== */}
          {/* RUTAS PROTEGIDAS */}
          {/* ======================== */}
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <div className="app-container" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                  {/* Barra de navegación */}
                  <BarraNavegacion />
                  
                  {/* Contenido principal */}
                  <div style={{ flex: 1, minHeight: 'calc(100vh - 150px)' }}>
                    <Suspense fallback={<div style={{padding: '40px', textAlign: 'center'}}>Cargando...</div>}>
                      <Routes>
                        <Route path="/" element={<ResumenGeneral />} />
                        <Route path="/alta-ingreso" element={<AltaIngreso />} />
                        <Route path="/alta-egreso" element={<AltaEgreso />} />
                        <Route path="/registrar-deuda" element={<RegistrarDeuda />} />
                        <Route path="/descripciones" element={<Descripciones />} />
                        <Route path="/informes" element={<Informes />} />
                      </Routes>
                    </Suspense>  
                  </div>
                  
                  {/* Pie de página */}
                  <PiePagina />
                </div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </DeudasProvider>
    </Router>
  );
}

export default App;