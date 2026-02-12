import React from 'react';
import { REGIONS } from '../../data/mapRegions';
import { TECHNOLOGY_DATA } from '../../data/productionData';
import { useGameContext } from '../../context/GameContext';
import type { TechnologyType } from '../../types/productionTypes';

interface TechnologiesModalProps {
    show: boolean;
    onClose: () => void;
    expandedTechnologies: Set<string>;
    setExpandedTechnologies: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const TechnologiesModal: React.FC<TechnologiesModalProps> = ({
    show,
    onClose,
    expandedTechnologies,
    setExpandedTechnologies
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
                border: '2px solid #00ff00',
                borderRadius: '10px',
                padding: '20px',
                width: window.innerWidth <= 768 ? '95%' : '500px',
                maxHeight: '80vh',
                overflowY: 'auto',
                fontFamily: 'monospace',
                boxShadow: '0 0 30px rgba(0, 255, 0, 0.5)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    borderBottom: '1px solid #003300',
                    paddingBottom: '10px'
                }}>
                    <h2 style={{ margin: 0, color: '#00ff00', textTransform: 'uppercase', fontSize: '1.2rem' }}>
                        TECNOLOGÍAS GLOBALES
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#00ff00',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        X
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {regionResources && Object.entries(regionResources.technologies).map(([tech, countries]) => {
                        const techKey = tech as TechnologyType;
                        const techData = TECHNOLOGY_DATA[techKey];
                        const isExpanded = expandedTechnologies.has(tech);

                        return (
                            <div key={tech}>
                                <button
                                    onClick={() => {
                                        setExpandedTechnologies(prev => {
                                            const newSet = new Set(prev);
                                            if (newSet.has(tech)) {
                                                newSet.delete(tech);
                                            } else {
                                                newSet.add(tech);
                                            }
                                            return newSet;
                                        });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px 15px',
                                        backgroundColor: isExpanded ? '#003300' : '#0a1a0a',
                                        color: '#00ff00',
                                        border: '1px solid #004400',
                                        cursor: 'pointer',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        textAlign: 'left',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#003300'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#003300' : '#0a1a0a'}
                                >
                                    <span style={{ fontWeight: 'bold' }}>
                                        {techData?.name || tech.replace(/_/g, ' ')}
                                    </span>
                                    <span style={{ color: '#888', fontSize: '0.8rem' }}>
                                        {isExpanded ? '▲' : '▼'} {countries.length} países
                                    </span>
                                </button>

                                {isExpanded && (
                                    <div style={{
                                        backgroundColor: '#0f0f0f',
                                        borderLeft: '2px solid #00ff00',
                                        marginLeft: '10px',
                                        padding: '10px 15px'
                                    }}>
                                        {countries.map((countryId: string) => {
                                            const regionData = REGIONS.find(r => r.id === countryId);
                                            const owner = owners[countryId];
                                            let ownerPlayer = null;
                                            if (typeof owner === 'number') {
                                                ownerPlayer = players[owner];
                                            } else if (typeof owner === 'string') {
                                                ownerPlayer = players.find(p => p.id === owner) || null;
                                            }
                                            const isNuclearWar = tech === 'CENTRALES_NUCLEARES' && regionResources?.nuclearWarCapable.includes(countryId);

                                            return (
                                                <div
                                                    key={countryId}
                                                    style={{
                                                        padding: '5px 0',
                                                        borderBottom: '1px solid #002200',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <span style={{ color: '#aaffaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        {regionData?.title || countryId}
                                                        {isNuclearWar && (
                                                            <span style={{ color: '#ff9100', fontSize: '0.9rem' }} title="Capacidad bélica nuclear">☢️</span>
                                                        )}
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
