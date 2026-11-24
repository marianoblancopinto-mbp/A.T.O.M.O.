/**
 * Definiciones de operaciones: TODAS las acciones del juego que consisten en
 * "cumplir requisitos, elegir cartas o suministros y confirmar" (misiones
 * especiales, carrera nuclear, espionaje) se describen acá como datos. Una sola
 * pantalla (OperationModal) las dibuja.
 *
 * Esto es sólo la presentación: el servidor vuelve a validar todo. Los
 * requisitos replican los del motor (shared/src/engine/actions.ts) para que la
 * UI muestre de antemano lo que el servidor va a aceptar.
 */

import type { GameState, PlayerData, SupplyType, RawMaterialType } from '@atomo/shared';
import { getSpecialMissions, regionTitle, hasRoute, availableCards, REGIONS, WAR_SECRETS_RESOURCES, ESPIONAGE_HQS, DESIGN_NAME } from '@atomo/shared';
import type { Tone } from '../components';
import type { useGameActions } from '../../hooks/useGameActions';

export type OperationId =
    | 'cruce_andes' | 'alejandro_magno' | 'legado_otomano' | 'gengis_khan' | 'bolivar' | 'fuego_del_pacifico'
    | 'desembarco_normandia' | 'refundacion_estanbul' | 'ruta_antartica' | 'golden_dome'
    | 'planta_desalinizacion' | 'energia_geotermica' | 'secretos_guerra'
    | 'nuclear_design' | 'extract_mineral' | 'construct_silo' | 'assign_fuel' | 'deploy'
    | 'espionage_network' | 'espionage_execute';

export interface OperationRequest {
    id: OperationId;
    /** País preseleccionado (sede, silo, planta). */
    regionId?: string;
    /** Carta involucrada (red de espionaje a usar). */
    cardId?: string;
}

export type SlotKind = 'technology' | 'rawMaterial' | 'supply';

export interface Slot {
    key: string;
    label: string;
    kind: SlotKind;
    /** Tipos aceptados (TechnologyType, RawMaterialType o SupplyType). */
    types: string[];
    /** Exige ruta de suministro desde el país de la carta hasta la base. */
    route?: boolean;
}

export interface Input {
    key: string;
    label: string;
    kind: 'text' | 'choice';
    options?: { value: string; label: string; disabled?: boolean; meta?: string }[];
    placeholder?: string;
}

export interface Selection {
    base: string | null;
    slots: Record<string, string>;
    inputs: Record<string, string>;
}

export interface OperationSpec {
    tone: Tone;
    kicker: string;
    title: string;
    lore?: string;
    effects?: { label: string; value: string }[];
    /** Dónde se ejecuta: fija, a elegir entre opciones, o sin base. */
    base: { mode: 'fixed'; regionId: string | null; label: string } | { mode: 'choose'; label: string; choices: string[] } | { mode: 'none' };
    /** Requisitos que no son cartas (control de países, estado, etc.). */
    checks: (base: string | null) => { label: string; ok: boolean }[];
    slots: Slot[];
    inputs?: Input[];
    confirmLabel: string;
    submit: (sel: Selection, actions: ReturnType<typeof useGameActions>) => void;
}

export interface OpContext {
    state: GameState;
    me: PlayerData;
}

const owns = (ctx: OpContext, r: string | null | undefined) => !!r && String(ctx.state.owners[r]) === String(ctx.me.id);
const ownedOf = (ctx: OpContext, ids: string[]) => ids.filter(r => owns(ctx, r));
const controlCheck = (ctx: OpContext, ids: string[]) => ids.map(r => ({ label: `Controlar ${regionTitle(r)}`, ok: owns(ctx, r) }));
const hasCard = (ctx: OpContext, type: string) => ctx.me.specialCards.some(c => c.type === type);

const missionText = (ctx: OpContext, id: string) => {
    const m = getSpecialMissions(ctx.state.proxyWarCountry).find(x => x.id === id);
    return {
        title: m?.title ?? id,
        lore: m?.lore,
        effects: m ? [{ label: 'Efecto', value: m.mechanicalEffect }, { label: 'Se pierde', value: m.deactivationConditions }] : undefined,
    };
};

