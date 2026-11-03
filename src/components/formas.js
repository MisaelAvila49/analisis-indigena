// src/components/formas.js
// Formas del catálogo de gráficas de Social Data Ibero (Framework/
// CatalogoGraficas.html) adaptadas al sistema de este sitio: colores de
// base.js, globos con globo() y ejes o escalas fijas que pasa quien llama.
// Cada forma responde una pregunta distinta; la ficha del catálogo dice cuándo
// sí y cuándo no, y esa regla se copia en el comentario de cada función.

import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
import {sankey as d3Sankey} from "npm:d3-sankey";
import {COLOR_UNICO, COLOR_REFERENCIA, ROJO, GRIS, FONDO, ORDINAL, SECUENCIAL, RAMPA, TIPO, ESTILO_EJES, MODO, globo, punto} from "./base.js";

// Clave INEGI de dos dígitos -> clave ISO de tres letras (la del geojson,
// "MX-XXX", y la del mosaico).
export const CVE_ISO = {"01": "AGU", "02": "BCN", "03": "BCS", "04": "CAM", "05": "COA", "06": "COL", "07": "CHP", "08": "CHH",
  "09": "CMX", "10": "DUR", "11": "GUA", "12": "GRO", "13": "HID", "14": "JAL", "15": "MEX", "16": "MIC", "17": "MOR",
  "18": "NAY", "19": "NLE", "20": "OAX", "21": "PUE", "22": "QUE", "23": "ROO", "24": "SLP", "25": "SIN", "26": "SON",
  "27": "TAB", "28": "TAM", "29": "TLA", "30": "VER", "31": "YUC", "32": "ZAC"};

// Cuadrícula del mosaico de entidades (NPR, Danny DeBelius, 2015), tal como
// la trae el catálogo: [columna, fila, abreviatura].
const MOSAICO = {AGU: [2, 2, "AGS"], BCN: [0, 0, "BC"], BCS: [0, 1, "BCS"], CAM: [7, 4, "CAM"], COA: [3, 0, "COAH"], COL: [1, 4, "COL"],
  CHP: [6, 5, "CHIS"], CHH: [2, 0, "CHIH"], CMX: [4, 3, "CDMX"], DUR: [2, 1, "DGO"], GUA: [3, 2, "GTO"], GRO: [3, 4, "GRO"],
  HID: [5, 2, "HGO"], JAL: [1, 3, "JAL"], MEX: [3, 3, "MEX"], MIC: [2, 3, "MICH"], MOR: [4, 4, "MOR"], NAY: [1, 2, "NAY"],
  NLE: [4, 0, "NL"], OAX: [5, 4, "OAX"], PUE: [6, 3, "PUE"], QUE: [4, 2, "QRO"], ROO: [8, 5, "QROO"], SLP: [4, 1, "SLP"],
  SIN: [1, 1, "SIN"], SON: [1, 0, "SON"], TAB: [6, 4, "TAB"], TAM: [5, 1, "TAMPS"], TLA: [5, 3, "TLAX"], VER: [6, 2, "VER"],
  YUC: [8, 4, "YUC"], ZAC: [3, 1, "ZAC"]};

// Texto claro u oscuro sobre un relleno: por luminosidad del color, no por
// posición en la escala, para que funcione con cualquier rampa y en los dos temas.
const tintaSobre = (color) => (d3.lab(color).l < 58 ? "white" : "#1d1d1b");

// ---------------------------------------------------------------- mosaico
// ¿Cómo se comparan las 32 entidades con el mismo peso visual? Tasas por
// entidad donde la Ciudad de México y Tlaxcala deben verse igual que
// Chihuahua. No: cuando la forma o el tamaño del territorio importan.
export function mosaico(datos, {ancho, dominio, destacado = null, renglones, formato = (v) => `${v.toFixed(1)} %`, etiqueta = "%"}) {
  const W = Math.max(ancho, 420);
  const color = d3.scaleLinear().domain(d3.range(SECUENCIAL.length).map((i) => dominio[0] + (i / (SECUENCIAL.length - 1)) * (dominio[1] - dominio[0]))).range(SECUENCIAL).clamp(true);
  const filas = datos.filter((d) => CVE_ISO[d.cve]).map((d) => {
    const [col, fila, corto] = MOSAICO[CVE_ISO[d.cve]];
    return {...d, col, fila, corto, relleno: d.valor == null ? GRIS.rejilla : color(d.valor)};
  });
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: Math.round(W * 0.6), margin: 8,
    x: {axis: null, domain: d3.range(9), padding: 0.07}, y: {axis: null, domain: d3.range(6), padding: 0.07},
    color: {type: "linear", domain: dominio, interpolate: d3.interpolateRgbBasis(SECUENCIAL), clamp: true, legend: true, label: etiqueta, tickFormat: (d) => `${d} %`},
    marks: [
      Plot.cell(filas, {x: "col", y: "fila", fill: "valor", rx: 5, stroke: (d) => (d.cve === destacado ? ROJO : "none"), strokeWidth: 3}),
      Plot.text(filas, {x: "col", y: "fila", text: (d) => `${d.corto}\n${d.valor == null ? "sin dato" : formato(d.valor)}`, fontSize: TIPO.etiqueta, fontWeight: 600, lineHeight: 1.25, fill: (d) => tintaSobre(d.relleno)}),
      Plot.tip(filas, Plot.pointer({x: "col", y: "fila", maxRadius: Infinity, ...globo(renglones)})),
    ],
  });
}

