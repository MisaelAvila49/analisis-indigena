// src/components/pagina.js
// Lo que repite cada página de fuente: el catálogo, la procedencia
// (fuentes.csv + verificaciones.csv + calculado.csv de grupos-originarios) y
// los bloques fijos de arriba (encabezado, ficha, filtros) y de abajo
// (análisis existentes, pendientes). Las rutas de FileAttachment tienen que
// ser literales, así que cada página carga los archivos y los pasa aquí.
import {html} from "npm:htl";
import {abrirCatalogo, encabezado, ficha, tablaFiltros, listaAnalisis, listaPendientes, chipFiltro, queSeAnalizo} from "./inventario.js";
import {procedencia, catalogo as catalogoFuentes, verificado} from "./fuentes.js";
import {campo} from "./panel-seccion.js";

export function prepararPagina({catalogo, fuentes, verificaciones, calculado}) {
  const cat = abrirCatalogo(catalogo);
  const ver = procedencia({fuentes, verificaciones, calculado});
  // Verificación escrita a mano, para cotejos hechos en el sitio de origen
  // que no están en verificaciones.csv (los totales de perdida-lengua).
  const refs = catalogoFuentes(fuentes);
  ver.texto = (opciones) => verificado(refs, opciones);
  return {cat, ver};
}

export function cabecera(cat, slug) {
  return html`${encabezado(cat, slug)}${ficha(cat, slug)}`;
}

export function bloqueFiltros(cat, slug) {
  return html`<div class="bloque-inventario">
    <p class="leyenda-filtros">
      <span>${chipFiltro("probado")} construido en un análisis y revisado</span>
      <span>${chipFiltro("disponible")} existe en la fuente, sin construir</span>
      <span>${chipFiltro("por-confirmar")} falta confirmar la variable</span>
    </p>
    <div class="filtros-dos">
      <div><h3>Identificación indígena</h3>${tablaFiltros(cat, slug, "indigena")}</div>
      <div><h3>Sociodemográficos</h3>${tablaFiltros(cat, slug, "sociodemografico")}</div>
    </div>
  </div>`;
}

export const bloqueAnalisis = (cat, slug) => html`<div class="bloque-inventario">${queSeAnalizo(cat, slug)}</div>`;
export const bloquePendientes = (cat, slug) => html`<div class="bloque-inventario">${listaPendientes(cat, slug)}</div>`;

// Enlace al análisis completo en su sitio de origen (para el desplegable).
export function origen(cat, sitio, ruta, texto = "Ver el análisis completo") {
  const s = cat.sitios.get(sitio);
  return {href: s.url ? `${s.url}${ruta}` : `https://github.com/${s.repositorio}`, texto: s.url ? texto : `${texto} (repositorio, sin publicar)`};
}

// Selector simple a partir de pares [clave, etiqueta].
let nCampo = 0;
export function selector(nombre, etiqueta, pares, valor = pares[0]?.[0]) {
  return campo({id: `c-${nombre}-${++nCampo}`, etiqueta, nombre, valor: String(valor),
    opciones: pares.map(([clave, et]) => ({clave: String(clave), etiqueta: et}))});
}

export const CRITERIOS = [["lengua", "Habla lengua indígena"], ["autoads", "Se considera indígena"]];
export const SEXOS = [["Total", "Mujeres y hombres"], ["Mujeres", "Mujeres"], ["Hombres", "Hombres"]];
export const NOMBRE_CRITERIO = Object.fromEntries(CRITERIOS);
