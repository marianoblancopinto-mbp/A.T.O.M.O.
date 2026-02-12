import React from 'react';

interface YearStartOverlayProps {
    year: number | null;
    onStart: () => void;
}

export const YearStartOverlay: React.FC<YearStartOverlayProps> = ({
    year,
    onStart
}) => {
    if (year === null) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#000',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            zIndex: 10000, fontFamily: 'monospace',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <div style={{
                textAlign: 'center',
                borderTop: '2px solid #00ff00',
                borderBottom: '2px solid #00ff00',
                padding: '60px 100px',
                backgroundColor: 'rgba(0, 20, 0, 0.5)',
                boxShadow: '0 0 50px rgba(0, 255, 0, 0.2)'
            }}>
                <div style={{ color: '#00ff00', fontSize: '1.2rem', letterSpacing: '5px', marginBottom: '20px', opacity: 0.7 }}>
                    TRANSMISIÓN ENTRANTE...
                </div>
                <h1 style={{
                    color: '#fff',
                    fontSize: '6rem',
                    margin: 0,
                    letterSpacing: '15px',
                    textShadow: '0 0 30px rgba(255, 255, 255, 0.4)'
                }}>
                    AÑO {year}
                </h1>
                <div style={{ color: '#00ff00', fontSize: '1rem', marginTop: '30px', letterSpacing: '2px' }}>
                    RECONFIGURANDO ORDEN DE OPERACIONES GLOBAL
                </div>
            </div>

            <button
                onClick={onStart}
                style={{
                    marginTop: '50px',
                    padding: '15px 50px',
                    backgroundColor: '#00ff00',
                    color: '#000',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                    letterSpacing: '5px',
                    transition: 'all 0.3s',
                    boxShadow: '0 0 20px rgba(0, 255, 0, 0.4)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00ff00';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.4)';
                }}
            >
                COMENZAR
            </button>
        </div>
    );
};
