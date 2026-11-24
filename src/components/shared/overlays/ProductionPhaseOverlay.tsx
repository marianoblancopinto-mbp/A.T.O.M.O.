import React from 'react';
import { useGameContext } from '../../../context/GameContext';
import { useGameActions } from '../../../hooks/useGameActions';
import { Modal, Section, Button } from '../../../ui/components';

/**
 * PRETURNO — fase de producción simultánea al inicio de la ronda. Bloquea el
 * mapa (capa "screen"); el inventario se abre por encima para producir.
 */
export const ProductionPhaseOverlay: React.FC<{ onOpenInventory: () => void; isSpectator?: boolean }> = ({ onOpenInventory, isSpectator = false }) => {
    const { state, multiplayer } = useGameContext();
    const actions = useGameActions();
    const localId = multiplayer.playerId;
    const ready = new Set(state.productionReadyIds.map(String));
    const active = state.players.filter(p => !p.isEliminated);
    const localReady = !!localId && ready.has(String(localId));

    return (
        <Modal
            layer="screen"
            kicker={`Preturno · Año ${state.gameDate.getFullYear()}`}
            title="Fase de producción"
            size="md"
            footer={isSpectator ? undefined : <>
                {multiplayer.isHost && (
                    <Button variant="ghost" tone="warn" onClick={actions.forceActionPhase}
                        title="Salvaguarda: inicia la ronda aunque falten comandantes por confirmar.">Forzar inicio</Button>
                )}
                <Button onClick={onOpenInventory}>Producir suministros</Button>
                <Button variant="primary" onClick={() => actions.setProductionReady(!localReady)}>{localReady ? 'Cancelar listo' : 'Estoy listo'}</Button>
            </>}
        >
            <p className="ui-text">
                Todos los comandantes producen <strong>en simultáneo</strong>, combinando materias primas y tecnologías.
                Cada suministro queda radicado en el país de origen de la materia prima. <strong>Durante la ronda ya no se puede producir</strong>:
                decidí ahora qué vas a necesitar.
            </p>
            <Section title={`Comandantes listos · ${active.filter(p => ready.has(String(p.id))).length}/${active.length}`}>
                {active.map(p => {
                    const isReady = ready.has(String(p.id));
                    return (
                        <div key={p.id} className="ui-kv">
                            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: p.color, marginRight: 8 }} />
                                {p.name}{String(p.id) === String(localId) ? ' (vos)' : ''}</span>
                            <span className={`ui-status ui-status--${isReady ? 'ok' : 'no'}`}>{isReady ? 'Listo' : 'Produciendo'}</span>
                        </div>
                    );
                })}
            </Section>
            {isSpectator && <p className="ui-muted">Modo observador: esperando a que los comandantes terminen de producir.</p>}
        </Modal>
    );
};
