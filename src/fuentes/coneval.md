---
title: "CONEVAL: pobreza"
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector, SEXOS} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {lineas, fmtPct} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {COLOR_SERIE} from "../components/base.js";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "coneval";
const pobreza = (await FileAttachment("../data/muestras/coneval.csv").csv({typed: true})).map((r) => ({...r, valor: r.pct}));
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

<h2 id="m1" class="toc-anchor">Pobreza y carencias de la población indígena, 2016 - 2024</h2>

```js
const SERIES = ["Población indígena", "Resto de la población"];
const BLOQUES = ["Pobreza", "Carencias", "Privación social", "Bienestar económico"];
const INDICADORES = BLOQUES.flatMap((b) => [...new Set(pobreza.filter((r) => r.corte === b).map((r) => r.indicador))].map((i) => [i, i]));
const CRIT = [["pertenencia", "Pertenece a un hogar indígena"], ["lengua", "Habla lengua indígena"]];
display(muestra({
  numero: "01",
  titulo: "Pobreza y carencias de la población indígena, 2016 - 2024",
  campos: [
    selector("indicador", "Indicador", INDICADORES, "Pobreza"),
    selector("criterio", "Criterio de identificación", CRIT),
    selector("sexo", "Sexo", SEXOS),
  ],
  explica: [
    "Qué parte de la población indígena y del resto está en pobreza, en cada carencia social o bajo las líneas de ingreso, en cada medición bienal. Son las cifras oficiales del anexo estadístico, calculadas con la ENIGH.",
    "El denominador es toda la población del grupo. La pertenencia étnica usa la definición de hogar indígena del INPI. Por sexo, con pertenencia étnica solo se publica la población indígena, sin el resto; y en 2024 solo se tiene el dato por lengua, sin separar por sexo.",
  ],
  origen: origen(cat, "grupos-originarios", "/libro/condiciones-de-vida"),
  verifica: ver({datos: ["D-CONEVAL-AE-2022"], cotejos: ["pobreza_indigena_2022", "pobreza_extrema_indigena_2022"]}),
  dibujar: (v) => {
    const filas = pobreza.filter((r) => r.indicador === v.indicador && r.criterio === v.criterio && r.sexo === v.sexo).map((r) => ({...r, serie: r.grupo}));
    const anios = [...new Set(filas.map((r) => r.edicion))].sort();
    const fig = lineas(filas, {
      x: "edicion", dominioX: anios, series: SERIES, colores: COLOR_SERIE, etiquetaX: "Medición", etiquetaY: "% de la población",
      titulo: v.indicador, subtitulo: `${CRIT.find((c) => c[0] === v.criterio)[1]} · ${SEXOS.find((s) => s[0] === v.sexo)[1]} · ${anios[0]} - ${anios.at(-1)}`,
      pie: "Medición multidimensional de la pobreza (CONEVAL, hoy INEGI) · cada punto es una medición bienal.",
      renglones: [["Grupo", (d) => d.serie], ["Año", (d) => d.edicion], ["Valor", (d) => fmtPct(d.valor)], ["Millones de personas", (d) => d.millones?.toFixed(1)]],
    });
    const tabla = tablaColumnas(filas, [
      {etiqueta: "Año", valor: (d) => d.edicion}, {etiqueta: "Grupo", valor: (d) => d.serie},
      {etiqueta: "%", valor: (d) => fmtPct(d.valor), num: true}, {etiqueta: "Millones de personas", valor: (d) => d.millones?.toFixed(2) ?? "", num: true},
    ]);
    return [fig, tabla];
  },
}));
```

## Lo que falta

```js
display(bloquePendientes(cat, SLUG));
```
