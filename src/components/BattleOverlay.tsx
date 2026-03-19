import React, { useState } from 'react';
import type { Card } from '../types/gameTypes';

import { useGameContext } from '../context/GameContext';
import { BattleCard } from './shared/battle/BattleCard';
import { BattleSupplyModal } from './shared/battle/BattleSupplyModal';
import type { BattleState } from '../types/gameTypes';
import { selectBestDefenderCard } from '../utils/combatCalculations';

interface BattleOverlayProps {
    battleState: BattleState | null;
    onOpenInventory: () => void;
}

export const BattleOverlay: React.FC<BattleOverlayProps> = ({
    battleState,
    onOpenInventory,
}) => {
    // Hooks
    const { state, dispatch, multiplayer } = useGameContext();
    const { players } = state;

    // --- Local UI State for non-synced interactions ---
    const [showSupplyModal, setShowSupplyModal] = useState(false);
    const [supplyRole, setSupplyRole] = useState<'attacker' | 'defender'>('attacker');
    const [isPendingSync, setIsPendingSync] = useState(false);
    const [phaseStartTime, setPhaseStartTime] = useState(Date.now());
    const [showForceExit, setShowForceExit] = useState(false);
    const [showKickConfirm, setShowKickConfirm] = useState(false);

    if (!battleState) return null;

    // Derived Data
    const attacker = players.find(p => p.id === battleState.attacker.id) || battleState.attacker;
    const defender = players.find(p => p.id === battleState.defender.id) || battleState.defender;

    // Identity Check
    const isAttacker = String(multiplayer.playerId) === String(attacker.id);
    const isDefender = String(multiplayer.playerId) === String(defender.id);
    const isNeutralAI = String(defender.id) === 'neutral_ai';
    const isHost = multiplayer.isHost;
    const opponentId = isAttacker ? defender.id : attacker.id;
    const opponentName = isAttacker ? defender.name : attacker.name;
    const canKickOpponent = isHost && (isAttacker || isDefender) && !isNeutralAI;

    // Visibility Restriction: Only involved players see the overlay
    if (!isAttacker && !isDefender && !isNeutralAI) return null;
    // Special case: if defender is AI, the attacker is the only one who should see/control the flow
    if (isNeutralAI && !isAttacker) return null;
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
        roundCount,
        defenderBonuses
    } = battleState;

    // --- Sync & AFK Monitoring ---
    React.useEffect(() => {
        setIsPendingSync(false);
        setPhaseStartTime(Date.now());
        setShowForceExit(false);
    }, [phase, roundCount]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            const idleTime = Date.now() - phaseStartTime;
            if (idleTime > 20000) { // 20 seconds
                setShowForceExit(true);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [phaseStartTime]);

    // --- AI Auto-trigger ---
    React.useEffect(() => {
        console.log(`[BattleOverlay] AI Check: Phase=${phase}, isNeutral=${isNeutralAI}, isAttacker=${isAttacker}`);
        if (phase === 'DEFENDER_SELECTION' && isNeutralAI && isAttacker) {
            console.log('[BattleOverlay] Fuerzas Locales detected. Attacker is triggering AI move.');
            
            let aiCard: Card | null = null;
            
            try {
                if (defenderHand.length > 0) {
                    aiCard = selectBestDefenderCard(
                        currentAttackerCard!,
                        attackerBonuses,
                        defenderHand,
                        defenderBonuses,
                        attackerHand,
                        battleState.isAiCheating
                    );
                }
            } catch (error) {
                console.error('[BattleOverlay] Error in AI strategy calculation:', error);
                // Fallback to random card immediately if the algorithm throws
                if (defenderHand.length > 0) {
                    aiCard = defenderHand[Math.floor(Math.random() * defenderHand.length)];
                    console.log('[BattleOverlay] AI fallback to random card due to error:', aiCard);
                }
            }
            
            let timer: ReturnType<typeof setTimeout>;
            let failsafeTimer: ReturnType<typeof setTimeout>;

            if (aiCard) {
                // Regular AI move with a small visual delay
                timer = setTimeout(() => {
                    dispatch({
                        type: 'BATTLE_DEFENDER_SELECT',
                        payload: { cardId: aiCard!.id }
                    });
                }, 1500);
            }

            // Failsafe timer: 30 seconds after phase start, if we are somehow still stuck, throw a random card.
            failsafeTimer = setTimeout(() => {
                console.warn('[BattleOverlay] AI 30-second failsafe triggered.');
                // We don't check phase directly from state here because closures, but dispatch will handle it safely
                if (defenderHand.length > 0) {
                    const randomCard = defenderHand[Math.floor(Math.random() * defenderHand.length)];
                    dispatch({
                        type: 'BATTLE_DEFENDER_SELECT',
                        payload: { cardId: randomCard.id }
                    });
                }
            }, 30000);

            return () => {
                clearTimeout(timer);
                clearTimeout(failsafeTimer);
            };
        }
    }, [phase, isNeutralAI, isAttacker, state.settings?.aiActive, currentAttackerCard]);

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
        setIsPendingSync(true);
        // Just proceed to next round/end. Reducer handles logic.
        dispatch({ type: 'BATTLE_NEXT_ROUND' });
    };

    const handleClose = () => {
        dispatch({ type: 'END_BATTLE' });
    };

    const handleKickOpponent = () => {
        if (!canKickOpponent) return;
        dispatch({ type: 'KICK_PLAYER', payload: { playerId: opponentId } });
        setShowKickConfirm(false);
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
            {/* Host Kick Button */}
            {canKickOpponent && phase !== 'VICTORY' && phase !== 'DEFEAT' && (
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                    {!showKickConfirm ? (
                        <button
                            onClick={() => setShowKickConfirm(true)}
                            style={{
                                padding: '5px 10px',
                                fontSize: '0.7rem',
                                backgroundColor: 'transparent',
                                color: '#ff4444',
                                border: '1px solid #ff4444',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                textTransform: 'uppercase',
                                opacity: 0.7,
                                transition: 'opacity 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                        >
                            EXPULSAR AFK
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                                onClick={handleKickOpponent}
                                style={{
                                    padding: '5px 10px',
                                    fontSize: '0.7rem',
                                    backgroundColor: '#ff0000',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}
                            >
                                CONFIRMAR EXPULSI\u00D3N DE {opponentName.toUpperCase()}
                            </button>
                            <button
                                onClick={() => setShowKickConfirm(false)}
                                style={{
                                    padding: '5px 8px',
                                    fontSize: '0.7rem',
                                    backgroundColor: '#333',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace'
                                }}
                            >
                                X
                            </button>
                        </div>
                    )}
                </div>
            )}
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
            if (attackerBonuses.isOtomanoBonus) {
                attMods.push(<div key="att-inf-otomano" style={{ color: '#00ccff' }}>+1 Infantería (Legado Otomano)</div>);
            }
            if (attackerBonuses.isGengisBonus) {
                attMods.push(<div key="att-inf-gengis" style={{ color: '#ff4444' }}>+1 Infantería (Gengis Khan)</div>);
            }
            if (attackerBonuses.isBolivarBonus) {
                attMods.push(<div key="att-inf-bolivar" style={{ color: '#ffcc00' }}>+1 Infantería (Bolívar)</div>);
            }
            if (attackerBonuses.isPacificFireBonus) {
                attMods.push(<div key="att-air-pacific" style={{ color: '#00ffff' }}>+1 Aéreo (Fuego del Pacífico)</div>);
            }
        }

        // Defender Modifiers
        if (defenderBonuses.art > 0) defMods.push(<div key="def-art" style={{ color: '#fff' }}>+{defenderBonuses.art} Artillería (Terreno)</div>);
        if (defenderBonuses.air > 0) defMods.push(<div key="def-air" style={{ color: '#fff' }}>+{defenderBonuses.air} Aéreo (Terreno)</div>);
        if (defenderBonuses.inf > 0) defMods.push(<div key="def-inf" style={{ color: '#fff' }}>+{defenderBonuses.inf} Infantería (Terreno)</div>);
        if (defenderBonuses.isGoldenDomeBonus) defMods.push(<div key="def-goldendome" style={{ color: '#ffd700' }}>+1 Aéreo (Cúpula Dorada)</div>);

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
                        <h2 style={{ color: '#888' }}>
                            {isNeutralAI ? 'PROCESANDO DEFENSA ESTRATÉGICA...' : 'ESPERANDO AL DEFENSOR...'}
                        </h2>
                        {isNeutralAI && (
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ color: '#00ff00', fontSize: '0.8rem', marginBottom: '10px' }}>FUERZAS LOCALES ACTIVAS</div>
                            </div>
                        )}
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                        <button
                            onClick={nextClash}
                            disabled={isPendingSync}
                            style={{
                                padding: '15px 40px',
                                fontSize: '1.2rem',
                                backgroundColor: isPendingSync ? '#222' : '#333',
                                color: isPendingSync ? '#666' : '#fff',
                                border: `1px solid ${isPendingSync ? '#444' : '#666'}`,
                                borderRadius: '4px',
                                cursor: isPendingSync ? 'wait' : 'pointer',
                                fontWeight: 'bold',
                                marginTop: '20px'
                            }}
                        >
                            {isPendingSync ? 'SINCRONIZANDO...' : 'CONTINUAR ATAQUE'}
                        </button>
                        {isPendingSync && (
                            <div style={{ color: '#00ff00', fontSize: '0.8rem', animation: 'blink 1s infinite' }}>
                                ENVIANDO DATOS AL CUARTEL GENERAL...
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '20px' }}>
                        <div style={{ color: '#888', fontStyle: 'italic', animation: 'pulse 1.5s infinite' }}>
                            {showForceExit ? 'EL ATACANTE NO RESPONDE' : 'Esperando a que el atacante continúe...'}
                        </div>
                        <button
                            onClick={handleClose}
                            style={{
                                padding: '10px 20px',
                                fontSize: '0.9rem',
                                backgroundColor: showForceExit ? 'rgba(255,0,0,0.1)' : 'transparent',
                                color: showForceExit ? '#ff4444' : '#666',
                                border: `1px solid ${showForceExit ? '#ff4444' : '#444'}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: showForceExit ? 'bold' : 'normal',
                                boxShadow: showForceExit ? '0 0 10px rgba(255,0,0,0.2)' : 'none'
                            }}
                        >
                            {showForceExit ? 'ABANDONAR BATALLA (SISTEMA AFK DETECTADO)' : 'SALIR (SI EL ATACANTE NO RESPONDE)'}
                        </button>
                        {showForceExit && (
                            <div style={{ fontSize: '0.7rem', color: '#ff4444', maxWidth: '300px', textAlign: 'center' }}>
                                Se ha detectado inactividad prolongada del atacante. Puedes retirarte de la batalla sin perder tropas adicionales.
                            </div>
                        )}
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
