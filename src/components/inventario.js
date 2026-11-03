// src/components/inventario.js
// Piezas del inventario de fuentes. Todo sale de src/data/catalogo.json: una
// fuente se describe una vez ahí y cada página la pinta con estas funciones.
// El JSON es el borrador de lo que pasaría a IberoData (ver /esquema).
import {html} from "npm:htl";
import {seccion} from "./graficas.js";
import {conDescarga} from "./descargar.js";
import {alCambiarModo, alCambiarAncho} from "./base.js";

// --- Catálogo ----------------------------------------------------------------
export function abrirCatalogo(json) {
  const fuentes = json.fuentes;
  const porSlug = new Map(fuentes.map((f) => [f.slug, f]));
  const filtros = new Map(json.filtros.map((f) => [f.id, f]));
  const sitios = new Map(json.sitios.map((s) => [s.id, s]));
  const estados = new Map(json.estados.map((e) => [e.id, e]));
  const estadosFiltro = new Map(json.estadosFiltro.map((e) => [e.id, e]));
  const niveles = json.niveles;
  return {
    json, fuentes, filtros, sitios, estados, estadosFiltro, niveles,
    fuente(slug) {
      const f = porSlug.get(slug);
      if (!f) throw new Error(`catalogo.json no tiene la fuente ${slug}`);
      return f;
    },
  };
}

const ETIQUETA_ESTADO = {analizada: "Con análisis", parcial: "Uso parcial", identificada: "Por analizar"};
const ETIQUETA_BITACORA = {analizada: "Analizada", pendiente: "Pendiente"};

export function chipEstado(estado) {
  return html`<span class="estado-chip estado-${estado}">${ETIQUETA_ESTADO[estado] ?? estado}</span>`;
}

const ETIQUETA_FILTRO = {"probado": "Probado", "disponible": "Disponible", "por-confirmar": "Por confirmar"};
export function chipFiltro(estado) {
  return html`<span class="filtro-chip filtro-${estado}">${ETIQUETA_FILTRO[estado] ?? estado}</span>`;
}

// --- Encabezado de la página de una fuente ----------------------------------
// «Fuente k de n · Estado», h1 con la sigla en rojo y la entradilla, que es
// la «importancia» de la bitácora.
export function encabezado(cat, slug) {
  const f = cat.fuente(slug);
  const k = cat.fuentes.indexOf(f) + 1;
  const grupo = ETIQUETA_ESTADO[f.estado];
  const resto = f.title.startsWith(f.sigla) ? f.title.slice(f.sigla.length) : f.title;
  return html`<header class="encabezado-capitulo encabezado-fuente">
    <p class="antetitulo">Fuente ${k} de ${cat.fuentes.length} · ${grupo} · ${f.sourceOrg}</p>
    <h1>${f.title.startsWith(f.sigla) ? html`<span class="h1-clave">${f.sigla}</span>${resto}` : html`${f.title} <span class="h1-clave">(${f.sigla})</span>`}</h1>
    <p class="entradilla">${f.description}</p>
  </header>`;
}

