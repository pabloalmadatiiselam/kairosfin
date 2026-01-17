import React from 'react';
import Select from 'react-select';
import './HeroPortada.css';

// ✅ Función FUERA del componente para poder exportarla
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function HeroPortada({ anioSeleccionado, aniosDisponibles, anioActual, onAnioChange }) {
  // Función para navegar suavemente a cada sección
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-portada">
      {/* BARRA LATERAL IZQUIERDA */}
      <aside className="hero-sidebar">
        <nav className="hero-sidebar-nav">
          <button 
            onClick={() => scrollToSection('seccion-ingresos-egresos')} 
            className="hero-sidebar-link"
          >
            <div className="sidebar-icon">📊</div>
            <span className="sidebar-text">Ing/Egr</span>
          </button>
          <button 
            onClick={() => scrollToSection('seccion-deudas')} 
            className="hero-sidebar-link"
          >
            <div className="sidebar-icon">💰</div>
            <span className="sidebar-text">Deudas</span>
          </button>
          <button 
            onClick={() => scrollToSection('pie-pagina')} 
            className="hero-sidebar-link"
          >
            <div className="sidebar-icon">📞</div>
            <span className="sidebar-text">Contacto</span>
          </button>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL DE LA PORTADA */}
      <div className="hero-content">
        {/* Logo grande */}
        <div className="hero-logo">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Barras ascendentes del logo */}
            <rect x="20" y="70" width="20" height="30" rx="3" fill="#3b82f6" opacity="0.8"/>
            <rect x="45" y="50" width="20" height="50" rx="3" fill="#3b82f6" opacity="0.9"/>
            <rect x="70" y="30" width="20" height="70" rx="3" fill="#3b82f6"/>
            {/* Flecha ascendente */}
            <path d="M85 25 L95 15 L105 25" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <line x1="95" y1="15" x2="95" y2="45" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Título principal */}
        <h1 className="hero-title">
          Kairosfin
        </h1>

        {/* Subtítulo */}
        <h2 className="hero-subtitle">
          Resumen General {anioSeleccionado}
        </h2>

        {/* Selector de año */}
        <div className="hero-selector-anio">
          <Select
            value={
              anioSeleccionado === anioActual
                ? { value: anioSeleccionado, label: `${anioSeleccionado} (Actual)` }
                : { value: anioSeleccionado, label: String(anioSeleccionado) }
            }
            onChange={(opcion) => onAnioChange(opcion.value)}
            options={aniosDisponibles.map(anio => ({
              value: anio,
              label: anio === anioActual ? `${anio} (Actual)` : String(anio)
            }))}
            isSearchable={false}
            placeholder="Seleccionar año"
            styles={{
              control: (base) => ({
                ...base,
                minWidth: '200px',
                maxWidth: '250px',
                fontSize: '1.1rem',
                fontWeight: '600',
                borderRadius: '10px',
                borderColor: '#cbd5e1',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                '&:hover': { 
                  borderColor: '#3b82f6',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }
              }),
              menu: (base) => ({
                ...base,
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused ? '#e0f2fe' : 'white',
                color: '#1e293b',
                fontWeight: state.isSelected ? '700' : '500',
                cursor: 'pointer',
                '&:active': {
                  backgroundColor: '#bfdbfe'
                }
              }),
              singleValue: (base) => ({
                ...base,
                color: '#1e293b',
                fontWeight: '600'
              }),
              dropdownIndicator: (base) => ({
                ...base,
                color: '#3b82f6',
                '&:hover': {
                  color: '#2563eb'
                }
              }),
              indicatorSeparator: () => ({
                display: 'none'
              })
            }}
          />
        </div>
        {/* Descripción */}
        <p className="hero-description">
          Ingresos, egresos y deudas al instante,<br />
          siempre actualizados.
        </p>
      </div>
    </section>
  );
}

export default HeroPortada;
export { scrollToTop }; // ✅ Exportar la función que está fuera