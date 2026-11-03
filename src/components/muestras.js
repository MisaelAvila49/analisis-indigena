// src/components/muestras.js
// Formas de gráfica de las muestras. Todas reciben filas ya filtradas en la
// forma común del inventario (num, den, ee, ...), usan la paleta validada de
// base.js y devuelven una <figure class="grafica-tablero"> con título,
// subtítulo, leyenda y pie. Ninguna promedia tasas: el porcentaje sale de
// num/den de cada fila.
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import {html} from "npm:htl";
import {figura} from "./graficas.js";
import {COLOR_UNICO, ROJO, GRIS, ORDINAL, RAMPA, TIPO, ESTILO_EJES, globo, anchoActual, punto, poblacionCorta, tintaSobre} from "./base.js";

export const pct = (r) => (r && r.den > 0 ? (100 * r.num) / r.den : null);
export const fmtPct = (v, d = 1) => (v == null || !Number.isFinite(v) ? "sin dato" : `${v.toFixed(d)} %`);
export const fmtPuntos = (v) => (v == null ? "sin dato" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)} puntos`);
// Intervalo al 95 % de una proporción con su error estándar (0 a 1).
export const margen = (ee) => (ee ? ` ± ${(196 * ee).toFixed(1)}` : "");

// Leyenda en HTML, encima de la gráfica (lección 98: los rótulos fuera del lienzo).
export function leyenda(items) {
  return html`<div class="leyenda-muestra" role="list">${items.map((i) => html`<span class="leyenda-item" role="listitem">
    <i class="leyenda-marca leyenda-${i.forma ?? "cuadro"}" style=${`--c:${i.color}`} aria-hidden="true"></i>${i.texto}</span>`)}</div>`;
}

const base = (alto, extra = {}) => ({
  width: anchoActual(), height: alto, style: ESTILO_EJES,
  marginLeft: 50, marginRight: 30, marginTop: 16, marginBottom: 40, ...extra,
});

// --- 1. Serie con una unidad destacada ----------------------------------
// Fondo: todas las entidades en gris; el país en morado; la entidad elegida
// en rojo. Responde «cómo va este lugar contra el país y contra los demás».
export function serieDestacada(filas, {destacado = null, etiquetaY = "% de la población", titulo, subtitulo, pie}) {
  const nacional = filas.filter((r) => r.nivel === "nacional");
  const entidades = filas.filter((r) => r.nivel === "entidad");
  const elegida = destacado ? entidades.filter((r) => r.cve === destacado) : [];
  const ancho = anchoActual();
  const alto = Math.max(260, Math.min(420, ancho * 0.42));
  const anios = [...new Set(filas.map((r) => r.edicion))].sort();
  const ultimo = (xs) => xs.filter((r) => r.edicion === anios.at(-1));
  const tip = globo([["Lugar", (d) => d.nombre], ["Año", (d) => d.edicion], ["Hablantes", (d) => fmtPct(d.pct)], ["Población", (d) => poblacionCorta(d.num)]]);
  const svg = Plot.plot({
    ...base(alto, {marginRight: ancho < 520 ? 105 : 150}),
    x: {type: "point", domain: anios, label: null, tickFormat: String},
    y: {label: etiquetaY, grid: true, nice: true, zero: true},
    marks: [
      Plot.line(entidades, {x: "edicion", y: "pct", z: "cve", stroke: GRIS.contexto, strokeWidth: 1, strokeOpacity: 0.7}),
      Plot.line(nacional, {x: "edicion", y: "pct", stroke: COLOR_UNICO, strokeWidth: 3}),
      Plot.dot(nacional, {x: "edicion", y: "pct", fill: COLOR_UNICO, r: 4}),
      Plot.text(ultimo(nacional), {x: "edicion", y: "pct", text: (d) => `País ${fmtPct(d.pct)}`, dx: 8, textAnchor: "start", fill: COLOR_UNICO, fontWeight: 600, fontSize: TIPO.valor}),
      Plot.line(elegida, {x: "edicion", y: "pct", stroke: ROJO, strokeWidth: 3}),
      Plot.dot(elegida, {x: "edicion", y: "pct", fill: ROJO, r: 4}),
      Plot.text(ultimo(elegida), {x: "edicion", y: "pct", text: (d) => `${d.nombre} ${fmtPct(d.pct)}`, dx: 8, textAnchor: "start", fill: ROJO, fontWeight: 600, fontSize: TIPO.valor, lineWidth: 12}),
      Plot.tip(filas, Plot.pointer({x: "edicion", y: "pct", maxRadius: 30, ...tip})),
    ],
  });
  const items = [{color: COLOR_UNICO, texto: "Todo el país", forma: "linea"}, {color: GRIS.contexto, texto: "Cada entidad", forma: "linea"}];
  if (elegida.length) items.push({color: ROJO, texto: elegida[0].nombre, forma: "linea"});
  return figura({titulo, subtitulo, pie}, [leyenda(items), svg]);
}

// --- 2. Ranking de entidades -------------------------------------------
// Paleta de una serie (morado) con la entidad elegida en rojo y el país como
// regla vertical gris.
export function ranking(filas, {rotulo = "Entidad", destacado = null, referencia = null, formato = fmtPct, etiquetaX = "% →", titulo, subtitulo, pie}) {
  const datos = [...filas].sort((a, b) => b.valor - a.valor);
  const ancho = anchoActual();
  const svg = Plot.plot({
    ...base(datos.length * 19 + 50, {marginLeft: ancho < 520 ? 120 : 170, marginRight: 60}),
    x: {label: etiquetaX, grid: true, zero: true, nice: true},
    y: {domain: datos.map((d) => d.nombre), label: null, tickSize: 0},
    marks: [
      referencia != null ? Plot.ruleX([referencia], {stroke: GRIS.tinta, strokeDasharray: "4 3"}) : null,
      Plot.ruleY(datos, {y: "nombre", x1: 0, x2: "valor", stroke: (d) => (d.cve === destacado ? ROJO : COLOR_UNICO), strokeOpacity: 0.55}),
      Plot.dot(datos, {y: "nombre", x: "valor", r: 5, fill: (d) => (d.cve === destacado ? ROJO : COLOR_UNICO)}),
      Plot.text(datos, {y: "nombre", x: "valor", text: (d) => formato(d.valor), dx: 9, textAnchor: "start", fontSize: TIPO.valor, fill: "currentColor"}),
      Plot.tip(datos, Plot.pointerY({y: "nombre", x: "valor", maxRadius: Infinity, ...globo([[rotulo, (d) => d.nombre], ["Valor", (d) => formato(d.valor)], ["Población", (d) => poblacionCorta(d.num)]])})),
    ],
  });
  const items = [{color: COLOR_UNICO, texto: rotulo === "Entidad" ? "Cada entidad" : `Cada ${rotulo.toLowerCase()}`, forma: "punto"}];
  if (referencia != null) items.push({color: GRIS.tinta, texto: `Todo el país: ${formato(referencia)}`, forma: "regla"});
  if (destacado) items.push({color: ROJO, texto: "Entidad elegida", forma: "punto"});
  return figura({titulo, subtitulo, pie}, [leyenda(items), svg]);
}

// --- 3. Dumbbell de dos series ----------------------------------------
// Una fila por categoría y un punto por serie, unidos por una línea gris: la
// distancia entre puntos es la brecha.
export function dumbbell(filas, {series, colores, orden = null, etiquetaX = "% →", margenIzq = 190, titulo, subtitulo, pie, renglones = null}) {
  const cats = orden ?? d3.groupSort(filas, (v) => -d3.max(v, (r) => r.valor), (r) => r.fila);
  const pares = d3.rollups(filas, (v) => ({min: d3.min(v, (r) => r.valor), max: d3.max(v, (r) => r.valor)}), (r) => r.fila).map(([fila, o]) => ({fila, ...o}));
  const ancho = anchoActual();
  const tip = globo(renglones ?? [["Fila", (d) => d.fila], ["Grupo", (d) => d.serie], ["Valor", (d) => fmtPct(d.valor)], ["Población", (d) => poblacionCorta(d.num)]]);
  const svg = Plot.plot({
    ...base(cats.length * 30 + 50, {marginLeft: ancho < 520 ? Math.min(130, margenIzq) : margenIzq, marginRight: 40}),
    x: {label: etiquetaX, grid: true, zero: true, nice: true},
    y: {domain: cats, label: null, tickSize: 0},
    color: {domain: series, range: series.map((s) => colores[s])},
    marks: [
      Plot.ruleY(pares, {y: "fila", x1: "min", x2: "max", stroke: GRIS.trazo, strokeWidth: 2}),
      Plot.dot(filas, {y: "fila", x: "valor", fill: "serie", r: 6, stroke: "var(--theme-background, #fff)", strokeWidth: 1}),
      Plot.tip(filas, Plot.pointer({y: "fila", x: "valor", maxRadius: 40, ...tip})),
    ],
  });
  return figura({titulo, subtitulo, pie}, [leyenda(series.map((s) => ({color: colores[s], texto: s, forma: "punto"}))), svg]);
}

// --- 4. Líneas sobre un eje ordenado (decil, edición) --------------------
export function lineas(filas, {x = "x", dominioX, series, colores, etiquetaX, etiquetaY = "%", titulo, subtitulo, pie, renglones = null, formatoX = String}) {
  const ancho = anchoActual();
  const alto = Math.max(260, Math.min(400, ancho * 0.4));
  const ultimo = filas.filter((r) => r[x] === dominioX.at(-1));
  const tip = globo(renglones ?? [["Grupo", (d) => d.serie], [etiquetaX, (d) => formatoX(d[x])], ["Valor", (d) => fmtPct(d.valor)]]);
  const svg = Plot.plot({
    ...base(alto, {marginRight: 70}),
    x: {type: "point", domain: dominioX, label: etiquetaX, tickFormat: formatoX, padding: 0.3},
    y: {label: etiquetaY, grid: true, zero: true, nice: true},
    color: {domain: series, range: series.map((s) => colores[s])},
    marks: [
      Plot.line(filas, {x, y: "valor", stroke: "serie", strokeWidth: 2.5}),
      Plot.dot(filas, {x, y: "valor", fill: "serie", r: 4}),
      Plot.text(ultimo, {x, y: "valor", text: (d) => fmtPct(d.valor), dx: 10, textAnchor: "start", fill: "serie", fontWeight: 600, fontSize: TIPO.valor}),
      Plot.tip(filas, Plot.pointer({x, y: "valor", maxRadius: 40, ...tip})),
    ],
  });
  return figura({titulo, subtitulo, pie}, [leyenda(series.map((s) => ({color: colores[s], texto: s, forma: "linea"}))), svg]);
}

// --- 5. Heatmap de brecha -----------------------------------------------
// Celdas de dos dimensiones con la brecha (indígena menos resto) en puntos,
// rampa divergente con rojo para «la población indígena por debajo».
export function heatmapBrecha(celdas, {filas, columnas, titulo, subtitulo, pie, tope = 30, etiquetaColumnas = null}) {
  const ancho = anchoActual();
  // El color se calcula aquí y no con la escala de Plot: así la cifra de cada
  // celda elige su tinta por contraste con el relleno real, en los dos temas.
  const escala = d3.scaleLinear().domain([-tope, 0, tope]).range([RAMPA[1], RAMPA[4], RAMPA[7]]).clamp(true).interpolate(d3.interpolateLab);
  const relleno = (d) => (d.brecha == null ? GRIS.rejilla : d3.color(escala(d.brecha)).formatHex());
  const svg = Plot.plot({
    ...base(filas.length * 38 + 40, {marginLeft: ancho < 520 ? 140 : 250, marginTop: 30, marginBottom: 10}),
    x: {domain: columnas, axis: "top", label: null, tickSize: 0},
    y: {domain: filas, label: null, tickSize: 0},
    marks: [
      Plot.cell(celdas, {x: "columna", y: "fila", fill: relleno, inset: 1.5, rx: 3}),
      Plot.text(celdas, {x: "columna", y: "fila", text: (d) => (d.brecha == null ? "s/d" : `${d.brecha > 0 ? "+" : d.brecha < 0 ? "−" : ""}${Math.abs(d.brecha).toFixed(0)}`),
        fill: (d) => tintaSobre(relleno(d)), fontSize: TIPO.valor, fontWeight: 600}),
      Plot.tip(celdas, Plot.pointer({x: "columna", y: "fila", maxRadius: Infinity, ...globo([["Indicador", (d) => d.fila], ["Grupo", (d) => d.columna], ["Brecha", (d) => fmtPuntos(d.brecha)], ["Población indígena", (d) => fmtPct(d.a)], ["Resto", (d) => fmtPct(d.b)]])})),
    ],
  });
  const items = [{color: RAMPA[1], texto: `Población indígena ${tope} puntos o más por debajo`}, {color: RAMPA[4], texto: "Sin brecha"}, {color: RAMPA[7], texto: `${tope} puntos o más por encima`}];
  return figura({titulo, subtitulo, pie}, [leyenda(items), svg]);
}

// --- 6. Barras apiladas por fila ----------------------------------------
// Composición: cada fila suma 100 % (o el total) y los tramos siguen un
// orden natural (grado, tipo), en pasos de la rampa morada.
export function apiladas(filas, {categorias, colores, orden = null, cien = true, margenIzq = 170, etiquetaX, titulo, subtitulo, pie, formatoValor = null}) {
  const totales = d3.rollup(filas, (v) => d3.sum(v, (r) => r.valor), (r) => r.fila);
  const datos = filas.map((r) => ({...r, parte: cien ? (100 * r.valor) / totales.get(r.fila) : r.valor}));
  const filasOrden = orden ?? [...totales.keys()];
  const ancho = anchoActual();
  const fmt = formatoValor ?? ((d) => punto(d.valor));
  const svg = Plot.plot({
    ...base(filasOrden.length * 26 + 50, {marginLeft: ancho < 520 ? Math.min(120, margenIzq) : margenIzq, marginRight: 20}),
    x: {label: etiquetaX ?? (cien ? "% →" : "→"), grid: true, domain: cien ? [0, 100] : undefined},
    y: {domain: filasOrden, label: null, tickSize: 0},
    color: {domain: categorias, range: categorias.map((c) => colores[c])},
    marks: [
      Plot.barX(datos, Plot.stackX({y: "fila", x: "parte", fill: "categoria", order: categorias, inset: 0.5})),
      Plot.tip(datos, Plot.pointerY(Plot.stackX({y: "fila", x: "parte", fill: "categoria", order: categorias, maxRadius: Infinity,
        ...globo([["Fila", (d) => d.fila], ["Grupo", (d) => d.categoria], ["Parte", (d) => (cien ? fmtPct(d.parte) : null)], ["Cantidad", fmt]])}))),
    ],
  });
  return figura({titulo, subtitulo, pie}, [leyenda(categorias.map((c) => ({color: colores[c], texto: c}))), svg]);
}

// Tonos ordinales de la rampa morada para n categorías con orden.
export const pasos = (n) => ORDINAL[Math.max(2, Math.min(5, n))].slice(0, n);
