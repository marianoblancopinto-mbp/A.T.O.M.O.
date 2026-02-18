import React from 'react';

interface GoldenDomeInfoModalProps {
    onClose: () => void;
    onContinue: () => void;
    hasControl: boolean;
}

export const GoldenDomeInfoModal: React.FC<GoldenDomeInfoModalProps> = ({
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
                backgroundColor: '#1a1a00',
                border: '3px solid #ffd700',
                padding: '30px',
                width: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 0 50px rgba(255, 215, 0, 0.4)',
                borderRadius: '8px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#ffd700', margin: 0, fontSize: '1.5rem', letterSpacing: '2px' }}>🛡️ CÚPULA DORADA</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#ffd700', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        X
                    </button>
                </div>

                <div style={{ backgroundColor: '#000', padding: '20px', marginBottom: '20px', border: '1px solid #665500', borderRadius: '4px' }}>
                    <div style={{ color: '#ffd700', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        ARCHIVOS CLASIFICADOS
                    </div>
                    <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>
                        Objetivo: Defensa Hemisférica Norte
                    </div>
                </div>

                <div style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '25px' }}>
                    La defensa del norte requiere una red impenetrable. Un sistema de defensa aérea coordinado entre las potencias de América del Norte creará una "Cúpula Dorada" capaz de interceptar cualquier amenaza. El control unificado de estos territorios es esencial para el despliegue de los sistemas de radar y baterías antiaéreas.
                </div>

                <div style={{
                    backgroundColor: '#1a1a00',
                    padding: '15px',
                    border: '1px solid #ffd700',
                    borderRadius: '4px',
                    marginBottom: '20px'
                }}>
                    <div style={{ color: '#ffd700', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        REQUISITOS OPERATIVOS:
                    </div>
                    <div style={{ color: '#fff', fontSize: '0.85rem', lineHeight: '1.8' }}>
                        • Control de Nueva York, California, Texas, Florida y Alaska<br />
                        • Industria Ligera y Electrónica Avanzada<br />
                        • Aluminio y Semiconductores (con ruta de suministro a la base)
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '12px',
                            backgroundColor: 'transparent',
                            color: '#ffd700',
                            border: '1px solid #ffd700',
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
                            backgroundColor: hasControl ? '#ffd700' : '#332b00',
                            color: hasControl ? '#000' : '#665500',
                            border: 'none',
                            fontWeight: 'bold',
                            cursor: hasControl ? 'pointer' : 'not-allowed',
                            fontSize: '1rem',
                            letterSpacing: '2px',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            boxShadow: hasControl ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none'
                        }}
                    >
                        CONTINUAR
                    </button>
                </div>
            </div>
        </div>
    );
};
