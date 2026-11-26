/** Punto de entrada de la función de Vercel (se empaqueta con esbuild en build-vercel.mjs). */
import { nodeHandler } from './http';
import { getService, healthInfo, ConfigError } from './runtime';

export default nodeHandler(getService, { health: healthInfo, isConfigError: e => e instanceof ConfigError });
