/** Punto de entrada de la función de Vercel (se empaqueta con esbuild en build-vercel.mjs). */
import { nodeHandler } from './http';
import { getService } from './runtime';

export default nodeHandler(getService);
