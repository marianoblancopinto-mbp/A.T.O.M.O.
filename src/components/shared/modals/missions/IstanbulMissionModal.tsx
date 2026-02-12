import React, { useState } from 'react';
import { MissionModalBase } from '../MissionModalBase';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';
import { REGIONS } from '../../../../data/mapRegions';
import type { SpecialCard } from '../../../../types/playerTypes';

interface IstanbulMissionModalProps {
    onClose: () => void;
    onSuccess: (playerName: string) => void;
}

export const IstanbulMissionModal: React.FC<IstanbulMissionModalProps> = ({
    onClose,
    onSuccess
}) => {
    const { state, dispatch } = useGameContext();
    const { players, currentPlayerIndex, owners } = state;
    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);

    const [selectedBridgeCards, setSelectedBridgeCards] = useState<{
        techId: string | null;
        rawId: string | null;
    }>({ techId: null, rawId: null });

    const player = players[currentPlayerIndex];
    if (!player) return null;

    const hasTurkey = owners['turquia'] === player.id;
    const hasGreece = owners['grecia'] === player.id;

    // Tecnologías - No route validation required
    const heavyIndustryCards = technologies.filter(c => c.type === 'INDUSTRIA_PESADA' && !c.usedThisTurn);

    // Materias Primas - Validated for Route to Turkey OR Greece
    const ironCards = rawMaterials.filter(c => c.type === 'HIERRO' && !c.usedThisTurn);

    const canComplete = hasTurkey && hasGreece && selectedBridgeCards.techId && selectedBridgeCards.rawId;

    const handleComplete = () => {
        if (!canComplete || !selectedBridgeCards.techId || !selectedBridgeCards.rawId) return;

        // Consume Cards
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedBridgeCards.techId, category: 'technology' }
        });
        dispatch({
            type: 'MARK_CARD_AS_USED',
            payload: { cardId: selectedBridgeCards.rawId, category: 'rawMaterial' }
        });

        // Add Special Card & Active Mission
        const newCard: SpecialCard = {
            id: `special-istanbul-${Date.now()}`,
            type: 'PUENTE_BOSFORO',
            name: 'PUENTE DEL BÓSFORO',
            originCountry: 'turquia',
            description: 'Conexión terrestre permanente entre Grecia y Turquía. Permite ataque/movimiento directo.',
            createdAt: Date.now()
        };

        const updatedSpecialCards = [...player.specialCards, newCard];
        const updatedActiveMissions = [...player.activeSpecialMissions, { id: 'refundacion_estanbul', baseRegionId: 'turquia', startTime: Date.now() }];

        dispatch({
            type: 'UPDATE_PLAYER',
            payload: {
                index: currentPlayerIndex,
                data: {
                    specialCards: updatedSpecialCards,
                    activeSpecialMissions: updatedActiveMissions
                }
            }
        });

        onSuccess(player.name);
        onClose();
    };

    return (
        <MissionModalBase title="REFUNDACIÓN DE ESTAMBUL" type="activation" onClose={onClose}>
            <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic', marginBottom: '20px' }}>
                "Reunificar el antiguo Egeo bajo una nueva capital. Requiere estructuras masivas para cruzar el Bósforo."
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Requirements Status */}
                <div style={{ flex: 1, backgroundColor: '#000', padding: '15px', border: '1px solid #442200' }}>
                    <div style={{ color: '#ff9100', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ff9100', paddingBottom: '5px' }}>
                        REQUISITOS
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <div style={{ color: hasTurkey ? '#00ff00' : '#ff4444' }}>
                            {hasTurkey ? '✅' : '❌'} Control Turquía
                        </div>
                        <div style={{ color: hasGreece ? '#00ff00' : '#ff4444' }}>
                            {hasGreece ? '✅' : '❌'} Control Grecia
                        </div>
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '15px' }}>
                        RECURSOS NECESARIOS:
                    </div>
                    <ul style={{ color: '#ccc', fontSize: '0.85rem', paddingLeft: '20px' }}>
                        <li>1x Industria Pesada: Seleccionar</li>
                        <li>1x Hierro: Ruta Válida a Turquía o Grecia</li>
                    </ul>
                </div>

                {/* Selection Panel */}
                <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: '10px' }}>

                    {/* Tech Selection */}
                    <div>
                        <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.9rem' }}>1. TECNOLOGÍA: IND. PESADA</div>
                        <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {heavyIndustryCards.length > 0 ? heavyIndustryCards.map(c => (
                                <div key={c.id}
                                    onClick={() => setSelectedBridgeCards(prev => ({ ...prev, techId: c.id }))}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: selectedBridgeCards.techId === c.id ? '#ff9100' : '#221100',
                                        color: selectedBridgeCards.techId === c.id ? '#000' : '#ccc',
                                        border: `1px solid ${selectedBridgeCards.techId === c.id ? '#ff9100' : '#663300'}`,
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        display: 'flex', justifyContent: 'space-between'
                                    }}
                                >
                                    <span>{c.type.replace(/_/g, ' ')} {c.country ? `(${REGIONS.find(r => r.id === c.country)?.title || c.country})` : ''}</span>
                                </div>
                            )) : <div style={{ color: '#555', fontSize: '0.8rem' }}>No disponible</div>}
                        </div>
                    </div>

                    {/* Raw Material Selection */}
                    <div>
                        <div style={{ color: '#aaa', marginBottom: '5px', fontSize: '0.9rem' }}>2. MATERIA PRIMA: HIERRO</div>
                        <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {ironCards.length > 0 ? ironCards.map(c => {
                                const isSelected = selectedBridgeCards.rawId === c.id;

                                // Route Valid to Turkey OR Greece
                                const routeToTurkey = owners['turquia'] === player.id ? checkRoute(c.country, 'turquia', player.id) : false;
                                const routeToGreece = owners['grecia'] === player.id ? checkRoute(c.country, 'grecia', player.id) : false;
                                const hasRoute = routeToTurkey || routeToGreece;

                                return (
                                    <div key={c.id}
                                        onClick={() => hasRoute && setSelectedBridgeCards(prev => ({ ...prev, rawId: c.id }))}
                                        style={{
                                            padding: '8px',
                                            backgroundColor: isSelected ? '#ff9100' : (hasRoute ? '#221100' : '#220000'),
                                            color: isSelected ? '#000' : (hasRoute ? '#ccc' : '#666'),
                                            border: `1px solid ${isSelected ? '#ff9100' : (hasRoute ? '#663300' : '#440000')}`,
                                            cursor: hasRoute ? 'pointer' : 'not-allowed',
                                            fontSize: '0.8rem',
                                            fontFamily: 'monospace',
                                            display: 'flex', justifyContent: 'space-between',
                                            marginBottom: '5px'
                                        }}
                                    >
                                        <span>{c.type.replace(/_/g, ' ')} {c.country ? `(${REGIONS.find(r => r.id === c.country)?.title || c.country})` : ''}</span>
                                        {!hasRoute && <span style={{ color: '#ff4444', fontSize: '0.7em' }}>SIN RUTA</span>}
                                    </div>
                                );
                            }) : <div style={{ color: '#555', fontSize: '0.8rem' }}>No disponible</div>}
                        </div>
                    </div>

                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                <button
                    onClick={onClose}
                    style={{
                        flex: 1, padding: '15px', backgroundColor: 'transparent',
                        color: '#ccc', border: '1px solid #666', cursor: 'pointer'
                    }}>
                    CANCELAR
                </button>
                <button
                    disabled={!canComplete}
                    onClick={handleComplete}
                    style={{
                        flex: 1, padding: '15px',
                        backgroundColor: !canComplete ? '#221100' : '#ff9100',
                        color: !canComplete ? '#442200' : '#000',
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: !canComplete ? 'not-allowed' : 'pointer',
                        boxShadow: !canComplete ? 'none' : '0 0 20px rgba(255, 145, 0, 0.4)'
                    }}
                >
                    ESTABLECER CONEXIÓN
                </button>
            </div>
        </MissionModalBase>
    );
};
