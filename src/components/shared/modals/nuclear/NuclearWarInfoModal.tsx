import React from 'react';
import { REGIONS } from '../../../../data/mapRegions';
import { useGameContext } from '../../../../context/GameContext';
import { useSupplyRoute } from '../../../../hooks/useSupplyRoute';
import { usePlayerResources } from '../../../../hooks/usePlayerResources';


interface NuclearWarInfoModalProps {
    regionId: string;
    onClose: () => void;
    onActivate: (regionId: string) => void;
}


export const NuclearWarInfoModal: React.FC<NuclearWarInfoModalProps> = ({
    regionId,
    onClose,
    onActivate
}) => {
    const { state } = useGameContext();
    const { currentPlayerIndex, owners } = state;
    const { technologies, rawMaterials } = usePlayerResources(currentPlayerIndex);
    const { checkRoute } = useSupplyRoute();


    const hasElectronica = technologies.some(t => t.type === 'INDUSTRIA_ELECTRONICA' && !t.usedThisTurn);
    const validConductores = rawMaterials.filter(r =>
        r.type === 'CONDUCTORES_SEMICONDUCTORES' &&
        !r.usedThisTurn &&
        checkRoute(r.country, regionId, currentPlayerIndex)
    ).length > 0;

    const isOwner = owners[regionId] === currentPlayerIndex;

    const canActivate = isOwner && hasElectronica && validConductores;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 4000
        }}>
            <div style={{
                backgroundColor: '#0a0a0a',
                border: '2px solid #ff9100',
                borderRadius: '10px',
                padding: '30px',
                width: '450px',
                fontFamily: 'monospace',
                boxShadow: '0 0 50px rgba(255, 145, 0, 0.5)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #330000',
                    paddingBottom: '15px'
                }}>
                    <h2 style={{ margin: 0, color: '#ff9100', textTransform: 'uppercase', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5rem' }}>☢️</span>
                        Tecnología Nuclear Bélica
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ff9100',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        X
                    </button>
                </div>

                <div style={{
                    fontSize: '0.9rem',
                    color: '#ccc',
                    lineHeight: '1.6',
                    marginBottom: '20px'
                }}>
                    Este país cuenta con la tecnología necesaria para desarrollar armas nucleares con la capacidad
                    de impactar cualquier parte del mundo, potencialmente terminando la guerra.
                </div>

                <div style={{
                    backgroundColor: '#1a0a00',
                    border: '1px solid #ff9100',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '25px',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ marginBottom: '20px', textAlign: 'left', fontSize: '0.9rem', color: '#ccc' }}>
                        <strong>Requisitos de Activación:</strong>
                        <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                            <li style={{ color: isOwner ? '#00ff00' : '#ff4444' }}>
                                {isOwner ? '✓' : '✗'} Control del Territorio ({REGIONS.find(r => r.id === regionId)?.title || regionId})
                            </li>
                            <li style={{ color: hasElectronica ? '#00ff00' : '#ff4444' }}>
                                {hasElectronica ? '✓' : '✗'} Tecnología: Electrónica Avanzada
                            </li>
                            <li style={{ color: validConductores ? '#00ff00' : '#ff4444' }}>
                                {validConductores ? '✓' : '✗'} Materia: Conductores y Semiconductores (con ruta segura)
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => onActivate(regionId)}
                        disabled={!canActivate}
                        style={{
                            width: '100%',
                            padding: '15px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            backgroundColor: canActivate ? '#ff9100' : '#331100',
                            color: canActivate ? '#000' : '#663300',
                            border: canActivate ? 'none' : '1px solid #663300',
                            borderRadius: '6px',
                            cursor: canActivate ? 'pointer' : 'not-allowed',
                            textTransform: 'uppercase',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                            boxShadow: canActivate ? '0 0 20px rgba(255, 145, 0, 0.5)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (canActivate) {
                                e.currentTarget.style.backgroundColor = '#ffaa33';
                                e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 145, 0, 0.8)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (canActivate) {
                                e.currentTarget.style.backgroundColor = '#ff9100';
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 145, 0, 0.5)';
                            }
                        }}
                    >
                        {canActivate ? 'ACTIVAR ARSENAL' : 'REQUISITOS INCOMPLETOS'}
                    </button>
                </div>
            </div>
        </div>
    );
};
