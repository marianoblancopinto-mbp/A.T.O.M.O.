import React, { useEffect, useRef, useState } from 'react';
import { useGameContext } from '../../context/GameContext';
import { Announcement, Button } from '../../ui/components';

/**
 * Cola ÚNICA de anuncios a pantalla completa. Se muestra uno a la vez, por
 * prioridad:
 *
 *   1. Partida finalizada por el anfitrión
 *   2. Fin de partida (ganador y su decisión)
 *   3. Alerta nuclear (un rival inició su despliegue)
 *   4. Destrucción Mutua Asegurada
 *   5. Año nuevo
 *   6. Tu turno
 *
 * Los avisos menores (conquistas, misiones, rechazos) van al ToastHost y no
 * bloquean. Mientras dura el preturno de producción no se anuncian año ni turno:
 * quedan en cola y aparecen cuando arranca la ronda de acciones.
 */

interface Props {
    spectator?: boolean;
    onEndgameChoice: (choice: 'victory' | 'destruction') => void;
    endgameAnimationDone: boolean;
}

export const Announcements: React.FC<Props> = ({ spectator, onEndgameChoice, endgameAnimationDone }) => {
    const { state, multiplayer, dismissNotification, dismissedNotificationIds } = useGameContext();
    const { players, currentPlayerIndex, gameDate, roundPhase, winner, endgameChoice, gameOver, battleState } = state;
    const myId = multiplayer.playerId;

    // --- Año nuevo y turno: se detectan por cambios y quedan en cola.
    const [pendingYear, setPendingYear] = useState<number | null>(null);
    const [pendingTurn, setPendingTurn] = useState(false);
    const prevYear = useRef(gameDate.getFullYear());
    const prevTurn = useRef<number | null>(null);

    useEffect(() => {
        const year = gameDate.getFullYear();
        if (year > prevYear.current) setPendingYear(year);
        prevYear.current = year;
    }, [gameDate]);

    useEffect(() => {
        const isMine = !!myId && String(players[currentPlayerIndex]?.id) === String(myId);
        if (prevTurn.current !== currentPlayerIndex && isMine) setPendingTurn(true);
        if (!isMine) setPendingTurn(false);
        prevTurn.current = currentPlayerIndex;
    }, [currentPlayerIndex, players, myId]);

    // --- Alerta nuclear: rivales con despliegue activo que todavía no reconocí.
    const [ackThreats, setAckThreats] = useState<string>('');
    const threats = players.filter(p => p.nuclearDeploymentActive && String(p.id) !== String(myId));
    const threatKey = threats.map(p => p.id).join(',');
    useEffect(() => { if (!threatKey) setAckThreats(''); }, [threatKey]);

    const mad = state.notification?.title === 'DETENCIÓN MUTUA' && !dismissedNotificationIds.has(state.notification.id) ? state.notification : null;

    if (spectator) return null;

    // 1. Partida finalizada por el anfitrión
    if (gameOver && !winner) {
        return (
            <Announcement critical tone="danger" kicker="Fin de transmisión" title="Partida finalizada"
                actions={<Button variant="primary" tone="danger" onClick={() => { multiplayer.leaveGame(); window.location.reload(); }}>Volver al menú</Button>}>
                El anfitrión dio por terminada la operación.
            </Announcement>
        );
    }

    // 2. Fin de partida
    if (winner) {
        const iWon = String(winner.id) === String(myId);
        if (endgameChoice) {
            if (!endgameAnimationDone) return null; // se ve la animación del mapa
            return (
                <Announcement critical tone={endgameChoice === 'victory' ? 'default' : 'nuclear'} kicker="Operación concluida"
                    title={endgameChoice === 'victory' ? 'Nuevo orden mundial' : 'Tierra arrasada'}
                    actions={<Button variant="primary" onClick={() => { multiplayer.leaveGame(); window.location.reload(); }}>Nueva operación</Button>}>
                    {winner.name.toUpperCase()} controla el mundo.
                </Announcement>
            );
        }
        return (
            <Announcement critical tone="nuclear" kicker="Nuevo mensaje" title={iWon ? 'Misión cumplida' : 'Despliegue completado'}
                actions={iWon ? <>
                    <Button variant="primary" onClick={() => onEndgameChoice('victory')}>Finalizar operación</Button>
                    <Button variant="danger" onClick={() => onEndgameChoice('destruction')}>Iniciar secuencia de ataque</Button>
                </> : undefined}>
                {iWon
                    ? <>Felicitaciones, Comandante {winner.name.toUpperCase()}. Desplegamos nuestro protocolo nuclear antes que nuestros enemigos y ya contamos con sus rendiciones incondicionales.<br /><br />
                        <em>¿Finalizar en paz, o arrasar a los que no pueden ser reformados?</em></>
                    : <>Atención: el Comandante {winner.name.toUpperCase()} desplegó su protocolo nuclear. La paz mundial se renegocia bajo sus términos.<br /><br />
                        <em>Esperando la decisión final del comandante victorioso…</em></>}
            </Announcement>
        );
    }

    // Durante una batalla no se interrumpe con anuncios.
    if (battleState) return null;

    // 3. Alerta nuclear
    if (threatKey && ackThreats !== threatKey) {
        const names = threats.map(p => p.name).join(', ');
        return (
            <Announcement tone="nuclear" kicker="Alerta roja" title="Despliegue nuclear enemigo" hint="> CLIC PARA ASUMIR LA ALERTA <"
                onDismiss={() => setAckThreats(threatKey)}>
                El comandante <strong>{names.toUpperCase()}</strong> inició su despliegue nuclear. Si sigue activo al cierre de la ronda, su victoria será irreversible.
                Tenemos hasta fin de año para iniciar nuestro propio despliegue o destruir su silo.
            </Announcement>
        );
    }

    // 4. Destrucción Mutua Asegurada
    if (mad) {
        return (
            <Announcement tone="nuclear" kicker="Destrucción mutua asegurada" title="Lanzamientos abortados" onDismiss={() => dismissNotification(mad.id)}>
                {mad.message} Los silos usados en el despliegue quedan en enfriamiento hasta la próxima ronda.
            </Announcement>
        );
    }

    if (roundPhase === 'PRODUCTION') return null;

    // 5. Año nuevo
    if (pendingYear !== null) {
        return (
            <Announcement kicker="Transmisión entrante" title={`Año ${pendingYear}`} onDismiss={() => setPendingYear(null)}>
                Reconfigurando el orden de operaciones global.
            </Announcement>
        );
    }

    // 6. Tu turno
    if (pendingTurn) {
        const me = players[currentPlayerIndex];
        return (
            <Announcement kicker="Turno de" title={`Comandante ${me?.name ?? ''}`} onDismiss={() => setPendingTurn(false)} />
        );
    }
    return null;
};
