// src/components/descargar.js
// Botón de descarga de una gráfica, en PNG o SVG.
//
// Lo que se descarga es la figura COMPLETA tal como está en pantalla: título,
// subtítulo (que dice qué filtros se aplicaron), la gráfica, la leyenda y el
// pie de fuente, más un crédito al pie. Descargar solo el SVG del Plot daría
// una imagen sin contexto, y una gráfica de PISA sin decir qué ciclo ni qué
// país muestra no se puede citar.
//
// Se ofrecen dos formatos y no tres: PNG para pegar en una presentación y SVG
// para imprimir o editar. El JPG comprime con pérdida y deja halos alrededor
// del texto y de las líneas finas, que es justo de lo que está hecha una
// gráfica.

import {html} from "npm:htl";
import {ROJO} from "./base.js";

// Crédito al pie de la imagen. Vive aquí y no en cada página para que una
// sola edición cambie todas las descargas.
const CREDITO = "Social Data IBERO, Universidad Iberoamericana";

// Nombre de archivo a partir del título, sin acentos ni signos.
function nombreArchivo(titulo, ext) {
  const base = (titulo || "grafica")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return `perdida-lengua-${base || "grafica"}.${ext}`;
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Se revoca en el siguiente turno: revocarlo de inmediato cancela la
  // descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Lo que no viaja en la descarga: los botones y los globos de Plot.
const OMITIR = ".descarga, [aria-label='tip']";
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const visible = (c) => c && c !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(c);

// Fuentes del sitio incrustadas en el SVG. Un SVG abierto como imagen (que
// es como se rasteriza el PNG) no ve las fuentes de la página: sin esto la
// descarga salía con la fuente del sistema. Se leen de la hoja de Google
// Fonts del sitio y se guardan como data: URL; solo el subconjunto latino.
let fuentesCss = null;
function fuentes() {
  if (fuentesCss) return fuentesCss;
  const href = document.querySelector("link[rel='stylesheet'][href*='fonts.googleapis.com']")?.href;
  fuentesCss = !href ? Promise.resolve("") : (async () => {
    const css = await (await fetch(href)).text();
    const bloques = css.split("/*").filter((b) => /^\s*latin\s*\*\//.test(b)).map((b) => b.slice(b.indexOf("@font-face")));
    const caras = await Promise.all(bloques.map(async (b) => {
      const url = b.match(/url\((https:[^)]+)\)/)?.[1];
      if (!url) return "";
      const datos = await (await fetch(url)).blob();
      const data = await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(datos); });
      return b.replace(url, data);
    }));
    return caras.join("\n");
  })().catch((err) => { console.warn("descarga sin fuentes incrustadas", err); return ""; });
  return fuentesCss;
}

// Línea base de un renglón de texto: el rectángulo que da el navegador es el
// de la fuente (ascendente + descendente); la base queda en la proporción de
// sus métricas.
const lienzoMedidas = document.createElement("canvas").getContext("2d");
function lineaBase(cs, r) {
  lienzoMedidas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = lienzoMedidas.measureText("Hg");
  const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
  return r.top + (asc && desc ? r.height * asc / (asc + desc) : r.height * 0.8);
}

