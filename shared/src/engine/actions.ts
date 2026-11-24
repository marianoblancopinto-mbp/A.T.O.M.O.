/**
 * Acciones de un jugador fuera del combate: misiones especiales, carrera
 * nuclear y espionaje. Cada una valida en el servidor los requisitos que antes
 * sólo chequeaba la UI (control de países, cartas, rutas, suministros) y
 * consume/crea las cartas del lado del servidor.
 */

import type { GameState } from '../game/state';
import type { PlayerData, SpecialCard, EspionageReport } from '../playerTypes';
import type { RawMaterialType, SupplyType, TerritoryCard } from '../productionTypes';
import { REGIONS } from '../data/mapRegions';
import { WAR_SECRETS_RESOURCES } from '../data/productionData';
import { makeId } from './rng';
import {
    fail, ok, sameId, getPlayer, owns, isRegion, regionTitle, checkCards, consumeCards, notify,
    pickSupplies, removeSupplies, updatePlayer, hasRoute, availableCards,
    type CardRequirement, type EngineContext, type EngineResult,
} from './helpers';

const TECH = 'technology' as const;
const RAW = 'rawMaterial' as const;

function activePlayer(state: GameState, actorId: unknown): PlayerData | string {
    if (state.winner || state.gameOver) return 'La partida terminó.';
    const p = getPlayer(state, actorId);
    if (!p || p.isEliminated) return 'Jugador inválido.';
    return p;
}

function card(ctx: EngineContext, type: SpecialCard['type'], name: string, originCountry: string, description: string): SpecialCard {
    return { id: makeId('special', ctx.random), type, name, originCountry, description, createdAt: ctx.now };
}

function addSpecial(state: GameState, playerId: unknown, c: SpecialCard, extra: Partial<PlayerData> = {}): GameState {
    return updatePlayer(state, playerId, p => ({ ...p, ...extra, specialCards: [...p.specialCards, c] }));
}

function addMission(state: GameState, playerId: unknown, id: string, baseRegionId: string, ctx: EngineContext): GameState {
    return updatePlayer(state, playerId, p => ({ ...p, activeSpecialMissions: [...p.activeSpecialMissions, { id, baseRegionId, startTime: ctx.now }] }));
}

// ============================================================================
// Misiones especiales
// ============================================================================

export interface MissionInput {
    missionId?: unknown;
    baseRegionId?: unknown;
    techIds?: unknown;
    rawIds?: unknown;
    supplyIds?: unknown;
    cityName?: unknown;
    agency?: unknown;
    resourceType?: unknown;
}

