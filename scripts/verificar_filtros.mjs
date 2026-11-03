// Cada control de cada panel de filtros tiene que cambiar lo que se dibuja.
//
// Para cada página: recorre los <select> de cada .panel-filtros, elige cada
// una de sus opciones y toma la "huella" de la figura de esa sección (las
// posiciones y rellenos de sus marcas, más el subtítulo). Un control cuyas
// opciones dejan la huella igual no filtra nada y se reporta; también se
// reporta una opción que deja la figura sin marcas.
//
// Uso:  npm run verificar:filtros
import {chromium} from "playwright-core";
import {servirEstatico} from "./servidor_estatico.mjs";
import path from "node:path";

const RAIZ = path.join(import.meta.dirname, "..", "dist");
const PUERTO = 8897;
const PAGINAS = ["/", "/fuentes/censo", "/fuentes/conteos-eic", "/fuentes/enigh", "/fuentes/enadis", "/fuentes/endutih", "/fuentes/endireh",
  "/fuentes/inali", "/fuentes/coneval", "/fuentes/conapo", "/fuentes/inpi"];

const servidor = await servirEstatico(RAIZ, PUERTO);
const navegador = await chromium.launch({channel: "msedge"});
const pagina = await navegador.newPage({viewport: {width: 1366, height: 900}});
let problemas = 0, controles = 0;
for (const ruta of PAGINAS) {
  await pagina.goto(`http://127.0.0.1:${PUERTO}${ruta}`, {waitUntil: "networkidle"});
  await pagina.waitForTimeout(400);
  const nSecciones = await pagina.locator(".seccion-analisis").count();
  for (let s = 0; s < nSecciones; s++) {
    const seccion = pagina.locator(".seccion-analisis").nth(s);
    const selects = seccion.locator(".panel-filtros select");
    const n = await selects.count();
    for (let i = 0; i < n; i++) {
      const sel = selects.nth(i);
      const nombre = await sel.evaluate((e) => e.closest("form")?.dataset.campo ?? e.id);
      const original = await sel.inputValue();
      const opciones = await sel.evaluate((e) => [...e.options].map((o) => o.value));
      const huellas = new Map();
      for (const op of opciones) {
        await sel.selectOption(op);
        await pagina.waitForTimeout(120);
        const h = await seccion.evaluate((e) => {
          const fig = e.querySelector("figure.grafica-tablero");
          // Figuras en HTML (la tabla de temas): la huella es su texto y el
          // número de celdas y chips que dibuja.
          if (!fig) {
            const otra = e.querySelector(".analisis-cuerpo figure");
            const piezas = otra ? otra.querySelectorAll("td, .fuente-chip").length : 0;
            return {n: piezas, firma: (otra?.textContent ?? "") + "|" + piezas};
          }
          const marcas = [...fig.querySelectorAll("svg [aria-label] > *")].filter((m) => !m.closest('[aria-label="tip"]'));
          const firma = marcas.map((m) => ["x", "y", "cx", "cy", "width", "height", "d", "fill", "x1", "x2"].map((a) => m.getAttribute(a) ?? "").join(",")).join(";");
          return {n: marcas.length, firma: (fig.querySelector(".grafica-sub")?.textContent ?? "") + "|" + firma};
        });
        if (h.n === 0) { console.log(`MAL ${ruta} sección ${s + 1} «${nombre}» = ${op}: la figura queda sin marcas`); problemas++; }
        huellas.set(op, h.firma);
      }
      await sel.selectOption(original);
      controles++;
      const distintas = new Set(huellas.values()).size;
      if (opciones.length > 1 && distintas < 2) { console.log(`MAL ${ruta} sección ${s + 1} «${nombre}»: ninguna opción cambia la figura`); problemas++; }
      else console.log(`ok  ${ruta.padEnd(22)} sección ${s + 1} «${nombre}»: ${distintas} huellas distintas en ${opciones.length} opciones`);
    }
  }
}
await navegador.close();
servidor.close();
console.log(problemas ? `\n${problemas} problemas en ${controles} controles` : `\n${controles} controles, todos cambian la figura`);
process.exit(problemas ? 1 : 0);
