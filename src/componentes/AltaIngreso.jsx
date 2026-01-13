import React, { useState, useEffect, useRef } from "react";
import "./AltaIngreso.css";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from 'date-fns/locale/es';
registerLocale('es', es);
import DatePicker from "react-datepicker";
import Select from 'react-select';

function AltaIngreso() {
  // --- Datos principales ---
  const [ingresos, setIngresos] = useState([]);

  // NUEVO: Estado para las descripciones del combo
  const [descripciones, setDescripciones] = useState([]);
  const [descripcionesLoading, setDescripcionesLoading] = useState(false);

  // Formulario para alta / modificación
  const [nuevoIngreso, setNuevoIngreso] = useState({
    id: null,
    descripcion_id: "", // CAMBIO: era "categoria"
    monto: "",
    fecha: "",
  });

  // --- Filtros aplicados (los que usa el backend) ---
  const [filterDesde, setFilterDesde] = useState(""); // YYYY-MM-DD
  const [filterHasta, setFilterHasta] = useState(""); // YYYY-MM-DD

  // --- Inputs de los filtros (lo que escribe el usuario) ---
  const [inputDesde, setInputDesde] = useState("");
  const [inputHasta, setInputHasta] = useState("");

  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // ✅ AJUSTE 3: Filtro por descripción
  const [inputDescripcion, setInputDescripcion] = useState("");

  // ✅ Estados para auto-completar y validaciones
  const [fechaMinima, setFechaMinima] = useState(null);
  const MAX_DAYS = 365;  

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ingresoAEliminar, setIngresoAEliminar] = useState(null);

  // Ref para el Select de descripción
  const selectDescripcionRef = useRef(null);

  // Autofocus al montar el componente
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectDescripcionRef.current) {
        selectDescripcionRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Función para formatear monto con puntos de miles y coma decimal
  const formatearMontoInput = (valor) => {
    // Remover todo excepto números y coma
    let limpio = valor.replace(/[^\d,]/g, '');
    
    // Permitir solo una coma
    const partes = limpio.split(',');
    if (partes.length > 2) {
      limpio = partes[0] + ',' + partes[1];
    }
    
    // Separar parte entera y decimal
    const [entero, decimal] = limpio.split(',');
    
    // Limitar parte entera a 9 dígitos
    const enteroLimitado = entero ? entero.slice(0, 9) : '';
    
    // Agregar puntos de miles solo a la parte entera
    const enteroFormateado = enteroLimitado.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Limitar decimales a 2 dígitos
    const decimalLimitado = decimal !== undefined ? decimal.slice(0, 2) : '';
    
    // Retornar formateado
    if (limpio.includes(',')) {
      // Si hay coma, mostrarla aunque no haya decimales aún
      return `${enteroFormateado},${decimalLimitado}`;
    }
    return enteroFormateado;
  };

  // Función para convertir a formato MySQL (punto decimal, sin separadores)
  const convertirMontoParaMySQL = (montoFormateado) => {
    return montoFormateado.replace(/\./g, '').replace(',', '.');
  };

  // Función para formatear montos al MOSTRAR (en tabla)
  const formatearMontoParaMostrar = (monto) => {
    const numero = parseFloat(monto);
    if (isNaN(numero)) return '$0,00';
    return '$' + numero.toLocaleString('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Función para convertir de formato MySQL a formato argentino para EDICIÓN
  const convertirMontoParaEdicion = (montoMySQL) => {
    if (!montoMySQL) return '';
    const numero = parseFloat(montoMySQL);
    if (isNaN(numero)) return '';
    
    // Convertir a string con 2 decimales
    const [entero, decimal] = numero.toFixed(2).split('.');
    
    // Agregar puntos de miles
    const enteroFormateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Retornar con coma decimal
    return `${enteroFormateado},${decimal}`;
  };

  // ✅ Función para formatear fecha para MOSTRAR en tabla (formato argentino)
  const formatearFechaParaMostrar = (fechaISO) => {
    if (!fechaISO) return '';
    
    // fechaISO viene como "2025-10-16" (YYYY-MM-DD)
    const [año, mes, dia] = fechaISO.split('-');
    
    // Retornar en formato DD/MM/YYYY
    return `${dia}/${mes}/${año}`;
  };

  // Para vaciar la lista al presionar "Limpiar"
  const [listCleared, setListCleared] = useState(false);

  const PAGE_SIZE = 4; // Ahora max 4 por página según tu backend
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Mensajes de UI
  const [error, setError] = useState("");
  const [mensajeIzquierda, setMensajeIzquierda] = useState(""); // Mensajes de tabla
  const [mensajeDerecha, setMensajeDerecha] = useState("");     // Mensajes de formulario  
  
  // Estado para controlar el loading
  const [loading, setLoading] = useState(false);

  // Estado para controlar si es la primera carga del componente
  const [primeraCarga, setPrimeraCarga] = useState(true);

  // NUEVA FUNCIÓN: Cargar descripciones para el combo
  const fetchDescripciones = async () => {
    try {
      setDescripcionesLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones/tipo/ingreso`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDescripciones(data);
    } catch (err) {
      console.error("Error al obtener descripciones:", err);
      setDescripciones([]);
      setError("Error al cargar descripciones.");
    } finally {
      setDescripcionesLoading(false);
    }
  };

  // NUEVA FUNCIÓN: Obtener fecha mínima de la BD
  const fetchFechaMinima = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/movimientos/fecha-minima`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFechaMinima(data.fecha_minima);
    } catch (err) {
      console.error("Error al obtener fecha mínima:", err);
      setFechaMinima(null);
    }
  };

  // --- Fetch ingresos desde backend paginados --- 
  const fetchIngresos = async (page = 1, desde = filterDesde, hasta = filterHasta, descripcionId = inputDescripcion) => {
    if (listCleared) return { ingresos: [], total: 0 };
    try {      
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
      });

      // ✅ Agregar filtros si existen
      if (desde) params.append("fecha_inicio", desde);
      if (hasta) params.append("fecha_fin", hasta);
      if (descripcionId) params.append("descripcion_id", descripcionId);

      setLoading(true); // activar spinner
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ingresos/paginados?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const fetched = data.results || [];
      const total = data.total || 0;

      setIngresos(fetched);
      setTotalItems(total);

      // Ajustar página si page queda fuera de rango
      const totalPagesCalc = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > totalPagesCalc) {
        setCurrentPage(totalPagesCalc);
      }

      return { ingresos: fetched, total };
    } catch (err) {
      console.error("Error al obtener ingresos:", err);
      setIngresos([]);
      setTotalItems(0);
      if (!primeraCarga) { 
        setError("Error al obtener ingresos. Revisa el backend.");
      }
      setPrimeraCarga(false);
      return { ingresos: [], total: 0 };
    }
    finally {
      setLoading(false); // desactivar spinner
    }
  };

  // Solo carga descripciones al inicio (para el combo)
  useEffect(() => {
    fetchDescripciones();
    fetchFechaMinima();  // AGREGAR esta línea
  }, []);

  // Cargar ingresos cuando cambian página o filtros 
  useEffect(() => {
      if (busquedaRealizada && !listCleared) {
        fetchIngresos(currentPage);
      }
  }, [currentPage, filterDesde, filterHasta, listCleared, busquedaRealizada]);



  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalItems);

  // --- Manejo del formulario ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoIngreso({ ...nuevoIngreso, [name]: value });
  };

  const resetForm = () => {
    setNuevoIngreso({ id: null, descripcion_id: "", monto: "", fecha: "" });
    
    // Volver a poner foco en descripción después de resetear
    setTimeout(() => {
      if (selectDescripcionRef.current) {
        selectDescripcionRef.current.focus();
      }
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ VALIDACIONES MANUALES (todas en barra de estado)
    
    // 1. Validar Descripción
    if (!nuevoIngreso.descripcion_id) {
      setMensajeDerecha("⚠️ Por favor, seleccione una descripción");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    
    // 2. Validar Monto
    if (!nuevoIngreso.monto || nuevoIngreso.monto.trim() === '') {
      setMensajeDerecha("⚠️ Por favor, ingrese un monto");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    
    // 3. Validar que el monto sea válido
    const montoSinFormato = convertirMontoParaMySQL(nuevoIngreso.monto);
    const montoNumerico = parseFloat(montoSinFormato);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setMensajeDerecha("⚠️ Ingrese un monto válido mayor a $0");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    
    // 4. Validar Fecha
    if (!nuevoIngreso.fecha) {
      setMensajeDerecha("⚠️ Por favor, ingrese una fecha");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    
    // ✅ NO limpiar mensajes antes (solo limpiar errores)
    setError("");
    // NO limpiar mensajeIzquierda ni mensajeDerecha aquí
    
    try {
      // ... resto del código (no cambiar nada más)
        const body = {        
          descripcion_id: parseInt(nuevoIngreso.descripcion_id), // CAMBIO: enviar descripcion_id
          monto: parseFloat(convertirMontoParaMySQL(nuevoIngreso.monto) || 0),
          fecha: nuevoIngreso.fecha || null,
          deuda_id: null,
        };

        // Obtener el nombre para mostrar en el mensaje
        const obtenerNombreDescripcion = (descripcionId) => {
        const desc = descripciones.find(d => d.id === parseInt(descripcionId));
        return desc ? desc.nombre : "Descripción no encontrada";
      };
      const nombreDescripcion = obtenerNombreDescripcion(nuevoIngreso.descripcion_id);

        if (nuevoIngreso.id) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/ingresos/${nuevoIngreso.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(`Error al actualizar (status ${res.status})`);
          //setMensajeDerecha(`Ingreso editado: ${nombreDescripcion} - ${formatearMontoParaMostrar(nuevoIngreso.monto)}`); // ← Cambio aquí
          setMensajeDerecha(`Ingreso editado: ${nombreDescripcion} - ${formatearMontoParaMostrar(body.monto)}`);
          setMensajeIzquierda(""); // ← Limpiar mensajes de tabla

          // Recargar si hay búsqueda activa
          if (busquedaRealizada) {  // ← Cambio: recargar si hay búsqueda
            await fetchIngresos(currentPage);
          }
        } else {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/ingresos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(`Error al crear (status ${res.status})`);
          setMensajeDerecha(`Ingreso agregado: ${nombreDescripcion} - ${formatearMontoParaMostrar(body.monto)}`);
          setMensajeIzquierda(""); // ← Limpiar mensajes de tabla
          //const hayFiltrosAplicados = filterDesde || filterHasta;
          // Recargar si hay búsqueda activa
          if (busquedaRealizada) {  // ← Cambio: recargar si hay búsqueda
            await fetchIngresos(currentPage);
          }
          // Si no hay filtros, NO hacer nada (no recargar la tabla)
        }
        resetForm();
        setListCleared(false);
      } catch (err) {
      console.error("Error al guardar ingreso:", err);
      setError("❌ Error guardando el ingreso.");  // ← Cambio aquí
      setMensajeIzquierda("");   // ← Limpiar mensajes
      setMensajeDerecha("");     // ← Limpiar mensajes
    }
  };

  const handleEdit = (ingreso) => {
    setNuevoIngreso({
      id: ingreso.id,
      descripcion_id: ingreso.descripcion_id || "",  // 👈 clave para el combo
      monto: convertirMontoParaEdicion(ingreso.monto),
      fecha: ingreso.fecha || "",
    });
    setListCleared(false);
  };
   
  const handleDelete = (id) => {
    const ingreso = ingresos.find(ing => ing.id === id);
    setIngresoAEliminar(ingreso);
    setShowDeleteModal(true);
};

  const confirmarEliminar = async () => {
    if (!ingresoAEliminar) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ingresos/${ingresoAEliminar.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error al eliminar (status ${res.status})`);        
      
      // ✅ CORRECCIÓN: Limpiar mensajes en orden correcto
      setError("");
      setMensajeDerecha("");
      setMensajeIzquierda(`Ingreso eliminado: ${ingresoAEliminar.categoria} - ${formatearMontoParaMostrar(ingresoAEliminar.monto)}`);
      
      await fetchIngresos(currentPage);
      resetForm();
    } catch (err) {
      console.error("Error al eliminar ingreso:", err);
      setError("❌ Error al eliminar ingreso.");
      setMensajeIzquierda("");
      setMensajeDerecha("");
    } finally {
      setShowDeleteModal(false);
      setIngresoAEliminar(null);
    }
  };



  const handleBuscar = (e) => {
    e.preventDefault();
    
    let desde = inputDesde;
    let hasta = inputHasta;
    let mensajeInfo = "";
    
    // ✅ AJUSTE 1: Auto-completar inteligente
    // CASO 1: Usuario llenó solo "De" → asume mismo día
    if (desde && !hasta) {
      hasta = desde;
      setInputHasta(desde);
      mensajeInfo = "📅 Búsqueda de un solo día";
    } 
    // CASO 2: Usuario llenó solo "A" → asume mismo día
    else if (!desde && hasta) {
      desde = hasta;
      setInputDesde(hasta);
      mensajeInfo = "📅 Búsqueda de un solo día";
    } 
    // CASO 3: No llenó nada → buscar TODO (primera fecha hasta hoy)
    else if (!desde && !hasta) {
      desde = fechaMinima || "";
      hasta = new Date().toISOString().split('T')[0];
      setInputDesde(desde);
      setInputHasta(hasta);
      mensajeInfo = "📅 Búsqueda total";
    }
    
    // ✅ TOPE 1: Validar límite de días
    if (desde && hasta) {
      const fechaDesde = new Date(desde);
      const fechaHasta = new Date(hasta);
      const diffDays = Math.ceil((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24));

      //es un error de **búsqueda**, no de **formulario** - Va a la izquierda (junto a la tabla)      
      if (diffDays > MAX_DAYS) {
        setMensajeIzquierda(`⚠️ Rango muy amplio: ${diffDays} días (máximo: ${MAX_DAYS} días)`);
        setError("");
        setMensajeDerecha("");
        return;
      }

       //es un error de **búsqueda**, no de **formulario** - Va a la izquierda (junto a la tabla)      
      if (diffDays < 0) {
        setMensajeIzquierda("⚠️ La fecha 'A' debe ser posterior a 'De'");
        setError("");
        setMensajeDerecha("");
        return;
      }
    }
    
    setBusquedaRealizada(true);
    setFilterDesde(desde);
    setFilterHasta(hasta);
    setCurrentPage(1);
    setListCleared(false);
    setError("");
    setMensajeIzquierda(mensajeInfo || "Búsqueda realizada");
    setMensajeDerecha("");
    fetchIngresos(1, desde, hasta, inputDescripcion);  
  };

  const handleLimpiarFiltros = () => {
    setInputDesde("");
    setInputHasta("");
    setInputDescripcion(""); // ✅ Limpiar descripción
    setFilterDesde("");
    setFilterHasta("");
    setCurrentPage(1);
    setIngresos([]);
    setTotalItems(0);
    setListCleared(true);
    resetForm();
    // AGREGAR:
    setError("");
    setMensajeIzquierda("Filtros limpiados"); // ← Cambio aquí
    setMensajeDerecha(""); // ← Limpiar mensajes del formulario
    setBusquedaRealizada(false);  
  };

  // --- Paginación ---
  const handlePrevPage = () => {
    if (currentPage <= 1) return;
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    if (currentPage >= totalPages) {      
      return;
    }
    setCurrentPage((p) => p + 1);
  };

  // --- Título dinámico del formulario ---
  //const formTitle =
    //nuevoIngreso.id
      //? "Editar"
      //: !listCleared && (filterDesde || filterHasta)
      //? "Editar"
      //: "Alta";
  const formTitle = nuevoIngreso.id ? "Editar" : "Alta";
      
  const prevDisabled = totalItems === 0 || currentPage === 1;
  const nextDisabled = totalItems === 0 || currentPage === totalPages;

  return (
    <div className="alta-ingreso-container">
      <h1 className="titulo-principal">Ingresos</h1>      
      <div className="lista-ingresos">
        <h2>Historial</h2>
        <form className="filtros-container" onSubmit={handleBuscar}>
          <div className="filtros-flex-container">
            <label className="filtro-label">
              De:
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <DatePicker
                  selected={inputDesde ? new Date(inputDesde + 'T00:00:00') : null}
                  onChange={(date) => setInputDesde(date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="dd/mm/aaaa"
                  className="filtro-input-fecha"
                  calendarClassName="calendario-formulario"
                  showPopperArrow={false}                  
                />
                {inputDesde && (
                  <button
                    type="button"
                    className="clear-date-btn"
                    onClick={() => setInputDesde('')}
                    title="Limpiar fecha"
                  >
                    ×
                  </button>
                )}
              </div>
            </label>
            
            <label className="filtro-label">
              A:
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <DatePicker
                  selected={inputHasta ? new Date(inputHasta + 'T00:00:00') : null}
                  onChange={(date) => setInputHasta(date ? date.toISOString().split('T')[0] : '')}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  placeholderText="dd/mm/aaaa"
                  className="filtro-input-fecha"
                  calendarClassName="calendario-formulario"
                  showPopperArrow={false}                  
                />
                {inputHasta && (
                  <button
                    type="button"
                    className="clear-date-btn"
                    onClick={() => setInputHasta('')}
                    title="Limpiar fecha"
                  >
                    ×
                  </button>
                )}
              </div>
            </label>
            
            <label className="filtro-label" title="Filtrar por descripción">
              Desc:
              <Select
               value={
                  inputDescripcion === "" || inputDescripcion === null
                    ? { value: "", label: "Todas" }
                    : descripciones.find(d => d.id === parseInt(inputDescripcion))
                      ? { value: inputDescripcion, label: descripciones.find(d => d.id === parseInt(inputDescripcion)).nombre }
                      : { value: "", label: "Todas" }
                }
                onChange={(opcion) => {
                  setInputDescripcion(opcion ? opcion.value : '');
                }}
                options={[
                  { value: "", label: "Todas" },
                  ...descripciones.map(d => ({
                    value: d.id,
                    label: d.nombre
                  }))
                ]}
                placeholder="Todas"
                isSearchable={true}
                isClearable={false}
                noOptionsMessage={() => "No hay descripciones"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '30px',
                    minWidth: '150px',
                    fontSize: '0.75rem',
                    borderColor: '#d0d7dd',
                    borderRadius: '4px',
                    '&:hover': { borderColor: '#0088fe' }
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: '0 6px'
                  }),
                  input: (base) => ({
                    ...base,
                    margin: '0',
                    padding: '0'
                  }),
                  indicatorSeparator: () => ({
                    display: 'none'
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: '4px'
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    padding: '4px'
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    fontSize: '0.75rem'
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#495057',  // ← Gris más oscuro para filtros
                    fontWeight: 500,
                    opacity: 1
                  }) 
                }}
              />
            </label>

           <div className="botones-filtro-container">
            <button type="submit" className="filtro-button">Buscar</button>
            <button type="button" onClick={handleLimpiarFiltros} className="filtro-button">
              Limpiar
            </button>
            </div>
          </div>
        </form>

        <div className="tabla-con-scroll">
          {loading && <div className="spinner">Cargando...</div>}
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.length === 0 ? (
                <tr>
                  <td colSpan="4">No hay registros para mostrar.</td>
                </tr>
              ) : (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td>{ingreso.categoria}</td>
                    <td>{formatearMontoParaMostrar(ingreso.monto)}</td>
                    <td>{formatearFechaParaMostrar(ingreso.fecha)}</td>
                    <td className="acciones">
                      <button onClick={() => handleEdit(ingreso)}>Editar</button>
                      <button onClick={() => handleDelete(ingreso.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="paginacion" style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12 }}>
          <button onClick={handlePrevPage} disabled={prevDisabled}>← Anterior</button>
          <div style={{ alignSelf: "center" }}>
            Página {totalItems === 0 ? 0 : currentPage} / {totalItems === 0 ? 0 : totalPages}
          </div>
            <button onClick={handleNextPage} disabled={nextDisabled}>Siguiente →</button>
        </div>
      </div>

      <div className="formulario-ingreso">
        <h2>{formTitle}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Descripción
            <Select              
              ref={selectDescripcionRef}              
              value={nuevoIngreso.descripcion_id 
                ? descripciones.find(d => d.id === parseInt(nuevoIngreso.descripcion_id))
                  ? { value: nuevoIngreso.descripcion_id, label: descripciones.find(d => d.id === parseInt(nuevoIngreso.descripcion_id)).nombre }
                  : null
                : null
              }
              onChange={(opcion) => {
                setNuevoIngreso({ 
                  ...nuevoIngreso, 
                  descripcion_id: opcion ? opcion.value : '' 
                });
              }}
              options={descripciones.map(d => ({
                value: d.id,
                label: d.nombre
              }))}
              placeholder="🔍 Buscar descripción..."
              isSearchable={true}
              isClearable={true}
              isDisabled={nuevoIngreso.id !== null}
              noOptionsMessage={() => "No se encontraron descripciones"}
              loadingMessage={() => "Cargando..."}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: '#ccc',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',  // ← NUEVO: fondo blanco semi-opaco
                  '&:hover': { borderColor: '#0088fe' }
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  backgroundColor: '#ffffff'  // ← NUEVO: fondo blanco del menú desplegable
                }),
                option: (base, state) => ({  // ← NUEVO: estilos de cada opción
                  ...base,
                  backgroundColor: state.isFocused ? '#e3f2fd' : '#ffffff',  // Azul claro al pasar mouse
                  color: '#333333',  // Texto oscuro SIEMPRE visible
                  cursor: 'pointer',
                  padding: '10px 12px',  // Más espacio para tocar
                  '&:hover': {
                    backgroundColor: '#bbdefb'  // Azul más intenso al hover
                  }
                }),
                singleValue: (base) => ({  // ← NUEVO: valor seleccionado visible
                  ...base,
                  color: '#333333'  // Texto oscuro cuando hay algo seleccionado
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#6c757d',
                  fontWeight: 400,
                  opacity: 1
                })
              }}
            />
          </label>
          <label>
            Monto
            <input 
              type="text"
              name="monto" 
              value={nuevoIngreso.monto} 
              onChange={(e) => {
                const valorFormateado = formatearMontoInput(e.target.value);
                setNuevoIngreso({ ...nuevoIngreso, monto: valorFormateado });
              }}
              onBlur={(e) => {
                // Validar al salir del campo
                const valorSinFormato = convertirMontoParaMySQL(e.target.value);
                const num = parseFloat(valorSinFormato);
                if (e.target.value && (isNaN(num) || num <= 0 || num > 999999999.99)) {
                  alert('Ingrese un monto válido entre $0,01 y $999.999.999,99');
                  setNuevoIngreso({ ...nuevoIngreso, monto: '' });
                }
              }}
              placeholder="Ej: 1.000,50"              
            />
          </label>
          <label>
            Fecha
            <DatePicker
              selected={nuevoIngreso.fecha ? new Date(nuevoIngreso.fecha + 'T00:00:00') : null}
              onChange={(date) => {
                setNuevoIngreso({ 
                  ...nuevoIngreso, 
                  fecha: date ? date.toISOString().split('T')[0] : '' 
                });
              }}
              dateFormat="dd/MM/yyyy"
              locale="es"
              placeholderText="dd/mm/aaaa"
              className="formulario-input-fecha"
              calendarClassName="calendario-formulario"
              showPopperArrow={false}
              
              />
          </label>
          <button type="submit">{nuevoIngreso.id ? "Actualizar" : "Agregar"}</button>
        </form>        
      </div>
      {/* Barra de estado - abarca el ancho de todo el contenedor */}      
      <div className="barra-estado">
        <div className="estado-contenido">
          {/* ✅ IZQUIERDA: Mensajes de tabla y contador */}
          <div className="estado-izquierda">
            {mensajeIzquierda && (
              <span className="mensaje-exito">{mensajeIzquierda}</span>
            )}
            {busquedaRealizada && totalItems > 0 && (
              <span className="estado-contador"> · Mostrando {startIndex}-{endIndex} de {totalItems}</span>
            )}
          </div>

          {/* ✅ CENTRO: Mensaje neutro cuando no hay actividad */}
          {!mensajeIzquierda && !mensajeDerecha && !error && (
            <div className="estado-centro">
              <span className="mensaje-neutro">📌 No hay operaciones recientes</span>
            </div>
          )}

          {/* ✅ DERECHA: Mensajes de formulario y errores */}
          <div className="estado-derecha">
            {mensajeDerecha && <span className="mensaje-exito">{mensajeDerecha}</span>}
            {error && <span className="mensaje-error">{error}</span>}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Eliminar este ingreso?</h3>
            <p>
              {ingresoAEliminar?.categoria} - {formatearMontoParaMostrar(ingresoAEliminar?.monto)}
            </p>
            <div className="modal-buttons">
              <button onClick={confirmarEliminar} className="modal-btn-eliminar">
                Eliminar
              </button>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setIngresoAEliminar(null);
                }}
                className="modal-btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AltaIngreso;