// RESUMEN DE CAMBIOS EN AltaEgreso.jsx:
// 1. Importar useDeudasContext
// 2. Obtener notifyDeudasChanged del contexto
// 3. Notificar después de crear/editar egreso con deuda
// 4. Notificar después de eliminar egreso con deuda

// FLUJO CUANDO SE PAGA UNA DEUDA:
// 1. Usuario crea egreso con deuda_id
// 2. Backend actualiza saldo de deuda
// 3. handleSubmit llama notifyDeudasChanged()
// 4. Contexto cambia deudasNeedRefresh a true
// 5. RegistrarDeuda.jsx detecta cambio
// 6. RegistrarDeuda recarga datos automáticamente
// 7. Usuario ve saldos actualizados

import React, { useState, useEffect, useRef } from "react";
import "./AltaEgreso.css";
// CAMBIO 1: Importar el hook del contexto
// AGREGAR al inicio del archivo:
import { useDeudasContext } from '../context/DeudasContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from 'date-fns/locale/es';
registerLocale('es', es);
import Select from 'react-select';

function AltaEgreso() {
  // lista y formulario
  //Estados principales
  const [egresos, setEgresos] = useState([]);
  //const [categoria, setCategoria] = useState("");//Se quita esto y se agrega lo de abajo
  const [descripciones, setDescripciones] = useState([]);// se arego esto
  const [descripcionesLoading, setDescripcionesLoading] = useState(false);//se agreso esto.

    
  const [nuevoEgreso, setNuevoEgreso] = useState({
  id: null,
  descripcion_id: "",  // CAMBIO: reemplaza "categoria" por id de descripción
  monto: "",
  fecha: "",
  deuda_id: "",        // opcional, para mantener deuda seleccionada
  });

  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [deudas, setDeudas] = useState([]);
  //const [deudaSeleccionada, setDeudaSeleccionada] = useState("");

 
  // CAMBIO 2: Obtener la función de notificación
  // AGREGAR dentro del componente, después de los otros hooks:
  const { notifyDeudasChanged } = useDeudasContext();
  // EXPLICACIÓN: Solo necesitamos la función de notificación
  // No necesitamos escuchar cambios aquí, solo notificar
  

  // filtros y paginación
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 4;

  // edición / UI
  const [editarId, setEditarId] = useState(null);
  const [formTitulo, setFormTitulo] = useState("Alta");  
  const [loading, setLoading] = useState(false);
  const [mensajeIzquierda, setMensajeIzquierda] = useState(""); // Mensajes de tabla
  const [mensajeDerecha, setMensajeDerecha] = useState("");     // Mensajes de formulario
  const [error, setError] = useState("");

  const [listCleared, setListCleared] = useState(false); // ← AGREGAR ESTA LÍNEA

  // NUEVO: estado para saber si se ha realizado una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // ESTADO para modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [egresoAEliminar, setEgresoAEliminar] = useState(null);

  // estado para input de descripción (si decides usar un input libre en lugar de select)
  const [inputDescripcion, setInputDescripcion] = useState("");

  // ✅ Estados para auto-completar fecha mínima
  const [fechaMinima, setFechaMinima] = useState(null);  

  // Ref para el Select de descripción
  const selectDescripcionRef = useRef(null);

  const MAX_DAYS = 365;  // ← AGREGAR ESTA LÍNEA

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

  // Función para formatear montos al MOSTRAR (en tabla)
  const formatearMontoParaMostrar = (monto) => {
    const numero = parseFloat(monto);
    if (isNaN(numero)) return '$0,00';
    return '$' + numero.toLocaleString('es-AR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
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

  // para limpiar timers de mensajes
  const msgTimerRef = useRef(null);

  // indices para "Mostrando X-Y de Z"
  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  // ✅ Función para formatear fecha para MOSTRAR en tabla (formato argentino)
  const formatearFechaParaMostrar = (fechaISO) => {
    if (!fechaISO) return '';
    
    // fechaISO viene como "2025-10-24" (YYYY-MM-DD)
    const [año, mes, dia] = fechaISO.split('-');
    
    // Retornar en formato DD/MM/YYYY
    return `${dia}/${mes}/${año}`;
  };

  // --- fetch descripciones para el select ---
    //Y la función para traerlas desde el backend el nombre de la descripcion:
  const fetchDescripciones = async () => {
  try {
    setDescripcionesLoading(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones/tipo/egreso`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    setDescripciones(data);
    } catch (err) {
      console.error("Error al obtener descripciones:", err);
      setDescripciones([]);
      // Línea ~185:
      setError("Error al cargar descripciones.");
    } finally {
      setDescripcionesLoading(false);
    }
  };  

  const fetchDeudas = async (includeDeudaId = null) => {
    try {
      // Construir URL base
      let url = `${import.meta.env.VITE_API_URL}/deudas/no_pagadas`;
      
      // Si se pasa includeDeudaId, agregarlo como parámetro
      if (includeDeudaId) {
        url += `?include_deuda_id=${includeDeudaId}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al obtener deudas");
      const data = await res.json();
      setDeudas(data || []);
    } catch (err) {
      console.error("fetchDeudas:", err);
      setDeudas([]);
    }
  };

  // --- traer deudas (si las usas) ---
  useEffect(() => {    
    fetchDeudas();
  }, []);

  //--- fetch egresos paginados (usa /egresos/paginados)---
  const fetchEgresos = async (p = 1) => {
    if (listCleared) return { egresos: [], total: 0 };
    setLoading(true); // ← AGREGAR ESTA LÍNEA
    try {
      setLoading(true);
      // construir URL
      const params = new URLSearchParams({
        page: p,
        limit,
      });
      if (fechaDesde) params.set("fecha_inicio", fechaDesde);
      if (fechaHasta) params.set("fecha_fin", fechaHasta);
      if (inputDescripcion) params.set("descripcion_id", inputDescripcion);

      const url = `${import.meta.env.VITE_API_URL}/egresos/paginados?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // ✅ MAPPEO SEGURO: evita errores con objetos nulos/anidados
      const rawResults = data.results || data.movimientos || data.ingresos || [];
      const movimientos = rawResults.map(e => {
        // Helper seguro para extraer nombre
        const safeString = (val) => {
          if (val == null) return '—';
          if (typeof val === 'string') return val.trim() || '—';
          if (typeof val === 'object') {
            return val.nombre || val.descripcion || val.name || '—';
          }
          return String(val).trim() || '—';
        };

        return {
          id: e.id || null,
          descripcion_id: e.descripcion_id || null,
          categoria: safeString(e.categoria || e.Descripcion),
          monto: parseFloat(e.monto) || 0,
          fecha: e.fecha || '',
          deuda_id: e.deuda_id || null,
          deuda_descripcion: safeString(e.deuda_descripcion || e.Deuda),
          deuda_saldo_pendiente: parseFloat(e.deuda_saldo_pendiente) || 0,
          // ✅ Campo clave: saldo ANTES del pago (viene del backend)
          deuda_saldo_antes: e.deuda_saldo_antes != null ? parseFloat(e.deuda_saldo_antes) : null,
        };
      });

      const pageResp = data.page || p;
      const totalResp = typeof data.total === "number" ? data.total : null;

      setEgresos(movimientos);
      setPage(pageResp);

      // Si no viene total, pedirlo explícitamente
      if (totalResp === null) {
        try {
          const totalRes = await fetch(
            //``${import.meta.env.VITE_API_URL}`/egresos/total?desde=${fechaDesde || ""}&hasta=${fechaHasta || ""}`
            `${import.meta.env.VITE_API_URL}/egresos/total?desde=${fechaDesde || ""}&hasta=${fechaHasta || ""}`
          );
          if (totalRes.ok) {
            const totalData = await totalRes.json();
            setTotal(typeof totalData.total === "number" ? totalData.total : movimientos.length);
          } else {
            setTotal(movimientos.length);
          }
        } catch {
          setTotal(movimientos.length);
        }
      } else {
        setTotal(totalResp);
      }

      // Ajustar página si quedó fuera de rango
      const totalPagesCalc = Math.max(1, Math.ceil((totalResp ?? movimientos.length) / limit));
      if (p > totalPagesCalc) {
        setPage(totalPagesCalc);
      }
    } catch (err) {
      console.error("Error al obtener egresos:", err);
      setEgresos([]);
      setTotal(0);
      setError("Error al obtener egresos. Revisa el backend.");
    } finally {
      setLoading(false);
    }
  }; 

  // --- useEffect para cargar descripciones al inicio ---
  useEffect(() => {
    fetchDescripciones();
    fetchFechaMinima();  // ← AGREGAR esta línea
  }, []);

  // cargar primera vez (no auto-fetch a menos que quieras) -> no carga al montar, sólo al buscar
  // Si prefieres que al entrar no muestre nada hasta buscar, no llames a fetchEgresos aquí.
  // Si quieres que muestre los últimos egresos al entrar (sin filtro), descomenta:
  // useEffect(()=>{ fetchEgresos(1); }, []);

  // --- manejar búsqueda ---
 const handleBuscar = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // ✅ USAR VARIABLES LOCALES y luego actualizar estados
    let desde = fechaDesde;
    let hasta = fechaHasta;
    let mensajeInfo = "";

    // ✅ CASO 1: Solo "De" → asume mismo día
    if (desde && !hasta) {
      hasta = desde;
      mensajeInfo = "📅 Búsqueda de un solo día";
    } 
    // ✅ CASO 2: Solo "A" → asume mismo día
    else if (!desde && hasta) {
      desde = hasta;
      mensajeInfo = "📅 Búsqueda de un solo día";
    } 
    // ✅ CASO 3: Ninguna fecha → búsqueda total
    else if (!desde && !hasta) {
      desde = fechaMinima || "";
      const hoy = new Date();
      hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      mensajeInfo = "📅 Búsqueda total";
    }
    // ✅ CASO 4: Ambas fechas completas
    else {
      mensajeInfo = "Búsqueda realizada";
    }

    // ✅ VALIDAR LÍMITE DE 365 DÍAS
    if (desde && hasta) {
      const fechaDesdeObj = new Date(desde);
      const fechaHastaObj = new Date(hasta);
      const diffDays = Math.ceil((fechaHastaObj - fechaDesdeObj) / (1000 * 60 * 60 * 24));

      if (diffDays > MAX_DAYS) {
        setMensajeIzquierda(`⚠️ Rango muy amplio: ${diffDays} días (máximo: ${MAX_DAYS} días)`);
        setError("");
        setMensajeDerecha("");
        return;
      }

      if (diffDays < 0) {
        setMensajeIzquierda("⚠️ La fecha 'A' debe ser posterior a 'De'");
        setError("");
        setMensajeDerecha("");
        return;
      }
    }

    // ✅ ACTUALIZAR ESTADOS ANTES DE LLAMAR A fetchEgresos
    setFechaDesde(desde);
    setFechaHasta(hasta);
    setPage(1);
    setBusquedaRealizada(true);
    setError("");
    setMensajeIzquierda(mensajeInfo);
    setMensajeDerecha("");

    // ✅ LLAMAR A fetchEgresos con las fechas calculadas
    resetForm();
    fetchEgresos(1);
  };

  // --- limpiar filtros ---
  const handleLimpiar = () => {
    setFechaDesde("");
    setFechaHasta("");
    setInputDescripcion("");
    setEgresos([]);
    setTotal(0);
    setPage(1);
    setFormTitulo("Alta");
    setEditarId(null);
    setNuevoEgreso({
      id: null,
      descripcion_id: "",
      monto: "",
      fecha: "",
      deuda_id: "",
    });
    fetchDeudas();
    setMensajeIzquierda("Filtros limpiados"); // ← Cambio aquí
    setMensajeDerecha(""); // ← Limpiar mensajes del formulario
    setError("");
    setBusquedaRealizada(false);
  };

  const handleAnterior = () => {
  if (page > 1) {
      const nuevaPagina = page - 1;
      setPage(nuevaPagina);  // ← AGREGAR ESTA LÍNEA
      fetchEgresos(nuevaPagina);
    }
  };

const handleSiguiente = () => {
  if (page * limit < total) {
      const nuevaPagina = page + 1;
      setPage(nuevaPagina);  // ← AGREGAR ESTA LÍNEA
      fetchEgresos(nuevaPagina);
    }
  };

  const resetForm = () => {
    setNuevoEgreso({
      id: null,
      descripcion_id: "",
      monto: "",
      fecha: "",
      deuda_id: "",
    });
    
    // Volver a poner foco en descripción después de resetear
    setTimeout(() => {
      if (selectDescripcionRef.current) {
        selectDescripcionRef.current.focus();
      }
    }, 100);
  };

  // --- submit (alta / editar) ---
  // CAMBIO 3: Modificar handleSubmit para notificar cuando se modifica una deuda
  // BUSCAR esta sección en handleSubmit y AGREGAR después de guardar exitosamente:
  const handleSubmit = async (e) => {   
    e.preventDefault();
    
    // ✅ VALIDACIONES MANUALES (mostrar en barra de estado)
    
    // 1. Validar Descripción
    if (!nuevoEgreso.descripcion_id) {
      setMensajeDerecha("⚠️ Por favor, seleccione una descripción");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    
    // 2. Validar Monto
    if (!nuevoEgreso.monto || nuevoEgreso.monto.trim() === '') {
      setMensajeDerecha("⚠️ Por favor, ingrese un monto");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    
    // 3. Validar que el monto sea válido
    const montoConvertido = convertirMontoParaMySQL(nuevoEgreso.monto);
    const montoNumerico = parseFloat(montoConvertido);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setMensajeDerecha("⚠️ Ingrese un monto válido mayor a $0");
      setError("");
      setMensajeIzquierda("");
      return;
    }
    
    // 4. Validar Fecha
    if (!nuevoEgreso.fecha) {
      setMensajeDerecha("⚠️ Por favor, ingrese una fecha");
      setError("");
      setMensajeIzquierda("");
      return;
    }

    setError("");
    setMensajeIzquierda("");
    setMensajeDerecha("");

    // Payload para enviar al backend
    const payload = {
      tipo: "egreso",
      descripcion_id: parseInt(nuevoEgreso.descripcion_id),
      monto: parseFloat(convertirMontoParaMySQL(nuevoEgreso.monto)),
      fecha: nuevoEgreso.fecha,
      deuda_id: nuevoEgreso.deuda_id ? parseInt(nuevoEgreso.deuda_id) : null,
    };

    try {      
      //let url = "`${import.meta.env.VITE_API_URL}`/egresos";
      let url = `${import.meta.env.VITE_API_URL}/egresos`;
      let method = "POST";
      if (editarId) {
        //url = ``${import.meta.env.VITE_API_URL}`/egresos/${editarId}`;
        url = `${import.meta.env.VITE_API_URL}/egresos/${editarId}`;      
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        try {
          const errData = await res.json();
          const msg = errData.detail || errData.message || "Error en el servidor";
          throw new Error(msg);
        } catch {
          throw new Error(`HTTP ${res.status}`);
        }
      }

      const egresoGuardado = await res.json();

      setEditarId(null);
      setNuevoEgreso({
        id: null,
        descripcion_id: "",
        monto: "",
        fecha: "",
        deuda_id: "",
      });
      setFormTitulo("Alta");

      if (busquedaRealizada) {
        setLoading(true);  // ← AGREGAR esta línea ANTES de fetchEgresos
        await fetchEgresos(page);
        setLoading(false); // ← AGREGAR esta línea DESPUÉS de fetchEgresos
      }

      if (payload.deuda_id) {
        await fetchDeudas();
        notifyDeudasChanged('AltaEgreso-Pago');
        console.log('[AltaEgreso] Notificado cambio en deudas después de pago');
      }

      const descripcionNombre = descripciones.find(
        (d) => d.id === parseInt(payload.descripcion_id)
      )?.nombre || "";

      const montoAMostrar = egresoGuardado?.movimiento?.monto || egresoGuardado?.monto || payload.monto;

      setMensajeDerecha(
        editarId
          ? `Egreso editado: ${descripcionNombre} - ${formatearMontoParaMostrar(montoAMostrar)}`
          : `Egreso agregado: ${descripcionNombre} - ${formatearMontoParaMostrar(montoAMostrar)}`
      );
      setMensajeIzquierda("");

    } catch (err) {
      console.error("Error al guardar egreso:", err);
      setError("❌ No se pudo guardar el egreso");
      setMensajeIzquierda("");
      setMensajeDerecha("");
    } 
  };

 const handleEditar = (egr) => {
  setEditarId(egr.id);
  setNuevoEgreso({
    id: egr.id,
    descripcion_id: String(egr.descripcion_id) || "",
    monto: convertirMontoParaEdicion(egr.monto),
    fecha: egr.fecha || "",
    deuda_id: egr.deuda_id ? String(egr.deuda_id) : "",

    // ✅ Guardar el valor exacto (puede ser null, número, string)
    deuda_saldo_antes: egr.deuda_saldo_antes  // ← SIN conversión aquí
  });
  setFormTitulo("Editar");
  if (egr.deuda_id) {
    fetchDeudas(egr.deuda_id);
  } else {
    fetchDeudas();
  }
};

  const handleEliminar = (id) => {
  const egreso = egresos.find(e => e.id === id);
  setEgresoAEliminar(egreso);
  setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    if (!egresoAEliminar) return;
    
    try {
      setError("");
      setLoading(true);
      //const res = await fetch(``${import.meta.env.VITE_API_URL}`/egresos/${egresoAEliminar.id}`, { method: "DELETE" });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/egresos/${egresoAEliminar.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar egreso");
      setMensajeIzquierda(`Egreso eliminado: ${egresoAEliminar.categoria} - ${formatearMontoParaMostrar(egresoAEliminar.monto)}`);
      setMensajeDerecha("");
      
      if (egresoAEliminar.deuda_id) {
        await fetchDeudas();
        notifyDeudasChanged('AltaEgreso-Eliminar-Reversion');
        console.log('[AltaEgreso] Notificado reversión de deuda después de eliminar');
      }
      
      fetchEgresos(page);
      resetForm();
    } catch (err) {
      console.error("Error eliminar:", err);
      setError("❌ No se pudo eliminar el egreso");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setEgresoAEliminar(null);
    }
  };

  // limpiar timers al desmontar
  useEffect(() => {
    return () => clearTimeout(msgTimerRef.current);
  }, []);

  return (
    <div className="egreso-container">
      <h1 className="titulo-principal">Egresos</h1>
      <div className="tabla-filtros">
        <h2>Historial</h2>
        <form className="filtros" onSubmit={handleBuscar}>
          <label className="filtro-label">
            De:
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <DatePicker
                selected={fechaDesde ? new Date(fechaDesde + 'T00:00:00') : null}
                onChange={(date) => setFechaDesde(date ? date.toISOString().split('T')[0] : '')}
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="dd/mm/aaaa"
                className="filtro-input-fecha"
                calendarClassName="calendario-formulario"
                showPopperArrow={false}
              />
              {fechaDesde && (
                <button
                  type="button"
                  className="clear-date-btn"
                  onClick={() => setFechaDesde('')}
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
                selected={fechaHasta ? new Date(fechaHasta + 'T00:00:00') : null}
                onChange={(date) => setFechaHasta(date ? date.toISOString().split('T')[0] : '')}
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="dd/mm/aaaa"
                className="filtro-input-fecha"
                calendarClassName="calendario-formulario"
                showPopperArrow={false}
              />
              {fechaHasta && (
                <button
                  type="button"
                  className="clear-date-btn"
                  onClick={() => setFechaHasta('')}
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
                inputDescripcion === '' || !inputDescripcion
                  ? { value: '', label: 'Todas' }  /* ← Si está vacío, mostrar "Todas" */
                  : descripciones.find(d => d.id === parseInt(inputDescripcion))
                    ? { value: inputDescripcion, label: descripciones.find(d => d.id === parseInt(inputDescripcion)).nombre }
                    : null
              }
              onChange={(opcion) => {
                setInputDescripcion(opcion ? opcion.value : '');
              }}
              options={[
                { value: '', label: 'Todas' },  /* ← AGREGAR esta línea */
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
          <div className="botones-filtro">
            <button type="submit">Buscar</button>
            <button type="button" onClick={handleLimpiar}>Limpiar</button>
          </div>          
        </form>

        <div className="tabla-egresos">
          {loading && <div className="spinner">Cargando...</div>} 
          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Deuda</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {egresos.length === 0 ? (
                <tr><td colSpan="5">No hay registros</td></tr>
              ) : (
                egresos.map((e) => (
                  <tr key={e.id}>
                    <td>{e.categoria}</td>
                    <td>{formatearMontoParaMostrar(e.monto)}</td>
                    <td>{formatearFechaParaMostrar(e.fecha)}</td>
                    <td>
                      {e.deuda_id && e.deuda_saldo_antes != null ? (
                        <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                          {e.deuda_descripcion} — ${Number(e.deuda_saldo_antes).toLocaleString('es-AR')}
                        </span>
                      ) : e.deuda_id ? (
                        <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                          {e.deuda_descripcion} — ?
                        </span>
                      ) : (
                        <span style={{ color: '#666', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>
                    <td className="acciones">
                      <button onClick={() => handleEditar(e)}>Editar</button>
                      <button onClick={() => handleEliminar(e.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="paginacion">
          <button onClick={handleAnterior} disabled={page === 1}>← Anterior</button>
          <div style={{ alignSelf: "center" }}>
            Página {page} de {Math.max(1, Math.ceil(total / limit))}
          </div>
          <button onClick={handleSiguiente} disabled={page * limit >= total}>Siguiente →</button>
        </div>
      </div>

              
      <div className="formulario-egreso">
        <h2>{formTitulo}</h2>
        <form onSubmit={handleSubmit}>
           
          <label>
            Descripción
            <Select
              ref={selectDescripcionRef}
              value={nuevoEgreso.descripcion_id 
                ? descripciones.find(d => d.id === parseInt(nuevoEgreso.descripcion_id))
                  ? { value: nuevoEgreso.descripcion_id, label: descripciones.find(d => d.id === parseInt(nuevoEgreso.descripcion_id)).nombre }
                  : null
                : null
              }
              onChange={(opcion) => {
                setNuevoEgreso({ 
                  ...nuevoEgreso, 
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
              isDisabled={nuevoEgreso.id !== null}
              noOptionsMessage={() => "No se encontraron descripciones"}
              loadingMessage={() => "Cargando..."}
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: '#ccc',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',  // ← NUEVO
                  '&:hover': { borderColor: '#0088fe' }
                }),
                menu: (base) => ({
                  ...base,
                  zIndex: 9999,
                  backgroundColor: '#ffffff'  // ← NUEVO
                }),
                option: (base, state) => ({  // ← NUEVO
                  ...base,
                  backgroundColor: state.isFocused ? '#e3f2fd' : '#ffffff',
                  color: '#333333',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: '#bbdefb'
                  }
                }),
                singleValue: (base) => ({  // ← NUEVO
                  ...base,
                  color: '#333333'
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
              value={nuevoEgreso.monto}
              onChange={(e) => {
                const valorFormateado = formatearMontoInput(e.target.value);
                setNuevoEgreso({ ...nuevoEgreso, monto: valorFormateado });
              }}
              onBlur={(e) => {
                const valorSinFormato = convertirMontoParaMySQL(e.target.value);
                const num = parseFloat(valorSinFormato);
                if (e.target.value && (isNaN(num) || num <= 0 || num > 999999999.99)) {
                  alert('Ingrese un monto válido entre $0,01 y $999.999.999,99');
                  setNuevoEgreso({ ...nuevoEgreso, monto: '' });
                }
              }}
              placeholder="Ej: 1.000,50"              
            />
          </label>
          {/* Contenedor para Fecha y Pagar deuda en la misma línea */}
          <div className="fecha-deuda-container">
            <div className="fecha-input-egreso">
              <label>Fecha</label>
              <DatePicker
                selected={nuevoEgreso.fecha ? new Date(nuevoEgreso.fecha + 'T00:00:00') : null}
                onChange={(date) => {
                  setNuevoEgreso({ 
                    ...nuevoEgreso, 
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
            </div>
            <div className="deuda-input-egreso">
              <label>Pagar deuda (opcional)</label>
              {formTitulo === "Editar" && nuevoEgreso.deuda_id ? (
                <div style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: '#f8f9fa',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap'
                }}>
                  <strong>{nuevoEgreso.deuda_descripcion}</strong> — 
                  Saldo antes: ${typeof nuevoEgreso.deuda_saldo_antes === 'number' && !isNaN(nuevoEgreso.deuda_saldo_antes)
                    ? nuevoEgreso.deuda_saldo_antes.toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })
                    : '—'
                  }
                </div>
              ) : (
                <Select
                  value={nuevoEgreso.deuda_id 
                    ? deudas.find(d => d.id === parseInt(nuevoEgreso.deuda_id))
                      ? { 
                          value: nuevoEgreso.deuda_id, 
                          label: `${deudas.find(d => d.id === parseInt(nuevoEgreso.deuda_id)).descripcion} - $${deudas.find(d => d.id === parseInt(nuevoEgreso.deuda_id)).saldo_pendiente || deudas.find(d => d.id === parseInt(nuevoEgreso.deuda_id)).monto}`
                        }
                      : null
                    : null
                  }
                  onChange={(opcion) => {
                    setNuevoEgreso({ 
                      ...nuevoEgreso, 
                      deuda_id: opcion ? opcion.value : '' 
                    });
                  }}
                  options={deudas.map(d => ({
                    value: d.id,
                    label: `${d.descripcion} - $${d.saldo_pendiente || d.monto}`
                  }))}
                  placeholder="🔍 Buscar deuda..."
                  isSearchable={true}
                  isClearable={true}
                  isDisabled={formTitulo === "Editar"}
                  noOptionsMessage={() => "No hay deudas pendientes"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '42px',
                      borderColor: '#ccc',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',  // ← NUEVO
                      '&:hover': { borderColor: '#0088fe' }
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                      backgroundColor: '#ffffff'  // ← NUEVO
                    }),
                    option: (base, state) => ({  // ← NUEVO
                      ...base,
                      backgroundColor: state.isFocused ? '#e3f2fd' : '#ffffff',
                      color: '#333333',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#bbdefb'
                      }
                    }),
                    singleValue: (base) => ({  // ← NUEVO
                      ...base,
                      color: '#333333'
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: '#6c757d',
                      fontWeight: 400,
                      opacity: 1
                    })
                  }}
                />
              )}
              {formTitulo === "Editar" && nuevoEgreso.deuda_id && (
                <small style={{ display: "block", color: "#666", marginTop: "4px" }}>
                  *  No se puede cambiar la deuda.
                </small>
              )}
            </div>
          </div>          
          <button type="submit">{formTitulo === "Editar" ? "Actualizar" : "Agregar"}</button>          
        </form>        
      </div>

      {/* Barra de estado - abarca el ancho de todo el contenedor */}
      <div className="barra-estado">
        <div className="estado-contenido">
          {/* ✅ IZQUIERDA: Contador y mensajes de tabla */}
          <div className="estado-izquierda">
            {mensajeIzquierda && (
              <span className="mensaje-exito">{mensajeIzquierda}</span>
            )}
            {busquedaRealizada && total > 0 && (
              <span className="estado-contador"> · Mostrando {startIndex}-{endIndex} de {total}</span>
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
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Eliminar este egreso?</h3>
            <p>
              {egresoAEliminar?.categoria} - {formatearMontoParaMostrar(egresoAEliminar?.monto)}
            </p>
            <div className="modal-buttons">
              <button onClick={confirmarEliminar} className="modal-btn-eliminar">
                Eliminar
              </button>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setEgresoAEliminar(null);
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

export default AltaEgreso;