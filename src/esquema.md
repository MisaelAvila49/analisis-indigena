---
title: Esquema de datos
toc: true
---

```js
import {abrirCatalogo} from "./components/inventario.js";
const catalogoJson = await FileAttachment("data/catalogo.json").json();
const cat = abrirCatalogo(catalogoJson);
const tabla = (filas, columnas) => html`<div class="tabla-scroll esquema-tabla" tabindex="0" role="region" aria-label="Tabla del esquema"><table>
  <thead><tr>${columnas.map((c) => html`<th>${c[0]}</th>`)}</tr></thead>
  <tbody>${filas.map((f) => html`<tr>${columnas.map((c) => html`<td>${c[1](f)}</td>`)}</tr>`)}</tbody>
</table></div>`;
const codigo = (t) => html`<code>${t}</code>`;
```

<header class="encabezado-capitulo">
  <p class="antetitulo">Para llevar el inventario a IberoData</p>
  <h1>Esquema de <span class="h1-clave">datos</span></h1>
  <p class="entradilla">Todo lo que muestra este sitio sale de tres piezas: un catálogo de fuentes, un catálogo de filtros y una sola forma de tabla para los resultados. Las tres están escritas para pasar a IberoData sin rehacerse.</p>
</header>

## Las tres piezas

<div class="texto-largo">

El **catálogo de fuentes** (`src/data/catalogo.json`, lista `fuentes`) describe cada encuesta, censo, registro o indicador: qué es, qué ediciones tiene y cuáles ya se procesaron, su universo, hasta qué nivel territorial baja, qué filtros trae y en qué estado está cada uno, qué análisis existen y qué falta. Los campos que IberoData ya tiene en su modelo `Dataset` llevan el mismo nombre (`slug`, `title`, `sourceOrg`, `sourceUrl`, `survey`, `periodType`, `tags`); lo demás es extensión.

El **catálogo de filtros** (lista `filtros` del mismo archivo) define una sola vez cada filtro canónico, como «habla lengua indígena» o «se considera indígena», con su nombre de máquina y tipo de dato. En IberoData corresponde a `HarmonizerCanonicalVariable`; cada renglón `filtros[].variable` de una fuente es el `sourceColumn` de un `HarmonizerMapping` para esa edición.

La **tabla de resultados** es una sola forma para todo indicador calculado: una fila por combinación de fuente, edición, lugar, grupo y corte, con numerador, denominador, error estándar y casos. Los doce archivos de `src/data/muestras/` ya la usan, y es la forma que una receta de `Analysis` en IberoData (pasos `group_by`, `aggregate` con `SUM` y `compute`) puede producir y volver a agregar sin promediar tasas.

</div>


## Campos de una fuente

```js
const CAMPOS_FUENTE = [
  ["slug", "texto", "Dataset.slug", "Identificador en minúsculas y guiones; también es la ruta de la página."],
  ["title", "texto", "Dataset.title", "Nombre oficial de la fuente."],
  ["sigla", "texto", "extensión", "Nombre corto para menús y gráficas."],
  ["sourceOrg", "texto", "Dataset.sourceOrg", "Institución que la levanta o publica."],
  ["sourceUrl", "URL", "Dataset.sourceUrl", "Página oficial del programa."],
  ["survey", "enum", "Dataset.survey", "Valor del enum Survey de IberoData (CENSO, ENIGH, ENDUTIH…); OTRA mientras el enum no tenga la fuente."],
  ["periodType", "enum", "Dataset.periodType", "ANNUAL, BIANNUAL, MULTIYEAR u ONE_TIME."],
  ["description", "texto", "Dataset.description", "Para qué sirve (la «importancia» de la bitácora)."],
  ["tags", "lista de texto", "Dataset.tags", "Temas."],
  ["tipo", "texto", "extensión", "Censo, encuesta en hogares, indicador derivado, registro administrativo o catálogo."],
  ["ediciones", "lista de años", "extensión (un Dataset por edición)", "Años de levantamiento que existen."],
  ["edicionesProcesadas", "lista de años", "extensión", "Años ya trabajados en algún sitio del equipo."],
  ["estado", "enum", "extensión", "analizada, parcial o identificada (ver abajo)."],
  ["estadoBitacora", "enum o nulo", "extensión", "Estado en la bitácora de septiembre; nulo si no estaba."],
  ["universo", "texto", "extensión", "A quién cubre la fuente y desde qué edad se pregunta la lengua."],
  ["niveles", "objeto nivel → estado", "extensión", "Niveles territoriales disponibles y cuáles ya se usaron."],
  ["filtros", "lista de {filtro, variable, estado, detalle}", "HarmonizerMapping", "Cada filtro canónico con la variable o pregunta exacta en esta fuente."],
  ["nota", "texto", "Dataset.changelog o extensión", "Cautelas de comparabilidad."],
  ["pendientes", "lista de texto", "extensión", "Lo que falta para completar la fuente."],
  ["analisis", "lista de {titulo, sitio, ruta, ediciones, forma}", "Analysis (por publicar)", "Análisis que ya existen y dónde."],
  ["fuentesIds", "lista de texto", "extensión", "Identificadores de src/data/fuentes.csv, para citar y verificar."],
];
display(tabla(CAMPOS_FUENTE, [["Campo", (d) => codigo(d[0])], ["Tipo", (d) => d[1]], ["En IberoData", (d) => d[2]], ["Qué guarda", (d) => d[3]]]));
```


