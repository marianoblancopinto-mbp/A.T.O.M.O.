import React from 'react';

interface AntarcticaInfoModalProps {
    onClose: () => void;
    onContinue: () => void;
    hasControl: boolean;
}

export const AntarcticaInfoModal: React.FC<AntarcticaInfoModalProps> = ({
    onClose,
    onContinue,
    hasControl
}) => {
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
                backgroundColor: '#001a1a',
                border: '3px solid #00ffff',
                padding: '30px',
                width: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(0, 255, 255, 0.4)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#00ffff', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>❄️ RUTA ANTÁRTICA</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#00ffff', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

                <div style={{ backgroundColor: '#000', padding: '20px', marginBottom: '20px', border: '1px solid #004444', borderRadius: '4px' }}>
                    <div style={{ color: '#00ffff', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        ARCHIVOS CLASIFICADOS
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>
                        Ubicación: Base Austral
                    </div>
                </div>

                <div style={{ color: '#aaa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px' }}>
                    Tener dominio sobre las bases militares más australes del mundo nos permitirá navegar seguramente por el océano antártico, pudiendo establecer una RUTA DE SUMINISTROS entre los países del sur, siempre y cuando podamos mantener una Armada ejemplar y la tecnología necesaria para monitorear el área.
                </div>

                <div style={{
                    backgroundColor: '#001a1a',
                    padding: '15px',
                    border: '1px solid #00ffff',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: '#00ffff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        REQUISITOS PARA ESTABLECER LA RUTA:
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: '1.8' }}>
                        • Control de Chile, Argentina, Australia y Sudáfrica<br />
                        • Industria Pesada y Electrónica<br />
                        • Hierro y Semiconductores (con ruta de suministro a la base)
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: 'transparent',
                            color: '#00ffff',
                            border: '1px solid #00ffff',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            letterSpacing: '2px',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                        }}
                    >
                        REGRESAR
                    </button>
                    <button
                        onClick={onContinue}
                        disabled={!hasControl}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: hasControl ? '#00ffff' : '#003333',
                            color: hasControl ? '#000' : '#006666',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: hasControl ? 'pointer' : 'not-allowed',
                            fontSize: '1rem',
                            letterSpacing: '2px',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            boxShadow: hasControl ? '0 0 15px rgba(0, 255, 255, 0.3)' : 'none'
                        }}
                    >
                        CONTINUAR
                    </button>
                </div>
            </div>
        </div>
    );
};
