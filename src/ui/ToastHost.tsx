import React, { useEffect, useRef } from 'react';
import { useGameContext } from '../context/GameContext';
import type { MissionNotification } from '@atomo/shared';
import type { Tone } from './components';

/**
 * Único lugar de avisos NO bloqueantes: las notificaciones que manda el
 * servidor (conquistas, misiones, alertas) y los rechazos de órdenes. Se apilan
 * arriba a la derecha y se cierran solos; nunca tapan un diálogo.
 */

const TONE_BY_TYPE: Record<MissionNotification['type'], Tone> = {
    CONQUEST: 'default',
    SECONDARY_MISSION: 'mission',
    ESPIONAJE: 'intel',
    NUCLEAR_DESIGN: 'nuclear',
    NUCLEAR_ALERT: 'nuclear',
    NEUTRALIZED: 'danger',
    ROUTE_BROKEN: 'warn',
    ROUTE_RESTORED: 'default',
    GAME_OVER: 'default',
};

const MAX_VISIBLE = 3;

const Toast: React.FC<{ tone: Tone; title: string; from?: string; ms: number; onClose: () => void; children: React.ReactNode }> = ({ tone, title, from, ms, onClose, children }) => {
    useEffect(() => {
        const t = setTimeout(onClose, ms);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div className="ui-toast" data-tone={tone} role="status">
            <div className="ui-toast__body">
                {from && <div className="ui-toast__from">Transmisión de {from}</div>}
                <div className="ui-toast__title">{title}</div>
                <div>{children}</div>
            </div>
            <button type="button" className="ui-close" onClick={onClose} aria-label="Cerrar aviso">✕</button>
        </div>
    );
};

export const ToastHost: React.FC<{ hidden?: (n: MissionNotification) => boolean }> = ({ hidden }) => {
    const { state, multiplayer, dismissNotification, dismissedNotificationIds } = useGameContext();

    // Al conectarse sólo se muestra la última notificación, no el historial completo.
    const baseline = useRef<number | null>(null);
    if (baseline.current === null && state.notifications.length > 0) {
        baseline.current = state.notifications[state.notifications.length - 1].id - 1;
    }

    const visible = state.notifications
        .filter(n => n.id > (baseline.current ?? 0) && !dismissedNotificationIds.has(n.id) && !hidden?.(n))
        .slice(-MAX_VISIBLE);

    return (
        <div className="ui-toasts" aria-live="polite">
            {multiplayer.error && (
                <Toast key={`err-${multiplayer.error}`} tone="danger" title="Orden rechazada" ms={6000} onClose={multiplayer.clearError}>
                    {multiplayer.error}
                </Toast>
            )}
            {visible.map(n => (
                <Toast
                    key={n.id}
                    tone={TONE_BY_TYPE[n.type] ?? 'default'}
                    title={n.title}
                    from={n.playerName}
                    ms={n.type === 'NEUTRALIZED' || n.type === 'NUCLEAR_ALERT' ? 10000 : 6000}
                    onClose={() => dismissNotification(n.id)}
                >
                    {n.message}
                </Toast>
            ))}
        </div>
    );
};
