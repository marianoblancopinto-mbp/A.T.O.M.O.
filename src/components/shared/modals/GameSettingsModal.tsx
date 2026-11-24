import React, { useState } from 'react';
import { DocumentModal } from '../../../ui/DocumentModal';
import { h3Style, tipStyle, warningStyle } from '../../../ui/docStyles';

interface GameSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Manda el cambio al servidor (sólo el anfitrión; el servidor lo valida). */
    onUpdate: (settings: Record<string, unknown>) => void;
    isHost: boolean;
    currentSettings: any;
}

type SettingsSection = 'abandonment' | 'ai_config' | 'game_mode';

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
    isOpen,
    onClose,
    onUpdate,
    isHost,
    currentSettings
}) => {
    const [activeSection, setActiveSection] = useState<SettingsSection>('abandonment');

    if (!isOpen) return null;

    const abandonmentMode = currentSettings?.abandonmentMode || 'redistribute';
    const aiDifficulty = currentSettings?.aiDifficulty ?? 50;
    const gameMode = currentSettings?.gameMode || 'classic';

    const handleUpdateSetting = (key: string, value: any) => {
        if (!isHost) return;
        onUpdate({ [key]: value });
    };

    // --- SHARED STYLES (COHESIVE WITH RULES MODAL) ---
    const sectionContainerStyle: React.CSSProperties = {
        color: '#ccc',
        lineHeight: '1.7',
        fontSize: '0.95rem',
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
        <DocumentModal kicker="Protocolo A.T.O.M.O." title="Configuración"
            items={SECTIONS} activeId={activeSection} onSelect={id => setActiveSection(id as SettingsSection)} onClose={onClose}>
            {!isHost && <p style={tipStyle}>Sólo el anfitrión puede cambiar la configuración.</p>}
            {renderContent()}
        </DocumentModal>
    );
};
