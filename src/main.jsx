// Importo StrictMode de React para ayudar a detectar posibles problemas en el código durante el desarrollo
import { StrictMode } from 'react'

// Importo la función createRoot desde react-dom/client para crear el punto de montaje de React en el DOM
import { createRoot } from 'react-dom/client'

// Importo el archivo de estilos CSS globales para que se apliquen a la aplicación
import './index.css'

// Importo el componente raíz de la aplicación, que contiene toda la interfaz principal
import App from './App.jsx'

// Busco en el HTML el elemento con id "root" (normalmente un <div>) y creo la raíz React en ese nodo
createRoot(document.getElementById('root')).render(
  // Uso StrictMode para envolver la app y así activar comprobaciones extra en desarrollo
  <StrictMode>
    {/* Renderizo o dibujo o pinto el componente App dentro del nodo "root" */}
    <App />
  </StrictMode>,
)