/** Misiones de combate que se pagan con suministros (bonus de Infantería/Aéreo). */
const SUPPLY_MISSIONS: Record<string, {
    base: string; supplies: SupplyType[]; routeSupplies: boolean; type: SpecialCard['type']; name: string; description: string;
    flag?: keyof PlayerData; title: string; message: string; color: string;
}> = {
    cruce_andes: { base: 'argentina', supplies: ['food'], routeSupplies: false, type: 'CRUCE_ANDES', name: 'CRUCE DE LOS ANDES', description: 'Bonus +1 Infantería atacando Chile desde Argentina (1 turno).',
        title: 'CRUCE DE LOS ANDES', message: 'Los preparativos para CRUCE DE LOS ANDES ya están en marcha. Las tropas esperan sus ordenes.', color: '#aaff00' },
    alejandro_magno: { base: 'grecia', supplies: ['food', 'manufacture', 'energy'], routeSupplies: true, type: 'ALEJANDRO_MAGNO', name: 'OPERACIÓN ALEJANDRO MAGNO', description: 'Bonus +1 Infantería y paso libre Grecia-Turquía.', flag: 'alejandroMagnoActive',
        title: 'ALEJANDRO MAGNO', message: 'El espíritu del conquistador macedonio renace. Las rutas hacia Oriente están abiertas. +1 Infantería atacando entre países involucrados.', color: '#00aaff' },
    legado_otomano: { base: 'turquia', supplies: ['food', 'manufacture', 'energy'], routeSupplies: true, type: 'LEGADO_OTOMANO', name: 'OPERACIÓN LEGADO OTOMANO', description: 'Bonus +1 Infantería en Turquía, Egipto, Arabia y Grecia.', flag: 'legadoOtomanoActive',
        title: 'LEGADO OTOMANO', message: 'La gloria del imperio se restaura. +1 Infantería atacando entre países involucrados.', color: '#00ccff' },
    gengis_khan: { base: 'mongolia', supplies: ['food', 'manufacture', 'energy'], routeSupplies: true, type: 'GENGIS_KHAN', name: 'OPERACIÓN GENGIS KHAN', description: 'Bonus +1 Infantería en Mongolia, Kazajistán, China y Rusia.', flag: 'gengisKhanActive',
        title: 'RUGIDO DE GENGIS KHAN', message: 'La horda ha sido movilizada. El terror de las estepas asegura tu dominio sobre Asia Central. +1 Infantería atacando entre países involucrados.', color: '#ff4444' },
    bolivar: { base: 'venezuela', supplies: ['food', 'manufacture', 'energy'], routeSupplies: true, type: 'BOLIVAR', name: 'OPERACIÓN BOLÍVAR', description: 'Bonus +1 Infantería en Venezuela, Colombia, Panamá y Perú.', flag: 'bolivarActive',
        title: 'OPERACIÓN BOLÍVAR', message: 'El sueño del Libertador renace. La unión de los pueblos del Cono Norte asegura nuestra soberanía. +1 Infantería atacando entre países involucrados.', color: '#ffcc00' },
    fuego_del_pacifico: { base: 'japon', supplies: ['food', 'manufacture', 'energy'], routeSupplies: true, type: 'PACIFIC_FIRE', name: 'FUEGO DEL PACÍFICO', description: 'Bonus +1 Fuerza Aérea en Japón, Corea, Kamchatka y Filipinas.', flag: 'pacificFireActive',
        title: 'FUEGO DEL PACÍFICO', message: 'Dominio aéreo establecido. El Mar de Japón está bajo nuestra protección táctica. +1 Fuerza Aérea en países involucrados.', color: '#00ffff' },
};

