---
title: Fuentes de datos sobre población indígena
toc: false
---

```js
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import {abrirCatalogo, muestra, chipEstado, resumenFiltros} from "./components/inventario.js";
import {selector} from "./components/pagina.js";
import {kpis, tablaColumnas, figura} from "./components/graficas.js";
import {leyenda} from "./components/muestras.js";
import {SECUENCIAL, GRIS, COLOR_SERIE, TIPO, ESTILO_EJES, globo, anchoActual, punto, tintaSobre} from "./components/base.js";
const cat = abrirCatalogo(await FileAttachment("data/catalogo.json").json());
const F = cat.fuentes;
const cuenta = (e) => F.filter((f) => f.estado === e).length;
const todosFiltros = F.flatMap((f) => f.filtros);
const probados = todosFiltros.filter((x) => x.estado === "probado").length;
const nAnalisis = d3.sum(F, (f) => f.analisis.length);
const cambiaron = F.filter((f) => f.estadoBitacora === "pendiente" && f.estado !== "identificada");
```

<div class="book-hero book-hero--inventario">
  <div class="book-hero-content">
    <span class="book-hero-eyebrow">Bitácora de Ciencia de Datos · Social Data Ibero</span>
    <h1 class="book-hero-title">Qué hay sobre población <span class="clave">indígena</span>, qué filtros sirven y qué falta</h1>
    <p class="book-hero-abstract">Inventario de las encuestas, censos, registros e indicadores con los que se puede identificar a la población indígena en México. Cada fuente tiene su página: qué filtros de identificación y sociodemográficos trae, hasta qué nivel territorial baja, qué análisis ya existen en los sitios del equipo y una muestra con sus filtros para probarlos. Parte de la bitácora de julio a septiembre de 2026 y la actualiza con lo hecho hasta el 2 de noviembre.</p>
    <div class="book-hero-ctas">
      <a class="book-cta book-cta-primary" href="#fuentes">Ver las fuentes</a>
      <a class="book-cta" href="./esquema">Esquema de datos</a>
    </div>
  </div>
</div>

<section class="book-meta-grid" aria-label="Información del inventario">
  <div class="book-meta-field book-meta-field--wide">
    <span class="book-meta-label">Autores</span>
    <ul class="book-authors">
      <li>Misael Saúl Avila López <a href="https://orcid.org/0009-0003-9606-354X" target="_blank" rel="noopener" aria-label="ORCID de Misael Saúl Avila López"><img class="orcid-icon" src="https://orcid.org/assets/vectors/orcid.logo.icon.svg" alt=""></a></li>
      <li>Diego Hernández</li>
    </ul>
  </div>
  <div class="book-meta-field">
    <span class="book-meta-label">Afiliación</span>
    <span class="book-meta-value">Social Data Ibero</span>
    <span class="book-meta-sub">Equipo de Ciencia de Datos, Universidad Iberoamericana</span>
  </div>
  <div class="book-meta-field">
    <span class="book-meta-label">Corte</span>
    <span class="book-meta-value">2 de noviembre de 2026</span>
    <span class="book-meta-sub">Base: bitácora julio - septiembre 2026</span>
  </div>
  <div class="book-meta-field book-meta-field--wide">
    <span class="book-meta-label">Sitios de origen de los análisis</span>
    <span class="book-meta-value"><a class="book-meta-link" href="https://socialdataibero.github.io/sectei-pueblos-indigenas/" target="_blank" rel="noopener">Poblaciones indígenas en México · Datos estadísticos</a> y Las lenguas indígenas de México en riesgo de desaparecer (sin publicar)</span>
  </div>
</section>

```js
display(kpis([
  {etiqueta: "Fuentes en el inventario", cifra: F.length, nota: `${cuenta("analizada")} con análisis, ${cuenta("parcial")} de uso parcial y ${cuenta("identificada")} por analizar`},
  {etiqueta: "Con análisis", cifra: cuenta("analizada"), nota: "En septiembre eran 4"},
  {etiqueta: "Filtros construidos y probados", cifra: `${probados} de ${todosFiltros.length}`, nota: "Sumando todas las fuentes"},
  {etiqueta: "Análisis publicados o listos", cifra: nAnalisis, nota: "En los dos sitios del equipo"},
]));
```

<h2 id="estado" class="toc-anchor">Qué ediciones de cada fuente ya están procesadas</h2>

