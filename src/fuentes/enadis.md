---
title: ENADIS
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector, SEXOS} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {ranking, dumbbell, pasos, pct, fmtPct, margen} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {punto, poblacionCorta} from "../components/base.js";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "enadis";
const enadis = (await FileAttachment("../data/muestras/enadis.csv").csv({typed: true})).map((r) => ({...r, valor: pct(r)}));
```

```js
display(cabecera(cat, SLUG));
```

## Filtros

```js
display(bloqueFiltros(cat, SLUG));
```

<h2 id="m1" class="toc-anchor">Por qué motivo se discrimina a la población indígena</h2>

```js
const EDADES = [["Todas", "12 años o más"], ["12-29", "12 a 29 años"], ["30-59", "30 a 59 años"], ["60+", "60 años y más"]];
const AMBITOS = [["Total", "Urbano y rural"], ["Urbano", "Urbano"], ["Rural", "Rural"]];
display(muestra({
  numero: "01",
  titulo: "Por qué motivo se discrimina a la población indígena",
  campos: [
    selector("anio", "Edición", [["2022", "2022"], ["2017", "2017"], ["comparar", "Comparar 2017 y 2022"]]),
    selector("sexo", "Sexo", SEXOS),
    selector("edad", "Edad", EDADES),
    selector("ambito", "Localidad", AMBITOS),
  ],
  explica: [
    "Qué parte de la población indígena de 12 años o más dice haber sido discriminada en los últimos 12 meses por cada motivo. Una persona puede señalar varios motivos, así que las barras no suman el total.",
    "El denominador es toda la población indígena del grupo elegido, no solo la discriminada. Al comparar ediciones se muestran solo los motivos que preguntan las dos; la ENADIS no tiene un grupo de comparación no indígena con el mismo módulo.",
  ],
  origen: origen(cat, "grupos-originarios", "/libro/discriminacion"),
  verifica: ver({datos: ["D-ENADIS-2017", "D-ENADIS-2022"], cotejos: ["disc_2017", "disc_2022", "por_indigena_2022"]}),
  dibujar: (v) => {
    const sub = `${SEXOS.find((s) => s[0] === v.sexo)[1]} · ${EDADES.find((e) => e[0] === v.edad)[1]} · ${AMBITOS.find((a) => a[0] === v.ambito)[1]}`;
    const base = enadis.filter((r) => r.indicador === "motivo" && r.sexo === v.sexo && r.edad === v.edad && r.corte === v.ambito);
    const total = (a) => enadis.find((r) => r.indicador === "discriminacion" && r.categoria === "Por algún motivo" && r.edicion === a && r.sexo === v.sexo && r.edad === v.edad && r.corte === v.ambito);
    let fig, filas;
    if (v.anio === "comparar") {
      const comunes = new Set(base.filter((r) => r.edicion === 2017).map((r) => r.categoria).filter((c) => base.some((r) => r.edicion === 2022 && r.categoria === c)));
      filas = base.filter((r) => comunes.has(r.categoria)).map((r) => ({...r, fila: r.categoria, serie: String(r.edicion)}));
      const [c17, c22] = pasos(2);
      fig = dumbbell(filas, {
        series: ["2017", "2022"], colores: {"2017": c17, "2022": c22}, margenIzq: 250,
        titulo: "Motivos de discriminación en 2017 y 2022", subtitulo: `Población indígena · ${sub}`,
        pie: "ENADIS 2017 y 2022 (INEGI) · cada fila es un motivo que preguntan las dos ediciones.",
        renglones: [["Motivo", (d) => d.fila], ["Grupo", (d) => d.serie], ["Valor", (d) => fmtPct(d.valor)], ["Población", (d) => poblacionCorta(d.num)]],
      });
    } else {
      const a = +v.anio;
      filas = base.filter((r) => r.edicion === a).map((r) => ({...r, nombre: r.categoria, cve: r.categoria}));
      const t = total(a);
      fig = ranking(filas, {
        rotulo: "Motivo", etiquetaX: "% de la población indígena →",
        titulo: `Motivos de discriminación, ${a}`,
        subtitulo: `Población indígena · ${sub} · ${fmtPct(pct(t))} fue discriminada por algún motivo`,
        pie: `ENADIS ${a} (INEGI) · cada punto es un motivo; una persona puede señalar varios.`,
      });
    }
    const tabla = tablaColumnas(filas, [
      {etiqueta: "Edición", valor: (d) => d.edicion}, {etiqueta: "Motivo", valor: (d) => d.categoria},
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
