// CREAR NUEVO ARCHIVO: src/context/DeudasContext.js

import React, { createContext, useState, useContext, useCallback } from 'react';

// EXPLICACIÓN: Context API es el mecanismo de React para compartir estado
// entre componentes sin pasar props manualmente en cada nivel

// PASO 1: Crear el contexto
const DeudasContext = createContext();

// PASO 2: Crear el Provider (proveedor del estado global)
export const DeudasProvider = ({ children }) => {
  // Estado que indica si las deudas necesitan actualizarse
  const [deudasNeedRefresh, setDeudasNeedRefresh] = useState(false);
  
  // Timestamp de la última modificación (para debugging y control de versión)
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // FUNCIÓN CLAVE: Notificar que las deudas fueron modificadas
  // EXPLICACIÓN: Cuando egresos modifica una deuda, llama a esta función
  // para notificar a todos los componentes que usan este contexto
  const notifyDeudasChanged = useCallback((source = 'unknown') => {
    console.log(`[DeudasContext] Deudas modificadas desde: ${source}`);
    setDeudasNeedRefresh(true);
    setLastUpdate(new Date().toISOString());
  }, []);
  
  // FUNCIÓN: Marcar que las deudas ya fueron actualizadas
  // EXPLICACIÓN: Después de que un componente recarga los datos,
  // llama a esta función para resetear el flag
  const markDeudasRefreshed = useCallback(() => {
    console.log('[DeudasContext] Deudas actualizadas');
    setDeudasNeedRefresh(false);
  }, []);
  
  // FUNCIÓN: Forzar actualización inmediata
  // EXPLICACIÓN: Para casos donde necesitas actualizar sin importar el estado
  const forceRefresh = useCallback((source = 'manual') => {
    console.log(`[DeudasContext] Forzando actualización desde: ${source}`);
    setDeudasNeedRefresh(true);
    setLastUpdate(new Date().toISOString());
  }, []);
  
  // Valor que se compartirá con todos los componentes hijos
  const value = {
    deudasNeedRefresh,      // Boolean: ¿necesitan actualizarse?
    lastUpdate,             // String: timestamp de última modificación
    notifyDeudasChanged,    // Función: notificar cambios
    markDeudasRefreshed,    // Función: marcar como actualizado
    forceRefresh,           // Función: forzar actualización
  };
  
  return (
    <DeudasContext.Provider value={value}>
      {children}
    </DeudasContext.Provider>
  );
};

// PASO 3: Hook personalizado para usar el contexto fácilmente
// EXPLICACIÓN: Este hook simplifica el uso del contexto en los componentes
export const useDeudasContext = () => {
  const context = useContext(DeudasContext);
  
  // Validación: asegurar que se usa dentro del Provider
  if (!context) {
    throw new Error('useDeudasContext debe usarse dentro de DeudasProvider');
  }
  
  return context;
};

// RESUMEN DE FUNCIONALIDAD:
// - notifyDeudasChanged(): Llamar cuando modificas deudas desde cualquier lugar
// - deudasNeedRefresh: Leer para saber si necesitas recargar datos
// - markDeudasRefreshed(): Llamar después de recargar datos
// - forceRefresh(): Forzar actualización manual

// VENTAJAS:
// 1. Sincronización instantánea entre páginas
// 2. Sin polling innecesario
// 3. Control centralizado del estado
// 4. Fácil de mantener y extender