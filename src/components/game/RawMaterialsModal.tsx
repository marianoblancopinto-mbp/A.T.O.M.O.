import React from 'react';
import { REGIONS } from '../../data/mapRegions';
import { RAW_MATERIAL_DATA } from '../../data/productionData';
import { useGameContext } from '../../context/GameContext';
import type { RawMaterialType } from '../../types/productionTypes';

interface RawMaterialsModalProps {
    show: boolean;
    onClose: () => void;
    expandedRawMaterials: Set<string>;
    setExpandedRawMaterials: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const RawMaterialsModal: React.FC<RawMaterialsModalProps> = ({
    show,
    onClose,
    expandedRawMaterials,
    setExpandedRawMaterials
}) => {
    const { state } = useGameContext();
    const { regionResources, owners, players } = state;

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000
        }}>
            <div style={{
                backgroundColor: '#0a0a0a',
                border: '2px solid #d500f9',
                borderRadius: '10px',
                padding: '20px',
                width: '500px',
                maxHeight: '80vh',
                overflowY: 'auto',
                fontFamily: 'monospace',
                boxShadow: '0 0 30px rgba(213, 0, 249, 0.5)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #330033',
                    paddingBottom: '10px'
                }}>
                    <h2 style={{ margin: 0, color: '#d500f9', textTransform: 'uppercase', fontSize: '1.2rem' }}>
                        MATERIAS PRIMAS GLOBALES
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#d500f9',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        X
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {regionResources && Object.entries(regionResources.rawMaterials).map(([material, countries]) => {
                        const matKey = material as RawMaterialType;
                        const matData = RAW_MATERIAL_DATA[matKey];
                        const isExpanded = expandedRawMaterials.has(material);

                        return (
                            <div key={material}>
                                <button
                                    onClick={() => {
                                        setExpandedRawMaterials(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(material)) {
                                                newSet.delete(material);
                                            } else {
                                                newSet.add(material);
                                            }
                                            return newSet;
                                        });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 15px',
                                        backgroundColor: isExpanded ? '#330033' : '#1a0a1a',
                                        color: '#d500f9',
                                        border: '1px solid #440044',
                                        cursor: 'pointer',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        textAlign: 'left',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#330033'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#330033' : '#1a0a1a'}
                                >
                                    <span style={{ fontWeight: 'bold' }}>
                                        {matData?.name || material.replace(/_/g, ' ')}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '0.8rem' }}>
                                        {isExpanded ? '▲' : '▼'} {countries.length} países
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div style={{
                                        backgroundColor: '#0f0f0f',
                                        borderLeft: '2px solid #d500f9',
                                        marginLeft: '10px',
                                        padding: '10px 15px'
                                    }}>
                                        {countries.map((countryId: string) => {
                                            const regionData = REGIONS.find(r => r.id === countryId);
                                            const owner = owners[countryId];
                                            const ownerPlayer = owner !== undefined && owner !== null ? players[owner] : null;

                                            return (
                                                <div
                                                    key={countryId}
                                                    style={{
                                                        padding: '5px 0',
                                                        borderBottom: '1px solid #220022',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{ color: '#aaffaa' }}>
                                                        {regionData?.title || countryId}
                                                    </span>
                                                    {ownerPlayer && (
                                                        <span style={{
                                                            color: ownerPlayer.color,
                                                            fontSize: '0.8rem',
                                                            textShadow: `0 0 5px ${ownerPlayer.color}`
                                                        }}>
                                                            {ownerPlayer.name}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