// ---------------------------------------------------------------- burbujas
// ¿Cuántos hay en cada lugar? Conteos (personas) por entidad; el área del
// círculo es proporcional. No: tasas, que van en coropleta o mosaico.
export function burbujas(datos, geo, {ancho, renglones, destacado = null, radioMax = 26, tope = null}) {
  const W = Math.max(ancho, 420);
  const porId = new Map(datos.map((d) => [`MX-${CVE_ISO[d.cve]}`, d]));
  const feats = geo.features.filter((f) => porId.has(f.properties.id)).sort((a, b) => porId.get(b.properties.id).num - porId.get(a.properties.id).num);
  const dato = (f) => porId.get(f.properties.id);
  const renglonesGeo = renglones.map(([k, fn]) => [k, (f) => fn(dato(f))]);
  const colorDe = (f) => (dato(f).cve === destacado ? ROJO : COLOR_UNICO);
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: Math.round(W * 0.66), margin: 24,
    projection: {type: "mercator", domain: geo},
    r: {range: [0, radioMax], domain: [0, tope ?? d3.max(datos, (d) => d.num)]},
    marks: [
      Plot.geo(geo, {fill: GRIS.rejilla, stroke: FONDO, strokeWidth: 0.8}),
      Plot.dot(feats, Plot.centroid({r: (f) => dato(f).num, fill: colorDe, fillOpacity: 0.45, stroke: colorDe, strokeWidth: 1.2})),
      Plot.tip(feats, Plot.pointer(Plot.centroid({maxRadius: Infinity, ...globo(renglonesGeo)}))),
    ],
  });
}

// ---------------------------------------------------------------- treemap
// ¿Cómo se reparte un total entre muchas partes? Diez o más partes agrupadas
// en pocas categorías. Tres grupos con color (pasos de la rampa morada, el
// mayor más oscuro) y los demás en gris, como pide el catálogo.
export function treemap(datos, {ancho, alto = 460, renglones, etiquetaOtras = "Otras"}) {
  const W = Math.max(ancho, 420);
  const totales = d3.rollups(datos, (v) => d3.sum(v, (d) => d.valor), (d) => d.grupo).sort((a, b) => b[1] - a[1]);
  const conColor = totales.slice(0, 3).map(([g]) => g);
  const claseDe = (g) => (conColor.includes(g) ? g : etiquetaOtras);
  const tonos = [ORDINAL[3][2], ORDINAL[3][1], ORDINAL[3][0]];
  const dominio = [...conColor, ...(totales.length > 3 ? [etiquetaOtras] : [])];
  const rango = [...tonos.slice(0, conColor.length), ...(totales.length > 3 ? ["#b9b9b3"] : [])];
  const raiz = d3.hierarchy(d3.group(datos, (d) => claseDe(d.grupo))).sum((d) => d.valor ?? 0).sort((a, b) => b.value - a.value);
  d3.treemap().size([W, alto]).paddingInner(2).paddingOuter(1).round(true)(raiz);
  const total = raiz.value;
  const hojas = raiz.leaves().map((h) => ({...h.data, clase: h.parent.data[0], x0: h.x0, x1: h.x1, y0: h.y0, y1: h.y1, pct: 100 * h.value / total}));
  const colorClase = new Map(dominio.map((k, i) => [k, rango[i]]));
  const cabe = (s, px) => (s.length * 6.6 <= px ? s : `${s.slice(0, Math.max(1, Math.floor(px / 6.6) - 1))}…`);
  const grafica = Plot.plot({
    style: ESTILO_EJES, width: W, height: alto, margin: 0,
    x: {type: "identity", axis: null}, y: {type: "identity", axis: null},
    color: {domain: dominio, range: rango, legend: true},
    marks: [
      Plot.rect(hojas, {x1: "x0", x2: "x1", y1: "y0", y2: "y1", fill: "clase", fillOpacity: 0.95}),
      Plot.text(hojas.filter((d) => d.x1 - d.x0 > 58 && d.y1 - d.y0 > 34), {x: (d) => d.x0 + 6, y: (d) => d.y0 + 6, textAnchor: "start", lineAnchor: "top",
        text: (d) => `${cabe(d.parte, d.x1 - d.x0 - 12)}\n${d.pct < 1 ? d.pct.toFixed(1) : d.pct.toFixed(0)} %`, fontSize: TIPO.etiqueta, fontWeight: 600,
        fill: (d) => tintaSobre(colorClase.get(d.clase))}),
    ],
  });
  return conGloboHtml(grafica, hojas, {contenido: globoDeRenglones(renglones)});
}