const SUPPLY_LABEL: Record<SupplyType, string> = { food: 'Suministro de alimentos', manufacture: 'Suministro de manufactura', energy: 'Suministro de energía' };
const supplySlot = (type: SupplyType, route: boolean): Slot => ({ key: type, label: SUPPLY_LABEL[type], kind: 'supply', types: [type], route });
const tech = (key: string, label: string, type: string): Slot => ({ key, label, kind: 'technology', types: [type] });
const raw = (key: string, label: string, type: string, route = false): Slot => ({ key, label, kind: 'rawMaterial', types: [type], route });

/** Misiones de combate pagadas con suministros (bonus de infantería / aéreo). */
const SUPPLY_MISSIONS: Partial<Record<OperationId, { base: string; supplies: SupplyType[]; route: boolean; card: string; confirm: string }>> = {
    cruce_andes: { base: 'argentina', supplies: ['food'], route: false, card: 'CRUCE_ANDES', confirm: 'Iniciar el cruce' },
    alejandro_magno: { base: 'grecia', supplies: ['food', 'manufacture', 'energy'], route: true, card: 'ALEJANDRO_MAGNO', confirm: 'Iniciar la conquista' },
    legado_otomano: { base: 'turquia', supplies: ['food', 'manufacture', 'energy'], route: true, card: 'LEGADO_OTOMANO', confirm: 'Restaurar el imperio' },
    gengis_khan: { base: 'mongolia', supplies: ['food', 'manufacture', 'energy'], route: true, card: 'GENGIS_KHAN', confirm: 'Movilizar la horda' },
    bolivar: { base: 'venezuela', supplies: ['food', 'manufacture', 'energy'], route: true, card: 'BOLIVAR', confirm: 'Iniciar la campaña' },
    fuego_del_pacifico: { base: 'japon', supplies: ['food', 'manufacture', 'energy'], route: true, card: 'PACIFIC_FIRE', confirm: 'Desplegar la flota aérea' },
};