// --- Ficha ---------------------------------------------------------------
// Rejilla de metadatos (rótulo arriba, valor abajo; lección 71): qué es, qué
// años, qué universo, hasta dónde baja y cómo cambió su estado desde la
// bitácora de septiembre.
export function ficha(cat, slug) {
  const f = cat.fuente(slug);
  const hechas = new Set(f.edicionesProcesadas);
  const ediciones = f.ediciones.length
    ? html`<span class="ediciones">${f.ediciones.map((a) => html`<span class="edicion ${hechas.has(a) ? "edicion-hecha" : ""}" title=${hechas.has(a) ? "Procesada" : "Sin procesar"}>${a}</span>`)}</span>`
    : html`<span class="book-meta-value">Anual, por ciclo escolar</span>`;
  const cambio = f.estadoBitacora == null
    ? "No estaba en la bitácora"
    : `En la bitácora: ${ETIQUETA_BITACORA[f.estadoBitacora]}`;
  return html`<section class="ficha-fuente" aria-label="Ficha de la fuente">
    <div class="book-meta-grid ficha-grid">
      <div class="book-meta-field">
        <span class="book-meta-label">Estado hoy</span>
        <span class="book-meta-value">${chipEstado(f.estado)}</span>
        <span class="book-meta-sub">${cambio}</span>
      </div>
      <div class="book-meta-field">
        <span class="book-meta-label">Tipo</span>
        <span class="book-meta-value">${f.tipo}</span>
        <span class="book-meta-sub">${f.sourceOrg}</span>
      </div>
      <div class="book-meta-field book-meta-field--wide">
        <span class="book-meta-label">Ediciones <span class="leyenda-ediciones">(en negro, las ya procesadas)</span></span>
        ${ediciones}
      </div>
      <div class="book-meta-field book-meta-field--wide">
        <span class="book-meta-label">Universo</span>
        <span class="book-meta-value">${f.universo}</span>
      </div>
      <div class="book-meta-field book-meta-field--wide">
        <span class="book-meta-label">Nivel de desagregación</span>
        ${escalera(cat, f)}
      </div>
      <div class="book-meta-field book-meta-field--wide">
        <span class="book-meta-label">Fuente oficial</span>
        <a class="book-meta-link" href=${f.sourceUrl} target="_blank" rel="noopener">${f.sourceUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a>
      </div>
    </div>
    <p class="ficha-nota"><b>Nota.</b> ${f.nota}</p>
  </section>`;
}

// Escalera de niveles: de lo grande a lo fino, cada peldaño con su estado.
function escalera(cat, f) {
  const pasos = cat.niveles.filter((n) => f.niveles[n.id]);
  return html`<ol class="escalera" aria-label="Niveles territoriales">${pasos.map((n) => html`<li class="peldano peldano-${f.niveles[n.id]}">
    <span class="peldano-nombre">${n.label}</span><span class="peldano-estado">${ETIQUETA_FILTRO[f.niveles[n.id]]}</span>
  </li>`)}</ol>`;
}

// --- Filtros -------------------------------------------------------------
// Dos tablas: identificación indígena y sociodemográficos. Cada renglón dice
// la variable o pregunta exacta y si el filtro ya está construido.
export function tablaFiltros(cat, slug, tipo) {
  const f = cat.fuente(slug);
  const filas = f.filtros.filter((x) => cat.filtros.get(x.filtro)?.tipo === tipo);
  if (!filas.length) return html`<p class="sin-filtros">Esta fuente no tiene filtros de este tipo.</p>`;
  const orden = {"probado": 0, "disponible": 1, "por-confirmar": 2};
  filas.sort((a, b) => orden[a.estado] - orden[b.estado]);
  return html`<div class="tabla-scroll tabla-filtros" tabindex="0" role="region" aria-label=${tipo === "indigena" ? "Filtros de identificación indígena" : "Filtros sociodemográficos"}><table>
    <thead><tr><th>Filtro</th><th>Variable o pregunta</th><th>Estado</th></tr></thead>
    <tbody>${filas.map((x) => html`<tr>
      <td><span class="filtro-nombre">${cat.filtros.get(x.filtro).label}</span>${x.detalle ? html`<span class="filtro-detalle">${x.detalle}</span>` : ""}</td>
      <td class="filtro-variable">${x.variable}</td>
      <td>${chipFiltro(x.estado)}</td>
    </tr>`)}</tbody>
  </table></div>`;
}

export function resumenFiltros(cat, slug) {
  const f = cat.fuente(slug);
  const n = (t, e) => f.filtros.filter((x) => cat.filtros.get(x.filtro)?.tipo === t && (!e || x.estado === e)).length;
  return {indigenas: n("indigena"), indigenasProbados: n("indigena", "probado"), extra: n("sociodemografico"), extraProbados: n("sociodemografico", "probado")};
}

