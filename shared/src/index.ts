/**
 * @atomo/shared — núcleo del juego compartido entre cliente y servidor.
 *
 *  - Tipos y datos del juego (mapa, recursos, misiones, biomas).
 *  - game/state: forma del estado, estado inicial y saneadores.
 *  - engine: el motor AUTORITATIVO (lo ejecuta sólo el servidor):
 *      setup      → genera la partida
 *      commands   → valida y aplica los comandos de los jugadores
 *      view       → proyecta el estado que ve cada jugador
 *  El cliente usa los tipos, los datos y helpers de sólo lectura (rutas, etc.).
 */

export * from './gameTypes';
export * from './playerTypes';
export * from './productionTypes';
export * from './treatyTypes';
export * from './data/mapRegions';
export * from './data/mapData';
export * from './data/biomeData';
export * from './data/productionData';
export * from './data/missionData';
export * from './game/state';
export * from './engine/rng';
export * from './engine/ai';
export * from './engine/helpers';
export * from './engine/setup';
export * from './engine/combat';
export * from './engine/turn';
export * from './engine/treaties';
export * from './engine/actions';
export * from './engine/reconcile';
export * from './engine/commands';
export * from './engine/view';
