// RESUMEN DE CAMBIOS EN RegistrarDeuda.jsx:
// 1. Importar useDeudasContext
// 2. Obtener funciones y estado del contexto
// 3. useEffect que escucha deudasNeedRefresh y actualiza automáticamente
// 4. handleSubmit notifica después de crear/editar
// 5. handleDelete notifica después de eliminar

// FLUJO COMPLETO:
// Usuario edita deuda → notifyDeudasChanged() → 
// Contexto cambia deudasNeedRefresh a true →
// useEffect detecta cambio → fetchDeudas() →
// markDeudasRefreshed() → Sistema sincronizado


// src/componentes/RegistrarDeuda.jsx
import React, { useState, useEffect, useRef } from "react";
import "./RegistrarDeuda.css";
// CAMBIO 1: Importar el hook del contexto
// AGREGAR al inicio del archivo, junto con los otros imports:
import { useDeudasContext } from '../context/DeudasContext';

// AGREGAR después de: import "./RegistrarDeuda.css";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from 'date-fns/locale/es';
registerLocale('es', es);
import DatePicker from "react-datepicker";
import Select from 'react-select';


function RegistrarDeuda() {
  // --- Datos principales ---
  const [deudas, setDeudas] = useState([]);

  // NUEVO: Estado para las descripciones del combo
  const [descripciones, setDescripciones] = useState([]);
  const [descripcionesLoading, setDescripcionesLoading] = useState(false);
  // CAMBIO 2: Dentro del componente, obtener el contexto
  // AGREGAR después de los otros useState:
  const { deudasNeedRefresh, markDeudasRefreshed, notifyDeudasChanged } = useDeudasContext();
  // EXPLICACIÓN:
  // - deudasNeedRefresh: boolean que indica si necesitamos recargar
  // - markDeudasRefreshed: función para marcar como actualizado
  // - notifyDeudasChanged: función para notificar cambios (la usaremos al modificar)

  // Formulario para alta / modificación
  const [nuevaDeuda, setNuevaDeuda] = useState({
    id: null,
    descripcion_id: "", // CAMBIO: era "descripcion"
    // descripcion: "", NUEVO: para mostrar el texto en edición
    monto: "",
    fecha_registro: "",
    fecha_vencimiento: "",
  });

  // --- Filtros aplicados ---
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterDescripcion, setFilterDescripcion] = useState("");

  // --- Inputs de filtros ---
  const [inputDesde, setInputDesde] = useState("");
  const [inputHasta, setInputHasta] = useState("");
  const [inputEstado, setInputEstado] = useState("");
  const [inputDescripcion, setInputDescripcion] = useState("");

  const [listCleared, setListCleared] = useState(false);

  const PAGE_SIZE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Mensajes
  const [mensajeIzquierda, setMensajeIzquierda] = useState(""); // Mensajes de tabla
  const [mensajeDerecha, setMensajeDerecha] = useState("");     // Mensajes de formulario
  const [error, setError] = useState("");
  const [busquedaRealizada, setBusquedaRealizada] = useState(false); // ← AGREGAR también esto

  const [loading, setLoading] = useState(false);
  const [primeraCarga, setPrimeraCarga] = useState(true);

  // AGREGAR después de: const [primeraCarga, setPrimeraCarga] = useState(true);
  const [fechaMinima, setFechaMinima] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deudaAEliminar, setDeudaAEliminar] = useState(null);
  // Ref para el Select de descripción
  const selectDescripcionRef = useRef(null);
  const MAX_DAYS = 365;

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
      return `${enteroFormateado},${decimalLimitado}`;
    }
    return enteroFormateado;
  };

  // Función para convertir a formato MySQL (punto decimal, sin separadores)
  const convertirMontoParaMySQL = (montoFormateado) => {
    return montoFormateado.replace(/\./g, '').replace(',', '.');
  };

  // Función para formatear montos al MOSTRAR (en tabla y mensajes)
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

  // Agregar esta función helper antes del return
  //const fechasCompletas = inputDesde && inputHasta;

  // AGREGAR nueva función:
  const formatearFechaParaMostrar = (fechaISO) => {
    if (!fechaISO) return '';
    const [año, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${año}`;
  };

  // NUEVA FUNCIÓN: Cargar descripciones para el combo
  const fetchDescripciones = async () => {
    try {
      setDescripcionesLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones/tipo/deuda`);
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

  // AGREGAR nueva función:
  const fetchFechaMinima = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/deudas/fecha-minima`);  // ← CAMBIAR AQUÍ
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFechaMinima(data.fecha_minima);
    } catch (err) {
      console.error("Error al obtener fecha mínima:", err);
      setFechaMinima(null);
    }
  };

  // NUEVO useEffect: Cargar descripciones  y fecha mínima al montar el componente
  useEffect(() => {
    fetchDescripciones();
    fetchFechaMinima();
  }, []);

  // FUNCIÓN AUXILIAR: Obtener nombre de descripción por ID
  const obtenerNombreDescripcion = (descripcionId) => {
    const desc = descripciones.find(d => d.id === parseInt(descripcionId));
    return desc ? desc.nombre : "Descripción no encontrada";
  };

  // --- Traer deudas ---
  const fetchDeudas = async (page = 1, desde = filterDesde, hasta = filterHasta, descripcionId = inputDescripcion) => {
    if (listCleared) return { deudas: [], total: 0 };
    try {
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
      });

      if (desde) params.append("fecha_inicio", desde);
      if (hasta) params.append("fecha_fin", hasta);
      if (filterEstado !== "") params.append("estado", filterEstado);
      if (descripcionId) params.append("descripcion_id", descripcionId);

      console.log("Parámetros enviados:", params.toString());
      console.log("filterEstado actual:", filterEstado);

      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/deudas/paginadas?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const fetched = data.results || [];
      const total = data.total || 0;

      setDeudas(fetched);
      setTotalItems(total);

      const totalPagesCalc = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > totalPagesCalc) {
        setCurrentPage(totalPagesCalc);
      }

      return { deudas: fetched, total };
    } catch (err) {
      console.error("Error al obtener deudas:", err);
      setDeudas([]);
      setTotalItems(0);
      if (!primeraCarga) {
        setError("Error al obtener deudas. Revisa el backend.");
      }
      setPrimeraCarga(false);
      return { deudas: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  // useEffect para recargar deudas al cambiar página o filtros
  useEffect(() => {
    if (busquedaRealizada && !listCleared) {
      fetchDeudas(currentPage, filterDesde, filterHasta, filterDescripcion);
    }
  }, [currentPage, filterDesde, filterHasta, filterEstado, filterDescripcion, listCleared, busquedaRealizada]);


  // CAMBIO 3: Crear useEffect que escucha cambios del contexto
  // AGREGAR este useEffect DESPUÉS de fetchDescripciones():
  //Actualiza si se realizó una búsqueda (con o sin filtros)
  //Mantiene sincronización correcta cuando otros componentes modifican deudas
  useEffect(() => {
    if (deudasNeedRefresh && busquedaRealizada) {
      console.log('[RegistrarDeuda] Detectados cambios en deudas - actualizando...');

      fetchDeudas(currentPage, filterDesde, filterHasta, filterDescripcion)  // ← PASAR LOS FILTROS
        .then(() => {
          markDeudasRefreshed();
          console.log('[RegistrarDeuda] Deudas actualizadas desde contexto');
        })
        .catch(err => {
          console.error('[RegistrarDeuda] Error al actualizar:', err);
        });
    }
  }, [deudasNeedRefresh, busquedaRealizada, currentPage, filterDesde, filterHasta, filterDescripcion]);  // ← AGREGAR DEPENDENCIAS
  // DEPENDENCIAS:
  // - deudasNeedRefresh: para escuchar cambios
  // - busquedaRealizada: para recargar solo si hay búsqueda activa
  // - currentPage: para mantener la página actual

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalItems);

  // --- Formulario ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevaDeuda({ ...nuevaDeuda, [name]: value });
  };

  const resetForm = () => {
    setNuevaDeuda({
      id: null,
      descripcion_id: "",
      monto: "",
      fecha_registro: "",
      fecha_vencimiento: "",
    });

    // Volver a poner foco en descripción después de resetear
    setTimeout(() => {
      if (selectDescripcionRef.current) {
        selectDescripcionRef.current.focus();
      }
    }, 100);
  };

  // CAMBIO 4: Modificar handleSubmit para notificar cambios
  // REEMPLAZAR la función handleSubmit completa por esta:
  const handleSubmit = async (e) => {
    e.preventDefault();
    // AGREGAR después de e.preventDefault(); y ANTES de setError(""):
    // ✅ VALIDACIONES MANUALES
    if (!nuevaDeuda.descripcion_id) {
      setMensajeDerecha("⚠️ Por favor, seleccione una descripción");
      setError("");
      setMensajeIzquierda("");
      return;
    }

    if (!nuevaDeuda.monto || nuevaDeuda.monto.trim() === '') {
      setMensajeDerecha("⚠️ Por favor, ingrese un monto");
      setError("");
      setMensajeIzquierda("");
      return;
    }

    const montoSinFormato = convertirMontoParaMySQL(nuevaDeuda.monto);
    const montoNumerico = parseFloat(montoSinFormato);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setMensajeDerecha("⚠️ Ingrese un monto válido mayor a $0");
      setError("");
      setMensajeIzquierda("");
      return;
    }

    if (!nuevaDeuda.fecha_registro) {
      setMensajeDerecha("⚠️ Por favor, ingrese una fecha");
      setError("");
      setMensajeIzquierda("");
      return;
    }

    if (!nuevaDeuda.fecha_vencimiento) {
      setMensajeDerecha("⚠️ Por favor, ingrese una fecha de vencimiento");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    setError("");           // ← Agregar
    setMensajeIzquierda(""); // ← Agregar
    setMensajeDerecha("");   // ← Agregar
    try {
      const body = {
        descripcion_id: parseInt(nuevaDeuda.descripcion_id), // Enviar ID en lugar de texto: descripcion: nuevaDeuda.descripcion || "",        
        monto: parseFloat(convertirMontoParaMySQL(nuevaDeuda.monto)),
        fecha_registro: nuevaDeuda.fecha_registro || null,
        fecha_vencimiento: nuevaDeuda.fecha_vencimiento || null,
      };

      if (nuevaDeuda.id) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/deudas/${nuevaDeuda.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Error al actualizar (status ${res.status})`);
        setMensajeDerecha(`Deuda editada: ${obtenerNombreDescripcion(nuevaDeuda.descripcion_id)} - ${formatearMontoParaMostrar(body.monto)}`); // ← Cambio aquí
        setMensajeIzquierda(""); // ← Limpiar mensajes de tabla
        if (busquedaRealizada) {
          await fetchDeudas(currentPage);
        }
        // NUEVO: Notificar al contexto que se modificó una deuda
        // EXPLICACIÓN: Esto alertará a TODOS los componentes (egresos, gráficos, etc.)
        notifyDeudasChanged('RegistrarDeuda-Editar');
      } else {
        //CREACION
        const res = await fetch(`${import.meta.env.VITE_API_URL}/deudas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Error al crear (status ${res.status})`);
        setMensajeDerecha(`Deuda agregada: ${obtenerNombreDescripcion(nuevaDeuda.descripcion_id)} - ${formatearMontoParaMostrar(body.monto)}`); // ← Cambio aquí
        setMensajeIzquierda(""); // ← Limpiar mensajes de tabla               
        resetForm();
        setListCleared(false);

        if (busquedaRealizada) {  // ← Cambio: recargar si hay búsqueda activa
          setCurrentPage(1);
          await fetchDeudas(1);
        }
        // NUEVO: Notificar al contexto que se creó una deuda
        notifyDeudasChanged('RegistrarDeuda-Crear');
      }
      resetForm();
      setListCleared(false);
    } catch (err) {
      console.error("Error al guardar deuda:", err);
      setError("Error guardando la deuda.");
      setMensajeIzquierda("");   // ← Agregar
      setMensajeDerecha("");     // ← Agregar
    }
  };

  const handleEdit = (deuda) => {
    setNuevaDeuda({
      id: deuda.id,
      descripcion_id: deuda.descripcion_id ? String(deuda.descripcion_id) : "", // CAMBIO: convertir a string      
      monto: convertirMontoParaEdicion(deuda.monto),
      fecha_registro: deuda.fecha_registro || "",
      fecha_vencimiento: deuda.fecha_vencimiento || "",
    });
    setListCleared(false);
  };

  // CAMBIO 5: Modificar handleDelete para notificar cambios
  // REEMPLAZAR la función handleDelete completa por esta:
  const handleDelete = (id) => {
    const deuda = deudas.find(d => d.id === id);
    setDeudaAEliminar(deuda);
    setShowDeleteModal(true);
  };

  // Y AGREGAR después:
  const confirmarEliminar = async () => {
    if (!deudaAEliminar) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/deudas/${deudaAEliminar.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Error al eliminar (status ${res.status})`);
      setMensajeIzquierda(`Deuda eliminada: ${deudaAEliminar.descripcion} - ${formatearMontoParaMostrar(deudaAEliminar.monto)}`);
      setMensajeDerecha("");
      setError("");
      await fetchDeudas(currentPage);
      resetForm();
      notifyDeudasChanged('RegistrarDeuda-Eliminar');
    } catch (err) {
      console.error("Error al eliminar deuda:", err);
      setError("❌ Error al eliminar la deuda.");
      setMensajeIzquierda("");
      setMensajeDerecha("");
    } finally {
      setShowDeleteModal(false);
      setDeudaAEliminar(null);
    }
  };

  // --- Filtros ---
  const handleBuscar = (e) => {
    e.preventDefault();
    
    let desde = inputDesde;
    let hasta = inputHasta;
    let mensajeInfo = "";

    // ✅ AUTO-COMPLETADO INTELIGENTE
    if (desde && !hasta) {
      hasta = desde;
      setInputHasta(desde);
      mensajeInfo = "📅 Búsqueda de un solo día";
    } else if (!desde && hasta) {
      desde = hasta;
      setInputDesde(hasta);
      mensajeInfo = "📅 Búsqueda de un solo día";
    } else if (!desde && !hasta) {
      desde = fechaMinima || "";
      const hoy = new Date();
      hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      setInputDesde(desde);
      setInputHasta(hasta);
      mensajeInfo = "📅 Búsqueda total";
    } else {
      mensajeInfo = "Búsqueda realizada";  // ← CASO 4: Ambas fechas
    }

    // ✅ VALIDAR LÍMITE DE DÍAS
    if (desde && hasta) {
      const fechaDesde = new Date(desde);
      const fechaHasta = new Date(hasta);
      const diffDays = Math.ceil((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24));

      if (diffDays > MAX_DAYS) {
        setMensajeIzquierda(`⚠️ Rango muy amplio: ${diffDays} días (máximo: ${MAX_DAYS} días)`);
        setError("");
        setMensajeDerecha("");
        return;
      }

      if (diffDays < 0) {
        setMensajeIzquierda("⚠️ La fecha 'Hasta' debe ser posterior a 'Desde'");
        setError("");
        setMensajeDerecha("");
        return;
      }
    }

    // CAMBIAR las líneas de setFilter por:
    setFilterDesde(desde);
    setFilterHasta(hasta);
    setFilterEstado(inputEstado);
    setFilterDescripcion(inputDescripcion);

    // Reiniciar paginación y lista
    setCurrentPage(1);
    setListCleared(false);
    resetForm();
    setError("");
    setMensajeDerecha("");
    setBusquedaRealizada(true);

    // ✅ EJECUTAR búsqueda
    fetchDeudas(1, desde, hasta, inputDescripcion);
    
    // ✅ ESTABLECER mensaje INMEDIATAMENTE (no esperar)
    setMensajeIzquierda(mensajeInfo);
  };

  const handleLimpiarFiltros = () => {
    setInputDesde("");
    setInputHasta("");
    setInputEstado("");// Se resetea automáticamente
    setInputDescripcion("");
    setFilterDesde("");
    setFilterHasta("");
    setFilterEstado("");
    setFilterDescripcion("");
    setCurrentPage(1);
    setDeudas([]);
    setTotalItems(0);
    setListCleared(true);
    resetForm();
    // AGREGAR:
    setError("");
    setMensajeIzquierda("Filtros limpiados"); // ← Cambio aquí
    setMensajeDerecha(""); // ← Limpiar mensajes del formulario
    setBusquedaRealizada(false); // ← Agregar 
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

  const formTitle = nuevaDeuda.id ? "Editar" : "Alta";
  const prevDisabled = totalItems === 0 || currentPage === 1;
  const nextDisabled = totalItems === 0 || currentPage === totalPages;

  // Agregar esta función helper antes del return
  const fechasCompletas = inputDesde && inputHasta;

  return (
    <div className="registrar-deuda-container">
      <h1 className="titulo-principal">Deudas</h1>
      <div className="lista-deudas">
        <h2>Historial</h2>
        <form className="filtros-container" onSubmit={handleBuscar}>
          {/* FILA 1: Filtros */}
          <div className="filtros-fila-1">
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
                    ? { value: "", label: "Todas" }  // ← CAMBIO: Mostrar "Todas" por defecto
                    : descripciones.find(d => d.id === parseInt(inputDescripcion))
                      ? { 
                          value: String(descripciones.find(d => d.id === parseInt(inputDescripcion)).id), 
                          label: descripciones.find(d => d.id === parseInt(inputDescripcion)).nombre 
                        }
                      : { value: "", label: "Todas" }
                }
                onChange={(opcion) => {
                  setInputDescripcion(opcion && opcion.value !== "" ? String(opcion.value) : '');  // ← CAMBIO: Convertir a string
                }}
                options={[
                  { value: "", label: "Todas" },  // ← CAMBIO: Agregar opción "Todas"
                  ...descripciones.map(d => ({
                    value: String(d.id),  // ← CAMBIO: Convertir ID a string
                    label: d.nombre
                  }))
                ]}
                placeholder="Todas"
                isSearchable={true}
                isClearable={false} // ✅ CAMBIO: Permitir limpiar la selección
                noOptionsMessage={() => "No hay descripciones"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '30px',
                    minWidth: '140px',  /* ← REDUCIR de 125px a 115px */
                    fontSize: '0.65rem',
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
                    color: '#495057',
                    fontWeight: 500,
                    opacity: 1
                  })
                }}
              />
            </label>

            <label className="filtro-label" title="Filtrar por estado">
              Est:
              <Select
                value={
                  inputEstado === "" ? { value: "", label: "Todos" } :
                    inputEstado === "pendientes" ? { value: "pendientes", label: "Pend." } :
                      { value: "pagados", label: "Pag." }
                }
                onChange={(opcion) => {
                  setInputEstado(opcion ? opcion.value : '');
                }}
                options={[
                  { value: "", label: "Todos" },
                  { value: "pendientes", label: "Pend." },
                  { value: "pagados", label: "Pag." }
                ]}
                placeholder="Todos"
                isSearchable={false}
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '30px',
                    minWidth: '70px',
                    fontSize: '0.70rem',
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
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    fontSize: '0.75rem'
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#e3f2fd' : '#ffffff',
                    color: '#333333',
                    cursor: 'pointer',
                    fontSize: '0.80rem',
                    padding: '8px 12px',
                    '&:hover': {
                      backgroundColor: '#bbdefb'
                    }
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#333333',
                    fontSize: '0.70rem'
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#495057',
                    fontWeight: 500,
                    opacity: 1,
                    fontSize: '0.70rem'
                  })
                }}
              />
            </label>
            <div className="botones-filtro">  {/* ← CAMBIAR clase de filtros-botones-row a botones-filtro */}
              <button type="submit">Buscar</button>  {/* ← QUITAR className="filtro-button" */}
              <button type="button" onClick={handleLimpiarFiltros}>Limpiar</button>  {/* ← QUITAR className="filtro-button" */}
            </div>
          </div>
        </form>

        <div className="tabla-con-scroll">
          {loading && <div className="spinner">Cargando...</div>}
          <table size="small">
            <thead>
              <tr>
                <th>Descripción</th>
                {/*<th>Saldo Pendiente</th>*/}
                <th>Monto</th>
                <th>Saldo</th>
                <th>Fecha</th>           {/* NUEVA COLUMNA */}
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deudas.length === 0 ? (
                <tr>
                  <td colSpan="7">No hay registros para mostrar.</td>
                </tr>
              ) :
                (
                  deudas.map((deuda) => {
                    // NUEVO: Calcular si la deuda tiene pagos
                    // EXPLICACIÓN: Si monto_pagado > 0, significa que se hizo al menos un pago
                    // ya sea parcial o total. En ese caso, no se puede editar ni eliminar.
                    const tienePagos = parseFloat(deuda.monto_pagado || 0) > 0;
                    return (
                      <tr key={deuda.id}>
                        <td>{deuda.descripcion}</td>
                        <td>{formatearMontoParaMostrar(deuda.monto)}</td>
                        <td>{formatearMontoParaMostrar(deuda.saldo_pendiente ?? deuda.monto)}</td>   {/* CAMBIAR ESTA LÍNEA */}
                        <td>{formatearFechaParaMostrar(deuda.fecha_registro)}</td>
                        <td>{formatearFechaParaMostrar(deuda.fecha_vencimiento)}</td>
                        <td className={deuda.pagado ? "estado-pagado" : "estado-pendiente"}>
                          {deuda.pagado ? "Pagado" : "Pendiente"}
                        </td>
                        <td className="acciones">
                          <button 
                            onClick={() => handleEdit(deuda)}
                            disabled={tienePagos}
                            title={tienePagos 
                              ? "No se puede editar: tiene pagos registrados" 
                              : "Editar deuda"
                            }
                            className="btn-editar"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(deuda.id)}
                            disabled={tienePagos}
                            title={tienePagos 
                              ? "No se puede eliminar: tiene pagos registrados" 
                              : "Eliminar deuda"
                            }
                            className="btn-eliminar"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )
                  }
                  )
                )
              }
            </tbody>
          </table>
        </div>

        <div className="paginacion">
          <button onClick={handlePrevPage} disabled={prevDisabled}>← Anterior</button>
          <div className="paginacion-info">
            Página {totalItems === 0 ? 0 : currentPage} / {totalItems === 0 ? 0 : totalPages}
          </div>
          <button onClick={handleNextPage} disabled={nextDisabled}>Siguiente →</button>
        </div>
      </div>

      <div className="formulario-deuda">
        <h2>{formTitle}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Descripción
            <Select
              ref={selectDescripcionRef}
              value={nuevaDeuda.descripcion_id
                ? descripciones.find(d => d.id === parseInt(nuevaDeuda.descripcion_id))
                  ? { value: nuevaDeuda.descripcion_id, label: descripciones.find(d => d.id === parseInt(nuevaDeuda.descripcion_id)).nombre }
                  : null
                : null
              }
              onChange={(opcion) => {
                setNuevaDeuda({
                  ...nuevaDeuda,
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
              isDisabled={nuevaDeuda.id !== null}
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
              value={nuevaDeuda.monto}
              onChange={(e) => {
                const valorFormateado = formatearMontoInput(e.target.value);
                setNuevaDeuda({ ...nuevaDeuda, monto: valorFormateado });
              }}
              onBlur={(e) => {
                const valorSinFormato = convertirMontoParaMySQL(e.target.value);
                const num = parseFloat(valorSinFormato);
                if (e.target.value && (isNaN(num) || num <= 0 || num > 999999999.99)) {
                  alert('Ingrese un monto válido entre $0,01 y $999.999.999,99');
                  setNuevaDeuda({ ...nuevaDeuda, monto: '' });
                }
              }}
              placeholder="Ej: 1.000,50"
            />
          </label>
          <div className="fechas-container">
            <div className="fecha-input">
              <label>Fecha</label>
              <DatePicker
                selected={nuevaDeuda.fecha_registro ? new Date(nuevaDeuda.fecha_registro + 'T00:00:00') : null}
                onChange={(date) => {
                  setNuevaDeuda({
                    ...nuevaDeuda,
                    fecha_registro: date ? date.toISOString().split('T')[0] : ''
                  });
                }}
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="dd/mm/aaaa"
                className="formulario-input-fecha"
                calendarClassName="calendario-formulario"
                showPopperArrow={false}
              />
            </div>
            <div className="fecha-input">
              <label>Vencimiento</label>
              <DatePicker
                selected={nuevaDeuda.fecha_vencimiento ? new Date(nuevaDeuda.fecha_vencimiento + 'T00:00:00') : null}  // ← CAMBIAR
                onChange={(date) => {
                  setNuevaDeuda({
                    ...nuevaDeuda,
                    fecha_vencimiento: date ? date.toISOString().split('T')[0] : ''  // ← CAMBIAR
                  });
                }}
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="dd/mm/aaaa"
                className="formulario-input-fecha"
                calendarClassName="calendario-formulario"
                showPopperArrow={false}
              />
            </div>
          </div>
          <button type="submit">{nuevaDeuda.id ? "Actualizar" : "Agregar"}</button>
        </form>
      </div>

      {/* Barra de estado */}
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
          {!mensajeIzquierda && !mensajeDerecha && !error && !busquedaRealizada && (
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
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Eliminar esta deuda?</h3>
            <p>
              {deudaAEliminar?.descripcion} - {formatearMontoParaMostrar(deudaAEliminar?.monto)}
            </p>
            <div className="modal-buttons">
              <button onClick={confirmarEliminar} className="modal-btn-eliminar">
                Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeudaAEliminar(null);
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

export default RegistrarDeuda;