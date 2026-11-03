---
title: Censo de Población y Vivienda
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector, SEXOS} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {serieDestacada, ranking, pct, fmtPct, margen} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {punto} from "../components/base.js";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "censo";
const leer = (r) => ({...r, cve: String(r.cve).padStart(2, "0"), pct: pct(r)});
const serie = (await FileAttachment("../data/muestras/censo_serie.csv").csv({typed: true})).map(leer);
const c2020 = (await FileAttachment("../data/muestras/censo2020_entidad.csv").csv({typed: true})).map(leer);
const ENTIDADES = [...new Map(serie.filter((r) => r.nivel === "entidad").map((r) => [r.cve, r.nombre])).entries()].sort((a, b) => a[1].localeCompare(b[1], "es"));
const OPC_ENT = [["", "Ninguna"], ...ENTIDADES];
```

```js
display(cabecera(cat, SLUG));
```

## Filtros

```js
display(bloqueFiltros(cat, SLUG));
```

<h2 id="m1" class="toc-anchor">Hablantes en cada censo, 1990 - 2020</h2>

```js
display(muestra({
  numero: "01",
  titulo: "Hablantes en cada censo, 1990 - 2020",
  campos: [selector("entidad", "Destacar entidad", OPC_ENT, "20")],
  explica: [
    "Qué parte de la población de 5 años o más habla una lengua indígena en cada censo, en el país y en cada entidad. Se usan solo las ediciones censales; los conteos y las encuestas intercensales están en su propia página.",
    "El denominador es la población de 5 años o más de cada lugar. Es la serie que permite comparar 1990 con 2020, porque en 1990 la pregunta de lengua empezaba a los 5 años.",
  ],
  origen: origen(cat, "perdida-lengua", "/lenguas-en-riesgo"),
  verifica: ver.texto({
    datos: ["D-ITER-1990", "D-ITER-2000", "D-ITER-2010-NAL", "D-ITER-2020-NAL"],
    verificadoCon: ["R-CENSO-1990-TAB-LI", "R-CENSO-2010-TAB-LI", "R-CENSO-2020-TAB"],
    resultado: "Los hablantes de 5 años y más del país coinciden con los publicados en cada censo: 5,282,347 en 1990, 6,044,547 en 2000, 6,695,228 en 2010 y 7,177,185 en 2020 (cotejo hecho en perdida-lengua).",
  }),
  dibujar: (v) => {
    const fig = serieDestacada(serie, {
      destacado: v.entidad || null, etiquetaY: "% de 5 años o más que habla",
      titulo: "Población de 5 años o más que habla una lengua indígena",
      subtitulo: `Censos 1990, 2000, 2010 y 2020${v.entidad ? ` · ${ENTIDADES.find((e) => e[0] === v.entidad)[1]} contra el país` : ""}`,
      pie: "Censos de Población y Vivienda (INEGI) · cada línea gris es una entidad; la morada, el país.",
    });
    const filas = serie.filter((r) => r.nivel === "nacional" || r.cve === v.entidad);
    const tabla = tablaColumnas(filas, [
      {etiqueta: "Lugar", valor: (d) => d.nombre}, {etiqueta: "Año", valor: (d) => d.edicion},
      {etiqueta: "%", valor: (d) => fmtPct(d.pct, 2), num: true}, {etiqueta: "Hablantes", valor: (d) => punto(d.num), num: true},
      {etiqueta: "Población 5+", valor: (d) => punto(d.den), num: true},
    ]);
    return [fig, tabla];
  },
}));
```

<h2 id="m2" class="toc-anchor">Cinco maneras de contar a la población indígena, 2020</h2>

```js
const CRITERIOS_2020 = [["hablantes", "Habla lengua indígena"], ["autoads", "Se considera indígena"], ["hogares", "Vive en un hogar indígena"], ["ambas", "Habla y se considera"], ["todas", "Cualquiera de las anteriores"]];
const EDADES_2020 = [["Todas", "Todas las edades"], ["3-14", "3 a 14 años"], ["15-29", "15 a 29 años"], ["30-59", "30 a 59 años"], ["60+", "60 años y más"]];
display(muestra({
  numero: "02",
  titulo: "Cinco maneras de contar a la población indígena, 2020",
  campos: [
    selector("criterio", "Criterio de identificación", CRITERIOS_2020),
    selector("sexo", "Sexo", SEXOS),
    selector("edad", "Edad", EDADES_2020),
    selector("entidad", "Destacar entidad", OPC_ENT, "09"),
  ],
  explica: [
    "Qué parte de la población de 3 años o más de cada entidad es indígena según el criterio elegido. El mismo censo da cifras muy distintas: hablar una lengua (6.1 % en el país) es mucho menos que considerarse indígena (19.4 %).",
    "El denominador es la población de 3 años o más del grupo de sexo y edad elegido. La autoadscripción sale del cuestionario ampliado y lleva error de muestreo; el habla, del conteo completo cuando no se cruza con ella.",
  ],
  origen: origen(cat, "grupos-originarios", "/libro/la-ciudad-en-el-pais"),
  verifica: ver({datos: ["D-CENSO-2020", "D-ITER-2020-NAL"], cotejos: ["hablantes3_nacional_2020", "pct_autoads_nacional_2020"]}),
  dibujar: (v) => {
    const sel = c2020.filter((r) => r.criterio === v.criterio && r.sexo === v.sexo && r.edad === v.edad);
    const pais = sel.find((r) => r.nivel === "nacional");
    const filas = sel.filter((r) => r.nivel === "entidad").map((r) => ({...r, valor: r.pct}));
    const etiqueta = CRITERIOS_2020.find((c) => c[0] === v.criterio)[1];
    const fig = ranking(filas, {
      destacado: v.entidad || null, referencia: pais?.pct ?? null,
      titulo: `${etiqueta}: parte de la población de cada entidad`,
      subtitulo: `Censo 2020 · ${SEXOS.find((s) => s[0] === v.sexo)[1]} · ${EDADES_2020.find((e) => e[0] === v.edad)[1]}`,
      pie: "Censo de Población y Vivienda 2020 (INEGI) · cada punto es una entidad; la línea punteada, el país.",
    });
    const tabla = tablaColumnas([...filas].sort((a, b) => b.valor - a.valor), [
      {etiqueta: "Entidad", valor: (d) => d.nombre}, {etiqueta: "%", valor: (d) => `${fmtPct(d.valor)}${margen(d.ee)}`, num: true},
      {etiqueta: "Pob. cumple", valor: (d) => punto(d.num), num: true}, {etiqueta: "Pob. total", valor: (d) => punto(d.den), num: true},
      {etiqueta: "Origen", valor: (d) => (d.cota === "muestra" ? "Muestra ampliada" : "Conteo completo")},
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
