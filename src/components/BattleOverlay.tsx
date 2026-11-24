import React, { useEffect, useState } from 'react';
import type { Card, BattleState } from '../types/gameTypes';
import { regionTitle } from '@atomo/shared';
import { useGameContext } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import { useMyPlayer } from '../hooks/useMyPlayer';
import { BattleCard } from './shared/battle/BattleCard';
import { BattleSupplyModal } from './shared/battle/BattleSupplyModal';
import { Modal, Section, Button } from '../ui/components';

const AFK_MS = 20000;

/** Lista de modificadores de cada bando, con el mismo formato para los dos. */
function modifiers(b: BattleState) {
    const a = b.attackerBonuses, d = b.defenderBonuses;
    const att: string[] = [];
    if (a.isNormandy) att.push('+2 Artillería, +1 Infantería (Normandía)');
    else {
        if (a.isMaritime) att.push('+1 Artillería, −1 Infantería (desembarco)');
        if (a.isAndesCrossing) att.push('+1 Infantería (Cruce de los Andes)');
    }
    if (a.isAlejandroBonus) att.push('+1 Infantería (Alejandro Magno)');
    if (a.isOtomanoBonus) att.push('+1 Infantería (Legado Otomano)');
    if (a.isGengisBonus) att.push('+1 Infantería (Gengis Khan)');
    if (a.isBolivarBonus) att.push('+1 Infantería (Bolívar)');
    if (a.isPacificFireBonus) att.push('+1 Aéreo (Fuego del Pacífico)');
    const def: string[] = [];
    const terrainAir = d.air - (d.isGoldenDomeBonus ? 1 : 0);
    if (d.art > 0) def.push(`+${d.art} vs Artillería (terreno)`);
    if (terrainAir > 0) def.push(`+${terrainAir} vs Aéreo (terreno)`);
    if (d.inf > 0) def.push(`+${d.inf} vs Infantería (terreno)`);
    if (d.isGoldenDomeBonus) def.push('+1 vs Aéreo (Cúpula Dorada)');
    return { att, def };
}

/**
 * Pantalla de batalla. Sólo la ven los dos participantes. El servidor reparte
 * las manos, resuelve los choques y juega por la IA neutral; acá sólo se elige
 * una carta de la mano propia.
 */
