/**
 * Build para Vercel con la Build Output API (v3): en un solo despliegue
 *   - el cliente estático (vite build) en .vercel/output/static
 *   - la API de correspondencia como función Node en .vercel/output/functions/api.func
 *
 * La función se empaqueta con esbuild (incluye @atomo/shared y pg) porque
 * Vercel no transpila los paquetes TypeScript del monorepo.
 * Uso: `npm run build:vercel` (es el buildCommand de vercel.json).
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const OUT = '.vercel/output';
rmSync(OUT, { recursive: true, force: true });

execSync('npm run build', { stdio: 'inherit' });
cpSync('dist', `${OUT}/static`, { recursive: true });

const fn = `${OUT}/functions/api.func`;
mkdirSync(fn, { recursive: true });
await build({
    entryPoints: ['server/src/async/vercel.ts'],
    outfile: `${fn}/index.mjs`,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    // pg-native es opcional y no se usa.
    external: ['pg-native'],
    banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
    logLevel: 'info',
});
writeFileSync(`${fn}/.vc-config.json`, JSON.stringify({
    runtime: 'nodejs22.x',
    handler: 'index.mjs',
    launcherType: 'Nodejs',
    shouldAddHelpers: false,
    maxDuration: 15,
}, null, 2));

writeFileSync(`${OUT}/config.json`, JSON.stringify({
    version: 3,
    routes: [
        { src: '^/api/(.*)$', dest: '/api?__path=$1' },
        { src: '^/assets/(.*)$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' },
    ],
}, null, 2));

console.log(`\nListo: ${OUT}`);
