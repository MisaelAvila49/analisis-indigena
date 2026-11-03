// Inventario de fuentes sobre población indígena: qué encuestas, censos,
// registros e indicadores hay, qué filtros de identificación y
// sociodemográficos tiene cada una, qué ya se analizó (en grupos-originarios
// y perdida-lengua) y qué falta. Una página por fuente, no por tema.
//
// Estilo y maquinaria heredados de perdida-lengua y jcf-stats-v2 (Social Data Ibero).
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ruta base del sitio. En GitHub Pages el tablero vive en /<repo>/; solo se
// usa en `base`: Framework reescribe por su cuenta las rutas de head/footer.
const BASE = process.env.GITHUB_ACTIONS
  ? "/" + process.env.GITHUB_REPOSITORY.split("/")[1] + "/"
  : "/";

// El logo del sidebar se inlina como texto SVG: Framework no reescribe rutas
// dentro de `home`, así que una ruta relativa se rompe bajo un subdirectorio.
const logoSidebar = fs.readFileSync(
  path.join(__dirname, "src/images/social_data_original.svg")
).toString("utf8");

const SITE_URL = process.env.GITHUB_ACTIONS
  ? `https://${process.env.GITHUB_REPOSITORY.split("/")[0]}.github.io${BASE}`
  : "http://localhost:3000/";
const TITULO_SITIO = "Fuentes de datos sobre población indígena";
const DESCRIPCION_SITIO = "Inventario del equipo de Ciencia de Datos de Social Data Ibero: qué fuentes sobre población indígena ya están analizadas, qué filtros de identificación y sociodemográficos están construidos y probados, qué da cada fuente y qué falta.";

// Una página por fuente. El orden y los grupos salen del estado de cada una
// en src/data/catalogo.json (con análisis, uso parcial, por analizar).
const FUENTES_NAV = {
  "Con análisis": [["Censo de Población y Vivienda", "censo"], ["Conteos y Encuesta Intercensal", "conteos-eic"], ["ENIGH", "enigh"], ["ENADIS", "enadis"], ["ENDUTIH", "endutih"], ["ENDIREH", "endireh"], ["INALI: lenguas y variantes", "inali"]],
  "Uso parcial": [["CONEVAL: pobreza", "coneval"], ["CONAPO: marginación", "conapo"], ["INPI: indicadores", "inpi"]],
  "Por analizar": [["ENSANUT", "ensanut"], ["Registros de salud", "registros-salud"], ["Formato 911 (SEP)", "formato-911"]],
};

// Descripción propia de cada página para buscadores y vistas previas. Va
// aquí y no en el front matter porque Framework descarta las claves que no
// conoce antes de pasar `data` a `head`.
const DESCRIPCIONES = {
  "/": DESCRIPCION_SITIO,
  "/esquema": "Cómo se describe cada fuente, cada filtro y cada tabla de resultados para llevar este inventario a IberoData.",
};

