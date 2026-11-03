// Verificación de render del inventario en navegador real (dist/).
//
// Para cada página y cada tema: abre, baja hasta el final para que se dibuje
// todo, cuenta las marcas reales de Plot, recoge errores y avisos de consola
// (un id de fuentes.csv o de verificaciones.csv mal escrito solo avisa en
// consola), mide desborde horizontal y guarda una captura de página completa.
// Falla si una página con muestras dibuja menos marcas de las esperadas.
//
// Uso:  npm run verificar:render  [-- --capturas]   (capturas en scripts/capturas/)
import {chromium} from "playwright-core";
import {servirEstatico} from "./servidor_estatico.mjs";
import path from "node:path";
import fs from "node:fs";

const RAIZ = path.join(import.meta.dirname, "..", "dist");
const PUERTO = 8898;
const CAPTURAS = process.argv.includes("--capturas");
const DIR_CAP = path.join(import.meta.dirname, "capturas");
if (CAPTURAS) fs.mkdirSync(DIR_CAP, {recursive: true});

const MARCAS = 'g[aria-label="dot"] circle, g[aria-label="line"] path, g[aria-label="bar"] rect, g[aria-label="cell"] rect, g[aria-label="rule"] line';
const PAGINAS = [
  {ruta: "/", minimo: 60},
  {ruta: "/fuentes/censo", minimo: 100},
  {ruta: "/fuentes/conteos-eic", minimo: 60},
  {ruta: "/fuentes/enigh", minimo: 20},
  {ruta: "/fuentes/enadis", minimo: 10},
  {ruta: "/fuentes/endutih", minimo: 40},
  {ruta: "/fuentes/endireh", minimo: 15},
  {ruta: "/fuentes/inali", minimo: 15},
  {ruta: "/fuentes/coneval", minimo: 6},
  {ruta: "/fuentes/conapo", minimo: 10},
  {ruta: "/fuentes/inpi", minimo: 60},
  {ruta: "/fuentes/ensanut", minimo: 0},
  {ruta: "/fuentes/registros-salud", minimo: 0},
  {ruta: "/fuentes/formato-911", minimo: 0},
  {ruta: "/esquema", minimo: 0},
];
const ANCHOS = [{nombre: "1366", width: 1366, height: 768}, {nombre: "390", width: 390, height: 844}];

const servidor = await servirEstatico(RAIZ, PUERTO);
const navegador = await chromium.launch({channel: "msedge"});
let fallas = 0;
for (const tema of ["claro", "oscuro"]) {
  for (const vista of ANCHOS) {
    const contexto = await navegador.newContext({viewport: {width: vista.width, height: vista.height}, colorScheme: tema === "claro" ? "dark" : "light"});
    await contexto.addInitScript((t) => localStorage.setItem("sdi-tema", t), tema);
    for (const p of PAGINAS) {
      const pagina = await contexto.newPage();
      const avisos = [];
      pagina.on("console", (m) => { if (["error", "warning"].includes(m.type())) avisos.push(`${m.type()}: ${m.text()}`); });
      pagina.on("pageerror", (e) => avisos.push(`pageerror: ${e.message}`));
      await pagina.goto(`http://localhost:${PUERTO}${p.ruta}`, {waitUntil: "networkidle"});
      await pagina.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
        scrollTo(0, 0);
      });
      await pagina.waitForTimeout(500);
      const r = await pagina.evaluate((sel) => ({
        marcas: document.querySelectorAll(`#observablehq-main ${sel.split(", ").join(", #observablehq-main ")}`).length,
        figuras: document.querySelectorAll("#observablehq-main figure.grafica-tablero").length,
        desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        tema: document.documentElement.getAttribute("data-tema"),
        errores: [...document.querySelectorAll(".observablehq--error")].map((e) => e.textContent.slice(0, 160)),
      }), MARCAS);
      const ok = r.marcas >= p.minimo && !r.errores.length && r.desborde <= 1 && r.tema === tema;
      if (!ok) fallas++;
      if (!ok || avisos.length || vista.nombre === "1366") {
        console.log(`${ok ? "ok " : "MAL"} ${tema.padEnd(6)} ${vista.nombre.padEnd(4)} ${p.ruta.padEnd(24)} marcas ${String(r.marcas).padStart(4)} figuras ${r.figuras} desborde ${r.desborde}`);
        for (const e of r.errores) console.log(`      error de celda: ${e}`);
        for (const a of [...new Set(avisos)].slice(0, 6)) console.log(`      ${a.slice(0, 200)}`);
      }
      if (CAPTURAS) await pagina.screenshot({path: path.join(DIR_CAP, `${p.ruta === "/" ? "inicio" : p.ruta.split("/").pop()}-${tema}-${vista.nombre}.png`), fullPage: true});
      await pagina.close();
    }
    await contexto.close();
  }
}
await navegador.close();
servidor.close();
console.log(fallas ? `\n${fallas} revisiones con problemas` : "\nTodas las páginas dibujan, sin errores ni desborde.");
process.exit(fallas ? 1 : 0);
