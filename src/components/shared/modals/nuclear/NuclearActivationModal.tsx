import React, { useState, useEffect } from 'react';
import { MissionModalBase } from '../MissionModalBase';
import { useGameContext } from '../../../../context/GameContext';
import { useGameActions } from '../../../../hooks/useGameActions';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';


interface NuclearActivationModalProps {
    show: string | null; // regionId or null
    onClose: () => void;
    playerIndex?: number;
}


export const NuclearActivationModal: React.FC<NuclearActivationModalProps> = ({
    show,
    onClose,
    playerIndex
}) => {

    const { state } = useGameContext();
    const { players, currentPlayerIndex: stateCurrentPlayerIndex } = state;
    const effectivePlayerIndex = playerIndex ?? stateCurrentPlayerIndex;

    const { checkRoute } = useSupplyRoute();
    const { technologies, rawMaterials } = usePlayerResources(effectivePlayerIndex);


    const [selectedActivationCards, setSelectedActivationCards] = useState<{
        techId: string | null;
        rawId: string | null;
    }>({ techId: null, rawId: null });

    // Reset selection when modal opens/closes
    useEffect(() => {
        if (!show) {
            setSelectedActivationCards({ techId: null, rawId: null });
        }
    }, [show]);

    if (!show) return null;

    const player = players[effectivePlayerIndex];
    if (!player) return null;


    // Filter valid requirements
    const electronicaCards = technologies.filter(t => t.type === 'INDUSTRIA_ELECTRONICA' && !t.usedThisTurn);
    // Add route check for conductores - Need to pass show (which is regionId)
    const conductoresCards = rawMaterials.filter(r => r.type === 'CONDUCTORES_SEMICONDUCTORES' && !r.usedThisTurn && checkRoute(r.country, show!, effectivePlayerIndex));



    const canActivate = selectedActivationCards.techId && selectedActivationCards.rawId;

    const gameActions = useGameActions();

    const handleConfirm = () => {
        if (!show || !selectedActivationCards.techId || !selectedActivationCards.rawId) return;
        const regionId = show;

        gameActions.activateNuclearArsenal(regionId, {
            techId: selectedActivationCards.techId,
            rawId: selectedActivationCards.rawId
        });

        onClose();
    };

    return (
        <MissionModalBase 
            title="ACTIVAR ARSENAL NUCLEAR" 
            type="activation" 
            onClose={onClose}
            width="700px"
            customStyles={{ 
                border: '2px solid #00ff00', 
                boxShadow: '0 0 50px rgba(0, 255, 0, 0.2)', 
                backgroundColor: '#0a1a0a' 
            }}
        >
            <div style={{ textAlign: 'center', color: '#00ff00', fontSize: '0.9em', marginBottom: '20px' }}>
                Selecciona los componentes necesarios para fabricar Armas Nucleares Intercontinentales.
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    {/* TECH SECTION */}
                    <div style={{ flex: 1, backgroundColor: '#000', padding: '10px', borderRadius: '5px' }}>
                        <h4 style={{ color: '#aaa', borderBottom: '1px solid #333', marginBottom: '10px' }}>Tecnología: Electrónica Avanzada</h4>
                        {electronicaCards.length === 0 ? (
                            <div style={{ color: '#ff4444' }}>No disponible</div>
                        ) : (
                            electronicaCards.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedActivationCards(prev => ({ ...prev, techId: c.id }))}
                                    style={{
                                        padding: '8px',
                                        marginBottom: '5px',
                                        backgroundColor: selectedActivationCards.techId === c.id ? '#004400' : '#222',
                                        border: selectedActivationCards.techId === c.id ? '1px solid #00ff00' : '1px solid #444',
                                        cursor: 'pointer',
                                        color: '#fff'
                                    }}
                                >
                                    {c.country}
                                </div>
                            ))
                        )}
                    </div>

                    {/* RAW SECTION */}
                    <div style={{ flex: 1, backgroundColor: '#000', padding: '10px', borderRadius: '5px' }}>
                        <h4 style={{ color: '#aaa', borderBottom: '1px solid #333', marginBottom: '10px' }}>Materia: Conductores (Con Ruta)</h4>
                        {conductoresCards.length === 0 ? (
                            <div style={{ color: '#ff4444' }}>No disponible (Falta ruta o recurso)</div>
                        ) : (
                            conductoresCards.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedActivationCards(prev => ({ ...prev, rawId: c.id }))}
                                    style={{
                                        padding: '8px',
                                        marginBottom: '5px',
                                        backgroundColor: selectedActivationCards.rawId === c.id ? '#004400' : '#222',
                                        border: selectedActivationCards.rawId === c.id ? '1px solid #00ff00' : '1px solid #444',
                                        cursor: 'pointer',
                                        color: '#fff'
                                    }}
                                >
                                    {c.country}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: 'none',
                            border: '1px solid #666',
                            color: '#aaa',
                            cursor: 'pointer'
                        }}
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canActivate}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: canActivate ? '#00ff00' : '#222',
                            color: canActivate ? '#000' : '#666',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: canActivate ? 'pointer' : 'not-allowed'
                        }}
                    >
                        CONFIRMAR ACTIVACIÓN
                    </button>
                </div>
        </MissionModalBase>
    );
};