const asIds = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function activateMission(state: GameState, actorId: unknown, input: MissionInput, ctx: EngineContext): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    const id = input.missionId;
    const techIds = asIds(input.techIds);
    const rawIds = asIds(input.rawIds);

    // --- Misiones pagadas con suministros ---
    if (typeof id === 'string' && SUPPLY_MISSIONS[id]) {
        const m = SUPPLY_MISSIONS[id];
        if (!owns(state, me.id, m.base)) return fail(`Necesitás controlar ${regionTitle(m.base)}.`);
        if (me.specialCards.some(c => c.type === m.type)) return fail('Esa misión ya está activa.');
        const supplies = pickSupplies(me, input.supplyIds, m.supplies);
        if (typeof supplies === 'string') return fail(supplies);
        if (m.routeSupplies && supplies.some(x => !hasRoute(state, me.id, x.originCountry, m.base))) {
            return fail(`Los suministros deben tener ruta hasta ${regionTitle(m.base)}.`);
        }
        let next = updatePlayer(state, me.id, p => removeSupplies(p, supplies.map(s => s.id)));
        next = addSpecial(next, me.id, card(ctx, m.type, m.name, m.base, m.description), m.flag ? { [m.flag]: true } : {});
        return ok(notify(next, { type: 'SECONDARY_MISSION', missionId: id, title: m.title, message: m.message, color: m.color, playerName: me.name }));
    }

    switch (id) {
        case 'desembarco_normandia': {
            if (!owns(state, me.id, 'reino_unido')) return fail('Necesitás controlar Reino Unido.');
            const fr = state.owners['francia'], de = state.owners['alemania'];
            if (fr == null || !sameId(fr, de) || sameId(fr, me.id)) return fail('Francia y Alemania deben pertenecer al mismo enemigo.');
            if (me.specialCards.some(c => c.type === 'NORMANDY_LANDING')) return fail('Esa misión ya está activa.');
            const err = checkCards(state, me.id, [
                { id: techIds[0], category: TECH, type: 'INDUSTRIA_PESADA' },
                { id: rawIds[0], category: RAW, type: 'HIERRO', routeTo: 'reino_unido' },
            ]);
            if (err) return fail(err);
            let next = consumeCards(state, me.id, [techIds[0], rawIds[0]] as string[]);
            next = addSpecial(next, me.id, card(ctx, 'NORMANDY_LANDING', 'DESEMBARCO DE NORMANDÍA', 'reino_unido', 'Bonus +1 Artillería y +2 Infantería al atacar Francia desde UK (1 turno).'));
            return ok(notify(next, { type: 'SECONDARY_MISSION', title: 'DESEMBARCO DE NORMANDÍA', message: 'La invasión ha comenzado. Las fuerzas aliadas han desembarcado en las playas de Francia.', color: '#00aaff', playerName: me.name }));
        }
        case 'refundacion_estanbul': {
            if (!owns(state, me.id, 'turquia') || !owns(state, me.id, 'grecia')) return fail('Necesitás controlar Turquía y Grecia.');
            if (me.specialCards.some(c => c.type === 'PUENTE_BOSFORO')) return fail('Esa misión ya está activa.');
            const city = typeof input.cityName === 'string' ? input.cityName.trim().slice(0, 40) : '';
            if (!city) return fail('Elegí un nombre para la ciudad.');
            const err = checkCards(state, me.id, [
                { id: techIds[0], category: TECH, type: 'INDUSTRIA_PESADA' },
                { id: rawIds[0], category: RAW, type: 'HIERRO' },
            ]);
            if (err) return fail(err);
            let next = consumeCards(state, me.id, [techIds[0], rawIds[0]] as string[]);
            next = addSpecial(next, me.id, card(ctx, 'PUENTE_BOSFORO', `PUENTE DE ${city.toUpperCase()}`, 'turquia', `Conexión terrestre permanente entre Grecia y Turquía. La ciudad ha sido refundada como ${city}.`));
            next = addMission(next, me.id, 'refundacion_estanbul', 'turquia', ctx);
            return ok(notify(next, { type: 'SECONDARY_MISSION', title: 'BÓSFORO REUNIFICADO', message: `Se ha establecido el Puente del Bósforo. La ciudad ha sido refundada como ${city} y Europa y Asia vuelven a estar conectadas.`, color: '#ff9100', playerName: me.name }));
        }
        case 'ruta_antartica':
        case 'golden_dome': {
            const isAnt = id === 'ruta_antartica';
            const required = isAnt ? ['chile', 'argentina', 'australia', 'sudafrica'] : ['nueva_york', 'california', 'texas', 'flordia', 'alaska'];
            if (!required.every(r => owns(state, me.id, r))) return fail('Necesitás controlar todos los países de la misión.');
            if (me.activeSpecialMissions.some(m => m.id === id)) return fail('Esa misión ya está activa.');
            const base = input.baseRegionId;
            if (typeof base !== 'string' || !required.includes(base)) return fail('Base de operaciones inválida.');
            const reqs: CardRequirement[] = isAnt
                ? [{ id: techIds[0], category: TECH, type: 'INDUSTRIA_PESADA' }, { id: techIds[1], category: TECH, type: 'INDUSTRIA_ELECTRONICA' },
                   { id: rawIds[0], category: RAW, type: 'HIERRO' }, { id: rawIds[1], category: RAW, type: 'CONDUCTORES_SEMICONDUCTORES' }]
                : [{ id: techIds[0], category: TECH, type: 'INDUSTRIA_LIGERA' }, { id: techIds[1], category: TECH, type: 'INDUSTRIA_ELECTRONICA' },
                   { id: rawIds[0], category: RAW, type: 'ALUMINIO' }, { id: rawIds[1], category: RAW, type: 'CONDUCTORES_SEMICONDUCTORES' }];
            const err = checkCards(state, me.id, reqs);
            if (err) return fail(err);
            let next = consumeCards(state, me.id, reqs.map(r => r.id as string));
            next = isAnt
                ? addSpecial(next, me.id, card(ctx, 'SECONDARY_MISSION', 'RUTA ANTÁRTICA', base, 'Ruta comercial antártica establecida. Genera bonificaciones pasivas.'))
                : addSpecial(next, me.id, card(ctx, 'SECONDARY_MISSION', 'CÚPULA DORADA', base, 'Sistema de defensa aérea hemisférica activo.'));
            next = addMission(next, me.id, id, base, ctx);
            return ok(notify(next, {
                type: 'SECONDARY_MISSION',
                title: isAnt ? 'RUTA ANTÁRTICA ESTABLECIDA' : 'CÚPULA DORADA ACTIVADA',
                message: isAnt ? 'Se ha asegurado el dominio del Océano Antártico. La ruta de suministros está operativa.' : 'El sistema de defensa aérea de América del Norte está operativo.',
                color: '#00ffff',
                playerName: me.name,
            }));
        }
        case 'planta_desalinizacion': {
            const base = input.baseRegionId;
            if (typeof base !== 'string' || !['espana', 'marruecos', 'arabia', 'chile', 'california'].includes(base)) return fail('País inválido para la planta.');
            if (!owns(state, me.id, base)) return fail(`Necesitás controlar ${regionTitle(base)}.`);
            if (me.inventory.rawMaterials.some(c => c.type === 'AGUA_DULCE' && c.country === base)) return fail('Ya hay una planta en ese país.');
            const supplies = pickSupplies(me, input.supplyIds, ['energy']);
            if (typeof supplies === 'string') return fail(supplies);
            if (!hasRoute(state, me.id, supplies[0].originCountry, base)) return fail('No hay ruta de suministro para esa energía.');
            const water: TerritoryCard = { id: makeId(`desalinization-${base}`, ctx.random), type: 'AGUA_DULCE', category: 'rawMaterial', country: base, usedThisTurn: false, isDesalinizationPlant: true };
            let next = updatePlayer(state, me.id, p => {
                const q = removeSupplies(p, [supplies[0].id]);
                return { ...q, inventory: { ...q.inventory, rawMaterials: [...q.inventory.rawMaterials, water] } };
            });
            next = addSpecial(next, me.id, card(ctx, 'PLANTA_DESALINIZADORA', 'PLANTA DESALINIZADORA', base, `Planta de desalinización operativa en ${regionTitle(base)}. Genera AGUA DULCE.`));
            return ok(notify(next, { type: 'SECONDARY_MISSION', title: 'PLANTA DESALINIZADORA', message: `Planta de desalinización construida en ${regionTitle(base)}. Producción de AGUA DULCE iniciada.`, color: '#00aaff', playerName: me.name }));
        }
        case 'energia_geotermica': {
            const base = input.baseRegionId;
            if (typeof base !== 'string' || !['islandia', 'filipinas'].includes(base)) return fail('País inválido para la planta geotérmica.');
            if (!owns(state, me.id, base)) return fail(`Necesitás controlar ${regionTitle(base)}.`);
            if (me.specialCards.some(c => c.type === 'PLANTA_GEOTERMICA' && c.originCountry === base)) return fail('Ya hay una planta geotérmica en ese país.');
            const err = checkCards(state, me.id, [
                { id: techIds[0], category: TECH, type: 'INDUSTRIA_PESADA' },
                { id: rawIds[0], category: RAW, type: 'HIERRO', routeTo: base },
            ]);
            if (err) return fail(err);
            let next = consumeCards(state, me.id, [techIds[0], rawIds[0]] as string[]);
            next = updatePlayer(next, me.id, p => ({ ...p, supplies: { ...p.supplies, energy: [...p.supplies.energy, { id: makeId('energy-geo', ctx.random), type: 'energy', originCountry: base }] } }));
            next = addSpecial(next, me.id, card(ctx, 'PLANTA_GEOTERMICA', 'PLANTA GEOTÉRMICA', base, 'Genera 1 suministro de Energía al inicio de cada turno.'));
            return ok(notify(next, { type: 'SECONDARY_MISSION', title: 'ENERGÍA GEOTÉRMICA', message: `Planta geotérmica operativa en ${regionTitle(base)}. Se ha generado 1 unidad de Energía.`, color: '#ff4400', playerName: me.name }));
        }
        case 'secretos_guerra': {
            const proxyId = REGIONS.find(r => r.title === state.proxyWarCountry)?.id;
            if (!proxyId || !owns(state, me.id, proxyId)) return fail('Necesitás controlar el país de la Guerra Proxy.');
            if (me.activeSpecialMissions.some(m => m.id === 'secretos_guerra')) return fail('Esa misión ya está activa.');
            const agency = input.agency;
            if (agency !== 'CIA' && agency !== 'MSS') return fail('Agencia inválida.');
            const hq = agency === 'CIA' ? 'nueva_york' : 'china';
            const spy = me.specialCards.find(c => c.type === 'ESPIONAJE' && c.originCountry === hq);
            if (!spy) return fail('No tenés la red de espionaje requerida.');
            const resourceType = input.resourceType as RawMaterialType;
            if (!WAR_SECRETS_RESOURCES.some(r => r.type === resourceType)) return fail('Recurso inválido.');
            const raw: TerritoryCard = { id: makeId('secret_resource', ctx.random), type: resourceType, category: 'rawMaterial', country: proxyId, usedThisTurn: false };
            let next = updatePlayer(state, me.id, p => ({
                ...p,
                specialCards: [...p.specialCards.filter(c => c.id !== spy.id), card(ctx, 'SECRETOS_GUERRA', `SECRETOS DE ${state.proxyWarCountry.toUpperCase()}`, proxyId,
                    `Operación de inteligencia exitosa en ${state.proxyWarCountry}. Recursos asegurados: ${WAR_SECRETS_RESOURCES.find(r => r.type === resourceType)?.label}.`)],
                inventory: { ...p.inventory, rawMaterials: [...p.inventory.rawMaterials, raw] },
                secretWarData: [...p.secretWarData, { countryId: proxyId, resourceType, agency, isActive: true }],
            }));
            next = addMission(next, me.id, 'secretos_guerra', proxyId, ctx);
            return ok(notify(next, { type: 'ESPIONAJE', title: 'SECRETOS REVELADOS', message: `La operación ha sido un éxito. Hemos asegurado el control de los recursos ocultos en ${state.proxyWarCountry}.`, color: '#00ffff', playerName: me.name, targetPlayerId: me.id }));
        }
        default:
            return fail('Misión desconocida.');
    }
}

