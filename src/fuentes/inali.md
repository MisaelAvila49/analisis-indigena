---
title: "INALI: lenguas y variantes"
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {apiladas, pasos, fmtPct} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {punto} from "../components/base.js";
import * as d3 from "npm:d3";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "inali";
const riesgo = await FileAttachment("../data/muestras/inali_riesgo.csv").csv();
```

```js
display(cabecera(cat, SLUG));
```

## Filtros

```js
display(bloqueFiltros(cat, SLUG));
```

<h2 id="m1" class="toc-anchor">Las variantes según su riesgo de desaparecer</h2>

```js
const GRADOS = ["Muy alto", "Alto", "Mediano", "No inmediato"];
const FAMILIAS = d3.groupSort(riesgo, (v) => -v.length, (r) => r.familia);
display(muestra({
  numero: "01",
  titulo: "Las variantes según su riesgo de desaparecer",
  campos: [
    selector("familia", "Familia lingüística", [["", "Todas las familias"], ...FAMILIAS.map((f) => [f, f])]),
    selector("medida", "Medida", [["numero", "Número de variantes"], ["pct", "Porcentaje"]]),
  ],
  explica: [
    "Cuántas de las 364 variantes lingüísticas del catálogo del INALI estaban en cada grado de riesgo de desaparición en 2012, por familia; al elegir una familia, por agrupación.",
    "El grado es el que publica el INALI en su libro de 2012 para cada variante. Los censos no preguntan la variante: los sitios de origen la infieren por la localidad de cada hablante.",
  ],
  origen: origen(cat, "grupos-originarios", "/libro/lenguas-en-riesgo"),
  verifica: ver({datos: ["D-INALI-RIESGO-2012", "D-INALI-CLIN-2008"], cotejos: ["variantes_muy_alto", "variantes_alto", "variantes_mediano", "variantes_no_inmediato"]}),
  dibujar: (v) => {
    const sel = v.familia ? riesgo.filter((r) => r.familia === v.familia) : riesgo;
    const llave = v.familia ? "agrupacion" : "familia";
    const filas = d3.rollups(sel, (g) => g.length, (r) => r[llave], (r) => r.corte)
      .flatMap(([fila, gs]) => gs.map(([categoria, valor]) => ({fila, categoria, valor})));
    const orden = d3.groupSort(filas, (g) => -d3.sum(g, (r) => r.valor), (r) => r.fila);
    const tonos = pasos(4).slice().reverse();
    const colores = Object.fromEntries(GRADOS.map((g, i) => [g, tonos[i]]));
    const fig = apiladas(filas, {
      categorias: GRADOS, colores, orden, cien: v.medida === "pct", margenIzq: v.familia ? 210 : 160,
      etiquetaX: v.medida === "pct" ? "% de las variantes →" : "Variantes →",
      titulo: v.familia ? `Variantes de la familia ${v.familia}, por agrupación` : "Variantes por familia lingüística",
      subtitulo: `INALI 2012 · ${punto(sel.length)} variantes · grado de riesgo de desaparición`,
      pie: "INALI, Lenguas indígenas nacionales en riesgo de desaparición (2012) · cada barra suma las variantes de la fila.",
      formatoValor: (d) => `${d.valor} variantes`,
    });
    const tabla = tablaColumnas(sel, [
      {etiqueta: "Familia", valor: (d) => d.familia}, {etiqueta: "Agrupación", valor: (d) => d.agrupacion},
      {etiqueta: "Variante", valor: (d) => d.variante}, {etiqueta: "Grado de riesgo", valor: (d) => d.corte},
    ], {titulo: "Ver las variantes"});
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