// --- Análisis que ya existen ----------------------------------------------
export function listaAnalisis(cat, slug) {
  const f = cat.fuente(slug);
  if (!f.analisis.length) return html`<p class="sin-analisis">Todavía no hay análisis con esta fuente.</p>`;
  return html`<ul class="lista-analisis">${f.analisis.map((a) => {
    const s = cat.sitios.get(a.sitio);
    const destino = s.url ? `${s.url}${a.ruta}` : `https://github.com/${s.repositorio}`;
    return html`<li class="analisis-item">
      <a class="analisis-titulo" href=${destino} target="_blank" rel="noopener">${a.titulo}</a>
      <span class="analisis-meta"><span class="analisis-sitio">${s.titulo}</span> · ${a.ediciones.join(", ")} · ${a.forma}</span>
      ${s.publicado ? "" : html`<span class="analisis-aviso">Sitio sin publicar: el enlace lleva al repositorio (${a.ruta}).</span>`}
    </li>`;
  })}</ul>`;
}

export function listaPendientes(cat, slug) {
  const f = cat.fuente(slug);
  return html`<ul class="lista-pendientes">${f.pendientes.map((p) => html`<li>${p}</li>`)}</ul>`;
}

// --- Desplegable de explicación ------------------------------------------
// Como el de los otros sitios, pero sin el enlace a Metodología: aquí cada
// muestra remite al análisis completo en su sitio de origen.
export function explicacion(partes, {origen = null} = {}) {
  const lista = (Array.isArray(partes) ? partes : [partes]).filter(Boolean).map((t) => String(t).replace(/\s+/g, " ").trim());
  return html`<details class="explica-analisis">
    <summary>¿Qué quiere decir este análisis?</summary>
    ${lista.map((t) => html`<p>${t}</p>`)}
    ${origen ? html`<div class="explica-mas"><a class="boton-metodo" href=${origen.href} target="_blank" rel="noopener">${origen.texto} <span aria-hidden="true">→</span></a></div>` : ""}
  </details>`;
}

// --- Una muestra con sus filtros ------------------------------------------
// Sección con panel propio (pegajoso y compacto por el script de la
// cabecera), cuerpo que se redibuja con cada cambio de filtro, tema o ancho,
// y los tres desplegables: explicación, verificación y tabla. `dibujar(v)`
// recibe los valores del panel y devuelve [figura, tabla]. `ajustar(v,
// campos)` corre antes de dibujar, para los campos que dependen de otros.
export function muestra({numero, titulo, campos = [], explica, origen, verifica = null, dibujar, ajustar = null}) {
  const panel = html`<div class="panel-filtros"><div class="panel-campos">${campos}</div></div>`;
  const valor = () => Object.fromEntries(campos.map((c) => [c.dataset.campo, c.value]));
  const cuerpo = html`<div class="analisis-cuerpo"></div>`;
  const tabla = html`<div class="tabla-muestra"></div>`;
  const pintar = () => {
    if (ajustar) ajustar(valor(), campos);
    const v = valor();
    cuerpo.style.minHeight = `${cuerpo.offsetHeight}px`;
    const [fig, tab] = dibujar(v);
    cuerpo.replaceChildren(fig);
    tabla.replaceChildren(tab ?? document.createDocumentFragment());
    requestAnimationFrame(() => { cuerpo.style.minHeight = ""; });
    for (const f of cuerpo.querySelectorAll("figure.grafica-tablero")) if (!f.querySelector(".descarga")) conDescarga(f);
  };
  panel.addEventListener("input", pintar);
  alCambiarModo(pintar);
  alCambiarAncho(pintar);
  queueMicrotask(pintar);
  return html`<section class="seccion-analisis">
    ${seccion({numero, titulo})}
    ${campos.length ? panel : ""}
    ${cuerpo}
    ${explicacion(explica, {origen})}
    ${verifica ?? ""}
    ${tabla}
  </section>`;
}