// ---------------------------------------------------------------- globo HTML para treemaps
// El puntero de Plot elige la marca por distancia al CENTRO del rectángulo:
// en un treemap, estar dentro de un rectángulo grande no garantiza que su
// centro sea el más cercano (desde el borde del maya salía el náhuatl). Aquí
// la celda se busca por geometría (el rectángulo que contiene al cursor) y el
// globo es HTML sobre la gráfica, con la misma letra que los globos del mapa.
const escaparHtml = (t) => String(t ?? "").replace(/[&<>"']/g, (ch) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[ch]));
function globoDeRenglones(renglones) {
  return (d) => {
    const filas = renglones.map(([k, f]) => [k, f(d)]).filter(([, v]) => v != null && v !== "");
    const [titulo, ...resto] = filas;
    return `<div class="tm-globo-titulo">${escaparHtml(titulo?.[1])}</div>${resto.map(([k, v]) => `<div class="tm-globo-fila"><span>${escaparHtml(k)}</span><b>${escaparHtml(v)}</b></div>`).join("")}`;
  };
}
function conGloboHtml(grafica, celdas, {contenido, alClic = null, grupos = [], zoom = null}) {
  const envoltorio = document.createElement("div");
  envoltorio.className = "tm-envoltorio";
  const globo = document.createElement("div");
  globo.className = "tm-globo";
  globo.hidden = true;
  envoltorio.append(grafica, globo);
  // Transformación de zoom vigente (identidad si no hay zoom): el punto del
  // cursor se lleva a coordenadas del treemap antes de buscar la celda.
  let t = {k: 1, x: 0, y: 0};
  const puntoEn = (ev) => {
    const r = grafica.getBoundingClientRect();
    const escala = (grafica.viewBox?.baseVal?.width || grafica.width?.baseVal?.value || r.width) / r.width;
    const px = (ev.clientX - r.left) * escala, py = (ev.clientY - r.top) * escala;
    return [(px - t.x) / t.k, (py - t.y) / t.k];
  };
  const celdaEn = (ev) => { const [px, py] = puntoEn(ev); return celdas.find((d) => px >= d.x0 && px < d.x1 && py >= d.y0 && py < d.y1) ?? null; };
  grafica.addEventListener("mousemove", (ev) => {
    const d = celdaEn(ev);
    if (!d) { globo.hidden = true; return; }
    globo.innerHTML = contenido(d);
    globo.hidden = false;
    const r = envoltorio.getBoundingClientRect();
    let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
    if (x + globo.offsetWidth > r.width) x = Math.max(0, ev.clientX - r.left - globo.offsetWidth - 14);
    if (y + globo.offsetHeight > r.height) y = Math.max(0, ev.clientY - r.top - globo.offsetHeight - 14);
    globo.style.left = `${x}px`;
    globo.style.top = `${y}px`;
  });
  grafica.addEventListener("mouseleave", () => { globo.hidden = true; });

  // Zoom con control (botones + − ↺, rueda con Ctrl, arrastre y pellizco),
  // como en un mapa: acerca una zona de rectángulos chicos sin cambiar el
  // nivel ni el filtro. Los rótulos de las celdas se muestran cuando la celda
  // mide lo suficiente EN PANTALLA, así que al acercar aparecen los que no cabían.
  let acercarA = null;
  if (zoom) {
    const {W, H, alTransformar, fijos = []} = zoom;
    const capa = document.createElementNS("http://www.w3.org/2000/svg", "g");
    capa.setAttribute("class", "tm-zoom");
    while (grafica.firstChild) capa.append(grafica.firstChild);
    // Los rótulos no se escalan: viven fuera de la capa y se recolocan.
    grafica.append(capa, ...fijos);
    // Un clic simple no debe moverse; el arrastre sí (d3 distingue por distancia).
    const comportamiento = d3.zoom().scaleExtent([1, 60]).translateExtent([[0, 0], [W, H]]).extent([[0, 0], [W, H]])
      .filter((ev) => (ev.type === "wheel" ? ev.ctrlKey || ev.metaKey || t.k > 1 : !ev.button))
      // d3 multiplica por 10 el paso de la rueda con Ctrl (lo toma por pellizco): aquí el paso es el mismo con o sin Ctrl.
      .wheelDelta((ev) => -ev.deltaY * (ev.deltaMode === 1 ? 0.05 : ev.deltaMode ? 1 : 0.002))
      .on("zoom", (ev) => { t = ev.transform; capa.setAttribute("transform", t.toString()); globo.hidden = true; alTransformar?.(t); controles.hidden = false; reinicio.disabled = t.k === 1; });
    const sel = d3.select(grafica).call(comportamiento).on("dblclick.zoom", null);
    acercarA = (b) => {
      const k = Math.min(60, Math.max(1, 0.92 * Math.min(W / (b.x1 - b.x0), H / (b.y1 - b.y0))));
      sel.transition().duration(500).call(comportamiento.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2));
    };
    const boton = (texto, rotulo, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = texto; b.setAttribute("aria-label", rotulo); b.title = rotulo; b.addEventListener("click", fn); return b; };
    const reinicio = boton("↺", "Ver todo", () => sel.transition().duration(400).call(comportamiento.transform, d3.zoomIdentity));
    reinicio.disabled = true;
    const controles = document.createElement("div");
    controles.className = "tm-controles";
    controles.append(boton("+", "Acercar", () => sel.transition().duration(250).call(comportamiento.scaleBy, 1.6)), boton("−", "Alejar", () => sel.transition().duration(250).call(comportamiento.scaleBy, 1 / 1.6)), reinicio);
    const pista = document.createElement("div");
    pista.className = "tm-pista";
    pista.textContent = "Acerca con los botones, Ctrl + rueda o pellizco; arrastra para moverte";
    envoltorio.append(controles, pista);
    grafica.style.touchAction = "none";
  }
  if (alClic || acercarA) {
    grafica.style.cursor = "pointer";
    grafica.addEventListener("click", (ev) => { if (alClic) alClic(celdaEn(ev)); });
  }
  return envoltorio;
}

// ---------------------------------------------------------------- treemap por niveles
// ¿Cómo se reparte un todo en partes con una jerarquía (familia → agrupación
// → variante)? Un solo treemap que cambia de nivel: las hojas son el nivel
// elegido y se agrupan en bloques por su nivel superior, marcados solo con
// su contorno (el nombre del bloque va en el globo de cada celda). Cada hoja se pinta con el color de identidad de su familia
// (COLOR_FAMILIA en base.js), así que al bajar de nivel el color se conserva.
// `hojas`: [{id, nombre, grupo, familia, valor, ...}]; `colorDe(hoja|grupo)`
// devuelve el color (el grupo trae `esGrupo`, `familia` y, si aplica,
// `agrupacion`); `contenido(hoja)` devuelve el HTML del globo (o se arma con
// `renglones`); `alClic(hoja)` recibe la hoja pulsada, o null si el clic cayó
// fuera de toda celda (para quitar la selección); `resaltar(hoja)` devuelve
// true/false/null (null: nada resaltado, todo al color pleno).
export function treemapJerarquico(hojas, {ancho, alto = 520, colorDe, renglones = [], contenido = null, rotuloGrupo = true, alClic = null, resaltar = () => null, formatoValor = (v) => punto(v)}) {
  const W = Math.max(ancho, 420);
  // Acomodo en dos pasos. Con el relleno del rótulo dentro del mismo treemap,
  // d3 lo resta del área que le toca a cada bloque: en un bloque chico los 20
  // px del rótulo se comían a las celdas y el bloque salía vacío. Aquí primero
  // se reparten los bloques por su valor y después se acomodan las celdas en
  // el espacio REAL de cada bloque, con banda de rótulo solo si cabe.
  const sumaValor = (hs) => d3.sum(hs, (h) => Math.max(0, h.valor ?? 0));
  const porGrupo = d3.rollups(hojas, (v) => v, (d) => d.grupo).map(([nombre, hs]) => ({nombre, hojas: hs, valor: sumaValor(hs)})).filter((g) => g.valor > 0).sort((a, b) => b.valor - a.valor);
  const conRotulo = rotuloGrupo && porGrupo.length > 1;
  const raizG = d3.hierarchy({children: porGrupo}).sum((d) => d.valor ?? 0).sort((a, b) => b.value - a.value);
  d3.treemap().size([W, alto]).paddingInner(conRotulo ? 8 : 0).round(true)(raizG);
  const total = raizG.value || 1;
  const celdas = [], grupos = [];
  for (const g of raizG.leaves()) {
    const x0 = g.x0, x1 = g.x1, y0 = g.y0, y1 = g.y1;
    const primera = g.data.hojas[0];
    if (conRotulo) grupos.push({nombre: g.data.nombre, familia: primera?.familia, agrupacion: primera?.agrupacion, esGrupo: true, x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1, n: g.data.hojas.length, valor: g.value});
    const raizH = d3.hierarchy({children: g.data.hojas}).sum((d) => Math.max(0, d.valor ?? 0)).sort((a, b) => b.value - a.value);
    d3.treemap().size([Math.max(1, x1 - x0), Math.max(1, y1 - y0)]).paddingInner(2).round(true)(raizH);
    const grupoRef = grupos.at(-1);
    for (const h of raizH.leaves()) celdas.push({...h.data, grupoRef: conRotulo ? grupoRef : null, x0: x0 + h.x0, x1: x0 + h.x1, y0: y0 + h.y0, y1: y0 + h.y1, pct: 100 * h.value / total, ancho: h.x1 - h.x0, alto: h.y1 - h.y0});
  }
  const cabe = (s, px) => (String(s).length * 6.6 <= px ? String(s) : `${String(s).slice(0, Math.max(1, Math.floor(px / 6.6) - 1))}…`);
  const opacidad = (d) => { const r = resaltar(d); return r === null ? 0.95 : r ? 1 : 0.18; };
  const grafica = Plot.plot({
    style: ESTILO_EJES, width: W, height: alto, margin: 0,
    x: {type: "identity", axis: null}, y: {type: "identity", axis: null},
    marks: [
      // Contorno en tinta, no en el color de la familia: del mismo color que sus
      // celdas no se distinguía. Entre bloques hay además 8 px de fondo.
      Plot.rect(grupos, {x1: "x0", x2: "x1", y1: "y0", y2: "y1", fill: "none", stroke: "var(--theme-foreground)", strokeOpacity: 0.75, strokeWidth: 1.5}),
      Plot.rect(celdas, {x1: "x0", x2: "x1", y1: "y0", y2: "y1", fill: (d) => colorDe(d), fillOpacity: opacidad, stroke: FONDO, strokeWidth: 0.5}),
      Plot.text(celdas, {x: (d) => d.x0 + 6, y: (d) => d.y0 + 6, textAnchor: "start", lineAnchor: "top",
        text: (d) => `${cabe(d.nombre, d.ancho - 12)}\n${formatoValor(d.valor) || " "}`, fontSize: TIPO.etiqueta, fontWeight: 600,
        fill: (d) => tintaSobre(colorDe(d)), fillOpacity: (d) => (resaltar(d) === false ? 0.35 : 1)}),
    ],
  });
  // Los rótulos no se escalan con el zoom: en cada transformación se recolocan
  // en coordenadas de pantalla, se recortan al ancho que tiene la celda EN
  // PANTALLA y se muestran solo si la celda mide lo suficiente, así que al
  // acercar aparecen los que no cabían. El nodo de texto i es la celda i.
  const gruposTexto = [...grafica.querySelectorAll('g[aria-label="text"]')];
  const textosCeldas = [...gruposTexto.at(-1).querySelectorAll("text")];
  const escribir = (n, texto) => { const ts = n.querySelector("tspan"); if (ts) ts.textContent = texto; else n.textContent = texto; };
  const colocar = ({k, x: tx, y: ty}) => {
    // El rótulo va en la esquina VISIBLE de la celda: si la celda empieza fuera
    // de la vista por el zoom, el rótulo se corre al borde y se recorta a la
    // parte que se ve.
    textosCeldas.forEach((n, i) => {
      const d = celdas[i];
      const vx0 = Math.max(0, d.x0 * k + tx), vy0 = Math.max(0, d.y0 * k + ty), vx1 = Math.min(W, d.x1 * k + tx), vy1 = Math.min(alto, d.y1 * k + ty);
      const w = vx1 - vx0, h = vy1 - vy0;
      if (!(w > 36 && h > 22)) { n.style.display = "none"; return; }
      n.style.display = "";
      n.setAttribute("transform", `translate(${vx0 + 6},${vy0 + 5})`);
      escribir(n, cabe(d.nombre, w - 12));
      const segunda = n.querySelectorAll("tspan")[1];
      if (segunda) segunda.style.display = h > 38 ? "" : "none";
    });
  };
  colocar({k: 1, x: 0, y: 0});
  return conGloboHtml(grafica, celdas, {contenido: contenido ?? globoDeRenglones(renglones), alClic, grupos, zoom: {W, H: alto, alTransformar: colocar, fijos: gruposTexto}});
}

// ---------------------------------------------------------------- lollipop
// ¿Cómo se ordenan muchas categorías sin llenar la vista de tinta? Rankings
// de 20 filas o más. No: pocas filas, que se leen más rápido en barras.
export function lollipop(datos, {ancho, dominio, renglones, destacado = () => false, formato = (v) => punto(v), etiquetaX = null, margenIzq = 170}) {
  const W = Math.max(ancho, 420);
  const color = (d) => (destacado(d) ? ROJO : COLOR_UNICO);
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: Math.max(280, datos.length * 22 + 70),
    marginTop: 30, marginRight: 90, marginBottom: 36, marginLeft: margenIzq,
    x: {grid: true, label: etiquetaX, domain: dominio, axis: "top"},
    y: {label: null, tickSize: 0, domain: datos.map((d) => d.nombre)},
    marks: [
      Plot.ruleY(datos, {y: "nombre", x1: 0, x2: "valor", stroke: "#c8c8c2", strokeWidth: 2}),
      Plot.dot(datos, {y: "nombre", x: "valor", r: 5.5, fill: color, stroke: FONDO, strokeWidth: 1}),
      Plot.text(datos, {y: "nombre", x: "valor", text: (d) => formato(d.valor), dx: 10, textAnchor: "start", fontSize: TIPO.etiqueta, fill: "currentColor"}),
      Plot.dot(datos, Plot.pointerY({y: "nombre", x: "valor", r: 9, fill: "none", stroke: "currentColor", strokeWidth: 1.5, maxRadius: Infinity})),
      Plot.tip(datos, Plot.pointerY({y: "nombre", x: "valor", maxRadius: Infinity, ...globo(renglones)})),
    ],
  });
}

