import React, { useState } from 'react';
import { useGameContext } from '../../../context/GameContext';
import { useGameActions } from '../../../hooks/useGameActions';
import { useMyPlayer } from '../../../hooks/useMyPlayer';
import type { Treaty, TreatyClause, TreatyType } from '../../../types/treatyTypes';
import { availableCards, regionTitle, RAW_MATERIAL_DATA, TECHNOLOGY_DATA, type RawMaterialType, type TechnologyType } from '@atomo/shared';
import { Modal, Section, Button, Option } from '../../../ui/components';

interface TreatyEditorProps {
    onClose: () => void;
    initialTreaty?: Treaty;
    isNew?: boolean;
}

const CLAUSES: { type: TreatyType; label: string; defaultDuration: number }[] = [
    { type: 'REGION_CESSION', label: 'Cesión de territorio', defaultDuration: -1 },
    { type: 'RAW_MATERIAL_CESSION', label: 'Cesión de materia prima', defaultDuration: -1 },
    { type: 'TECH_LOAN', label: 'Préstamo de tecnología', defaultDuration: 5 },
    { type: 'TECH_DUPLICATE', label: 'Duplicado de tecnología', defaultDuration: -1 },
    { type: 'NON_AGGRESSION', label: 'No agresión (desde estos territorios)', defaultDuration: 3 },
];

const DURATIONS = [-1, 1, 2, 3, 4, 5];

/**
 * Editor de tratados: elegir contraparte, armar cláusulas de cada lado y
 * enviar oferta / contraoferta, o aceptar / rechazar. El servidor valida que
 * cada parte comprometa sólo lo que tiene.
 */
