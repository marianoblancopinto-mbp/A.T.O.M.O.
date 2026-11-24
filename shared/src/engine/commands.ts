/**
 * Comandos — lo ÚNICO que un cliente puede pedirle al servidor.
 *
 * Un comando expresa una INTENCIÓN ("atacar X desde Y", "jugar esta carta"),
 * nunca un estado resultante. El servidor identifica quién lo manda (por su
 * asiento, no por lo que diga el mensaje), lo valida contra las reglas, lo
 * ejecuta con su propio azar y recalcula los invariantes (reconcile).
 *
 * El motor es puro y no depende del transporte (Colyseus, HTTP, etc.).
 */

import type { GameState } from '../game/state';
import { fail, currentPlayer, sameId, type EngineContext, type EngineResult } from './helpers';
import { attack, playCard, nextRound, closeBattle, useBattleSupplies } from './combat';
import { produceSupply, setProductionReady, endTurn, forceActionPhase, endGame, setEndgameChoice, kickPlayer } from './turn';
import { proposeTreaty, respondTreaty, cancelTreaty } from './treaties';
import {
    activateMission, expireTurnBonuses, generateNuclearDesign, extractMineral, constructSilo,
    assignSiloFuel, initiateDeployment, createEspionageNetwork, executeEspionage, type MissionInput,
} from './actions';
import { reconcile } from './reconcile';

export type Command =
    // Preturno
    | { type: 'PRODUCE_SUPPLY'; techId: string; rawId: string }
    | { type: 'SET_PRODUCTION_READY'; ready: boolean }
    // Turno
    | { type: 'END_TURN' }
    // Combate
    | { type: 'ATTACK'; sourceId: string; targetId: string }
    | { type: 'BATTLE_PLAY_CARD'; cardId: string }
    | { type: 'BATTLE_NEXT_ROUND' }
    | { type: 'BATTLE_USE_SUPPLIES'; supplyIds: string[] }
    | { type: 'BATTLE_CLOSE' }
    // Misiones
    | ({ type: 'ACTIVATE_MISSION' } & { missionId: string; baseRegionId?: string; techIds?: string[]; rawIds?: string[]; supplyIds?: string[]; cityName?: string; agency?: 'CIA' | 'MSS'; resourceType?: string })
    // Nuclear
    | { type: 'GENERATE_NUCLEAR_DESIGN'; regionId: string; techId: string; rawId: string }
    | { type: 'EXTRACT_MINERAL'; regionId: string; techId: string; ironId: string; waterId: string }
    | { type: 'CONSTRUCT_SILO'; regionId: string; techLightId: string; techHeavyId: string; techElecId: string; ironId: string; alumId: string; semiId: string }
    | { type: 'ASSIGN_SILO_FUEL'; siloId: string; fuelCardId: string }
    | { type: 'INITIATE_DEPLOYMENT'; siloId: string }
    | { type: 'SET_ENDGAME_CHOICE'; choice: 'victory' | 'destruction' }
    // Espionaje
    | { type: 'CREATE_ESPIONAGE_NETWORK'; hqId: string; techId: string; semiId: string }
    | { type: 'EXECUTE_ESPIONAGE'; cardId: string; targetPlayerId: string | number; infoType: 'silos' | 'mineral' }
    // Tratados
    | { type: 'PROPOSE_TREATY'; treatyId?: string; targetPlayerId?: string | number; clauses: unknown[] }
    | { type: 'RESPOND_TREATY'; treatyId: string; accept: boolean }
    | { type: 'CANCEL_TREATY'; treatyId: string }
    // Anfitrión
    | { type: 'FORCE_ACTION_PHASE' }
    | { type: 'KICK_PLAYER'; playerId: string | number }
    | { type: 'END_GAME' };

export type CommandType = Command['type'];

/** Comandos que siguen permitidos con la partida terminada. */
const ALLOWED_AFTER_END: ReadonlySet<CommandType> = new Set(['SET_ENDGAME_CHOICE', 'END_GAME', 'BATTLE_CLOSE']);

