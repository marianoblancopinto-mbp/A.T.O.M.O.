import React, { useState } from 'react';
import { useGameContext } from '../../../context/GameContext';
import { useMyPlayer } from '../../../hooks/useMyPlayer';
import type { Treaty } from '../../../types/treatyTypes';
import { TreatyEditor } from './TreatyEditor';
import { Modal, Section, Button, Empty } from '../../../ui/components';
import { Item } from '../../../ui/Item';

/** Lista de tratados vigentes y negociaciones del jugador. */
export const TreatiesPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { state } = useGameContext();
    const { myPlayer } = useMyPlayer();
    const [editing, setEditing] = useState<{ treaty?: Treaty } | null>(null);
    if (!myPlayer) return null;
    const me = String(myPlayer.id);

    if (editing) return <TreatyEditor onClose={() => setEditing(null)} initialTreaty={editing.treaty} isNew={!editing.treaty} />;

    const partner = (t: Treaty) => state.players.find(p => String(p.id) === (String(t.creatorId) === me ? String(t.targetPlayerId) : String(t.creatorId)));
    const term = (t: Treaty) => {
        const max = Math.max(...t.clauses.map(c => c.duration));
        const until = max === -1 ? 'permanente' : `hasta ${t.createdAtYear + max - 1}`;
        return t.status === 'PENDING_START' ? `Empieza en ${t.createdAtYear} · ${until}` : until;
    };
    const active = state.treaties.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING_START');
    const pending = state.treaties.filter(t => t.status === 'PENDING_APPROVAL');

    return (
        <Modal tone="diplomacy" kicker="Diplomacia" title="Tratados internacionales" size="md" onClose={onClose}
            footer={<Button variant="primary" tone="diplomacy" onClick={() => setEditing({})}>Nuevo tratado</Button>}>
            <Section title="Negociaciones en curso">
                {pending.length === 0 ? <Empty>No hay negociaciones en curso.</Empty> : pending.map(t => {
                    const mine = String(t.targetPlayerId) === me;
                    return (
                        <Item key={t.id} title={`Con ${partner(t)?.name ?? 'desconocido'}`}
                            desc={`${t.clauses.length} cláusula${t.clauses.length === 1 ? '' : 's'}`}
                            status={mine ? { label: 'Esperando tu respuesta', kind: 'wait' } : { label: 'Esperando respuesta', kind: 'no' }}
                            actions={<Button size="sm" tone="diplomacy" variant={mine ? 'primary' : 'secondary'} onClick={() => setEditing({ treaty: t })}>{mine ? 'Ver oferta' : 'Ver estado'}</Button>} />
                    );
                })}
            </Section>
            <Section title="Tratados vigentes">
                {active.length === 0 ? <Empty>No hay tratados vigentes.</Empty> : active.map(t => (
                    <Item key={t.id} title={`Con ${partner(t)?.name ?? 'desconocido'}`} desc={term(t)}
                        status={t.status === 'ACTIVE' ? { label: 'Vigente', kind: 'ok' } : { label: 'Pendiente', kind: 'wait' }}
                        actions={<Button size="sm" tone="diplomacy" onClick={() => setEditing({ treaty: t })}>Ver detalles</Button>} />
                ))}
            </Section>
        </Modal>
    );
};