export const TreatyEditor: React.FC<TreatyEditorProps> = ({ onClose, initialTreaty, isNew }) => {
    const { state } = useGameContext();
    const { acceptTreaty, rejectTreaty, proposeTreaty } = useGameActions();
    const { myPlayer } = useMyPlayer();
    const meId = myPlayer?.id ?? '';
    const initialTarget = initialTreaty
        ? (String(initialTreaty.creatorId) === String(meId) ? initialTreaty.targetPlayerId : initialTreaty.creatorId)
        : null;
    const [targetId, setTargetId] = useState<string | number | null>(initialTarget);
    const [clauses, setClauses] = useState<TreatyClause[]>(initialTreaty?.clauses ?? []);
    if (!myPlayer) return null;

    const target = state.players.find(p => String(p.id) === String(targetId));
    const editable = !initialTreaty || initialTreaty.status === 'PENDING_APPROVAL';
    const awaitingMe = initialTreaty?.status === 'PENDING_APPROVAL' && String(initialTreaty.targetPlayerId) === String(meId);

    /** Opciones que puede comprometer un jugador para un tipo de cláusula. */
    const optionsFor = (type: TreatyType, ownerId: string | number) => {
        if (type === 'REGION_CESSION' || type === 'NON_AGGRESSION') {
            return Object.keys(state.owners).filter(r => String(state.owners[r]) === String(ownerId)).map(r => ({ value: r, label: regionTitle(r) }));
        }
        const cards = availableCards(state, ownerId);
        const pool = type === 'RAW_MATERIAL_CESSION' ? cards.rawMaterials : cards.technologies;
        return pool.map(c => ({
            value: c.id,
            label: `${(type === 'RAW_MATERIAL_CESSION' ? RAW_MATERIAL_DATA[c.type as RawMaterialType]?.name : TECHNOLOGY_DATA[c.type as TechnologyType]?.name) ?? c.type} · ${regionTitle(c.country)}`,
        }));
    };

    const describe = (c: TreatyClause) => {
        if (c.type === 'NON_AGGRESSION') return (c.data.regionIds ?? []).map(regionTitle).join(', ');
        if (c.type === 'REGION_CESSION') return regionTitle(c.data.regionId);
        return optionsFor(c.type, c.sourcePlayerId).find(o => o.value === c.data.cardId)?.label ?? 'Carta ya no disponible';
    };

    const add = (type: TreatyType, giver: string | number, value: string) => {
        const def = CLAUSES.find(x => x.type === type)!;
        const receiver = String(giver) === String(meId) ? targetId! : meId;
        const data = type === 'NON_AGGRESSION' ? { regionIds: [value] } : type === 'REGION_CESSION' ? { regionId: value } : { cardId: value };
        setClauses(prev => [...prev, { id: `draft-${prev.length}-${value}`, type, duration: def.defaultDuration, sourcePlayerId: giver, targetPlayerId: receiver, data }]);
    };

    const side = (giver: string | number, title: React.ReactNode) => (
        <Section title={title}>
            {CLAUSES.map(def => {
                const mine = clauses.filter(c => c.type === def.type && String(c.sourcePlayerId) === String(giver));
                const used = new Set(mine.map(c => c.data.cardId ?? c.data.regionId ?? c.data.regionIds?.[0]));
                const opts = optionsFor(def.type, giver).filter(o => !used.has(o.value));
                return (
                    <div key={def.type} className="ui-item" style={{ display: 'block' }}>
                        <div className="ui-item__title" style={{ fontSize: '0.85rem' }}>{def.label}</div>
                        {mine.map(c => (
                            <div key={c.id} className="ui-kv">
                                <span>{describe(c)}</span>
                                <span className="ui-row">
                                    <select className="ui-select" style={{ width: 'auto', minHeight: 30 }} disabled={!editable} value={c.duration}
                                        onChange={e => setClauses(prev => prev.map(x => x.id === c.id ? { ...x, duration: Number(e.target.value) } : x))}
                                        aria-label="Duración">
                                        {DURATIONS.map(d => <option key={d} value={d}>{d === -1 ? 'Permanente' : `${d} año${d > 1 ? 's' : ''}`}</option>)}
                                    </select>
                                    {editable && <Button size="sm" variant="ghost" tone="danger" onClick={() => setClauses(prev => prev.filter(x => x.id !== c.id))} aria-label="Quitar cláusula">✕</Button>}
                                </span>
                            </div>
                        ))}
                        {editable && (
                            <select className="ui-select" style={{ marginTop: 6 }} value="" disabled={opts.length === 0}
                                onChange={e => e.target.value && add(def.type, giver, e.target.value)}
                                aria-label={`Agregar ${def.label}`}>
                                <option value="">{opts.length === 0 ? 'Nada disponible' : '+ Agregar…'}</option>
                                {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        )}
                    </div>
                );
            })}
        </Section>
    );

    // Paso 1: elegir contraparte.
    if (!targetId) {
        const rivals = state.players.filter(p => String(p.id) !== String(meId) && !p.isEliminated);
        return (
            <Modal tone="diplomacy" kicker="Nuevo tratado" title="Elegí la contraparte" size="sm" onClose={onClose}>
                <div className="ui-stack">
                    {rivals.map(p => <Option key={p.id} label={<span style={{ color: p.color }}>{p.name}</span>} onSelect={() => setTargetId(p.id)} />)}
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            tone="diplomacy"
            kicker={isNew ? 'Nuevo tratado' : initialTreaty?.status === 'PENDING_APPROVAL' ? (awaitingMe ? 'Oferta recibida' : 'Oferta enviada') : 'Tratado'}
            title={`Con ${target?.name ?? ''}`}
            size="xl"
            onClose={onClose}
            footer={editable ? <>
                {awaitingMe && <Button variant="danger" onClick={() => { rejectTreaty(initialTreaty!); onClose(); }}>Rechazar</Button>}
                <Button tone="diplomacy" disabled={clauses.length === 0} onClick={() => { proposeTreaty(targetId, clauses, isNew ? undefined : initialTreaty?.id); onClose(); }}>
                    {initialTreaty ? 'Enviar contraoferta' : 'Enviar oferta'}
                </Button>
                {awaitingMe && <Button variant="primary" tone="diplomacy" onClick={() => { acceptTreaty(initialTreaty!); onClose(); }}>Aceptar tratado</Button>}
            </> : undefined}
        >
            <div className="ui-split" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {side(meId, <>Yo entrego <span className="ui-muted">({myPlayer.name})</span></>)}
                {side(targetId, <>{target?.name} entrega</>)}
            </div>
            <p className="ui-muted" style={{ fontSize: '0.85rem' }}>Las cláusulas entran en vigor al comenzar el año siguiente a la aceptación.</p>
        </Modal>
    );
};
