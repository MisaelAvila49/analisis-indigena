---
title: Fuentes de datos sobre población indígena
toc: false
---

```js
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import {abrirCatalogo, muestra, chipEstado, resumenFiltros, temasDe, tablaTemas, listaPorTema, tapaInventario} from "./components/inventario.js";
import {selector} from "./components/pagina.js";
import {kpis, tablaColumnas, figura} from "./components/graficas.js";
import {leyenda} from "./components/muestras.js";
import {SECUENCIAL, GRIS, COLOR_SERIE, ESTILO_EJES, globo, anchoActual, tintaSobre} from "./components/base.js";
const cat = abrirCatalogo(await FileAttachment("data/catalogo.json").json());
const F = cat.fuentes;
const cuenta = (e) => F.filter((f) => f.estado === e).length;
const todosFiltros = F.flatMap((f) => f.filtros);
const probados = todosFiltros.filter((x) => x.estado === "probado").length;
const nAnalisis = d3.sum(F, (f) => f.analisis.length);
const temasCubiertos = new Set(F.flatMap((f) => [...temasDe(f).keys()]));
const cambiaron = F.filter((f) => f.estadoBitacora === "pendiente" && f.estado !== "identificada");
const ESTADOS_OPC = [["", "Todas las fuentes"], ...cat.json.estados.map((e) => [e.id, e.etiqueta])];
```

```js
display(html`<div class="book-hero book-hero--libro">
  <div class="book-hero-content">
    <span class="book-hero-eyebrow">Bitácora de Ciencia de Datos · Social Data Ibero</span>
    <h1 class="book-hero-title">Qué sabemos ya de la población <span class="clave">indígena</span> y con qué datos</h1>
    <p class="book-hero-dek">Inventario por encuesta, censo y registro</p>
    <p class="book-hero-subtitle">${F.length} fuentes, ${nAnalisis} análisis hechos y ${temasCubiertos.size} de ${cat.temas.length} temas cubiertos. Cada fuente tiene su página con los filtros que trae y una muestra para probarlos.</p>
    <p class="book-hero-abstract">Parte de la bitácora de julio a septiembre de 2026 y la actualiza con lo hecho hasta el 2 de noviembre en los dos sitios del equipo.</p>
    <div class="book-hero-ctas">
      <a class="book-cta book-cta-primary" href="#temas">Ver qué temas se analizaron</a>
      <a class="book-cta" href="#fuentes">Ir a cada fuente</a>
    </div>
  </div>
  ${tapaInventario(cat, FileAttachment("images/social_data_gris.svg").href)}
</div>`);
```

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
    <span class="book-meta-label">Dónde viven los análisis</span>
    <span class="book-meta-value"><a class="book-meta-link" href="https://socialdataibero.github.io/sectei-pueblos-indigenas/" target="_blank" rel="noopener">Poblaciones indígenas en México · Datos estadísticos</a> y Las lenguas indígenas de México en riesgo de desaparecer (sin publicar)</span>
  </div>
</section>

```js
display(kpis([
  {etiqueta: "Análisis hechos", cifra: nAnalisis, nota: "En los dos sitios del equipo"},
  {etiqueta: "Temas cubiertos", cifra: `${temasCubiertos.size} de ${cat.temas.length}`, nota: "Al menos una fuente analizada"},
  {etiqueta: "Fuentes con análisis", cifra: `${cuenta("analizada")} de ${F.length}`, nota: `En septiembre eran 4; ${cuenta("parcial")} más de uso parcial`},
  {etiqueta: "Filtros probados", cifra: `${probados} de ${todosFiltros.length}`, nota: "Identificación y sociodemográficos"},
]));
```

<h2 id="temas" class="toc-anchor">Qué temas ya se analizaron en cada encuesta</h2>