export const BattleOverlay: React.FC<{ battleState: BattleState | null; onOpenInventory: () => void }> = ({ battleState, onOpenInventory }) => {
    const { multiplayer } = useGameContext();
    const actions = useGameActions();
    const { myPlayer } = useMyPlayer();
    const [showSupplies, setShowSupplies] = useState(false);
    const [confirmKick, setConfirmKick] = useState(false);
    const [idle, setIdle] = useState(false);

    const phaseKey = battleState ? `${battleState.phase}-${battleState.roundCount}` : '';
    useEffect(() => {
        setIdle(false);
        const t = setTimeout(() => setIdle(true), AFK_MS);
        return () => clearTimeout(t);
    }, [phaseKey]);

    if (!battleState) return null;
    const b = battleState;
    const isAttacker = String(multiplayer.playerId) === String(b.attacker.id);
    const isDefender = String(multiplayer.playerId) === String(b.defender.id);
    if (!isAttacker && !isDefender) return null;

    const isNeutral = String(b.defender.id) === 'neutral_ai';
    const myHand: Card[] = isAttacker ? b.attackerHand : b.defenderHand;
    const myTurnToPlay = (isAttacker && b.phase === 'ATTACKER_SELECTION') || (isDefender && b.phase === 'DEFENDER_SELECTION');
    const finished = b.phase === 'VICTORY' || b.phase === 'DEFEAT';
    const iWon = finished && ((b.phase === 'VICTORY') === isAttacker);
    const opponent = isAttacker ? b.defender : b.attacker;
    const canKick = multiplayer.isHost && !isNeutral && !finished;
    const mods = modifiers(b);
    const front = isAttacker ? b.attackSourceId : b.targetRegionId;

    const footer = finished
        ? <Button variant="primary" onClick={actions.closeBattle}>Cerrar batalla</Button>
        : <>
            {canKick && (confirmKick
                ? <Button variant="danger" onClick={() => { actions.kickPlayer(opponent.id); setConfirmKick(false); }}>Confirmar expulsión de {opponent.name}</Button>
                : <Button variant="ghost" tone="danger" onClick={() => setConfirmKick(true)}>Expulsar por inactividad</Button>)}
            {myTurnToPlay && <Button onClick={() => setShowSupplies(true)}>Usar suministros</Button>}
            {b.phase === 'RESOLUTION' && (isAttacker
                ? <Button variant="primary" onClick={actions.nextBattleRound}>Continuar</Button>
                : <Button variant={idle ? 'primary' : 'secondary'} onClick={actions.nextBattleRound}>{idle ? 'Continuar (atacante inactivo)' : 'Continuar'}</Button>)}
        </>;

    return (
        <>
            <Modal
                layer="screen"
                tone={finished ? (iWon ? 'default' : 'danger') : 'danger'}
                kicker={`Ronda ${Math.min(b.roundCount + 1, 3)}/3 · ${b.attacker.name} ${b.attackerWins} – ${b.defenderWins} ${b.defender.name}`}
                title={`Batalla por ${regionTitle(b.targetRegionId)}`}
                size="xl"
                footer={footer}
            >
                <div className="ui-split" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 12 }}>
                    <Section title={<span style={{ color: b.attacker.color }}>Atacante · {b.attacker.name} (desde {regionTitle(b.attackSourceId)})</span>}>
                        {mods.att.length ? mods.att.map(m => <div key={m} className="ui-text" style={{ margin: 0 }}>{m}</div>) : <span className="ui-muted">Sin modificadores</span>}
                    </Section>
                    <Section title={<span style={{ color: b.defender.color }}>Defensor · {b.defender.name}</span>}>
                        {mods.def.length ? mods.def.map(m => <div key={m} className="ui-text" style={{ margin: 0 }}>{m}</div>) : <span className="ui-muted">Sin modificadores</span>}
                    </Section>
                </div>

                {finished && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <h2 className="ui-announce__title" style={{ fontSize: 'clamp(2rem, 6vw, 3.4rem)' }}>{iWon ? '¡Victoria!' : '¡Derrota!'}</h2>
                        <p className="ui-text">{b.phase === 'VICTORY'
                            ? `${b.attacker.name} conquistó ${regionTitle(b.targetRegionId)}.`
                            : `${b.defender.name} defendió ${regionTitle(b.targetRegionId)}.`}</p>
                    </div>
                )}

                {b.phase === 'RESOLUTION' && b.clashResult && b.currentAttackerCard && b.currentDefenderCard && (
                    <Section title={b.clashResult.winner === 'attacker' ? 'Gana el atacante' : 'Gana el defensor'}>
                        <p className="ui-text">{b.clashResult.reason}</p>
                        <div className="ui-row" style={{ justifyContent: 'center', gap: 24 }}>
                            <BattleCard card={b.currentAttackerCard} role="attacker" highlight={b.clashResult.winner === 'attacker'} disabled />
                            <strong className="ui-muted" style={{ fontSize: '2rem' }}>VS</strong>
                            <BattleCard card={b.currentDefenderCard} role="defender" highlight={b.clashResult.winner === 'defender'} disabled />
                        </div>
                    </Section>
                )}

                {(b.phase === 'ATTACKER_SELECTION' || b.phase === 'DEFENDER_SELECTION') && (
                    <>
                        {b.phase === 'DEFENDER_SELECTION' && b.currentAttackerCard && (
                            <Section title="Ataque entrante">
                                <div className="ui-row" style={{ justifyContent: 'center' }}>
                                    <BattleCard card={b.currentAttackerCard} role="attacker" disabled />
                                </div>
                            </Section>
                        )}
                        <Section title={myTurnToPlay ? (isAttacker ? 'Elegí tu carta de ataque' : 'Elegí tu defensa') : 'Tu mano'}>
                            {!myTurnToPlay && (
                                <p className="ui-note">{isAttacker
                                    ? (isNeutral ? 'Las fuerzas locales están respondiendo…' : `Esperando la defensa de ${b.defender.name}…`)
                                    : `${b.attacker.name} está eligiendo su ataque…`} {b.opponentHandSize != null && <span className="ui-muted">(el rival tiene {b.opponentHandSize} cartas)</span>}</p>
                            )}
                            <div className="ui-row" style={{ justifyContent: 'center', gap: 10 }}>
                                {myHand.map(card => (
                                    <BattleCard key={card.id} card={card} role={isAttacker ? 'attacker' : 'defender'}
                                        disabled={!myTurnToPlay} highlight={myTurnToPlay}
                                        onClick={myTurnToPlay ? () => actions.playBattleCard(card.id) : undefined} />
                                ))}
                            </div>
                        </Section>
                    </>
                )}
            </Modal>

            {myPlayer && (
                <BattleSupplyModal
                    isOpen={showSupplies}
                    onClose={() => setShowSupplies(false)}
                    supplies={myPlayer.supplies}
                    playerName={myPlayer.name}
                    playerColor={myPlayer.color}
                    playerIndex={myPlayer.id}
                    targetRegionId={front}
                    onConfirm={ids => { actions.useBattleSupplies([...ids]); setShowSupplies(false); }}
                    onOpenInventory={onOpenInventory}
                />
            )}
        </>
    );
};