// Serializa la figura a un SVG único: una copia fiel de lo que se ve en
// pantalla. Cada SVG va en su posición real (la columna de tendencias junto
// al heatmap, los paneles lado a lado), cada texto HTML donde está y con su
// fuente, tamaño, peso y color (título, subtítulo, leyendas como «Municipio
// donde baja», pie), y los fondos y bordes de las leyendas HTML. Antes se
// apilaban los SVG uno bajo otro y se perdía el texto de las leyendas.
function figuraASvg(figura, {fondo, tenue}, css) {
  const caja = figura.getBoundingClientRect();
  const cf = getComputedStyle(figura);
  // Coordenadas dentro del CONTENIDO de la figura: con la tarjeta desplazada
  // en horizontal, `scrollLeft` devuelve cada pieza a su lugar.
  const X = (r) => r.left - caja.left + figura.scrollLeft;
  const Y = (r) => r.top - caja.top;
  const ancho = Math.ceil(Math.max(caja.width, figura.scrollWidth));
  const fondos = [], bordes = [], graficas = [], textos = [];
  let abajo = 0;
  const crece = (r) => { abajo = Math.max(abajo, Y(r) + r.height); };

  for (const el of figura.querySelectorAll("*")) {
    if (el.closest(OMITIR)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
    if (el.tagName.toLowerCase() === "svg") {
      if (el.parentElement.closest("svg")) continue;
      const copia = el.cloneNode(true);
      copia.querySelectorAll("[aria-label='tip']").forEach((t) => t.remove());
      copia.setAttribute("x", X(r));
      copia.setAttribute("y", Y(r));
      copia.setAttribute("width", r.width);
      copia.setAttribute("height", r.height);
      if (!copia.getAttribute("viewBox")) copia.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
      // Un SVG suelto pierde lo que hereda de la página: fuente, tamaño y color.
      copia.setAttribute("style", `font-family:${cs.fontFamily};font-size:${cs.fontSize};color:${cs.color};overflow:visible`);
      graficas.push(new XMLSerializer().serializeToString(copia));
      crece(r);
      continue;
    }
    if (el.closest("svg")) continue;
    if (visible(cs.backgroundColor)) {
      fondos.push(`<rect x="${X(r)}" y="${Y(r)}" width="${r.width}" height="${r.height}" rx="${parseFloat(cs.borderTopLeftRadius) || 0}" fill="${cs.backgroundColor}"/>`);
      crece(r);
    }
    for (const [lado, x1, y1, x2, y2] of [["Top", 0, 0, 1, 0], ["Bottom", 0, 1, 1, 1], ["Left", 0, 0, 0, 1], ["Right", 1, 0, 1, 1]]) {
      const w = parseFloat(cs[`border${lado}Width`]), estilo = cs[`border${lado}Style`];
      if (!w || estilo === "none" || !visible(cs[`border${lado}Color`])) continue;
      const guion = estilo === "dashed" ? ` stroke-dasharray="${w * 3} ${w * 2}"` : estilo === "dotted" ? ` stroke-dasharray="${w} ${w}"` : "";
      bordes.push(`<line x1="${X(r) + x1 * r.width}" y1="${Y(r) + y1 * r.height}" x2="${X(r) + x2 * r.width}" y2="${Y(r) + y2 * r.height}" stroke="${cs[`border${lado}Color`]}" stroke-width="${w}"${guion}/>`);
    }
  }

  // Texto HTML: palabra por palabra se mide dónde quedó y se juntan las del
  // mismo renglón, así el corte de línea es el mismo que en pantalla.
  const recorrido = document.createTreeWalker(figura, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeValue.trim() && n.parentElement && !n.parentElement.closest(`svg, ${OMITIR}`)
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const rango = document.createRange();
  for (let n = recorrido.nextNode(); n; n = recorrido.nextNode()) {
    const cs = getComputedStyle(n.parentElement);
    if (cs.visibility === "hidden") continue;
    const mayus = cs.textTransform === "uppercase";
    let renglon = null;
    const cerrar = () => {
      if (!renglon) return;
      const t = mayus ? renglon.t.toUpperCase() : renglon.t;
      const espaciado = cs.letterSpacing !== "normal" ? ` letter-spacing="${cs.letterSpacing}"` : "";
      textos.push(`<text x="${X(renglon.r).toFixed(1)}" y="${(lineaBase(cs, renglon.r) - caja.top).toFixed(1)}" font-family="${esc(cs.fontFamily)}" font-size="${cs.fontSize}" font-weight="${cs.fontWeight}" font-style="${cs.fontStyle}" fill="${cs.color}"${espaciado}>${esc(t)}</text>`);
      crece(renglon.r);
      renglon = null;
    };
    for (const m of n.nodeValue.matchAll(/\S+/g)) {
      rango.setStart(n, m.index);
      rango.setEnd(n, m.index + m[0].length);
      const r = rango.getClientRects()[0];
      if (!r || r.width < 0.5) continue;
      if (renglon && Math.abs(r.top - renglon.r.top) < 2) renglon.t += " " + m[0];
      else { cerrar(); renglon = {t: m[0], r}; }
    }
    cerrar();
  }

  // Margen alrededor de la figura y, abajo, el crédito separado por una línea.
  const M = 24;
  const y = Math.ceil(abajo) + 14;
  const credito = [
    `<line x1="0" y1="${y}" x2="${ancho}" y2="${y}" stroke="${tenue}" stroke-opacity="0.35"/>`,
    `<text x="0" y="${y + 20}" font-family="${esc(cf.fontFamily)}" font-size="11" font-weight="600" fill="${ROJO}">${esc(CREDITO)}</text>`,
  ];
  const alto = y + 20 + M * 2;
  const anchoTotal = ancho + M * 2;

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("xmlns", ns);
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg.setAttribute("viewBox", `0 0 ${anchoTotal} ${alto}`);
  svg.setAttribute("width", anchoTotal);
  svg.setAttribute("height", alto);
  const piezas = [
    css ? `<style><![CDATA[${css}]]></style>` : "",
    `<rect width="${anchoTotal}" height="${alto}" fill="${visible(cf.backgroundColor) ? cf.backgroundColor : fondo}"/>`,
    `<g transform="translate(${M},${M})">`, ...fondos, ...bordes, ...graficas, ...textos, ...credito, "</g>",
  ];

  // El contenido se arma con el parser de XML y se adopta nodo a nodo, en vez
  // de asignar `innerHTML`. Las piezas salen de esta misma función y de
  // XMLSerializer, no de entrada del usuario, pero un `innerHTML` sobre una
  // cadena construida a mano es un patrón que hay que evitar por norma: si
  // mañana alguien mete en el título texto que venga de un CSV, el escape
  // deja de ser una garantía local.
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="${ns}" xmlns:xlink="http://www.w3.org/1999/xlink">${piezas.join("")}</svg>`,
    "image/svg+xml"
  );
  if (doc.querySelector("parsererror")) throw new Error("SVG mal formado al serializar la figura");
  for (const hijo of [...doc.documentElement.childNodes]) {
    svg.appendChild(document.importNode(hijo, true));
  }
  return {texto: new XMLSerializer().serializeToString(svg), ancho: anchoTotal, alto};
}

// Colores del tema actual, leídos del documento: la imagen descargada tiene
// que salir con el mismo fondo que la pantalla, o el texto claro del modo
// oscuro quedaría sobre blanco.
function paleta() {
  const c = getComputedStyle(document.body);
  const raiz = getComputedStyle(document.documentElement);
  return {
    fondo: c.backgroundColor || "#ffffff",
    tinta: c.color || "#1d1d1b",
    tenue: raiz.getPropertyValue("--text-secondary").trim() || "#4a4845",
  };
}

async function aPng(svgTexto, ancho, alto, escala = 2) {
  const blob = new Blob([svgTexto], {type: "image/svg+xml;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "sync";
    await new Promise((ok, err) => {
      img.onload = ok;
      img.onerror = () => err(new Error("no se pudo rasterizar el SVG"));
      img.src = url;
    });
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(alto * escala);
    const ctx = lienzo.getContext("2d");
    ctx.scale(escala, escala);
    ctx.drawImage(img, 0, 0);
    return await new Promise((r) => lienzo.toBlob(r, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Devuelve el bloque de botones. Se cuelga de la figura: al pulsar, busca la
// figura más cercana y la serializa, así que funciona con cualquier gráfica
// de la librería sin tocar sus funciones.
// `montarEn(figura)` cuelga el bloque dentro de la propia figura, bajo el
// pie: la descarga pertenece a la gráfica, no a la sección, y ahí se
// encuentra sin buscarla. Devuelve la figura, para poder encadenarlo en el
// `return` de una página.
export function conDescarga(figura) {
  if (!figura || !figura.querySelector) return figura;
  figura.appendChild(descargar());
  return figura;
}

export function descargar() {
  const aviso = html`<span class="descarga-aviso" role="status" aria-live="polite"></span>`;
  const bloque = html`<div class="descarga">
    <span class="descarga-etiqueta">Descargar</span>
    <button type="button" class="descarga-boton" data-formato="png">PNG</button>
    <button type="button" class="descarga-boton" data-formato="svg">SVG</button>
    ${aviso}
  </div>`;

  bloque.addEventListener("click", async (e) => {
    const boton = e.target.closest(".descarga-boton");
    if (!boton) return;
    const figura = bloque.closest("figure") ||
      bloque.parentElement?.querySelector("figure") ||
      bloque.closest(".seccion-cuerpo")?.querySelector("figure");
    if (!figura) {
      aviso.textContent = "No se encontró la gráfica.";
      return;
    }
    const titulo = figura.querySelector("h3")?.textContent?.trim() ?? "grafica";
    aviso.textContent = "Preparando…";
    try {
      const {texto, ancho, alto} = figuraASvg(figura, paleta(), await fuentes());
      if (boton.dataset.formato === "svg") {
        descargarBlob(new Blob([texto], {type: "image/svg+xml;charset=utf-8"}),
                      nombreArchivo(titulo, "svg"));
      } else {
        const png = await aPng(texto, ancho, alto);
        descargarBlob(png, nombreArchivo(titulo, "png"));
      }
      aviso.textContent = "Descargado.";
    } catch (err) {
      console.error(err);
      aviso.textContent = "No se pudo generar la imagen.";
    }
    setTimeout(() => { aviso.textContent = ""; }, 4000);
  });

  return bloque;
}
