import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';

interface GameSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameId: string;
    isHost: boolean;
    currentSettings: any;
}

type SettingsSection = 'abandonment' | 'ai_config' | 'game_mode';

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
    isOpen,
    onClose,
    gameId,
    isHost,
    currentSettings
}) => {
    const [activeSection, setActiveSection] = useState<SettingsSection>('abandonment');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const abandonmentMode = currentSettings?.abandonmentMode || 'redistribute';
    const aiDifficulty = currentSettings?.aiDifficulty ?? 50;
    const gameMode = currentSettings?.gameMode || 'classic';

    const handleUpdateSetting = async (key: string, value: any) => {
        if (!isHost) return;
        setIsSaving(true);
        try {
            const newSettings = { ...currentSettings, [key]: value };
            const { error } = await supabase
                .from('games')
                .update({ settings: newSettings })
                .eq('id', gameId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating settings:', err);
            alert('Error al guardar la configuración.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- SHARED STYLES (COHESIVE WITH RULES MODAL) ---
    const sectionContainerStyle: React.CSSProperties = {
        color: '#ccc',
        lineHeight: '1.7',
        fontSize: '0.95rem',
    };

    const h3Style: React.CSSProperties = {
        color: '#00ff00',
        borderBottom: '1px solid #00ff0044',
        paddingBottom: '8px',
        marginTop: '25px',
        marginBottom: '12px',
        fontSize: '1.1rem',
        letterSpacing: '2px',
    };

    const tipStyle: React.CSSProperties = {
        backgroundColor: 'rgba(0, 255, 0, 0.05)',
        border: '1px solid #00ff0044',
        borderLeft: '3px solid #00ff00',
        padding: '12px 16px',
        marginTop: '15px',
        marginBottom: '15px',
        fontSize: '0.85rem',
        color: '#88ff88',
    };

    const warningStyle: React.CSSProperties = {
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        border: '1px solid #ff000044',
        borderLeft: '3px solid #ff0000',
        padding: '12px 16px',
        marginTop: '15px',
        marginBottom: '15px',
        fontSize: '0.85rem',
        color: '#ff8888',
    };

    const controlRowStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        marginTop: '20px'
    };

    const buttonStyle = (active: boolean): React.CSSProperties => ({
        padding: '10px 20px',
        backgroundColor: active ? '#00ff00' : 'rgba(0, 20, 0, 0.8)',
        border: '1px solid #00ff00',
        color: active ? '#000' : '#00ff00',
        cursor: isHost ? 'pointer' : 'default',
        fontSize: '0.85rem',
        fontFamily: 'inherit',
        fontWeight: 'bold',
        transition: 'all 0.2s',
        opacity: isHost ? 1 : 0.5,
        letterSpacing: '1px'
    });


    const renderAbandonment = () => (
        <div style={sectionContainerStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>GESTIÓN DE ABANDONOS</h3>
            <p>
                Define qué sucede con la soberanía de los territorios cuando un comandante es removido 
                o abandona la operación militar.
            </p>
            
            <div style={controlRowStyle}>
                <button 
                    style={buttonStyle(abandonmentMode === 'redistribute')}
                    onClick={() => {
                        handleUpdateSetting('abandonmentMode', 'redistribute');
                        handleUpdateSetting('aiActive', false);
                    }}
                >
                    REDISTRIBUCIÓN DE PAÍSES
                </button>
                <button 
                    style={buttonStyle(abandonmentMode === 'neutralize')}
                    onClick={() => {
                        handleUpdateSetting('abandonmentMode', 'neutralize');
                        handleUpdateSetting('aiActive', true);
                    }}
                >
                    ABANDONO DE PAÍSES
                </button>
            </div>

            <div style={{ marginTop: '20px' }}>
                {abandonmentMode === 'redistribute' ? (
                    <div style={tipStyle}>
                        <strong style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem', color: '#00ff00' }}>SISTEMA DE ANEXIÓN DIRECTA</strong>
                        <p><strong>LOGÍSTICA:</strong> Cuando un comandante abandona, sus países son repartidos entre los jugadores en línea de forma inmediata y equitativa.</p>
                        <p><strong>RESCATE DE ACTIVOS:</strong> Todo el inventario de suministros y tecnologías del jugador saliente se pierde, pero sus territorios quedan bajo protección aliada.</p>
                        <p><strong>VENTAJA:</strong> No se detiene el avance de la partida. El mapa se mantiene consolidado entre los comandantes activos.</p>
                    </div>
                ) : (
                    <div style={warningStyle}>
                        <strong style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem', color: '#ff4444' }}>ABANDONO TERRITORIAL Y DEFENSA IA</strong>
                        <p><strong>LOGÍSTICA:</strong> Los territorios del comandante saliente se vuelven NEUTRALES (libres de mando humano). </p>
                        <p><strong>FUERZAS LOCALES:</strong> Las <strong>Fuerzas Locales</strong> toman el control defensivo de estos países. Si intentas conquistarlos, utilizarán tácticas avanzadas para defender su territorio.</p>
                        <p><strong>PUNIZACIÓN:</strong> Los jugadores deben gastar turnos y recursos militares para reconquistar estos países si quieren recuperar su producción.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderAiConfig = () => (
        <div style={sectionContainerStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>CONFIGURACIÓN IA</h3>
            <p>
                ESTABLECE EL NIVEL DE RESPUESTA TÁCTICA DE LAS FUERZAS LOCALES.
            </p>
            
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'rgba(0,255,0,0.05)', border: '1px solid #00ff0044' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#00ff00', fontWeight: 'bold' }}>NIVEL DE DIFICULTAD</span>
                    <span style={{ color: '#fff', fontSize: '1.2rem', fontFamily: 'monospace' }}>{aiDifficulty}%</span>
                </div>
                
                <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={aiDifficulty}
                    onChange={(e) => handleUpdateSetting('aiDifficulty', parseInt(e.target.value))}
                    disabled={!isHost}
                    style={{
                        width: '100%',
                        cursor: isHost ? 'pointer' : 'default',
                        accentColor: '#00ff00'
                    }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', color: '#888' }}>
                    <span>ESTÁNDAR (0%)</span>
                    <span>TÁCTICA AVANZADA (100%)</span>
                </div>
            </div>

            <div style={tipStyle}>
                <strong style={{ display: 'block', marginBottom: '5px', color: '#00ff00' }}>ANÁLISIS DE INTELIGENCIA:</strong>
                <p style={{ margin: 0 }}>Valores más altos otorgan a las Fuerzas Locales una mayor capacidad predictiva sobre las tácticas del enemigo, optimizando la conservación de recursos y la toma de decisiones en combate.</p>
            </div>
        </div>
    );

    const renderGameMode = () => (
        <div style={sectionContainerStyle}>
            <h3 style={{ ...h3Style, marginTop: 0 }}>MODOS DE JUEGO</h3>
            <p>
                Selecciona la dinámica de distribución territorial inicial para la óperacion.
            </p>
            
            <div style={controlRowStyle}>
                <button 
                    style={buttonStyle(gameMode === 'classic')}
                    onClick={() => handleUpdateSetting('gameMode', 'classic')}
                >
                    CLÁSICO
                </button>
                <button 
                    style={buttonStyle(gameMode === 'chaos')}
                    onClick={() => handleUpdateSetting('gameMode', 'chaos')}
                >
                    CAOS GLOBAL
                </button>
            </div>

            <div style={{ marginTop: '20px' }}>
                {gameMode === 'classic' ? (
                    <div style={tipStyle}>
                        <strong style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem', color: '#00ff00' }}>DISTRIBUCIÓN GLOBAL</strong>
                        <p><strong>INICIO:</strong> Todos los dominios territoriales del mapa son repartidos de manera equitativa entre los comandantes activos antes de iniciar hostilidades.</p>
                        <p><strong>FOCO TÁCTICO:</strong> Conflictividad inmediata en múltiples frentes. Cada comandante debe gestionar defensas extensas y recursos distribuidos.</p>
                    </div>
                ) : (
                    <div style={warningStyle}>
                        <strong style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem', color: '#ff4444' }}>AISLAMIENTO INICIAL</strong>
                        <p><strong>INICIO:</strong> Cada comandante comienza con el control de un (1) único territorio asignado al azar. El resto del planeta es <strong>Tierra de Nadie</strong>.</p>
                        <p><strong>DEFENSA LOCAL:</strong> Toda la Tierra de Nadie estará defendida por Fuerzas Locales (independientemente de la configuración de abandonos).</p>
                        <p><strong>FOCO TÁCTICO:</strong> Expansión temprana y asimétrica. Los comandantes deberán luchar contra la IA para ganar recursos antes de enfrentarse entre sí.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const SECTIONS = [
        { id: 'game_mode', label: 'MODOS DE JUEGO' },
        { id: 'abandonment', label: 'GESTIÓN DE ABANDONOS' },
        { id: 'ai_config', label: 'CONFIGURACIÓN IA' },
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'game_mode': return renderGameMode();
            case 'abandonment': return renderAbandonment();
            case 'ai_config': return renderAiConfig();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 10000,
            display: 'flex',
            fontFamily: '"Courier New", Courier, monospace',
        }}>
            {/* Sidebar Navigation */}
            <div style={{
                width: '260px',
                minWidth: '260px',
                backgroundColor: '#0a0a0a',
                borderRight: '1px solid #222',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 0',
                overflowY: 'auto',
            }}>
                <div style={{
                    padding: '0 20px 20px',
                    borderBottom: '1px solid #222',
                    marginBottom: '10px',
                }}>
                    <h2 style={{
                        color: '#00ff00',
                        fontSize: '1.2rem',
                        margin: 0,
                        letterSpacing: '3px',
                    }}>
                        CONFIGURACIÓN
                    </h2>
                    <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '5px' }}>
                        PROTOCOLO A.T.O.M.O
                    </div>
                </div>

                {SECTIONS.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id as SettingsSection)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 20px',
                            border: 'none',
                            backgroundColor: activeSection === section.id ? '#001a00' : 'transparent',
                            color: activeSection === section.id ? '#00ff00' : '#888',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            borderLeft: activeSection === section.id ? '3px solid #00ff00' : '3px solid transparent',
                            transition: 'all 0.2s',
                        }}
                    >
                        <span>{section.label}</span>
                    </button>
                ))}

                {!isHost && (
                    <div style={{
                        marginTop: 'auto',
                        padding: '20px',
                        color: '#ffff00',
                        fontSize: '0.7rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 0, 0.05)',
                        borderTop: '1px solid #440'
                    }}>
                        MODO SOLO LECTURA
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '30px 40px',
                position: 'relative'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'fixed',
                        top: '15px',
                        right: '25px',
                        background: 'none',
                        border: '1px solid #444',
                        color: '#888',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '5px 12px',
                        zIndex: 10001,
                        fontFamily: 'monospace',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff4444';
                        e.currentTarget.style.color = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#444';
                        e.currentTarget.style.color = '#888';
                    }}
                >
                    X
                </button>

                <div style={{ maxWidth: '800px' }}>
                    {renderContent()}
                </div>

                {isSaving && (
                    <div style={{ 
                        position: 'fixed', bottom: '20px', right: '30px',
                        color: '#00ff00', fontSize: '0.75rem', 
                        letterSpacing: '2px', animation: 'blink 1.5s infinite'
                    }}>
                        TRANSMITIENDO...
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes blink {
                    0% { opacity: 0.2; }
                    50% { opacity: 1; }
                    100% { opacity: 0.2; }
                }
            `}</style>
        </div>
    );
};
