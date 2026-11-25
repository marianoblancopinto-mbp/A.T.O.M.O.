import React, { useState } from 'react';
import type { BattleState, Card, Regiment } from '../../types/gameTypes';
import { regionTitle } from '@atomo/shared';
import { useGameContext } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import { useMyPlayer } from '../../hooks/useMyPlayer';
import { useCountdown } from '../../hooks/useCountdown';
import { BattleCard } from '../shared/battle/BattleCard';
import { BattleSupplyModal } from '../shared/battle/BattleSupplyModal';
import { Modal, Section, Button } from '../../ui/components';

const REG_NAME: Record<Regiment, string> = { A: 'Aéreo', B: 'Infantería', C: 'Artillería' };
const ROUNDS = 3;

/**
 * Batalla por correspondencia: cada uno compromete 3 cartas en orden.
 * El defensor ve el regimiento de cada ronda del ataque, pero no su tier.
 * Como la espera puede durar horas, la pantalla se puede minimizar.
 */
export const CommittedBattle: React.FC<{ battle: BattleState }> = ({ battle: b }) => {
    const { state, multiplayer } = useGameContext();
    const actions = useGameActions();
    const { myPlayer } = useMyPlayer();
    const [slots, setSlots] = useState<(Card | null)[]>([null, null, null]);
    const [minimized, setMinimized] = useState<string | null>(null);
    const [showSupplies, setShowSupplies] = useState(false);
    const remaining = useCountdown(state.deadline?.at);

    const isAttacker = String(multiplayer.playerId) === String(b.attacker.id);
    const isDefender = String(multiplayer.playerId) === String(b.defender.id);
    if (!isAttacker && !isDefender) return null;

    const mustAct = (isAttacker && b.phase === 'ATTACKER_COMMIT') || (isDefender && b.phase === 'DEFENDER_COMMIT');
    const hand = (isAttacker ? b.attackerHand : b.defenderHand).filter(c => !slots.some(s => s?.id === c.id));
    const place = (c: Card) => setSlots(prev => { const i = prev.findIndex(s => !s); if (i === -1) return prev; const n = [...prev]; n[i] = c; return n; });
    const remove = (i: number) => setSlots(prev => { const n = [...prev]; n[i] = null; return n; });
    const ready = slots.every(Boolean);
    const target = regionTitle(b.targetRegionId);

    const status = mustAct
        ? (isAttacker ? 'Elegí y ordená tus 3 cartas de ataque' : 'Organizá la defensa')
        : (b.phase === 'ATTACKER_COMMIT' ? `${b.attacker.name} está preparando la ofensiva` : `Esperando la defensa de ${b.defender.name}`);

    if (minimized === b.phase) {
        return (
            <div className="ui-toasts" style={{ top: 'auto', bottom: 16 }} data-tone="danger">
                <div className="ui-toast" data-tone="danger" role="status">
                    <div className="ui-toast__body">
                        <div className="ui-toast__title">Batalla por {target}</div>
                        <div>{status}{remaining ? ` · vence en ${remaining}` : ''}</div>
                    </div>
                    <Button size="sm" variant={mustAct ? 'primary' : 'secondary'} onClick={() => setMinimized(null)}>Abrir</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Modal
                layer="screen"
                tone="danger"
                kicker={`${b.attacker.name} ataca desde ${regionTitle(b.attackSourceId)}${remaining ? ` · vence en ${remaining}` : ''}`}
                title={`Batalla por ${target}`}
                size="xl"
                onClose={() => setMinimized(b.phase)}
                footer={mustAct ? <>
                    <Button variant="ghost" onClick={() => setMinimized(b.phase)}>Seguir después</Button>
                    <Button onClick={() => setShowSupplies(true)}>Usar suministros</Button>
                    <Button variant="primary" disabled={!ready} onClick={() => { actions.commitBattle(slots.map(s => s!.id)); setSlots([null, null, null]); }}>
                        {isAttacker ? 'Lanzar ofensiva' : 'Confirmar defensa'}
                    </Button>
                </> : <Button variant="primary" onClick={() => setMinimized(b.phase)}>Seguir jugando</Button>}
            >
                <p className="ui-note">{status}.{' '}
                    {isDefender && mustAct && 'Ves qué tipo de tropa ataca en cada ronda, pero no su calidad. Tu carta sólo suma su tier si es del mismo regimiento.'}
                    {isAttacker && mustAct && 'El defensor va a ver qué tipo de tropa mandás en cada ronda, pero no su tier.'}
                </p>

                <Section title="Rondas">
                    <div className="ui-grid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))` }}>
                        {Array.from({ length: ROUNDS }, (_, i) => {
                            const incoming = b.incomingRegiments?.[i];
                            const myCommitted = isAttacker ? b.attackerCommit?.[i] : undefined;
                            const card = mustAct ? slots[i] : myCommitted ?? null;
                            return (
                                <div key={i} className="ui-item" style={{ display: 'block', margin: 0, textAlign: 'center' }}>
                                    <div className="ui-kicker">Ronda {i + 1}</div>
                                    {incoming && <div className="ui-item__title" style={{ margin: '4px 0 8px' }}>Ataque: {REG_NAME[incoming]}</div>}
                                    {card
                                        ? <div style={{ display: 'flex', justifyContent: 'center' }}><BattleCard card={card} role={isAttacker ? 'attacker' : 'defender'} onClick={mustAct ? () => remove(i) : undefined} /></div>
                                        : <div className="ui-empty">{mustAct ? 'Elegí una carta' : '—'}</div>}
                                </div>
                            );
                        })}
                    </div>
                </Section>

                {mustAct && (
                    <Section title="Tu mano (tocá una carta para ponerla en la próxima ronda libre)">
                        <div className="ui-row" style={{ justifyContent: 'center', gap: 10 }}>
                            {hand.map(c => <BattleCard key={c.id} card={c} role={isAttacker ? 'attacker' : 'defender'} highlight onClick={() => place(c)} />)}
                        </div>
                    </Section>
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
                    targetRegionId={isAttacker ? b.attackSourceId : b.targetRegionId}
                    onConfirm={ids => { actions.useBattleSupplies([...ids]); setShowSupplies(false); }}
                    onOpenInventory={() => {}}
                />
            )}
        </>
    );
};
