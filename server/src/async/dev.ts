/**
 * Servidor local de la API de correspondencia (desarrollo).
 *   npm run api   → http://localhost:3001/api/...   (Vite le reenvía /api)
 */
import { createServer } from 'node:http';
import { nodeHandler } from './http';
import { getService, healthInfo, ConfigError } from './runtime';

const port = Number(process.env.API_PORT) || 3001;
createServer(nodeHandler(getService, { health: healthInfo, isConfigError: e => e instanceof ConfigError })).listen(port, () => console.log(`[api] Correspondencia escuchando en http://localhost:${port}/api`));
