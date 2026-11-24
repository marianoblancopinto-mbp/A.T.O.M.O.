import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { regionTitle, hasRoute, TECHNOLOGY_DATA, RAW_MATERIAL_DATA, type TechnologyType, type RawMaterialType, type EspionageReport } from '@atomo/shared';
import { useGameContext } from '../../context/GameContext';
import { useMyPlayer } from '../../hooks/useMyPlayer';
import { useGameActions } from '../../hooks/useGameActions';
import { Modal, Button, Section, Check, Option, Empty } from '../components';
import { getOperationSpec, type OperationRequest, type OperationSpec, type Slot, type Selection } from './specs';

/**
 * Pantalla ÚNICA para toda operación del juego (misiones, nuclear, espionaje).
 * Se arma a partir de la definición de la operación (specs.ts): base,
 * requisitos, cartas/suministros a elegir y datos extra.
 */

interface Candidate { id: string; label: string; meta: string; disabledReason?: string }

function useCandidates(slot: Slot, base: string | null): Candidate[] {
    const { state } = useGameContext();
    const { myPlayer, resources } = useMyPlayer();
    if (!myPlayer) return [];
    const routeIssue = (country: string) =>
        slot.route && base && !hasRoute(state, myPlayer.id, country, base) ? `Sin ruta hasta ${regionTitle(base)}` : undefined;

    if (slot.kind === 'supply') {
        return slot.types.flatMap(t => myPlayer.supplies[t as keyof typeof myPlayer.supplies] ?? []).map(s => ({
            id: s.id,
            label: slot.label.replace('Suministro de ', '').toUpperCase(),
            meta: `Origen: ${regionTitle(s.originCountry)}`,
            disabledReason: routeIssue(s.originCountry),
        }));
    }
    const pool = slot.kind === 'technology' ? resources.technologies : resources.rawMaterials;
    return pool.filter(c => slot.types.includes(c.type)).map(c => ({
        id: c.id,
        label: (slot.kind === 'technology'
            ? TECHNOLOGY_DATA[c.type as TechnologyType]?.name
            : RAW_MATERIAL_DATA[c.type as RawMaterialType]?.name) ?? c.type,
        meta: regionTitle(c.country),
        disabledReason: c.usedThisTurn ? 'Consumida esta ronda' : routeIssue(c.country),
    }));
}

const typeName = (slot: Slot) => slot.kind === 'supply' ? '' : slot.types.map(t =>
    (slot.kind === 'technology' ? TECHNOLOGY_DATA[t as TechnologyType]?.name : RAW_MATERIAL_DATA[t as RawMaterialType]?.name) ?? t).join(' / ');

const SlotPicker: React.FC<{ slot: Slot; base: string | null; value?: string; taken: Set<string>; onChange: (id: string | undefined) => void }> = ({ slot, base, value, taken, onChange }) => {
    const candidates = useCandidates(slot, base);
    const title = slot.kind === 'supply' ? slot.label : `${slot.label}: ${typeName(slot)}`;
    return (
        <Section title={<>{title}{slot.route ? <span className="ui-muted"> · con ruta</span> : null}</>}>
            {candidates.length === 0 ? (
                <Empty>{slot.kind === 'supply' ? 'No tenés este suministro. Se producen en el preturno.' : 'No tenés esta carta en tus territorios.'}</Empty>
            ) : (
                <div className="ui-grid">
                    {candidates.map(c => (
                        <Option
                            key={c.id}
                            label={c.label}
                            meta={c.disabledReason ?? c.meta}
                            selected={value === c.id}
                            disabled={!!c.disabledReason || (taken.has(c.id) && value !== c.id)}
                            onSelect={() => onChange(value === c.id ? undefined : c.id)}
                        />
                    ))}
                </div>
            )}
        </Section>
    );
};

