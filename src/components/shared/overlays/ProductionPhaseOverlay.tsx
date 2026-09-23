import React from 'react';
import { useGameContext } from '../../../context/GameContext';

interface ProductionPhaseOverlayProps {
    /** Abre el inventario para producir suministros. */
    onOpenInventory: () => void;
    /** El observador ve la fase pero no puede accionar. */
    isSpectator?: boolean;
}

/**
 * PRETURNO — Fase de producción simultánea al inicio de la ronda.
 *
 * Todos los jugadores producen suministros a la vez (combinando materias primas +
 * tecnologías). Cada uno marca "LISTO" cuando termina; cuando el último confirma,
 * arranca la ronda de acciones. Durante la ronda ya no se puede producir.
 */
export const ProductionPhaseOverlay: React.FC<ProductionPhaseOverlayProps> = ({
    onOpenInventory,
    isSpectator = false
}) => {
    const { state, dispatch, multiplayer } = useGameContext();
    const { players, productionReadyIds } = state;

    const isMultiplayer = multiplayer.connectionStatus === 'PLAYING' && !!multiplayer.playerId;
    const localId = isMultiplayer
        ? multiplayer.playerId
        : players[state.currentPlayerIndex]?.id;
    const isHost = !!multiplayer.isHost;

    const readySet = new Set(productionReadyIds.map(String));
    const activePlayers = players.filter(p => !p.isEliminated);
    const localReady = localId != null && readySet.has(String(localId));

    const toggleReady = () => {
        if (localId == null) return;
        dispatch({ type: 'SET_PRODUCTION_READY', payload: { playerId: localId, ready: !localReady } });
    };

    const forceStart = () => {
        dispatch({ type: 'START_ACTION_PHASE' });
    };

    const readyCount = activePlayers.filter(p => readySet.has(String(p.id))).length;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.96)',
            zIndex: 7000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', color: '#00ff00',
            padding: '20px'
        }}>
            <div style={{
                width: '100%', maxWidth: '640px',
                border: '2px solid #00ff00',
                backgroundColor: 'rgba(0, 20, 0, 0.85)',
                boxShadow: '0 0 40px rgba(0,255,0,0.25)',
                padding: '30px',
                display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#00ff00', fontSize: '0.85rem', letterSpacing: '4px', marginBottom: '6px' }}>
                        PRETURNO
                    </div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', letterSpacing: '2px', textShadow: '0 0 10px #00ff00' }}>
                        FASE DE PRODUCCIÓN
                    </h1>
                </div>

                <p style={{ color: '#aaffaa', fontSize: '0.9rem', lineHeight: 1.6, textAlign: 'center', margin: 0 }}>
                    Todos los comandantes producen suministros <strong>en simultáneo</strong>, combinando
                    materias primas + tecnologías. Cada suministro queda radicado en el país de origen
                    de la materia prima. <strong>Durante la ronda ya no podrás producir</strong>, así que
                    decidí ahora qué vas a necesitar.
                </p>

                {/* Lista de comandantes y su estado */}
                <div style={{ border: '1px solid #004400', backgroundColor: 'rgba(0,10,0,0.6)', padding: '12px' }}>
                    <div style={{ color: '#00aa00', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>
                        Comandantes listos [{readyCount}/{activePlayers.length}]
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {activePlayers.map(p => {
                            const ready = readySet.has(String(p.id));
                            const isLocal = String(p.id) === String(localId);
                            return (
                                <div key={p.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '6px 10px',
                                    backgroundColor: isLocal ? 'rgba(0,50,0,0.5)' : 'transparent',
                                    borderBottom: '1px solid #002200'
                                }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: p.color }} />
                                        {p.name}{isLocal ? ' (TÚ)' : ''}
                                    </span>
                                    <span style={{ color: ready ? '#00ff00' : '#666', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                        {ready ? 'LISTO ✓' : 'PRODUCIENDO...'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {isSpectator ? (
                    <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                        MODO OBSERVADOR — esperando a que los comandantes terminen de producir...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={onOpenInventory}
                                style={{
                                    flex: 1, minWidth: '180px', padding: '14px',
                                    backgroundColor: 'rgba(0,20,0,0.8)', color: '#00ff00',
                                    border: '1px solid #00ff00', cursor: 'pointer',
                                    fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1rem',
                                    textTransform: 'uppercase', letterSpacing: '1px'
                                }}
                            >
                                Producir suministros
                            </button>
                            <button
                                onClick={toggleReady}
                                style={{
                                    flex: 1, minWidth: '180px', padding: '14px',
                                    backgroundColor: localReady ? '#333' : '#00ff00',
                                    color: localReady ? '#00ff00' : '#000',
                                    border: `1px solid ${localReady ? '#00ff00' : 'transparent'}`,
                                    cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold',
                                    fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px',
                                    boxShadow: localReady ? 'none' : '0 0 15px rgba(0,255,0,0.4)'
                                }}
                            >
                                {localReady ? 'Cancelar listo' : 'Estoy listo'}
                            </button>
                        </div>

                        {isHost && (
                            <button
                                onClick={forceStart}
                                title="Salvaguarda: inicia la ronda aunque falten comandantes por confirmar (AFK)."
                                style={{
                                    padding: '10px',
                                    backgroundColor: 'transparent', color: '#ffaa00',
                                    border: '1px dashed #ffaa0066', cursor: 'pointer',
                                    fontFamily: 'monospace', fontSize: '0.8rem',
                                    textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85
                                }}
                            >
                                Forzar inicio de la ronda (anfitrión)
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
