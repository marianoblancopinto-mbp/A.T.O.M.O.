import React, { useState, useEffect } from 'react';
import { useMultiplayerContext } from '../context/GameContext';
import { MENU_SECTIONS } from '../data/loreData';
import { generateInitialGameState } from '../data/gameInitializer';
import { RulesModal } from './shared/modals/RulesModal';
import { HistoryModal } from './shared/modals/HistoryModal';
import { MissionModal } from './shared/modals/MissionModal';
import { SecondaryMissionsModal } from './shared/modals/SecondaryMissionsModal';
import { GameSettingsModal } from './shared/modals/GameSettingsModal';

interface LobbyProps {
    onGameStart?: () => void;
    muted?: boolean;
    onMuteToggle?: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onGameStart, muted, onMuteToggle }) => {
    const {
        gameId,
        playerId,
        isHost,
        connectionStatus,
        error,
        lobbyPlayers,
        gameSettings,
        createGame,
        joinGame,
        startGame,
        updateInitialState
    } = useMultiplayerContext();



    const [playerName, setPlayerName] = useState('');
    const [joinGameId, setJoinGameId] = useState('');
    const [showRules, setShowRules] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showMission, setShowMission] = useState(false);
    const [showSecondaryMissions, setShowSecondaryMissions] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Auto-fill from URL if present
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const room = urlParams.get('room');
        if (room) {
            setJoinGameId(room);
        }
    }, []);

    // Handle Create Game
    const handleCreate = async () => {
        if (!playerName) return alert('Ingresa tu nombre primero');
        await createGame(playerName);
    };

    // Handle Join Game
    const handleJoin = async () => {
        if (!playerName) return alert('Ingresa tu nombre primero');
        if (!joinGameId) return alert('Ingresa el ID de la partida');

        let targetId = joinGameId.trim();
        
        // If the user pasted a full URL, extract the ?room= value
        if (targetId.includes('http') || targetId.includes('?')) {
            try {
                // Prepend http fake base if it starts with query param
                const urlString = targetId.startsWith('http') ? targetId : `http://localhost/${targetId}`;
                const url = new URL(urlString);
                const roomParam = url.searchParams.get('room');
                if (roomParam) {
                    targetId = roomParam;
                    setJoinGameId(roomParam); // correct the input visually
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        await joinGame(targetId, playerName);
    };

    // React to Game Start
    useEffect(() => {
        if (connectionStatus === 'PLAYING') {
            onGameStart?.();
        }
    }, [connectionStatus, onGameStart]);

    // --- Content Handlers ---
    const handleMenuClick = (phase: string) => {
        if (phase === 'rules_intro') {
            setShowRules(true);
            return;
        }
        if (phase === 'history') {
            setShowHistory(true);
            return;
        }
        if (phase === 'mission') {
            setShowMission(true);
            return;
        }
        if (phase === 'secondary_intro') {
            setShowSecondaryMissions(true);
            return;
        }
        if (phase === 'settings') {
            setShowSettings(true);
            return;
        }
    };

    const isMobile = window.innerWidth <= 768;

    if ((connectionStatus === 'CONNECTED' || connectionStatus === 'PLAYING') && gameId) {

        // Proxy War Country for Lore
        const proxyCountry = gameSettings?.proxyWarCountry || 'País Desconocido';

        return (
            <div style={{
                position: 'relative',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                width: '100vw',
                minHeight: '100vh',
                height: 'auto',
                backgroundColor: '#0a0a0a',
                color: '#00ff00',
                fontFamily: 'monospace',
                overflowY: 'auto',
                overflowX: 'auto'
            }}>
                {/* Background Grid/Effect */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: 'radial-gradient(circle, #001100 0%, #000000 100%)',
                    zIndex: 0
                }} />
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundSize: '40px 40px',
                    backgroundImage: 'linear-gradient(to right, rgba(0, 50, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 50, 0, 0.1) 1px, transparent 1px)',
                    zIndex: 0, pointerEvents: 'none'
                }} />

                {/* Left Panel: Status & Players */}
                <div style={{
                    flex: isMobile ? 'none' : 1,
                    borderRight: isMobile ? 'none' : '2px solid #004400',
                    borderBottom: isMobile ? '2px solid #004400' : 'none',
                    padding: isMobile ? '20px' : '40px',
                    display: 'flex', flexDirection: 'column', zIndex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    width: isMobile ? '100%' : 'auto',
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                        <button 
                            onClick={onMuteToggle}
                            title={muted ? "Activar Música" : "Desactivar Música"}
                            style={{
                                backgroundColor: 'transparent',
                                border: '1px solid #00ff00',
                                color: '#00ff00',
                                padding: '5px 12px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                borderRadius: '0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            AUDIO: <span style={{ color: muted ? '#ff4444' : '#00ff00' }}>{muted ? 'MUTED' : 'ENABLED'}</span>
                        </button>
                    </div>
                    <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', marginBottom: '10px', textShadow: '0 0 10px #00ff00' }}>SALA DE OPERACIONES</h1>
                    <div style={{ marginBottom: isMobile ? '20px' : '40px', color: '#666', fontSize: '0.9rem' }}>
                        ID DE MISIÓN: <span style={{ color: '#fff', letterSpacing: '2px' }}>{gameId}</span>
                    </div>

                    <h3 style={{ borderBottom: '1px solid #004400', paddingBottom: '10px', color: '#00cc00' }}>
                        PERSONAL AUTORIZADO [{lobbyPlayers.length}]
                    </h3>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        flex: isMobile ? 'none' : 1,
                        maxHeight: isMobile ? '300px' : 'none',
                        overflowY: 'auto'
                    }}>
                        {lobbyPlayers.map((p: any, idx: number) => (
                            <li key={p.id} style={{
                                padding: '15px 10px',
                                backgroundColor: p.id === playerId ? 'rgba(0, 50, 0, 0.5)' : 'transparent',
                                borderBottom: '1px solid #002200',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                animation: 'fadeIn 0.5s ease-in'
                            }}>
                                <span>
                                    <span style={{ color: '#006600', marginRight: '10px' }}>{String(idx + 1).padStart(2, '0')}</span>
                                    {p.name} {p.id === playerId ? '(TÚ)' : ''}
                                </span>
                                {idx === 0 && <span style={{
                                    fontSize: '0.7rem', padding: '2px 6px', border: '1px solid #ffff00', color: '#ffff00'
                                }}>ANFITRIÓN</span>}
                            </li>
                        ))}
                    </ul>

                    {/* Chat or Status Log could go here */}
                    <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #004400', color: '#444' }}>
                        Estado del enlace: <span style={{ color: '#00ff00' }}>ESTABLE</span>
                    </div>
                </div>

                {/* Right Panel: Menu */}
                <div style={{
                    flex: 1,
                    padding: isMobile ? '20px' : '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1,
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <div style={{ width: '100%', maxWidth: '500px' }}>
                        <h2 style={{
                            textAlign: 'center', marginBottom: '40px', fontSize: '2rem',
                            borderBottom: '2px solid #00ff00', paddingBottom: '20px'
                        }}>
                            ARCHIVOS CLASIFICADOS
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {MENU_SECTIONS.map((section) => (
                                <button
                                    key={section.phase}
                                    onClick={() => handleMenuClick(section.phase)}
                                    // disabled={!section.available} 
                                    style={{
                                        padding: '20px',
                                        backgroundColor: 'rgba(0, 20, 0, 0.8)',
                                        border: '1px solid #00ff00',
                                        color: '#00ff00',
                                        fontSize: '1.2rem',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textTransform: 'uppercase',
                                        letterSpacing: '2px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        opacity: section.available ? 1 : 0.5
                                    }}
                                    onMouseEnter={(e) => {
                                        if (section.available) {
                                            e.currentTarget.style.backgroundColor = '#00ff00';
                                            e.currentTarget.style.color = '#000';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(0, 20, 0, 0.8)';
                                        e.currentTarget.style.color = '#00ff00';
                                    }}
                                >
                                    {section.label}
                                    <span>&gt;</span>
                                </button>
                            ))}
                        </div>

                        <div style={{ marginTop: '60px', textAlign: 'center' }}>
                            {isHost ? (
                                <button
                                    onClick={async () => {
                                        // 1. Generate synchronized initial state
                                        const playerNames = lobbyPlayers.map((p: any) => p.name);
                                        const playerIds = lobbyPlayers.map((p: any) => p.id);
                                        const initialState = generateInitialGameState(
                                            lobbyPlayers.length,
                                            playerNames,
                                            playerIds,
                                            gameSettings || {
                                                proxyWarCountry: 'País Desconocido',
                                                abandonmentMode: 'redistribute',
                                                aiActive: false,
                                                aiDifficulty: 50,
                                                gameMode: 'classic'
                                            }
                                        );

                                        // 2. Save state to Supabase
                                        await updateInitialState(initialState);

                                        // 3. Signal start (flags PLAYING status and triggers phase change)
                                        await startGame();
                                    }}
                                    style={{
                                        padding: '20px 40px', fontSize: '1.5rem', fontWeight: 'bold',
                                        backgroundColor: '#00ff00', color: '#000', border: 'none', cursor: 'pointer',
                                        borderRadius: '0', boxShadow: '0 0 20px #00ff00',
                                        animation: 'pulse 2s infinite'
                                    }}
                                >
                                    INICIAR OPERACIÓN
                                </button>
                            ) : (
                                <div style={{
                                    padding: '20px', border: '1px dashed #004400', color: '#008800',
                                    animation: 'blink 2s infinite'
                                }}>
                                    ESPERANDO INICIO DE OPERACIÓN DEL ANFITRIÓN...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} proxyWarCountry={proxyCountry} />
                <MissionModal isOpen={showMission} onClose={() => setShowMission(false)} />
                <SecondaryMissionsModal 
                    isOpen={showSecondaryMissions} 
                    onClose={() => setShowSecondaryMissions(false)} 
                    proxyWarCountry={proxyCountry}
                />
                <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
                <GameSettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    gameId={gameId}
                    isHost={isHost}
                    currentSettings={gameSettings}
                />
            </div>
        );
    }

    // Default View (Join/Create)
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh',
            backgroundColor: '#050505', color: '#fff', fontFamily: 'monospace'
        }}>
            <h1 style={{ fontSize: '4rem', color: '#00ff00', marginBottom: '40px', textShadow: '0 0 20px rgba(0,255,0,0.5)' }}>A.T.O.M.O v2</h1>

            <div style={{
                width: '400px', padding: '30px', border: '1px solid #333', borderRadius: '12px',
                backgroundColor: '#111', boxShadow: '0 0 50px rgba(0,0,0,0.8)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <input
                        type="text"
                        placeholder="TU NOMBRE DE GENERAL"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        style={{
                            padding: '15px', backgroundColor: '#222', border: '1px solid #444',
                            color: '#fff', fontSize: '1.2rem', textAlign: 'center', outline: 'none'
                        }}
                    />

                    <button
                        onClick={handleCreate}
                        disabled={connectionStatus === 'CONNECTING'}
                        style={{
                            padding: '15px', backgroundColor: '#004400', color: '#00ff00', border: '1px solid #00ff00',
                            fontSize: '1.1rem', cursor: connectionStatus === 'CONNECTING' ? 'wait' : 'pointer', fontWeight: 'bold',
                            opacity: connectionStatus === 'CONNECTING' ? 0.7 : 1
                        }}
                    >
                        {connectionStatus === 'CONNECTING' ? 'CREATING...' : 'CREAR NUEVA PARTIDA'}
                    </button>

                    {error && (
                        <div style={{ color: '#ff0000', textAlign: 'center', backgroundColor: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '4px' }}>
                            ⚠ {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="CÓDIGO DE PARTIDA"
                            value={joinGameId}
                            onChange={(e) => setJoinGameId(e.target.value)}
                            style={{
                                flex: 1, padding: '15px', backgroundColor: '#222', border: '1px solid #444',
                                color: '#fff', textAlign: 'center', outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleJoin}
                            disabled={connectionStatus === 'CONNECTING' || connectionStatus === 'TAKEOVER_PENDING'}
                            style={{
                                padding: '15px', backgroundColor: '#002244', color: '#00ffff', border: '1px solid #00ffff',
                                fontSize: '1.1rem', cursor: (connectionStatus === 'CONNECTING' || connectionStatus === 'TAKEOVER_PENDING') ? 'wait' : 'pointer', fontWeight: 'bold'
                            }}
                        >
                            {connectionStatus === 'TAKEOVER_PENDING' ? 'VERIFICANDO...' : 'UNIRSE'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
