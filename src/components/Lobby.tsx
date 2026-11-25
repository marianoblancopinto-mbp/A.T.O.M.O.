import React, { useState, useEffect } from 'react';
import { useMultiplayerContext } from '../context/GameContext';
import { MENU_SECTIONS } from '../data/loreData';
import { RulesModal } from './shared/modals/RulesModal';
import { HistoryModal } from './shared/modals/HistoryModal';
import { MissionModal } from './shared/modals/MissionModal';
import { SecondaryMissionsModal } from './shared/modals/SecondaryMissionsModal';
import { GameSettingsModal } from './shared/modals/GameSettingsModal';
import { Button, Option, Section } from '../ui/components';
import { listSavedGames } from '../hooks/useAsyncGame';
import type { GamePace } from '../hooks/useTransport';

const TURN_OPTIONS = [
    { value: 10, label: '10 minutos (prueba)' },
    { value: 60, label: '1 hora' },
    { value: 12 * 60, label: '12 horas' },
    { value: 24 * 60, label: '24 horas' },
    { value: 48 * 60, label: '48 horas' },
];

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
        updateSettings,
        pace,
        personalLink,
        openSavedGame,
    } = useMultiplayerContext();
    const [newPace, setNewPace] = useState<GamePace>('live');
    const [copied, setCopied] = useState(false);
    const savedGames = listSavedGames();



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
        await createGame(playerName, newPace);
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

    const errorBox = error ? <p className="ui-note" data-tone="danger" role="alert">⚠ {error}</p> : null;
    const muteButton = (
        <Button size="sm" variant="ghost" onClick={onMuteToggle} title={muted ? 'Activar música' : 'Silenciar música'} aria-label={muted ? 'Activar música' : 'Silenciar música'}>
            {muted ? '🔇' : '🔊'}
        </Button>
    );

    if ((connectionStatus === 'CONNECTED' || connectionStatus === 'PLAYING') && gameId) {
        const proxyCountry = gameSettings?.proxyWarCountry || 'País Desconocido';
        const canStart = lobbyPlayers.length >= 2;
        return (
            <div className="lobby" data-tone="default">
                <div className="lobby__room">
                    <section className="lobby__card" style={{ maxWidth: 'none' }}>
                        <div className="ui-row" style={{ justifyContent: 'space-between' }}>
                            <div className="ui-kicker">Sala de operaciones</div>
                            {muteButton}
                        </div>
                        <p className="ui-text" style={{ margin: '8px 0 18px' }}>ID DE MISIÓN: <span className="lobby__code">{gameId}</span></p>
                        <Section title={`Personal autorizado · ${lobbyPlayers.length}`}>
                            {lobbyPlayers.map((p, idx) => (
                                <div key={p.playerId} className="ui-kv">
                                    <span><span className="ui-muted">{String(idx + 1).padStart(2, '0')}</span> {p.name}{String(p.playerId) === String(playerId) ? ' (vos)' : ''}</span>
                                    {p.isHost && <span className="ui-badge" style={{ color: 'var(--yellow)' }}>Anfitrión</span>}
                                </div>
                            ))}
                        </Section>
                        <p className="ui-muted" style={{ fontSize: '0.85rem' }}>Compartí el ID para que se unan otros comandantes (2 a 8).</p>
                        {pace === 'async' && (
                            <Section title="Partida por correspondencia">
                                <p className="ui-text" style={{ fontSize: '0.9rem' }}>
                                    Cada comandante juega cuando puede. Si alguien no actúa antes del plazo, el sistema actúa por él.
                                </p>
                                <label className="ui-muted" style={{ fontSize: '0.8rem' }} htmlFor="turn-minutes">Plazo para cada jugada</label>
                                <select id="turn-minutes" className="ui-select" disabled={!isHost}
                                    value={gameSettings?.turnMinutes ?? 1440}
                                    onChange={e => updateSettings({ turnMinutes: Number(e.target.value) })}>
                                    {TURN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <div className="ui-row" style={{ marginTop: 12 }}>
                                    <Button size="sm" onClick={async () => {
                                        const link = personalLink();
                                        if (link) { await navigator.clipboard?.writeText(link).catch(() => {}); setCopied(true); }
                                    }}>{copied ? 'Enlace copiado' : 'Copiar mi enlace personal'}</Button>
                                </div>
                                <p className="ui-muted" style={{ fontSize: '0.78rem', marginTop: 6 }}>
                                    Con tu enlace personal abrís esta partida desde otro dispositivo. No lo compartas: es tu asiento.
                                </p>
                            </Section>
                        )}
                    </section>

                    <section className="lobby__card" style={{ maxWidth: 'none' }}>
                        <Section title="Archivos clasificados">
                            <div className="ui-stack">
                                {MENU_SECTIONS.map(section => (
                                    <Option key={section.phase} label={section.label} onSelect={() => handleMenuClick(section.phase)} />
                                ))}
                            </div>
                        </Section>
                        {errorBox}
                        {isHost ? (
                            <Button variant="primary" size="lg" block disabled={!canStart} onClick={startGame}>
                                {canStart ? 'Iniciar operación' : 'Esperando comandantes…'}
                            </Button>
                        ) : (
                            <p className="ui-note">Esperando que el anfitrión inicie la operación…</p>
                        )}
                    </section>
                </div>

                <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} proxyWarCountry={proxyCountry} />
                <MissionModal isOpen={showMission} onClose={() => setShowMission(false)} />
                <SecondaryMissionsModal isOpen={showSecondaryMissions} onClose={() => setShowSecondaryMissions(false)} proxyWarCountry={proxyCountry} />
                <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
                <GameSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onUpdate={updateSettings} isHost={isHost} currentSettings={gameSettings} />
            </div>
        );
    }

    const connecting = connectionStatus === 'CONNECTING';
    return (
        <div className="lobby" data-tone="default">
            <div style={{ width: '100%', maxWidth: 460 }}>
                <h1 className="lobby__brand">A.T.O.M.O.</h1>
                <p className="ui-kicker" style={{ textAlign: 'center', marginBottom: 24 }}>Guerra fría · año 2100</p>
                <section className="lobby__card">
                    <div className="ui-stack" style={{ gap: 14 }}>
                        <input className="ui-input" type="text" placeholder="TU NOMBRE DE GENERAL" maxLength={24}
                            value={playerName} onChange={e => setPlayerName(e.target.value)} aria-label="Tu nombre" />
                        <div className="ui-grid" style={{ gridTemplateColumns: '1fr 1fr' }} role="radiogroup" aria-label="Tipo de partida">
                            <Option label="En vivo" meta="Todos conectados a la vez" selected={newPace === 'live'} onSelect={() => setNewPace('live')} />
                            <Option label="Correspondencia" meta="Turnos con plazo, cada uno cuando puede" selected={newPace === 'async'} onSelect={() => setNewPace('async')} />
                        </div>
                        <Button variant="primary" size="lg" block onClick={handleCreate} disabled={connecting}>
                            {connecting ? 'Conectando…' : 'Crear nueva partida'}
                        </Button>
                        <div className="ui-row" style={{ flexWrap: 'nowrap' }}>
                            <input className="ui-input" type="text" placeholder="CÓDIGO DE PARTIDA"
                                value={joinGameId} onChange={e => setJoinGameId(e.target.value)} aria-label="Código de partida" />
                            <Button onClick={handleJoin} disabled={connecting}>{connecting ? '…' : 'Unirse'}</Button>
                        </div>
                        {errorBox}
                    </div>
                </section>
                {savedGames.length > 0 && (
                    <section className="lobby__card" style={{ marginTop: 16 }}>
                        <Section title="Tus partidas por correspondencia">
                            <div className="ui-stack">
                                {savedGames.map(g => (
                                    <Option key={g.id} label={g.name} meta={`Código ${g.id}`} onSelect={() => void openSavedGame(g.id)} />
                                ))}
                            </div>
                        </Section>
                    </section>
                )}
                <div style={{ textAlign: 'center', marginTop: 12 }}>{muteButton}</div>
            </div>
        </div>
    );
};