/** Al terminar el turno se consumen los bonus de "1 turno" (Cruce de los Andes, Normandía). */
export function expireTurnBonuses(state: GameState, playerId: unknown): GameState {
    return updatePlayer(state, playerId, p => ({
        ...p,
        crossingAndesActive: false,
        normandyLandingActive: false,
        specialCards: p.specialCards.filter(c => c.type !== 'CRUCE_ANDES' && c.type !== 'NORMANDY_LANDING'),
    }));
}

// ============================================================================
// Carrera nuclear
// ============================================================================

export const DESIGN_NAME = 'DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES';
export const SILO_NAME = 'SILO DE LANZAMIENTO';

export function generateNuclearDesign(state: GameState, actorId: unknown, regionId: unknown, techId: unknown, rawId: unknown, ctx: EngineContext): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    if (!isRegion(regionId) || !owns(state, me.id, regionId)) return fail('Tenés que controlar el país.');
    if (!state.regionResources?.nuclearWarCapable.includes(regionId)) return fail('Ese país no tiene capacidad nuclear bélica.');
    if (me.specialCards.some(c => c.name === DESIGN_NAME && c.originCountry === regionId)) return fail('Ya tenés un diseño en ese país.');
    const err = checkCards(state, me.id, [
        { id: techId, category: TECH, type: 'INDUSTRIA_ELECTRONICA' },
        { id: rawId, category: RAW, type: 'CONDUCTORES_SEMICONDUCTORES', routeTo: regionId },
    ]);
    if (err) return fail(err);
    let next = consumeCards(state, me.id, [techId, rawId] as string[]);
    next = addSpecial(next, me.id, card(ctx, 'NUCLEAR_WEAPON', DESIGN_NAME, regionId, 'Capacidad de ataque nuclear global mientras se controle el territorio.'));
    return ok(notify(next, { type: 'NUCLEAR_DESIGN', title: 'DISEÑO COMPLETADO', message: `Los archivos de diseño en ${regionTitle(regionId)} han sido recuperados y procesados.`, color: '#ff9100' }));
}

