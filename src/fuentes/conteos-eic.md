---
title: Conteos y Encuesta Intercensal
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector} from "../components/pagina.js";
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
const SLUG = "conteos-eic";
const ident = (await FileAttachment("../data/muestras/eic_identidad.csv").csv({typed: true})).map((r) => ({...r, cve: String(r.cve).padStart(2, "0"), valor: pct(r)}));
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

<h2 id="m1" class="toc-anchor">Habla una lengua y se considera indígena, por entidad</h2>

```js
const NOMBRE = {habla: "Habla lengua indígena", autoads: "Se considera indígena"};
const ORDEN = [["autoads", "Por quienes se consideran indígenas"], ["habla", "Por quienes hablan"], ["brecha", "Por la distancia entre las dos"]];
display(muestra({
  numero: "01",
  titulo: "Habla una lengua y se considera indígena, por entidad",
  campos: [selector("edicion", "Edición", [[2025, "2025 · Encuesta Intercensal"], [2015, "2015 · Encuesta Intercensal"]]), selector("orden", "Ordenar", ORDEN)],
  explica: [
    "Las dos medidas de identificación de la encuesta intercensal, lado a lado en cada entidad: qué parte de la población habla una lengua indígena y qué parte se considera indígena. La distancia entre los dos puntos es la población que se reconoce indígena sin hablar la lengua.",
    "El denominador es la población de 3 años o más de cada entidad. La autoadscripción de 2015 usó el fraseo «de acuerdo con su cultura», que la elevó a 21.5 % en el país; no es comparable con el Censo 2010.",
  ],
  origen: origen(cat, "perdida-lengua", "/hablantes"),
  verifica: ver({datos: ["D-EIC-2015-NAL", "D-EIC-2025-MICRO"], cotejos: ["hablantes3_nacional_2015_micro", "hablantes3_nacional_2025_micro"]}),
  dibujar: (v) => {
    const colores = {[NOMBRE.habla]: COLOR_SERIE["Mujeres indígenas"], [NOMBRE.autoads]: COLOR_SERIE["Hombres indígenas"]};
    const filas = ident.filter((r) => r.edicion === +v.edicion).map((r) => ({...r, fila: r.nombre, serie: NOMBRE[r.criterio]}));
    const val = (n, c) => filas.find((r) => r.nombre === n && r.criterio === c)?.valor ?? 0;
    const nombres = [...new Set(filas.map((r) => r.nombre))];
    const orden = v.orden === "brecha"
      ? nombres.sort((a, b) => (val(b, "autoads") - val(b, "habla")) - (val(a, "autoads") - val(a, "habla")))
      : nombres.sort((a, b) => val(b, v.orden) - val(a, v.orden));
    const fig = dumbbell(filas, {
      series: [NOMBRE.habla, NOMBRE.autoads], colores, orden, margenIzq: 170,
      titulo: "Las dos medidas de población indígena en cada entidad",
      subtitulo: `Encuesta Intercensal ${v.edicion} · población de 3 años o más`,
      pie: "Encuesta Intercensal (INEGI) · cada fila es una entidad; la línea gris une sus dos medidas.",
      renglones: [["Entidad", (d) => d.fila], ["Grupo", (d) => d.serie], ["Valor", (d) => `${fmtPct(d.valor)}${margen(d.ee)}`], ["Población", (d) => poblacionCorta(d.num)]],
    });
    const tabla = tablaColumnas(filas, [
      {etiqueta: "Entidad", valor: (d) => d.nombre}, {etiqueta: "Medida", valor: (d) => d.serie},
      {etiqueta: "%", valor: (d) => `${fmtPct(d.valor)}${margen(d.ee)}`, num: true},
      {etiqueta: "Pob. cumple", valor: (d) => punto(d.num), num: true}, {etiqueta: "Pob. total", valor: (d) => punto(d.den), num: true},
      {etiqueta: "Casos en muestra", valor: (d) => punto(d.casos), num: true},
    ]);
    return [fig, tabla];
  },
}));
```

## Lo que falta

```js
display(bloquePendientes(cat, SLUG));
```