function run(state: GameState, actorId: unknown, c: any, ctx: EngineContext): EngineResult {
    switch (c.type as CommandType) {
        case 'PRODUCE_SUPPLY': return produceSupply(state, actorId, c.techId, c.rawId, ctx);
        case 'SET_PRODUCTION_READY': return setProductionReady(state, actorId, !!c.ready);
        case 'END_TURN': {
            const r = endTurn(state, actorId, ctx);
            return r.ok ? { ok: true, state: { ...r.state, players: expireTurnBonuses(r.state, actorId).players } } : r;
        }
        case 'ATTACK': return attack(state, actorId, c.sourceId, c.targetId, ctx.random);
        case 'BATTLE_PLAY_CARD': return playCard(state, actorId, c.cardId);
        case 'BATTLE_NEXT_ROUND': return nextRound(state, actorId);
        case 'BATTLE_USE_SUPPLIES': return useBattleSupplies(state, actorId, c.supplyIds);
        case 'BATTLE_CLOSE': return closeBattle(state, actorId);
        case 'ACTIVATE_MISSION': return activateMission(state, actorId, c as MissionInput, ctx);
        case 'GENERATE_NUCLEAR_DESIGN': return generateNuclearDesign(state, actorId, c.regionId, c.techId, c.rawId, ctx);
        case 'EXTRACT_MINERAL': return extractMineral(state, actorId, c.regionId, c, ctx);
        case 'CONSTRUCT_SILO': return constructSilo(state, actorId, c.regionId, c, ctx);
        case 'ASSIGN_SILO_FUEL': return assignSiloFuel(state, actorId, c.siloId, c.fuelCardId);
        case 'INITIATE_DEPLOYMENT': return initiateDeployment(state, actorId, c.siloId);
        case 'SET_ENDGAME_CHOICE': return setEndgameChoice(state, actorId, c.choice);
        case 'CREATE_ESPIONAGE_NETWORK': return createEspionageNetwork(state, actorId, c.hqId, c.techId, c.semiId, ctx);
        case 'EXECUTE_ESPIONAGE': return executeEspionage(state, actorId, c.cardId, c.targetPlayerId, c.infoType, ctx);
        case 'PROPOSE_TREATY': return proposeTreaty(state, actorId, c, ctx);
        case 'RESPOND_TREATY': return respondTreaty(state, actorId, c.treatyId, !!c.accept, ctx);
        case 'CANCEL_TREATY': return cancelTreaty(state, actorId, c.treatyId);
        case 'FORCE_ACTION_PHASE': return forceActionPhase(state, actorId);
        case 'KICK_PLAYER': return kickPlayer(state, actorId, c.playerId, ctx.random);
        case 'END_GAME': return endGame(state, actorId);
        default: return fail('Comando desconocido.');
    }
}

/**
 * Punto ÚNICO de autoridad. `actorId` lo determina el servidor (el asiento de
 * la conexión), nunca el contenido del comando.
 */
export function executeCommand(state: GameState, actorId: string | number, command: unknown, ctx: EngineContext): EngineResult {
    if (!command || typeof command !== 'object' || typeof (command as any).type !== 'string') return fail('Comando inválido.');
    const c = command as Command;
    if (!state.gameStarted) return fail('La partida no empezó.');
    if ((state.winner || state.gameOver) && !ALLOWED_AFTER_END.has(c.type)) return fail('La partida terminó.');
    // Mientras hay una batalla, sólo se juegan comandos de batalla (y los del anfitrión).
    if (state.battleState && !c.type.startsWith('BATTLE_') && !['KICK_PLAYER', 'END_GAME'].includes(c.type)) {
        const inBattle = sameId(state.battleState.attacker.id, actorId) || sameId(state.battleState.defender.id, actorId);
        if (inBattle || c.type === 'ATTACK' || c.type === 'END_TURN') return fail('Hay una batalla en curso.');
    }
    const result = run(state, actorId, c, ctx);
    if (!result.ok) return result;
    return { ok: true, state: reconcile(state, result.state) };
}

export function isMyTurn(state: GameState, playerId: unknown): boolean {
    return sameId(currentPlayer(state)?.id, playerId);
}
