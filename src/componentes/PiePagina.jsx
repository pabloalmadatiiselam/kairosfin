import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PiePagina.css";

function PiePagina() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  // Función para manejar el clic en "Inicio"
  const handleInicioClick = (e) => {
    if (isHomePage) {
      // Si estamos en la página de inicio, desplazar al hero
      e.preventDefault();
      const heroElement = document.getElementById('hero-portada');
      if (heroElement) {
        heroElement.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Si estamos en otra página, navegar a la raíz
      e.preventDefault();
      navigate('/');
      // Scroll al tope después de navegar
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  // Función para manejar clics en secciones (solo funcionan en home)
  const handleSeccionClick = (e, ancla) => {
    if (!isHomePage) {
      e.preventDefault();
      // Navegar a home y luego scroll a la sección
      navigate('/');
      setTimeout(() => {
        const elemento = document.getElementById(ancla);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  };

  return (
    <footer id="pie-pagina" className="pie-pagina-completo">
      {/* Contenido principal centrado */}
      <div className="pie-contenido">
        {/* Logo y título */}
        <div className="pie-header">
          <div className="pie-logo-grande">
            <svg width="80" height="80" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="70" width="20" height="30" rx="3" fill="#3b82f6" opacity="0.8"/>
              <rect x="45" y="50" width="20" height="50" rx="3" fill="#3b82f6" opacity="0.9"/>
              <rect x="70" y="30" width="20" height="70" rx="3" fill="#3b82f6"/>
              <path d="M85 25 L95 15 L105 25" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <line x1="95" y1="15" x2="95" y2="45" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="pie-titulo">KairosFin</h2>
          <p className="pie-subtitulo">Tu Sistema Financiero Personal Profesional</p>
        </div>

        {/* Secciones de información */}
        <div className="pie-secciones">
          <div className="pie-seccion">
            <h3>Navegación</h3>
            <ul>
              <li>
                {isHomePage ? (
                  // En home: enlace deshabilitado visualmente
                  <span className="pie-link-disabled" onClick={handleInicioClick}>
                    Inicio
                  </span>
                ) : (
                  // En otras páginas: enlace activo
                  <a href="/" onClick={handleInicioClick}>
                    Inicio
                  </a>
                )}
              </li>
              <li>
                <a 
                  href="#seccion-ingresos-egresos" 
                  onClick={(e) => handleSeccionClick(e, 'seccion-ingresos-egresos')}
                >
                  Ingresos/Egresos
                </a>
              </li>
              <li>
                <a 
                  href="#seccion-deudas" 
                  onClick={(e) => handleSeccionClick(e, 'seccion-deudas')}
                >
                  Deudas
                </a>
              </li>
              <li><a href="/informes">Informes</a></li>
            </ul>
          </div>

          <div className="pie-seccion">
            <h3>Recursos</h3>
            <ul>
              <li>
                <a 
                  href="/docs/kairosfin_manual.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  Ayuda
                 </a>
              </li>
              <li><a href="#documentacion" hidden>Documentación</a></li>
              <li><a href="#tutoriales" hidden>Tutoriales</a></li>
              <li>
                <a 
                  href="/docs/kairosfin_faq.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors"
                >
                  Preguntas Frecuentes
                </a>
              </li>
            </ul>
          </div>

          <div className="pie-seccion">
            <h3>Contacto</h3>
            <ul>
              <li>📧 pabloj94g@gmail.com</li>
              <li>📱 +54 9 376 4360178</li>
              <li>🌐 https://kairosfin.vercel.app/</li>
              <li>📍 Posadas Misiones, Argentina</li>
            </ul>
          </div>
        </div>

        {/* Copyright y créditos */}
        <div className="pie-footer">
          <p>© {new Date().getFullYear()} KairosFin. Todos los derechos reservados.</p>
          <p className="pie-version">Versión 1.0 | Desarrollado por Pablo Almada</p>
        </div>
      </div>
    </footer>
  );
}

export default PiePagina;