```js
// Par azul y ámbar ya validado en base.js (ΔE 12 en deuteranopía con el gris).
const COLOR_ESTADO = () => ({analizada: COLOR_SERIE["Hombres indígenas"], parcial: COLOR_SERIE["Mujeres indígenas"], identificada: GRIS.trazo});
const ETQ = Object.fromEntries(cat.json.estados.map((e) => [e.id, e.etiqueta]));
const puntos = F.flatMap((f) => f.ediciones.map((a) => ({fuente: f.sigla, slug: f.slug, anio: a, hecha: f.edicionesProcesadas.includes(a), estado: f.estado})));
display(muestra({
  numero: "01",
  titulo: "Qué ediciones de cada fuente ya están procesadas",
  campos: [selector("estado", "Mostrar", [["", "Todas las fuentes"], ...cat.json.estados.map((e) => [e.id, e.etiqueta])])],
  explica: [
    "Cada fila es una fuente y cada punto, una edición o año de levantamiento. El punto relleno indica que esa edición ya está procesada en alguno de los dos sitios del equipo; el hueco, que existe pero no se ha trabajado. El color dice el estado de la fuente.",
    `Desde la bitácora de septiembre cambiaron de «pendiente» a trabajadas: ${cambiaron.map((f) => f.sigla).join(", ")}. Se agregaron la Encuesta Intercensal 2025 y el catálogo del INALI, que no estaban en la bitácora. El Formato 911 no aparece porque es anual por ciclo escolar y no se ha elegido el periodo.`,
  ],
  dibujar: (v) => {
    const sel = puntos.filter((p) => !v.estado || p.estado === v.estado);
    const filas = F.filter((f) => !v.estado || f.estado === v.estado).filter((f) => f.ediciones.length).map((f) => f.sigla);
    const col = COLOR_ESTADO();
    const ancho = anchoActual();
    const svg = Plot.plot({
      width: ancho, height: filas.length * 30 + 50, style: ESTILO_EJES,
      marginLeft: 140, marginRight: 20, marginTop: 10, marginBottom: 36,
      x: {label: "Año de levantamiento →", tickFormat: String, domain: [1988, 2026], grid: true, ticks: ancho < 600 ? 4 : 8},
      y: {domain: filas, label: null, tickSize: 0},
      marks: [
        Plot.ruleY(filas, {stroke: GRIS.rejilla}),
        Plot.dot(sel, {x: "anio", y: "fuente", r: 6.5, stroke: (d) => col[d.estado], strokeWidth: 2, fill: (d) => (d.hecha ? col[d.estado] : "var(--theme-background, #fff)")}),
        Plot.tip(sel, Plot.pointer({x: "anio", y: "fuente", maxRadius: 30, ...globo([["Fuente", (d) => d.fuente], ["Año", (d) => d.anio], ["Estado", (d) => (d.hecha ? "Procesada" : "Sin procesar")]])})),
      ],
    });
    const items = [
      ...cat.json.estados.filter((e) => !v.estado || e.id === v.estado).map((e) => ({color: col[e.id], texto: e.etiqueta, forma: "punto"})),
      {color: GRIS.trazo, texto: "Hueco: edición sin procesar", forma: "hueco"},
    ];
    const fig = figura({titulo: "Ediciones de cada fuente", subtitulo: `${filas.length} fuentes · relleno: procesada; hueco: sin procesar`, pie: "Catálogo del inventario · cada punto es una edición o año de levantamiento."}, [leyenda(items), svg]);
    const tabla = tablaColumnas(F.filter((f) => !v.estado || f.estado === v.estado), [
      {etiqueta: "Fuente", valor: (d) => d.sigla}, {etiqueta: "Estado", valor: (d) => ETQ[d.estado]},
      {etiqueta: "Bitácora", valor: (d) => d.estadoBitacora ?? "no estaba"},
      {etiqueta: "Ediciones", valor: (d) => d.ediciones.join(", ") || "por ciclo escolar"},
      {etiqueta: "Procesadas", valor: (d) => d.edicionesProcesadas.join(", ") || "ninguna"},
    ]);
    return [fig, tabla];
  },
}));
```

<h2 id="matriz" class="toc-anchor">Qué filtros tiene cada fuente</h2>