export function extractMineral(state: GameState, actorId: unknown, regionId: unknown, ids: { techId?: unknown; ironId?: unknown; waterId?: unknown }, ctx: EngineContext): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    if (!isRegion(regionId) || regionId !== me.secretMineralLocation) return fail('Ese no es el yacimiento de tu mineral secreto.');
    if (!owns(state, me.id, regionId)) return fail('Tenés que controlar el país del yacimiento.');
    if (me.specialCards.some(c => c.type === 'SECRET_MINERAL')) return fail('Ya extrajiste tu mineral secreto.');
    const err = checkCards(state, me.id, [
        { id: ids.techId, category: TECH, type: 'INDUSTRIA_PESADA' },
        { id: ids.ironId, category: RAW, type: 'HIERRO', routeTo: regionId },
        { id: ids.waterId, category: RAW, type: 'AGUA_DULCE', routeTo: regionId },
    ]);
    if (err) return fail(err);
    let next = consumeCards(state, me.id, [ids.techId, ids.ironId, ids.waterId] as string[]);
    next = addSpecial(next, me.id, card(ctx, 'SECRET_MINERAL', 'MINERAL SECRETO', regionId, 'Recurso estratégico extraído mediante minería avanzada.'));
    // Privado: anunciarlo revelaría dónde está el yacimiento.
    return ok(notify(next, { type: 'SECONDARY_MISSION', title: 'EXTRACCIÓN DE MINERAL', message: `Se ha extraído Mineral Secreto en ${regionTitle(regionId)}.`, color: '#00ffff', targetPlayerId: me.id }));
}

