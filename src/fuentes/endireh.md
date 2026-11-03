---
title: ENDIREH
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector, CRITERIOS, NOMBRE_CRITERIO} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {dumbbell, pct, fmtPct, margen} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {COLOR_SERIE, punto, poblacionCorta} from "../components/base.js";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "endireh";
const endireh = (await FileAttachment("../data/muestras/endireh.csv").csv({typed: true})).map((r) => ({...r, valor: pct(r)}));
```

```js
display(cabecera(cat, SLUG));
```

## Filtros

```js
display(bloqueFiltros(cat, SLUG));
```

<h2 id="m1" class="toc-anchor">Violencia contra las mujeres por ámbito y tipo</h2>

```js
const SERIES = ["Población indígena", "Resto de la población"];
const AMBITOS = ["Cualquier ámbito", "Pareja", "Familiar", "Comunitario", "Laboral", "Escolar"];
const TIPOS = ["Psicológica", "Sexual", "Física", "Económica o patrimonial"];
const EDADES = [["Todas", "15 años o más"], ["15-29", "15 a 29 años"], ["30-59", "30 a 59 años"], ["60+", "60 años y más"]];
display(muestra({
  numero: "01",
  titulo: "Violencia contra las mujeres por ámbito y tipo",
  campos: [
    selector("lugar", "Dónde", [["Nacional", "Todo el país"], ["Ciudad de México", "Ciudad de México"]]),
    selector("criterio", "Mujeres indígenas", CRITERIOS),
    selector("periodo", "Periodo", [["vida", "A lo largo de la vida"], ["12 meses", "Últimos 12 meses"]]),
    selector("edad", "Edad", EDADES),
  ],
  explica: [
    "Qué parte de las mujeres de 15 años o más vivió al menos un acto de violencia en cada ámbito y de cada tipo, comparando a las mujeres indígenas con el resto.",
    "Cada ámbito tiene su propio universo: la violencia laboral se calcula entre quienes trabajaron y la escolar entre quienes asistieron a la escuela; contar a las demás como «sin violencia» diluiría la tasa.",
  ],
  origen: origen(cat, "grupos-originarios", "/libro/violencia"),
  verifica: ver({datos: ["D-ENDIREH-2021"], cotejos: ["vida_total_2021", "vida_hli_2021", "vida_autoads_2021", "12m_total_2021", "12m_hli_2021", "12m_autoads_2021"]}),
  dibujar: (v) => {
    const filas = endireh.filter((r) => r.nombre === v.lugar && r.criterio === v.criterio && r.corte === v.periodo && r.edad === v.edad && SERIES.includes(r.grupo))
      .map((r) => ({...r, fila: r.indicador, serie: r.grupo}));
    const orden = [...AMBITOS, ...TIPOS].filter((i) => filas.some((r) => r.fila === i));
    const fig = dumbbell(filas, {
      series: SERIES, colores: COLOR_SERIE, orden, margenIzq: 190,
      titulo: "Mujeres que vivieron violencia, por ámbito y por tipo",
      subtitulo: `ENDIREH 2021 · ${v.lugar === "Nacional" ? "Todo el país" : v.lugar} · ${NOMBRE_CRITERIO[v.criterio]} · ${v.periodo === "vida" ? "a lo largo de la vida" : "últimos 12 meses"} · ${EDADES.find((e) => e[0] === v.edad)[1]}`,
      pie: "ENDIREH 2021 (INEGI) · arriba los seis ámbitos, abajo los cuatro tipos de violencia.",
      renglones: [["Ámbito o tipo", (d) => d.fila], ["Grupo", (d) => d.serie], ["Valor", (d) => `${fmtPct(d.valor)}${margen(d.ee)}`], ["Población", (d) => poblacionCorta(d.num)]],
    });
    const tabla = tablaColumnas(filas, [
      {etiqueta: "Ámbito o tipo", valor: (d) => d.fila}, {etiqueta: "Grupo", valor: (d) => d.serie},
      {etiqueta: "%", valor: (d) => `${fmtPct(d.valor)}${margen(d.ee)}`, num: true},
      {etiqueta: "Pob. cumple", valor: (d) => punto(d.num), num: true}, {etiqueta: "Pob. total", valor: (d) => punto(d.den), num: true},
      {etiqueta: "Casos en muestra", valor: (d) => punto(d.casos), num: true},
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