// ---------------------------------------------------------------- bump chart
// ¿Qué lugar ocupa cada quien año con año? El lugar es la historia y son
// hasta 15 series. No: cuando importa la distancia entre valores (líneas).
export function bump(datos, {ancho, destacada = null, renglones, maxLugar}) {
  const W = Math.max(ancho, 480);
  const n = maxLugar ?? d3.max(datos, (d) => d.lugar);
  const esDest = (d) => d.serie === destacada;
  const fondo = datos.filter((d) => !esDest(d)), dest = datos.filter(esDest);
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: n * 32 + 70,
    marginTop: 50, marginRight: 150, marginBottom: 16, marginLeft: 150,
    x: {type: "point", padding: 0.1, label: null, tickFormat: String, axis: "top"},
    y: {axis: null, reverse: true, domain: [1, n]},
    marks: [
      Plot.lineY(fondo, {x: "anio", y: "lugar", z: "serie", curve: "bump-x", strokeWidth: 2.2, stroke: "#c8c8c2"}),
      Plot.lineY(dest, {x: "anio", y: "lugar", z: "serie", curve: "bump-x", strokeWidth: 3.2, stroke: ROJO}),
      Plot.dot(fondo, {x: "anio", y: "lugar", r: 10, fill: COLOR_UNICO, stroke: FONDO, strokeWidth: 1}),
      Plot.dot(dest, {x: "anio", y: "lugar", r: 11, fill: ROJO, stroke: FONDO, strokeWidth: 1}),
      Plot.text(datos, {x: "anio", y: "lugar", text: "lugar", fontSize: 10.5, fontWeight: 700, fill: "white"}),
      Plot.text(datos, Plot.selectFirst({x: "anio", y: "lugar", z: "serie", text: "serie", textAnchor: "end", dx: -16, fontSize: TIPO.etiqueta, fill: "currentColor"})),
      Plot.text(datos, Plot.selectLast({x: "anio", y: "lugar", z: "serie", text: "serie", textAnchor: "start", dx: 16, fontSize: TIPO.etiqueta, fontWeight: (d) => (esDest(d) ? 700 : 500), fill: "currentColor"})),
      Plot.tip(datos, Plot.pointer({x: "anio", y: "lugar", maxRadius: 30, ...globo(renglones)})),
    ],
  });
}

