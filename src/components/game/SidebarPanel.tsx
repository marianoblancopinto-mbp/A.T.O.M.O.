import React, { useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { useGameActions } from '../../hooks/useGameActions';
import { Button } from '../../ui/components';
import { useCountdown } from '../../hooks/useCountdown';

interface SidebarPanelProps {
    onEndTurn: () => void;
    onOpenInventory: () => void;
    onOpenRawMaterials: () => void;
    onOpenTechnologies: () => void;
    onOpenConfidential: () => void;
    onOpenTreaties: () => void;
    mobileOpen?: boolean;
    onCloseMobile?: () => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
    onEndTurn,
    onOpenInventory,
    onOpenRawMaterials,
    onOpenTechnologies,
    onOpenConfidential,
    onOpenTreaties,
    mobileOpen = false,
    onCloseMobile,
}) => {
    const { state, multiplayer } = useGameContext();
    const actions = useGameActions();
    const { players, currentPlayerIndex, gameDate } = state;
    const currentPlayer = players[currentPlayerIndex];

    // Host-control confirmations (declarados antes de cualquier return para respetar
    // las reglas de hooks).
    const [showKickConfirm, setShowKickConfirm] = useState<string | null>(null);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const remaining = useCountdown(state.deadline?.at);

    if (!currentPlayer) return null;

    const isMyTurn = !!multiplayer.playerId && String(currentPlayer.id) === String(multiplayer.playerId);
    const close = () => onCloseMobile?.();
    const go = (fn: () => void) => () => { fn(); close(); };
    const month = (gameDate.getMonth() + 1).toString().padStart(2, '0');

    return (
        <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`} aria-label="Panel de mando">
            <div className="ui-row" style={{ justifyContent: 'space-between' }}>
                <div className="sidebar__brand">A.T.O.M.O.</div>
                <button type="button" className="ui-close sidebar__close" onClick={close} aria-label="Cerrar menú">✕</button>
            </div>

            <div className="sidebar__turn">
                <div className="ui-kicker">{isMyTurn ? 'Tu turno' : 'Turno de'}</div>
                <div style={{ color: currentPlayer.color, fontSize: '1.3rem', fontWeight: 'bold', textShadow: `0 0 8px ${currentPlayer.color}` }}>{currentPlayer.name}</div>
                {multiplayer.pace === 'async' && remaining && (
                    <div className="ui-muted" style={{ marginTop: 4 }}>
                        {state.deadline?.kind === 'defense' ? 'Defensa en curso' : state.deadline?.kind === 'production' ? 'Producción' : 'Plazo del turno'}: {remaining}
                    </div>
                )}
            </div>

            {isMyTurn && <Button variant="primary" block onClick={go(onEndTurn)}>Terminar turno</Button>}

            <div className="sidebar__group">
                <Button block onClick={go(onOpenInventory)}>Inventario</Button>
                <Button block onClick={go(onOpenConfidential)}>Expediente</Button>
                <Button block tone="diplomacy" onClick={go(onOpenTreaties)}>Tratados</Button>
                <Button block variant="ghost" onClick={go(onOpenRawMaterials)}>Materias primas</Button>
                <Button block variant="ghost" onClick={go(onOpenTechnologies)}>Tecnologías</Button>
            </div>

            {multiplayer.isHost && (
                <div className="sidebar__host sidebar__group" data-tone="danger">
                    <div className="ui-kicker">Control de anfitrión</div>
                    {players.filter(p => !p.isEliminated && String(p.id) !== String(multiplayer.playerId)).map(p => (
                        showKickConfirm === String(p.id) ? (
                            <div key={p.id} className="ui-row">
                                <Button size="sm" variant="danger" onClick={() => { actions.kickPlayer(p.id); setShowKickConfirm(null); }}>Confirmar expulsión</Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowKickConfirm(null)}>Cancelar</Button>
                            </div>
                        ) : (
                            <Button key={p.id} size="sm" tone="danger" block onClick={() => setShowKickConfirm(String(p.id))}>Expulsar a {p.name}</Button>
                        )
                    ))}
                    {showEndConfirm ? (
                        <div className="ui-row">
                            <Button size="sm" variant="danger" onClick={() => { actions.endGame(); setShowEndConfirm(false); }}>Confirmar fin</Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowEndConfirm(false)}>Cancelar</Button>
                        </div>
                    ) : (
                        <Button size="sm" variant="ghost" tone="danger" block onClick={() => setShowEndConfirm(true)}>Finalizar partida</Button>
                    )}
                </div>
            )}

            {multiplayer.pace === 'async' && (
                <div className="sidebar__group">
                    <div className="ui-kicker">Partida por correspondencia · {multiplayer.gameId}</div>
                    <Button size="sm" variant="ghost" block onClick={() => {
                        const link = multiplayer.personalLink();
                        if (link) void navigator.clipboard?.writeText(link).then(() => setLinkCopied(true), () => window.prompt('Tu enlace personal:', link));
                    }}>{linkCopied ? 'Enlace copiado' : 'Copiar mi enlace personal'}</Button>
                    <Button size="sm" variant="ghost" block onClick={() => { multiplayer.leaveGame(); window.location.assign('/'); }}>Mis partidas</Button>
                </div>
            )}

            <div className="sidebar__foot">Fecha: {month}/{gameDate.getFullYear()} · sistema online</div>
        </aside>
    );
};
