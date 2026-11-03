---
title: ENIGH
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector, CRITERIOS, SEXOS, NOMBRE_CRITERIO} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {lineas, pct, fmtPct, margen} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {COLOR_SERIE, punto, poblacionCorta} from "../components/base.js";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "enigh";
const decil = await FileAttachment("../data/muestras/enigh_decil.csv").csv({typed: true});
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

<h2 id="m1" class="toc-anchor">La conexión del hogar según el ingreso</h2>

```js
const SERIES = ["Población indígena", "Resto de la población"];
const indicadoresDe = (anio) => [...new Set(decil.filter((r) => r.edicion === +anio).map((r) => r.indicador))].sort();
const campos1 = [
  selector("indicador", "Indicador", indicadoresDe(2024).map((i) => [i, i]), "Vive en un hogar con conexión a internet"),
  selector("criterio", "Criterio de identificación", CRITERIOS),
  selector("edicion", "Edición", [[2024, "2024"], [2022, "2022"], [2020, "2020"]]),
  selector("sexo", "Sexo", SEXOS),
];
display(muestra({
  numero: "01",
  titulo: "La conexión del hogar según el ingreso",
  campos: campos1,
  // El servicio de streaming solo se pregunta en 2024: la lista de
  // indicadores se rehace con la edición elegida.
  ajustar: (v, c) => c[0].rellenar(indicadoresDe(v.edicion).map((i) => ({clave: i, etiqueta: i})), v.indicador),
  explica: [
    "Qué parte de las personas de 6 años o más vive en un hogar con el servicio o el aparato elegido, en cada decil de ingreso corriente del hogar (el 1 es el 10 % de hogares con menos ingreso).",
    "El denominador son las personas del grupo en ese decil. La población indígena se define con el criterio elegido: hablar una lengua indígena o considerarse indígena. Las cifras salen de las celdas que publica el sitio de origen; el margen es aproximado porque suma celdas sin la covarianza del diseño muestral.",
  ],
  origen: origen(cat, "grupos-originarios", "/encuestas/enigh/hogar"),
  verifica: ver({datos: ["D-ENIGH-2020", "D-ENIGH-2022", "D-ENIGH-2024"], cotejos: ["hog_internet_2024"],
    nota: "Verificación pendiente: la cifra de hogares con internet de la ENIGH 2024 todavía no se coteja contra sus tabulados."}),
  dibujar: (v) => {
    const filas = decil.filter((r) => r.edicion === +v.edicion && r.indicador === v.indicador && r.criterio === v.criterio && r.sexo === v.sexo)
      .map((r) => ({...r, serie: r.grupo, valor: pct(r)}));
    const fig = lineas(filas, {
      x: "corte", dominioX: Array.from({length: 10}, (_, i) => i + 1), series: SERIES, colores: COLOR_SERIE,
      etiquetaX: "Decil de ingreso del hogar →", etiquetaY: "% de personas",
      titulo: v.indicador, subtitulo: `${NOMBRE_CRITERIO[v.criterio]} · ${v.edicion} · ${SEXOS.find((s) => s[0] === v.sexo)[1]} · personas de 6 años o más`,
      pie: "ENIGH (INEGI) · cada punto es el porcentaje de personas del grupo en ese decil.",
      renglones: [["Grupo", (d) => d.serie], ["Decil", (d) => d.corte], ["Valor", (d) => fmtPct(d.valor)], ["Población", (d) => poblacionCorta(d.num)]],
    });
    const tabla = tablaColumnas(filas, [
      {etiqueta: "Decil", valor: (d) => d.corte, num: true}, {etiqueta: "Grupo", valor: (d) => d.serie},
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