// ---------------------------------------------------------------- Sankey
// ¿De dónde a dónde se mueve algo? Dos a cuatro etapas con hasta ocho nodos
// cada una. No: muchos orígenes y destinos (matriz de adyacencia).
export function sankey({nodos, enlaces}, {ancho, alto = 420, destacado = null, renglonesEnlace, formatoNodo}) {
  const W = Math.max(ancho, 520), MARGEN_X = 170;
  const g = d3Sankey().nodeId((d) => d.id).nodeWidth(14).nodePadding(14).nodeSort(null)
    .extent([[MARGEN_X, 10], [W - MARGEN_X, alto - 10]])({nodes: nodos.map((d) => ({...d})), links: enlaces.map((d) => ({...d}))});
  const total = d3.sum(g.nodes.filter((d) => d.depth === 0), (d) => d.value);
  const tocaDestacado = (l) => destacado && (l.source.id === destacado || l.target.id === destacado);
  const etiqueta = (d) => `${d.nombre ?? d.id}\n${formatoNodo ? formatoNodo(d, total) : `${(100 * d.value / total).toFixed(1)} %`}`;
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: alto, margin: 0,
    x: {type: "identity", axis: null}, y: {type: "identity", axis: null},
    marks: [
      Plot.link(g.links.filter((l) => !tocaDestacado(l)), {x1: (d) => d.source.x1, y1: (d) => d.y0, x2: (d) => d.target.x0, y2: (d) => d.y1, curve: "bump-x",
        strokeWidth: (d) => Math.max(1, d.width), strokeOpacity: 0.4, stroke: "#b9b9b3"}),
      Plot.link(g.links.filter(tocaDestacado), {x1: (d) => d.source.x1, y1: (d) => d.y0, x2: (d) => d.target.x0, y2: (d) => d.y1, curve: "bump-x",
        strokeWidth: (d) => Math.max(1, d.width), strokeOpacity: 0.55, stroke: ROJO}),
      Plot.rect(g.nodes, {x1: "x0", x2: "x1", y1: "y0", y2: "y1", fill: (d) => (d.id === destacado ? ROJO : COLOR_UNICO)}),
      Plot.text(g.nodes.filter((d) => d.x0 < W / 2), {x: (d) => d.x0 - 8, y: (d) => (d.y0 + d.y1) / 2, textAnchor: "end", fontSize: TIPO.etiqueta, fill: "currentColor", text: etiqueta}),
      Plot.text(g.nodes.filter((d) => d.x0 >= W / 2), {x: (d) => d.x1 + 8, y: (d) => (d.y0 + d.y1) / 2, textAnchor: "start", fontSize: TIPO.etiqueta, fill: "currentColor", text: etiqueta}),
      Plot.tip(g.links, Plot.pointer({x: (d) => (d.source.x1 + d.target.x0) / 2, y: (d) => (d.y0 + d.y1) / 2, maxRadius: 40, ...globo(renglonesEnlace)})),
    ],
  });
}

