import React from 'react';
import { REGIONS } from '../../../../data/mapRegions';

interface NuclearDesignInfoModalProps {
    locationId: string | null;
    onClose: () => void;
}

export const NuclearDesignInfoModal: React.FC<NuclearDesignInfoModalProps> = ({
    locationId,
    onClose
}) => {
    if (!locationId) return null;

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
                backgroundColor: '#1a0a00',
                border: '3px solid #ff9100',
                padding: '30px',
                width: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(255, 145, 0, 0.4)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#ff9100', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>☢️ DISEÑO DE ARMAS NUCLEARES INTERCONTINENTALES</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#ff9100', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

                <div style={{ backgroundColor: '#000', padding: '20px', marginBottom: '20px', border: '1px solid #442200', borderRadius: '4px' }}>
                    <div style={{ color: '#ff9100', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        ARCHIVOS CLASIFICADOS
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>
                        Ubicación: {REGIONS.find(r => r.id === locationId)?.title}
                    </div>
                </div>

                <div style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px' }}>
                    En esta ubicación se encuentran los viejos archivos de diseño necesarios para construir misiles capaces de impactar con armas nucleares cualquier parte del mundo. Para completar el diseño hay que desarrollar instalaciones con la capacidad computacional necesaria para realizar los cálculos y simulaciones necesarias.
                </div>

                <div style={{
                    backgroundColor: '#1a0a00',
                    padding: '15px',
                    border: '1px solid #ff9100',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: '#ff9100', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        REQUISITOS PARA COMPLETAR EL DISEÑO:
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: '1.8' }}>
                        • Control del territorio<br />
                        • Electrónica Avanzada (Industria Electrónica)<br />
                        • Semiconductores (con ruta de suministro a la ubicación)
                    </div>
                </div>

                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#ff9100',
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
                        e.currentTarget.style.backgroundColor = '#cc7700';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ff9100';
                    }}
                >
                    ENTENDIDO
                </button>
            </div>
        </div>
    );
};
