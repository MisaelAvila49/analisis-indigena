---
title: "ENSANUT"
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloqueAnalisis, bloquePendientes} from "../components/pagina.js";
const {cat} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "ensanut";
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

## Lo que falta para empezar

<p class="intro-muestras">Esta fuente todavía no tiene datos procesados. Los filtros de arriba salen del cuestionario o del descriptor de archivos, como se registraron en la bitácora.</p>

```js
display(bloquePendientes(cat, SLUG));
```
