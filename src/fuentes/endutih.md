---
title: ENDUTIH
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes, origen, selector, CRITERIOS, SEXOS, NOMBRE_CRITERIO} from "../components/pagina.js";
import {muestra} from "../components/inventario.js";
import {heatmapBrecha, pct, fmtPct, margen} from "../components/muestras.js";
import {tablaColumnas} from "../components/graficas.js";
import {punto} from "../components/base.js";
const {cat, ver} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "endutih";
const uso = (await FileAttachment("../data/muestras/endutih_edad.csv").csv({typed: true})).map((r) => ({...r, valor: pct(r)}));
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

<h2 id="m1" class="toc-anchor">La brecha digital en cada edad</h2>

```js
const EDADES = ["6-11", "12-17", "18-29", "30-44", "45-59", "60+", "Todas"];
const ROTULO_EDAD = (e) => (e === "Todas" ? "Todas" : e === "60+" ? "60 y más" : e.replace("-", " a "));
display(muestra({
  numero: "01",
  titulo: "La brecha digital en cada edad",
  campos: [selector("criterio", "Criterio de identificación", CRITERIOS), selector("sexo", "Sexo", SEXOS)],
  explica: [
    "Cada celda es la diferencia, en puntos porcentuales, entre la población indígena y el resto de la población en un uso de la tecnología y un grupo de edad. Rojo: la población indígena está por debajo; azul, por encima.",
    "El denominador es la población de 6 años o más de cada grupo de edad, salvo cuatro que se calculan entre quienes ya usan la tecnología: el celular inteligente (entre quienes usan celular), la conexión con datos móviles (entre quienes tienen celular inteligente) y el uso diario o en el hogar (entre quienes usan internet). Es la única edición con filtro indígena, así que no hay serie.",
  ],
  origen: origen(cat, "grupos-originarios", "/encuestas/endutih/uso"),
  verifica: ver({datos: ["D-ENDUTIH-2025"], cotejos: ["usa_internet_6mas", "usa_celular_6mas", "usa_computadora_6mas", "net_habla_lengua", "net_se_considera"]}),
  dibujar: (v) => {
    const sel = uso.filter((r) => r.criterio === v.criterio && r.sexo === v.sexo);
    const indicadores = [...new Set(sel.map((r) => r.indicador))];
    const celdas = [];
    for (const i of indicadores) for (const e of EDADES) {
      const a = sel.find((r) => r.indicador === i && r.edad === e && r.grupo === "Población indígena");
      const b = sel.find((r) => r.indicador === i && r.edad === e && r.grupo === "Resto de la población");
      celdas.push({fila: i, columna: ROTULO_EDAD(e), a: a?.valor, b: b?.valor, brecha: a && b ? a.valor - b.valor : null});
    }
    const orden = [...indicadores].sort((x, y) => {
      const t = (i) => celdas.find((c) => c.fila === i && c.columna === "Todas")?.brecha ?? 0;
      return t(x) - t(y);
    });
    const fig = heatmapBrecha(celdas, {
      filas: orden, columnas: EDADES.map(ROTULO_EDAD), etiquetaColumnas: "Grupo de edad",
      titulo: "Diferencia entre la población indígena y el resto, en puntos",
      subtitulo: `ENDUTIH 2025 · ${NOMBRE_CRITERIO[v.criterio]} · ${SEXOS.find((s) => s[0] === v.sexo)[1]} · columnas: grupo de edad`,
      pie: "ENDUTIH 2025 (INEGI) · cada celda resta el porcentaje del resto de la población al de la población indígena.",
    });
    const tabla = tablaColumnas(sel.filter((r) => r.edad === "Todas"), [
      {etiqueta: "Indicador", valor: (d) => d.indicador}, {etiqueta: "Grupo", valor: (d) => d.grupo},
      {etiqueta: "%", valor: (d) => `${fmtPct(d.valor)}${margen(d.ee)}`, num: true},
      {etiqueta: "Pob. cumple", valor: (d) => punto(d.num), num: true}, {etiqueta: "Pob. total", valor: (d) => punto(d.den), num: true},
      {etiqueta: "Casos en muestra", valor: (d) => punto(d.casos), num: true},
    ], {titulo: "Ver los datos de todas las edades"});
    return [fig, tabla];
  },
}));
```

## Lo que falta

```js
display(bloquePendientes(cat, SLUG));
```
