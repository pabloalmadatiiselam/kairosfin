import React, { useState, useEffect, useRef } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import './Informes.css';
import Select from 'react-select';
//agregar
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import es from 'date-fns/locale/es';
registerLocale('es', es);

// AGREGAR esta función después de los imports, antes de "function Informes()"
const formatearFechaTabla = (fechaISO) => {
  if (!fechaISO) return '-';
  const [año, mes, dia] = fechaISO.split('-');
  return `${dia}/${mes}/${año}`;
};

function Informes() {
  const [reporteSeleccionado, setReporteSeleccionado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [descripcionFiltro, setDescripcionFiltro] = useState('');
  const [opcionesDescripcion, setOpcionesDescripcion] = useState([]);
  const [datos, setDatos] = useState([]);
  const [filtrosColapsados, setFiltrosColapsados] = useState(false);
  
  // Estados para recordar qué informe se consultó
  const [ultimoReporteConsultado, setUltimoReporteConsultado] = useState('');
  const [ultimaFechaDesde, setUltimaFechaDesde] = useState('');
  const [ultimaFechaHasta, setUltimaFechaHasta] = useState(''); 

  // ✅ AGREGAR: Estados para modal de validación
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // Estados de paginación
  const PAGE_SIZE = 9;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Referencias para capturar los gráficos
  const grafico1Ref = useRef(null);
  const grafico2Ref = useRef(null);

  // Ref para el Select de descripción
  const selectDescripcionRef = useRef(null);

  // ✅ NUEVO: Ref para el Select de TIPO DE INFORME
  const selectTipoInformeRef = useRef(null);

  // Autofocus al montar el componente en TIPO DE INFORME
    useEffect(() => {
      const timer = setTimeout(() => {
        if (selectTipoInformeRef.current) {
          selectTipoInformeRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }, []);

  // Cargar descripciones disponibles según el tipo de reporte
  const cargarDescripciones = async (tipoReporte) => {
    if (!tipoReporte) {
      setOpcionesDescripcion([]);
      return;
    }

    try {
      let endpoint = '';
      
      // ✅ NUEVA LÓGICA: Endpoint específico según tipo
      if (['deudas_no_pagadas', 'deudas_pagadas', 'deudas_todas'].includes(tipoReporte)) {
        endpoint = `${import.meta.env.VITE_API_URL}/descripciones/tipo/deuda?solo_nombres=true`;
      } else if (tipoReporte === 'ingresos') {
        endpoint = `${import.meta.env.VITE_API_URL}/descripciones/tipo/ingreso?solo_nombres=true`;
      } else if (tipoReporte === 'egresos') {
        endpoint = `${import.meta.env.VITE_API_URL}/descripciones/tipo/egreso?solo_nombres=true`;
      } else if (tipoReporte === 'ing_egr') {
        const [respuestaIng, respuestaEgr] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/descripciones/tipo/ingreso?solo_nombres=true`),
          fetch(`${import.meta.env.VITE_API_URL}/descripciones/tipo/egreso?solo_nombres=true`)
        ]);
        
        if (!respuestaIng.ok || !respuestaEgr.ok) {
          throw new Error('Error al cargar descripciones');
        }
        
        const datosIng = await respuestaIng.json();
        const datosEgr = await respuestaEgr.json();
        
        // Combinar ambos arrays sin duplicados
        const todosCombinados = [...new Set([...datosIng, ...datosEgr])];
        
        // Convertir a formato react-select
        const opciones = todosCombinados.sort().map(desc => ({
          value: desc,
          label: desc
        }));
        
        setOpcionesDescripcion(opciones);
        return; // Salir aquí porque ya procesamos todo
      }

      // Para los casos simples (deudas, ingresos, egresos):
      if (endpoint) {
        const respuesta = await fetch(endpoint);
        if (!respuesta.ok) throw new Error('Error al cargar descripciones');
        const datos = await respuesta.json();
        
        // Convertir array de strings a formato react-select
        const opciones = datos.map(desc => ({
          value: desc,
          label: desc
        }));
        
        setOpcionesDescripcion(opciones);
      }
      } catch (error) {
        console.error('Error cargando descripciones:', error);
        setOpcionesDescripcion([]);
    }
  };

  const obtenerInforme = async () => {
    // Validar solo tipo de informe
    if (!reporteSeleccionado) {
      setValidationMessage("Por favor seleccioná el tipo de informe.");
      setShowValidationModal(true);
      return;
    }

    // ✅ AUTO-COMPLETAR FECHAS si están vacías (últimos 12 meses)
    let desdeConsulta = fechaDesde;
    let hastaConsulta = fechaHasta;
    let fueAutoCompletado = false;

    if (!fechaDesde || !fechaHasta) {
      const hoy = new Date();
      const hace12Meses = new Date();
      hace12Meses.setMonth(hoy.getMonth() - 12);

      // ✅ CORREGIDO: Convertir a YYYY-MM-DD en hora local
      const formatearFechaLocal = (fecha) => {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
      };

      desdeConsulta = formatearFechaLocal(hace12Meses);
      hastaConsulta = formatearFechaLocal(hoy);

      // Actualizar los inputs visualmente
      setFechaDesde(desdeConsulta);
      setFechaHasta(hastaConsulta);
      
      fueAutoCompletado = true;
    }

    let endpoint = '';

    // Construir parámetro de descripción si existe
    const descripcionParam = descripcionFiltro?.value
      ? `&descripcion=${encodeURIComponent(descripcionFiltro.value)}` 
      : '';

    // Usar desdeConsulta y hastaConsulta en endpoints
    if (reporteSeleccionado === 'deudas_no_pagadas') {
      endpoint = `${import.meta.env.VITE_API_URL}/deudas/no_pagadas?desde=${desdeConsulta}&hasta=${hastaConsulta}${descripcionParam}`;
    } else if (reporteSeleccionado === 'deudas_pagadas') {
      endpoint = `${import.meta.env.VITE_API_URL}/deudas/pagadas?desde=${desdeConsulta}&hasta=${hastaConsulta}${descripcionParam}`;
    } else if (reporteSeleccionado === 'deudas_todas') {
      endpoint = `${import.meta.env.VITE_API_URL}/deudas/todas?desde=${desdeConsulta}&hasta=${hastaConsulta}${descripcionParam}`;
    } else if (reporteSeleccionado === "ingresos") {
      endpoint = `${import.meta.env.VITE_API_URL}/informe/ingresos?desde=${desdeConsulta}&hasta=${hastaConsulta}${descripcionParam}`;
    } else if (reporteSeleccionado === "egresos") {
      endpoint = `${import.meta.env.VITE_API_URL}/informe/egresos?desde=${desdeConsulta}&hasta=${hastaConsulta}${descripcionParam}`;
    } else if (reporteSeleccionado === "ing_egr") {
      endpoint = `${import.meta.env.VITE_API_URL}/informe/ing_egr?desde=${desdeConsulta}&hasta=${hastaConsulta}${descripcionParam}`;
    }

    try {
      const respuesta = await fetch(endpoint);
      if (!respuesta.ok) throw new Error('Error al obtener datos');
      const resultado = await respuesta.json();
      setDatos(resultado);
      setCurrentPage(1);
      setUltimoReporteConsultado(reporteSeleccionado);
      setUltimaFechaDesde(desdeConsulta);
      setUltimaFechaHasta(hastaConsulta);
      setFiltrosColapsados(true);  /* ← AGREGAR ESTA LÍNEA */
      
      if (fueAutoCompletado) {
        console.info("ℹ️ Se aplicó rango automático: últimos 12 meses");
      }
      
    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al obtener el informe.');
    }
  };

  // Función para generar PDF
  const generarPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // ENCABEZADO
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KairosFin', pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 8;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Informe: ${obtenerNombreInforme(ultimoReporteConsultado)}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 6;
    pdf.setFontSize(10);
    pdf.text(`Período: ${formatearFecha(ultimaFechaDesde)} - ${formatearFecha(ultimaFechaHasta)}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 5;

    // ✅ PRIMERO: Mostrar descripción si existe filtro
    if (descripcionFiltro?.value) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Descripción: ${descripcionFiltro.value}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;  // ← Aumentar espacio de 5 a 6
      pdf.setFont('helvetica', 'normal');
    }

    // ✅ SEGUNDO: Agregar totales al PDF (más destacado)
    if (totales) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);  // ← Aumentar de 11 a 12
      
      if (esReporteDeudas) {
        if (ultimoReporteConsultado === 'deudas_todas') {
          pdf.text(`Total: $${totales.totalGeneral.toLocaleString('es-AR')} | Pagado: $${totales.totalPagado.toLocaleString('es-AR')} | Pendiente: $${totales.totalPendiente.toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
        } else if (ultimoReporteConsultado === 'deudas_pagadas') {
          pdf.text(`Total Pagado: $${totales.totalPagado.toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
        } else {
          pdf.text(`Total Pendiente: $${totales.totalPendiente.toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
        }
      }
      
      if (esReporteMovimientos) {
        if (ultimoReporteConsultado === 'ing_egr') {
          pdf.text(`Ingresos: $${totales.totalIngresos.toLocaleString('es-AR')} | Egresos: $${totales.totalEgresos.toLocaleString('es-AR')} | Saldo: $${totales.saldo.toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
        } else if (ultimoReporteConsultado === 'ingresos') {
          pdf.text(`Total Ingresos: $${totales.totalIngresos.toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
        } else {
          pdf.text(`Total Egresos: $${totales.totalEgresos.toLocaleString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });
        }
      }
      
      yPosition += 5;
      pdf.setFont('helvetica', 'normal');
    }   
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}`, pageWidth / 2, yPosition, { align: 'center' });

    yPosition += 10;

    pdf.setDrawColor(0, 123, 255);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    
    yPosition += 8;

    // TABLA COMPLETA (todos los registros)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Datos del Informe', 20, yPosition);
    yPosition += 5;

    // Preparar datos de la tabla según el tipo de reporte
    let columnas = [];
    let filas = [];

    if (esReporteDeudas) {
      columnas = ['Estado', 'Fecha', 'Descripción', 'Monto', 'Vencimiento'];
      filas = datos.map(d => [
        d.pagado ? 'Pagado' : 'Pendiente',
        d.fecha_registro || '-',
        d.descripcion || '-',
        `$${Number(d.monto).toLocaleString('es-AR')}`,
        d.fecha_vencimiento || '-'
      ]);
    } else if (esReporteMovimientos) {
      columnas = ['Tipo', 'Fecha', 'Descripción', 'Monto', 'F. Deuda'];
      filas = datos.map(d => [
        d.tipo || '-',
        d.fecha || '-',
        d.categoria || '-',
        `$${Number(d.monto).toLocaleString('es-AR')}`,
        d.deuda_fecha_registro || '-'
      ]);
    }

    autoTable(pdf,{
      startY: yPosition,
      head: [columnas],
      body: filas,
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 28 },
        2: { cellWidth: 60 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 28 }
      },
      margin: { left: 20, right: 20 }
    });

    yPosition = pdf.lastAutoTable.finalY + 15;

    // GRÁFICOS
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Visualización', 20, yPosition);
    yPosition += 8;

   try {
        // Capturar gráfico 1
        if (grafico1Ref.current) {
          const canvas1 = await html2canvas(grafico1Ref.current, {
            scale: 2,
            backgroundColor: '#ffffff'
          });
          const imgData1 = canvas1.toDataURL('image/png');
          const imgWidth1 = 170; // Ancho completo de la página
          const imgHeight1 = (canvas1.height * imgWidth1) / canvas1.width;
          
          // Verificar si necesita nueva página
          if (yPosition + imgHeight1 > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.addImage(imgData1, 'PNG', 20, yPosition, imgWidth1, imgHeight1);
          yPosition += imgHeight1 + 10; // Espacio entre gráficos
          
          // Capturar gráfico 2
          // Capturar gráfico 2
          if (grafico2Ref.current) {
            const canvas2 = await html2canvas(grafico2Ref.current, {
              scale: 2,
              backgroundColor: '#ffffff'
            });
            const imgData2 = canvas2.toDataURL('image/png');
            const imgWidth2 = 170;
            const imgHeight2 = (canvas2.height * imgWidth2) / canvas2.width;
            
            if (yPosition + imgHeight2 > pageHeight - 20) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.addImage(imgData2, 'PNG', 20, yPosition, imgWidth2, imgHeight2);
            yPosition += imgHeight2 + 15;  // ← CRÍTICO: Actualizar posición Y con espacio extra
          }
        }
      } catch (error) {
        console.error('Error al capturar gráficos:', error);
      }

      // ✅ NUEVO: Agregar tabla de resumen SIEMPRE (sin condiciones)
      // Verificar si necesita nueva página
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen Mensual de Valores', 20, yPosition);
      yPosition += 8;

      // Preparar datos para la tabla según el tipo de reporte
      let columnasResumen = [];
      let filasResumen = [];

      if (ultimoReporteConsultado === 'ing_egr') {
        const datosAgrupados = agruparIngresosEgresosPorMes();
        columnasResumen = ['Mes', 'Ingresos', 'Egresos', 'Saldo'];
        filasResumen = datosAgrupados.map(d => [
          d.mes,
          `$${Number(d.ingresos).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `$${Number(d.egresos).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `$${(Number(d.ingresos) - Number(d.egresos)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
        
        // Agregar fila de totales
        const totalIngresos = datosAgrupados.reduce((sum, d) => sum + Number(d.ingresos), 0);
        const totalEgresos = datosAgrupados.reduce((sum, d) => sum + Number(d.egresos), 0);
        filasResumen.push([
          'TOTALES',
          `$${totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `$${totalEgresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          `$${(totalIngresos - totalEgresos).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
      } else if (ultimoReporteConsultado === 'ingresos') {
        const datosAgrupados = agruparIngresosPorMes();
        columnasResumen = ['Mes', 'Ingresos'];
        filasResumen = datosAgrupados.map(d => [
          d.mes,
          `$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
        
        const totalIngresos = datosAgrupados.reduce((sum, d) => sum + Number(d.total), 0);
        filasResumen.push([
          'TOTAL',
          `$${totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
      } else if (ultimoReporteConsultado === 'egresos') {
        const datosAgrupados = agruparEgresosPorMes();
        columnasResumen = ['Mes', 'Egresos'];
        filasResumen = datosAgrupados.map(d => [
          d.mes,
          `$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
        
        const totalEgresos = datosAgrupados.reduce((sum, d) => sum + Number(d.total), 0);
        filasResumen.push([
          'TOTAL',
          `$${totalEgresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        ]);
      } else if (esReporteDeudas) {
        const datosAgrupados = agruparDeudasPorMes();
        
        if (ultimoReporteConsultado === 'deudas_todas') {
          columnasResumen = ['Mes', 'Total', 'Pagadas', 'Pendientes'];
          filasResumen = datosAgrupados.map(d => [
            d.mes,
            `$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `$${Number(d.pagadas).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `$${Number(d.pendientes).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ]);
          
          const totales = datosAgrupados.reduce((acc, d) => ({
            total: acc.total + Number(d.total),
            pagadas: acc.pagadas + Number(d.pagadas),
            pendientes: acc.pendientes + Number(d.pendientes)
          }), { total: 0, pagadas: 0, pendientes: 0 });
          
          filasResumen.push([
            'TOTALES',
            `$${totales.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `$${totales.pagadas.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            `$${totales.pendientes.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ]);
        } else {
          columnasResumen = ['Mes', 'Monto'];
          filasResumen = datosAgrupados.map(d => [
            d.mes,
            `$${Number(d.total).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ]);
          
          const total = datosAgrupados.reduce((sum, d) => sum + Number(d.total), 0);
          filasResumen.push([
            'TOTAL',
            `$${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          ]);
        }
      }

      // Renderizar la tabla con autoTable
      autoTable(pdf, {
        startY: yPosition,
        head: [columnasResumen],
        body: filasResumen,
        theme: 'striped',
        headStyles: { 
          fillColor: [0, 123, 255], 
          fontSize: 9, 
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 8,
          halign: 'left'
        },
        columnStyles: {
          0: { halign: 'center' }, // Columna Mes centrada
          1: { halign: 'right' },  // Columnas de montos alineadas a derecha
          2: { halign: 'right' },
          3: { halign: 'right' }
        },
        margin: { left: 20, right: 20 },
        // Última fila (TOTALES) con estilo especial
        didParseCell: function(data) {
          if (data.row.index === filasResumen.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [220, 220, 220];
            data.cell.styles.fontSize = 9;
          }
        }
      });

      // PIE DE PÁGINA
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
          `Página ${i} de ${totalPages} - Generado por KairosFin`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Abrir PDF en nueva pestaña
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
  };

  // Agrupar ingresos y egresos por mes
  const agruparIngresosEgresosPorMes = () => {
    const agrupado = {};
    datos.forEach(d => {
      const fecha = new Date(d.fecha);
      const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!agrupado[mesAnio]) {
        agrupado[mesAnio] = { mes: mesAnio, ingresos: 0, egresos: 0 };
      }
      if (d.tipo === "ingreso") {
        agrupado[mesAnio].ingresos += Number(d.monto);
      } else if (d.tipo === "egreso") {
        agrupado[mesAnio].egresos += Number(d.monto);
      }
    });
    return Object.values(agrupado).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  // Agrupar solo ingresos por mes
  const agruparIngresosPorMes = () => {
    const agrupado = {};
    datos.forEach(d => {
      const fecha = new Date(d.fecha);
      const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!agrupado[mesAnio]) {
        agrupado[mesAnio] = { mes: mesAnio, total: 0 };
      }
      agrupado[mesAnio].total += Number(d.monto);
    });
    return Object.values(agrupado).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  // Agrupar solo egresos por mes
  const agruparEgresosPorMes = () => {
    const agrupado = {};
    datos.forEach(d => {
      const fecha = new Date(d.fecha);
      const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!agrupado[mesAnio]) {
        agrupado[mesAnio] = { mes: mesAnio, total: 0 };
      }
      agrupado[mesAnio].total += Number(d.monto);
    });
    return Object.values(agrupado).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  // Agrupar deudas por mes
  const agruparDeudasPorMes = () => {
    const agrupado = {};
    datos.forEach(d => {
      const fecha = new Date(d.fecha_registro);
      const mesAnio = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      if (!agrupado[mesAnio]) {
        agrupado[mesAnio] = { mes: mesAnio, total: 0, pagadas: 0, pendientes: 0 };
      }
      const monto = Number(d.monto);
      agrupado[mesAnio].total += monto;
      
      if (d.pagado) {
        agrupado[mesAnio].pagadas += monto;
      } else {
        agrupado[mesAnio].pendientes += Number(d.saldo_pendiente || monto);
      }
    });
    return Object.values(agrupado).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  // Datos para gráfico de torta de deudas
  const obtenerDatosTortaDeudas = () => {
    let pagadas = 0;
    let pendientes = 0;
    datos.forEach(d => {
      if (d.pagado) {
        pagadas += Number(d.monto);
      } else {
        pendientes += Number(d.saldo_pendiente || d.monto);
      }
    });
    return [
      { name: 'Pagadas', value: pagadas },
      { name: 'Pendientes', value: pendientes }
    ];
  };  

  const COLORS = ['#4CAF50', '#F44336'];

   // Determinar qué tipo de reporte CONSULTADO
  const esReporteDeudas = ['deudas_no_pagadas', 'deudas_pagadas', 'deudas_todas'].includes(ultimoReporteConsultado);
  const esReporteMovimientos = ['ingresos', 'egresos', 'ing_egr'].includes(ultimoReporteConsultado);

  // ✅ NUEVO: Función para calcular totales según tipo de informe
const calcularTotales = () => {
  if (!datos || datos.length === 0) return null;

  if (esReporteDeudas) {
    let totalGeneral = 0;
    let totalPagado = 0;
    let totalPendiente = 0;

    datos.forEach(d => {
      const monto = Number(d.monto);
      totalGeneral += monto;
      
      if (d.pagado) {
        totalPagado += monto;
      } else {
        totalPendiente += Number(d.saldo_pendiente || monto);
      }
    });

    return { totalGeneral, totalPagado, totalPendiente };
  }

  if (esReporteMovimientos) {
    let totalIngresos = 0;
    let totalEgresos = 0;

    datos.forEach(d => {
      const monto = Number(d.monto);
      if (d.tipo === 'ingreso') {
        totalIngresos += monto;
      } else if (d.tipo === 'egreso') {
        totalEgresos += monto;
      }
    });

    const saldo = totalIngresos - totalEgresos;
    return { totalIngresos, totalEgresos, saldo };
  }

  return null;
};

// Calcular totales
const totales = calcularTotales(); 

  // Cálculos de paginación
  const totalItems = datos.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalItems);
  const datosPaginados = datos.slice(startIndex, endIndex);

  // Controles de paginación
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevDisabled = totalItems === 0 || currentPage === 1;
  const nextDisabled = totalItems === 0 || currentPage === totalPages;

  // FUNCIÓN PARA OBTENER EL NOMBRE DEL TIPO DE INFORME
  const obtenerNombreInforme = (tipo) => {
    const nombres = {
      'deudas_no_pagadas': 'Deudas pendientes',
      'deudas_pagadas': 'Deudas pagadas',
      'deudas_todas': 'Todas las deudas',
      'ingresos': 'Ingresos',
      'egresos': 'Egresos',
      'ing_egr': 'Ingresos y Egresos'
    };
    return nombres[tipo] || tipo;
  };

  // FUNCIÓN PARA FORMATEAR FECHA
  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const [año, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${año}`;
  };

  const resetForm = () => {
    setReporteSeleccionado('');
    setFechaDesde('');
    setFechaHasta('');

    // Volver a poner foco en TIPO DE INFORME después de resetear
    setTimeout(() => {
      if (selectTipoInformeRef.current) {  /* ← CAMBIO: usar selectTipoInformeRef */
        selectTipoInformeRef.current.focus();
      }
    }, 100);
  };

  // Renderizar tabla según el tipo de reporte
  const renderTabla = () => {
    if (esReporteDeudas) {
      return (
        <table className="tabla-deudas">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Venc.</th>
            </tr>
          </thead>
          <tbody>
            {datosPaginados.map((fila, index) => (
              <tr key={index}>
                <td>{fila.pagado ? 'Pagado' : 'Pendiente'}</td>
                <td>{formatearFechaTabla(fila.fecha_registro)}</td>
                <td>{fila.descripcion || '-'}</td>
                <td>${Number(fila.monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{formatearFechaTabla(fila.fecha_vencimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (esReporteMovimientos) {
      return (
        <table className="tabla-movimientos">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>F. Deuda</th>
            </tr>
          </thead>
          <tbody>
            {datosPaginados.map((fila, index) => (
              <tr key={index}>
                <td>{fila.tipo || '-'}</td>
                <td>{formatearFechaTabla(fila.fecha)}</td>
                <td>{fila.categoria || '-'}</td>
                <td>${Number(fila.monto).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{formatearFechaTabla(fila.deuda_fecha_registro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    return null;
  };

  // Renderizar gráficos según el tipo de reporte
  const renderGraficos = () => {
    if (ultimoReporteConsultado === 'ing_egr') {
      return (
        <div className="graficos-wrapper">          
          <div className="grafico-container" ref={grafico1Ref}>
            <h4 className="titulo-grafico">Comparativa por Mes - Barras</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agruparIngresosEgresosPorMes()} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="ingresos" fill="#4CAF50" name="Ingresos"/>                  
                <Bar dataKey="egresos" fill="#F44336" name="Egresos"/> 
                  
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-container" ref={grafico2Ref}>
            <h4 className="titulo-grafico">Tendencia por Mes - Líneas</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={agruparIngresosEgresosPorMes()} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#4CAF50" name="Ingresos" strokeWidth={2} />
                <Line type="monotone" dataKey="egresos" stroke="#F44336" name="Egresos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (ultimoReporteConsultado === 'ingresos') {
      const datosIngresos = agruparIngresosPorMes();
      return (
        <div className="graficos-wrapper">          
          <div className="grafico-container" ref={grafico1Ref}>
            <h4 className="titulo-grafico">Ingresos por Mes - Barras</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosIngresos} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="total" fill="#4CAF50" name="Ingresos"/>                  
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-container" ref={grafico2Ref}>
            <h4 className="titulo-grafico">Evolución de Ingresos - Líneas</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosIngresos} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#4CAF50" name="Ingresos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (ultimoReporteConsultado === 'egresos') {
      const datosEgresos = agruparEgresosPorMes();
      return (
        <div className="graficos-wrapper">          
          <div className="grafico-container" ref={grafico1Ref}>
            <h4 className="titulo-grafico">Egresos por Mes - Barras</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosEgresos} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="total" fill="#F44336" name="Egresos"/>                  
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-container" ref={grafico2Ref}>
            <h4 className="titulo-grafico">Evolución de Egresos - Líneas</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosEgresos} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#F44336" name="Egresos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    } else if (esReporteDeudas) {
      const datosDeudas = agruparDeudasPorMes();
      const datosTorta = obtenerDatosTortaDeudas();
      
      return (
        <div className="graficos-wrapper">          
          <div className="grafico-container" ref={grafico1Ref}>
            <h4 className="titulo-grafico">Estado de Deudas - Torta</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 35, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={datosTorta}
                  cx="50%"
                  cy="45%"
                  outerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const color = COLORS[index]; // Obtiene el color según el índice
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill={color}
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        ${value.toLocaleString('es-AR')}
                      </text>
                    );
                  }}
                >
                  {datosTorta.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ paddingTop: '30px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-container" ref={grafico2Ref}>
            <h4 className="titulo-grafico">Deudas por Mes - Barras</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosDeudas} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
               {ultimoReporteConsultado === 'deudas_todas' ? (
                <>
                  <Bar dataKey="pagadas" stackId="a" fill="#4CAF50" name="Pagadas" />
                  <Bar dataKey="pendientes" stackId="a" fill="#F44336" name="Pendientes"/>                     
                </>
                ) : (
                  <Bar 
                    dataKey="total" 
                    fill={ultimoReporteConsultado === 'deudas_pagadas' ? '#4CAF50' : '#F44336'} 
                    name="Monto Deudas" 
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    return null;
  };

  // Forzar altura extra al body para evitar que la barra toque la barra de tareas
  useEffect(() => {
    const originalMinHeight = document.body.style.minHeight;
    document.body.style.minHeight = 'calc(100vh + 80px)';
    
    return () => {
      document.body.style.minHeight = originalMinHeight;
    };
  }, []);  

  return (    
  <div className="contenedor-informes">
    <div className="header-informes">
      <h1 className="informes-titulo">Informes</h1>
      <button 
        className="btn-colapsar-filtros"
        onClick={() => setFiltrosColapsados(!filtrosColapsados)}
        title={filtrosColapsados ? "Mostrar filtros" : "Ocultar filtros"}
      >
        {filtrosColapsados ? '▼ Filtros' : '▲ Filtros'}
      </button>
    </div>

    <div className={`filtros-informe ${filtrosColapsados ? 'colapsado' : ''}`}>
      <label>
        Tipo de informe:
        <Select
          ref={selectTipoInformeRef}
          value={reporteSeleccionado 
            ? { value: reporteSeleccionado, label: obtenerNombreInforme(reporteSeleccionado) }
            : null
          }
          onChange={(opcion) => {
            const nuevoTipo = opcion ? opcion.value : '';
            setReporteSeleccionado(nuevoTipo);
            setDescripcionFiltro('');
            if (nuevoTipo) {
              cargarDescripciones(nuevoTipo);
            } else {
              setOpcionesDescripcion([]);
            }
          }}
          options={[
            { value: 'deudas_no_pagadas', label: 'Deudas pendientes' },
            { value: 'deudas_pagadas', label: 'Deudas pagadas' },
            { value: 'deudas_todas', label: 'Todas las deudas' },
            { value: 'ingresos', label: 'Ingresos' },
            { value: 'egresos', label: 'Egresos' },
            { value: 'ing_egr', label: 'Ingresos y Egresos' }
          ]}
          placeholder="Seleccionar"
          isSearchable={true} /* ← CAMBIO: de false a true para permitir navegación con teclado */
          isClearable={false}
          noOptionsMessage={() => "No hay opciones"}
          menuPortalTarget={document.body}
          menuPosition="fixed"         
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '38px',
              minWidth: '180px',
              maxWidth: '180px',
              fontSize: '0.85rem',
              borderColor: '#ccc',
              borderRadius: '6px',
              '&:hover': { borderColor: '#007bff' }
            }),
            valueContainer: (base) => ({
              ...base,
              padding: '2px 8px'
            }),
            indicatorSeparator: () => ({
              display: 'none'
            }),
            dropdownIndicator: (base) => ({
              ...base,
              padding: '8px'
            }),
            clearIndicator: (base) => ({
              ...base,
              padding: '8px'
            }),
            menu: (base) => ({
              ...base,
              zIndex: 9999
            }),
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999
            })
          }}
        />
      </label>      
      <div className="filtro-fecha-wrapper">
        De:
        <DatePicker
          selected={fechaDesde ? new Date(fechaDesde + 'T00:00:00') : null}
          onChange={(date) => setFechaDesde(date ? date.toISOString().split('T')[0] : '')}
          dateFormat="dd/MM/yyyy"
          locale="es"
          placeholderText="dd/mm/aaaa"
          className="filtro-input-fecha-informe"
          calendarClassName="calendario-formulario"
          showPopperArrow={false}
          popperPlacement="bottom-start"
          portalId="root-portal"
          isClearable={true}  // ← AGREGAR ESTA LÍNEA
        />
      </div>

      <div className="filtro-fecha-wrapper">
        A:
        <DatePicker
          selected={fechaHasta ? new Date(fechaHasta + 'T00:00:00') : null}
          onChange={(date) => setFechaHasta(date ? date.toISOString().split('T')[0] : '')}
          dateFormat="dd/MM/yyyy"
          locale="es"
          placeholderText="dd/mm/aaaa"
          className="filtro-input-fecha-informe"
          calendarClassName="calendario-formulario"
          showPopperArrow={false}
          popperPlacement="bottom-start"
          portalId="root-portal"
          isClearable={true}  // ← AGREGAR ESTA LÍNEA
        />
      </div>
      <label>
        Desc:
        <Select
          value={descripcionFiltro}  /* ← CORRECCIÓN 1: usar descripcionFiltro */
          onChange={(opcion) => setDescripcionFiltro(opcion)}  /* ← CORRECCIÓN 2 */
          options={opcionesDescripcion}  /* ← CORRECCIÓN 3: usar opcionesDescripcion */
          placeholder="Seleccionar"
          isSearchable={true}
          isClearable={true}
          noOptionsMessage={() => "Seleccioná primero el tipo de informe"}  /* ← Mensaje correcto */
          onMenuOpen={() => {  /* ← CORRECCIÓN 4: cargar al abrir si es necesario */
            if (reporteSeleccionado && opcionesDescripcion.length === 0) {
              cargarDescripciones(reporteSeleccionado);
            }
          }}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '38px',
              minWidth: '200px',  /* ← Ancho correcto para Desc */
              maxWidth: '200px',
              fontSize: '0.85rem',
              borderColor: '#ccc',
              borderRadius: '6px',
              '&:hover': { borderColor: '#007bff' }
            }),
            valueContainer: (base) => ({
              ...base,
              padding: '2px 8px'
            }),
            indicatorSeparator: () => ({
              display: 'none'
            }),
            dropdownIndicator: (base) => ({
              ...base,
              padding: '8px'
            }),
            clearIndicator: (base) => ({
              ...base,
              padding: '8px'
            }),
            menu: (base) => ({
              ...base,
              zIndex: 9999
            }),
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999
            })
          }}
        />
      </label>
      
      <button onClick={obtenerInforme}>Consultar</button>
      <button 
        onClick={generarPDF} 
        disabled={datos.length === 0}
        className="btn-pdf-filtros"
      >
        📄 PDF
      </button>
    </div>
      {datos.length > 0 ? (
        <>
          <div className="contenido-informes">
            <div className="tabla-wrapper">               
              <div className="tabla-contenido">
                {renderTabla()}
              </div>

              <div className="paginacion">
                <button onClick={handlePrevPage} disabled={prevDisabled}>← Anterior</button>
                <div>Página {totalItems === 0 ? 0 : currentPage} / {totalItems === 0 ? 0 : totalPages}</div>
                <button onClick={handleNextPage} disabled={nextDisabled}>Siguiente →</button>
              </div>
            </div>

            {renderGraficos()}
          </div>
        </>
      ) : (
        <div className="mensaje-inicial">
          <p>Seleccioná los parámetros y hacé clic en "Consultar" para generar el informe.</p>
        </div>
      )}
      
      {/* BARRA DE ESTADO */}
      <div className="barra-estado">
        {ultimoReporteConsultado ? (
          <>
            <span className="barra-contador">{startIndex + 1}-{endIndex} de {totalItems}</span>
            <span className="barra-separador">•</span>
            <span>{obtenerNombreInforme(ultimoReporteConsultado)}</span>
            <span className="barra-separador">•</span>
            <span>Desde: {formatearFecha(ultimaFechaDesde)}</span>
            <span className="barra-separador">•</span>
            <span>Hasta: {formatearFecha(ultimaFechaHasta)}</span>
            {/* ✅ NUEVO: Mostrar descripción si existe filtro */}
            {descripcionFiltro?.value && (
              <>
                <span className="barra-separador">•</span>
                <strong>Descripción:</strong>
                <span className="barra-descripcion-valor">{descripcionFiltro.value}</span>
              </>
            )}
            
            {/* ✅ NUEVO: Mostrar totales */}
            {totales && (
              <>
                <span className="barra-separador">•</span>
                {esReporteDeudas && (
                  <>
                    {ultimoReporteConsultado === 'deudas_todas' ? (
                      <>
                        <strong>Total:</strong>
                        <span className="barra-monto">${totales.totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="barra-separador-mini">|</span>
                        <strong>Pagado:</strong>
                        <span className="barra-monto barra-monto-positivo">${totales.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="barra-separador-mini">|</span>
                        <strong>Pendiente:</strong>
                        <span className="barra-monto barra-monto-negativo">${totales.totalPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    ) : ultimoReporteConsultado === 'deudas_pagadas' ? (
                      <>
                        <strong>Total Pagado:</strong>
                        <span className="barra-monto barra-monto-positivo">${totales.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    ) : (
                      <>
                        <strong>Total Pendiente:</strong>
                        <span className="barra-monto barra-monto-negativo">${totales.totalPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    )}
                  </>
                )}
                
                {esReporteMovimientos && (
                  <>
                    {ultimoReporteConsultado === 'ing_egr' ? (
                      <>
                        <strong>Ingresos:</strong>
                        <span className="barra-monto barra-monto-positivo">${totales.totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="barra-separador-mini">|</span>
                        <strong>Egresos:</strong>
                        <span className="barra-monto barra-monto-negativo">${totales.totalEgresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="barra-separador-mini">|</span>
                        <strong>Saldo:</strong>
                        <span className={`barra-monto ${totales.saldo >= 0 ? 'barra-monto-positivo' : 'barra-monto-negativo'}`}>
                          ${totales.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </>
                    ) : ultimoReporteConsultado === 'ingresos' ? (
                      <>
                        <strong>Total Ingresos:</strong>
                        <span className="barra-monto barra-monto-positivo">${totales.totalIngresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    ) : (
                      <>
                        <strong>Total Egresos:</strong>
                        <span className="barra-monto barra-monto-negativo">${totales.totalEgresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <span className="mensaje-neutro">No hay operaciones recientes</span>
        )}
      </div> 
      {/* ✅ MODAL DE VALIDACIÓN */}
      {showValidationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>⚠️ Atención</h3>
            <p>{validationMessage}</p>
            <div className="modal-buttons">
              <button 
                onClick={() => setShowValidationModal(false)}
                className="modal-btn-cancelar"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>          
  );
}

export default Informes;
                        
   