const OperationView: React.FC<{ spec: OperationSpec; onClose: () => void; onSubmitted: () => void }> = ({ spec, onClose, onSubmitted }) => {
    const actions = useGameActions();
    const initialBase = spec.base.mode === 'fixed' ? spec.base.regionId : spec.base.mode === 'choose' && spec.base.choices.length === 1 ? spec.base.choices[0] : null;
    const [base, setBase] = useState<string | null>(initialBase);
    const [slots, setSlots] = useState<Record<string, string>>({});
    const [inputs, setInputs] = useState<Record<string, string>>({});

    const checks = spec.checks(base);
    const taken = new Set(Object.values(slots));
    const ready = checks.every(c => c.ok)
        && (spec.base.mode === 'none' || !!base)
        && spec.slots.every(s => !!slots[s.key])
        && (spec.inputs ?? []).every(i => (inputs[i.key] ?? '').trim().length > 0);

    const chooseBase = (r: string) => { setBase(r); setSlots({}); };
    const submit = () => {
        const sel: Selection = { base, slots, inputs };
        spec.submit(sel, actions);
        onSubmitted();
    };

    return (
        <Modal
            tone={spec.tone}
            kicker={spec.kicker}
            title={spec.title}
            size="lg"
            onClose={onClose}
            footer={<>
                <Button variant="ghost" tone={spec.tone} onClick={onClose}>Cancelar</Button>
                <Button variant="primary" tone={spec.tone} disabled={!ready} onClick={submit}>{spec.confirmLabel}</Button>
            </>}
        >
            <div className="ui-split">
                <div>
                    {spec.base.mode === 'choose' && (
                        <Section title={spec.base.label}>
                            {spec.base.choices.length === 0
                                ? <Empty>No controlás ningún país válido para esta operación.</Empty>
                                : <div className="ui-grid">{spec.base.choices.map(r => (
                                    <Option key={r} label={regionTitle(r)} selected={base === r} onSelect={() => chooseBase(r)} />
                                ))}</div>}
                        </Section>
                    )}
                    {spec.slots.map(s => (
                        <SlotPicker key={s.key} slot={s} base={base} value={slots[s.key]} taken={taken}
                            onChange={id => setSlots(prev => { const n = { ...prev }; if (id) n[s.key] = id; else delete n[s.key]; return n; })} />
                    ))}
                    {(spec.inputs ?? []).map(i => (
                        <Section key={i.key} title={i.label}>
                            {i.kind === 'text' ? (
                                <input className="ui-input" maxLength={40} placeholder={i.placeholder} value={inputs[i.key] ?? ''}
                                    onChange={e => setInputs(prev => ({ ...prev, [i.key]: e.target.value }))} />
                            ) : (
                                <div className="ui-grid">{(i.options ?? []).map(o => (
                                    <Option key={o.value} label={o.label} meta={o.meta} disabled={o.disabled}
                                        selected={inputs[i.key] === o.value} onSelect={() => setInputs(prev => ({ ...prev, [i.key]: o.value }))} />
                                ))}</div>
                            )}
                        </Section>
                    ))}
                    {spec.slots.length === 0 && !spec.inputs?.length && spec.base.mode !== 'choose' && (
                        <p className="ui-muted">Esta operación no consume cartas.</p>
                    )}
                </div>
                <aside>
                    {spec.base.mode === 'fixed' && (
                        <Section title={spec.base.label}><p className="ui-text">{regionTitle(spec.base.regionId)}</p></Section>
                    )}
                    <Section title="Requisitos">
                        {checks.map((c, i) => <Check key={i} ok={c.ok}>{c.label}</Check>)}
                        {spec.slots.map(s => <Check key={s.key} ok={!!slots[s.key]}>{s.kind === 'supply' ? s.label : typeName(s)}</Check>)}
                    </Section>
                    {(spec.lore || spec.effects) && (
                        <Section title="Informe">
                            {spec.lore && <p className="ui-lore">{spec.lore}</p>}
                            {spec.effects?.map(e => (
                                <p key={e.label} className="ui-text" style={{ marginTop: 10 }}><strong style={{ color: 'var(--tone)' }}>{e.label}:</strong> {e.value}</p>
                            ))}
                        </Section>
                    )}
                </aside>
            </div>
        </Modal>
    );
};

/** Resultado de una operación de espionaje (llega del servidor sólo a este jugador). */
const IntelReportView: React.FC<{ report: EspionageReport; onClose: () => void }> = ({ report, onClose }) => (
    <Modal tone="intel" kicker="Informe de inteligencia" title={report.targetPlayerName} size="sm" onClose={onClose}
        footer={<Button variant="primary" tone="intel" onClick={onClose}>Archivar</Button>}>
        {report.type === 'silos' ? (
            <Section title="Silos detectados">
                {(report.data as { location: string; status: string }[]).length === 0
                    ? <Empty>El objetivo no tiene silos.</Empty>
                    : (report.data as { location: string; status: string }[]).map((s, i) => (
                        <p key={i} className="ui-text">{s.location} — <strong>{s.status === 'active' ? 'OPERATIVO' : s.status === 'construction' ? 'EN CONSTRUCCIÓN' : 'EN ENFRIAMIENTO'}</strong></p>
                    ))}
            </Section>
        ) : (
            <Section title="Mineral secreto">
                <p className="ui-text">Yacimiento: <strong>{report.data.location}</strong></p>
                <p className="ui-text">{report.data.isExtracted ? 'Ya fue EXTRAÍDO.' : 'Todavía SIN EXTRAER.'}</p>
            </Section>
        )}
    </Modal>
);

// ------------------------------------------------------------------ contexto

const OperationContext = createContext<(req: OperationRequest) => void>(() => {});

/** Abre una operación desde cualquier componente: `useOpenOperation()({ id: 'construct_silo' })`. */
export const useOpenOperation = () => useContext(OperationContext);

export const OperationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { state } = useGameContext();
    const { myPlayer } = useMyPlayer();
    const [request, setRequest] = useState<OperationRequest | null>(null);
    const [awaitIntelFrom, setAwaitIntelFrom] = useState<number | null>(null);

    const open = useCallback((req: OperationRequest) => setRequest(req), []);
    const spec = useMemo(() => (request && myPlayer ? getOperationSpec({ state, me: myPlayer }, request) : null), [request, state, myPlayer]);
    const report = awaitIntelFrom !== null ? myPlayer?.intelReports?.[awaitIntelFrom] : undefined;

    return (
        <OperationContext.Provider value={open}>
            {children}
            {spec && request && (
                <OperationView
                    key={`${request.id}-${request.regionId ?? ''}-${request.cardId ?? ''}`}
                    spec={spec}
                    onClose={() => setRequest(null)}
                    onSubmitted={() => {
                        if (request.id === 'espionage_execute') setAwaitIntelFrom(myPlayer?.intelReports?.length ?? 0);
                        setRequest(null);
                    }}
                />
            )}
            {report && <IntelReportView report={report} onClose={() => setAwaitIntelFrom(null)} />}
        </OperationContext.Provider>
    );
};