```js
display(muestra({
  numero: "01",
  titulo: "Qué temas ya se analizaron en cada encuesta",
  campos: [
    selector("vista", "Leer", [["encuesta", "Por encuesta (tabla)"], ["tema", "Por tema (lista)"]]),
    selector("estado", "Fuentes", ESTADOS_OPC),
  ],
  explica: [
    "Cada fila es una fuente y cada columna un tema. El número dice cuántos análisis de esa fuente tocan el tema; el círculo, que la fuente permite analizarlo y todavía no se hace; la celda vacía, que la fuente no lo capta. Un análisis puede tocar más de un tema (la pirámide de edades cuenta en «Edad, sexo y hogares» y en «Transmisión de la lengua»).",
    "La lectura por tema responde la pregunta al revés: para un tema, qué fuentes ya lo cubren (rellenas) y cuáles podrían cubrirlo (con borde). La lista completa de análisis está en «Ver los datos».",
  ],
  dibujar: (v) => {
    const sel = F.filter((f) => !v.estado || f.estado === v.estado);
    const cuerpo = v.vista === "tema" ? listaPorTema(cat, {estado: v.estado}) : tablaTemas(cat, {estado: v.estado});
    const items = v.vista === "tema"
      ? [{color: SECUENCIAL[6], texto: "Ya analizado"}, {color: "var(--rojo-chico)", texto: "Se puede analizar, todavía no", forma: "hueco-cuadro"}]
      : [{color: SECUENCIAL[6], texto: "Número de análisis"}, {color: "var(--rojo-chico)", texto: "○ Se puede analizar, todavía no", forma: "hueco-cuadro"}, {color: GRIS.rejilla, texto: "La fuente no lo capta"}];
    const fig = html`<figure class="figura-temas">
      <h3>${v.vista === "tema" ? "Qué fuentes cubren cada tema" : "Temas analizados en cada fuente"}</h3>
      <p class="grafica-sub">${sel.length} fuentes · ${d3.sum(sel, (f) => f.analisis.length)} análisis · ${new Set(sel.flatMap((f) => [...temasDe(f).keys()])).size} de ${cat.temas.length} temas cubiertos</p>
      ${leyenda(items)}
      ${cuerpo}
      <figcaption>Catálogo del inventario · los análisis viven en grupos-originarios y perdida-lengua; los temas posibles salen de los cuestionarios.</figcaption>
    </figure>`;
    const lista = sel.flatMap((f) => f.analisis.map((a) => ({...a, fuente: f.sigla})));
    const tabla = tablaColumnas(lista, [
      {etiqueta: "Fuente", valor: (d) => d.fuente}, {etiqueta: "Tema principal", valor: (d) => cat.tema.get(d.temas[0]).label},
      {etiqueta: "Análisis", valor: (d) => d.titulo}, {etiqueta: "Ediciones", valor: (d) => d.ediciones.join(", ")},
      {etiqueta: "Sitio", valor: (d) => cat.sitios.get(d.sitio).titulo},
    ], {titulo: "Ver los análisis uno por uno"});
    return [fig, tabla];
  },
}));
```

<h2 id="fuentes" class="toc-anchor">Las fuentes, una por una</h2>

```js
const tarjeta = (f) => {
  const r = resumenFiltros(cat, f.slug);
  const t = [...temasDe(f).keys()].sort((a, b) => cat.temas.findIndex((x) => x.id === a) - cat.temas.findIndex((x) => x.id === b));
  return html`<a class="fuente-celda" href=${`./fuentes/${f.slug}`}>
    <span class="fuente-sigla">${f.sigla}</span>
    <span class="fuente-que">${f.title}</span>
    <span class="fuente-temas">${t.length ? t.map((x) => html`<span class="tema-chip tema-chip-hecho">${cat.tema.get(x).label}</span>`) : html`<span class="tema-chip tema-chip-posible">Sin análisis todavía</span>`}</span>
    <span class="fuente-cifras">${f.analisis.length} análisis · ${r.indigenasProbados} de ${r.indigenas} filtros indígenas probados · ${f.ediciones.length > 1 ? `${f.ediciones[0]} - ${f.ediciones.at(-1)}` : f.ediciones.length ? f.ediciones[0] : "anual"}</span>
  </a>`;
};
display(html`<section class="seccion-analisis">
  <header class="seccion-cabeza"><span class="kicker"><span class="kicker-num">02</span> Las fuentes, una por una</span></header>
  ${cat.json.estados.map((e) => html`<div class="grupo-fuentes">
    <h3 class="grupo-fuentes-titulo">${chipEstado(e.id)}<span>${e.descripcion}</span></h3>
    <div class="rejilla-fuentes">${F.filter((f) => f.estado === e.id).map(tarjeta)}</div>
  </div>`)}
</section>`);
```

<h2 id="matriz" class="toc-anchor">Qué filtros tiene cada fuente</h2>

```js
const DIM = [["indigena", "Identificación indígena"], ["sociodemografico", "Sociodemográficos"], ["nivel", "Nivel territorial"]];
const ESTADOS_F = ["probado", "disponible", "por-confirmar"];
const ETQ_F = Object.fromEntries(cat.json.estadosFiltro.map((e) => [e.id, e.etiqueta]));
const SIMBOLO = {"probado": "✓", "disponible": "○", "por-confirmar": "?"};
display(muestra({
  numero: "03",
  titulo: "Qué filtros tiene cada fuente",
  campos: [selector("dim", "Qué comparar", DIM), selector("estado", "Fuentes", ESTADOS_OPC)],
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

<h2 id="estado" class="toc-anchor">Qué ediciones de cada fuente ya están procesadas</h2>

```js
// Par azul y ámbar ya validado en base.js (ΔE 12 en deuteranopía con el gris).
const COLOR_ESTADO = () => ({analizada: COLOR_SERIE["Hombres indígenas"], parcial: COLOR_SERIE["Mujeres indígenas"], identificada: GRIS.trazo});
const ETQ = Object.fromEntries(cat.json.estados.map((e) => [e.id, e.etiqueta]));
const puntos = F.flatMap((f) => f.ediciones.map((a) => ({fuente: f.sigla, slug: f.slug, anio: a, hecha: f.edicionesProcesadas.includes(a), estado: f.estado})));
display(muestra({
  numero: "04",
  titulo: "Qué ediciones de cada fuente ya están procesadas",
  campos: [selector("estado", "Mostrar", ESTADOS_OPC)],
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
