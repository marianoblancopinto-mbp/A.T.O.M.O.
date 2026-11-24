// Saca capturas de la UI en distintos estados. Uso: npx tsx shots.ts <prefijo>
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright/index.js');
import { Client } from 'colyseus.js';
import { getSpecialMissions } from './shared/src/index';
const OUT = '/tmp/claude-0/-home-user-A-T-O-M-O-/fb8e6579-e6b1-5b7e-9f9f-f86139556cd0/scratchpad/ui/' + (process.argv[2] || 'x');
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const errors: string[] = [];
const browser = await chromium.launch();
async function player(name: string, w = 1400, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  p.on('pageerror', (e: any) => errors.push(`[${name}] ${e.message}`));
  p.on('console', (m: any) => { if (m.type() === 'error') errors.push(`[${name}] ${m.text()}`); });
  p.on('dialog', (d: any) => d.dismiss());
  await p.goto('http://localhost:5173/');
  return p;
}
const shot = (p: any, n: string) => p.screenshot({ path: `${OUT}-${n}.png` });
const ana = await player('Ana');
await shot(ana, '00-inicio');
await ana.getByPlaceholder('TU NOMBRE DE GENERAL').fill('Ana');
await ana.getByText('CREAR NUEVA PARTIDA').click();
await ana.getByText('ID DE MISIÓN').waitFor();
const roomId = (await ana.getByText('ID DE MISIÓN').innerText()).split(':')[1].trim();
const beto = await player('Beto', 390, 844);
await beto.getByPlaceholder('TU NOMBRE DE GENERAL').fill('Beto');
await beto.getByPlaceholder('CÓDIGO DE PARTIDA').fill(roomId);
await beto.getByText('UNIRSE', { exact: true }).click();
await wait(800);
await shot(ana, '01-lobby');
await ana.getByText('INICIAR OPERACIÓN').click();
await wait(500);
const spec = await new Client('ws://localhost:2567').joinById(roomId, { playerName: 'obs' });
let pub: any = null; spec.onMessage('state', (s: any) => { pub = s; }); spec.onMessage('lobby', () => {});
await wait(1200);
await shot(ana, '02-preturno'); await shot(beto, '02-preturno-movil');
await ana.getByText('Producir suministros').click(); await wait(500);
await shot(ana, '03-inventario');
await ana.keyboard.press('Escape'); await wait(300);
for (const t of ['CERRAR [X]', 'Cerrar']) { const b = ana.getByRole('button', { name: t }).first(); if (await b.isVisible().catch(() => false)) { await b.click(); break; } }
await wait(300);
await ana.getByText('Estoy listo').click().catch(() => {}); await beto.getByText('Estoy listo').click().catch(() => {});
await wait(1200);
await shot(ana, '04-turno'); await shot(beto, '04-turno-movil');
// cerrar anuncios (clic en cualquier parte)
for (const p of [ana, beto]) { for (let i = 0; i < 3; i++) { if (await p.locator('.ui-announce').isVisible().catch(() => false)) { await p.locator('.ui-announce').click(); await wait(300); } } }
await shot(ana, '05-mapa');
// región con misión de Ana
const anaId = pub.players.find((p: any) => p.name === 'Ana').id;
const missions = getSpecialMissions(pub.proxyWarCountry);
const owned = Object.keys(pub.owners).filter(r => pub.owners[r] === anaId);
const m = missions.find(m => m.visibleFor.some(v => owned.includes(v)))!;
const region = m.visibleFor.find(v => owned.includes(v))!;
await ana.locator(`[id="${region}"]`).dispatchEvent('click'); await wait(500);
await shot(ana, '06-panel-region');
await ana.getByText(m.title).first().click().catch(() => {}); await wait(600);
await shot(ana, `07-mision-${m.id}`);
await ana.keyboard.press('Escape'); await wait(300);
await ana.getByText('INFO CONFIDENCIAL').click().catch(() => {}); await wait(600);
await shot(ana, '08-confidencial');
await ana.getByRole('button', { name: 'Construir silo' }).click().catch(() => {}); await wait(500);
await shot(ana, '09-silo');
const opt = ana.locator('.ui-option:not([disabled])').first(); await opt.click().catch(() => {}); await wait(300);
await shot(ana, '10-silo-base');
await ana.keyboard.press('Escape'); await wait(200); await ana.keyboard.press('Escape'); await wait(200);
await beto.locator('.ui-announce').click().catch(() => {});
await shot(beto, '11-movil-mapa');
await ana.getByText('FINALIZAR OPERACIÓN').click().catch(() => {}); await wait(800);
await shot(beto, '12-movil-turno');
console.log('mision', m.id, 'region', region, 'errores', errors);
await browser.close(); process.exit(0);
