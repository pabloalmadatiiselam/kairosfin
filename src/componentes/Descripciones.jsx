// src/componentes/Descripciones.jsx
import React, { useState, useEffect, useRef } from "react";
import "./Descripciones.css";
import Select from "react-select";

const opcionesTipo = [
  { value: "ingreso", label: "Ingreso" },
  { value: "egreso", label: "Egreso" },
  { value: "deuda", label: "Deuda" }
];

const opcionesTipoEntidad = [
  { value: "persona", label: "Persona" },
  { value: "empresa", label: "Empresa" },
  { value: "organismo", label: "Organismo" }
];

const opcionesEstado = [
  { value: "true", label: "Activas" },
  { value: "false", label: "Inactivas" }
];

function Descripciones() {
  // Estados principales
  const [descripciones, setDescripciones] = useState([]);

  // Formulario para alta/modificación
  const [nuevaDescripcion, setNuevaDescripcion] = useState({
    id: null,
    nombre: "",
    tipo: "",
    activa: true,
    telefono: "",
    email: "",
    direccion: "",
    tipo_entidad: "",
    fecha_creacion: "",
  });

  // Filtros
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterNombre, setFilterNombre] = useState(""); // ← usado en fetch
  const [inputTipo, setInputTipo] = useState("");
  const [inputEstado, setInputEstado] = useState("");
  const [inputNombreId, setInputNombreId] = useState(""); // ← ahora guarda el ID (string)

  // ✅ NUEVO: Opciones para el Select de descripciones (solo nombre + id)
  const [opcionesNombres, setOpcionesNombres] = useState([]);

  const [listCleared, setListCleared] = useState(false);

  const PAGE_SIZE = 4;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Mensajes
  const [mensajeIzquierda, setMensajeIzquierda] = useState(""); // Mensajes de tabla/búsqueda
  const [mensajeDerecha, setMensajeDerecha] = useState(""); // Mensajes de formulario
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [primeraCarga, setPrimeraCarga] = useState(true);

  // Modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [descripcionAEliminar, setDescripcionAEliminar] = useState(null);

  // id de la fila expandida (tel/email/dir)
  const [filaExpandida, setFilaExpandida] = useState(null); 

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

  // ✅ Cargar las opciones de nombres al montar
  useEffect(() => {
    const cargarNombres = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones/nombres`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // 🔴 INSERTAR ESTO AQUÍ (línea nueva):
        if (data.length >= 500) {
          console.warn("⚠️ Muchas descripciones (>500). Considerar AsyncSelect en futuras versiones.");
        }
        setOpcionesNombres(data);        
      } catch (err) {
        console.error("Error al cargar nombres para filtro:", err);
        setOpcionesNombres([]);
      }
    };
    cargarNombres();
  }, []);

  // Fetch descripciones paginadas
  const fetchDescripciones = async (page = 1) => {
    if (listCleared) return { descripciones: [], total: 0 };

    try {
      const params = new URLSearchParams({
        page,
        limit: PAGE_SIZE,
      });

      if (filterTipo) params.append("tipo", filterTipo);
      if (filterEstado) params.append("activa", filterEstado);
      if (filterNombre) params.append("nombre", filterNombre);

      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones/paginadas?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const fetched = data.results || [];
      const total = data.total || 0;

      setDescripciones(fetched);
      setTotalItems(total);

      const totalPagesCalc = Math.max(1, Math.ceil(total / PAGE_SIZE));
      if (page > totalPagesCalc) {
        setCurrentPage(totalPagesCalc);
      }

      return { descripciones: fetched, total };
    } catch (err) {
      console.error("Error al obtener descripciones:", err);
      setDescripciones([]);
      setTotalItems(0);
      if (!primeraCarga) {
        setError("Error al obtener descripciones.");
      }
      setPrimeraCarga(false);
      return { descripciones: [], total: 0 };
    } finally {
      setLoading(false);
    }
  };

  const [busquedaHecha, setBusquedaHecha] = useState(false);

  useEffect(() => {
    if (busquedaHecha && !listCleared) {
      fetchDescripciones(currentPage);
    }
  }, [currentPage, filterTipo, filterEstado, filterNombre, listCleared, busquedaHecha]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalItems);

  // Manejo del formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevaDescripcion({
      ...nuevaDescripcion,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const resetForm = () =>{
    setNuevaDescripcion({
      id: null,
      nombre: "",
      tipo: "",
      activa: true,
      telefono: "",
      email: "",
      direccion: "",
      tipo_entidad: "",
      fecha_creacion: "",
    });
    // Volver a poner foco en descripción después de resetear
    setTimeout(() => {
      if (selectDescripcionRef.current) {
        selectDescripcionRef.current.focus();
      }
    }, 100);
  };
   

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDACIONES MANUALES ✅
    if (!nuevaDescripcion.nombre || nuevaDescripcion.nombre.trim() === "") {
      setMensajeDerecha("Por favor, ingrese una descripción ⚠️");
      setError("");
      setMensajeIzquierda("");
      return;
    }

    if (!nuevaDescripcion.tipo) {
      setMensajeDerecha("Por favor, seleccione un tipo ⚠️");
      setError("");
      setMensajeIzquierda("");
      return;
    }

    try {
      const body = {
        nombre: nuevaDescripcion.nombre,
        tipo: nuevaDescripcion.tipo,
        activa: nuevaDescripcion.activa,
        telefono: nuevaDescripcion.telefono || null,
        email: nuevaDescripcion.email || null,
        direccion: nuevaDescripcion.direccion || null,
        tipo_entidad: nuevaDescripcion.tipo_entidad || null,
        fecha_creacion: nuevaDescripcion.fecha_creacion || null,
      };

      if (nuevaDescripcion.id) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones/${nuevaDescripcion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Error al actualizar (status ${res.status})`);
        setMensajeDerecha(`Descripción editada: ${nuevaDescripcion.nombre}`);
        setMensajeIzquierda("");

        if (busquedaHecha && !listCleared) {
          await fetchDescripciones(currentPage);
        }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Error al crear (status ${res.status})`);
        setMensajeDerecha(`Descripción agregada: ${nuevaDescripcion.nombre}`);
        setMensajeIzquierda("");

        if (busquedaHecha) {
          setCurrentPage(1);
          await fetchDescripciones(1);
        }
      }
    } catch (err) {
      console.error("Error al guardar descripción:", err);
      setError("Error guardando la descripción. ❌");
      setMensajeIzquierda("");
      setMensajeDerecha("");
    }
  };

  const handleEdit = (descripcion) => {
    setNuevaDescripcion({
      id: descripcion.id,
      nombre: descripcion.nombre || "",
      tipo: descripcion.tipo || "",
      activa: descripcion.activa !== undefined ? descripcion.activa : true,
      telefono: descripcion.telefono || "",
      email: descripcion.email || "",
      direccion: descripcion.direccion || "",
      tipo_entidad: descripcion.tipo_entidad || "",
      fecha_creacion: descripcion.fecha_creacion || "",
    });
    setListCleared(false);
  };

  const handleDelete = (id) => {
    const descripcion = descripciones.find((d) => d.id === id);
    setDescripcionAEliminar(descripcion);
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    if (!descripcionAEliminar) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/descripciones/${descripcionAEliminar.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Error al eliminar (status ${res.status})`);

      setMensajeIzquierda(`Descripción eliminada: ${descripcionAEliminar.nombre}`);
      setMensajeDerecha("");
      setError("");
      await fetchDescripciones(currentPage);
      resetForm();
    } catch (err) {
      console.error("Error al eliminar descripción:", err);
      setError("Error al eliminar la descripción. ❌");
      setMensajeIzquierda("");
      setMensajeDerecha("");
    } finally {
      setShowDeleteModal(false);
      setDescripcionAEliminar(null);
    }
  };

  // Busqueda con o sin Filtros
  const handleBuscar = (e) => {
    e.preventDefault();

    let mensajeInfo = "";

    // Convertir ID → nombre real para el backend
    let nombreParaFiltro = "";
    if (inputNombreId) {
      const opcion = opcionesNombres.find((opt) => opt.value === inputNombreId);
      nombreParaFiltro = opcion ? opcion.label : "";
    }

    // DETECTAR SI ES BÚSQUEDA TOTAL (sin filtros)
    if (!inputTipo && !inputEstado && !nombreParaFiltro) {
      mensajeInfo = "Búsqueda total 📅";
    } else {
      mensajeInfo = "Búsqueda realizada";
    }

    setFilterTipo(inputTipo || "");
    setFilterEstado(inputEstado || "");
    setFilterNombre(nombreParaFiltro); // ← nombre real, no ID
    setCurrentPage(1);
    setListCleared(false);
    setError("");
    setMensajeIzquierda(mensajeInfo);
    setMensajeDerecha("");
    setBusquedaHecha(true);
    fetchDescripciones(1);
  };

  // Limpiar Filtros
  const handleLimpiarFiltros = () => {
    setInputTipo("");
    setInputEstado("");
    setInputNombreId(""); // ← resetear el ID
    setFilterTipo("");
    setFilterEstado("");
    setFilterNombre("");
    setCurrentPage(1);
    setDescripciones([]);
    setTotalItems(0);
    setListCleared(true);
    resetForm();
    setError("");
    setMensajeIzquierda("Filtros limpiados");
    setMensajeDerecha("");
    setBusquedaHecha(false);
  };

  // Paginación
  const handlePrevPage = () => {
    if (currentPage <= 1) return;
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    if (currentPage >= totalPages) return;
    setCurrentPage((p) => p + 1);
  };

  const formTitle = nuevaDescripcion.id ? "Editar" : "Alta";
  const prevDisabled = totalItems === 0 || currentPage === 1;
  const nextDisabled = totalItems === 0 || currentPage === totalPages;

  return (
    <div className="descripciones-container">
      <h1 className="titulo-principal">Descripciones</h1>

      <div className="lista-descripciones">
        <h2>Lista</h2>
        <form className="filtros-container" onSubmit={handleBuscar}>
          <div className="filtros-flex">
            {/* ✅ CORREGIDO: ahora usa opcionesNombres */}
            <label>
              Desc:
              <Select
                value={
                  inputNombreId === ""
                    ? { value: "", label: "Todas" }  /* ← Si está vacío, mostrar "Todas" */
                    : opcionesNombres.find((opt) => opt.value === inputNombreId) || null
                }
                onChange={(opcion) => {
                  setInputNombreId(opcion ? opcion.value : "");
                }}
                options={[
                  { value: "", label: "Todas" },  // ← Nueva opción con valor vacío
                  ...opcionesNombres              // ← Las opciones de la BD
                ]}
                placeholder="Buscar descripción..."
                isSearchable={true}
                isClearable={false}
                noOptionsMessage={() => "No hay descripciones"}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "30px",
                    minWidth: "180px",
                    fontSize: "0.75rem",
                    borderColor: "#d0d7dd",
                    borderRadius: "4px",
                    "&:hover": { borderColor: "#0088fe" },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "0 6px",
                  }),
                  input: (base) => ({
                    ...base,
                    margin: "0",
                    padding: "0",
                  }),
                  indicatorSeparator: () => ({
                    display: "none",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    fontSize: "0.75rem",
                  }),
                }}
              />
              {/* 🔴 INSERTAR ESTO JUSTO AQUÍ, después del </Select> */}
              {opcionesNombres.length > 200 && (
                <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '4px' }}>
                  {opcionesNombres.length} descripciones cargadas
                </small>
              )}
            </label>

            <label className="filtro-label">
              Tipo:
              <Select
                value={opcionesTipo.find(opt => opt.value === inputTipo) || null}
                onChange={(opcion) => setInputTipo(opcion ? opcion.value : "")}
                options={[{ value: "", label: "Todos" }, ...opcionesTipo]}
                placeholder="Todos"
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "30px",
                    minWidth: "110px",
                    maxWidth: "110px",
                    fontSize: "0.80rem",
                    borderColor: "#d0d7dd",
                    borderRadius: "6px",
                    "&:hover": { borderColor: "#0088fe" },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "0 6px",
                  }),
                  input: (base) => ({
                    ...base,
                    margin: "0",
                    padding: "0",
                  }),
                  indicatorSeparator: () => ({
                    display: "none",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    fontSize: "0.80rem",
                  }),
                }}
              />
            </label>

            <label className="filtro-label">
              Estado:
              <Select
                value={opcionesEstado.find(opt => opt.value === inputEstado) || null}
                onChange={(opcion) => setInputEstado(opcion ? opcion.value : "")}
                options={[{ value: "", label: "Todos" }, ...opcionesEstado]}
                placeholder="Todos"
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "30px",
                    minWidth: "110px",
                    maxWidth: "110px",
                    fontSize: "0.80rem",
                    borderColor: "#d0d7dd",
                    borderRadius: "6px",
                    "&:hover": { borderColor: "#0088fe" },
                  }),
                  valueContainer: (base) => ({
                    ...base,
                    padding: "0 6px",
                  }),
                  input: (base) => ({
                    ...base,
                    margin: "0",
                    padding: "0",
                  }),
                  indicatorSeparator: () => ({
                    display: "none",
                  }),
                  dropdownIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                  }),
                  clearIndicator: (base) => ({
                    ...base,
                    padding: "4px",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    fontSize: "0.80rem",
                  }),
                }}
              />
            </label>

            <div className="filtros-botones-row">
              <button type="submit" className="filtro-button">Buscar</button>
              <button type="button" onClick={handleLimpiarFiltros} className="filtro-button">
                Limpiar
              </button>
            </div>

            <div className="contador"></div>
          </div>
        </form>

        <div className="tabla-con-scroll">
          {loading && <div className="spinner">Cargando...</div>}

          <table>
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Usos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {descripciones.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay registros para mostrar.</td>
                </tr>
              ) : (
                descripciones.map((descripcion) => {
                  const expandida = filaExpandida === descripcion.id;
                  const tieneUsos = descripcion.uso_count > 0;

                  return (
                    <React.Fragment key={descripcion.id}>
                      {/* ——— FILA PRINCIPAL ——— */}
                      <tr>
                        <td>{descripcion.nombre}</td>
                        <td>{descripcion.tipo}</td>
                        <td className={descripcion.activa ? "estado-activo" : "estado-inactivo"}>
                          {descripcion.activa ? "Activa" : "Inactiva"}
                        </td>
                        <td className="uso-count">{descripcion.uso_count}</td>
                        <td className="acciones">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // ← ✅ IMPIDE que el clic suba al <tr>
                              handleEdit(descripcion);
                            }}
                            disabled={tieneUsos}
                            title={tieneUsos
                              ? `No se puede editar: tiene ${descripcion.uso_count} operación(es) asociada(s)`
                              : "Editar descripción"
                            }
                          >
                            Editar
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // ← ✅ IMPIDE que el clic suba al <tr>
                              handleDelete(descripcion.id);
                            }}
                            disabled={tieneUsos}
                            title={tieneUsos
                              ? `No se puede eliminar: tiene ${descripcion.uso_count} operación(es) asociada(s)`
                              : "Eliminar descripción"
                            }
                          >
                            Eliminar
                          </button>
                          <span 
                            title="Ver más detalles (teléfono, email, dirección)"
                            onClick={(e) => {
                              e.stopPropagation(); // ← evita conflicto si se usa en futuro dentro de <tr>
                              setFilaExpandida(expandida ? null : descripcion.id);
                            }}
                            style={{
                              marginLeft: '8px',
                              fontSize: '1.1rem',
                              cursor: 'pointer', // ← 👈 ahora solo la flecha tiene manito
                              color: '#333'
                            }}
                          >
                            {expandida ? '▼' : '▶'}
                          </span>
                        </td>
                      </tr>
                      {/* ——— FILA EXPANDIDA (detalles adicionales) ——— */}
                      {expandida && (
                        <tr>
                          <td colSpan="5" style={{
                            padding: '12px',
                            backgroundColor: '#f9f9f9',
                            borderTop: '1px solid #eee',
                            fontSize: '0.9rem'
                          }}>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '8px'
                            }}>
                              {descripcion.telefono && (
                                <div><strong>Teléfono:</strong> {descripcion.telefono}</div>
                              )}
                              {descripcion.email && (
                                <div><strong>Email:</strong> {descripcion.email}</div>
                              )}
                              {descripcion.direccion && (
                                <div><strong>Dirección:</strong> {descripcion.direccion}</div>
                              )}
                              {descripcion.tipo_entidad && (
                                <div><strong>Tipo Entidad.:</strong> {descripcion.tipo_entidad}</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="paginacion">
          <button onClick={handlePrevPage} disabled={prevDisabled}>
            ← Anterior
          </button>
          <div>
            Página {currentPage}/{totalPages}
          </div>
          <button onClick={handleNextPage} disabled={nextDisabled}>
            Siguiente →
          </button>
        </div>
      </div>

      <div className="formulario-descripcion">
        <h2>{formTitle}</h2>
        <form onSubmit={handleSubmit}>
          <div className="row-2-cols">
            <label>
              Descripción
              <input
                ref={selectDescripcionRef}
                type="text"
                name="nombre"
                value={nuevaDescripcion.nombre}
                onChange={handleChange}  
                placeholder = "Ej: Banco Macro"               
              />
            </label>
            <label>
              Tipo
              <Select
                name="tipo"
                value={opcionesTipo.find(opt => opt.value === nuevaDescripcion.tipo) || null}
                onChange={(opcion) => {
                  setNuevaDescripcion(prev => ({
                    ...prev,
                    tipo: opcion ? opcion.value : ''
                  }));
                }}
                options={opcionesTipo}
                placeholder="Seleccionar tipo"
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '38px',        // ← CAMBIAR de 30px a 42px
                    fontSize: '1rem',
                    borderColor: '#d0d7dd',
                    borderRadius: '4px',
                    '&:hover': { borderColor: '#0088fe' }
                  }),
                   valueContainer: (base) => ({
                    ...base,
                   padding: '2px 8px'       // ← CAMBIAR de '10px 8px' a '2px 8px'
                  }),
                                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    backgroundColor: '#ffffff'
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#e3f2fd' : '#ffffff',
                    color: '#333333',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    '&:hover': {
                      backgroundColor: '#bbdefb'
                    }
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#333333'
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#999999',
                    fontStyle: 'italic'
                  })
                }}
              />
            </label>
          </div>
          <div className="row-2-cols">
            <label>
              Teléfono(opcional)
              <input
                type="tel"
                name="telefono"
                value={nuevaDescripcion.telefono}
                onChange={handleChange}                
              />
            </label>

            <label>
              Email(opcional)
              <input
                type="email"
                name="email"
                value={nuevaDescripcion.email}
                onChange={handleChange}               
              />
            </label>
          </div>

          <div className="row-2-cols">
            <label>
              Dirección(opcional)
              <input
                type="text"
                name="direccion"
                value={nuevaDescripcion.direccion}
                onChange={handleChange}               
              />
            </label>
            <label>
              Tipo Entidad(opcional)
             <Select
                name="tipo_entidad"
                value={opcionesTipoEntidad.find(opt => opt.value === nuevaDescripcion.tipo_entidad) || null}
                onChange={(opcion) => {
                  setNuevaDescripcion(prev => ({
                    ...prev,
                    tipo_entidad: opcion ? opcion.value : ''
                  }));
                }}
                options={opcionesTipoEntidad}
                placeholder="Seleccionar tipo entidad"
                isClearable={true}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '38px',        // ← CAMBIAR de 30px a 42px
                    fontSize: '1rem',
                    borderColor: '#d0d7dd',
                    borderRadius: '4px',
                    '&:hover': { borderColor: '#0088fe' }
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                    backgroundColor: '#ffffff'
                  }),
                  valueContainer: (base) => ({
                    ...base,                   
                    padding: '2px 8px'       // ← CAMBIAR de '10px 8px' a '2px 8px'                    
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#e3f2fd' : '#ffffff',
                    color: '#333333',
                    cursor: 'pointer',
                    padding: '10px 12px',
                    '&:hover': {
                      backgroundColor: '#bbdefb'
                    }
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#333333'
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: '#999999',
                    fontStyle: 'italic'
                  })
                }}
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="activa"
              checked={nuevaDescripcion.activa}
              onChange={handleChange}
            />
            Activa
          </label>

          <button type="submit">{nuevaDescripcion.id ? "Actualizar" : "Agregar"}</button>
        </form>
      </div>

      <div className="barra-estado">
        <div className="estado-contenido">
          <div className="estado-izquierda">
            {mensajeIzquierda && (
              <span className="mensaje-exito">{mensajeIzquierda}</span>
            )}
            {busquedaHecha && totalItems > 0 && (
              <span className="estado-contador">
                {" · Mostrando "}
                {startIndex}-{endIndex} de {totalItems}
              </span>
            )}
          </div>

          {!mensajeIzquierda && !mensajeDerecha && !error && (
            <div className="estado-centro">
              <span className="mensaje-neutro">No hay operaciones recientes 📌</span>
            </div>
          )}

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
            <h3>¿Eliminar esta descripción?</h3>
            <p>{descripcionAEliminar?.nombre}</p>
            <div className="modal-buttons">
              <button onClick={confirmarEliminar} className="modal-btn-eliminar">
                Eliminar
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDescripcionAEliminar(null);
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

export default Descripciones;