/**
 * @atomo/shared — núcleo del juego compartido entre cliente y servidor.
 *
 * Contiene los tipos del juego, los datos del mapa y el reducer PURO. En fases
 * siguientes se sumarán acá las reglas de validación y los tipos de Intent.
 */

export * from './gameTypes';
export * from './playerTypes';
export * from './productionTypes';
export * from './treatyTypes';
export * from './data/mapRegions';
export * from './game/reducer';
export * from './game/rules';
export * from './game/intents';