## Filtros canónicos

```js
display(tabla(catalogoJson.filtros, [
  ["Nombre", (d) => codigo(d.name)], ["Rótulo", (d) => d.label], ["Tipo", (d) => (d.tipo === "indigena" ? "Identificación indígena" : "Sociodemográfico")],
  ["dataType", (d) => codigo(d.dataType)], ["Definición", (d) => d.description],
  ["Fuentes que lo traen", (d) => cat.fuentes.filter((f) => f.filtros.some((x) => x.filtro === d.id)).map((f) => f.sigla).join(", ")],
]));
```


## Estados

```js
display(tabla([...catalogoJson.estados.map((e) => ({...e, de: "Fuente"})), ...catalogoJson.estadosFiltro.map((e) => ({...e, de: "Filtro o nivel"}))], [
  ["Se aplica a", (d) => d.de], ["Valor", (d) => codigo(d.id)], ["Rótulo", (d) => d.etiqueta], ["Qué quiere decir", (d) => d.descripcion],
]));
```


## La tabla de resultados

```js
const COLS = [
  ["fuente", "texto", "slug de la fuente."],
  ["edicion", "entero", "Año de levantamiento."],
  ["nivel", "texto", "nacional, entidad, municipio, localidad, ageb o manzana."],
  ["cve", "texto", "Clave geográfica del INEGI con ceros a la izquierda (00, 09, 09015…)."],
  ["nombre", "texto", "Nombre del lugar o de la unidad."],
  ["indicador", "texto", "Qué se mide (vive en un hogar con internet, discriminación por motivo…)."],
  ["criterio", "texto", "Filtro canónico con que se identificó a la población indígena (lengua, autoads, hogares, pertenencia)."],
  ["grupo", "texto", "Población indígena, Resto de la población, u otra serie de comparación."],
  ["sexo", "texto", "Total, Mujeres u Hombres. «Total» es un renglón propio, no la suma en el navegador."],
  ["edad", "texto", "Todas o el grupo de edad."],
  ["corte", "texto", "La dimensión extra de cada análisis: decil, ámbito urbano o rural, grado de marginación, periodo."],
  ["num", "número", "Numerador expandido: quienes cumplen. Nunca un porcentaje."],
  ["den", "número", "Denominador expandido: el universo del indicador."],
  ["ee", "número", "Error estándar de la proporción (0 a 1); vacío si no se pudo estimar, nunca cero."],
  ["casos", "entero", "Casos en la muestra sin expandir, para avisar cuando son menos de 30."],
];
display(tabla(COLS, [["Columna", (d) => codigo(d[0])], ["Tipo", (d) => d[1]], ["Qué guarda", (d) => d[2]]]));
```

<div class="texto-largo">

Cada archivo trae solo las columnas que usa, pero ninguna cambia de nombre. Con esta forma, agregar es siempre sumar `num` y `den` dentro del grupo y dividir al final; una tasa nunca se promedia. Los indicadores que la fuente publica ya calculados (la pobreza del CONEVAL) llevan `pct` en lugar de `num` y `den`, y no se pueden volver a agregar.

Las muestras se regeneran con `npm run datos` (`scripts/extraer_muestras.py`), que lee las tablas ya calculadas de los dos sitios de origen sin tocar microdatos.

</div>


## Descargas

```js
const descargas = [
  ["Catálogo de fuentes y filtros (JSON)", FileAttachment("data/catalogo.json")],
  ["Referencias de las fuentes (CSV)", FileAttachment("data/fuentes.csv")],
  ["Muestra ENIGH por decil (CSV)", FileAttachment("data/muestras/enigh_decil.csv")],
  ["Muestra ENDUTIH por edad (CSV)", FileAttachment("data/muestras/endutih_edad.csv")],
  ["Muestra Censo 2020 por entidad (CSV)", FileAttachment("data/muestras/censo2020_entidad.csv")],
];
display(html`<ul class="lista-descargas">${descargas.map(([t, f]) => html`<li><a href=${f.href} download=${f.name}>${t}</a></li>`)}</ul>`);
```
