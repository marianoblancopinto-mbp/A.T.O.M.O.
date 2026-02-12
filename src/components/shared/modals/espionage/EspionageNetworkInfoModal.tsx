import React from 'react';
import { REGIONS } from '../../../../data/mapRegions';
import { AGENCY_NAMES } from '../../../../data/constants';

interface EspionageNetworkInfoModalProps {
    hqId: string | null;
    onClose: () => void;
}

export const EspionageNetworkInfoModal: React.FC<EspionageNetworkInfoModalProps> = ({
    hqId,
    onClose
}) => {
    if (!hqId) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 7000,
            fontFamily: 'monospace'
        }}>
            <div style={{
                backgroundColor: '#001122',
                border: '3px solid #00ffff',
                padding: '30px',
                width: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.4)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#00ffff', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>🏳️ RED DE ESPIONAJE</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#00ffff', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

                <div style={{ backgroundColor: '#000', padding: '20px', marginBottom: '20px', border: '1px solid #004444', borderRadius: '4px' }}>
                    <div style={{ color: '#00ffff', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        {AGENCY_NAMES[hqId] || 'AGENCIA DESCONOCIDA'}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>
                        Sede: {REGIONS.find(r => r.id === hqId)?.title}
                    </div>
                </div>

                <div style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px' }}>
                    En esta región se encuentran los remanentes de la infraestructura y red de espionaje de la agencia{' '}
                    <span style={{ color: '#00ffff', fontWeight: 'bold' }}>
                        {AGENCY_NAMES[hqId]?.split(' ')[0] || 'desconocida'}
                    </span>
                    . Esta puede ser reactivada si se le suministran los insumos necesarios para restituir los sistemas de comunicación.
                </div>

                <div style={{
                    backgroundColor: '#001a1a',
                    padding: '15px',
                    border: '1px solid #00ffff',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: '#00ffff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        REQUISITOS PARA REACTIVACIÓN:
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: '1.8' }}>
                        \u2B22 Control del territorio<br />
                        \u2B22 Electrónica Avanzada (Industria Electrónica)<br />
                        \u2B22 Semiconductores (con ruta de suministro a la sede)
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#1a1a00',
                    padding: '12px',
                    border: '1px solid #ff9900',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: '#ff9900', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        Úñ IMPORTANTE
                    </div>
                    <div style={{ color: '#ffcc66', fontSize: '0.75rem', marginTop: '5px' }}>
                        Cada locación puede usarse solo UNA vez por jugador durante toda la partida (máximo 4 reportes totales).
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#00ffff',
                        color: '#000',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        letterSpacing: '2px',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#00cccc';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#00ffff';
                    }}
                >
                    ENTENDIDO
                </button>
            </div>
        </div>
    );
};