```js
const DIM = [["indigena", "Identificación indígena"], ["sociodemografico", "Sociodemográficos"], ["nivel", "Nivel territorial"]];
const ESTADOS_F = ["probado", "disponible", "por-confirmar"];
const ETQ_F = Object.fromEntries(cat.json.estadosFiltro.map((e) => [e.id, e.etiqueta]));
const SIMBOLO = {"probado": "✓", "disponible": "○", "por-confirmar": "?"};
display(muestra({
  numero: "02",
  titulo: "Qué filtros tiene cada fuente",
  campos: [
    selector("dim", "Qué comparar", DIM),
    selector("estado", "Fuentes", [["", "Todas"], ...cat.json.estados.map((e) => [e.id, e.etiqueta])]),
  ],
  explica: [
    "Cada celda dice si una fuente tiene un filtro: construido y probado en un análisis (✓), disponible en la fuente pero sin construir (○) o por confirmar (?). Una celda vacía quiere decir que la fuente no lo capta.",
    "«Nivel territorial» cambia las columnas por los niveles a los que baja cada fuente, del país a la manzana (o la escuela en el Formato 911). Es la vista para saber con qué se puede jugar en cada pregunta antes de pedir un análisis.",
  ],
  dibujar: (v) => {
    const fuentes = F.filter((f) => !v.estado || f.estado === v.estado);
    let columnas, celdas;
    if (v.dim === "nivel") {
      columnas = cat.niveles.map((n) => n.label);
      celdas = fuentes.flatMap((f) => cat.niveles.filter((n) => f.niveles[n.id]).map((n) => ({fuente: f.sigla, columna: n.label, estado: f.niveles[n.id], detalle: ""})));
    } else {
      const lista = [...cat.filtros.values()].filter((x) => x.tipo === v.dim);
      columnas = lista.map((x) => x.label);
      celdas = fuentes.flatMap((f) => f.filtros.filter((x) => cat.filtros.get(x.filtro)?.tipo === v.dim)
        .map((x) => ({fuente: f.sigla, columna: cat.filtros.get(x.filtro).label, estado: x.estado, detalle: x.variable})));
    }
    // Probado y disponible: dos pasos de la rampa morada; por confirmar, celda
    // hueca con borde punteado (no un tercer tono: el gris quedaba a ΔE 7.7
    // del morado claro). Cada celda lleva además su símbolo.
    const col = {"probado": SECUENCIAL[6], "disponible": SECUENCIAL[3], "por-confirmar": "none"};
    const tinta = {"probado": tintaSobre(SECUENCIAL[6]), "disponible": tintaSobre(SECUENCIAL[3]), "por-confirmar": GRIS.tinta};
    const ancho = anchoActual();
    const filas = fuentes.map((f) => f.sigla);
    const svg = Plot.plot({
      width: Math.max(ancho, 640), height: filas.length * 32 + 130, style: ESTILO_EJES,
      marginLeft: 140, marginRight: 90, marginTop: 120, marginBottom: 10,
      x: {domain: columnas, axis: "top", label: null, tickRotate: -35, tickSize: 0},
      y: {domain: filas, label: null, tickSize: 0},
      marks: [
        Plot.cell(filas.flatMap((f) => columnas.map((c) => ({f, c}))), {x: "c", y: "f", fill: GRIS.rejilla, inset: 1.5, rx: 3}),
        Plot.cell(celdas, {x: "columna", y: "fuente", fill: (d) => col[d.estado], stroke: (d) => (d.estado === "por-confirmar" ? GRIS.trazo : "none"), strokeDasharray: "3 2", strokeWidth: 1.5, inset: 2.5, rx: 3}),
        Plot.text(celdas, {x: "columna", y: "fuente", text: (d) => SIMBOLO[d.estado], fill: (d) => tinta[d.estado], fontSize: 14, fontWeight: 700}),
        Plot.tip(celdas, Plot.pointer({x: "columna", y: "fuente", maxRadius: Infinity, ...globo([["Fuente", (d) => d.fuente], ["Filtro", (d) => d.columna], ["Estado", (d) => ETQ_F[d.estado]], ["Variable", (d) => d.detalle]])})),
      ],
    });
    const items = ESTADOS_F.map((e) => ({color: e === "por-confirmar" ? GRIS.trazo : col[e], texto: `${SIMBOLO[e]} ${ETQ_F[e]}`, forma: e === "por-confirmar" ? "hueco-cuadro" : "cuadro"}));
    const fig = figura({titulo: `${DIM.find((d) => d[0] === v.dim)[1]}: qué tiene cada fuente`, subtitulo: `${filas.length} fuentes · ${celdas.filter((c) => c.estado === "probado").length} celdas probadas de ${celdas.length}`,
      pie: "Catálogo del inventario · cada fila es una fuente y cada columna un filtro o nivel; la celda vacía indica que la fuente no lo capta."},
      [leyenda(items), html`<div class="matriz-scroll" tabindex="0" role="region" aria-label="Matriz de filtros por fuente">${svg}</div>`]);
    const tabla = tablaColumnas(celdas, [
      {etiqueta: "Fuente", valor: (d) => d.fuente}, {etiqueta: v.dim === "nivel" ? "Nivel" : "Filtro", valor: (d) => d.columna},
      {etiqueta: "Estado", valor: (d) => ETQ_F[d.estado]}, {etiqueta: "Variable o pregunta", valor: (d) => d.detalle},
    ]);
    return [fig, tabla];
  },
}));
```

<h2 id="fuentes" class="toc-anchor">Las fuentes, una por una</h2>

```js
const seccionFuentes = html`<section class="seccion-analisis">
  <header class="seccion-cabeza"><span class="kicker"><span class="kicker-num">03</span> Las fuentes, una por una</span></header>
  <div class="rejilla-fuentes">${cat.json.estados.flatMap((e) => [
    html`<h3>${chipEstado(e.id)} <span>${e.descripcion}</span></h3>`,
    ...F.filter((f) => f.estado === e.id).map((f) => {
      const r = resumenFiltros(cat, f.slug);
      return html`<div class="fuente-celda">
        <a href=${`./fuentes/${f.slug}`}>${f.sigla}</a>
        <span class="fuente-que">${f.title}</span>
        <span class="fuente-cifras">${f.ediciones.length ? `${f.ediciones[0]} - ${f.ediciones.at(-1)}` : "Anual"} · ${r.indigenasProbados} de ${r.indigenas} filtros indígenas probados · ${f.analisis.length} análisis</span>
      </div>`;
    }),
  ])}</div>
</section>`;
display(seccionFuentes);
```