export function constructSilo(state: GameState, actorId: unknown, regionId: unknown, ids: Record<string, unknown>, ctx: EngineContext): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    if (!isRegion(regionId) || !owns(state, me.id, regionId)) return fail('Tenés que controlar el país.');
    if (me.silos.includes(regionId)) return fail('Ya hay un silo en ese país.');
    const reqs: CardRequirement[] = [
        { id: ids.techLightId, category: TECH, type: 'INDUSTRIA_LIGERA' },
        { id: ids.techHeavyId, category: TECH, type: 'INDUSTRIA_PESADA' },
        { id: ids.techElecId, category: TECH, type: 'INDUSTRIA_ELECTRONICA' },
        { id: ids.ironId, category: RAW, type: 'HIERRO', routeTo: regionId },
        { id: ids.alumId, category: RAW, type: 'ALUMINIO', routeTo: regionId },
        { id: ids.semiId, category: RAW, type: 'CONDUCTORES_SEMICONDUCTORES', routeTo: regionId },
    ];
    const err = checkCards(state, me.id, reqs);
    if (err) return fail(err);
    let next = consumeCards(state, me.id, reqs.map(r => r.id as string));
    next = updatePlayer(next, me.id, p => ({
        ...p,
        silos: [...p.silos, regionId],
        siloStatus: { ...p.siloStatus, [regionId]: { status: 'construction', turnsRemaining: 2 } },
        specialCards: [...p.specialCards, card(ctx, 'NUCLEAR_WEAPON', SILO_NAME, regionId, 'Silo para lanzamiento de misiles intercontinentales.')],
    }));
    return ok(notify(next, { type: 'SECONDARY_MISSION', title: 'CONSTRUCCIÓN DE SILO', message: `Se ha iniciado la construcción de un Silo de Lanzamiento en ${regionTitle(regionId)}.`, color: '#ff9100', targetPlayerId: me.id }));
}

export function assignSiloFuel(state: GameState, actorId: unknown, siloId: unknown, fuelCardId: unknown): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    if (typeof siloId !== 'string' || !me.silos.includes(siloId)) return fail('Ese silo no es tuyo.');
    if (me.siloStatus[siloId]?.status === 'construction') return fail('El silo todavía está en construcción.');
    const err = checkCards(state, me.id, [{ id: fuelCardId, category: RAW, type: 'COMBUSTIBLE_NUCLEAR', routeTo: siloId }]);
    if (err) return fail(err);
    return ok(updatePlayer(state, me.id, p => ({ ...p, siloFuelCards: { ...p.siloFuelCards, [siloId]: fuelCardId as string } })));
}