export function getOperationSpec(ctx: OpContext, req: OperationRequest): OperationSpec | null {
    const { state, me } = ctx;
    const id = req.id;

    const sm = SUPPLY_MISSIONS[id];
    if (sm) {
        const t = missionText(ctx, id);
        return {
            tone: 'mission', kicker: 'Misión especial', ...t,
            base: { mode: 'fixed', regionId: sm.base, label: 'Base de operaciones' },
            checks: () => [...controlCheck(ctx, [sm.base]), { label: 'Misión no activa todavía', ok: !hasCard(ctx, sm.card) }],
            slots: sm.supplies.map(s => supplySlot(s, sm.route)),
            confirmLabel: sm.confirm,
            submit: (sel, a) => a.activateMission({ missionId: id, supplyIds: sm.supplies.map(s => sel.slots[s]) }),
        };
    }

    switch (id) {
        case 'desembarco_normandia': {
            const t = missionText(ctx, id);
            const fr = state.owners['francia'], de = state.owners['alemania'];
            return {
                tone: 'mission', kicker: 'Misión especial', ...t,
                base: { mode: 'fixed', regionId: 'reino_unido', label: 'Base de operaciones' },
                checks: () => [
                    ...controlCheck(ctx, ['reino_unido']),
                    { label: 'Francia y Alemania en manos del mismo enemigo', ok: fr != null && String(fr) === String(de) && String(fr) !== String(me.id) },
                    { label: 'Misión no activa todavía', ok: !hasCard(ctx, 'NORMANDY_LANDING') },
                ],
                slots: [tech('tech', 'Tecnología', 'INDUSTRIA_PESADA'), raw('raw', 'Materia prima', 'HIERRO', true)],
                confirmLabel: 'Iniciar el desembarco',
                submit: (sel, a) => a.activateMission({ missionId: id, techIds: [sel.slots.tech], rawIds: [sel.slots.raw] }),
            };
        }
        case 'refundacion_estanbul': {
            const t = missionText(ctx, id);
            return {
                tone: 'mission', kicker: 'Misión especial', ...t,
                base: { mode: 'fixed', regionId: 'turquia', label: 'Sede' },
                checks: () => [...controlCheck(ctx, ['turquia', 'grecia']), { label: 'Misión no activa todavía', ok: !hasCard(ctx, 'PUENTE_BOSFORO') }],
                slots: [tech('tech', 'Tecnología', 'INDUSTRIA_PESADA'), raw('raw', 'Materia prima', 'HIERRO')],
                inputs: [{ key: 'cityName', label: 'Nombre de la ciudad refundada', kind: 'text', placeholder: 'Ej.: Nueva Bizancio' }],
                confirmLabel: 'Refundar la ciudad',
                submit: (sel, a) => a.activateMission({ missionId: id, techIds: [sel.slots.tech], rawIds: [sel.slots.raw], cityName: sel.inputs.cityName }),
            };
        }
        case 'ruta_antartica':
        case 'golden_dome': {
            const t = missionText(ctx, id);
            const isAnt = id === 'ruta_antartica';
            const required = isAnt ? ['chile', 'argentina', 'australia', 'sudafrica'] : ['nueva_york', 'california', 'texas', 'flordia', 'alaska'];
            return {
                tone: 'mission', kicker: 'Misión estratégica', ...t,
                base: { mode: 'choose', label: 'Base de operaciones', choices: ownedOf(ctx, required) },
                checks: () => [...controlCheck(ctx, required), { label: 'Misión no activa todavía', ok: !me.activeSpecialMissions.some(m => m.id === id) }],
                slots: isAnt
                    ? [tech('t1', 'Tecnología', 'INDUSTRIA_PESADA'), tech('t2', 'Tecnología', 'INDUSTRIA_ELECTRONICA'), raw('r1', 'Materia prima', 'HIERRO'), raw('r2', 'Materia prima', 'CONDUCTORES_SEMICONDUCTORES')]
                    : [tech('t1', 'Tecnología', 'INDUSTRIA_LIGERA'), tech('t2', 'Tecnología', 'INDUSTRIA_ELECTRONICA'), raw('r1', 'Materia prima', 'ALUMINIO'), raw('r2', 'Materia prima', 'CONDUCTORES_SEMICONDUCTORES')],
                confirmLabel: isAnt ? 'Establecer la ruta' : 'Activar la cúpula',
                submit: (sel, a) => a.activateMission({ missionId: id, baseRegionId: sel.base!, techIds: [sel.slots.t1, sel.slots.t2], rawIds: [sel.slots.r1, sel.slots.r2] }),
            };
        }
        case 'planta_desalinizacion': {
            const t = missionText(ctx, id);
            const sites = ['espana', 'marruecos', 'arabia', 'chile', 'california'];
            return {
                tone: 'mission', kicker: 'Infraestructura', ...t,
                base: req.regionId ? { mode: 'fixed', regionId: req.regionId, label: 'Ubicación de la planta' } : { mode: 'choose', label: 'Ubicación de la planta', choices: ownedOf(ctx, sites) },
                checks: base => [
                    { label: base ? `Controlar ${regionTitle(base)}` : 'Elegir un país costero propio', ok: owns(ctx, base) && sites.includes(base!) },
                    { label: 'Sin planta previa en ese país', ok: !!base && !me.inventory.rawMaterials.some(c => c.type === 'AGUA_DULCE' && c.country === base) },
                ],
                slots: [supplySlot('energy', true)],
                confirmLabel: 'Construir la planta',
                submit: (sel, a) => a.activateMission({ missionId: id, baseRegionId: sel.base!, supplyIds: [sel.slots.energy] }),
            };
        }
        case 'energia_geotermica': {
            const t = missionText(ctx, id);
            const sites = ['islandia', 'filipinas'];
            return {
                tone: 'mission', kicker: 'Infraestructura', ...t,
                base: req.regionId ? { mode: 'fixed', regionId: req.regionId, label: 'Ubicación de la planta' } : { mode: 'choose', label: 'Ubicación de la planta', choices: ownedOf(ctx, sites) },
                checks: base => [
                    { label: base ? `Controlar ${regionTitle(base)}` : 'Elegir Islandia o Filipinas', ok: owns(ctx, base) && sites.includes(base!) },
                    { label: 'Sin planta previa en ese país', ok: !!base && !me.specialCards.some(c => c.type === 'PLANTA_GEOTERMICA' && c.originCountry === base) },
                ],
                slots: [tech('tech', 'Tecnología', 'INDUSTRIA_PESADA'), raw('raw', 'Materia prima', 'HIERRO', true)],
                confirmLabel: 'Construir la planta',
                submit: (sel, a) => a.activateMission({ missionId: id, baseRegionId: sel.base!, techIds: [sel.slots.tech], rawIds: [sel.slots.raw] }),
            };
        }
        case 'secretos_guerra': {
            const t = missionText(ctx, id);
            const proxyId = REGIONS.find(r => r.title === state.proxyWarCountry)?.id ?? null;
            const cia = me.specialCards.some(c => c.type === 'ESPIONAJE' && c.originCountry === 'nueva_york');
            const mss = me.specialCards.some(c => c.type === 'ESPIONAJE' && c.originCountry === 'china');
            return {
                tone: 'intel', kicker: 'Operación de inteligencia', ...t,
                base: { mode: 'fixed', regionId: proxyId, label: 'País de la Guerra Proxy' },
                checks: () => [
                    { label: `Controlar ${state.proxyWarCountry}`, ok: owns(ctx, proxyId) },
                    { label: 'Red de espionaje en Nueva York (CIA) o China (MSS)', ok: cia || mss },
                    { label: 'Misión no activa todavía', ok: !me.activeSpecialMissions.some(m => m.id === 'secretos_guerra') },
                ],
                slots: [],
                inputs: [
                    { key: 'agency', label: 'Agencia (se consume su red)', kind: 'choice', options: [
                        { value: 'CIA', label: 'CIA', meta: 'Red en Nueva York', disabled: !cia },
                        { value: 'MSS', label: 'MSS', meta: 'Red en China', disabled: !mss },
                    ] },
                    { key: 'resourceType', label: 'Recurso a asegurar', kind: 'choice', options: WAR_SECRETS_RESOURCES.map(r => ({ value: r.type, label: r.label })) },
                ],
                confirmLabel: 'Revelar los secretos',
                submit: (sel, a) => a.activateMission({ missionId: id, agency: sel.inputs.agency as 'CIA' | 'MSS', resourceType: sel.inputs.resourceType as RawMaterialType }),
            };
        }

        // ------------------------------------------------------------ nuclear
        case 'nuclear_design': {
            const capable = state.regionResources?.nuclearWarCapable ?? [];
            return {
                tone: 'nuclear', kicker: 'Carrera nuclear · Paso 1', title: 'Diseño de armas nucleares',
                lore: 'Los planos sólo pueden recuperarse en una potencia con capacidad nuclear bélica.',
                effects: [{ label: 'Potencias bélicas', value: capable.map(regionTitle).join(', ') || 'Ninguna' }],
                base: req.regionId && capable.includes(req.regionId)
                    ? { mode: 'fixed', regionId: req.regionId, label: 'Sede del diseño' }
                    : { mode: 'choose', label: 'Sede del diseño', choices: ownedOf(ctx, capable) },
                checks: base => [
                    { label: 'Controlar una potencia nuclear bélica', ok: owns(ctx, base) && capable.includes(base!) },
                    { label: 'Sin diseño previo en esa sede', ok: !me.specialCards.some(c => c.name === DESIGN_NAME && c.originCountry === base) },
                ],
                slots: [tech('tech', 'Tecnología', 'INDUSTRIA_ELECTRONICA'), raw('raw', 'Materia prima', 'CONDUCTORES_SEMICONDUCTORES', true)],
                confirmLabel: 'Completar el diseño',
                submit: (sel, a) => a.generateNuclearDesign(sel.base!, { techId: sel.slots.tech, rawId: sel.slots.raw }),
            };
        }
        case 'extract_mineral': {
            const site = me.secretMineralLocation;
            return {
                tone: 'nuclear', kicker: 'Carrera nuclear · Paso 2', title: 'Extracción del mineral secreto',
                lore: 'Sin el mineral secreto el lanzamiento es imposible. El yacimiento está en territorio enemigo: hay que conquistarlo.',
                base: { mode: 'fixed', regionId: site, label: 'Yacimiento' },
                checks: () => [
                    { label: `Controlar ${regionTitle(site)}`, ok: owns(ctx, site) },
                    { label: 'Mineral todavía no extraído', ok: !hasCard(ctx, 'SECRET_MINERAL') },
                ],
                slots: [tech('tech', 'Tecnología', 'INDUSTRIA_PESADA'), raw('iron', 'Materia prima', 'HIERRO', true), raw('water', 'Materia prima', 'AGUA_DULCE', true)],
                confirmLabel: 'Extraer el mineral',
                submit: (sel, a) => a.extractSecretMineral(sel.base!, { techId: sel.slots.tech, ironId: sel.slots.iron, waterId: sel.slots.water }),
            };
        }
        case 'construct_silo': {
            const choices = Object.keys(state.owners).filter(r => owns(ctx, r) && !me.silos.includes(r));
            return {
                tone: 'nuclear', kicker: 'Carrera nuclear · Paso 3', title: 'Construcción de silo',
                lore: 'El silo tarda 2 turnos en quedar operativo. Si perdés el país, perdés el silo y la inversión.',
                base: req.regionId && choices.includes(req.regionId)
                    ? { mode: 'fixed', regionId: req.regionId, label: 'Ubicación del silo' }
                    : { mode: 'choose', label: 'Ubicación del silo', choices },
                checks: base => [{ label: 'País propio sin silo', ok: !!base && choices.includes(base) }],
                slots: [
                    tech('light', 'Tecnología', 'INDUSTRIA_LIGERA'), tech('heavy', 'Tecnología', 'INDUSTRIA_PESADA'), tech('elec', 'Tecnología', 'INDUSTRIA_ELECTRONICA'),
                    raw('iron', 'Materia prima', 'HIERRO', true), raw('alum', 'Materia prima', 'ALUMINIO', true), raw('semi', 'Materia prima', 'CONDUCTORES_SEMICONDUCTORES', true),
                ],
                confirmLabel: 'Construir el silo',
                submit: (sel, a) => a.constructSilo(sel.base!, {
                    techLightId: sel.slots.light, techHeavyId: sel.slots.heavy, techElecId: sel.slots.elec,
                    ironId: sel.slots.iron, alumId: sel.slots.alum, semiId: sel.slots.semi,
                }),
            };
        }
        case 'assign_fuel': {
            const silo = req.regionId ?? null;
            return {
                tone: 'nuclear', kicker: 'Carrera nuclear · Paso 4', title: 'Combustible del silo',
                lore: 'La carta asignada queda reservada para este silo. Debe seguir sin consumir al momento del despliegue.',
                base: { mode: 'fixed', regionId: silo, label: 'Silo' },
                checks: () => [
                    { label: 'Silo propio', ok: !!silo && me.silos.includes(silo) },
                    { label: 'Construcción terminada', ok: !!silo && me.siloStatus[silo]?.status !== 'construction' },
                ],
                slots: [raw('fuel', 'Combustible', 'COMBUSTIBLE_NUCLEAR', true)],
                confirmLabel: 'Asignar combustible',
                submit: (sel, a) => a.assignSiloFuel(sel.base!, sel.slots.fuel),
            };
        }
        case 'deploy': {
            const silo = req.regionId ?? null;
            const mineral = me.specialCards.find(c => c.type === 'SECRET_MINERAL');
            const fuelId = silo ? me.siloFuelCards?.[silo] : undefined;
            const fuel = fuelId ? availableCards(state, me.id).rawMaterials.find(c => c.id === fuelId) : undefined;
            return {
                tone: 'nuclear', kicker: 'Carrera nuclear · Paso 5', title: 'Protocolo de despliegue',
                lore: 'Ganás al cierre de la ronda si el despliegue sigue activo y nadie más activó el suyo. Si dos comandantes despliegan a la vez, se activa la Destrucción Mutua Asegurada.',
                base: { mode: 'fixed', regionId: silo, label: 'Silo de lanzamiento' },
                checks: () => [
                    { label: 'Silo operativo', ok: !!silo && me.siloStatus[silo]?.status === 'active' },
                    { label: 'Diseño de armas nucleares', ok: me.specialCards.some(c => c.name === DESIGN_NAME) },
                    { label: 'Mineral secreto extraído', ok: !!mineral },
                    { label: 'Ruta del mineral al silo', ok: !!mineral && !!silo && hasRoute(state, me.id, mineral.originCountry, silo) },
                    { label: 'Combustible asignado y sin consumir', ok: !!fuel && !fuel.usedThisTurn },
                    { label: 'Ruta del combustible al silo', ok: !!fuel && !!silo && hasRoute(state, me.id, fuel.country, silo) },
                    { label: 'Silo sin lanzamiento este turno', ok: !!silo && !me.usedNuclearSilos?.includes(silo) },
                ],
                slots: [],
                confirmLabel: 'Iniciar despliegue',
                submit: (sel, a) => a.initiateNuclearDeployment(sel.base!),
            };
        }

        // ------------------------------------------------------------ espionaje
        case 'espionage_network': {
            const hqs = ownedOf(ctx, ESPIONAGE_HQS);
            return {
                tone: 'intel', kicker: 'Inteligencia', title: 'Red de espionaje',
                lore: 'Cada red permite UNA operación: revelar los silos o el yacimiento de mineral de un rival. La carta se consume al usarla.',
                effects: [{ label: 'Sedes posibles', value: ESPIONAGE_HQS.map(regionTitle).join(', ') }],
                base: { mode: 'choose', label: 'Sede de inteligencia', choices: hqs },
                checks: base => [{ label: 'Controlar una sede de inteligencia', ok: owns(ctx, base) && ESPIONAGE_HQS.includes(base!) }],
                slots: [tech('tech', 'Tecnología', 'INDUSTRIA_ELECTRONICA'), raw('raw', 'Materia prima', 'CONDUCTORES_SEMICONDUCTORES', true)],
                confirmLabel: 'Activar la red',
                submit: (sel, a) => a.createEspionageCard(sel.base!, { techId: sel.slots.tech, semiId: sel.slots.raw }),
            };
        }
        case 'espionage_execute': {
            const rivals = state.players.filter(p => String(p.id) !== String(me.id) && !p.isEliminated);
            const card = me.specialCards.find(c => c.id === req.cardId);
            return {
                tone: 'intel', kicker: 'Inteligencia', title: 'Operación de espionaje',
                lore: 'El informe llega sólo a vos. La red se consume.',
                base: { mode: 'none' },
                checks: () => [{ label: `Red disponible${card ? ` (${regionTitle(card.originCountry)})` : ''}`, ok: !!card }],
                slots: [],
                inputs: [
                    { key: 'target', label: 'Objetivo', kind: 'choice', options: rivals.map(p => ({ value: String(p.id), label: p.name })) },
                    { key: 'info', label: 'Información', kind: 'choice', options: [
                        { value: 'silos', label: 'Silos', meta: 'Ubicación y estado' },
                        { value: 'mineral', label: 'Mineral secreto', meta: 'Yacimiento y si fue extraído' },
                    ] },
                ],
                confirmLabel: 'Ejecutar operación',
                submit: (sel, a) => a.executeEspionage(rivals.find(p => String(p.id) === sel.inputs.target)!.id, sel.inputs.info as 'silos' | 'mineral', req.cardId!),
            };
        }
    }
    return null;
}

/** Misiones que se abren desde un país del mapa. */
export const MISSION_OPERATION_IDS: OperationId[] = [
    'cruce_andes', 'alejandro_magno', 'legado_otomano', 'gengis_khan', 'bolivar', 'fuego_del_pacifico',
    'desembarco_normandia', 'refundacion_estanbul', 'ruta_antartica', 'golden_dome',
    'planta_desalinizacion', 'energia_geotermica', 'secretos_guerra',
];