// ---------------------------------------------------------------- waffle
// ¿Cuántos de cada 100? Una proporción que se lee mejor como personas que
// como porcentaje. No: más de cuatro grupos o diferencias de décimas.
export function waffle(datos, {ancho, colorDe = () => COLOR_UNICO, texto = (d) => `${d.grupo}\n${Math.round(d.valor)} de cada 100`}) {
  const W = Math.max(ancho, 360);
  const n = datos.length;
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: Math.round(Math.min(W / n, 340) * 0.9) + 50,
    marginTop: 56, marginBottom: 6, marginLeft: 8, marginRight: 8,
    fx: {label: null, padding: 0.18, domain: datos.map((d) => d.grupo), axis: null},
    x: {axis: null}, y: {axis: null},
    marks: [
      Plot.waffleY(datos, {fx: "grupo", y: 100, multiple: 10, fill: MODO.oscuro ? GRIS.fondo : "#dcdcd6", rx: 2}),
      Plot.waffleY(datos, {fx: "grupo", y: (d) => Math.round(d.valor), multiple: 10, fill: colorDe, rx: 2}),
      Plot.text(datos, {fx: "grupo", frameAnchor: "top", dy: -44, lineAnchor: "top", lineHeight: 1.3, fontSize: TIPO.valor, fontWeight: 700, fill: "currentColor", text: texto}),
    ],
  });
}