export default {
  title: TITULO_SITIO,
  root: "src",
  style: "custom-style.css",
  // Sustituye el globalStylesheets por omisión de Framework, que precarga
  // Source Serif 4 aunque la hoja no la use. Newsreader para la lectura y los
  // titulos; Schibsted Grotesk para la interfaz, los rotulos y las cifras.
  globalStylesheets: [
    "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..700&family=Schibsted+Grotesk:wght@400..800&display=swap",
  ],
  toc: {label: "En esta página"},
  search: true,

  interpreters: {
    ".py": ["uv", "run", "python", "-u"],
  },

  base: BASE,

  pages: [
    {name: "Inicio", path: "/"},
    ...Object.entries(FUENTES_NAV).map(([name, lista]) => ({
      name, open: true, pages: lista.map(([n, slug]) => ({name: n, path: `/fuentes/${slug}`})),
    })),
    {name: "Esquema de datos", path: "/esquema"},
  ],

  home: `<span class="sidebar-brand">
  <span class="sidebar-brand-logo" aria-hidden="true">${logoSidebar}</span>
  <span class="sidebar-brand-text">
    <span class="sidebar-brand-title">Fuentes sobre población indígena</span>
  </span>
</span>`,

  // `head` es función para recibir el título y la ruta de cada página. Todo
  // lo compartido (favicon, metadatos, tema, accesibilidad) vive aquí y lo
  // propio de cada página sale de DESCRIPCIONES por su ruta.
  head: ({title, path}) => {
    const ruta = path.replace(/\/index$/, "/");
    const descripcion = DESCRIPCIONES[ruta] ?? DESCRIPCION_SITIO;
    const tituloCompleto = title && title !== TITULO_SITIO ? `${title} | ${TITULO_SITIO}` : TITULO_SITIO;
    const url = SITE_URL.replace(/\/$/, "") + ruta;
    // Nombre nuevo de la imagen cuando cambia la portada: WhatsApp y otras redes
    // guardan en cache la vista previa por su direccion.
    const imagen = `${SITE_URL}images/social_data_original.svg`;
    return `<link rel="icon" href="/images/social_data_original.svg" type="image/svg+xml">
<meta name="theme-color" content="#c4101b">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<meta name="author" content="Social Data Ibero">
<meta name="description" content="${descripcion}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${TITULO_SITIO}">
<meta property="og:title" content="${tituloCompleto}">
<meta property="og:description" content="${descripcion}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${imagen}">
<meta property="og:locale" content="es_MX">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${tituloCompleto}">
<meta name="twitter:description" content="${descripcion}">
<meta name="twitter:image" content="${imagen}">
<script>
// Aplica el tema guardado ANTES de que el navegador pinte nada. El tablero es
// CLARO por omision, tambien para quien tenga el sistema en oscuro: el modo
// oscuro es una eleccion explicita del lector, no del sistema operativo.
(() => {
  // Idioma del documento: Framework no lo declara y es la primera regla de
  // WCAG que axe marca en cada pagina.
  document.documentElement.lang = "es";
  try {
    const guardado = localStorage.getItem("sdi-tema");
    if (guardado === "oscuro" || guardado === "claro") {
      document.documentElement.setAttribute("data-tema", guardado);
      return;
    }
  } catch (e) {
    // localStorage puede lanzar en modo privado; no hay preferencia guardada.
  }
  document.documentElement.setAttribute("data-tema", "claro");
})();
</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>
// Medicion de la cabecera del sidebar, enlace de salto, boton de tema y
// parches de accesibilidad sobre el chrome que Framework genera. Receta de
// la leccion 53 de la skill observableframework.
(() => {
  const medir = () => {
    const sidebar = document.querySelector("#observablehq-sidebar");
    if (sidebar && !sidebar.getAttribute("aria-label")) sidebar.setAttribute("aria-label", "Navegacion principal");
    const toc = document.querySelector("#observablehq-toc nav") ?? document.querySelector("#observablehq-toc");
    if (toc && !toc.getAttribute("aria-label")) toc.setAttribute("aria-label", "En esta pagina");
    const buscador = document.querySelector("#observablehq-search");
    if (!sidebar || !buscador) return;
    const alto = buscador.offsetTop + buscador.offsetHeight;
    sidebar.style.setProperty("--alto-cabecera", alto + "px");
  };
  const salto = () => {
    const main = document.querySelector("#observablehq-main");
    if (!main || document.querySelector(".saltar-contenido")) return;
    if (!main.id) main.id = "observablehq-main";
    const a = document.createElement("a");
    a.className = "saltar-contenido";
    a.href = "#observablehq-main";
    a.textContent = "Saltar al contenido";
    main.setAttribute("tabindex", "-1");
    document.body.insertBefore(a, document.body.firstChild);
  };
  const botonTema = () => {
    if (document.querySelector(".boton-tema")) return;
    const sidebar = document.querySelector("#observablehq-sidebar");
    // Sin sidebar (el mapa a pantalla completa) el boton va en la cabecera.
    const cabecera = document.querySelector(".mapa-cabecera");
    const marca = sidebar
      ? (sidebar.querySelector("li:has(.sidebar-brand)") ??
         sidebar.querySelector(".sidebar-brand")?.closest("li") ??
         sidebar.firstElementChild)
      : cabecera;
    if (!marca) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "boton-tema";
    const pintar = () => {
      const oscuro = document.documentElement.getAttribute("data-tema") === "oscuro";
      b.setAttribute("aria-pressed", String(oscuro));
      b.title = oscuro ? "Cambiar a fondo claro" : "Cambiar a fondo oscuro";
      b.innerHTML =
        '<span class="boton-tema-icono" aria-hidden="true">' +
        (oscuro
          ? '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 11.5A7.5 7.5 0 0 1 8.5 3a7.5 7.5 0 1 0 8.5 8.5z"/></svg>'
          : '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="3.6"/><path d="M10 1.6v2M10 16.4v2M18.4 10h-2M3.6 10h-2M15.9 4.1l-1.4 1.4M5.5 14.5l-1.4 1.4M15.9 15.9l-1.4-1.4M5.5 5.5 4.1 4.1"/></svg>') +
        "</span>" +
        '<span class="boton-tema-texto">' + (oscuro ? "Oscuro" : "Claro") + "</span>";
    };
    b.addEventListener("click", () => {
      const oscuro = document.documentElement.getAttribute("data-tema") === "oscuro";
      const nuevo = oscuro ? "claro" : "oscuro";
      document.documentElement.setAttribute("data-tema", nuevo);
      try { localStorage.setItem("sdi-tema", nuevo); } catch (e) { /* solo esta pestana */ }
      pintar();
      // Las graficas son SVG ya pintado: se avisa para que se redibujen.
      dispatchEvent(new CustomEvent("sdi:tema", {detail: {oscuro: !oscuro}}));
    });
    pintar();
    // <li> y no <div>: la marca vive dentro de un <ol>, que solo admite <li>.
    const caja = document.createElement(sidebar ? "li" : "span");
    caja.className = "boton-tema-caja";
    caja.appendChild(b);
    if (sidebar) marca.insertAdjacentElement("afterend", caja);
    else marca.appendChild(caja);
  };
  // Animaciones de una sola vez: la portada (y la primera grafica de cada
  // seccion) se anima la primera vez que entra en pantalla y luego queda
  // quieta en su estado final. Con prefers-reduced-motion el CSS no anima.
  let vigia = null;
  const animarAlEntrar = () => {
    if (!("IntersectionObserver" in window)) {
      for (const n of document.querySelectorAll(".portada-capitulo, .seccion-cuerpo, .beta-cuerpo")) n.classList.add("en-vista", "animada");
      return;
    }
    vigia ??= new IntersectionObserver((entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("en-vista");
        vigia.unobserve(e.target);
        // Despues de la primera pasada, los repintados por filtro ya no animan.
        setTimeout(() => e.target.classList.add("animada"), 1200);
      }
    }, {threshold: 0.15});
    for (const n of document.querySelectorAll(".portada-capitulo:not([data-vigia]), .seccion-cuerpo:not([data-vigia]), .beta-cuerpo:not([data-vigia])")) {
      n.setAttribute("data-vigia", "");
      vigia.observe(n);
    }
  };
  // Los tres desplegables de cada grafica van siempre en el mismo orden:
  // fuentes y verificacion, explicacion, tabla. Cada pagina los arma por su
  // cuenta; aqui se reordena cualquier tramo de desplegables vecinos.
  const ORDEN_DESPLEGABLES = ["explica-analisis", "verificado", "tabla-datos"];
  const rangoDesplegable = (n) => n.tagName === "DETAILS" ? ORDEN_DESPLEGABLES.findIndex((c) => n.classList.contains(c)) : -1;
  const ordenarDesplegables = () => {
    const padres = new Set([...document.querySelectorAll("#observablehq-main details.verificado, #observablehq-main details.explica-analisis, #observablehq-main details.tabla-datos")].map((d) => d.parentElement));
    for (const padre of padres) {
      const hijos = [...padre.children];
      for (let i = 0; i < hijos.length; i++) {
        if (rangoDesplegable(hijos[i]) < 0) continue;
        let j = i;
        while (j + 1 < hijos.length && rangoDesplegable(hijos[j + 1]) >= 0) j++;
        const tramo = hijos.slice(i, j + 1);
        const ordenado = [...tramo].sort((a, b) => rangoDesplegable(a) - rangoDesplegable(b));
        if (ordenado.some((n, k) => n !== tramo[k])) {
          const ancla = hijos[j + 1] ?? null;
          for (const n of ordenado) padre.insertBefore(n, ancla);
        }
        i = j;
      }
    }
  };
  // Globo con jerarquia. Plot dibuja el globo como texto de un solo estilo;
  // aqui se lee ese texto (renglones "Rotulo valor") y se muestra una tarjeta
  // HTML: la dimension y el grupo como rotulos chicos en gris, el grupo con la
  // muestra de color de su serie, la cifra principal grande y en negrita con
  // el color de la serie, y la poblacion en un renglon mas tenue. El globo de
  // Plot queda transparente debajo (sigue marcando la posicion).
  let tarjetaGlobo = null, ultimoRelleno = null, firmaGlobo = "", punteroGlobo = null;
  addEventListener("pointermove", (e) => { punteroGlobo = {x: e.clientX, y: e.clientY}; }, {passive: true});
  // Dentro de esta plantilla de texto las diagonales inversas van dobles.
  const NUMERO = /^[-+−]?[$]?\\d[\\d.,]*\\s*(%|M|mil|millones)?|\\d[\\d.,]*\\s*%/;
  const globoLegible = () => {
    const tips = [...document.querySelectorAll("#observablehq-main svg g[aria-label='tip']")].filter((g) => g.querySelector("text"));
    // El globo de la gráfica bajo el puntero; si no hay, el último que se
    // abrió. Tomar siempre el primero de la página mostraba el de otra
    // gráfica que se había quedado fijo, y el globo «no respondía».
    // Solo el globo de la grafica que esta bajo el puntero (por posicion, no
    // por :hover): caer al ultimo abierto mostraba el de otra grafica lejos.
    const bajo = (g) => { const r = g.closest("svg")?.getBoundingClientRect(); return r && punteroGlobo && punteroGlobo.x >= r.left && punteroGlobo.x <= r.right && punteroGlobo.y >= r.top && punteroGlobo.y <= r.bottom; };
    const tip = tips.find((g) => g.closest("svg")?.matches(":hover")) ?? tips.find(bajo) ?? null;
    if (!tip) { if (tarjetaGlobo) tarjetaGlobo.hidden = true; firmaGlobo = ""; return; }
    let renglones = [...tip.querySelectorAll("text > tspan")].map((r) => {
      const et = r.querySelector("tspan[font-weight]");
      const rotulo = (et?.textContent ?? "").trim();
      const valor = r.textContent.replace(/​/g, "").trim().slice(rotulo.length).trim();
      return {rotulo, valor};
    }).filter((r) => r.valor || r.rotulo);
    const path = tip.querySelector("path");
    const firma = JSON.stringify(renglones) + (path?.getAttribute("d") ?? "") + (tip.firstElementChild?.getAttribute("transform") ?? "");
    if (firma === firmaGlobo && tarjetaGlobo && !tarjetaGlobo.hidden) return;
    firmaGlobo = firma;
    if (!tarjetaGlobo) {
      tarjetaGlobo = document.createElement("div");
      tarjetaGlobo.className = "globo-tarjeta";
      tarjetaGlobo.setAttribute("aria-hidden", "true");
      document.body.appendChild(tarjetaGlobo);
    }
    const esNum = (v) => NUMERO.test(v);
    const grupo = renglones.find((r) => r.rotulo === "Grupo");
    // Rotulo que empieza con "=": bloque de cifra (la cifra grande y debajo
    // la frase que dice que es). Varios bloques se apilan, el primero mayor.
    const bloques = renglones.filter((r) => r.rotulo.startsWith("="));
    // Rotulo "~": una lectura en palabras que va justo debajo de la cifra.
    const lecturas = renglones.filter((r) => r.rotulo === "~");
    renglones = renglones.filter((r) => !bloques.includes(r) && !lecturas.includes(r));
    const numericos = renglones.filter((r) => r !== grupo && esNum(r.valor));
    const principal = bloques.length ? null : numericos.find((r) => r.valor.includes("%")) ?? numericos[0] ?? null;
    const secundarios = numericos.filter((r) => r !== principal);
    const refs = renglones.filter((r) => r !== grupo && r !== principal && !secundarios.includes(r));
    const colores = window.__sdiColores ?? {};
    const color = grupo ? colores[grupo.valor] : null;
    const muestra = color ?? ultimoRelleno;
    const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;"})[c]);
    tarjetaGlobo.innerHTML =
      refs.map((r) => '<span class="gt-ref">' + esc(r.valor || r.rotulo) + "</span>").join("") +
      (grupo ? '<span class="gt-grupo">' + (muestra ? '<i class="gt-muestra" style="background:' + esc(muestra) + '"></i>' : "") + esc(grupo.valor) + "</span>" : "") +
      (principal ? '<span class="gt-cifra"' + (color ? ' style="color:' + esc(color) + '"' : "") + ">" + esc(principal.valor) + "</span>" +
        '<span class="gt-que">' + esc(principal.rotulo) + "</span>" : "") +
      bloques.map((r, i) => '<span class="gt-cifra' + (i ? " gt-cifra2" : "") + '"' + (color && !i ? ' style="color:' + esc(color) + '"' : "") + ">" + esc(r.valor) + "</span>" + (r.rotulo.slice(1).trim() ? '<span class="gt-que">' + esc(r.rotulo.slice(1).trim()) + "</span>" : "")).join("") +
      lecturas.map((r) => '<span class="gt-que">' + esc(r.valor) + "</span>").join("") +
      secundarios.map((r) => '<span class="gt-pob">' + esc(r.rotulo) + " " + esc(r.valor) + "</span>").join("");
    tarjetaGlobo.classList.toggle("gt-con-color", Boolean(color));
    tarjetaGlobo.hidden = false;
    // Posicion: del lado en que Plot puso su globo, junto al punto de anclaje.
    const caja = path.getBoundingClientRect();
    const m = path.getScreenCTM();
    const ax = m ? m.e : caja.left, ay = m ? m.f : caja.top;
    const w = tarjetaGlobo.offsetWidth, h = tarjetaGlobo.offsetHeight;
    let x = caja.left >= ax - 1 ? ax - 8 : caja.right <= ax + 1 ? ax - w + 8 : ax - w / 2;
    let y = caja.top >= ay - 1 ? ay + 10 : ay - h - 10;
    x = Math.max(8, Math.min(innerWidth - w - 8, x));
    y = Math.max(8, Math.min(innerHeight - h - 8, y));
    tarjetaGlobo.style.left = x + scrollX + "px";
    tarjetaGlobo.style.top = y + scrollY + "px";
  };
  // El color de la marca bajo el puntero, para la muestra cuando el grupo no
  // es una serie conocida (una sola serie, ediciones, categorias).
  const recordarRelleno = (e) => {
    const t = e.target;
    if (!(t instanceof SVGElement) || !t.closest("#observablehq-main svg")) return;
    const f = t.getAttribute("fill") ?? t.parentElement?.getAttribute("fill");
    if (f && f !== "none" && !f.startsWith("url(") && f !== "currentColor") ultimoRelleno = f;
  };

  // Paneles de filtros compactos y pegajosos en todas las secciones. Al
  // quedar fijos arriba se compactan mas (solo los controles; los rotulos
  // siguen para el lector de pantalla). En el telefono el panel se abre con
  // un boton "Filtros".
  let vigiaPanel = null;
  let yEstable = scrollY;
  addEventListener("scroll", () => { yEstable = scrollY; }, {passive: true});
  const panelesCompactos = () => {
    // Centinela de alto cero justo antes del panel: el panel esta fijo
    // exactamente cuando el centinela sale por arriba de la ventana. Con el
    // panel mismo como objetivo, un salto largo no cruzaba ningun umbral.
    // Se vigila la SECCION con umbrales densos (cualquier desplazamiento
    // dentro de ella avisa) y se decide con la posicion del centinela: un
    // salto directo de abajo a arriba no pasa por "visible" y no avisaba.
    // Al compactarse, el panel NO cambia el flujo del documento: una reserva
    // justo despues de el toma el alto que el panel suelta. Sin eso, cerca del
    // final de la seccion el panel se compactaba, la seccion se acortaba y
    // salia de la ventana, el panel se soltaba, recuperaba su alto, la seccion
    // volvia a entrar y el panel se fijaba otra vez: la pagina temblaba sola.
    // La reserva se ajusta midiendo donde queda lo que sigue al panel. Con
    // alto deja de colapsar los margenes del panel y de lo que sigue (un salto
    // que puede ser mayor que lo que se compacta), asi que lleva 1 px de alto
    // fijo y el ajuste va en su margen superior, que puede ser negativo y es
    // lineal: tres pasadas lo dejan exacto.
    const posSiguiente = (panel) => {
      const sig = panel.reserva.nextElementSibling;
      const sec = panel.parentElement.getBoundingClientRect();
      return sig ? sig.getBoundingClientRect().top - sec.top : sec.height;
    };
    const fijar = (panel, pegar) => {
      if (panel.classList.contains("pegado") === pegar) return;
      const reserva = panel.reserva;
      if (!pegar) { panel.classList.remove("pegado"); reserva.style.height = "0px"; reserva.style.marginTop = "0px"; return; }
      const antes = posSiguiente(panel);
      panel.classList.add("pegado");
      reserva.style.height = "1px";
      let margen = 0;
      for (let i = 0; i < 3; i++) {
        margen += antes - posSiguiente(panel);
        reserva.style.marginTop = margen + "px";
      }
    };
    vigiaPanel ??= ("IntersectionObserver" in window) ? new IntersectionObserver((entradas) => {
      for (const e of entradas) for (const [panel, centinela] of e.target.panelesDentro ?? []) {
        fijar(panel, centinela.getBoundingClientRect().top < 0 && e.isIntersecting);
      }
    }, {threshold: Array.from({length: 41}, (_, i) => i / 40)}) : null;
    let n = 0;
    for (const panel of document.querySelectorAll("#observablehq-main .panel-filtros:not(.panel-mapa):not([data-compacto])")) {
      panel.setAttribute("data-compacto", "");
      if (!panel.id) panel.id = "panel-filtros-" + (++n) + "-" + Math.random().toString(36).slice(2, 7);
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "panel-boton";
      boton.setAttribute("aria-expanded", "false");
      boton.setAttribute("aria-controls", panel.id);
      boton.textContent = "Filtros";
      boton.addEventListener("click", () => {
        const abierto = panel.classList.toggle("abierto");
        boton.setAttribute("aria-expanded", String(abierto));
        boton.textContent = abierto ? "Cerrar filtros" : "Filtros";
      });
      panel.prepend(boton);
      // Al recibir el foco un control del panel fijo, el navegador lo "trae a
      // la vista" con la posicion que el panel tenia antes de fijarse y sube
      // la pantalla cientos de pixeles. Se devuelve a donde estaba.
      panel.addEventListener("focusin", () => {
        if (!panel.classList.contains("pegado")) return;
        const y = yEstable;
        requestAnimationFrame(() => { if (Math.abs(scrollY - y) > 40) scrollTo({top: y, behavior: "instant"}); });
      });
      const centinela = document.createElement("div");
      centinela.className = "panel-centinela";
      centinela.setAttribute("aria-hidden", "true");
      centinela.panel = panel;
      panel.before(centinela);
      const reserva = document.createElement("div");
      reserva.className = "panel-reserva";
      reserva.setAttribute("aria-hidden", "true");
      reserva.style.height = "0px";
      panel.after(reserva);
      panel.reserva = reserva;
      const seccion = panel.parentElement;
      seccion.panelesDentro ??= [];
      seccion.panelesDentro.push([panel, centinela]);
      vigiaPanel?.observe(seccion);
    }
  };

  const buscadorEnEspanol = () => {
    const input = document.querySelector("#observablehq-search input[type=search]");
    if (!input || input.placeholder === "Buscar") return;
    input.placeholder = "Buscar";
    input.setAttribute("aria-label", "Buscar en el sitio");
  };
  const accesibilidadChrome = () => {
    const sidebar = document.querySelector("#observablehq-sidebar");
    if (!sidebar) return;
    for (const t of sidebar.querySelectorAll("label[for='observablehq-sidebar-toggle']")) {
      if (t.textContent.trim()) continue;
      const s = document.createElement("span");
      s.className = "aviso-lector";
      s.textContent = "Ocultar el menu";
      t.appendChild(s);
    }
    const toggle = document.querySelector("#observablehq-sidebar-toggle");
    if (toggle && !toggle.getAttribute("aria-label")) toggle.setAttribute("aria-label", "Mostrar u ocultar el menu");
    for (const ol of sidebar.querySelectorAll("ol")) {
      for (const hijo of [...ol.children]) {
        if (!/^(LI|SCRIPT|TEMPLATE)$/.test(hijo.tagName)) {
          const li = document.createElement("li");
          li.className = "li-envoltorio";
          ol.insertBefore(li, hijo);
          li.appendChild(hijo);
        }
      }
    }
  };
  const accesibilidadFiguras = () => {
    // La esquina del mapa (resumen y leyenda) se desplaza en pantallas chicas:
    // tiene que poder enfocarse con el teclado y llevar nombre.
    for (const e of document.querySelectorAll(".mapa-esquina:not([tabindex])")) {
      e.tabIndex = 0;
      e.setAttribute("role", "region");
      e.setAttribute("aria-label", "Resumen y leyenda del mapa");
    }
    for (const g of document.querySelectorAll('#observablehq-main svg g[aria-label]:not([role])')) {
      g.setAttribute("role", "group");
    }
    for (const r of document.querySelectorAll('#observablehq-main svg rect[aria-label="frame"]')) {
      r.removeAttribute("aria-label");
    }
    for (const fig of document.querySelectorAll("#observablehq-main figure")) {
      // Plot envuelve el SVG en su propia figura cuando hay leyenda, sin h3:
      // el titulo se busca en la figura mas cercana que si lo tenga.
      const titulo = (fig.querySelector("h3") ?? fig.closest("figure:has(h3)")?.querySelector("h3"))?.textContent?.trim();
      for (const svg of fig.querySelectorAll("svg")) {
        // Un SVG que ya declara su rol con nombre (la lista de barras del
        // capitulo, role=list) se respeta: forzarlo a img deja huerfanos a
        // sus listitem.
        if (svg.getAttribute("role") && svg.getAttribute("aria-label")) continue;
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", titulo ? "Grafica: " + titulo : "Grafica");
      }
    }
  };
  // Portada de capitulo a todo lo ancho: mientras ocupa la parte de arriba
  // de la ventana, el indice de la derecha se oculta para no quedar encima
  // de la banda oscura. Sin escuchar el scroll: un IntersectionObserver.
  const portadaCapitulo = () => {
    const portada = document.querySelector(".portada-capitulo, .portada-cap");
    if (!portada || !("IntersectionObserver" in window)) return;
    new IntersectionObserver((entradas) => {
      for (const e of entradas) document.documentElement.classList.toggle("portada-a-la-vista", e.isIntersecting);
    }, {rootMargin: "0px 0px -62% 0px"}).observe(portada);
  };
  const arrancar = () => {
    portadaCapitulo();
    medir();
    salto();
    botonTema();
    animarAlEntrar();
    ordenarDesplegables();
    panelesCompactos();
    buscadorEnEspanol();
    accesibilidadChrome();
    accesibilidadFiguras();
    const main = document.querySelector("#observablehq-main");
    if (main && window.MutationObserver) {
      let pendiente = null;
      new MutationObserver(() => {
        // Sin espera: el reorden y el globo ocurren antes de que el navegador pinte.
        ordenarDesplegables();
        globoLegible();
        if (pendiente) return;
        pendiente = setTimeout(() => { pendiente = null; accesibilidadFiguras(); animarAlEntrar(); panelesCompactos(); }, 120);
      }).observe(main, {childList: true, subtree: true, characterData: true});
      main.addEventListener("pointerover", recordarRelleno);
    }
    const cabecera = document.querySelector("#observablehq-sidebar > ol:first-child");
    if (cabecera && window.ResizeObserver) new ResizeObserver(medir).observe(cabecera);
    addEventListener("resize", medir);
  };
  if (document.readyState === "loading") {
    addEventListener("DOMContentLoaded", arrancar);
  } else {
    arrancar();
  }
})();
</script>`;
  },

  // Sin header: su único enlace ya vive en el pie y en la marca del sidebar.

  footer: `<div class="book-footer">
  <div class="instituciones-fila">
    <span class="instituciones-eyebrow">Un proyecto de</span>
    <a class="instituciones-chip instituciones-chip--ibero" href="https://ibero.mx" target="_blank" rel="noopener"><img src="/images/ibero/ibero-logo-color.webp" alt="Universidad Iberoamericana Ciudad de México"></a>
    <a class="instituciones-chip instituciones-chip--sdie" href="https://socialdata.ibero.mx" target="_blank" rel="noopener"><img src="/images/social_data_original.svg" alt="Social Data Ibero"></a>
  </div>
  <div class="book-footer-grid">
    <div class="book-footer-col">
      <p class="book-footer-col-title">Explorar</p>
      <p class="book-footer-col-line"><a href="/">Inicio: estado de las fuentes</a></p>
      <p class="book-footer-col-line"><a href="https://socialdataibero.github.io/sectei-pueblos-indigenas/" target="_blank" rel="noopener">Poblaciones indígenas en México</a></p>
    </div>
    <div class="book-footer-col">
      <p class="book-footer-col-title">Datos y método</p>
      <p class="book-footer-col-line">Fuentes: INEGI, CONEVAL, CONAPO, INPI, INALI, INSP, SEP</p>
      <p class="book-footer-col-line"><a href="/esquema">Esquema de datos</a></p>
    </div>
    <div class="book-footer-col">
      <p class="book-footer-col-title">Contacto</p>
      <p class="book-footer-col-line">Equipo de Ciencia de Datos, Social Data Ibero</p>
      <p class="book-footer-col-line"><a href="https://socialdata.ibero.mx" target="_blank" rel="noopener">socialdata.ibero.mx</a></p>
    </div>
  </div>
  <div class="book-footer-bottom">
    <span>&copy; 2026 Social Data Ibero, Universidad Iberoamericana</span>
    <span class="book-footer-flujo">Para construir esta plataforma seguimos <a href="https://flujo-datos.plataformasparaelbiencomun.org/" target="_blank" rel="noopener">El flujo de los datos</a></span>
    <span class="book-footer-tech">Construido con <a href="https://observablehq.com/framework/" target="_blank" rel="noopener">Observable Framework</a></span>
  </div>
</div>`,
};
