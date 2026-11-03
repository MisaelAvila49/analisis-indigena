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
  const temas = json.temas;
  const tema = new Map(temas.map((t) => [t.id, t]));
  return {
    json, fuentes, filtros, sitios, estados, estadosFiltro, niveles, temas, tema,
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

// --- Temas ------------------------------------------------------------------
// Cuántos análisis de la fuente tocan cada tema (un análisis puede tocar varios).
export function temasDe(f) {
  const m = new Map();
  for (const a of f.analisis) for (const t of a.temas ?? []) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

const chipTema = (cat, id, clase = "") => html`<span class="tema-chip ${clase}">${cat.tema.get(id)?.label ?? id}</span>`;
const ordenTema = (cat) => (a, b) => cat.temas.findIndex((t) => t.id === a) - cat.temas.findIndex((t) => t.id === b);

// Tabla para exponer: una fila por encuesta y una columna por tema, agrupadas
// (lengua e identidad, población y territorio, condiciones de vida, lo que
// enfrentan). Celda llena con el número de análisis; punteada si la fuente
// permite el tema y todavía no se analiza; vacía si no lo capta.
export function tablaTemas(cat, {estado = "", base = "./"} = {}) {
  const fuentes = cat.fuentes.filter((f) => !estado || f.estado === estado);
  const grupos = [...new Set(cat.temas.map((t) => t.grupo))].map((g) => ({g, temas: cat.temas.filter((t) => t.grupo === g)}));
  const celda = (f, t) => {
    const n = temasDe(f).get(t.id) ?? 0;
    if (n) return html`<td class="tt-celda tt-hecho" title=${`${f.sigla}: ${n} análisis de ${t.label.toLowerCase()}`}><span>${n}</span></td>`;
    if (f.temasPosibles.includes(t.id)) return html`<td class="tt-celda tt-posible" title=${`${f.sigla}: permite analizar ${t.label.toLowerCase()}; todavía no se hace`}><span>○</span><span class="aviso-lector">Se puede analizar, todavía no</span></td>`;
    return html`<td class="tt-celda tt-vacio"><span class="aviso-lector">No lo capta</span></td>`;
  };
  const totalTema = (t) => fuentes.filter((f) => temasDe(f).has(t.id)).length;
  return html`<div class="tabla-temas-caja" tabindex="0" role="region" aria-label="Temas analizados por encuesta"><table class="tabla-temas">
    <thead>
      <tr><th rowspan="2" class="tt-fuente tt-esquina">Fuente</th>${grupos.map(({g, temas}) => html`<th colspan=${temas.length} class="tt-grupo">${g}</th>`)}<th rowspan="2" class="tt-total">Temas</th></tr>
      <tr>${cat.temas.map((t) => html`<th class="tt-tema" scope="col"><span>${t.label}</span></th>`)}</tr>
    </thead>
    <tbody>${fuentes.map((f) => html`<tr class=${`tt-fila tt-${f.estado}`}>
      <th scope="row" class="tt-fuente"><a href=${`${base}fuentes/${f.slug}`}>${f.sigla}</a></th>
      ${cat.temas.map((t) => celda(f, t))}
      <td class="tt-total">${temasDe(f).size || "—"}</td>
    </tr>`)}</tbody>
    <tfoot><tr><th scope="row" class="tt-fuente">Fuentes que lo analizan</th>${cat.temas.map((t) => html`<td class="tt-pie">${totalTema(t) || "—"}</td>`)}<td></td></tr></tfoot>
  </table></div>`;
}

// La misma información leída por tema: qué encuestas ya lo cubren y cuáles
// podrían cubrirlo.
export function listaPorTema(cat, {estado = "", base = "./"} = {}) {
  const fuentes = cat.fuentes.filter((f) => !estado || f.estado === estado);
  return html`<div class="por-tema">${[...new Set(cat.temas.map((t) => t.grupo))].map((g) => html`<div class="por-tema-grupo">
    <h3>${g}</h3>
    <dl>${cat.temas.filter((t) => t.grupo === g).map((t) => {
      const hechas = fuentes.filter((f) => temasDe(f).has(t.id));
      const posibles = fuentes.filter((f) => f.temasPosibles.includes(t.id));
      return html`<div class="por-tema-fila">
        <dt>${t.label}</dt>
        <dd>${hechas.map((f) => html`<a class="fuente-chip fuente-chip-hecha" href=${`${base}fuentes/${f.slug}`}>${f.sigla}</a>`)}${posibles.map((f) => html`<a class="fuente-chip fuente-chip-posible" href=${`${base}fuentes/${f.slug}`} title="Se puede analizar, todavía no">${f.sigla}<span class="aviso-lector"> (posible)</span></a>`)}${hechas.length + posibles.length ? "" : html`<span class="sin-fuente">Ninguna fuente del inventario</span>`}</dd>
      </div>`;
    })}</dl>
  </div>`)}</div>`;
}

// --- Qué ya se analizó (página de cada fuente) -----------------------------
// Resumen arriba: cuántos análisis, en qué temas, con qué ediciones; y cada
// análisis agrupado bajo su tema principal, con los demás temas aparte.
export function queSeAnalizo(cat, slug) {
  const f = cat.fuente(slug);
  const conteo = temasDe(f);
  const posibles = f.temasPosibles.length
    ? html`<p class="qa-posibles"><span class="qa-rotulo">${f.analisis.length ? "Permite y falta" : "Temas que permite"}</span>${f.temasPosibles.map((t) => chipTema(cat, t, "tema-chip-posible"))}</p>` : "";
  if (!f.analisis.length) {
    return html`<div class="que-analizo que-analizo-vacio">
      <p class="qa-resumen"><span class="qa-cifra">0</span> análisis por ahora</p>
      ${posibles}
    </div>`;
  }
  const anios = [...new Set(f.analisis.flatMap((a) => a.ediciones))].sort();
  const porTema = cat.temas.map((t) => ({t, lista: f.analisis.filter((a) => a.temas[0] === t.id)})).filter((x) => x.lista.length);
  const enlace = (a) => {
    const s = cat.sitios.get(a.sitio);
    return s.url ? `${s.url}${a.ruta}` : `https://github.com/${s.repositorio}`;
  };
  return html`<div class="que-analizo">
    <div class="qa-cabeza">
      <p class="qa-resumen"><span class="qa-cifra">${f.analisis.length}</span> ${f.analisis.length === 1 ? "análisis" : "análisis"} en <span class="qa-cifra">${conteo.size}</span> ${conteo.size === 1 ? "tema" : "temas"}<span class="qa-anios">ediciones ${anios[0]}${anios.length > 1 ? ` - ${anios.at(-1)}` : ""}</span></p>
      <p class="qa-temas"><span class="qa-rotulo">Analizado</span>${[...conteo.keys()].sort(ordenTema(cat)).map((t) => chipTema(cat, t, "tema-chip-hecho"))}</p>
      ${posibles}
    </div>
    <div class="qa-grupos">${porTema.map(({t, lista}) => html`<section class="qa-grupo">
      <h3 class="qa-tema">${t.label}</h3>
      <ul class="qa-lista">${lista.map((a) => {
        const s = cat.sitios.get(a.sitio);
        return html`<li class="qa-item">
          <a class="qa-titulo" href=${enlace(a)} target="_blank" rel="noopener">${a.titulo}</a>
          <span class="qa-meta"><span class="qa-anio">${a.ediciones.join(", ")}</span> · ${a.forma}</span>
          <span class="qa-sitio">${s.titulo}${s.publicado ? "" : " · sin publicar, el enlace lleva al repositorio"}</span>
          ${a.temas.length > 1 ? html`<span class="qa-otros">También toca: ${a.temas.slice(1).map((x) => cat.tema.get(x).label.toLowerCase()).join(", ")}</span>` : ""}
        </li>`;
      })}</ul>
    </section>`)}</div>
  </div>`;
}

// --- Tapa del inventario ---------------------------------------------------
// Dibujo de la portada: el inventario mismo, sin cifras. Una fila por fuente
// y una columna por tema; el cuadro lleno es un tema analizado, el contorno
// rojo uno posible y el punto gris lo que la fuente no capta.
export function tapaInventario(cat, logo) {
  const lado = 10, paso = 13;
  const filas = cat.fuentes, cols = cat.temas;
  const w = cols.length * paso, h = filas.length * paso;
  const cuadros = filas.flatMap((f, i) => {
    const hechos = temasDe(f);
    return cols.map((t, j) => {
      const x = j * paso, y = i * paso;
      if (hechos.has(t.id)) return `<rect x="${x}" y="${y}" width="${lado}" height="${lado}" rx="1.5" fill="${f.estado === "analizada" ? "#4d004b" : "#8c6bb1"}"/>`;
      if (f.temasPosibles.includes(t.id)) return `<rect x="${x + 0.75}" y="${y + 0.75}" width="${lado - 1.5}" height="${lado - 1.5}" rx="1.5" fill="none" stroke="#c4101b" stroke-width="1.3"/>`;
      return `<circle cx="${x + lado / 2}" cy="${y + lado / 2}" r="1.4" fill="#cfccc5"/>`;
    });
  }).join("");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "t-mosaico");
  svg.setAttribute("viewBox", `-1 -1 ${w + 1} ${h + 1}`);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.innerHTML = cuadros;
  return html`<div class="lugar-libro" aria-hidden="true">
    <div class="libro v-inv"><div class="libro-cuerpo">
      <div class="tapa"><div class="tapa-contenido">
        <span class="t-sello">Social Data Ibero</span>
        <div class="t-centro">
          ${svg}
          <p class="t-titulo">Fuentes sobre población <em>indígena</em></p>
          <p class="t-sub">Encuestas, censos y registros</p>
        </div>
        <div class="t-pie"><span class="t-anio">MMXXVI</span><img class="t-logo" src=${logo} alt=""></div>
      </div></div>
      <div class="hojas"></div>
    </div></div>
  </div>`;
}