// ---------------------------------------------------------------- dumbbell
// ¿Cuánto separa a dos grupos en cada categoría? Dos grupos y muchas
// categorías; la brecha es la historia. `filas`: [{fila, serie, valor, ee?}].
// `referencia`: un valor fijo (un umbral) que se dibuja como línea punteada;
// su rótulo va FUERA del lienzo, con `notaReferencia` de graficas.js.
export function dumbbell(filas, {ancho, series, colores, dominio, orden, renglones, fx = null, fxDominio = null, etiquetaX = "% →", margenIzq = 190, referencia = null}) {
  const W = Math.max(ancho, 420);
  const canalFx = fx ? {fx} : {};
  const pares = d3.groups(filas, (d) => d.fila, (d) => (fx ? d[fx] : "")).flatMap(([fila, g]) => g.map(([f, v]) => {
    const a = v.find((d) => d.serie === series[0]), b = v.find((d) => d.serie === series[1]);
    return a && b ? {fila, a: a.valor, b: b.valor, ...(fx ? {[fx]: f} : {})} : null;
  })).filter(Boolean);
  const nFilas = orden.length;
  const clavePar = (d) => `${d.fila}|${fx ? d[fx] : ""}`;
  const minimo = new Map(pares.map((p) => [`${p.fila}|${fx ? p[fx] : ""}`, Math.min(p.a, p.b)]));
  const esMenor = (d) => minimo.has(clavePar(d)) && d.valor <= minimo.get(clavePar(d));
  // Con el eje desde cero, la cifra a la izquierda de un punto cercano a cero
  // pisa el nombre de la fila: se reserva un margen a la izquierda del cero,
  // sin marcas negativas en el eje.
  // Unos 40 px, que es lo que ocupa una cifra con su separación.
  const util = Math.max(120, W - margenIzq - 48);
  const holgura = dominio[0] === 0 ? (dominio[1] - dominio[0]) * 40 / (util - 40) : 0;
  const ticks = d3.ticks(dominio[0], dominio[1], Math.max(4, Math.round(W / 110)));
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: nFilas * 36 + 90,
    marginTop: 46, marginRight: 48, marginBottom: 20, marginLeft: margenIzq,
    ...(fx ? {fx: {label: null, domain: fxDominio}} : {}),
    x: {axis: "top", grid: true, domain: [dominio[0] - holgura, dominio[1]], ticks, label: etiquetaX, tickFormat: (d) => `${d} %`},
    y: {label: null, domain: orden},
    color: {domain: series, range: colores, legend: true},
    marks: [
      ...(referencia == null ? [] : [Plot.ruleX([referencia], {stroke: GRIS.tinta, strokeWidth: 1.2, strokeDasharray: "5 3", strokeOpacity: 0.7})]),
      Plot.link(pares, {y: "fila", x1: "a", x2: "b", stroke: "#c8c8c2", strokeWidth: 3.5, strokeLinecap: "round", ...canalFx}),
      Plot.ruleY(filas.filter((d) => d.ee), {y: "fila", x1: (d) => Math.max(dominio[0], d.valor - 196 * d.ee), x2: (d) => Math.min(dominio[1], d.valor + 196 * d.ee), stroke: "serie", strokeWidth: 1.2, strokeOpacity: 0.6, ...canalFx}),
      Plot.dot(filas, {y: "fila", x: "valor", fill: "serie", r: 6, stroke: FONDO, strokeWidth: 1, ...canalFx}),
      Plot.text(filas.filter((d) => esMenor(d)), {y: "fila", x: "valor", dx: -11, textAnchor: "end", fontSize: TIPO.etiqueta, fill: "currentColor", text: (d) => d.valor.toFixed(1), ...canalFx}),
      Plot.text(filas.filter((d) => !esMenor(d)), {y: "fila", x: "valor", dx: 11, textAnchor: "start", fontSize: TIPO.etiqueta, fill: "currentColor", text: (d) => d.valor.toFixed(1), ...canalFx}),
      Plot.dot(filas, Plot.pointer({y: "fila", x: "valor", r: 9, fill: "none", stroke: "currentColor", strokeWidth: 1.5, maxRadius: 30, ...canalFx})),
      Plot.tip(filas, Plot.pointer({y: "fila", x: "valor", maxRadius: 30, ...canalFx, ...globo(renglones)})),
    ],
  });
}

// ---------------------------------------------------------------- Likert
// ¿Qué tan de acuerdo están? Escalas ordenadas de respuesta. A la izquierda
// del cero lo desfavorable, a la derecha lo favorable; con escala par no hay
// neutro que partir. Colores de la rampa divergente del sitio (rojo =
// desfavorable). `filas`: [{fila, respuesta, pct}].
export function likert(filas, {ancho, orden, negativas, renglones, dominio = [-70, 70], margenIzq = 150}) {
  const W = Math.max(ancho, 420);
  const tonos = orden.length === 4 ? [RAMPA[1], RAMPA[3], RAMPA[5], RAMPA[7]] : [RAMPA[1], RAMPA[3], RAMPA[4], RAMPA[5], RAMPA[7]];
  const tramos = d3.groups(filas, (d) => d.fila).flatMap(([fila, v]) => {
    const por = new Map(v.map((d) => [d.respuesta, d.pct]));
    let izq = -d3.sum(orden.slice(0, negativas), (k) => por.get(k) ?? 0);
    return orden.map((respuesta, i) => { const x1 = izq; izq += por.get(respuesta) ?? 0; return {...v.find((d) => d.respuesta === respuesta), fila, respuesta, x1, x2: izq, color: tonos[i]}; });
  });
  const filasOrden = [...new Set(filas.map((d) => d.fila))];
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: filasOrden.length * 46 + 110,
    marginTop: 44, marginRight: 30, marginBottom: 20, marginLeft: margenIzq,
    x: {axis: "top", tickFormat: (d) => `${Math.abs(d)} %`, label: null, domain: dominio, grid: true},
    y: {label: null, domain: filasOrden},
    color: {domain: orden, range: tonos, legend: true},
    marks: [
      Plot.barX(tramos, {y: "fila", x1: "x1", x2: "x2", fill: "respuesta", insetTop: 5, insetBottom: 5}),
      Plot.text(tramos, {y: "fila", x: (d) => (d.x1 + d.x2) / 2, text: (d) => (d.pct >= 6 ? `${d.pct.toFixed(0)}` : ""), fontSize: TIPO.etiqueta, fontWeight: 600, fill: (d) => tintaSobre(d.color)}),
      Plot.ruleX([0], {stroke: "currentColor", strokeWidth: 1.4}),
      Plot.tip(tramos, Plot.pointer({y: "fila", x: (d) => (d.x1 + d.x2) / 2, maxRadius: Infinity, ...globo(renglones)})),
    ],
  });
}