export function initiateDeployment(state: GameState, actorId: unknown, siloId: unknown): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    if (typeof siloId !== 'string' || !me.silos.includes(siloId) || !owns(state, me.id, siloId)) return fail('Ese silo no es tuyo.');
    if (me.siloStatus[siloId]?.status !== 'active') return fail('El silo no está operativo.');
    if (me.usedNuclearSilos?.includes(siloId)) return fail('Este silo ya realizó un lanzamiento este turno.');
    if (!me.specialCards.some(c => c.name === DESIGN_NAME)) return fail('Falta el Diseño de Armas Nucleares.');
    const mineral = me.specialCards.find(c => c.type === 'SECRET_MINERAL');
    if (!mineral) return fail('Falta extraer el Mineral Secreto.');
    if (!hasRoute(state, me.id, mineral.originCountry, siloId)) return fail(`Ruta de Mineral Secreto interrumpida hacia el silo en ${regionTitle(siloId)}.`);
    const fuelId = me.siloFuelCards?.[siloId];
    if (!fuelId) return fail('No se ha asignado combustible nuclear al silo.');
    const fuel = availableCards(state, me.id).rawMaterials.find(c => c.id === fuelId);
    if (!fuel) return fail('El combustible asignado ya no está a tu disposición.');
    if (fuel.usedThisTurn) return fail('El combustible nuclear ya fue consumido esta ronda.');
    if (!hasRoute(state, me.id, fuel.country, siloId)) return fail(`Ruta de combustible interrumpida desde ${regionTitle(fuel.country)} hacia el silo.`);

    let next = consumeCards(state, me.id, [fuelId]);
    next = updatePlayer(next, me.id, p => ({ ...p, nuclearDeploymentActive: true, usedNuclearSilos: [...(p.usedNuclearSilos ?? []), siloId] }));
    return ok(notify(next, { type: 'NUCLEAR_ALERT', title: '☢️ ALERTA GLOBAL ☢️', message: 'PROCESO DE DESPLIEGUE NUCLEAR INICIADO. El mundo entra en estado de Defcon 1.', color: '#ff0000' }));
}

// ============================================================================
// Espionaje
// ============================================================================

export const ESPIONAGE_HQS = ['nueva_york', 'reino_unido', 'china', 'rusia'];

export function createEspionageNetwork(state: GameState, actorId: unknown, hqId: unknown, techId: unknown, semiId: unknown, ctx: EngineContext): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    if (typeof hqId !== 'string' || !ESPIONAGE_HQS.includes(hqId) || !owns(state, me.id, hqId)) return fail('Necesitás controlar una sede de inteligencia.');
    const err = checkCards(state, me.id, [
        { id: techId, category: TECH, type: 'INDUSTRIA_ELECTRONICA' },
        { id: semiId, category: RAW, type: 'CONDUCTORES_SEMICONDUCTORES', routeTo: hqId },
    ]);
    if (err) return fail(err);
    let next = consumeCards(state, me.id, [techId, semiId] as string[]);
    next = addSpecial(next, me.id, card(ctx, 'ESPIONAJE', 'RED DE ESPIONAJE ACTIVADA', hqId, `Operación de inteligencia dirigida desde la sede en ${regionTitle(hqId)}.`));
    return ok(notify(next, { type: 'ESPIONAJE', title: 'OPERACIÓN DE ESPIONAJE', message: `Se ha establecido una red de inteligencia en ${regionTitle(hqId)}.`, color: '#00ffff', targetPlayerId: me.id }));
}

export function executeEspionage(state: GameState, actorId: unknown, cardId: unknown, targetId: unknown, infoType: unknown, ctx: EngineContext): EngineResult {
    const me = activePlayer(state, actorId);
    if (typeof me === 'string') return fail(me);
    const spy = me.specialCards.find(c => c.id === cardId && c.type === 'ESPIONAJE');
    if (!spy) return fail('No tenés esa red de espionaje.');
    const target = getPlayer(state, targetId);
    if (!target || target.isEliminated || sameId(target.id, me.id)) return fail('Objetivo inválido.');
    if (infoType !== 'silos' && infoType !== 'mineral') return fail('Tipo de informe inválido.');

    const report: EspionageReport = {
        id: makeId('intel', ctx.random),
        type: infoType,
        targetPlayerId: target.id,
        targetPlayerName: target.name,
        data: infoType === 'silos'
            ? target.silos.map(sid => ({ location: regionTitle(sid), status: target.siloStatus[sid]?.status ?? 'unknown' }))
            : { location: regionTitle(target.secretMineralLocation), isExtracted: target.specialCards.some(c => c.type === 'SECRET_MINERAL') },
    };
    return ok(updatePlayer(state, me.id, p => ({
        ...p,
        specialCards: p.specialCards.filter(c => c.id !== spy.id),
        intelReports: [...(p.intelReports ?? []), report],
    })));
}
