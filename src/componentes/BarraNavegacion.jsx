import React, { useState } from 'react';
import './BarraNavegacion.css';
import { Link, useLocation } from 'react-router-dom';

function BarraNavegacion() {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => {
    setMenuAbierto(!menuAbierto);
  };

  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo" onClick={cerrarMenu}>
        <img src="/logo.png" alt="KairosFin" className="logo-img" />
      </Link>

      {/* Botón hamburguesa (solo visible en móvil) */}
      <button 
        className={`hamburger ${menuAbierto ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Menú"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Enlaces de navegación */}
      <div className={`navbar-links ${menuAbierto ? 'open' : ''}`}>
        <Link 
          to="/" 
          className={location.pathname === "/" ? "active" : ""}
          onClick={cerrarMenu}
        >
          Inicio
        </Link>
        <Link 
          to="/alta-ingreso" 
          className={location.pathname === "/alta-ingreso" ? "active" : ""}
          onClick={cerrarMenu}
        >
          Ingresos
        </Link>
        <Link 
          to="/alta-egreso" 
          className={location.pathname === "/alta-egreso" ? "active" : ""}
          onClick={cerrarMenu}
        >
          Egresos
        </Link>
        <Link 
          to="/registrar-deuda" 
          className={location.pathname === "/registrar-deuda" ? "active" : ""}
          onClick={cerrarMenu}
        >
          Deudas
        </Link>
        <Link 
          to="/descripciones" 
          className={location.pathname === "/descripciones" ? "active" : ""}
          onClick={cerrarMenu}
        >
          Descripciones
        </Link>
        <Link 
          to="/informes" 
          className={location.pathname === "/informes" ? "active" : ""}
          onClick={cerrarMenu}
        >
          Informes
        </Link>
      </div>
    </nav>
  );
}

export default BarraNavegacion;