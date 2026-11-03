---
title: "CONAPO: marginación"
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {dumbbell, fmtPct} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {COLOR_SERIE, punto, poblacionCorta} from "../components/base.js";
import * as d3 from "npm:d3";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "conapo";
const agebs = await FileAttachment("../data/muestras/conapo_ageb.csv").csv({typed: true});
const ALCALDIAS = [...new Set(agebs.map((r) => r.nombre))].sort((a, b) => a.localeCompare(b, "es"));
```

```js
display(cabecera(cat, SLUG));
```

## Filtros

```js
display(bloqueFiltros(cat, SLUG));
```

<h2 id="m1" class="toc-anchor">En qué grado de marginación viven los hablantes de la ciudad</h2>

```js
const GRADOS = ["Muy bajo", "Bajo", "Medio", "Alto", "Muy alto"];
const POBS = [["hli", "Hablantes de lengua indígena (3 años o más)"], ["hogares", "Población en hogares indígenas"]];
display(muestra({
  numero: "01",
  titulo: "En qué grado de marginación viven los hablantes de la ciudad",
  campos: [selector("poblacion", "Población indígena", POBS), selector("alcaldia", "Alcaldía", [["", "Toda la ciudad"], ...ALCALDIAS.map((a) => [a, a])])],
  explica: [
    "Cómo se reparte cada población entre las AGEB urbanas de la Ciudad de México según su grado de marginación (CONAPO 2020). Si la población indígena está más cargada hacia los grados alto y muy alto que el total, vive en zonas más marginadas.",
    "El denominador es cada población completa en las AGEB urbanas de la ciudad o de la alcaldía elegida; cada columna suma 100 %. La población por AGEB sale del Censo 2020 y se une al índice por la clave de 13 dígitos. Las AGEB sin grado asignado quedan fuera.",
  ],
  origen: origen(cat, "grupos-originarios", "/libro/colonias-y-marginacion"),
  verifica: ver({datos: ["D-CONAPO-IMU-2020", "D-CENSO-2020-RESAGEBURB"], cotejos: ["pob_igual_conapo", "cdmx_phog_ind"]}),
  dibujar: (v) => {
    const sel = agebs.filter((r) => (!v.alcaldia || r.nombre === v.alcaldia) && GRADOS.includes(r.corte));
    const nombreInd = POBS.find((p) => p[0] === v.poblacion)[1].replace(/ \(.*\)$/, "");
    const reparto = (campo, serie) => {
      const total = d3.sum(sel, (r) => r[campo]);
      return GRADOS.map((g) => {
        const num = d3.sum(sel.filter((r) => r.corte === g), (r) => r[campo]);
        return {fila: g, serie, num, den: total, valor: total ? (100 * num) / total : null, agebs: d3.sum(sel.filter((r) => r.corte === g), (r) => r.agebs)};
      });
    };
    const filas = [...reparto(v.poblacion, nombreInd), ...reparto("pobtot", "Toda la población")];
    const colores = {[nombreInd]: COLOR_SERIE["Población indígena"], "Toda la población": COLOR_SERIE["Resto de la población"]};
    const fig = dumbbell(filas, {
      series: [nombreInd, "Toda la población"], colores, orden: GRADOS.slice().reverse(), margenIzq: 110, etiquetaX: "% de cada población →",
      titulo: "Cómo se reparte cada población entre los grados de marginación",
      subtitulo: `${v.alcaldia || "Ciudad de México"} · AGEB urbanas · índice de marginación urbana 2020`,
      pie: "CONAPO, índice de marginación urbana 2020, y Censo 2020 (INEGI) · cada columna de color suma 100 %.",
      renglones: [["Grado", (d) => d.fila], ["Grupo", (d) => d.serie], ["Valor", (d) => fmtPct(d.valor)], ["Población", (d) => poblacionCorta(d.num)]],
    });
    const tabla = tablaColumnas(filas, [
      {etiqueta: "Grado", valor: (d) => d.fila}, {etiqueta: "Población", valor: (d) => d.serie},
      {etiqueta: "%", valor: (d) => fmtPct(d.valor), num: true}, {etiqueta: "Personas", valor: (d) => punto(d.num), num: true},
      {etiqueta: "AGEB", valor: (d) => punto(d.agebs), num: true},
    ]);
    return [fig, tabla];
  },
}));
```

## Análisis que ya existen

```js
display(bloqueAnalisis(cat, SLUG));
```

## Lo que falta

```js
display(bloquePendientes(cat, SLUG));
```
