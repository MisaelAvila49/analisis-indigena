---
title: "INPI: indicadores"
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {apiladas, pasos, fmtPct} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {GRIS, punto, poblacionCorta} from "../components/base.js";
import * as d3 from "npm:d3";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "inpi";
const mun = (await FileAttachment("../data/muestras/inpi_municipios.csv").csv({typed: true})).map((r) => ({...r, num: r.num ?? 0}));
```

```js
display(cabecera(cat, SLUG));
```

## Qué ya se analizó

```js
display(bloqueAnalisis(cat, SLUG));
```

## Filtros

```js
display(bloqueFiltros(cat, SLUG));
```

## Pruébalo con los filtros

<p class="intro-muestras">Una muestra de lo ya analizado, con los filtros que están construidos. El análisis completo vive en su sitio de origen (enlace en «¿Qué quiere decir este análisis?»).</p>

<h2 id="m1" class="toc-anchor">Los municipios de cada entidad según su población indígena</h2>

```js
// Tipología municipal del INPI, de más a menos presencia indígena.
const TIPOS = ["40 % y más de población indígena", "Menos de 40 % y más de 5,000 indígenas (o pueblos con pocos hablantes)", "Menos de 40 % y menos de 5,000 indígenas", "Sin población indígena"];
const CORTO = {[TIPOS[0]]: "40 % o más indígena", [TIPOS[1]]: "Menos de 40 %, más de 5 mil", [TIPOS[2]]: "Menos de 40 %, menos de 5 mil", [TIPOS[3]]: "Sin población indígena"};
display(muestra({
  numero: "01",
  titulo: "Los municipios de cada entidad según su población indígena",
  campos: [
    selector("medida", "Contar", [["municipios", "Municipios"], ["num", "Población indígena"]]),
    selector("escala", "Mostrar", [["pct", "Porcentaje"], ["numero", "Número"]]),
  ],
  explica: [
    "Cómo se reparten los municipios de cada entidad (o su población indígena) entre los cuatro tipos que define el INPI según la parte de su población que es indígena.",
    "La población indígena del INPI suma a quienes viven en hogares indígenas (el jefe, el cónyuge o algún ascendiente habla lengua indígena) y a los hablantes fuera de esos hogares; incluye menores de 3 años. Con «Población indígena», los municipios sin ella no aparecen.",
  ],
  origen: origen(cat, "grupos-originarios", "/libro/la-ciudad-en-el-pais"),
  verifica: ver({datos: ["D-INPI-2020-HOG", "D-INPI-2020-AUTO"], cotejos: ["pct_pi_nacional_2020", "autoads_mun_mediana_dif_2020"]}),
  dibujar: (v) => {
    const filas = mun.map((r) => ({fila: r.nombre, categoria: CORTO[r.corte], valor: v.medida === "municipios" ? r.municipios : r.num, municipios: r.municipios, num: r.num}))
      .filter((r) => r.valor > 0);
    const parte = (n) => { const t = d3.sum(filas.filter((r) => r.fila === n), (r) => r.valor); return d3.sum(filas.filter((r) => r.fila === n && r.categoria === CORTO[TIPOS[0]]), (r) => r.valor) / t; };
    const orden = [...new Set(filas.map((r) => r.fila))].sort((a, b) => parte(b) - parte(a));
    const cats = TIPOS.map((t) => CORTO[t]);
    const tonos = pasos(3).slice().reverse();
    const colores = {[cats[0]]: tonos[0], [cats[1]]: tonos[1], [cats[2]]: tonos[2], [cats[3]]: GRIS.trazo};
    const fig = apiladas(filas, {
      categorias: cats, colores, orden, cien: v.escala === "pct", margenIzq: 160,
      etiquetaX: v.escala === "pct" ? `% de ${v.medida === "municipios" ? "los municipios" : "la población indígena"} →` : v.medida === "municipios" ? "Municipios →" : "Personas →",
      titulo: v.medida === "municipios" ? "Municipios de cada entidad por tipo" : "Población indígena de cada entidad según el tipo de su municipio",
      subtitulo: "INPI 2020 · tipología municipal · entidades ordenadas por la parte en municipios con 40 % o más",
      pie: "INPI, Indicadores socioeconómicos de los pueblos indígenas 2020 · cada barra es una entidad.",
      formatoValor: (d) => (v.medida === "municipios" ? `${d.valor} municipios` : poblacionCorta(d.valor)),
    });
    const tabla = tablaColumnas(mun, [
      {etiqueta: "Entidad", valor: (d) => d.nombre}, {etiqueta: "Tipo", valor: (d) => d.corte},
      {etiqueta: "Municipios", valor: (d) => punto(d.municipios), num: true}, {etiqueta: "Población indígena", valor: (d) => punto(d.num), num: true},
    ]);
    return [fig, tabla];
  },
}));
```

## Lo que falta

```js
display(bloquePendientes(cat, SLUG));
```
