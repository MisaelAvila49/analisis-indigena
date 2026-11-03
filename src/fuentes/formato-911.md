---
title: "Formato 911 (SEP)"
toc: true
---

```js
import {prepararPagina, cabecera, bloqueFiltros, bloquePendientes} from "../components/pagina.js";
const {cat} = prepararPagina({
  catalogo: await FileAttachment("../data/catalogo.json").json(),
  fuentes: await FileAttachment("../data/fuentes.csv").csv(),
  verificaciones: await FileAttachment("../data/verificaciones.csv").csv(),
  calculado: await FileAttachment("../data/calculado.csv").csv(),
});
const SLUG = "formato-911";
```

```js
display(cabecera(cat, SLUG));
```

## Filtros

```js
display(bloqueFiltros(cat, SLUG));
```

## Lo que falta para empezar

Esta fuente todavía no tiene datos procesados ni análisis. Los filtros de arriba salen del cuestionario o del descriptor de archivos, como se registraron en la bitácora.

```js
display(bloquePendientes(cat, SLUG));
```