// ---------------------------------------------------------------- unidades
// Waffle por categorías: ¿cómo se reparte un total entre pocas categorías
// con orden? Cada cuadro es una unidad (una variante, o una de cada 100
// personas) y el color, su categoría. Con `escala100` los valores son
// porcentajes y se redondean por el mayor residuo para que sumen 100.
// `datos`: [{categoria, valor}]; `orden` y `colores` fijan la leyenda.
// `ladoMax` topa el lado de cada cuadro (26 px por omisión); `leyenda: false`
// quita la leyenda de Plot cuando la figura lleva su propia lista.
export function unidades(datos, {ancho, orden, colores, renglones, escala100 = false, porFila = 20, alto = null, ladoMax = 26, leyenda = true}) {
  const W = Math.max(ancho, 360);
  let filas = orden.map((c) => ({categoria: c, valor: datos.find((d) => d.categoria === c)?.valor ?? 0, dato: datos.find((d) => d.categoria === c)}));
  if (escala100) {
    const base = filas.map((f) => ({...f, entero: Math.floor(f.valor), resto: f.valor - Math.floor(f.valor)}));
    let falta = 100 - d3.sum(base, (f) => f.entero);
    for (const f of base.slice().sort((a, b) => b.resto - a.resto)) { if (falta <= 0) break; f.entero += 1; falta -= 1; }
    filas = base.map((f) => ({...f, n: f.entero}));
  } else filas = filas.map((f) => ({...f, n: Math.round(f.valor)}));
  const total = d3.sum(filas, (f) => f.n);
  const nFilas = Math.ceil(total / porFila);
  const lado = Math.min(ladoMax, (W - 20) / porFila);
  const g = globo(renglones.map(([k, fn]) => [k, (f) => fn(f.dato ?? f)]));
  return Plot.plot({
    style: ESTILO_EJES, width: Math.round(porFila * lado + 20), height: alto ?? Math.round(nFilas * lado + 20), marginTop: 10, marginBottom: 6, marginLeft: 10, marginRight: 10,
    x: {axis: null}, y: {axis: null},
    color: {domain: orden, range: colores, legend: leyenda},
    marks: [
      Plot.waffleY(filas.filter((f) => f.n > 0), {y: "n", fill: "categoria", order: orden, multiple: porFila, rx: 2, gap: 2,
        channels: g.channels, tip: {format: g.format, fontSize: g.fontSize, textPadding: g.textPadding, lineWidth: g.lineWidth}}),
    ],
  });
}

// ---------------------------------------------------------------- coropleta
// ¿Dónde pasa? Una tasa por entidad sobre el mapa real, con escala fija (la
// rampa morada del sitio) y la entidad destacada con borde rojo. Las
// entidades chicas del centro se leen en el globo y en el ranking que la
// acompaña. `datos`: [{cve, valor, ...}].
export function coropleta(datos, geo, {ancho, dominio, destacado = null, renglones, etiqueta = "%"}) {
  const W = Math.max(ancho, 420);
  const porId = new Map(datos.map((d) => [`MX-${CVE_ISO[d.cve]}`, d]));
  const dato = (f) => porId.get(f.properties.id);
  const feats = geo.features.filter((f) => porId.has(f.properties.id));
  const dest = feats.filter((f) => dato(f).cve === destacado);
  return Plot.plot({
    style: ESTILO_EJES, width: W, height: Math.round(W * 0.64), margin: 12,
    projection: {type: "mercator", domain: geo},
    color: {type: "linear", domain: dominio, interpolate: d3.interpolateRgbBasis(SECUENCIAL), clamp: true, legend: true, label: etiqueta, tickFormat: (d) => `${d} %`},
    marks: [
      Plot.geo(feats, {fill: (f) => dato(f).valor, stroke: FONDO, strokeWidth: 0.8}),
      Plot.geo(dest, {fill: "none", stroke: ROJO, strokeWidth: 2.6}),
      Plot.geo(feats, Plot.pointer(Plot.centroid({fill: "none", stroke: "currentColor", strokeWidth: 1.6, maxRadius: 40}))),
      Plot.tip(feats, Plot.pointer(Plot.centroid({maxRadius: 40, ...globo(renglones.map(([k, fn]) => [k, (f) => fn(dato(f))]))}))),
    ],
  });
}
