import React, { useState } from 'react';
import type { Card } from '../types/gameTypes';

import { useGameContext } from '../context/GameContext';
import { BattleCard } from './shared/battle/BattleCard';
import { BattleSupplyModal } from './shared/battle/BattleSupplyModal';
import type { BattleState } from '../types/gameTypes';

interface BattleOverlayProps {
    battleState: BattleState | null;
    defenseBonuses: { art: number, air: number, inf: number };
    onOpenInventory: () => void;
}

export const BattleOverlay: React.FC<BattleOverlayProps> = ({
    battleState,
    defenseBonuses,
    onOpenInventory,
}) => {
    // Hooks
    const { state, dispatch, multiplayer } = useGameContext();
    const { players } = state;

    // --- Local UI State for non-synced interactions ---
    const [showSupplyModal, setShowSupplyModal] = useState(false);
    const [supplyRole, setSupplyRole] = useState<'attacker' | 'defender'>('attacker');

    if (!battleState) return null;

    // Derived Data
    const attacker = players.find(p => p.id === battleState.attacker.id) || battleState.attacker;
    const defender = players.find(p => p.id === battleState.defender.id) || battleState.defender;
    const attackerName = attacker.name;
    const attackerColor = attacker.color;
    const defenderName = defender.name;
    const defenderColor = defender.color;

    // Global Battle State
    const {
        attackerHand,
        defenderHand,
        attackerBonuses,
        targetRegionId,
        phase,
        currentAttackerCard,
        currentDefenderCard,
        clashResult,
        attackerWins,
        defenderWins,
        roundCount
    } = battleState;

    // Identity Check
    const isAttacker = multiplayer.playerId === attacker.id;
    const isDefender = multiplayer.playerId === defender.id;

    // --- Handlers ---

    const handleOpenSupplyModal = (role: 'attacker' | 'defender') => {
        // Only allow opening if it's your role
        if (role === 'attacker' && !isAttacker) return;
        if (role === 'defender' && !isDefender) return;

        setSupplyRole(role);
        setShowSupplyModal(true);
    };

    const handleConfirmSupplies = (selectedIds: Set<string>) => {
        // ... (Existing Supply Logic - kept local to the modal interaction, but dispatches global updates) ...
        const currentSupplies = supplyRole === 'attacker' ? attacker.supplies : defender.supplies;

        // Count selected & Calculate Draw Count (Simplified for brevity, logic remains same)
        const selectedManufacture = currentSupplies.manufacture.filter(s => selectedIds.has(s.id)).length;
        const selectedFood = currentSupplies.food.filter(s => selectedIds.has(s.id)).length;
        const selectedEnergy = currentSupplies.energy.filter(s => selectedIds.has(s.id)).length;

        // Calculate Draw Count
        let m = selectedManufacture;
        let f = selectedFood;
        let e = selectedEnergy;
        let sets = 0;
        while (m > 0 && f > 0 && e > 0) { sets++; m--; f--; e--; }

        const drawCount = (sets * 4) + m + f + e;

        if (drawCount > 0) {
            const deck = [...battleState.deck];
            const newCards: Card[] = [];
            for (let i = 0; i < drawCount; i++) {
                if (deck.length > 0) newCards.push(deck.pop()!);
            }

            dispatch({
                type: 'UPDATE_PLAYERS_FN',
                payload: (currentPlayers) => {
                    return currentPlayers.map(p => {
                        if (p.id === (supplyRole === 'attacker' ? attacker.id : defender.id)) {
                            const s = { ...p.supplies };
                            s.manufacture = s.manufacture.filter(item => !selectedIds.has(item.id));
                            s.food = s.food.filter(item => !selectedIds.has(item.id));
                            s.energy = s.energy.filter(item => !selectedIds.has(item.id));
                            return { ...p, supplies: s };
                        }
                        return p;
                    });
                }
            });

            // Update Battle State via Global Action
            const updatedAttackerHand = supplyRole === 'attacker' ? [...attackerHand, ...newCards] : attackerHand;
            const updatedDefenderHand = supplyRole === 'defender' ? [...defenderHand, ...newCards] : defenderHand;

            dispatch({
                type: 'UPDATE_BATTLE',
                payload: {
                    deck,
                    attackerHand: updatedAttackerHand,
                    defenderHand: updatedDefenderHand
                }
            });
        }
        setShowSupplyModal(false);
    };


    const handleAttackerSelect = (card: Card) => {
        if (!isAttacker) return;
        dispatch({
            type: 'BATTLE_ATTACKER_SELECT',
            payload: { cardId: card.id }
        });
    };

    const handleDefenderSelect = (card: Card) => {
        if (!isDefender) return;
        dispatch({
            type: 'BATTLE_DEFENDER_SELECT',
            payload: { cardId: card.id }
        });
    };

    const nextClash = () => {
        // Just proceed to next round/end. Reducer handles logic.
        dispatch({ type: 'BATTLE_NEXT_ROUND' });
    };

    const handleClose = () => {
        dispatch({ type: 'END_BATTLE' });
    };

    // --- Render Helpers ---

    const renderScoreBanner = () => (
        <div style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#000',
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '30px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            fontFamily: 'monospace',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: attackerColor, borderRadius: '50%' }} />
                <span style={{ color: attackerColor }}>{attackerName.toUpperCase()}: {attackerWins}</span>
            </div>
            <div style={{ color: '#666', fontSize: '0.8rem' }}>// ROUND {roundCount + 1}/3 //</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: defenderColor }}>{defenderName.toUpperCase()}: {defenderWins}</span>
                <div style={{ width: '12px', height: '12px', backgroundColor: defenderColor, borderRadius: '50%' }} />
            </div>
        </div>
    );

    const renderModifiers = () => {
        const attMods: React.ReactNode[] = [];
        const defMods: React.ReactNode[] = [];

        // Attacker Modifiers
        if (attackerBonuses.isNormandy) {
            attMods.push(<div key="att-normandy-art" style={{ color: '#00aaff' }}>+2 Artillería (Desembarco de Normandía)</div>);
            attMods.push(<div key="att-normandy-inf" style={{ color: '#00ff44' }}>+1 Infantería (Desembarco de Normandía)</div>);
        } else {
            if (attackerBonuses.art !== 0) {
                attMods.push(<div key="att-art" style={{ color: '#fff' }}>{`${attackerBonuses.art > 0 ? '+' : ''}${attackerBonuses.art} Artillería (Desembarco)`}</div>);
            }
            if (attackerBonuses.isMaritime) {
                attMods.push(<div key="att-inf-maritime" style={{ color: '#ff4444' }}>-1 Infantería (Desembarco)</div>);
            }
            if (attackerBonuses.isAndesCrossing) {
                attMods.push(<div key="att-inf-andes" style={{ color: '#00ff00' }}>+1 Infantería (Misión Cruce de los Andes)</div>);
            }
            if (attackerBonuses.isAlejandroBonus) {
                attMods.push(<div key="att-inf-alejandro" style={{ color: '#ffd700' }}>+1 Infantería (Misión Alejandro Magno)</div>);
            }
        }

        // Defender Modifiers
        if (defenseBonuses.art > 0) defMods.push(<div key="def-art" style={{ color: '#fff' }}>+{defenseBonuses.art} Artillería (Terreno)</div>);
        if (defenseBonuses.air > 0) defMods.push(<div key="def-air" style={{ color: '#fff' }}>+{defenseBonuses.air} Aéreo (Terreno)</div>);
        if (defenseBonuses.inf > 0) defMods.push(<div key="def-inf" style={{ color: '#fff' }}>+{defenseBonuses.inf} Infantería (Terreno)</div>);

        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #333',
                backgroundColor: 'rgba(0,0,0,0.5)',
                fontFamily: 'monospace',
                fontSize: '0.8rem'
            }}>
                <div style={{ display: 'flex', gap: '40px', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: attackerColor, borderBottom: `1px solid ${attackerColor}`, marginBottom: '5px' }}>MODIFICADORES {attackerName}</div>
                        {attMods.length > 0 ? attMods : <div style={{ color: '#666' }}>-</div>}
                    </div>
                    <div style={{ width: '1px', backgroundColor: '#333' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: defenderColor, borderBottom: `1px solid ${defenderColor}`, marginBottom: '5px' }}>MODIFICADORES {defenderName}</div>
                        {defMods.length > 0 ? defMods : <div style={{ color: '#666' }}>-</div>}
                    </div>
                </div>
            </div>
        );
    };

    // --- ASYMMETRIC RENDER LOGIC ---

    const renderAttackerView = () => {
        return (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {renderModifiers()}

                {/* Status Message */}
                {phase === 'DEFENDER_SELECTION' && (
                    <div style={{ textAlign: 'center', marginBottom: '30px', animation: 'fadeIn 0.5s' }}>
                        <h2 style={{ color: '#888' }}>ESPERANDO AL DEFENSOR...</h2>
                        <div style={{ marginTop: '20px', opacity: 0.7 }}>
                            <BattleCard card={currentAttackerCard!} role="attacker" disabled={true} />
                        </div>
                    </div>
                )}

                {/* Card Selection */}
                {phase === 'ATTACKER_SELECTION' && (
                    <>
                        <h2 style={{ color: attackerColor, marginBottom: '20px' }}>SELECCIONA TU CARTA</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                            {attackerHand.map(card => (
                                <BattleCard
                                    key={card.id}
                                    card={card}
                                    role="attacker"
                                    onClick={() => handleAttackerSelect(card)}
                                    highlight={true}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => handleOpenSupplyModal('attacker')}
                            style={{ marginTop: '20px', padding: '10px', background: '#222', color: attackerColor, border: '1px solid #444' }}
                        >
                            USAR SUMINISTROS
                        </button>
                    </>
                )}
            </div>
        );
    };

    const renderDefenderView = () => {
        return (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {renderModifiers()}

                {/* Status Message */}
                {phase === 'ATTACKER_SELECTION' && (
                    <div style={{ textAlign: 'center', marginBottom: '30px', animation: 'fadeIn 0.5s' }}>
                        <h2 style={{ color: '#888' }}>EL ATACANTE ESTÁ ELIGIENDO...</h2>
                    </div>
                )}

                {/* Card Selection */}
                {phase === 'DEFENDER_SELECTION' && (
                    <>
                        <div style={{ marginBottom: '30px', opacity: 0.7, transform: 'scale(0.8)' }}>
                            <div style={{ color: '#888', textAlign: 'center', marginBottom: '10px' }}>ATAQUE ENTRANTE</div>
                            {/* NOTE: We can decide to hide the attacker card here for "Fog of War" or show it. 
                                Standard TEG/Risk shows it to allow counter-play logic. */}
                            <BattleCard card={currentAttackerCard!} role="attacker" disabled={true} />
                        </div>

                        <h2 style={{ color: defenderColor, marginBottom: '20px' }}>ELIGE TU DEFENSA</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                            {defenderHand.map(card => (
                                <BattleCard
                                    key={card.id}
                                    card={card}
                                    role="defender"
                                    onClick={() => handleDefenderSelect(card)}
                                    highlight={true}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => handleOpenSupplyModal('defender')}
                            style={{ marginTop: '20px', padding: '10px', background: '#222', color: defenderColor, border: '1px solid #444' }}
                        >
                            USAR SUMINISTROS
                        </button>
                    </>
                )}
            </div>
        );
    };

    const renderResolution = () => {
        if (!clashResult || !currentAttackerCard || !currentDefenderCard) return null;

        return (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{
                    color: clashResult.winner === 'attacker' ? attackerColor : defenderColor,
                    fontSize: '2.5rem', marginBottom: '20px', whiteSpace: 'pre-wrap'
                }}>
                    {clashResult.winner === 'attacker' ? 'VICTORIA ATACANTE' : 'VICTORIA DEFENSOR'}<br />
                    <span style={{ fontSize: '1rem', color: '#ccc' }}>{clashResult.reason}</span>
                </h2>

                <div style={{ display: 'flex', gap: '50px', alignItems: 'center', margin: '30px 0' }}>
                    <div style={{ transform: 'scale(1.2)' }}>
                        <BattleCard card={currentAttackerCard} role="attacker" highlight={clashResult.winner === 'attacker'} disabled={true} />
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#555' }}>VS</div>
                    <div style={{ transform: 'scale(1.2)' }}>
                        <BattleCard card={currentDefenderCard} role="defender" highlight={clashResult.winner === 'defender'} disabled={true} />
                    </div>
                </div>

                {isAttacker ? (
                    <button
                        onClick={nextClash}
                        style={{
                            padding: '15px 40px',
                            fontSize: '1.2rem',
                            backgroundColor: '#333',
                            color: '#fff',
                            border: '1px solid #666',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginTop: '20px'
                        }}
                    >
                        CONTINUAR
                    </button>
                ) : (
                    <div style={{ marginTop: '20px', color: '#888', fontStyle: 'italic', animation: 'pulse 1.5s infinite' }}>
                        Esperando a que el atacante continúe...
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: '#050505',
            zIndex: 3000,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            overflowY: 'auto'
        }}>
            {renderScoreBanner()}

            <div style={{ flex: 1, width: '100%', maxWidth: '1400px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                {phase === 'RESOLUTION' ? renderResolution() : (
                    <>
                        {(phase === 'VICTORY' || phase === 'DEFEAT') ? (
                            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <h1 style={{
                                    color: phase === 'VICTORY' ? (isAttacker ? attackerColor : defenderColor) : (isAttacker ? defenderColor : attackerColor),
                                    fontSize: '4rem',
                                    marginBottom: '20px',
                                    textShadow: '0 0 20px rgba(0,0,0,0.8)'
                                }}>
                                    {phase === 'VICTORY' ? '¡VICTORIA!' : '¡DERROTA!'}
                                </h1>
                                <div style={{ fontSize: '1.5rem', color: '#ccc', marginBottom: '40px' }}>
                                    {phase === 'VICTORY'
                                        ? `La región ${targetRegionId} ha sido conquistada.`
                                        : `La defensa de ${targetRegionId} ha tenido éxito.`}
                                </div>
                                <button
                                    onClick={handleClose}
                                    style={{
                                        padding: '15px 40px',
                                        fontSize: '1.5rem',
                                        backgroundColor: '#444',
                                        color: '#fff',
                                        border: '2px solid #fff',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        boxShadow: '0 0 15px rgba(255,255,255,0.2)'
                                    }}
                                >
                                    CERRAR BATALLA
                                </button>
                            </div>
                        ) : (
                            <>
                                {isAttacker && renderAttackerView()}
                                {isDefender && renderDefenderView()}
                                {!isAttacker && !isDefender && (
                                    <div style={{ color: '#666', marginTop: '50px' }}>
                                        ESPECTANDO BATALLA...
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

            </div>

            <BattleSupplyModal
                isOpen={showSupplyModal}
                onClose={() => setShowSupplyModal(false)}
                supplies={supplyRole === 'attacker' ? attacker.supplies : defender.supplies}
                playerName={supplyRole === 'attacker' ? attackerName : defenderName}
                playerColor={supplyRole === 'attacker' ? attackerColor : defenderColor}
                playerIndex={supplyRole === 'attacker' ? attacker.id : defender.id}
                targetRegionId={supplyRole === 'attacker' ? battleState.attackSourceId : targetRegionId}
                onConfirm={handleConfirmSupplies}
                onOpenInventory={onOpenInventory}
            />
        </div>
    );
};
